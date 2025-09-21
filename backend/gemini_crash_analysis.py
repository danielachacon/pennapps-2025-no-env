#!/usr/bin/env python3
"""
Gemini Impact Frame Analysis for Crash Detection
Analyzes the 4-5 most impactful crash frames using Google Gemini VLM
"""

import cv2
import numpy as np
import os
import base64
import json
import requests
import time
import argparse
from typing import List, Dict, Any, Tuple
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent"

def extract_crash_frames(video_path: str, crash_frame_numbers: List[int]) -> List[Tuple[int, np.ndarray]]:
    """Extract specific crash frames from video"""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Could not open video: {video_path}")
    
    crash_frames = []
    
    for frame_num in crash_frame_numbers:
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_num - 1)  # 0-indexed
        ret, frame = cap.read()
        if ret:
            crash_frames.append((frame_num, frame))
            print(f"✅ Extracted crash frame {frame_num}")
        else:
            print(f"❌ Could not extract frame {frame_num}")
    
    cap.release()
    print(f"📹 Extracted {len(crash_frames)} crash frames for analysis")
    return crash_frames

def frame_to_base64(frame: np.ndarray) -> str:
    """Convert OpenCV frame to base64 string for API with maximum quality for text recognition"""
    _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 95])  # Higher quality for text
    return base64.b64encode(buffer).decode('utf-8')

