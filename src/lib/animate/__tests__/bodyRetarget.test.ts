import { describe, expect, it } from "vitest";
import * as THREE from "three";
import type { DirectionResult, FrameResult } from "@/types";
import type { BodyObservation } from "../bodyFrames";
import type {
  RetargetBoneId,
  SourceDirectionId,
  SourceFrameId,
} from "../boneConfig";
import { BODY_BONE_CONFIG } from "../boneConfig";
import { createReferencePose } from "../referencePose";
import type { RetargetRig } from "../rig";
import { solveBodyWorldTargets } from "../bodyRetarget";

function validDirection(direction: THREE.Vector3): DirectionResult {
  return { valid: true, direction: direction.normalize(), confidence: 1 };
}

function validFrame(rotation: THREE.Quaternion): FrameResult {
  return { valid: true, rotation, confidence: 1 };
}

function observation(
  directions: Partial<Record<SourceDirectionId, THREE.Vector3>>,
  frames: Partial<Record<SourceFrameId, THREE.Quaternion>> = {},
): BodyObservation {
  return {
    directions: Object.fromEntries(
      Object.entries(directions).map(([id, value]) => [
        id,
        validDirection(value.clone()),
      ]),
    ),
    frames: Object.fromEntries(
      Object.entries(frames).map(([id, value]) => [
        id,
        validFrame(value.clone()),
      ]),
    ),
  };
}

function testRig(
  bindDirections: Partial<Record<RetargetBoneId, THREE.Vector3>>,
  bindBodyWorldRotation = new THREE.Quaternion(),
): RetargetRig {
  const rotations = Object.fromEntries(
    BODY_BONE_CONFIG.map((config) => [
      config.bone,
      new THREE.Quaternion(),
    ]),
  );
  return {
    worldBindDirections: bindDirections,
    worldBindRotations: rotations,
    bindBodyWorldRotation,
  } as unknown as RetargetRig;
}

function targetFor(
  rig: RetargetRig,
  source: BodyObservation,
  referenceTorso: THREE.Quaternion,
  boneId: RetargetBoneId,
): THREE.Quaternion {
  const reference = createReferencePose({ torso: referenceTorso }, 0);
  const target = solveBodyWorldTargets(rig, source, reference).find(
    (candidate) => candidate.boneId === boneId,
  );
  expect(target).toBeDefined();
  return target!.rotation;
}

describe("direction-based body retargeting", () => {
  it("keeps upper-arm output independent from elbow flexion", () => {
    const rig = testRig({
      leftUpperArm: new THREE.Vector3(1, 0, 0),
      leftForearm: new THREE.Vector3(1, 0, 0),
    });
    const upper = new THREE.Vector3(0.5, -0.5, 0);
    const straight = observation({
      leftUpperArm: upper,
      leftForearm: new THREE.Vector3(1, 0, 0),
    });
    const bent = observation({
      leftUpperArm: upper,
      leftForearm: new THREE.Vector3(0, -1, 0),
    });

    expect(
      targetFor(
        rig,
        straight,
        new THREE.Quaternion(),
        "leftUpperArm",
      ).angleTo(
        targetFor(
          rig,
          bent,
          new THREE.Quaternion(),
          "leftUpperArm",
        ),
      ),
    ).toBeLessThan(1e-7);
  });

  it("aligns the bind segment with an elevated live arm", () => {
    const bindDirection = new THREE.Vector3(1, 0, 0);
    const liveDirection = new THREE.Vector3(0, 1, 0);
    const rig = testRig({ leftUpperArm: bindDirection });
    const target = targetFor(
      rig,
      observation({ leftUpperArm: liveDirection }),
      new THREE.Quaternion(),
      "leftUpperArm",
    );

    expect(
      bindDirection.clone().applyQuaternion(target).angleTo(liveDirection),
    ).toBeLessThan(1e-10);
  });

  it("maps arms down even when calibration was not a T-pose", () => {
    const bindDirection = new THREE.Vector3(1, 0, 0);
    const bodyYaw = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      0.7,
    );
    const armsDownInBodySpace = new THREE.Vector3(0, -1, 0);
    const observedDirection = armsDownInBodySpace
      .clone()
      .applyQuaternion(bodyYaw);
    const rig = testRig({ leftUpperArm: bindDirection });
    const target = targetFor(
      rig,
      observation({ leftUpperArm: observedDirection }),
      bodyYaw,
      "leftUpperArm",
    );

    expect(
      bindDirection
        .clone()
        .applyQuaternion(target)
        .angleTo(armsDownInBodySpace),
    ).toBeLessThan(1e-10);
  });

  it("uses the same body yaw for torso frames and limb directions", () => {
    const bindDirection = new THREE.Vector3(1, 0, 0);
    const yaw = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      Math.PI / 3,
    );
    const rig = testRig({ leftUpperArm: bindDirection });
    const source = observation(
      { leftUpperArm: bindDirection.clone().applyQuaternion(yaw) },
      { torso: yaw },
    );
    const reference = createReferencePose(
      { torso: new THREE.Quaternion() },
      0,
    );
    const targets = solveBodyWorldTargets(rig, source, reference);
    const arm = targets.find(
      (target) => target.boneId === "leftUpperArm",
    );
    const torso = targets.find((target) => target.boneId === "spine2");

    expect(arm).toBeDefined();
    expect(torso).toBeDefined();
    expect(
      bindDirection
        .clone()
        .applyQuaternion(arm!.rotation)
        .angleTo(bindDirection.clone().applyQuaternion(yaw)),
    ).toBeLessThan(1e-7);
    expect(torso!.rotation.angleTo(yaw)).toBeLessThan(1e-10);
  });
});
