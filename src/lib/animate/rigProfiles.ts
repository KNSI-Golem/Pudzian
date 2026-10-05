import type { RetargetBoneId } from "./boneConfig";

export type RigProfile = Readonly<{
  bones: Readonly<Record<RetargetBoneId, string>>;
}>;
export const GOLEM_RIG: RigProfile = Object.freeze({
  bones: Object.freeze({
    hips: "pelvis",
    spine: "torso_lower",
    spine1: "torso_middle",
    spine2: "torso_upper",
    neck: "core_mount",
    head: "neural_core",
    leftShoulder: "shoulder_L",
    leftUpperArm: "upper_arm_L",
    leftForearm: "forearm_L",
    leftHand: "hand_L",
    leftUpperLeg: "thigh_L",
    leftLowerLeg: "shin_L",
    leftFoot: "foot_L",
    leftThumb1: "thumb_01_L",
    leftThumb2: "thumb_02_L",
    leftThumb3: "thumb_03_L",
    leftIndex1: "index_01_L",
    leftIndex2: "index_02_L",
    leftIndex3: "index_03_L",
    leftMiddle1: "middle_01_L",
    leftMiddle2: "middle_02_L",
    leftMiddle3: "middle_03_L",
    leftRing1: "ring_01_L",
    leftRing2: "ring_02_L",
    leftRing3: "ring_03_L",
    leftPinky1: "pinky_01_L",
    leftPinky2: "pinky_02_L",
    leftPinky3: "pinky_03_L",
    rightShoulder: "shoulder_R",
    rightUpperArm: "upper_arm_R",
    rightForearm: "forearm_R",
    rightHand: "hand_R",
    rightUpperLeg: "thigh_R",
    rightLowerLeg: "shin_R",
    rightFoot: "foot_R",
    rightThumb1: "thumb_01_R",
    rightThumb2: "thumb_02_R",
    rightThumb3: "thumb_03_R",
    rightIndex1: "index_01_R",
    rightIndex2: "index_02_R",
    rightIndex3: "index_03_R",
    rightMiddle1: "middle_01_R",
    rightMiddle2: "middle_02_R",
    rightMiddle3: "middle_03_R",
    rightRing1: "ring_01_R",
    rightRing2: "ring_02_R",
    rightRing3: "ring_03_R",
    rightPinky1: "pinky_01_R",
    rightPinky2: "pinky_02_R",
    rightPinky3: "pinky_03_R",
  }),
});

export type RetargetModelConfig = Readonly<{
  path: string;
  rig: RigProfile;
}>;


export const SELECTED_MODEL: RetargetModelConfig = Object.freeze({
  path: "/models/golem.glb",
  rig: GOLEM_RIG,
});
