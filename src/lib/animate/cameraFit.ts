import * as THREE from "three";

export type CameraFit = Readonly<{
  target: THREE.Vector3;
  position: THREE.Vector3;
  near: number;
  far: number;
}>;

export function calculateCameraFit(
  bounds: THREE.Box3,
  verticalFovDegrees: number,
  aspect: number,
  margin = 1.15,
): CameraFit {
  if (bounds.isEmpty()) {
    throw new Error("Cannot fit a camera to empty model bounds");
  }
  const size = bounds.getSize(new THREE.Vector3());
  const target = bounds.getCenter(new THREE.Vector3());
  const safeAspect = Math.max(aspect, 1e-6);
  const verticalFov = THREE.MathUtils.degToRad(verticalFovDegrees);
  const horizontalFov = 2 * Math.atan(
    Math.tan(verticalFov / 2) * safeAspect,
  );
  const verticalDistance =
    size.y / (2 * Math.tan(verticalFov / 2));
  const horizontalDistance =
    size.x / (2 * Math.tan(horizontalFov / 2));
  const distance =
    Math.max(verticalDistance, horizontalDistance) * margin +
    size.z / 2;
  const radius = Math.max(size.length() / 2, 0.01);

  return {
    target,
    position: target.clone().add(new THREE.Vector3(0, 0, distance)),
    near: Math.max(distance - radius * 1.5, 0.01),
    far: Math.max(distance + radius * 1.5, 10),
  };
}

export function fitPerspectiveCameraToBounds(
  camera: THREE.PerspectiveCamera,
  bounds: THREE.Box3,
): void {
  const fit = calculateCameraFit(bounds, camera.fov, camera.aspect);
  camera.position.copy(fit.position);
  camera.near = fit.near;
  camera.far = fit.far;
  camera.lookAt(fit.target);
  camera.updateProjectionMatrix();
}
