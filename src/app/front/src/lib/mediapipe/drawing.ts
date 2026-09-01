import {
  HandLandmarker,
  PoseLandmarker,
  DrawingUtils,
} from "@mediapipe/tasks-vision";
import type { DrawingConfig, PoseDetectionResult } from "@/types";

export const DEFAULT_DRAWING_CONFIG: DrawingConfig = {
  landmarkRadius: 5,
  connectionColor: "#FAFAFA",
  landmarkColor: "#F59E0B",
  connectionWidth: 4,
};

export const HAND_DRAWING_COLORS = Object.freeze({
  left: Object.freeze({
    current: "#3B82F6",
    stale: "rgba(59, 130, 246, 0.45)",
  }),
  right: Object.freeze({
    current: "#D946EF",
    stale: "rgba(217, 70, 239, 0.45)",
  }),
});

export function drawPoseLandmarks(
  ctx: CanvasRenderingContext2D,
  drawingUtils: DrawingUtils,
  result: PoseDetectionResult,
  config: Partial<DrawingConfig> = {}
): void {
  const finalConfig = { ...DEFAULT_DRAWING_CONFIG, ...config };
  
  ctx.save();
  
  try {
    for (const landmarks of result.landmarks) {
      drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, {
        color: finalConfig.connectionColor,
        lineWidth: finalConfig.connectionWidth
      });

      drawingUtils.drawLandmarks(landmarks, {
        color: finalConfig.landmarkColor,
        radius: (data: any) => {
          return DrawingUtils.lerp(data.from?.z || 0, -0.15, 0.1, finalConfig.landmarkRadius, 1);
        }
      });
    }
  } catch (error) {
    console.error("Error drawing pose landmarks:", error);
  } finally {
    ctx.restore();
  }
}

export function drawHandLandmarks(
  drawingUtils: DrawingUtils,
  result: PoseDetectionResult,
  config: Partial<DrawingConfig> = {},
): void {
  const finalConfig = { ...DEFAULT_DRAWING_CONFIG, ...config };
  const trackingFrame = result.trackingFrame;
  if (!trackingFrame) return;
  for (const hand of [
    trackingFrame.leftHand,
    trackingFrame.rightHand,
  ]) {
    if (!hand) continue;
    const imageLandmarks = Array.from(hand.imageLandmarks);
    const color = HAND_DRAWING_COLORS[hand.side][
      hand.stale ? "stale" : "current"
    ];
    drawingUtils.drawConnectors(
      imageLandmarks,
      HandLandmarker.HAND_CONNECTIONS,
      {
        color,
        lineWidth: Math.max(
          1,
          finalConfig.connectionWidth - (hand.stale ? 2 : 1),
        ),
      },
    );
    drawingUtils.drawLandmarks(imageLandmarks, {
      color,
      radius: Math.max(
        1,
        finalConfig.landmarkRadius - (hand.stale ? 3 : 2),
      ),
    });
  }
}


export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  ctx.clearRect(0, 0, width, height);
}
