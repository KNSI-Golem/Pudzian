import { describe, expect, it } from "vitest";
import * as THREE from "three";
import type { Landmark, NormalizedLandmark } from "@mediapipe/tasks-vision";
import type {
  AssignedHand,
  DirectionResult,
  HandImageLandmarks,
  HandWorldLandmarks,
} from "@/types";
import { HAND_LANDMARK } from "@/lib/mediapipe";
import {
  LEFT_FINGER_CHAINS,
  RIGHT_FINGER_CHAINS,
  type RetargetBoneId,
} from "../boneConfig";
import {
  HAND_CALIBRATION_LIMITS,
  HandCalibrationTracker,
  isHandCalibrationPose,
} from "../handCalibration";
import type { HandObservation } from "../handFrames";
import { solveHandObservation } from "../handFrames";
import type { RetargetRig } from "../rig";

function hand(side: "left" | "right", stale = false): AssignedHand {
  return {
    side,
    stale,
    assignmentConfidence: 1,
    detectionIndex: 0,
    observedAtMs: 0,
    imageLandmarks: [] as unknown as AssignedHand["imageLandmarks"],
    worldLandmarks: [] as unknown as AssignedHand["worldLandmarks"],
  };
}

function cameraFacingHand(side: "left" | "right"): AssignedHand {
  const point = (x: number, y: number, z = 0): Landmark => ({
    x,
    y,
    z,
    visibility: 1,
  });
  const world = Array.from({ length: 21 }, () => point(0, 0));
  const mirror = side === "left" ? 1 : -1;
  world[HAND_LANDMARK.wrist] = point(0, 0);
  const fingers = [
    [HAND_LANDMARK.indexMcp, HAND_LANDMARK.indexPip, HAND_LANDMARK.indexDip, HAND_LANDMARK.indexTip, 0.03],
    [HAND_LANDMARK.middleMcp, HAND_LANDMARK.middlePip, HAND_LANDMARK.middleDip, HAND_LANDMARK.middleTip, 0.01],
    [HAND_LANDMARK.ringMcp, HAND_LANDMARK.ringPip, HAND_LANDMARK.ringDip, HAND_LANDMARK.ringTip, -0.015],
    [HAND_LANDMARK.pinkyMcp, HAND_LANDMARK.pinkyPip, HAND_LANDMARK.pinkyDip, HAND_LANDMARK.pinkyTip, -0.04],
  ] as const;
  for (const [mcp, pip, dip, tip, x] of fingers) {
    world[mcp] = point(mirror * x, -0.04);
    world[pip] = point(mirror * x, -0.075);
    world[dip] = point(mirror * x, -0.1);
    world[tip] = point(mirror * x, -0.125);
  }

  return {
    ...hand(side),
    worldLandmarks: world as unknown as HandWorldLandmarks,
    imageLandmarks: Array.from(
      { length: 21 },
      () => ({ x: 0, y: 0, z: 0, visibility: 1 }) as NormalizedLandmark,
    ) as unknown as HandImageLandmarks,
  };
}

function observation(
  side: "left" | "right",
  rotation = new THREE.Quaternion(),
  curled = false,
): HandObservation {
  const handBone = side === "left" ? "leftHand" : "rightHand";
  const chains =
    side === "left" ? LEFT_FINGER_CHAINS : RIGHT_FINGER_CHAINS;
  const directions: Partial<Record<RetargetBoneId, DirectionResult>> = {};
  const straight = new THREE.Vector3(0, 1, 0).applyQuaternion(rotation);
  const bent = new THREE.Vector3(1, 0, 0).applyQuaternion(rotation);

  for (const chain of chains.filter((candidate) => !candidate.thumb)) {
    chain.bones.forEach((boneId, index) => {
      directions[boneId] = {
        valid: true,
        direction: curled && index === 1 ? bent.clone() : straight.clone(),
        confidence: 1,
      };
    });
  }
  return {
    frames: {
      [handBone]: {
        valid: true,
        rotation: rotation.clone(),
        confidence: 1,
      },
    },
    directions,
  };
}

function rig(): RetargetRig {
  return {
    bindBodyWorldRotation: new THREE.Quaternion(),
    bindPalmWorldRotations: {
      left: new THREE.Quaternion(),
      right: new THREE.Quaternion(),
    },
    worldBindRotations: {
      leftHand: new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        -Math.PI / 2,
      ),
      rightHand: new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        Math.PI / 2,
      ),
    },
  } as unknown as RetargetRig;
}

function completeCalibration(
  tracker: HandCalibrationTracker,
  sourceRotation = new THREE.Quaternion(),
) {
  let result = tracker.update(
    rig(),
    hand(tracker.side),
    observation(tracker.side, sourceRotation),
    0,
  );
  for (
    let index = 1;
    index < HAND_CALIBRATION_LIMITS.minimumSamples;
    index += 1
  ) {
    result = tracker.update(
      rig(),
      hand(tracker.side),
      observation(tracker.side, sourceRotation),
      index * 40,
    );
  }
  return result;
}

