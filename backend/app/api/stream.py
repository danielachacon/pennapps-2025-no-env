from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import cv2
import numpy as np
from urllib.parse import urlparse

try:
    from yt_dlp import YoutubeDL  # type: ignore
except Exception:  # pragma: no cover - optional dep
    YoutubeDL = None  # type: ignore

router = APIRouter(prefix="/stream", tags=["stream"])


def _resolve_source(source: str) -> str:
    if ("youtube.com" in source or "youtu.be" in source) and YoutubeDL is not None:
        ydl_opts = {"quiet": True, "format": "best"}
        with YoutubeDL(ydl_opts) as ydl:  # type: ignore
            info = ydl.extract_info(source, download=False)
            return info.get("url")  # type: ignore
    return source


def _frame_generator(video_url: str, crash_mode: bool = False):
    resolved = _resolve_source(video_url)
    cap = cv2.VideoCapture(resolved)
    if not cap.isOpened():
        raise RuntimeError("Failed to open video source")

    back_sub = cv2.createBackgroundSubtractorMOG2(history=300, varThreshold=16, detectShadows=True)
    prev_gray = None
    prev_speed = 0.0
    cooldown = 0
    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            # Resize for bandwidth friendliness
            h, w = frame.shape[:2]
            if w > 960:
                scale = 960 / float(w)
                frame = cv2.resize(frame, (960, int(h * scale)))

            overlay = frame.copy()

            # Background motion mask
            fg_mask = back_sub.apply(frame)
            fg_mask = cv2.GaussianBlur(fg_mask, (11, 11), 0)

            # Optical flow-based speed estimate
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            flow_mag = 0.0
            if prev_gray is not None:
                flow = cv2.calcOpticalFlowFarneback(prev_gray, gray, None, 0.5, 3, 21, 3, 5, 1.2, 0)
                mag, _ = cv2.cartToPolar(flow[..., 0], flow[..., 1])
                flow_mag = float(np.clip(np.median(mag), 0, 255))
            prev_gray = gray

            # Heuristic crash signal: high motion followed by sharp drop, or large foreground surge
            motion_level = float(np.mean(fg_mask))
            crash = False
            if crash_mode:
                drop = prev_speed > 8.0 and (prev_speed - flow_mag) > 5.0
                surge = motion_level > 140.0  # foreground surge
                if (drop or surge) and cooldown == 0:
                    crash = True
                    cooldown = 90  # ~3s at 30fps
                prev_speed = flow_mag
                if cooldown > 0:
                    cooldown -= 1

            # Visualize
            colored = cv2.applyColorMap(fg_mask, cv2.COLORMAP_OCEAN)
            cv2.addWeighted(colored, 0.30, overlay, 0.70, 0, overlay)
            if crash:
                cv2.rectangle(overlay, (0, 0), (overlay.shape[1], 56), (0, 0, 255), -1)
                cv2.putText(overlay, "CRASH DETECTED", (18, 38), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2, cv2.LINE_AA)
            cv2.rectangle(overlay, (2, 2), (overlay.shape[1]-2, overlay.shape[0]-2), (59, 130, 246), 2)
            cv2.putText(overlay, f"motion:{motion_level:.0f} speed:{flow_mag:.1f}", (10, overlay.shape[0]-12), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255,255,255), 1, cv2.LINE_AA)

            ok, jpg = cv2.imencode('.jpg', overlay, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
            if not ok:
                continue
            frame_bytes = jpg.tobytes()
            yield (b"--frame\r\n"
                   b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n")
    finally:
        cap.release()


@router.get("/crash-mjpeg")
def crash_mjpeg(url: str):
    try:
        gen = _frame_generator(url, crash_mode=True)
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return StreamingResponse(gen, media_type='multipart/x-mixed-replace; boundary=frame')

