import * as THREE from "three";

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
