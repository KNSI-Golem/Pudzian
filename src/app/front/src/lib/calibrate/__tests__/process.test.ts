import { describe, expect, it } from "vitest";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { PoseDetectionResult } from "@/types";
import { POSE_LANDMARK } from "@/lib/mediapipe";
import { isCalibrated } from "../process";

function pose(noseX: number, visibility = 1): PoseDetectionResult {
  const landmarks = Array.from(
    { length: 33 },
    () =>
      ({ x: 0.5, y: 0.5, z: 0, visibility }) as NormalizedLandmark,
  );
  landmarks[POSE_LANDMARK.nose].x = noseX;
  return { landmarks: [landmarks], worldLandmarks: [[]] };
}

describe("calibration readiness", () => {
  it("accepts a visible centered pose", () => {
    expect(isCalibrated(pose(0.5))).toBe(true);
  });

  it("rejects off-center and low-visibility poses", () => {
    expect(isCalibrated(pose(0.1))).toBe(false);
    expect(isCalibrated(pose(0.5, 0.2))).toBe(false);
  });

  it("treats incomplete detector output as not ready", () => {
    expect(
      isCalibrated({ landmarks: [[]], worldLandmarks: [[]] }),
    ).toBe(false);
  });
});
