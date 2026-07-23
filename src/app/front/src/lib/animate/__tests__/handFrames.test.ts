import { describe, expect, it } from "vitest";
import * as THREE from "three";
import type { Landmark, NormalizedLandmark } from "@mediapipe/tasks-vision";
import type {
  AssignedHand,
  HandImageLandmarks,
  HandWorldLandmarks,
} from "@/types";
import { HAND_LANDMARK } from "@/lib/mediapipe";
import { solveHandObservation, solvePalmFrame } from "../handFrames";

function handPoint(x: number, y: number, z = 0): Landmark {
  return { x, y, z, visibility: 1 };
}

function makeHand(side: "left" | "right"): AssignedHand {
  const mirror = side === "left" ? 1 : -1;
  const world = Array.from({ length: 21 }, () => handPoint(0, 0, 0));
  world[HAND_LANDMARK.wrist] = handPoint(0, 0);
  world[HAND_LANDMARK.thumbCmc] = handPoint(mirror * -0.015, -0.02, 0.005);
  world[HAND_LANDMARK.thumbMcp] = handPoint(mirror * -0.03, -0.035, 0.008);
  world[HAND_LANDMARK.thumbIp] = handPoint(mirror * -0.045, -0.045, 0.006);
  world[HAND_LANDMARK.thumbTip] = handPoint(mirror * -0.06, -0.05, 0.003);
  const fingers = [
    [HAND_LANDMARK.indexMcp, HAND_LANDMARK.indexPip, HAND_LANDMARK.indexDip, HAND_LANDMARK.indexTip, -0.025],
    [HAND_LANDMARK.middleMcp, HAND_LANDMARK.middlePip, HAND_LANDMARK.middleDip, HAND_LANDMARK.middleTip, 0],
    [HAND_LANDMARK.ringMcp, HAND_LANDMARK.ringPip, HAND_LANDMARK.ringDip, HAND_LANDMARK.ringTip, 0.02],
    [HAND_LANDMARK.pinkyMcp, HAND_LANDMARK.pinkyPip, HAND_LANDMARK.pinkyDip, HAND_LANDMARK.pinkyTip, 0.04],
  ] as const;
  for (const [mcp, pip, dip, tip, x] of fingers) {
    world[mcp] = handPoint(mirror * x, -0.04);
    world[pip] = handPoint(mirror * x, -0.075, -0.005);
    world[dip] = handPoint(mirror * x, -0.1, -0.012);
    world[tip] = handPoint(mirror * x, -0.12, -0.02);
  }

  return {
    side,
    worldLandmarks: world as unknown as HandWorldLandmarks,
    imageLandmarks: Array.from(
      { length: 21 },
      () => ({ x: 0, y: 0, z: 0 }) as NormalizedLandmark,
    ) as unknown as HandImageLandmarks,
    detectionIndex: 0,
    observedAtMs: 0,
    assignmentConfidence: 1,
    stale: false,
  };
}

describe("hand observations", () => {
  it("builds a normalized proper palm frame for each anatomical side", () => {
    for (const side of ["left", "right"] as const) {
      const result = solvePalmFrame(makeHand(side));
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.rotation.length()).toBeCloseTo(1, 10);
        const matrix = new THREE.Matrix4().makeRotationFromQuaternion(
          result.rotation,
        );
        expect(new THREE.Matrix3().setFromMatrix4(matrix).determinant()).toBeCloseTo(
          1,
          10,
        );
      }
    }
  });

  it("gives mirrored hands the same anatomical palm orientation", () => {
    const left = solvePalmFrame(makeHand("left"));
    const right = solvePalmFrame(makeHand("right"));

    expect(left.valid).toBe(true);
    expect(right.valid).toBe(true);
    if (left.valid && right.valid) {
      expect(left.rotation.angleTo(right.rotation)).toBeLessThan(1e-10);
    }
  });

  it("uses a full palm frame and directions for all 15 finger bones", () => {
    const observation = solveHandObservation(makeHand("left"));
    expect(observation.frames.leftHand?.valid).toBe(true);
    expect(
      Object.values(observation.directions).filter(
        (result) => result?.valid,
      ),
    ).toHaveLength(15);
  });

  it("does not mutate hand landmark input", () => {
    const hand = makeHand("left");
    const before = hand.worldLandmarks.map((point) => ({ ...point }));
    solveHandObservation(hand);
    expect(hand.worldLandmarks).toEqual(before);
  });
});