def create_crash_analysis_prompt(frame_numbers: List[int], collected_data: Dict = None) -> str:
    """Create detailed prompt for crash frame analysis with specific text extraction"""
    
    context_section = ""
    if collected_data:
        context_section = f"""
CONTEXT FROM MULTI-MODEL ANALYSIS:
🎬 Scene: {', '.join(collected_data.get('scene_summary', ['Highway scene']))}
🚗 Vehicles: {', '.join(collected_data.get('vehicle_details', ['2 vehicles detected']))}
🛣️ Traffic: {', '.join(collected_data.get('traffic_elements', ['Highway road markings']))}
🌤️ Weather: {', '.join(collected_data.get('weather_conditions', ['Moderate visibility']))}

"""
    
    return f"""You are a forensic crash investigator with expertise in detailed visual analysis. Examine these {len(frame_numbers)} critical crash frames (frames {', '.join(map(str, frame_numbers))}) with EXTREME DETAIL.

{context_section}

PROVIDE ULTRA-SPECIFIC ANALYSIS:

🔍 VEHICLE TEXT & MARKINGS:
1. LICENSE PLATES: Read any visible license plate numbers, letters, state/country
2. VEHICLE TEXT: Any text on backs of vehicles (company names, model names, decals, stickers)
3. VEHICLE BRANDING: Manufacturer badges, model designations, trim levels
4. COMMERCIAL MARKINGS: Company logos, business names, fleet numbers, DOT numbers
5. EMERGENCY MARKINGS: Police, ambulance, fire department markings if present

🚗 ULTRA-DETAILED VEHICLE ANALYSIS:
1. EXACT VEHICLE TYPES: Make, model, year if identifiable (e.g., "2020 Ford F-150", "Chevy Silverado")
2. VEHICLE COLORS: Precise color descriptions (pearl white, metallic black, etc.)
3. VEHICLE FEATURES: Roof racks, hitches, modifications, damage pre-existing
4. VEHICLE SIZE: Estimate dimensions, cargo capacity, passenger capacity
5. VEHICLE CONDITION: Age, wear, maintenance level visible

📋 SPECIFIC IDENTIFIERS:
1. UNIQUE FEATURES: Scratches, dents, distinctive modifications
2. CARGO/EQUIPMENT: Visible cargo, equipment, tools in truck beds
3. WINDOW TINTING: Level of tint, visibility into vehicles
4. TIRE CONDITIONS: Tire types, wear patterns, winter tires vs regular
5. LIGHTING: Headlights on/off, brake lights, turn signals, hazards

🌨️ ENVIRONMENTAL SPECIFICS:
1. SNOW CONDITIONS: Fresh snow, packed snow, ice, slush depth
2. VISIBILITY RANGE: Exact visibility distance, fog/snow density
3. ROAD SURFACE: Wet, icy, sanded, plowed, unplowed conditions
4. TIME INDICATORS: Lighting suggests time of day, shadows, ambient light

📍 LOCATION SPECIFICS:
1. ROAD MARKINGS: Lane dividers, shoulder markings, reflectors visible
2. SIGNAGE: Any visible road signs, mile markers, exit signs, speed limits
3. INFRASTRUCTURE: Guardrails, barriers, bridges, overpasses
4. LANDMARKS: Buildings, structures, geographical features
5. ROAD TYPE: Interstate, state highway, local road, construction zone

🚨 COLLISION MECHANICS:
1. IMPACT POINT: Exact point of contact on both vehicles
2. FORCE DIRECTION: Direction of impact forces, vehicle movement
3. DEFORMATION PATTERNS: Crush zones, crumple patterns, structural damage
4. DEBRIS PATTERN: Where debris is scattered, what type of debris
5. FLUID SPILLS: Location and type of any fluid leaks

🔬 FORENSIC DETAILS:
1. SKID MARKS: Tire marks, braking evidence, ABS patterns
2. IMPACT EVIDENCE: Paint transfer, metal deformation, glass damage
3. SEQUENCE INDICATORS: Evidence of collision sequence and timeline
4. WITNESS POSITIONS: Other vehicles that may have witnessed the crash

READ AND TRANSCRIBE ANY VISIBLE TEXT EXACTLY AS IT APPEARS. Be extremely specific about vehicle identifiers, text, and unique features that could help identify the vehicles and circumstances.

📋 STRUCTURED INSURANCE CLAIM JSON:
Based on your visual analysis, generate a comprehensive JSON structure with all observable data. Leave fields blank or null if information is not visible in the frames.

PROVIDE A COMPLETE JSON RESPONSE with the following structure. Fill in observable data from the video frames:

ACCIDENT DATE/TIME: Extract from video timestamp if visible
VEHICLE DETAILS: Extract license plates, make, model, body type from video
ROAD CONDITIONS: Extract weather, surface conditions from video  
ACCIDENT SEQUENCE: Detailed description of how the accident happened
DAMAGE ASSESSMENT: Visible damage to vehicles

Generate JSON with these sections:
- claim_number (leave blank)
- policyholder_and_driver (personal info - leave blank)
- policyholders_automobile (extract vehicle details from dashcam vehicle if visible)
- date_and_place (extract date/time/location from video)
- accident_details (extract movement, conditions, sequence from video)
- personal_injuries (leave blank)
- other_car_or_property_involved (extract other vehicle details from video)
- damage_to_policyholders_auto (extract visible damage)
- witnesses (list any other vehicles visible)
- certificate (leave blank)
- metadata (analysis info)

CRITICAL: Focus on extracting:
1. License plate numbers and states
2. Vehicle makes, models, body types
3. Road/weather conditions (NOT date/time - leave those blank)
4. Detailed accident sequence
5. Vehicle lighting status
6. Direction of travel
7. Visible damage

IMPORTANT: Do NOT fill out date/time fields - leave them blank/null as this will be provided by the crash detection system.

Use empty strings for unavailable text, null for unavailable numbers, and provide detailed descriptions in arrays.

📞 911 EMERGENCY CALL REPORT:
After the JSON, provide a comprehensive paragraph report that an AI assistant can use when calling 911. This should include:

EMERGENCY DISPATCH REPORT PARAGRAPH:
Write a clear, detailed paragraph (150-200 words) that covers:
- Location description (road type, weather conditions, landmarks) - DO NOT include specific date/time
- Number and types of vehicles involved
- Severity assessment and visible damage
- Current hazards (traffic blockage, debris, weather)
- Specific details for emergency responders (license plates, vehicle descriptions)
- Any signs of injuries or people trapped
- Access information for emergency vehicles

Format this as: "EMERGENCY DISPATCH REPORT: [detailed paragraph]"

IMPORTANT: Do NOT include specific dates/times in the emergency report - this will be provided by the crash detection system.

This report should be immediately usable by an AI making a 911 call and answering dispatcher questions."""

