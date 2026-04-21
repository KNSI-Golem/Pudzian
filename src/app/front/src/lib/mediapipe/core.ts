import {DrawingUtils, FilesetResolver, PoseLandmarker, HandLandmarker} from "@mediapipe/tasks-vision";
import type {MediaPipeConfig} from "@/types";

export const MEDIAPIPE_CONFIG: MediaPipeConfig = {
  baseOptions: {
    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
    delegate: "GPU",
  },
  runningMode: "VIDEO",
  numPoses: 1,
};

export const MEDIAPIPE_WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm";

export async function createPoseLandmarker(config: Partial<MediaPipeConfig> = {}): Promise<PoseLandmarker> {
  const finalConfig = { ...MEDIAPIPE_CONFIG, ...config };
  
  const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);

  return await PoseLandmarker.createFromOptions(vision, finalConfig);
}

export const HAND_MEDIAPIPE_CONFIG = {
  baseOptions: {
    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
    delegate: "GPU",
  },
  runningMode: "VIDEO",
  numHands: 2,
};

export async function createHandLandmarker(config: any = {}): Promise<HandLandmarker> {
  const finalConfig = { ...HAND_MEDIAPIPE_CONFIG, ...config };
  const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
  // @ts-ignore
  return await HandLandmarker.createFromOptions(vision, finalConfig);
}

export function createDrawingUtils(ctx: CanvasRenderingContext2D): DrawingUtils {
  return new DrawingUtils(ctx);
}

export function handleMediaPipeError(error: unknown): string {
  if (error instanceof Error) {
    return `MediaPipe Error: ${error.message}`;
  }
  return "Unknown MediaPipe error occurred";
}