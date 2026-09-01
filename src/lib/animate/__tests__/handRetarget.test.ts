import { describe, expect, it } from "vitest";
import * as THREE from "three";
import type { HandObservation } from "../handFrames";
import {
  createHandReference,
  deterministicTargetPalmFrame,
  mapSourceFrameToTargetFrame,
  solveHandWorldTargets,
  type HandReferencePose,
} from "../handRetarget";
import type { RetargetRig } from "../rig";

describe("direction-based finger retargeting", () => {
  it("derives a deterministic target palm and rig palm-to-hand offset", () => {
    const handAxisRotation = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      Math.PI / 2,
    );
    const rig = {
      worldBindRotations: { leftHand: handAxisRotation },
      bindBodyWorldRotation: new THREE.Quaternion(),
      bindPalmWorldRotations: {
        left: new THREE.Quaternion(),
        right: new THREE.Quaternion(),
      },
    } as unknown as RetargetRig;
    const reference = createHandReference(
      rig,
      "left",
      new THREE.Quaternion(),
      10,
    );

    expect(
      reference.palmToHandBone.angleTo(handAxisRotation),
    ).toBeLessThan(1e-10);
    expect(
      reference.targetPalmFrameWorld.angleTo(new THREE.Quaternion()),
    ).toBeLessThan(1e-10);
    expect(
      deterministicTargetPalmFrame(rig).angleTo(new THREE.Quaternion()),
    ).toBeLessThan(1e-10);
  });

  it("maps a finger segment through the calibrated palm space", () => {
    const sourcePalm = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      0.4,
    );
    const targetPalmFrame = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 0, 1),
      -0.3,
    );
    const targetHand = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      1.1,
    );
    const livePalm = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0.2, -0.5, 0.3),
    );
    const liveTargetPalm = mapSourceFrameToTargetFrame(
      livePalm,
      sourcePalm,
      targetPalmFrame,
    );
    const bindDirection = new THREE.Vector3(0, 1, 0);
    const palmLocalDirection = new THREE.Vector3(1, 0, 0);
    const liveDirection = palmLocalDirection
      .clone()
      .applyQuaternion(livePalm);
    const expectedDirection = palmLocalDirection
      .clone()
      .applyQuaternion(liveTargetPalm);
    const rig = {
      worldBindDirections: { leftIndex1: bindDirection },
      worldBindRotations: { leftIndex1: new THREE.Quaternion() },
    } as unknown as RetargetRig;
    const observation: HandObservation = {
      frames: {
        leftHand: {
          valid: true,
          rotation: livePalm,
          confidence: 1,
        },
      },
      directions: {
        leftIndex1: {
          valid: true,
          direction: liveDirection,
          confidence: 1,
        },
      },
    };
    const reference: HandReferencePose = {
      capturedAtMs: 0,
      handBone: "leftHand",
      sourcePalmWorld: sourcePalm,
      targetPalmFrameWorld: targetPalmFrame,
      palmToHandBone: targetPalmFrame
        .clone()
        .invert()
        .multiply(targetHand),
    };

    const fingerTarget = solveHandWorldTargets(
      rig,
      observation,
      reference,
    ).find((target) => target.boneId === "leftIndex1");
    expect(fingerTarget).toBeDefined();
    expect(
      bindDirection
        .clone()
        .applyQuaternion(fingerTarget!.rotation)
        .angleTo(expectedDirection),
    ).toBeLessThan(1e-7);
  });

  it("does not leak the hand bone axis convention into finger motion", () => {
    const bindDirection = new THREE.Vector3(0, 1, 0);
    const boneAxisRotation = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      Math.PI / 2,
    );
    const rig = {
      worldBindDirections: { leftMiddle1: bindDirection },
      worldBindRotations: { leftMiddle1: new THREE.Quaternion() },
    } as unknown as RetargetRig;
    const observation: HandObservation = {
      frames: {
        leftHand: {
          valid: true,
          rotation: new THREE.Quaternion(),
          confidence: 1,
        },
      },
      directions: {
        leftMiddle1: {
          valid: true,
          direction: bindDirection.clone(),
          confidence: 1,
        },
      },
    };
    const reference: HandReferencePose = {
      capturedAtMs: 0,
      handBone: "leftHand",
      sourcePalmWorld: new THREE.Quaternion(),
      targetPalmFrameWorld: new THREE.Quaternion(),
      palmToHandBone: boneAxisRotation,
    };

    const target = solveHandWorldTargets(
      rig,
      observation,
      reference,
    ).find((candidate) => candidate.boneId === "leftMiddle1");
    expect(target).toBeDefined();
    expect(
      bindDirection
        .clone()
        .applyQuaternion(target!.rotation)
        .angleTo(bindDirection),
    ).toBeLessThan(1e-10);
  });

  it("preserves the palm-to-hand offset for noncommuting live rotations", () => {
    const sourcePalm = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0.25, -0.4, 0.1),
    );
    const targetPalm = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(-0.3, 0.2, 0.5),
    );
    const palmToHand = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0.4, 0.15, -0.2),
    );
    const reference: HandReferencePose = {
      capturedAtMs: 0,
      handBone: "leftHand",
      sourcePalmWorld: sourcePalm,
      targetPalmFrameWorld: targetPalm,
      palmToHandBone: palmToHand,
    };
    const rig = {
      worldBindDirections: {},
      worldBindRotations: {},
    } as unknown as RetargetRig;

    for (const livePalm of [
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0.6, -0.1, 0.35)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.2, 0.7, -0.4)),
    ]) {
      const target = solveHandWorldTargets(
        rig,
        {
          frames: {
            leftHand: {
              valid: true,
              rotation: livePalm,
              confidence: 1,
            },
          },
          directions: {},
        },
        reference,
      )[0];
      const liveTargetPalm = mapSourceFrameToTargetFrame(
        livePalm,
        sourcePalm,
        targetPalm,
      );
      const observedOffset = liveTargetPalm
        .clone()
        .invert()
        .multiply(target.rotation);

      expect(observedOffset.angleTo(palmToHand)).toBeLessThan(1e-10);
    }
  });

  it("keeps a rigid finger direction fixed in live palm-local space", () => {
    const sourcePalm = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0.1, 0.3, -0.2),
    );
    const targetPalm = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(-0.4, 0.2, 0.25),
    );
    const palmLocalDirection = new THREE.Vector3(0.2, 0.95, -0.1).normalize();
    const bindDirection = new THREE.Vector3(0, 1, 0);
    const rig = {
      worldBindDirections: { leftIndex1: bindDirection },
      worldBindRotations: { leftIndex1: new THREE.Quaternion() },
    } as unknown as RetargetRig;
    const reference: HandReferencePose = {
      capturedAtMs: 0,
      handBone: "leftHand",
      sourcePalmWorld: sourcePalm,
      targetPalmFrameWorld: targetPalm,
      palmToHandBone: new THREE.Quaternion(),
    };

    for (const livePalm of [
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0.5, -0.2, 0.1)),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.3, 0.6, 0.4)),
    ]) {
      const target = solveHandWorldTargets(
        rig,
        {
          frames: {
            leftHand: {
              valid: true,
              rotation: livePalm,
              confidence: 1,
            },
          },
          directions: {
            leftIndex1: {
              valid: true,
              direction: palmLocalDirection
                .clone()
                .applyQuaternion(livePalm),
              confidence: 1,
            },
          },
        },
        reference,
      ).find((candidate) => candidate.boneId === "leftIndex1")!;
      const liveTargetPalm = mapSourceFrameToTargetFrame(
        livePalm,
        sourcePalm,
        targetPalm,
      );
      const targetPalmLocalDirection = bindDirection
        .clone()
        .applyQuaternion(target.rotation)
        .applyQuaternion(liveTargetPalm.clone().invert());

      expect(targetPalmLocalDirection.angleTo(palmLocalDirection)).toBeLessThan(
        1e-7,
      );
    }
  });
});
