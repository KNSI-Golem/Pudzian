import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import cv2 as cv
import pandas as pd
import os


class PoseProcessor:

    def __init__(self):
        pass

    def process(self, filename):

        cap = cv.VideoCapture(filename)

        model_path = os.path.join("process", "pose_landmarker_full.task")

        base_options = python.BaseOptions(model_asset_path=model_path)
        options = vision.PoseLandmarkerOptions(
        base_options=base_options,
        output_segmentation_masks=True,
        running_mode=vision.RunningMode.VIDEO,)
        
        detector = vision.PoseLandmarker.create_from_options(options)

        landmark_list = []

        while cap.isOpened():
            ret, frame = cap.read()

            if not ret:
                break

            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame)
            frame_timestamp = cap.get(cv.CAP_PROP_POS_MSEC)

            if frame_timestamp is None or frame_timestamp <= 0:
                continue

            detection_result = detector.detect_for_video(mp_image, int(frame_timestamp))

            cap.release()

            landmark_list.append(detection_result.pose_landmarks)

        return landmark_list