import {
  DrawingUtils,
  FilesetResolver,
  HandLandmarker,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";
import type { HandMediaPipeConfig, MediaPipeConfig } from "@/types";
import { runMediaPipeOperation } from "./logging";

export const MEDIAPIPE_WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm";

const POSE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const HAND_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

export async function createPoseLandmarker(config: Partial<MediaPipeConfig> = {}): Promise<PoseLandmarker> {
  return runMediaPipeOperation(async () => {
    const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);

    return PoseLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: POSE_MODEL_URL },
      runningMode: config.runningMode ?? "VIDEO",
      numPoses: config.numPoses ?? 1,
    });
  });
}

export async function createHandLandmarker(
  config: Partial<HandMediaPipeConfig> = {},
): Promise<HandLandmarker> {
  return runMediaPipeOperation(async () => {
    const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);

    return HandLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: HAND_MODEL_URL },
      runningMode: config.runningMode ?? "VIDEO",
      numHands: config.numHands ?? 2,
      minHandDetectionConfidence: config.minHandDetectionConfidence ?? 0.5,
      minHandPresenceConfidence: config.minHandPresenceConfidence ?? 0.5,
      minTrackingConfidence: config.minTrackingConfidence ?? 0.5,
    });
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
