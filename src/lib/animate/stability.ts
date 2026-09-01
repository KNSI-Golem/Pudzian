import * as THREE from "three";
import type { FallbackPolicy, SmoothingProfile } from "@/types";
import {
  BODY_BONE_CONFIG,
  DEFAULT_FALLBACK_POLICY,
  LEFT_FINGER_CHAINS,
  RIGHT_FINGER_CHAINS,
  type RetargetBoneId,
} from "./boneConfig";

const TIME_CONSTANT_MS: Readonly<Record<SmoothingProfile, number>> = {
  torso: 90,
  limb: 75,
  hand: 55,
  fallback: 150,
};

type BoneStabilityState = {
  rotation: THREE.Quaternion;
  lastValidAtMs?: number;
};

export const BODY_BONE_ORDER = Object.freeze(
  BODY_BONE_CONFIG.map((config) => config.bone),
);

export const LEFT_HAND_BONE_ORDER = Object.freeze([
  "leftHand",
  ...LEFT_FINGER_CHAINS.flatMap((chain) => chain.bones),
] as RetargetBoneId[]);

export const RIGHT_HAND_BONE_ORDER = Object.freeze([
  "rightHand",
  ...RIGHT_FINGER_CHAINS.flatMap((chain) => chain.bones),
] as RetargetBoneId[]);

const BODY_PROFILE = new Map(
  BODY_BONE_CONFIG.map((config) => [config.bone, config.smoothing]),
);

function shortestArcTarget(
  current: THREE.Quaternion,
  target: THREE.Quaternion,
): THREE.Quaternion {
  const result = target.clone().normalize();
  if (current.dot(result) < 0) {
    result.set(-result.x, -result.y, -result.z, -result.w);
  }
  return result;
}

export function smoothingProfileForBone(
  boneId: RetargetBoneId,
): SmoothingProfile {
  return BODY_PROFILE.get(boneId) ?? "hand";
}

export class RotationStabilizer {
  private readonly states = new Map<RetargetBoneId, BoneStabilityState>();

  reset(): void {
    this.states.clear();
  }

  step(
    boneId: RetargetBoneId,
    currentLocal: THREE.Quaternion,
    targetLocal: THREE.Quaternion | undefined,
    bindLocal: THREE.Quaternion,
    timestampMs: number,
    deltaMs: number,
    profile = smoothingProfileForBone(boneId),
    fallback: FallbackPolicy = DEFAULT_FALLBACK_POLICY,
  ): THREE.Quaternion {
    const state = this.states.get(boneId) ?? {
      rotation: currentLocal.clone().normalize(),
    };
    const clampedDeltaMs = THREE.MathUtils.clamp(deltaMs, 0, 100);
    let desired: THREE.Quaternion;
    let timeConstantMs: number;

    if (targetLocal) {
      desired = targetLocal;
      state.lastValidAtMs = timestampMs;
      timeConstantMs = TIME_CONSTANT_MS[profile];
    } else if (
      state.lastValidAtMs !== undefined &&
      timestampMs - state.lastValidAtMs <= fallback.holdMs
    ) {
      this.states.set(boneId, state);
      return state.rotation.clone();
    } else {
      desired = bindLocal;
      timeConstantMs = Math.max(fallback.returnToBindMs / 3, 1);
    }

    const target = shortestArcTarget(state.rotation, desired);
    const alpha =
      timeConstantMs <= 0
        ? 1
        : 1 - Math.exp(-clampedDeltaMs / timeConstantMs);
    state.rotation.slerp(target, alpha).normalize();
    this.states.set(boneId, state);
    return state.rotation.clone();
  }
}
