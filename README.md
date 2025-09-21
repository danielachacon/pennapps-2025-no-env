# 🚗 Percepta - AI Crash Detection System

**PennApps 2025 Project**

An advanced AI-powered crash detection system that analyzes video footage to identify car crashes in real-time using YOLO object detection and bounding box growth analysis.

## 🌟 Features

### 🎥 Video Analysis
- **YOLO-powered vehicle detection** - Detects cars, trucks, buses, motorcycles
- **Bounding box growth analysis** - Detects rapidly approaching vehicles
- **Multi-crash detection** - Sudden stops, collisions, high-speed impacts
- **Real-time processing** - Analyze live camera feeds or video files

### 📞 Voice Agent Integration
- **Twilio Voice API** - Interactive voice interface
- **Speech-to-Text** - Convert voice commands to text
- **Text-to-Speech** - Natural AI responses
- **Voice-activated analysis** - Request crash detection via phone call

### 📊 Detection Methods
1. **Rapid Approach Detection** - Bounding boxes growing >30% per frame
2. **Collision Detection** - Close proximity + movement analysis  
3. **Sudden Stop Detection** - Extreme deceleration patterns
4. **Erratic Movement** - Unusual velocity patterns
