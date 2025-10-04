import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils
} from "@mediapipe/tasks-vision";
import type { MediaPipeConfig } from "@/types";

export const DEFAULT_MEDIAPIPE_CONFIG: MediaPipeConfig = {
  baseOptions: {
    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
    delegate: "GPU",
  },
  runningMode: "VIDEO",
  numPoses: 1,
};

export const MEDIAPIPE_WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm";

/**
 * Creates and initializes a MediaPipe PoseLandmarker
 */
export async function createPoseLandmarker(config: Partial<MediaPipeConfig> = {}): Promise<PoseLandmarker> {
  const finalConfig = { ...DEFAULT_MEDIAPIPE_CONFIG, ...config };
  
  const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
  
  const poseLandmarker = await PoseLandmarker.createFromOptions(vision, finalConfig);
  
  return poseLandmarker;
}

/**
 * Creates a DrawingUtils instance for rendering landmarks
 */
export function createDrawingUtils(ctx: CanvasRenderingContext2D): DrawingUtils {
  return new DrawingUtils(ctx);
}

/**
 * Error handler for MediaPipe operations
 */
export function handleMediaPipeError(error: unknown): string {
  if (error instanceof Error) {
    return `MediaPipe Error: ${error.message}`;
  }
  return "Unknown MediaPipe error occurred";
}