import { describe, expect, it, vi } from "vitest";
import type { DrawingUtils } from "@mediapipe/tasks-vision";
import type {
  AssignedHand,
  HandImageLandmarks,
  PoseDetectionResult,
  TrackingFrame,
} from "@/types";
import {
  DEFAULT_DRAWING_CONFIG,
  drawHandLandmarks,
  HAND_DRAWING_COLORS,
} from "../drawing";

function assignedHand(
  side: "left" | "right",
  stale: boolean,
  marker: number,
): AssignedHand {
  return {
    side,
    stale,
    assignmentConfidence: 1,
    detectionIndex: marker,
    observedAtMs: 0,
    imageLandmarks: [
      { x: marker, y: 0, z: 0, visibility: 1 },
    ] as unknown as HandImageLandmarks,
    worldLandmarks: [] as unknown as AssignedHand["worldLandmarks"],
  };
}

describe("tracking diagnostics", () => {
  it("uses white body connections and orange body landmarks", () => {
    expect(DEFAULT_DRAWING_CONFIG.connectionColor).toBe("#FAFAFA");
    expect(DEFAULT_DRAWING_CONFIG.landmarkColor).toBe("#F59E0B");
  });

  it("draws assigned hands by side and de-emphasizes stale assignments", () => {
    const left = assignedHand("left", false, 1);
    const right = assignedHand("right", true, 2);
    const unassigned = {
      ...assignedHand("left", false, 99),
      side: undefined,
    };
    const trackingFrame = {
      detectedHands: [unassigned],
      leftHand: left,
      rightHand: right,
    } as unknown as TrackingFrame;
    const result = { trackingFrame } as PoseDetectionResult;
    const drawConnectors = vi.fn();
    const drawLandmarks = vi.fn();
    const drawingUtils = {
      drawConnectors,
      drawLandmarks,
    } as unknown as DrawingUtils;

    drawHandLandmarks(drawingUtils, result);

    expect(drawConnectors).toHaveBeenCalledTimes(2);
    expect(drawLandmarks).toHaveBeenCalledTimes(2);
    expect(drawConnectors.mock.calls[0][0][0].x).toBe(1);
    expect(drawConnectors.mock.calls[0][2].color).toBe(
      HAND_DRAWING_COLORS.left.current,
    );
    expect(drawConnectors.mock.calls[1][0][0].x).toBe(2);
    expect(drawConnectors.mock.calls[1][2].color).toBe(
      HAND_DRAWING_COLORS.right.stale,
    );
    expect(drawConnectors.mock.calls[1][2].lineWidth).toBeLessThan(
      drawConnectors.mock.calls[0][2].lineWidth,
    );
    expect(drawLandmarks.mock.calls[1][1].radius).toBeLessThan(
      drawLandmarks.mock.calls[0][1].radius,
    );
  });
});
