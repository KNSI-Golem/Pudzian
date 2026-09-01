import type * as THREE from "three";
export type FrameFailureReason =
  | "missing-landmark"
  | "low-confidence"
  | "zero-length"
  | "collinear"
  | "non-finite";

export type FrameResult =
  | {
      valid: true;
      rotation: THREE.Quaternion;
      confidence: number;
    }
  | {
      valid: false;
      reason: FrameFailureReason;
    };

export type DirectionResult =
  | {
      valid: true;
      direction: THREE.Vector3;
      confidence: number;
    }
  | {
      valid: false;
      reason: FrameFailureReason;
    };

export type SmoothingProfile = "torso" | "limb" | "hand" | "fallback";

export type FallbackPolicy = Readonly<{
  holdMs: number;
  returnToBindMs: number;
}>;
