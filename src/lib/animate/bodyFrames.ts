import * as THREE from "three";
import type { Landmark, NormalizedLandmark } from "@mediapipe/tasks-vision";
import { POSE_LANDMARK } from "@/lib/mediapipe";
import type {
  DirectionResult,
  FrameResult,
  PoseDetectionResult,
} from "@/types";
import type { SourceDirectionId, SourceFrameId } from "./boneConfig";
import { worldLandmarkToVector } from "./coordinateSpace";
import {
  FRAME_EPSILON,
  frameFromPrimaryAndPlane,
  frameFromUpAndForward,
} from "./sourceFrames";

export type BodySourceFrames = Readonly<
  Partial<Record<SourceFrameId, FrameResult>>
>;

export type BodySourceDirections = Readonly<
  Partial<Record<SourceDirectionId, DirectionResult>>
>;

export type BodyObservation = Readonly<{
  frames: BodySourceFrames;
  directions: BodySourceDirections;
}>;

const MIN_VISIBILITY = 0.2;

function midpoint(a: THREE.Vector3, b: THREE.Vector3): THREE.Vector3 {
  return a.clone().add(b).multiplyScalar(0.5);
}

function minimumVisibility(
  landmarks: readonly NormalizedLandmark[],
  indices: readonly number[],
): number {
  return Math.min(
    ...indices.map((index) => landmarks[index]?.visibility ?? 0),
  );
}

function missingFrame(): FrameResult {
  return { valid: false, reason: "missing-landmark" };
}

function lowConfidenceFrame(): FrameResult {
  return { valid: false, reason: "low-confidence" };
}

function missingDirection(): DirectionResult {
  return { valid: false, reason: "missing-landmark" };
}

function direction(
  start: THREE.Vector3,
  end: THREE.Vector3,
  confidence: number,
): DirectionResult {
  if (confidence < MIN_VISIBILITY) {
    return { valid: false, reason: "low-confidence" };
  }
  const value = end.clone().sub(start);
  if (
    !Number.isFinite(value.x) ||
    !Number.isFinite(value.y) ||
    !Number.isFinite(value.z)
  ) {
    return { valid: false, reason: "non-finite" };
  }
  if (value.lengthSq() < FRAME_EPSILON) {
    return { valid: false, reason: "zero-length" };
  }
  return {
    valid: true,
    direction: value.normalize(),
    confidence: THREE.MathUtils.clamp(confidence, 0, 1),
  };
}

function posePoint(
  landmarks: readonly Landmark[],
  index: number,
): THREE.Vector3 | undefined {
  const landmark = landmarks[index];
  return landmark ? worldLandmarkToVector(landmark) : undefined;
}

