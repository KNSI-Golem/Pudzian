import * as THREE from "three";
import type { AssignedHand, TrackingFrame } from "@/types";
import { HAND_LANDMARK } from "@/lib/mediapipe";
import type { FingerChainConfig } from "./boneConfig";
import { worldLandmarkToVector } from "./coordinateSpace";
import { frameFromPalm } from "./sourceFrames";

const MIN_HAND_SPAN = 1e-6;
const MIN_SEGMENT_LENGTH = 0.01;

export type HandObservation = Readonly<{
  side: "left" | "right";
  palmWorldRotation: THREE.Quaternion;
  screenPoints: readonly THREE.Vector2[];
  worldPalmPoints: readonly THREE.Vector3[];
}>;

function imagePoint(
  hand: AssignedHand,
  index: number,
  imageSize: TrackingFrame["imageSize"],
): THREE.Vector3 {
  const point = hand.imageLandmarks[index];
  return new THREE.Vector3(
    point.x,
    -point.y * imageSize.height / imageSize.width,
    -point.z,
  );
}

function normalizedPalmPoints(
  points: readonly THREE.Vector3[],
  wristIndex: number,
  knuckleIndices: readonly number[],
  side: "left" | "right",
): readonly THREE.Vector3[] | undefined {
  const wrist = points[wristIndex];
  const knuckles = knuckleIndices.map((index) => points[index]);
  const span = Math.max(
    wrist.distanceTo(knuckles[1]),
    knuckles[0].distanceTo(knuckles[3]),
  );
  if (span <= MIN_HAND_SPAN) return undefined;

  const palm = frameFromPalm(wrist, knuckles, side);
  if (!palm.valid) return undefined;
  const inversePalm = palm.rotation.clone().invert();

  return Object.freeze(
    points.map((point) =>
      point
        .clone()
        .sub(wrist)
        .divideScalar(span)
        .applyQuaternion(inversePalm),
    ),
  );
}

function directionsFromPoints(
  points: readonly THREE.Vector3[],
  chain: FingerChainConfig,
): readonly [THREE.Vector3, THREE.Vector3, THREE.Vector3] | undefined {
  const directions = chain.bones.map((_, index) =>
    points[chain.landmarks[index + 1]]
      .clone()
      .sub(points[chain.landmarks[index]]),
  );

  if (
    directions.some(
      (direction) =>
        !direction.toArray().every(Number.isFinite) ||
        direction.length() < MIN_SEGMENT_LENGTH,
    )
  ) {
    return undefined;
  }

  return directions.map((direction) =>
    direction.normalize(),
  ) as [THREE.Vector3, THREE.Vector3, THREE.Vector3];
}

// Image landmarks set the camera frame; world landmarks supply intrinsic shape.
export function solveHandObservation(
  hand: AssignedHand,
  imageSize: TrackingFrame["imageSize"],
): HandObservation | undefined {
  if (
    hand.stale ||
    hand.imageLandmarks.length !== 21 ||
    hand.worldLandmarks.length !== 21 ||
    !Number.isFinite(imageSize.width) ||
    !Number.isFinite(imageSize.height) ||
    imageSize.width <= 0 ||
    imageSize.height <= 0
  ) {
    return undefined;
  }

  const imagePoints = hand.imageLandmarks.map((_, index) =>
    imagePoint(hand, index, imageSize),
  );
  const worldPoints = hand.worldLandmarks.map(worldLandmarkToVector);
  if (
    imagePoints.some((point) => !point.toArray().every(Number.isFinite)) ||
    worldPoints.some((point) => !point.toArray().every(Number.isFinite))
  ) {
    return undefined;
  }

  const wrist = imagePoints[HAND_LANDMARK.wrist];
  const knuckleIndices = [
    HAND_LANDMARK.indexMcp,
    HAND_LANDMARK.middleMcp,
    HAND_LANDMARK.ringMcp,
    HAND_LANDMARK.pinkyMcp,
  ] as const;
  const knuckles = knuckleIndices.map((index) => imagePoints[index]);
  const imageSpan = Math.max(
    wrist.distanceTo(knuckles[1]),
    knuckles[0].distanceTo(knuckles[3]),
  );
  if (imageSpan <= MIN_HAND_SPAN) return undefined;

  const palm = frameFromPalm(
    wrist,
    knuckles,
    hand.side,
    hand.assignmentConfidence,
  );
  if (!palm.valid) return undefined;

  const worldPalmPoints = normalizedPalmPoints(
    worldPoints,
    HAND_LANDMARK.wrist,
    knuckleIndices,
    hand.side,
  );
  if (!worldPalmPoints) return undefined;

  return Object.freeze({
    side: hand.side,
    palmWorldRotation: palm.rotation.clone().normalize(),
    screenPoints: Object.freeze(
      imagePoints.map((point) =>
        new THREE.Vector2(
          (point.x - wrist.x) / imageSpan,
          (point.y - wrist.y) / imageSpan,
        ),
      ),
    ),
    worldPalmPoints,
  });
}

export function worldFingerDirections(
  observation: HandObservation,
  chain: FingerChainConfig,
): readonly [THREE.Vector3, THREE.Vector3, THREE.Vector3] | undefined {
  return directionsFromPoints(observation.worldPalmPoints, chain);
}

// Preserve image connector azimuths; world geometry supplies depth inclination.
export function fingerDirections(
  observation: HandObservation,
  chain: FingerChainConfig,
): readonly [THREE.Vector3, THREE.Vector3, THREE.Vector3] | undefined {
  const worldDirections = worldFingerDirections(observation, chain);
  if (!worldDirections) return undefined;

  const inversePalm = observation.palmWorldRotation.clone().invert();
  const result: THREE.Vector3[] = [];

  for (const [index, worldDirection] of worldDirections.entries()) {
    const screenDelta = observation.screenPoints[chain.landmarks[index + 1]]
      .clone()
      .sub(observation.screenPoints[chain.landmarks[index]]);
    if (screenDelta.length() < MIN_SEGMENT_LENGTH) {
      // Near the optical axis, the screen connector has no observable direction.
      result.push(worldDirection.clone());
      continue;
    }
    screenDelta.normalize();

    const worldDirectionCamera = worldDirection
      .clone()
      .applyQuaternion(observation.palmWorldRotation)
      .normalize();
    const transverseMagnitude = Math.hypot(
      worldDirectionCamera.x,
      worldDirectionCamera.y,
    );

    result.push(
      new THREE.Vector3(
        screenDelta.x * transverseMagnitude,
        screenDelta.y * transverseMagnitude,
        THREE.MathUtils.clamp(worldDirectionCamera.z, -1, 1),
      )
        .normalize()
        .applyQuaternion(inversePalm)
        .normalize(),
    );
  }

  return result as [THREE.Vector3, THREE.Vector3, THREE.Vector3];
}
