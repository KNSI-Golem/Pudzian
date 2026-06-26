import {
  PoseLandmarker,
  NormalizedLandmark
} from "@mediapipe/tasks-vision";

export type MediaPipeConfig = {
  runningMode: "VIDEO" | "IMAGE";
  numPoses: number;
}

export type PoseDetectionResult = {
  landmarks: NormalizedLandmark[][];
  worldLandmarks: NormalizedLandmark[][];
  segmentationMasks?: ImageData[];
}

export type VideoStreamConfig = {
  width: number;
  height: number;
  facingMode?: "user" | "environment";
}

export type MediaPipeHookReturn = {
  poseLandmarker: PoseLandmarker | null;
  isLoading: boolean;
  error: string | null;
}

export type DrawingConfig = {
  landmarkRadius: number;
  connectionColor: string;
  landmarkColor: string;
  connectionWidth: number;
}

export type MediapipeJointMapping = Record<string, number>