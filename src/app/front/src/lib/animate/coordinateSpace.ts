import * as THREE from "three";
import type { Landmark } from "@mediapipe/tasks-vision";

/**
 * MediaPipe world coordinates use +Y down and increasing Z away from the
 * camera. The avatar uses +Y up and +Z toward the camera. This proper rotation
 * (determinant +1) keeps anatomical left/right identity unchanged.
 */
export const MEDIAPIPE_TO_THREE = Object.freeze(
  new THREE.Matrix3().set(
    1, 0, 0,
    0, -1, 0,
    0, 0, -1,
  ),
);

export function worldLandmarkToVector(
  landmark: Landmark,
): THREE.Vector3 {
  return new THREE.Vector3(landmark.x, -landmark.y, -landmark.z);
}

export function transformMediaPipeDirection(
  direction: THREE.Vector3,
): THREE.Vector3 {
  return direction.clone().applyMatrix3(MEDIAPIPE_TO_THREE);
}
