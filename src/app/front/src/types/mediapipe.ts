import {
  PoseLandmarker,
  DrawingUtils,
  NormalizedLandmark
} from "@mediapipe/tasks-vision";

export interface MediaPipeConfig {
  baseOptions: {
    modelAssetPath: string;
    delegate: "GPU" | "CPU";
  };
  runningMode: "VIDEO" | "IMAGE";
  numPoses: number;
}

export interface PoseDetectionResult {
  landmarks: NormalizedLandmark[][];
  worldLandmarks?: NormalizedLandmark[][];
  segmentationMasks?: ImageData[];
}

export interface VideoStreamConfig {
  width: number;
  height: number;
  facingMode?: "user" | "environment";
}

export interface MediaPipeHookReturn {
  poseLandmarker: PoseLandmarker | null;
  isLoading: boolean;
  error: string | null;
}

export interface DrawingConfig {
  landmarkRadius: number;
  connectionColor: string;
  landmarkColor: string;
  connectionWidth: number;
}

export interface PoseAnalysis {
  isGoodPosture: boolean;
  confidence: number;
  issues: PostureIssue[];
}

export interface PostureIssue {
  type: 'head_tilt' | 'shoulder_alignment' | 'back_curve' | 'hip_alignment';
  severity: 'low' | 'medium' | 'high';
  description: string;
}