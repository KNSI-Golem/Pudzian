import mediapipe as mp
import cv2 as cv
import pandas as pd


def extract_landmark_sequence(video_path):

    cap = cv.VideoCapture(video_path)

    base_options = mp.tasks.python.BaseOptions(model_asset_path='pose_landmarker.task')
    vision_running_mode = mp.tasks.python.vision.RunningMode

    options = mp.tasks.python.vision.PoseLandmarkerOptions(
        base_options=base_options,
        running_mode=vision_running_mode.VIDEO,
        num_poses=1)

    detector = mp.tasks.python.vision.PoseLandmarker.create_from_options(options)

    landmark_sequence = {}

    while cap.isOpened():
        ret, frame = cap.read()

        if not ret:
            break

        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame)
        frame_timestamp = cv.CAP_PROP_FPS

        detection_result = detector.detect_for_video(mp_image, frame_timestamp)

        for i, landmark in enumerate(detection_result.Landmarks):
            landmark_sequence[f"x{i}"].append(landmark.x)
            landmark_sequence[f"y{i}"].append(landmark.y)
            landmark_sequence[f"z{i}"].append(landmark.z)

    landmark_df = pd.DataFrame(landmark_sequence)

    return landmark_df

if __name__ == "__main__":
    filename = "sample_video.mp4"
    sequence = extract_landmark_sequence(filename)
    print(sequence)