describe("explicit hand calibration", () => {
  it("accepts a camera-facing open palm", () => {
    expect(isHandCalibrationPose(hand("left"), observation("left"))).toBe(
      true,
    );
  });

  it("accepts camera-facing landmark geometry on both anatomical sides", () => {
    for (const side of ["left", "right"] as const) {
      const assignedHand = cameraFacingHand(side);
      expect(
        isHandCalibrationPose(
          assignedHand,
          solveHandObservation(assignedHand),
        ),
      ).toBe(true);
    }
  });

  it("rejects downward and edge-on palms", () => {
    const downward = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      Math.PI / 2,
    );
    const edgeOn = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      Math.PI / 2,
    );

    expect(
      isHandCalibrationPose(
        hand("left"),
        observation("left", downward),
      ),
    ).toBe(false);
    expect(
      isHandCalibrationPose(hand("left"), observation("left", edgeOn)),
    ).toBe(false);
  });

  it("rejects curled and stale hands", () => {
    expect(
      isHandCalibrationPose(hand("left"), observation("left", undefined, true)),
    ).toBe(false);
    expect(
      isHandCalibrationPose(hand("left", true), observation("left")),
    ).toBe(false);
  });

  it("requires a stable multi-frame sampling window", () => {
    const tracker = new HandCalibrationTracker("left");
    const first = tracker.update(rig(), hand("left"), observation("left"), 0);

    expect(first.status).toBe("sampling");
    expect(first.reference).toBeUndefined();
    expect(completeCalibration(tracker).status).toBe("calibrated");
  });

  it("does not count one repeated tracking frame as a sample window", () => {
    const tracker = new HandCalibrationTracker("left");
    for (let index = 0; index < 20; index += 1) {
      tracker.update(rig(), hand("left"), observation("left"), 100);
    }

    expect(tracker.getStatus()).toBe("sampling");
  });

  it("resets pending samples when the pose is lost", () => {
    const tracker = new HandCalibrationTracker("left");
    tracker.update(rig(), hand("left"), observation("left"), 0);
    const invalid = observation(
      "left",
      new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        Math.PI / 2,
      ),
    );

    expect(tracker.update(rig(), hand("left"), invalid, 40).status).toBe(
      "waiting",
    );
  });

  it("averages quaternion sign flips without changing the reference", () => {
    const tracker = new HandCalibrationTracker("left");
    const positive = new THREE.Quaternion();
    const negative = new THREE.Quaternion(0, 0, 0, -1);
    let result = tracker.update(
      rig(),
      hand("left"),
      observation("left", positive),
      0,
    );
    for (
      let index = 1;
      index < HAND_CALIBRATION_LIMITS.minimumSamples;
      index += 1
    ) {
      result = tracker.update(
        rig(),
        hand("left"),
        observation("left", index % 2 ? negative : positive),
        index * 40,
      );
    }

    expect(result.status).toBe("calibrated");
    expect(
      result.reference!.sourcePalmWorld.angleTo(new THREE.Quaternion()),
    ).toBeLessThan(1e-10);
  });

  it("does not accept an angularly unstable sample window", () => {
    const tracker = new HandCalibrationTracker("left");
    for (let index = 0; index < 20; index += 1) {
      const rotation = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 0, 1),
        THREE.MathUtils.degToRad(index % 2 ? 15 : -15),
      );
      tracker.update(
        rig(),
        hand("left"),
        observation("left", rotation),
        index * 40,
      );
    }

    expect(tracker.getStatus()).not.toBe("calibrated");
  });

  it("ignores arbitrary observations before the known pose", () => {
    const first = new HandCalibrationTracker("left");
    const second = new HandCalibrationTracker("left");
    const edgeOn = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      Math.PI / 2,
    );
    first.update(rig(), hand("left"), observation("left", edgeOn), 0);
    second.update(
      rig(),
      hand("left"),
      observation(
        "left",
        new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(1, 0, 0),
          Math.PI / 2,
        ),
      ),
      0,
    );

    const firstResult = completeCalibration(first);
    const secondResult = completeCalibration(second);
    expect(
      firstResult.reference!.sourcePalmWorld.angleTo(
        secondResult.reference!.sourcePalmWorld,
      ),
    ).toBeLessThan(1e-10);
    expect(
      firstResult.reference!.targetPalmFrameWorld.angleTo(
        secondResult.reference!.targetPalmFrameWorld,
      ),
    ).toBeLessThan(1e-10);
  });

  it("calibrates each side independently with mirrored rig offsets", () => {
    const left = completeCalibration(new HandCalibrationTracker("left"));
    const right = new HandCalibrationTracker("right");

    expect(left.status).toBe("calibrated");
    expect(right.getStatus()).toBe("waiting");
    const rightResult = completeCalibration(right);
    expect(
      left.reference!.targetPalmFrameWorld.angleTo(
        rightResult.reference!.targetPalmFrameWorld,
      ),
    ).toBeLessThan(1e-10);
    expect(
      left.reference!.palmToHandBone.angleTo(
        rightResult.reference!.palmToHandBone,
      ),
    ).toBeCloseTo(Math.PI, 10);
  });

  it("clears an accepted reference on recalibration", () => {
    const tracker = new HandCalibrationTracker("left");
    expect(completeCalibration(tracker).status).toBe("calibrated");

    tracker.reset();

    expect(tracker.getStatus()).toBe("waiting");
    expect(
      tracker.update(rig(), undefined, undefined, 1000).reference,
    ).toBeUndefined();
  });
});
