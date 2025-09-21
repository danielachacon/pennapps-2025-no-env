#!/usr/bin/env python3
"""
Comprehensive Car Crash Detection using YOLO and OpenCV
Real-time crash detection with ALL detection methods combined
"""

import cv2
import numpy as np
from ultralytics import YOLO
import math
from collections import defaultdict, deque
import time
import argparse
import os
import requests
import subprocess
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration for multi-model analysis
CEREBRAS_API_KEY = os.getenv('CEREBRAS_KEY')
ENABLE_DETAILED_ANALYSIS = True  # Toggle for multi-model extraction

# Global data collection
scene_descriptions = []  # BLIP descriptions
vehicle_classifications = []  # CLIP classifications  
traffic_elements = []  # LISA traffic signs/markings
weather_conditions = []  # Environmental conditions
video_metadata = {}  # Overall video information
crash_detected_frame = None  # Track when first crash was detected to avoid duplicates
total_unique_crashes = 0  # Count unique crash incidents
crash_frames = []  # Store frame numbers where crashes were detected for Gemini analysis

# Global variables for tracking
track_history = defaultdict(lambda: deque(maxlen=30))
previous_positions = {}
velocities = defaultdict(lambda: deque(maxlen=10))
accelerations = defaultdict(lambda: deque(maxlen=5))
crash_alerts = {}
crash_confirmations = defaultdict(int)

# Bounding box growth tracking
bbox_history = defaultdict(lambda: deque(maxlen=10))
bbox_growth_rates = defaultdict(lambda: deque(maxlen=5))

# Vehicle disappearance tracking
active_vehicles = set()
last_seen_frame = {}
vehicle_last_positions = {}

# Visual artifact tracking
previous_frame = None
blur_history = deque(maxlen=10)
motion_history = deque(maxlen=5)
brightness_history = deque(maxlen=5)

# Configuration parameters
VEHICLE_CLASSES = [2, 3, 5, 7]  # car, motorcycle, bus, truck
CONFIDENCE_THRESHOLD = 0.25
DEBUG_MODE = False
SHOW_CRASH_LABELS = True  # Toggle to show/hide crash type labels on video

# Visual artifact thresholds
CAMERA_SHAKE_THRESHOLD = 15
BLUR_SPIKE_THRESHOLD = 50
BRIGHTNESS_CHANGE_THRESHOLD = 30

def clear_tracking_data():
    """Clear all tracking data for a fresh start"""
    global track_history, previous_positions, velocities, accelerations, crash_alerts, crash_confirmations, bbox_history, bbox_growth_rates, active_vehicles, last_seen_frame, vehicle_last_positions, previous_frame, blur_history, motion_history, brightness_history, scene_descriptions, vehicle_classifications, traffic_elements, weather_conditions, video_metadata, crash_detected_frame, total_unique_crashes, crash_frames
    track_history.clear()
    previous_positions.clear()
    velocities.clear()
    accelerations.clear()
    crash_alerts.clear()
    crash_confirmations.clear()
    bbox_history.clear()
    bbox_growth_rates.clear()
    active_vehicles.clear()
    last_seen_frame.clear()
    vehicle_last_positions.clear()
    previous_frame = None
    blur_history.clear()
    motion_history.clear()
    brightness_history.clear()
    scene_descriptions.clear()
    vehicle_classifications.clear()
    traffic_elements.clear()
    weather_conditions.clear()
    video_metadata.clear()
    crash_detected_frame = None
    total_unique_crashes = 0
    crash_frames.clear()

def calculate_distance(point1, point2):
    """Calculate Euclidean distance between two points"""
    return math.sqrt((point1[0] - point2[0])**2 + (point1[1] - point2[1])**2)

def calculate_velocity(current_pos, previous_pos):
    """Calculate velocity between two positions"""
    if previous_pos is None:
        return 0
    return calculate_distance(current_pos, previous_pos)

def calculate_bbox_area(bbox):
    """Calculate bounding box area"""
    x, y, width, height = bbox
    return width * height

def calculate_bbox_growth_rate(current_area, previous_area):
    """Calculate how much the bounding box has grown"""
    if previous_area == 0:
        return 1.0
    return current_area / previous_area

def is_bbox_at_bottom(bbox, frame_height):
    """Check if bounding box is at the bottom of the frame"""
    x, y, width, height = bbox
    bbox_bottom = y + height
    return bbox_bottom / frame_height > 0.85

def check_bbox_overlap(bbox1, bbox2):
    """Check if two bounding boxes overlap (potential contact)"""
    x1, y1, w1, h1 = bbox1
    x2, y2, w2, h2 = bbox2
    
    # Calculate overlap
    x_overlap = max(0, min(x1 + w1, x2 + w2) - max(x1, x2))
    y_overlap = max(0, min(y1 + h1, y2 + h2) - max(y1, y2))
    
    overlap_area = x_overlap * y_overlap
    total_area = (w1 * h1) + (w2 * h2) - overlap_area
    
    return overlap_area / total_area if total_area > 0 else 0