export function solveBodyObservation(
  pose: PoseDetectionResult,
): BodyObservation {
  const image = pose.landmarks[0];
  const world = pose.worldLandmarks[0];
  if (!image || !world) {
    return { frames: {}, directions: {} };
  }

  const p = (index: number) => posePoint(world, index);
  const leftHip = p(POSE_LANDMARK.leftHip);
  const rightHip = p(POSE_LANDMARK.rightHip);
  const leftShoulder = p(POSE_LANDMARK.leftShoulder);
  const rightShoulder = p(POSE_LANDMARK.rightShoulder);
  if (!leftHip || !rightHip || !leftShoulder || !rightShoulder) {
    return {
      frames: { hips: missingFrame(), torso: missingFrame() },
      directions: {},
    };
  }

  const hipMidpoint = midpoint(leftHip, rightHip);
  const shoulderMidpoint = midpoint(leftShoulder, rightShoulder);
  const torsoUp = shoulderMidpoint.clone().sub(hipMidpoint);
  const hipLateral = leftHip.clone().sub(rightHip);
  const torsoLateral = leftShoulder.clone().sub(rightShoulder);
  const hipForward = new THREE.Vector3().crossVectors(hipLateral, torsoUp);
  const torsoForward = new THREE.Vector3().crossVectors(
    torsoLateral,
    torsoUp,
  );
  const torsoConfidence = minimumVisibility(image, [
    POSE_LANDMARK.leftHip,
    POSE_LANDMARK.rightHip,
    POSE_LANDMARK.leftShoulder,
    POSE_LANDMARK.rightShoulder,
  ]);
  const torso =
    torsoConfidence < MIN_VISIBILITY
      ? lowConfidenceFrame()
      : frameFromUpAndForward(torsoUp, torsoForward, torsoConfidence);
  const hips =
    torsoConfidence < MIN_VISIBILITY
      ? lowConfidenceFrame()
      : frameFromUpAndForward(torsoUp, hipForward, torsoConfidence);

  const frames: Partial<Record<SourceFrameId, FrameResult>> = {
    hips,
    torso,
  };
  const directions: Partial<Record<SourceDirectionId, DirectionResult>> = {
    leftShoulder: direction(
      shoulderMidpoint,
      leftShoulder,
      minimumVisibility(image, [
        POSE_LANDMARK.leftShoulder,
        POSE_LANDMARK.rightShoulder,
      ]),
    ),
    rightShoulder: direction(
      shoulderMidpoint,
      rightShoulder,
      minimumVisibility(image, [
        POSE_LANDMARK.leftShoulder,
        POSE_LANDMARK.rightShoulder,
      ]),
    ),
  };

  const solveArm = (side: "left" | "right"): void => {
    const shoulder = side === "left" ? leftShoulder : rightShoulder;
    const shoulderIndex =
      side === "left"
        ? POSE_LANDMARK.leftShoulder
        : POSE_LANDMARK.rightShoulder;
    const elbowIndex =
      side === "left" ? POSE_LANDMARK.leftElbow : POSE_LANDMARK.rightElbow;
    const wristIndex =
      side === "left" ? POSE_LANDMARK.leftWrist : POSE_LANDMARK.rightWrist;
    const elbow = p(elbowIndex);
    const wrist = p(wristIndex);
    const upperId = `${side}UpperArm` as SourceDirectionId;
    const forearmId = `${side}Forearm` as SourceDirectionId;
    directions[upperId] = elbow
      ? direction(
          shoulder,
          elbow,
          minimumVisibility(image, [shoulderIndex, elbowIndex]),
        )
      : missingDirection();
    directions[forearmId] =
      elbow && wrist
        ? direction(
            elbow,
            wrist,
            minimumVisibility(image, [elbowIndex, wristIndex]),
          )
        : missingDirection();
  };

  solveArm("left");
  solveArm("right");

  const solveLeg = (side: "left" | "right"): void => {
    const hip = side === "left" ? leftHip : rightHip;
    const hipIndex =
      side === "left" ? POSE_LANDMARK.leftHip : POSE_LANDMARK.rightHip;
    const kneeIndex =
      side === "left" ? POSE_LANDMARK.leftKnee : POSE_LANDMARK.rightKnee;
    const ankleIndex =
      side === "left" ? POSE_LANDMARK.leftAnkle : POSE_LANDMARK.rightAnkle;
    const heelIndex =
      side === "left" ? POSE_LANDMARK.leftHeel : POSE_LANDMARK.rightHeel;
    const toeIndex =
      side === "left"
        ? POSE_LANDMARK.leftFootIndex
        : POSE_LANDMARK.rightFootIndex;
    const knee = p(kneeIndex);
    const ankle = p(ankleIndex);
    const heel = p(heelIndex);
    const toe = p(toeIndex);
    const upperId = `${side}UpperLeg` as SourceDirectionId;
    const lowerId = `${side}LowerLeg` as SourceDirectionId;
    directions[upperId] = knee
      ? direction(
          hip,
          knee,
          minimumVisibility(image, [hipIndex, kneeIndex]),
        )
      : missingDirection();
    directions[lowerId] =
      knee && ankle
        ? direction(
            knee,
            ankle,
            minimumVisibility(image, [kneeIndex, ankleIndex]),
          )
        : missingDirection();

    const footId = `${side}Foot` as SourceFrameId;
    if (!ankle || !heel || !toe) {
      frames[footId] = missingFrame();
      return;
    }
    const footConfidence = minimumVisibility(image, [
      ankleIndex,
      heelIndex,
      toeIndex,
    ]);
    if (footConfidence < MIN_VISIBILITY) {
      frames[footId] = lowConfidenceFrame();
      return;
    }
    const footDirection = toe.clone().sub(heel);
    const ankleReference = ankle.clone().sub(midpoint(heel, toe));
    const observed = frameFromPrimaryAndPlane(
      footDirection,
      ankleReference,
      footConfidence,
    );
    frames[footId] = observed.valid
      ? observed
      : frameFromUpAndForward(
          footDirection,
          torsoUp,
          footConfidence,
        );
  };

  solveLeg("left");
  solveLeg("right");

  const leftEar = p(POSE_LANDMARK.leftEar);
  const rightEar = p(POSE_LANDMARK.rightEar);
  const nose = p(POSE_LANDMARK.nose);
  if (leftEar && rightEar && nose) {
    const earMidpoint = midpoint(leftEar, rightEar);
    const headLateral = leftEar.clone().sub(rightEar).normalize();
    const headForward = nose.clone().sub(earMidpoint);
    const headUp = new THREE.Vector3().crossVectors(
      headForward,
      headLateral,
    );
    const confidence = minimumVisibility(image, [
      POSE_LANDMARK.leftEar,
      POSE_LANDMARK.rightEar,
      POSE_LANDMARK.nose,
    ]);
    const headFrame =
      confidence < MIN_VISIBILITY
        ? lowConfidenceFrame()
        : frameFromUpAndForward(headUp, headForward, confidence);
    frames.head = headFrame.valid ? headFrame : torso;
  } else {
    frames.head = torso;
  }

  return { frames, directions };
}