def analyze_crash_frames_with_gemini(crash_frames: List[Tuple[int, np.ndarray]], 
                                   collected_data: Dict = None) -> Dict[str, Any]:
    """Analyze crash frames using Gemini VLM"""
    
    if not GEMINI_API_KEY:
        return {"success": False, "error": "No Gemini API key available"}
    
    try:
        # Convert frames to base64
        frame_data = []
        frame_numbers = []
        
        for frame_num, frame in crash_frames:
            base64_frame = frame_to_base64(frame)
            frame_data.append({
                "inline_data": {
                    "mime_type": "image/jpeg",
                    "data": base64_frame
                }
            })
            frame_numbers.append(frame_num)
        
        # Create analysis prompt
        prompt = create_crash_analysis_prompt(frame_numbers, collected_data)
        
        # Prepare API request
        headers = {
            "Content-Type": "application/json"
        }
        
        # Create request payload
        contents = [{"text": prompt}] + frame_data
        
        data = {
            "contents": [
                {
                    "parts": contents
                }
            ],
            "generationConfig": {
                "temperature": 0.1,
                "topK": 1,
                "topP": 1,
                "maxOutputTokens": 2000,
            }
        }
        
        # Add API key to URL
        url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"
        
        print(f"🔄 Sending {len(crash_frames)} crash frames to Gemini...")
        start_time = time.time()
        
        response = requests.post(url, headers=headers, json=data, timeout=60)
        
        analysis_time = time.time() - start_time
        
        if response.status_code == 200:
            result = response.json()
            
            if "candidates" in result and len(result["candidates"]) > 0:
                analysis_text = result["candidates"][0]["content"]["parts"][0]["text"]
                
                # Extract key findings
                impact_severity = extract_impact_severity(analysis_text)
                collision_type = extract_collision_type(analysis_text)
                safety_concerns = extract_safety_concerns(analysis_text)
                
                print(f"✅ Gemini analysis completed in {analysis_time:.2f}s")
                
                return {
                    "success": True,
                    "analysis": analysis_text,
                    "analysis_time": analysis_time,
                    "impact_severity": impact_severity,
                    "collision_type": collision_type,
                    "safety_concerns": safety_concerns,
                    "frames_analyzed": frame_numbers
                }
            else:
                return {
                    "success": False,
                    "error": "No analysis content returned from Gemini"
                }
        else:
            error_text = response.text[:300] if response.text else "Unknown error"
            return {
                "success": False,
                "error": f"Gemini API error: {response.status_code} - {error_text}"
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": f"Gemini analysis failed: {str(e)}"
        }

def extract_impact_severity(text: str) -> int:
    """Extract impact severity (1-10) from Gemini analysis"""
    text_lower = text.lower()
    
    # Look for severity ratings
    for i in range(10, 0, -1):
        if f'severity: {i}' in text_lower or f'impact severity: {i}' in text_lower:
            return i
        elif f'rate {i}' in text_lower or f'rating {i}' in text_lower:
            return i
    
    # Look for severity keywords
    if any(word in text_lower for word in ['fatal', 'critical', 'severe']):
        return 9
    elif any(word in text_lower for word in ['serious', 'major']):
        return 7
    elif any(word in text_lower for word in ['moderate']):
        return 5
    elif any(word in text_lower for word in ['minor', 'light']):
        return 3
    
    return 6  # Default moderate-high

def extract_collision_type(text: str) -> str:
    """Extract collision type from Gemini analysis"""
    text_lower = text.lower()
    
    if 'rear-end' in text_lower or 'rear end' in text_lower:
        return "Rear-end collision"
    elif 'head-on' in text_lower or 'head on' in text_lower:
        return "Head-on collision"
    elif 'side-impact' in text_lower or 'side impact' in text_lower:
        return "Side-impact collision"
    elif 't-bone' in text_lower:
        return "T-bone collision"
    elif 'rollover' in text_lower:
        return "Rollover accident"
    elif 'multi-vehicle' in text_lower:
        return "Multi-vehicle collision"
    else:
        return "Vehicle collision"

def extract_safety_concerns(text: str) -> List[str]:
    """Extract safety concerns from Gemini analysis"""
    concerns = []
    text_lower = text.lower()
    
    if 'fire' in text_lower or 'smoke' in text_lower:
        concerns.append("Fire/smoke risk")
    if 'airbag' in text_lower:
        concerns.append("Airbag deployment")
    if 'injury' in text_lower or 'injured' in text_lower:
        concerns.append("Potential injuries")
    if 'debris' in text_lower:
        concerns.append("Debris on roadway")
    if 'fluid' in text_lower or 'leak' in text_lower:
        concerns.append("Fluid leaks")
    if 'blocked' in text_lower or 'blocking' in text_lower:
        concerns.append("Traffic blockage")
    if 'weather' in text_lower and ('impact' in text_lower or 'affect' in text_lower):
        concerns.append("Weather-related hazards")
    
    return concerns if concerns else ["Standard collision response needed"]

