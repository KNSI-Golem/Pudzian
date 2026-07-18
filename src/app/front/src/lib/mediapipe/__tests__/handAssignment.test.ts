import { describe, expect, it } from "vitest";
import type { Landmark, NormalizedLandmark } from "@mediapipe/tasks-vision";
import type {
  DetectedHand,
  HandImageLandmarks,
  HandWorldLandmarks,
  PoseImageLandmarks,
  PoseWorldLandmarks,
  TrackingFrame,
} from "@/types";
import { HAND_LANDMARK, POSE_LANDMARK } from "../mapping";
import { HandAssignmentTracker } from "../handAssignment";

function normalized(x = 0, y = 0): NormalizedLandmark {
  return { x, y, z: 0, visibility: 1 };
}

function world(): Landmark {
  return { x: 0, y: 0, z: 0, visibility: 1 };
}

function hand(x: number, y: number, label?: "Left" | "Right"): DetectedHand {
  const image = Array.from({ length: 21 }, () => normalized(x, y));
  image[HAND_LANDMARK.wrist] = normalized(x, y);
  return {
    imageLandmarks: image as unknown as HandImageLandmarks,
    worldLandmarks: Array.from(
      { length: 21 },
      world,
    ) as unknown as HandWorldLandmarks,
    handedness: label ? { label, score: 0.99 } : undefined,
    detectionIndex: 0,
  };
}

function frame(
  timestampMs: number,
  hands: readonly DetectedHand[],
  leftWrist: readonly [number, number] = [0.25, 0.5],
  rightWrist: readonly [number, number] = [0.75, 0.5],
  imageSize = { width: 1000, height: 500 },
): TrackingFrame {
  const poseImage = Array.from({ length: 33 }, () => normalized());
  poseImage[POSE_LANDMARK.leftWrist] = normalized(...leftWrist);
  poseImage[POSE_LANDMARK.rightWrist] = normalized(...rightWrist);
  return {
    poseImageLandmarks: poseImage as unknown as PoseImageLandmarks,
    poseWorldLandmarks: Array.from(
      { length: 33 },
      world,
    ) as unknown as PoseWorldLandmarks,
    detectedHands: hands.map((item, detectionIndex) => ({
      ...item,
      detectionIndex,
    })),
    timestampMs,
    imageSize,
  };
}

describe("HandAssignmentTracker", () => {
  it("assigns one hand to the nearest anatomical pose wrist", () => {
    const assigned = new HandAssignmentTracker().assign(
      frame(0, [hand(0.27, 0.5, "Right")]),
    );
    expect(assigned.leftHand?.detectionIndex).toBe(0);
    expect(assigned.rightHand).toBeUndefined();
  });

  it("enforces a one-to-one assignment for two hands", () => {
    const assigned = new HandAssignmentTracker().assign(
      frame(0, [hand(0.74, 0.5), hand(0.26, 0.5)]),
    );
    expect(assigned.leftHand?.detectionIndex).toBe(1);
    expect(assigned.rightHand?.detectionIndex).toBe(0);
  });

  it("uses pixel geometry so portrait aspect ratio does not distort distance", () => {
    const tracker = new HandAssignmentTracker({
      maximumWristDistanceFraction: 0.15,
    });
    const assigned = tracker.assign(
      frame(
        0,
        [hand(0.5, 0.51)],
        [0.5, 0.2],
        [0.8, 0.51],
        { width: 200, height: 1000 },
      ),
    );
    expect(assigned.rightHand?.detectionIndex).toBe(0);
    expect(assigned.leftHand).toBeUndefined();
  });

  it("keeps anatomical sides stable when detector ordering changes", () => {
    const tracker = new HandAssignmentTracker();
    tracker.assign(frame(0, [hand(0.25, 0.5), hand(0.75, 0.5)]));
    const reordered = tracker.assign(
      frame(33, [hand(0.74, 0.5), hand(0.26, 0.5)]),
    );
    expect(reordered.leftHand?.detectionIndex).toBe(1);
    expect(reordered.rightHand?.detectionIndex).toBe(0);
  });

  it("follows anatomical pose labels when wrists cross", () => {
    const tracker = new HandAssignmentTracker();
    tracker.assign(frame(0, [hand(0.35, 0.5), hand(0.65, 0.5)]));
    const crossed = tracker.assign(
      frame(
        200,
        [hand(0.68, 0.5), hand(0.32, 0.5)],
        [0.7, 0.5],
        [0.3, 0.5],
      ),
    );
    expect(crossed.leftHand?.detectionIndex).toBe(0);
    expect(crossed.rightHand?.detectionIndex).toBe(1);
  });

  it("retains a stale hand only for the configured dropout window", () => {
    const tracker = new HandAssignmentTracker({ dropoutHoldMs: 100 });
    tracker.assign(frame(0, [hand(0.25, 0.5)]));
    const held = tracker.assign(frame(80, []));
    const expired = tracker.assign(frame(101, []));
    expect(held.leftHand?.stale).toBe(true);
    expect(held.leftHand?.observedAtMs).toBe(0);
    expect(expired.leftHand).toBeUndefined();
  });
});
