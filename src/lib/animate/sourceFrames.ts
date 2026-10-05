import * as THREE from "three";
import type { FrameFailureReason, FrameResult } from "@/types";

export const FRAME_EPSILON = 1e-6;
export const COLLINEAR_EPSILON = 1e-4;

const PALM_LOCAL_INWARD = new THREE.Vector3(0, 0, -1);

export function hingeFromPalmSpread(
  spreadDirection: THREE.Vector3,
): THREE.Vector3 | undefined {
  const planar = new THREE.Vector3(
    spreadDirection.x,
    spreadDirection.y,
    0,
  );
  if (planar.lengthSq() < COLLINEAR_EPSILON) return undefined;
  return new THREE.Vector3()
    .crossVectors(planar.normalize(), PALM_LOCAL_INWARD)
    .normalize();
}

export function frameFromDirectionAndHinge(
  direction: THREE.Vector3,
  hinge: THREE.Vector3,
  confidence = 1,
): FrameResult {
  return frameFromUpAndForward(
    direction,
    new THREE.Vector3().crossVectors(hinge, direction),
    confidence,
  );
}

function invalid(reason: FrameFailureReason): FrameResult {
  return { valid: false, reason };
}

function isFiniteVector(vector: THREE.Vector3): boolean {
  return (
    Number.isFinite(vector.x) &&
    Number.isFinite(vector.y) &&
    Number.isFinite(vector.z)
  );
}

/**
 * Builds a right-handed anatomical frame whose Y axis follows `upCandidate`
 * and whose Z axis is the orthogonalized `forwardCandidate`.
 */
export function frameFromUpAndForward(
  upCandidate: THREE.Vector3,
  forwardCandidate: THREE.Vector3,
  confidence = 1,
): FrameResult {
  if (!isFiniteVector(upCandidate) || !isFiniteVector(forwardCandidate)) {
    return invalid("non-finite");
  }

  if (
    upCandidate.lengthSq() < FRAME_EPSILON ||
    forwardCandidate.lengthSq() < FRAME_EPSILON
  ) {
    return invalid("zero-length");
  }

  const yAxis = upCandidate.clone().normalize();
  const zAxis = forwardCandidate.clone().normalize();
  zAxis.addScaledVector(yAxis, -zAxis.dot(yAxis));

  if (zAxis.lengthSq() < COLLINEAR_EPSILON) {
    return invalid("collinear");
  }

  zAxis.normalize();
  const xAxis = new THREE.Vector3().crossVectors(yAxis, zAxis).normalize();
  zAxis.crossVectors(xAxis, yAxis).normalize();

  const basis = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
  const determinant = new THREE.Matrix3().setFromMatrix4(basis).determinant();
  if (!Number.isFinite(determinant) || Math.abs(determinant - 1) > 1e-5) {
    return invalid("non-finite");
  }

  return {
    valid: true,
    rotation: new THREE.Quaternion().setFromRotationMatrix(basis).normalize(),
    confidence: THREE.MathUtils.clamp(confidence, 0, 1),
  };
}

/**
 * Builds a limb frame from its primary direction and bending-plane reference.
 * When the plane is unobservable, the caller must provide an anatomical
 * fallback instead of allowing this function to invent a global axis.
 */
export function frameFromPrimaryAndPlane(
  primaryDirection: THREE.Vector3,
  planeDirection: THREE.Vector3,
  confidence = 1,
): FrameResult {
  if (
    primaryDirection.lengthSq() < FRAME_EPSILON ||
    planeDirection.lengthSq() < FRAME_EPSILON
  ) {
    return invalid("zero-length");
  }

  const normal = new THREE.Vector3().crossVectors(
    primaryDirection.clone().normalize(),
    planeDirection.clone().normalize(),
  );
  if (normal.lengthSq() < COLLINEAR_EPSILON) {
    return invalid("collinear");
  }

  return frameFromUpAndForward(primaryDirection, normal, confidence);
}

// Fitting the knuckle row avoids using one noisy edge as the palm width.
export function palmAxes(
  wrist: THREE.Vector3,
  knuckles: readonly THREE.Vector3[],
): { up: THREE.Vector3; across: THREE.Vector3 } {
  const up = knuckles[1].clone().sub(wrist);
  const across = new THREE.Vector3();
  for (const [index, point] of knuckles.entries()) {
    across.addScaledVector(point, 1.5 - index);
  }
  return {
    up,
    across: across.multiplyScalar(0.6),
  };
}

export function frameFromPalm(
  wrist: THREE.Vector3,
  knuckles: readonly THREE.Vector3[],
  side: "left" | "right",
  confidence = 1,
): FrameResult {
  const { up, across } = palmAxes(wrist, knuckles);
  return frameFromPrimaryAndPlane(up, across.multiplyScalar(side === "left" ? -1 : 1), confidence);
}
