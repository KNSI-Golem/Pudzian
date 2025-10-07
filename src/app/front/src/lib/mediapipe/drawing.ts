import { PoseLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";
import type { DrawingConfig, PoseDetectionResult } from "@/types";

export const DEFAULT_DRAWING_CONFIG: DrawingConfig = {
  landmarkRadius: 5,
  connectionColor: '#FAFAFA',
  landmarkColor: '#69BFBB',
  connectionWidth: 4,
};


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


export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  ctx.clearRect(0, 0, width, height);
}