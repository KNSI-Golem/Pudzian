import * as THREE from "three";
import type { BoneWorldTarget } from "./bodyRetarget";
import type { HandObservation } from "./handFrames";
import { frameFromUpAndForward } from "./sourceFrames";
import type { RetargetRig } from "./rig";
import type { RetargetBoneId } from "./boneConfig";

export type HandReferencePose = Readonly<{
  capturedAtMs: number;
  handBone: "leftHand" | "rightHand";
  sourcePalmWorld: THREE.Quaternion;
  targetPalmFrameWorld: THREE.Quaternion;
  palmToHandBone: THREE.Quaternion;
}>;

export function mapSourceFrameToTargetFrame(
  liveSource: THREE.Quaternion,
  referenceSource: THREE.Quaternion,
  referenceTarget: THREE.Quaternion,
): THREE.Quaternion {
  return referenceTarget
    .clone()
    .multiply(referenceSource.clone().invert())
    .multiply(liveSource)
    .normalize();
}

export function deterministicTargetPalmFrame(
  rig: RetargetRig,
): THREE.Quaternion {
  const bodyUp = new THREE.Vector3(0, 1, 0).applyQuaternion(
    rig.bindBodyWorldRotation,
  );
  const bodyForward = new THREE.Vector3(0, 0, 1).applyQuaternion(
    rig.bindBodyWorldRotation,
  );
  const frame = frameFromUpAndForward(bodyUp, bodyForward);
  if (!frame.valid) {
    throw new Error("The calibrated rig does not define a target palm frame");
  }
  return frame.rotation;
}

export function createHandReference(
  rig: RetargetRig,
  side: "left" | "right",
  sourcePalmWorld: THREE.Quaternion,
  capturedAtMs: number,
): HandReferencePose {
  const handBone = side === "left" ? "leftHand" : "rightHand";
  return Object.freeze({
    capturedAtMs,
    handBone,
    sourcePalmWorld: sourcePalmWorld.clone().normalize(),
    targetPalmFrameWorld: deterministicTargetPalmFrame(rig),
    palmToHandBone: rig.bindPalmWorldRotations[side]
      .clone()
      .invert()
      .multiply(rig.worldBindRotations[handBone])
      .normalize(),
  });
}

export function solveHandWorldTargets(
  rig: RetargetRig,
  observation: HandObservation,
  reference: HandReferencePose,
): readonly BoneWorldTarget[] {
  const palm = observation.frames[reference.handBone];
  if (!palm?.valid) return [];

  const liveTargetPalm = mapSourceFrameToTargetFrame(
    palm.rotation,
    reference.sourcePalmWorld,
    reference.targetPalmFrameWorld,
  );
  const targets: BoneWorldTarget[] = [{
    boneId: reference.handBone,
    rotation: liveTargetPalm
      .clone()
      .multiply(reference.palmToHandBone)
      .normalize(),
  }];
  const inverseSourcePalm = palm.rotation.clone().invert();

  for (const [boneId, result] of Object.entries(
    observation.directions,
  ) as [RetargetBoneId, HandObservation["directions"][RetargetBoneId]][]) {
    const bindDirection = rig.worldBindDirections[boneId];
    if (!result?.valid || !bindDirection) continue;
    const sourcePalmLocalDirection = result.direction
      .clone()
      .applyQuaternion(inverseSourcePalm);
    const mappedDirection = sourcePalmLocalDirection
      .applyQuaternion(liveTargetPalm)
      .normalize();
    const swing = new THREE.Quaternion().setFromUnitVectors(
      bindDirection,
      mappedDirection,
    );
    targets.push({
      boneId,
      rotation: swing
        .multiply(rig.worldBindRotations[boneId])
        .normalize(),
    });
  }

  return targets;
}
