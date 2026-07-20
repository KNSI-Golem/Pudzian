import * as THREE from "three";

export function calibratedTargetWorldRotation(
  liveSourceWorld: THREE.Quaternion,
  referenceSourceWorld: THREE.Quaternion,
  bindBoneWorld: THREE.Quaternion,
  weight = 1,
): THREE.Quaternion {
  const sourceDelta = liveSourceWorld
    .clone()
    .multiply(referenceSourceWorld.clone().invert())
    .normalize();

  if (weight !== 1) {
    sourceDelta.slerpQuaternions(
      new THREE.Quaternion(),
      sourceDelta,
      THREE.MathUtils.clamp(weight, 0, 1),
    );
  }

  return sourceDelta.multiply(bindBoneWorld).normalize();
}

export function worldToParentLocalRotation(
  parentWorld: THREE.Quaternion,
  targetWorld: THREE.Quaternion,
): THREE.Quaternion {
  return parentWorld
    .clone()
    .invert()
    .multiply(targetWorld)
    .normalize();
}

export function calibratedTargetLocalRotation(
  liveSourceWorld: THREE.Quaternion,
  referenceSourceWorld: THREE.Quaternion,
  bindBoneWorld: THREE.Quaternion,
  currentParentWorld: THREE.Quaternion,
  weight = 1,
): THREE.Quaternion {
  return worldToParentLocalRotation(
    currentParentWorld,
    calibratedTargetWorldRotation(
      liveSourceWorld,
      referenceSourceWorld,
      bindBoneWorld,
      weight,
    ),
  );
}
