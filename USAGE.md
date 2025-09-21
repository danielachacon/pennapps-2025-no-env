# Car Crash Detection System - Usage Guide

## ✅ Installation Complete!

All dependencies have been installed and the YOLO model has been downloaded.

## 🚀 How to Use

### 1. Process a video file:
```bash
# Test with included videos (auto-saves to output/ directory)
python detection.py --input videos/000001.mp4
python detection.py --input videos/000005.mp4

# Or use your own video with custom output
python detection.py --input your_video.mp4 --output my_result.mp4
```

### 2. Real-time camera detection:
```bash
python detection.py --camera
```

### 3. Advanced options:

**Use a more accurate model:**
```bash
python detection.py --input video.mp4 --model yolov8m.pt --output result.mp4
```

**Adjust confidence threshold:**
```bash
python detection.py --input video.mp4 --confidence 0.7
```

**Process without display (faster):**
```bash
python detection.py --input video.mp4 --output result.mp4 --no-display
```

**Enable debug output to see detection details:**
```bash
python detection.py --input videos/000005.mp4 --debug
```

**Adjust sensitivity for different scenarios:**
```bash
# High sensitivity - catches more crashes, may have false positives
python detection.py --input videos/000001.mp4 --sensitivity high

# Low sensitivity - fewer false positives, may miss some crashes  
python detection.py --input videos/000001.mp4 --sensitivity low
```

**Clean output directory before processing:**
```bash
python detection.py --input videos/000005.mp4 --clean
```

**Process multiple videos one at a time:**
```bash
# Each video processes independently with clean tracking
python detection.py --input videos/000001.mp4
python detection.py --input videos/000005.mp4
# Results saved to: output/000001_crash_detection.mp4, output/000005_crash_detection.mp4
```

## 🎯 What it detects:

- **Vehicles**: Cars, trucks, buses, motorcycles
- **Crash types**:
  - **Sudden stops**: Rapid deceleration detection
  - **Vehicle collisions**: Close proximity + movement detection  
  - **High-speed impacts**: Sudden velocity drops
  - **Erratic movement**: Unusual velocity patterns indicating crashes

## 📊 Output:

- **Visual**: Bounding boxes, tracking trails, velocity info
- **Alerts**: Red crash indicators and text alerts
- **Console**: Real-time statistics and progress
- **Video**: Annotated output file (if specified)

## 🎮 Controls:

- Press **'q'** to quit during processing
- All crash detections are logged to console
- Adjust parameters in `detection.py` if needed

## 📁 Files in project:

- `detection.py` - Main detection script
- `requirements.txt` - Dependencies
- `yolov8n.pt` - YOLO model (auto-downloaded)
- `USAGE.md` - This guide

## 🔧 Troubleshooting:

If you encounter issues:
1. Make sure your video file exists and is readable
2. Check that your camera is not being used by another application
3. Verify OpenCV can access your camera: `python -c "import cv2; print(cv2.VideoCapture(0).isOpened())"`

Ready to detect crashes! 🚗💥
