import { HAND_LANDMARK, type HandLandmarkIndex } from "@/lib/mediapipe";
import type { FallbackPolicy, SmoothingProfile } from "@/types";

export const MIXAMO_BONE_NAMES = {
  hips: "mixamorig:Hips",
  spine: "mixamorig:Spine",
  spine1: "mixamorig:Spine1",
  spine2: "mixamorig:Spine2",
  neck: "mixamorig:Neck",
  head: "mixamorig:Head",
  leftShoulder: "mixamorig:LeftShoulder",
  leftUpperArm: "mixamorig:LeftArm",
  leftForearm: "mixamorig:LeftForeArm",
  leftHand: "mixamorig:LeftHand",
  rightShoulder: "mixamorig:RightShoulder",
  rightUpperArm: "mixamorig:RightArm",
  rightForearm: "mixamorig:RightForeArm",
  rightHand: "mixamorig:RightHand",
  leftUpperLeg: "mixamorig:LeftUpLeg",
  leftLowerLeg: "mixamorig:LeftLeg",
  leftFoot: "mixamorig:LeftFoot",
  rightUpperLeg: "mixamorig:RightUpLeg",
  rightLowerLeg: "mixamorig:RightLeg",
  rightFoot: "mixamorig:RightFoot",
  leftThumb1: "mixamorig:LeftHandThumb1",
  leftThumb2: "mixamorig:LeftHandThumb2",
  leftThumb3: "mixamorig:LeftHandThumb3",
  leftIndex1: "mixamorig:LeftHandIndex1",
  leftIndex2: "mixamorig:LeftHandIndex2",
  leftIndex3: "mixamorig:LeftHandIndex3",
  leftMiddle1: "mixamorig:LeftHandMiddle1",
  leftMiddle2: "mixamorig:LeftHandMiddle2",
  leftMiddle3: "mixamorig:LeftHandMiddle3",
  leftRing1: "mixamorig:LeftHandRing1",
  leftRing2: "mixamorig:LeftHandRing2",
  leftRing3: "mixamorig:LeftHandRing3",
  leftPinky1: "mixamorig:LeftHandPinky1",
  leftPinky2: "mixamorig:LeftHandPinky2",
  leftPinky3: "mixamorig:LeftHandPinky3",
  rightThumb1: "mixamorig:RightHandThumb1",
  rightThumb2: "mixamorig:RightHandThumb2",
  rightThumb3: "mixamorig:RightHandThumb3",
  rightIndex1: "mixamorig:RightHandIndex1",
  rightIndex2: "mixamorig:RightHandIndex2",
  rightIndex3: "mixamorig:RightHandIndex3",
  rightMiddle1: "mixamorig:RightHandMiddle1",
  rightMiddle2: "mixamorig:RightHandMiddle2",
  rightMiddle3: "mixamorig:RightHandMiddle3",
  rightRing1: "mixamorig:RightHandRing1",
  rightRing2: "mixamorig:RightHandRing2",
  rightRing3: "mixamorig:RightHandRing3",
  rightPinky1: "mixamorig:RightHandPinky1",
  rightPinky2: "mixamorig:RightHandPinky2",
  rightPinky3: "mixamorig:RightHandPinky3",
} as const;

export type RetargetBoneId = keyof typeof MIXAMO_BONE_NAMES;
export type MixamoBoneName = (typeof MIXAMO_BONE_NAMES)[RetargetBoneId];

export const REQUIRED_MIXAMO_BONES = Object.freeze(
  Object.values(MIXAMO_BONE_NAMES),
) as readonly MixamoBoneName[];

export const EXPECTED_BONE_PARENTS: Readonly<
  Partial<Record<RetargetBoneId, RetargetBoneId>>
