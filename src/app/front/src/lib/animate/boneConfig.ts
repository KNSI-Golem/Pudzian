import { ModelAnimConfig } from '@/types';

// Oczyszczony schemat: Lewa struktura logiczna MediaPipe (prawa strona ekranu) mapuje się do Lewej Kości modelu
// W przypadku Mixamo bez prefixów Assimp:
export const ANIM_JOINTS_CONFIG: ModelAnimConfig = {
  hips: "mixamorigHips",
  spine: "mixamorigSpine",
  spine1: "mixamorigSpine1",
  spine2: "mixamorigSpine2",
  neck: "mixamorigNeck",
  head: "mixamorigHead",
  shoulderLeft: "mixamorigLeftShoulder",
  shoulderRight: "mixamorigRightShoulder",
  
  upLegLeft: "mixamorigLeftUpLeg",
  legLeft: "mixamorigLeftLeg",
  footLeft: "mixamorigLeftFoot",
  upLegRight: "mixamorigRightUpLeg",
  legRight: "mixamorigRightLeg",
  footRight: "mixamorigRightFoot",

  armLeft: "mixamorigLeftArm",
  foreArmLeft: "mixamorigLeftForeArm",
  handLeft: "mixamorigLeftHand",
  
  armRight: "mixamorigRightArm",
  foreArmRight: "mixamorigRightForeArm",
  handRight: "mixamorigRightHand",

  thumbThumb1Left: "mixamorigLeftHandThumb1",
  thumbThumb2Left: "mixamorigLeftHandThumb2",
  thumbThumb3Left: "mixamorigLeftHandThumb3",
  index1Left: "mixamorigLeftHandIndex1",
  index2Left: "mixamorigLeftHandIndex2",
  index3Left: "mixamorigLeftHandIndex3",
  middle1Left: "mixamorigLeftHandMiddle1",
  middle2Left: "mixamorigLeftHandMiddle2",
  middle3Left: "mixamorigLeftHandMiddle3",
  ring1Left: "mixamorigLeftHandRing1",
  ring2Left: "mixamorigLeftHandRing2",
  ring3Left: "mixamorigLeftHandRing3",
  pinky1Left: "mixamorigLeftHandPinky1",
  pinky2Left: "mixamorigLeftHandPinky2",
  pinky3Left: "mixamorigLeftHandPinky3",

  thumbThumb1Right: "mixamorigRightHandThumb1",
  thumbThumb2Right: "mixamorigRightHandThumb2",
  thumbThumb3Right: "mixamorigRightHandThumb3",
  index1Right: "mixamorigRightHandIndex1",
  index2Right: "mixamorigRightHandIndex2",
  index3Right: "mixamorigRightHandIndex3",
  middle1Right: "mixamorigRightHandMiddle1",
  middle2Right: "mixamorigRightHandMiddle2",
  middle3Right: "mixamorigRightHandMiddle3",
  ring1Right: "mixamorigRightHandRing1",
  ring2Right: "mixamorigRightHandRing2",
  ring3Right: "mixamorigRightHandRing3",
  pinky1Right: "mixamorigRightHandPinky1",
  pinky2Right: "mixamorigRightHandPinky2",
  pinky3Right: "mixamorigRightHandPinky3",
};

export const LIMB_CONFIGS = [
    { name: ANIM_JOINTS_CONFIG.armLeft, process: 'arm_left' },
    { name: ANIM_JOINTS_CONFIG.upLegLeft, process: 'upleg_left' },
    { name: ANIM_JOINTS_CONFIG.legLeft, process: 'leg_left' },
    { name: ANIM_JOINTS_CONFIG.footLeft, process: 'foot_left' },
    
    { name: ANIM_JOINTS_CONFIG.armRight, process: 'arm_right' },
    { name: ANIM_JOINTS_CONFIG.upLegRight, process: 'upleg_right' },
    { name: ANIM_JOINTS_CONFIG.legRight, process: 'leg_right' },
    { name: ANIM_JOINTS_CONFIG.footRight, process: 'foot_right' }
];

export const FINGER_PAIRS_LEFT = [
    { name: ANIM_JOINTS_CONFIG.thumbThumb1Left, pStart: 1, pEnd: 2 },
    { name: ANIM_JOINTS_CONFIG.thumbThumb2Left, pStart: 2, pEnd: 3 },
    { name: ANIM_JOINTS_CONFIG.thumbThumb3Left, pStart: 3, pEnd: 4 },
    { name: ANIM_JOINTS_CONFIG.index1Left, pStart: 5, pEnd: 6 },
    { name: ANIM_JOINTS_CONFIG.index2Left, pStart: 6, pEnd: 7 },
    { name: ANIM_JOINTS_CONFIG.index3Left, pStart: 7, pEnd: 8 },
    { name: ANIM_JOINTS_CONFIG.middle1Left, pStart: 9, pEnd: 10 },
    { name: ANIM_JOINTS_CONFIG.middle2Left, pStart: 10, pEnd: 11 },
    { name: ANIM_JOINTS_CONFIG.middle3Left, pStart: 11, pEnd: 12 },
    { name: ANIM_JOINTS_CONFIG.ring1Left, pStart: 13, pEnd: 14 },
    { name: ANIM_JOINTS_CONFIG.ring2Left, pStart: 14, pEnd: 15 },
    { name: ANIM_JOINTS_CONFIG.ring3Left, pStart: 15, pEnd: 16 },
    { name: ANIM_JOINTS_CONFIG.pinky1Left, pStart: 17, pEnd: 18 },
    { name: ANIM_JOINTS_CONFIG.pinky2Left, pStart: 18, pEnd: 19 },
    { name: ANIM_JOINTS_CONFIG.pinky3Left, pStart: 19, pEnd: 20 },
];

export const FINGER_PAIRS_RIGHT = [
    { name: ANIM_JOINTS_CONFIG.thumbThumb1Right, pStart: 1, pEnd: 2 },
    { name: ANIM_JOINTS_CONFIG.thumbThumb2Right, pStart: 2, pEnd: 3 },
    { name: ANIM_JOINTS_CONFIG.thumbThumb3Right, pStart: 3, pEnd: 4 },
    { name: ANIM_JOINTS_CONFIG.index1Right, pStart: 5, pEnd: 6 },
    { name: ANIM_JOINTS_CONFIG.index2Right, pStart: 6, pEnd: 7 },
    { name: ANIM_JOINTS_CONFIG.index3Right, pStart: 7, pEnd: 8 },
    { name: ANIM_JOINTS_CONFIG.middle1Right, pStart: 9, pEnd: 10 },
    { name: ANIM_JOINTS_CONFIG.middle2Right, pStart: 10, pEnd: 11 },
    { name: ANIM_JOINTS_CONFIG.middle3Right, pStart: 11, pEnd: 12 },
    { name: ANIM_JOINTS_CONFIG.ring1Right, pStart: 13, pEnd: 14 },
    { name: ANIM_JOINTS_CONFIG.ring2Right, pStart: 14, pEnd: 15 },
    { name: ANIM_JOINTS_CONFIG.ring3Right, pStart: 15, pEnd: 16 },
    { name: ANIM_JOINTS_CONFIG.pinky1Right, pStart: 17, pEnd: 18 },
    { name: ANIM_JOINTS_CONFIG.pinky2Right, pStart: 18, pEnd: 19 },
    { name: ANIM_JOINTS_CONFIG.pinky3Right, pStart: 19, pEnd: 20 },
];
