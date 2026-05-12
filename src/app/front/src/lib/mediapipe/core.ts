import {DrawingUtils, FilesetResolver, PoseLandmarker} from "@mediapipe/tasks-vision";
import type {MediaPipeConfig} from "@/types";

export const MEDIAPIPE_WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm";

const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

export async function createPoseLandmarker(config: Partial<MediaPipeConfig> = {}): Promise<PoseLandmarker> {
  const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);

  return PoseLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL_URL },
    runningMode: config.runningMode ?? "VIDEO",
    numPoses: config.numPoses ?? 1,
  });
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