> = Object.freeze({
  spine: "hips",
  spine1: "spine",
  spine2: "spine1",
  neck: "spine2",
  head: "neck",
  leftShoulder: "spine2",
  leftUpperArm: "leftShoulder",
  leftForearm: "leftUpperArm",
  leftHand: "leftForearm",
  rightShoulder: "spine2",
  rightUpperArm: "rightShoulder",
  rightForearm: "rightUpperArm",
  rightHand: "rightForearm",
  leftUpperLeg: "hips",
  leftLowerLeg: "leftUpperLeg",
  leftFoot: "leftLowerLeg",
  rightUpperLeg: "hips",
  rightLowerLeg: "rightUpperLeg",
  rightFoot: "rightLowerLeg",
  leftThumb1: "leftHand",
  leftThumb2: "leftThumb1",
  leftThumb3: "leftThumb2",
  leftIndex1: "leftHand",
  leftIndex2: "leftIndex1",
  leftIndex3: "leftIndex2",
  leftMiddle1: "leftHand",
  leftMiddle2: "leftMiddle1",
  leftMiddle3: "leftMiddle2",
  leftRing1: "leftHand",
  leftRing2: "leftRing1",
  leftRing3: "leftRing2",
  leftPinky1: "leftHand",
  leftPinky2: "leftPinky1",
  leftPinky3: "leftPinky2",
  rightThumb1: "rightHand",
  rightThumb2: "rightThumb1",
  rightThumb3: "rightThumb2",
  rightIndex1: "rightHand",
  rightIndex2: "rightIndex1",
  rightIndex3: "rightIndex2",
  rightMiddle1: "rightHand",
  rightMiddle2: "rightMiddle1",
  rightMiddle3: "rightMiddle2",
  rightRing1: "rightHand",
  rightRing2: "rightRing1",
  rightRing3: "rightRing2",
  rightPinky1: "rightHand",
  rightPinky2: "rightPinky1",
  rightPinky3: "rightPinky2",
});

export const DEFAULT_FALLBACK_POLICY: FallbackPolicy = Object.freeze({
  holdMs: 150,
  returnToBindMs: 450,
});

export type SourceFrameId =
  | "hips"
  | "torso"
  | "head"
  | "leftFoot"
  | "rightFoot";

export type SourceDirectionId =
  | "leftShoulder"
  | "rightShoulder"
  | "leftUpperArm"
  | "rightUpperArm"
  | "leftForearm"
  | "rightForearm"
  | "leftUpperLeg"
  | "rightUpperLeg"
  | "leftLowerLeg"
  | "rightLowerLeg";

type BodyBoneBase = Readonly<{
  bone: RetargetBoneId;
  weight: number;
  smoothing: SmoothingProfile;
}>;

export type BodyBoneConfig =
  | (BodyBoneBase &
      Readonly<{
        mode: "frame";
        source: SourceFrameId;
      }>)
  | (BodyBoneBase &
      Readonly<{
        mode: "swing";
        source: SourceDirectionId;
        primaryChild: RetargetBoneId;
      }>);