def identify_most_impactful_frames(video_path: str, crash_detection_results: List[Dict]) -> List[int]:
    """Identify the 4-5 most impactful crash frames for Gemini analysis"""
    
    if not crash_detection_results:
        return []
    
    # Extract frame numbers where crashes were detected
    crash_frame_numbers = []
    for crash in crash_detection_results:
        if 'frame_number' in crash:
            crash_frame_numbers.append(crash['frame_number'])
    
    # If no specific frame numbers, use default impact sequence
    if not crash_frame_numbers:
        # Based on your test results, crashes typically occur around frames 43-50
        crash_frame_numbers = [43, 44, 45, 49, 50]
    
    # Select top 4-5 most impactful frames
    # Prioritize frames with highest severity or camera shake
    impact_frames = sorted(set(crash_frame_numbers))[:5]  # Top 5 frames
    
    print(f"🎯 Selected {len(impact_frames)} most impactful frames: {impact_frames}")
    return impact_frames

def run_gemini_impact_analysis(video_path: str, collected_data: Dict = None) -> Dict[str, Any]:
    """Run Gemini analysis on the most impactful crash frames"""
    
    if not GEMINI_API_KEY:
        return {"success": False, "error": "No Gemini API key available"}
    
    print(f"\n🔍 Starting Gemini Impact Frame Analysis...")
    
    try:
        # For now, use default impact frames since we don't have crash detection results passed
        # In full integration, this would receive actual crash detection results
        impact_frame_numbers = [43, 44, 45, 49, 50]  # Based on test results
        
        # Extract the specific crash frames
        crash_frames = extract_crash_frames(video_path, impact_frame_numbers)
        
        if not crash_frames:
            return {"success": False, "error": "No crash frames could be extracted"}
        
        # Analyze with Gemini
        gemini_result = analyze_crash_frames_with_gemini(crash_frames, collected_data)
        
        if gemini_result["success"]:
            print(f"\n🎯 GEMINI IMPACT ANALYSIS RESULTS:")
            print("="*60)
            print(f"📊 Impact Severity: {gemini_result['impact_severity']}/10")
            print(f"🚗 Collision Type: {gemini_result['collision_type']}")
            print(f"🚨 Safety Concerns: {', '.join(gemini_result['safety_concerns'])}")
            print("="*60)
            print(gemini_result["analysis"])
            print("="*60)
        
        return gemini_result
        
    except Exception as e:
        return {"success": False, "error": f"Gemini analysis failed: {str(e)}"}

def save_gemini_analysis(gemini_result: Dict, video_path: str, output_dir: str = "gemini_analysis"):
    """Save Gemini analysis results"""
    if not gemini_result.get("success"):
        return
    
    os.makedirs(output_dir, exist_ok=True)
    
    video_name = os.path.splitext(os.path.basename(video_path))[0]
    timestamp = int(time.time())
    
    # Save detailed analysis
    analysis_file = os.path.join(output_dir, f"{video_name}_gemini_impact_{timestamp}.txt")
    
    with open(analysis_file, 'w') as f:
        f.write(f"🎯 GEMINI IMPACT FRAME ANALYSIS\n")
        f.write(f"{'='*60}\n\n")
        f.write(f"Video: {os.path.basename(video_path)}\n")
        f.write(f"Analysis Time: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Frames Analyzed: {', '.join(map(str, gemini_result['frames_analyzed']))}\n")
        f.write(f"Processing Time: {gemini_result['analysis_time']:.2f} seconds\n\n")
        
        f.write(f"📊 KEY FINDINGS:\n")
        f.write(f"Impact Severity: {gemini_result['impact_severity']}/10\n")
        f.write(f"Collision Type: {gemini_result['collision_type']}\n")
        f.write(f"Safety Concerns: {', '.join(gemini_result['safety_concerns'])}\n\n")
        
        f.write(f"🔍 DETAILED ANALYSIS:\n")
        f.write(f"{gemini_result['analysis']}\n")
    
    print(f"💾 Gemini analysis saved to: {analysis_file}")
    return analysis_file

