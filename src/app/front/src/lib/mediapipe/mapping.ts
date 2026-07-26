/**
 * MediaPipe landmark identities. These indices are detector-domain data and
 * must not be coupled to target-rig bone names.
 */
export const POSE_LANDMARK = {
  nose: 0,
  leftEyeInner: 1,
  leftEye: 2,
  leftEyeOuter: 3,
  rightEyeInner: 4,
  rightEye: 5,
  rightEyeOuter: 6,
  leftEar: 7,
  rightEar: 8,
  leftMouth: 9,
  rightMouth: 10,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftPinky: 17,
  rightPinky: 18,
  leftIndex: 19,
  rightIndex: 20,
  leftThumb: 21,
  rightThumb: 22,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
  leftHeel: 29,
  rightHeel: 30,
  leftFootIndex: 31,
  rightFootIndex: 32,
} as const;

export type PoseLandmarkName = keyof typeof POSE_LANDMARK;
export type PoseLandmarkIndex = (typeof POSE_LANDMARK)[PoseLandmarkName];

export const HAND_LANDMARK = {
  wrist: 0,
  thumbCmc: 1,
  thumbMcp: 2,
  thumbIp: 3,
  thumbTip: 4,
  indexMcp: 5,
  indexPip: 6,
  indexDip: 7,
  indexTip: 8,
  middleMcp: 9,
  middlePip: 10,
  middleDip: 11,
  middleTip: 12,
  ringMcp: 13,
  ringPip: 14,
  ringDip: 15,
  ringTip: 16,
  pinkyMcp: 17,
  pinkyPip: 18,
  pinkyDip: 19,
  pinkyTip: 20,
} as const;

export type HandLandmarkName = keyof typeof HAND_LANDMARK;
export type HandLandmarkIndex = (typeof HAND_LANDMARK)[HandLandmarkName];

/**
 * Compatibility aliases for the calibration code on main. New retargeting
 * code uses POSE_LANDMARK directly.
 */
export const MEDIAPIPE_JOINTS_MAPPING: Readonly<Record<string, number>> = {
  nose: POSE_LANDMARK.nose,
  handLeft: POSE_LANDMARK.leftIndex,
  handRight: POSE_LANDMARK.rightIndex,
  foreArmLeft: POSE_LANDMARK.leftWrist,
  foreArmRight: POSE_LANDMARK.rightWrist,
  armLeft: POSE_LANDMARK.leftElbow,
  armRight: POSE_LANDMARK.rightElbow,
  shoulderLeft: POSE_LANDMARK.leftShoulder,
  shoulderRight: POSE_LANDMARK.rightShoulder,
} as const;