export const BODY_BONE_CONFIG: readonly BodyBoneConfig[] = [
  { bone: "hips", mode: "frame", source: "hips", weight: 1, smoothing: "torso" },
  { bone: "spine", mode: "frame", source: "torso", weight: 0.34, smoothing: "torso" },
  { bone: "spine1", mode: "frame", source: "torso", weight: 0.67, smoothing: "torso" },
  { bone: "spine2", mode: "frame", source: "torso", weight: 1, smoothing: "torso" },
  { bone: "neck", mode: "frame", source: "head", weight: 0.4, smoothing: "torso" },
  { bone: "head", mode: "frame", source: "head", weight: 1, smoothing: "torso" },
  { bone: "leftShoulder", mode: "swing", source: "leftShoulder", primaryChild: "leftUpperArm", weight: 1, smoothing: "limb" },
  { bone: "leftUpperArm", mode: "swing", source: "leftUpperArm", primaryChild: "leftForearm", weight: 1, smoothing: "limb" },
  { bone: "leftForearm", mode: "swing", source: "leftForearm", primaryChild: "leftHand", weight: 1, smoothing: "limb" },
  { bone: "rightShoulder", mode: "swing", source: "rightShoulder", primaryChild: "rightUpperArm", weight: 1, smoothing: "limb" },
  { bone: "rightUpperArm", mode: "swing", source: "rightUpperArm", primaryChild: "rightForearm", weight: 1, smoothing: "limb" },
  { bone: "rightForearm", mode: "swing", source: "rightForearm", primaryChild: "rightHand", weight: 1, smoothing: "limb" },
  { bone: "leftUpperLeg", mode: "swing", source: "leftUpperLeg", primaryChild: "leftLowerLeg", weight: 1, smoothing: "limb" },
  { bone: "leftLowerLeg", mode: "swing", source: "leftLowerLeg", primaryChild: "leftFoot", weight: 1, smoothing: "limb" },
  { bone: "leftFoot", mode: "frame", source: "leftFoot", weight: 1, smoothing: "limb" },
  { bone: "rightUpperLeg", mode: "swing", source: "rightUpperLeg", primaryChild: "rightLowerLeg", weight: 1, smoothing: "limb" },
  { bone: "rightLowerLeg", mode: "swing", source: "rightLowerLeg", primaryChild: "rightFoot", weight: 1, smoothing: "limb" },
  { bone: "rightFoot", mode: "frame", source: "rightFoot", weight: 1, smoothing: "limb" },
] as const;

type FingerLandmarkChain = readonly [
  HandLandmarkIndex,
  HandLandmarkIndex,
  HandLandmarkIndex,
  HandLandmarkIndex,
];

export type FingerChainConfig = Readonly<{
  bones: readonly [RetargetBoneId, RetargetBoneId, RetargetBoneId];
  landmarks: FingerLandmarkChain;
  thumb: boolean;
}>;

export const LEFT_FINGER_CHAINS: readonly FingerChainConfig[] = [
  {
    bones: ["leftThumb1", "leftThumb2", "leftThumb3"],
    landmarks: [HAND_LANDMARK.thumbCmc, HAND_LANDMARK.thumbMcp, HAND_LANDMARK.thumbIp, HAND_LANDMARK.thumbTip],
    thumb: true,
  },
  {
    bones: ["leftIndex1", "leftIndex2", "leftIndex3"],
    landmarks: [HAND_LANDMARK.indexMcp, HAND_LANDMARK.indexPip, HAND_LANDMARK.indexDip, HAND_LANDMARK.indexTip],
    thumb: false,
  },
  {
    bones: ["leftMiddle1", "leftMiddle2", "leftMiddle3"],
    landmarks: [HAND_LANDMARK.middleMcp, HAND_LANDMARK.middlePip, HAND_LANDMARK.middleDip, HAND_LANDMARK.middleTip],
    thumb: false,
  },
  {
    bones: ["leftRing1", "leftRing2", "leftRing3"],
    landmarks: [HAND_LANDMARK.ringMcp, HAND_LANDMARK.ringPip, HAND_LANDMARK.ringDip, HAND_LANDMARK.ringTip],
    thumb: false,
  },
  {
    bones: ["leftPinky1", "leftPinky2", "leftPinky3"],
    landmarks: [HAND_LANDMARK.pinkyMcp, HAND_LANDMARK.pinkyPip, HAND_LANDMARK.pinkyDip, HAND_LANDMARK.pinkyTip],
    thumb: false,
  },
] as const;

export const RIGHT_FINGER_CHAINS: readonly FingerChainConfig[] =
  LEFT_FINGER_CHAINS.map((chain) => ({
    ...chain,
    bones: chain.bones.map((bone) =>
      bone.replace(/^left/, "right"),
    ) as [RetargetBoneId, RetargetBoneId, RetargetBoneId],
  }));
