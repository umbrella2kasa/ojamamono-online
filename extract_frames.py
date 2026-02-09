import cv2
import os

video_path = r"C:\Users\hi040\Videos\レコーディング 2026-02-04 195234.mp4"
output_dir = "temp_frames"

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

cap = cv2.VideoCapture(video_path)

if not cap.isOpened():
    print("Error: Could not open video.")
    exit(1)

fps = cap.get(cv2.CAP_PROP_FPS)
print(f"FPS: {fps}")

timestamps = [0, 2, 4, 6, 8, 10, 15, 20] # Capture frames at these seconds

for sec in timestamps:
    frame_id = int(fps * sec)
    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_id)
    ret, frame = cap.read()
    if ret:
        output_file = os.path.join(output_dir, f"frame_{sec}s.png")
        cv2.imwrite(output_file, frame)
        print(f"Saved {output_file}")
    else:
        print(f"Could not read frame at {sec}s")

cap.release()
print("Done.")