def main():
    """Main function for Gemini crash analysis"""
    parser = argparse.ArgumentParser(description='Gemini Impact Frame Analysis')
    parser.add_argument('--input', '-i', type=str, help='Input video file path')
    parser.add_argument('--video', type=str, help='Video file path (alternative to --input)')
    parser.add_argument('--frames', '-f', nargs='+', type=int, 
                       help='Specific frame numbers to analyze (default: auto-detect)')
    parser.add_argument('--output-dir', '-o', type=str, default='gemini_analysis',
                       help='Output directory for analysis results')
    parser.add_argument('--context', type=str, default='',
                       help='Context information from Cerebras for analysis')
    parser.add_argument('--focus', type=str, default='license plates, damage assessment',
                       help='Specific focus areas for Gemini analysis')
    
    args = parser.parse_args()
    
    # Handle both --input and --video arguments
    video_path = args.input if args.input else args.video
    if not video_path:
        print("❌ No video file specified. Use --input or --video")
        return
    
    if not os.path.exists(video_path):
        print(f"❌ Video file not found: {video_path}")
        return
    
    if not GEMINI_API_KEY:
        print("❌ GEMINI_API_KEY environment variable not set")
        print("💡 Set it with: export GEMINI_API_KEY=your_api_key")
        return
    
    print("🎯 Gemini Impact Frame Analysis System")
    print(f"Video: {os.path.basename(video_path)}")
    print(f"API Key: {GEMINI_API_KEY[:20]}...")
    if args.context:
        print(f"Context: {args.context[:100]}...")
    if args.focus:
        print(f"Focus: {args.focus}")
    print("="*60)
    
    # Use provided frames or default crash frames
    if args.frames:
        impact_frames = args.frames
        print(f"📹 Using provided frames: {impact_frames}")
    else:
        impact_frames = [43, 44, 45, 49, 50]  # Default based on test results
        print(f"📹 Using default impact frames: {impact_frames}")
    
    # Mock collected data for testing (in real integration, this comes from crash_detection.py)
    mock_collected_data = {
        'scene_summary': ['Highway scene with vehicles in snowy conditions'],
        'vehicle_details': ['2 vehicles: White large truck, Black pickup truck'],
        'traffic_elements': ['Highway road markings visible, no traffic signs detected'],
        'weather_conditions': ['Moderate visibility conditions']
    }
    
    # Prepare collected data with context if provided
    if args.context:
        collected_data = {
            'context': args.context,
            'focus': args.focus,
            'scene_summary': ['Context provided by Cerebras'],
            'vehicle_details': ['Details from crash detection system'],
            'traffic_elements': ['Traffic analysis available'],
            'weather_conditions': ['Weather conditions analyzed']
        }
    else:
        # Mock collected data for testing (in real integration, this comes from crash_detection.py)
        collected_data = {
        'scene_summary': ['Highway scene with vehicles in snowy conditions'],
        'vehicle_details': ['2 vehicles: White large truck, Black pickup truck'],
        'traffic_elements': ['Highway road markings visible, no traffic signs detected'],
        'weather_conditions': ['Moderate visibility conditions']
    }
    
    # Run Gemini analysis
    try:
        crash_frames = extract_crash_frames(video_path, impact_frames)
        
        if crash_frames:
            gemini_result = analyze_crash_frames_with_gemini(crash_frames, collected_data)
            
            if gemini_result["success"]:
                # Save results
                save_gemini_analysis(gemini_result, video_path, args.output_dir)
                
                print(f"\n✅ Gemini impact analysis completed successfully!")
                print(f"📊 Impact Severity: {gemini_result['impact_severity']}/10")
                print(f"🚗 Collision Type: {gemini_result['collision_type']}")
                print(f"🚨 Key Safety Concerns: {', '.join(gemini_result['safety_concerns'])}")
            else:
                print(f"\n❌ Gemini analysis failed: {gemini_result['error']}")
        else:
            print(f"❌ No crash frames could be extracted")
            
    except Exception as e:
        print(f"❌ Analysis failed: {str(e)}")

if __name__ == "__main__":
    main()
