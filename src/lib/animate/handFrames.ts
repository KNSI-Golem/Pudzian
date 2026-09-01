import * as THREE from "three";
import type { AssignedHand, DirectionResult, FrameResult } from "@/types";
import { HAND_LANDMARK } from "@/lib/mediapipe";
import {
  LEFT_FINGER_CHAINS,
  RIGHT_FINGER_CHAINS,
  type RetargetBoneId,
} from "./boneConfig";
import { worldLandmarkToVector } from "./coordinateSpace";
import { FRAME_EPSILON, frameFromUpAndForward } from "./sourceFrames";

export type HandSourceFrames = Readonly<
  Partial<Record<RetargetBoneId, FrameResult>>
>;

export type HandSourceDirections = Readonly<
  Partial<Record<RetargetBoneId, DirectionResult>>
>;

export type HandObservation = Readonly<{
  frames: HandSourceFrames;
  directions: HandSourceDirections;
}>;

function invalidFrame(): FrameResult {
  return { valid: false, reason: "missing-landmark" };
}

function invalidDirection(): DirectionResult {
  return { valid: false, reason: "missing-landmark" };
}

function handPoint(
  hand: AssignedHand,
  index: number,
): THREE.Vector3 | undefined {
  const landmark = hand.worldLandmarks[index];
  return landmark ? worldLandmarkToVector(landmark) : undefined;
}

function segmentDirection(
  start: THREE.Vector3,
  end: THREE.Vector3,
  confidence: number,
): DirectionResult {
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

export function solvePalmFrame(hand: AssignedHand): FrameResult {
  const wrist = handPoint(hand, HAND_LANDMARK.wrist);
  const index = handPoint(hand, HAND_LANDMARK.indexMcp);
  const middle = handPoint(hand, HAND_LANDMARK.middleMcp);
  const pinky = handPoint(hand, HAND_LANDMARK.pinkyMcp);
  if (!wrist || !index || !middle || !pinky) return invalidFrame();

  const palmUp = middle.clone().sub(wrist);
  const acrossPalm =
    hand.side === "left"
      ? index.clone().sub(pinky)
      : pinky.clone().sub(index);
  const palmNormal = new THREE.Vector3().crossVectors(acrossPalm, palmUp);
  return frameFromUpAndForward(
    palmUp,
    palmNormal,
    hand.stale ? hand.assignmentConfidence * 0.5 : hand.assignmentConfidence,
  );
}

export function solveHandObservation(hand: AssignedHand): HandObservation {
  const palm = solvePalmFrame(hand);
  const handBone: RetargetBoneId =
    hand.side === "left" ? "leftHand" : "rightHand";
  const frames: Partial<Record<RetargetBoneId, FrameResult>> = {
    [handBone]: palm,
  };
  const directions: Partial<Record<RetargetBoneId, DirectionResult>> = {};
  const chains =
    hand.side === "left" ? LEFT_FINGER_CHAINS : RIGHT_FINGER_CHAINS;
  const confidence = hand.stale
    ? hand.assignmentConfidence * 0.5
    : hand.assignmentConfidence;

  for (const chain of chains) {
    chain.bones.forEach((boneId, segmentIndex) => {
      const start = handPoint(hand, chain.landmarks[segmentIndex]);
      const end = handPoint(hand, chain.landmarks[segmentIndex + 1]);
      directions[boneId] =
        start && end
          ? segmentDirection(start, end, confidence)
          : invalidDirection();
    });
  }

  return { frames, directions };
}