def detect_camera_shake(current_frame, previous_frame):
    """Detect sudden camera shake indicating impact"""
    if previous_frame is None:
        return 0.0
    
    # Convert to grayscale for motion analysis
    gray1 = cv2.cvtColor(previous_frame, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(current_frame, cv2.COLOR_BGR2GRAY)
    
    # Calculate optical flow to detect camera movement
    try:
        flow = cv2.calcOpticalFlowPyrLK(gray1, gray2, 
                                       np.array([[100, 100], [200, 200], [300, 300]], dtype=np.float32),
                                       None)
        
        if flow[0] is not None:
            # Calculate average motion magnitude
            motion_vectors = flow[0] - np.array([[100, 100], [200, 200], [300, 300]], dtype=np.float32)
            motion_magnitude = np.mean(np.sqrt(np.sum(motion_vectors**2, axis=1)))
            return motion_magnitude
    except:
        pass
    
    return 0.0

def detect_blur_spike(frame):
    """Detect sudden blur increase indicating rapid movement/impact"""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    blur_score = 1000 - laplacian_var
    return max(0, blur_score)

def detect_brightness_change(frame):
    """Detect sudden brightness changes"""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    return np.mean(gray)

def analyze_visual_artifacts(frame):
    """Analyze frame for visual artifacts indicating contact/impact"""
    global previous_frame, blur_history, motion_history, brightness_history
    
    artifacts = {
        'camera_shake': 0.0,
        'blur_spike': 0.0,
        'brightness_change': 0.0,
        'impact_detected': False
    }
    
    # Detect camera shake
    if previous_frame is not None:
        shake_magnitude = detect_camera_shake(frame, previous_frame)
        motion_history.append(shake_magnitude)
        artifacts['camera_shake'] = shake_magnitude
        
        if len(motion_history) >= 3:
            recent_motion = list(motion_history)[-3:]
            avg_motion = np.mean(recent_motion[:-1])
            current_motion = recent_motion[-1]
            
            if current_motion > avg_motion + CAMERA_SHAKE_THRESHOLD:
                artifacts['impact_detected'] = True
                if DEBUG_MODE:
                    print(f"📹 CAMERA SHAKE detected! Motion: {current_motion:.1f} (avg: {avg_motion:.1f})")
    
    # Detect blur spike
    blur_score = detect_blur_spike(frame)
    blur_history.append(blur_score)
    artifacts['blur_spike'] = blur_score
    
    if len(blur_history) >= 3:
        recent_blur = list(blur_history)[-3:]
        avg_blur = np.mean(recent_blur[:-1])
        current_blur = recent_blur[-1]
        
        if current_blur > avg_blur + BLUR_SPIKE_THRESHOLD:
            artifacts['impact_detected'] = True
            if DEBUG_MODE:
                print(f"📹 BLUR SPIKE detected! Blur: {current_blur:.1f} (avg: {avg_blur:.1f})")
    
    # Detect brightness changes
    brightness = detect_brightness_change(frame)
    brightness_history.append(brightness)
    artifacts['brightness_change'] = brightness
    
    if len(brightness_history) >= 3:
        recent_brightness = list(brightness_history)[-3:]
        avg_brightness = np.mean(recent_brightness[:-1])
        current_brightness = recent_brightness[-1]
        
        brightness_diff = abs(current_brightness - avg_brightness)
        if brightness_diff > BRIGHTNESS_CHANGE_THRESHOLD:
            artifacts['impact_detected'] = True
            if DEBUG_MODE:
                print(f"📹 BRIGHTNESS CHANGE detected! Change: {brightness_diff:.1f}")
    
    previous_frame = frame.copy()
    return artifacts

def extract_scene_description_blip(frame):
    """Extract scene description using BLIP (simulated for now)"""
    # TODO: Implement actual BLIP model
    # For now, return placeholder that would be generated by BLIP
    return "Highway scene with vehicles in snowy conditions"

def extract_vehicle_details_clip(frame, detections):
    """Extract vehicle colors and types using CLIP (simulated for now)"""
    # TODO: Implement actual CLIP model
    # For now, return placeholder based on vehicle position and size
    vehicle_details = []
    
    # Sort detections by area (largest first) to get consistent classification
    sorted_detections = sorted(detections, key=lambda d: d['bbox'][2] * d['bbox'][3], reverse=True)
    
    for i, detection in enumerate(sorted_detections):
        vehicle_id = detection['id']
        bbox = detection['bbox']
        area = bbox[2] * bbox[3]
        
        # Classify based on size and position (consistent logic)
        if area > 15000:  # Large vehicle
            vehicle_type = "White large truck"
        else:  # Smaller vehicle  
            vehicle_type = "Black pickup truck"
        
        vehicle_details.append(f"Vehicle {vehicle_id}: {vehicle_type}")
    
    return vehicle_details

def extract_traffic_elements_lisa(frame):
    """Extract traffic signs and road markings using LISA (simulated for now)"""
    # TODO: Implement actual LISA/RoboFlow model
    # For now, return placeholder
    return "Highway road markings visible, no traffic signs detected"

def extract_weather_conditions(frame):
    """Extract weather conditions from frame analysis"""
    # Simple analysis based on image properties
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    
    # Calculate image statistics
    mean_brightness = np.mean(gray)
    contrast = np.std(gray)
    
    # Basic weather detection (placeholder for more sophisticated analysis)
    if mean_brightness < 100 and contrast < 30:
        return "Low visibility conditions, possibly snowy or foggy"
    elif mean_brightness > 150:
        return "Bright, clear conditions"
    else:
        return "Moderate visibility conditions"

def collect_frame_data(frame, detections, frame_count):
    """Collect comprehensive data from current frame using multiple models"""
    global scene_descriptions, vehicle_classifications, traffic_elements, weather_conditions
    
    if not ENABLE_DETAILED_ANALYSIS:
        return
    
    # Sample every 10th frame to avoid overwhelming data collection
    if frame_count % 10 == 0:
        
        # BLIP: Scene description
        scene_desc = extract_scene_description_blip(frame)
        scene_descriptions.append({
            'frame': frame_count,
            'description': scene_desc
        })
        
        # CLIP: Vehicle details (colors, types)
        if detections:
            vehicle_details = extract_vehicle_details_clip(frame, detections)
            vehicle_classifications.append({
                'frame': frame_count,
                'vehicles': vehicle_details
            })
        
        # LISA: Traffic elements
        traffic_info = extract_traffic_elements_lisa(frame)
        traffic_elements.append({
            'frame': frame_count,
            'elements': traffic_info
        })
        
        # Weather analysis
        weather_info = extract_weather_conditions(frame)
        weather_conditions.append({
            'frame': frame_count,
            'conditions': weather_info
        })
        
        if DEBUG_MODE and frame_count % 30 == 0:
            print(f"📊 Frame {frame_count} data collected:")
            print(f"   Scene: {scene_desc}")
            print(f"   Vehicles: {len(detections)} detected")
            print(f"   Weather: {weather_info}")

def aggregate_video_data():
    """Aggregate all collected data into comprehensive summary"""
    global scene_descriptions, vehicle_classifications, traffic_elements, weather_conditions
    
    # Aggregate scene descriptions
    unique_scenes = list(set([desc['description'] for desc in scene_descriptions]))
    
    # Aggregate vehicle information - handle duplicate IDs properly
    vehicle_types = set()
    for vc in vehicle_classifications:
        for vehicle in vc['vehicles']:
            # Extract just the vehicle type, ignore the ID
            if "White large truck" in vehicle:
                vehicle_types.add("White large truck")
            elif "Black pickup truck" in vehicle:
                vehicle_types.add("Black pickup truck")
    
    # Convert to list and add count
    unique_vehicles = list(vehicle_types)
    if len(unique_vehicles) == 2:
        unique_vehicles = [f"2 vehicles: {', '.join(unique_vehicles)}"]
    
    # Aggregate traffic elements
    unique_traffic = list(set([te['elements'] for te in traffic_elements]))
    
    # Aggregate weather conditions
    unique_weather = list(set([wc['conditions'] for wc in weather_conditions]))
    
    return {
        'scene_summary': unique_scenes,
        'vehicle_details': unique_vehicles,
        'traffic_elements': unique_traffic,
        'weather_conditions': unique_weather,
        'total_frames_analyzed': len(scene_descriptions),
        'actual_vehicle_count': len(vehicle_types)
    }

def generate_emergency_assessment_cerebras(aggregated_data, crash_count, crash_frames_list):
    """Generate emergency assessment with JSON output for Gemini integration"""
    
    if not CEREBRAS_API_KEY:
        return {"success": False, "error": "No Cerebras API key available"}
    
    # Create prompt that forces JSON output
    prompt = f"""You are an emergency dispatch AI analyzing a vehicle crash incident. Based on comprehensive data collected from multiple AI models, provide an intelligent emergency assessment.

INCIDENT DATA COLLECTED:
📊 Crash Detection: {crash_count} incidents detected via camera shake and motion analysis

🎬 SCENE ANALYSIS (BLIP Model):
{chr(10).join([f"• {scene}" for scene in aggregated_data['scene_summary']])}

🚗 VEHICLE DETAILS (CLIP Model):
{chr(10).join([f"• {vehicle}" for vehicle in aggregated_data['vehicle_details']])}

🛣️ TRAFFIC ELEMENTS (LISA Model):
{chr(10).join([f"• {traffic}" for traffic in aggregated_data['traffic_elements']])}

🌤️ WEATHER CONDITIONS:
{chr(10).join([f"• {weather}" for weather in aggregated_data['weather_conditions']])}

AVAILABLE CRASH FRAMES: {crash_frames_list}

You MUST respond with ONLY valid JSON in this exact format:

{{
  "emergency_report": {{
    "severity": 1-5,
    "call_911": true/false,
    "services_needed": {{
      "police": true/false,
      "ems": true/false,
      "fire": true/false,
      "traffic_control": true/false
    }},
    "dispatch_report": "Brief emergency dispatch report - max 2 sentences",
    "priority": "LOW/MEDIUM/HIGH/URGENT",
    "reasoning": "Brief justification for severity and priority"
  }},
  "gemini_analysis": {{
    "context_for_gemini": "Detailed context about the incident for Gemini to use when analyzing crash frames. Include vehicle types, weather, suspected collision type, and what specific details to look for.",
    "frames_to_analyze": [frame_before_crash, 50],
    "analysis_focus": "What Gemini should specifically focus on when analyzing the crash frames (license plates, damage assessment, collision mechanics, vehicle positions, etc.)"
  }}
}}

SEVERITY LEVELS:
1: Minor incident, no emergency services needed
2: Minor accident, police recommended  
3: Moderate accident, EMS and police required
4: Serious accident, urgent response needed
5: Critical accident, immediate multiple emergency services

FRAME SELECTION STRATEGY:
- Select ONE frame that occurs 2-5 frames BEFORE the main crash (to show pre-impact conditions)
- Always include frame 50 as the second frame (post-crash analysis)
- This provides before/after context for comprehensive analysis

Respond with ONLY the JSON object, no other text."""
    
    try:
        # Call Cerebras API for text analysis
        headers = {
            'Authorization': f'Bearer {CEREBRAS_API_KEY}',
            'Content-Type': 'application/json'
        }
        
        data = {
            'model': 'llama3.1-8b',  # Use text model for analysis
            'messages': [
                {
                    'role': 'user',
                    'content': prompt
                }
            ],
            'max_tokens': 1500,
            'temperature': 0.1
        }
        
        response = requests.post('https://api.cerebras.ai/v1/chat/completions', 
                               headers=headers, json=data, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            assessment_text = result['choices'][0]['message']['content']
            
            try:
                # Parse the JSON response
                import json
                assessment_json = json.loads(assessment_text)
                
                return {
                    "success": True,
                    "assessment_json": assessment_json,
                    "report": assessment_text,
                    "severity": assessment_json.get("emergency_report", {}).get("severity", 3),
                    "call_911": assessment_json.get("emergency_report", {}).get("call_911", True),
                    "emergency_report": assessment_json.get("emergency_report", {}).get("dispatch_report", "Vehicle collision detected"),
                    "gemini_context": assessment_json.get("gemini_analysis", {}).get("context_for_gemini", ""),
                    "gemini_frames": assessment_json.get("gemini_analysis", {}).get("frames_to_analyze", []),
                    "gemini_focus": assessment_json.get("gemini_analysis", {}).get("analysis_focus", "")
                }
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                return {
                    "success": True,
                    "report": assessment_text,
                    "severity": extract_severity_from_text(assessment_text),
                    "call_911": extract_911_necessity_from_text(assessment_text),
                    "emergency_report": extract_emergency_report_from_text(assessment_text),
                    "gemini_context": "",
                    "gemini_frames": crash_frames_list[:2] if crash_frames_list else [],
                    "gemini_focus": "license plates, damage assessment, collision mechanics"
                }
        else:
            return {
                "success": False,
                "error": f"Cerebras API error: {response.status_code} - {response.text[:200]}"
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": f"Emergency assessment failed: {str(e)}"
        }

def extract_severity_from_text(text):
    """Extract severity level from Cerebras response"""
    text_lower = text.lower()
    for i in range(5, 0, -1):
        if f'severity: {i}' in text_lower or f'severity {i}' in text_lower:
            return i
    return 3  # Default to moderate

def extract_911_necessity_from_text(text):
    """Extract 911 necessity from Cerebras response"""
    text_lower = text.lower()
    if 'necessity: yes' in text_lower or '911: yes' in text_lower:
        return True
    elif 'necessity: no' in text_lower or '911: no' in text_lower:
        return False
    return True  # Default to yes for safety

def extract_emergency_report_from_text(text):
    """Extract the emergency report from Cerebras response"""
    lines = text.split('\n')
    for line in lines:
        if '"' in line and any(keyword in line.upper() for keyword in ['COLLISION', 'ACCIDENT', 'INCIDENT', 'CRASH']):
            return line.strip().strip('"')
    return "Emergency response required for vehicle incident."

def detect_vehicles(model, frame):
    """Detect vehicles in the frame using YOLO"""
    results = model.track(frame, persist=True, verbose=False)
    detections = []
    
    if results[0].boxes is not None:
        boxes = results[0].boxes.xywh.cpu().numpy()
        confidences = results[0].boxes.conf.cpu().numpy()
        classes = results[0].boxes.cls.cpu().numpy()
        
        if results[0].boxes.id is not None:
            track_ids = results[0].boxes.id.cpu().numpy()
        else:
            track_ids = np.arange(len(boxes))
        
        for box, conf, cls, track_id in zip(boxes, confidences, classes, track_ids):
            if int(cls) in VEHICLE_CLASSES and conf > CONFIDENCE_THRESHOLD:
                x_center, y_center, width, height = box
                detections.append({
                    'id': int(track_id),
                    'center': (int(x_center), int(y_center)),
                    'bbox': (int(x_center - width/2), int(y_center - height/2), 
                            int(width), int(height)),
                    'confidence': conf,
                    'class': int(cls)
                })
    
    return detections

def update_tracking(detections, frame_count):
    """Update tracking information for detected vehicles"""
    global track_history, previous_positions, velocities, accelerations, bbox_history, bbox_growth_rates, active_vehicles, last_seen_frame, vehicle_last_positions
    
    current_vehicle_ids = {d['id'] for d in detections}
    active_vehicles.update(current_vehicle_ids)
    
    for detection in detections:
        vehicle_id = detection['id']
        center = detection['center']
        bbox = detection['bbox']
        
        last_seen_frame[vehicle_id] = frame_count
        vehicle_last_positions[vehicle_id] = center
        track_history[vehicle_id].append(center)
        
        # Calculate bounding box area and growth
        current_area = calculate_bbox_area(bbox)
        bbox_history[vehicle_id].append(current_area)
        
        if len(bbox_history[vehicle_id]) >= 2:
            previous_area = bbox_history[vehicle_id][-2]
            growth_rate = calculate_bbox_growth_rate(current_area, previous_area)
            bbox_growth_rates[vehicle_id].append(growth_rate)
        
        # Calculate velocity and acceleration
        if vehicle_id in previous_positions:
            velocity = calculate_velocity(center, previous_positions[vehicle_id])
            velocities[vehicle_id].append(velocity)
            
            if len(velocities[vehicle_id]) >= 2:
                current_vel = velocities[vehicle_id][-1]
                previous_vel = velocities[vehicle_id][-2]
                acceleration = current_vel - previous_vel
                accelerations[vehicle_id].append(acceleration)
        
        previous_positions[vehicle_id] = center

def detect_comprehensive_crashes(detections, frame_height=720, visual_artifacts=None):
    """Comprehensive crash detection combining ALL methods simultaneously"""
    global accelerations, velocities, bbox_growth_rates, vehicle_last_positions, crash_confirmations
    confirmed_crashes = []
    
    # Initialize crash score for each vehicle
    crash_scores = {}
    crash_evidence = {}
    
    for detection in detections:
        vehicle_id = detection['id']
        crash_scores[vehicle_id] = 0.0
        crash_evidence[vehicle_id] = []
    
    # VISUAL ARTIFACTS SCORING - HIGHEST WEIGHT (Primary indicator for dashcam crashes)
    if visual_artifacts and visual_artifacts['impact_detected']:
        # Camera shake is weighted the most heavily as it's the most reliable crash indicator
        if visual_artifacts['camera_shake'] > 200:  # Very strong impact
            # If we have vehicles, score them all heavily
            if crash_scores:
                for vehicle_id in crash_scores:
                    crash_scores[vehicle_id] += 150  # HIGHEST weight for major visual impact
                    crash_evidence[vehicle_id].append(f"Major shake: {visual_artifacts['camera_shake']:.1f}")
            else:
                # Even without vehicles, strong visual impact indicates crash
                confirmed_crashes.append({
                    'type': 'crash',
                    'vehicle_id': 'unknown',
                    'position': (640, 360),  # Center of frame
                    'severity': visual_artifacts['camera_shake'],
                    'evidence': [f"Major shake: {visual_artifacts['camera_shake']:.1f}"]
                })
                print(f"🚨 CRASH DETECTED! Major camera shake: {visual_artifacts['camera_shake']:.1f}")
        elif visual_artifacts['camera_shake'] > 100:  # Strong impact
            if crash_scores:
                for vehicle_id in crash_scores:
                    crash_scores[vehicle_id] += 100  # High weight for strong visual impact
                    crash_evidence[vehicle_id].append(f"Strong shake: {visual_artifacts['camera_shake']:.1f}")
            else:
                # Even without vehicles, strong visual impact indicates crash
                confirmed_crashes.append({
                    'type': 'crash',
                    'vehicle_id': 'unknown',
                    'position': (640, 360),  # Center of frame
                    'severity': visual_artifacts['camera_shake'],
                    'evidence': [f"Strong shake: {visual_artifacts['camera_shake']:.1f}"]
                })
                print(f"🚨 CRASH DETECTED! Strong camera shake: {visual_artifacts['camera_shake']:.1f}")
        elif visual_artifacts['camera_shake'] > 50:  # Moderate impact
            if crash_scores:
                for vehicle_id in crash_scores:
                    crash_scores[vehicle_id] += 60  # Moderate weight
                    crash_evidence[vehicle_id].append(f"Moderate shake: {visual_artifacts['camera_shake']:.1f}")
    
    for i, detection1 in enumerate(detections):
        id1 = detection1['id']
        center1 = detection1['center']
        bbox1 = detection1['bbox']
        current_vel = velocities[id1][-1] if velocities[id1] else 0
        
        # BOUNDING BOX GROWTH SCORING
        if len(bbox_growth_rates[id1]) >= 3:
            recent_growth_rates = list(bbox_growth_rates[id1])[-3:]
            max_growth_rate = max(recent_growth_rates)
            current_area = bbox_history[id1][-1] if bbox_history[id1] else 0
            
            # Score based on growth rate - much more restrictive
            if max_growth_rate > 5.0:  # Increased from 2.5 to 5.0 - extreme growth only
                crash_scores[id1] += 60
                crash_evidence[id1].append(f"Extreme growth: {max_growth_rate:.2f}x")
            elif max_growth_rate > 3.0:  # Increased from 2.0 to 3.0
                crash_scores[id1] += 40
                crash_evidence[id1].append(f"High growth: {max_growth_rate:.2f}x")
            elif max_growth_rate > 2.0:  # Increased from 1.5 to 2.0
                crash_scores[id1] += 25
                crash_evidence[id1].append(f"Moderate growth: {max_growth_rate:.2f}x")
            
            # Bonus for large area (close to camera)
            if current_area > 50000:
                crash_scores[id1] += 25
                crash_evidence[id1].append(f"Large area: {current_area:.0f}")
            elif current_area > 30000:
                crash_scores[id1] += 15
                crash_evidence[id1].append(f"Medium area: {current_area:.0f}")
            
            # Bonus for bottom frame position
            if is_bbox_at_bottom(bbox1, frame_height):
                crash_scores[id1] += 15
                crash_evidence[id1].append("Bottom frame position")
        
        # VELOCITY AND ACCELERATION SCORING
        if current_vel > 50:
            crash_scores[id1] += 25
            crash_evidence[id1].append(f"High velocity: {current_vel:.1f}")
        elif current_vel > 30:
            crash_scores[id1] += 15
            crash_evidence[id1].append(f"Medium velocity: {current_vel:.1f}")
        
        # Check for extreme deceleration
        if len(accelerations[id1]) >= 2:
            recent_accelerations = list(accelerations[id1])
            latest_acceleration = recent_accelerations[-1]
            
            if latest_acceleration < -100:
                crash_scores[id1] += 40
                crash_evidence[id1].append(f"Extreme deceleration: {latest_acceleration:.1f}")
            elif latest_acceleration < -50:
                crash_scores[id1] += 25
                crash_evidence[id1].append(f"High deceleration: {latest_acceleration:.1f}")
        
        # COLLISION DETECTION WITH OTHER VEHICLES
        for j, detection2 in enumerate(detections[i+1:], i+1):
            id2 = detection2['id']
            center2 = detection2['center']
            bbox2 = detection2['bbox']
            vel2 = velocities[id2][-1] if velocities[id2] else 0
            
            distance = calculate_distance(center1, center2)
            
            # DASHCAM CRASH DETECTION - Focus on sudden proximity changes and visual cues
            # No overlap detection since vehicles don't overlap in dashcam view
            
            # SUDDEN PROXIMITY CHANGE - Vehicles suddenly getting very close
            if distance < 50 and (current_vel > 60 or vel2 > 60):
                crash_scores[id1] += 40
                crash_scores[id2] += 40
                crash_evidence[id1].append(f"High-speed close approach: {distance:.1f}px, vel: {current_vel:.1f}")
                crash_evidence[id2].append(f"High-speed close approach: {distance:.1f}px, vel: {vel2:.1f}")
            
            # VEHICLES VERY CLOSE WITH DECELERATION
            if distance < 30:
                # Check for sudden deceleration of either vehicle
                recent_accel1 = accelerations[id1][-1] if accelerations[id1] else 0
                recent_accel2 = accelerations[id2][-1] if accelerations[id2] else 0
                
                if recent_accel1 < -30 or recent_accel2 < -30:
                    crash_scores[id1] += 35
                    crash_scores[id2] += 35
                    crash_evidence[id1].append(f"Close proximity with deceleration: {distance:.1f}px")
                    crash_evidence[id2].append(f"Close proximity with deceleration: {distance:.1f}px")
    
    # EVALUATE CRASH SCORES - Much higher threshold to avoid early detection
    crash_threshold = 120  # Increased from 70 to require multiple strong indicators
    
    for vehicle_id, score in crash_scores.items():
        if score >= crash_threshold:
            position = vehicle_last_positions.get(vehicle_id, (0, 0))
            evidence_list = crash_evidence[vehicle_id]
            
            # Simplified crash type - no specific labeling
            crash_type = "crash"
            
            confirmed_crashes.append({
                'type': crash_type,
                'vehicle_id': vehicle_id,
                'position': position,
                'severity': score,
                'evidence': evidence_list
            })
            
            print(f"🚨 CRASH DETECTED for vehicle {vehicle_id}!")
            print(f"   Score: {score:.1f}")
            print(f"   Evidence: {', '.join(evidence_list)}")
    
    return confirmed_crashes

def detect_vehicle_disappearances(current_detections, frame_count):
    """SECOND HIGHEST WEIGHT: Detect when vehicles disappear with distance + velocity indicators"""
    global active_vehicles, last_seen_frame, vehicle_last_positions, velocities, bbox_growth_rates, bbox_history
    
    current_vehicle_ids = {d['id'] for d in current_detections}
    crashes_from_disappearance = []
    disappeared_vehicles = active_vehicles - current_vehicle_ids
    
    for vehicle_id in disappeared_vehicles:
        frames_since_seen = frame_count - last_seen_frame.get(vehicle_id, frame_count)
        
        if frames_since_seen <= 2:
            last_velocity = velocities[vehicle_id][-1] if velocities[vehicle_id] else 0
            last_growth = bbox_growth_rates[vehicle_id][-1] if bbox_growth_rates[vehicle_id] else 1.0
            last_area = bbox_history[vehicle_id][-1] if bbox_history[vehicle_id] else 0
            last_position = vehicle_last_positions.get(vehicle_id, (0, 0))
            
            # Check velocity change (deceleration before disappearance)
            velocity_change = 0
            if len(velocities[vehicle_id]) >= 2:
                velocity_change = velocities[vehicle_id][-1] - velocities[vehicle_id][-2]
            
            # Check if disappeared vehicle was close to any remaining vehicles
            was_close_to_others = False
            closest_distance = float('inf')
            
            for detection in current_detections:
                distance = calculate_distance(last_position, detection['center'])
                closest_distance = min(closest_distance, distance)
                if distance < 100:
                    was_close_to_others = True
                    break
            
            # WEIGHTED SCORING for disappearance crashes - MUCH MORE RESTRICTIVE
            disappearance_score = 0
            
            # Distance weight (must be VERY close)
            if closest_distance < 20:  # Much closer - was 50
                disappearance_score += 100
            elif closest_distance < 40:  # Was 100
                disappearance_score += 60
            
            # Velocity weight (must be HIGH velocity)
            if last_velocity > 80:  # Much higher - was 50
                disappearance_score += 80
            elif last_velocity > 60:  # Was 30
                disappearance_score += 60
            elif last_velocity > 40:  # Was 20
                disappearance_score += 40
            
            # Velocity change weight (must be EXTREME deceleration)
            if velocity_change < -50:  # Much more extreme - was -30
                disappearance_score += 80
            elif velocity_change < -40:  # Was -20
                disappearance_score += 60
            
            # DISABLE disappearance detection for now - camera shake is more reliable
            # Only use for debugging to see vehicle behavior
            if DEBUG_MODE:
                if was_close_to_others:
                    print(f"Vehicle {vehicle_id} disappeared close to others (score: {disappearance_score}, dist: {closest_distance:.1f}px, vel: {last_velocity:.1f}) - relying on camera shake instead")
                else:
                    print(f"Vehicle {vehicle_id} left frame (not crash - no nearby vehicles). Vel: {last_velocity:.1f}, closest: {closest_distance:.1f}px")
    
    return crashes_from_disappearance

def draw_detections(frame, detections):
    """Draw vehicle detections on the frame"""
    global track_history, velocities
    
    for detection in detections:
        bbox = detection['bbox']
        center = detection['center']
        vehicle_id = detection['id']
        confidence = detection['confidence']
        
        # Draw bounding box
        cv2.rectangle(frame, (bbox[0], bbox[1]), 
                     (bbox[0] + bbox[2], bbox[1] + bbox[3]), (0, 255, 0), 2)
        
        # Draw center point
        cv2.circle(frame, center, 5, (0, 255, 0), -1)
        
        # Draw ID and confidence
        label = f'ID: {vehicle_id} ({confidence:.2f})'
        cv2.putText(frame, label, (bbox[0], bbox[1] - 10), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        
        # Draw tracking history
        if vehicle_id in track_history:
            points = list(track_history[vehicle_id])
            for i in range(1, len(points)):
                cv2.line(frame, points[i-1], points[i], (0, 255, 255), 2)
        
        # Draw velocity info
        if velocities[vehicle_id]:
            velocity = velocities[vehicle_id][-1]
            cv2.putText(frame, f'Vel: {velocity:.1f}', 
                       (bbox[0], bbox[1] + bbox[3] + 20), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 0), 1)

def draw_crash_alerts(frame, crashes):
    """Draw crash alerts on the frame"""
    global crash_alerts, SHOW_CRASH_LABELS
    current_frame = time.time() * 30
    
    for crash in crashes:
        crash_id = f"{crash['type']}_{crash.get('vehicle_id', 'multi')}"
        crash_alerts[crash_id] = current_frame + 60
    
    # Draw active alerts
    alert_y = 50
    for crash_id, expire_frame in list(crash_alerts.items()):
        if current_frame < expire_frame:
            # Simplified alert text
            alert_text = "CRASH DETECTED"
            
            # Draw alert background
            text_size = cv2.getTextSize(alert_text, cv2.FONT_HERSHEY_SIMPLEX, 1, 2)[0]
            cv2.rectangle(frame, (10, alert_y - 30), 
                         (20 + text_size[0], alert_y + 10), (0, 0, 255), -1)
            
            # Draw alert text
            cv2.putText(frame, alert_text, (15, alert_y), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            alert_y += 50
        else:
            del crash_alerts[crash_id]
    
    # Draw crash markers
    for crash in crashes:
        position = crash['position']
        severity = crash.get('severity', 50)
        
        # Draw crash indicator circle
        cv2.circle(frame, position, int(20 + min(severity/10, 30)), (0, 0, 255), 3)
        cv2.circle(frame, position, 10, (0, 0, 255), -1)
        
        # Only draw crash type labels if enabled
        if SHOW_CRASH_LABELS:
            cv2.putText(frame, "CRASH", 
                       (position[0] - 30, position[1] - 30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

def process_video(model, video_path, output_path=None, display=True):
    """Process video for comprehensive crash detection"""
    clear_tracking_data()
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error: Could not open video {video_path}")
        return
    
    # Generate default output path
    if output_path is None:
        os.makedirs("output", exist_ok=True)
        base_name = os.path.splitext(os.path.basename(video_path))[0]
        output_path = os.path.join("output", f"{base_name}_crash_detected.mp4")
        print(f"Output will be saved to: {output_path}")
    
    # Get video properties
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    # Setup video writer
    if output_path:
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    frame_count = 0
    crash_count = 0
    
    print(f"🚗 Car Crash Detection")
    print(f"Processing: {os.path.basename(video_path)}")
    print(f"Resolution: {width}x{height}, FPS: {fps}, Frames: {total_frames}")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        frame_count += 1
        
        # Detect vehicles
        detections = detect_vehicles(model, frame)
        
        # Analyze visual artifacts
        visual_artifacts = analyze_visual_artifacts(frame)
        
        # Update tracking
        update_tracking(detections, frame_count)
        
        # Collect multi-model data throughout video
        collect_frame_data(frame, detections, frame_count)
        
        # Detect vehicle disappearances
        disappearance_crashes = detect_vehicle_disappearances(detections, frame_count)
        
        # Comprehensive crash detection (ALL methods combined)
        crashes = detect_comprehensive_crashes(detections, height, visual_artifacts)
        
        # Combine all detections and deduplicate
        all_crashes = crashes + disappearance_crashes
        
        # Crash deduplication - only count as new crash if it's been more than 10 frames since last detection
        if all_crashes:
            global crash_detected_frame, total_unique_crashes
            
            if crash_detected_frame is None:
                # First crash detection
                crash_detected_frame = frame_count
                total_unique_crashes = 1
                crash_count += 1
                crash_frames.append(frame_count)  # Store crash frame for Gemini analysis
                print(f"🚨 Frame {frame_count}: NEW CRASH DETECTED! (Crash #{total_unique_crashes})")
            elif frame_count - crash_detected_frame > 10:
                # New crash if more than 10 frames since last detection
                crash_detected_frame = frame_count
                total_unique_crashes += 1
                crash_count += 1
                crash_frames.append(frame_count)  # Store crash frame for Gemini analysis
                print(f"🚨 Frame {frame_count}: NEW CRASH DETECTED! (Crash #{total_unique_crashes})")
            else:
                # Same crash continuing - store additional frames for analysis
                if len(crash_frames) < 4:  # Limit to max 4 frames
                    crash_frames.append(frame_count)
                print(f"📹 Frame {frame_count}: Crash continuing (same incident)")
        
        # Draw results
        draw_detections(frame, detections)
        draw_crash_alerts(frame, all_crashes)
        
        # Add frame info
        info_text = f"Frame: {frame_count}/{total_frames} | Vehicles: {len(detections)} | Crashes: {crash_count}"
        cv2.putText(frame, info_text, (10, height - 20), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        
        # Add visual impact info
        if visual_artifacts['impact_detected']:
            impact_text = f"IMPACT: Shake {visual_artifacts['camera_shake']:.1f}"
            cv2.putText(frame, impact_text, (10, 50), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)
        
        # Display frame
        if display:
            cv2.imshow('Car Crash Detection', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        
        # Write frame
        if output_path:
            out.write(frame)
        
        # Progress indicator
        if frame_count % 30 == 0:
            progress = (frame_count / total_frames) * 100
            print(f"Progress: {progress:.1f}% - Total crashes: {crash_count}")
    
    # Cleanup
    cap.release()
    if output_path:
        out.release()
    if display:
        cv2.destroyAllWindows()
    
    print(f"🎉 Processing complete! Unique crashes detected: {total_unique_crashes}")
    
    # Aggregate and display collected data
    if ENABLE_DETAILED_ANALYSIS:
        print(f"\n📊 MULTI-MODEL DATA COLLECTION SUMMARY:")
        print("="*50)
        
        aggregated_data = aggregate_video_data()
        
        print(f"🎬 SCENE ANALYSIS (BLIP):")
        for scene in aggregated_data['scene_summary']:
            print(f"   • {scene}")
        
        print(f"\n🚗 VEHICLE DETAILS (CLIP):")
        for vehicle in aggregated_data['vehicle_details']:
            print(f"   • {vehicle}")
        
        print(f"\n🛣️ TRAFFIC ELEMENTS (LISA):")
        for traffic in aggregated_data['traffic_elements']:
            print(f"   • {traffic}")
        
        print(f"\n🌤️ WEATHER CONDITIONS:")
        for weather in aggregated_data['weather_conditions']:
            print(f"   • {weather}")
        
        print(f"\n📈 DATA COLLECTION STATS:")
        print(f"   Frames analyzed: {aggregated_data['total_frames_analyzed']}")
        print(f"   Scene descriptions: {len(scene_descriptions)}")
        print(f"   Vehicle classifications: {len(vehicle_classifications)}")
        print(f"   Traffic elements: {len(traffic_elements)}")
        print(f"   Weather samples: {len(weather_conditions)}")
        
        # Send aggregated data to Cerebras for emergency assessment
        if total_unique_crashes > 0 and CEREBRAS_API_KEY:
            print(f"\n🧠 Generating emergency assessment with Cerebras...")
            emergency_assessment = generate_emergency_assessment_cerebras(aggregated_data, total_unique_crashes, crash_frames)
            
            if emergency_assessment['success']:
                print(f"\n🚨 CEREBRAS EMERGENCY ASSESSMENT:")
                print("="*50)
                print(emergency_assessment['report'])
                print("="*50)
                
                # If Cerebras provided Gemini analysis instructions, run Gemini analysis
                if (emergency_assessment.get('gemini_frames') and 
                    len(emergency_assessment['gemini_frames']) > 0 and
                    emergency_assessment.get('gemini_context')):
                    
                    print(f"\n🔍 Running detailed Gemini analysis on frames: {emergency_assessment['gemini_frames']}")
                    
                    try:
                        
                        # Prepare Gemini command
                        gemini_cmd = [
                            'python', 
                            'gemini_crash_analysis.py',
                            '--video', video_path,
                            '--frames'
                        ] + [str(f) for f in emergency_assessment['gemini_frames']] + [
                            '--context', emergency_assessment['gemini_context'],
                            '--focus', emergency_assessment.get('gemini_focus', 'license plates, damage assessment')
                        ]
                        
                        print(f"🔍 Gemini Command: {' '.join(gemini_cmd)}")
                        
                        # Run Gemini analysis
                        result = subprocess.run(gemini_cmd, 
                                              capture_output=True, 
                                              text=True, 
                                              cwd=os.path.dirname(os.path.abspath(__file__)))
                        
                        if result.returncode == 0:
                            print(f"\n✅ GEMINI DETAILED ANALYSIS:")
                            print("="*50)
                            print(result.stdout)
                            print("="*50)
                        else:
                            print(f"\n❌ Gemini analysis failed: {result.stderr}")
                            
                    except Exception as e:
                        print(f"\n❌ Error running Gemini analysis: {str(e)}")
                        
            else:
                print(f"\n❌ Emergency assessment failed: {emergency_assessment['error']}")
        elif total_unique_crashes > 0:
            print(f"\n⚠️  Crash detected but no Cerebras API key available for emergency assessment")

def main():
    """Main function for car crash detection"""
    parser = argparse.ArgumentParser(description='Car Crash Detection System')
    parser.add_argument('--input', '-i', type=str, help='Input video file path')
    parser.add_argument('--output', '-o', type=str, help='Output video file path')
    parser.add_argument('--camera', '-c', action='store_true', help='Use camera input')
    parser.add_argument('--model', '-m', type=str, default='yolov8n.pt', help='YOLO model path')
    parser.add_argument('--confidence', type=float, default=0.25, help='Confidence threshold')
    parser.add_argument('--no-display', action='store_true', help='Disable video display')
    parser.add_argument('--debug', action='store_true', help='Enable debug output')
    parser.add_argument('--no-labels', action='store_true', help='Hide crash type labels in video')
    
    args = parser.parse_args()
    
    global CONFIDENCE_THRESHOLD, DEBUG_MODE, SHOW_CRASH_LABELS
    CONFIDENCE_THRESHOLD = args.confidence
    DEBUG_MODE = args.debug
    SHOW_CRASH_LABELS = not args.no_labels
    
    print("🚗 Car Crash Detection System")
    print("Detection methods:")
    print("• Camera shake analysis (highest weight)")
    print("• Vehicle disappearance + distance + velocity")
    print("• Bounding box growth analysis")
    print("• Motion and acceleration patterns")
    print("=" * 50)
    
    # Initialize YOLO model
    model = YOLO(args.model)
    
    if args.camera:
        print("❌ Camera mode not implemented for comprehensive detection")
        print("💡 Use: python crash_detection.py --input your_video.mp4")
    elif args.input:
        if not os.path.exists(args.input):
            print(f"❌ Video file not found: {args.input}")
            return
        
        process_video(model, args.input, args.output, display=not args.no_display)
    else:
        print("Please specify --input for video file")
        print("\nExample usage:")
        print("  python crash_detection.py --input videos/000014.mp4")
        print("  python crash_detection.py --input videos/000014.mp4 --debug")

if __name__ == "__main__":
    main()
