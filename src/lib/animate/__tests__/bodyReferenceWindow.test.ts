import { describe, expect, it } from "vitest";
import * as THREE from "three";
import type { FrameResult } from "@/types";
import type { BodyObservation, BodySourceFrames } from "../bodyFrames";
import type { SourceFrameId } from "../boneConfig";
import { BODY_BONE_CONFIG } from "../boneConfig";
import {
  BodyCalibrationReference,
  BodyReferenceWindow,
} from "../bodyRetarget";

function completeFrames(rotation: THREE.Quaternion): BodySourceFrames {
  const frames: Partial<Record<SourceFrameId, FrameResult>> = {};
  for (const config of BODY_BONE_CONFIG) {
    if (config.mode !== "frame") continue;
    frames[config.source] = {
      valid: true,
      rotation: rotation.clone(),
      confidence: 1,
    };
  }
  return frames;
}

function observation(rotation: THREE.Quaternion): BodyObservation {
  return { frames: completeFrames(rotation), directions: {} };
}

describe("BodyReferenceWindow", () => {
  it("freezes a sign-aligned mean from complete calibration samples", () => {
    const window = new BodyReferenceWindow({
      minimumSamples: 3,
      maximumAngularDeviationRadians: 0.2,
    });
    const rotation = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      0.1,
    );
    window.add(observation(rotation), 1);
    window.add(
      observation(
        new THREE.Quaternion(
          -rotation.x,
          -rotation.y,
          -rotation.z,
          -rotation.w,
        ),
      ),
      2,
    );
    window.add(observation(rotation), 3);

    const reference = window.finish(10);
    expect(reference).toBeDefined();
    expect(
      reference?.sourceWorldRotations.torso?.angleTo(rotation),
    ).toBeLessThan(1e-10);
    expect(reference?.capturedAtMs).toBe(10);
  });

  it("rejects incomplete, duplicate, and insufficient samples", () => {
    const window = new BodyReferenceWindow({ minimumSamples: 2 });
    expect(window.add({ frames: {}, directions: {} }, 1)).toBe(false);
    expect(window.add(observation(new THREE.Quaternion()), 2)).toBe(true);
    expect(window.add(observation(new THREE.Quaternion()), 2)).toBe(false);
    expect(window.finish(3)).toBeUndefined();
  });

  it("rejects a moving calibration window", () => {
    const window = new BodyReferenceWindow({
      minimumSamples: 3,
      maximumAngularDeviationRadians: 0.1,
    });
    for (let index = 0; index < 3; index += 1) {
      window.add(
        observation(
          new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(1, 0, 0),
            index * 0.2,
          ),
        ),
        index,
      );
    }
    expect(window.finish(10)).toBeUndefined();
  });
});

describe("BodyCalibrationReference", () => {
  it("collects only during STARTED and freezes on the YES transition", () => {
    const calibration = new BodyCalibrationReference({
      minimumSamples: 2,
      maximumAngularDeviationRadians: 0.2,
    });
    const neutral = new THREE.Quaternion();
    const moving = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      1,
    );
    calibration.update("NO", observation(moving), 0);
    calibration.update("STARTED", observation(neutral), 1);
    calibration.update("STARTED", observation(neutral), 2);
    const accepted = calibration.update("YES", undefined, 3);
    const afterMovement = calibration.update(
      "YES",
      observation(moving),
      4,
    );

    expect(accepted.failed).toBe(false);
    expect(
      accepted.reference?.sourceWorldRotations.torso?.angleTo(neutral),
    ).toBe(0);
    expect(afterMovement.reference).toBe(accepted.reference);
  });

  it("signals failure once when the completed window is insufficient", () => {
    const calibration = new BodyCalibrationReference({
      minimumSamples: 2,
    });
    calibration.update("STARTED", observation(new THREE.Quaternion()), 1);
    expect(calibration.update("YES", undefined, 2).failed).toBe(true);
    expect(calibration.update("YES", undefined, 3).failed).toBe(false);
  });
});
