import { MediapipeJointMapping } from "@/types/mediapipe";


export const MEDIAPIPE_JOINTS_MAPPING: MediapipeJointMapping = {

    // head
    "nose": 0,
    "eyeInnerLeft": 1,
    "eyeLeft": 2,
    "eyeOuterLeft": 3,
    "eyeInnerRight": 4,
    "eyeRight": 5,
    "eyeOuterRight": 6,
    "earLeft": 7,
    "earRight": 8,
    "mouthLeft": 9,
    "mouthRight": 10,

    // hands
    "handLeft": 19,
    "handRight": 20,
    "foreArmLeft": 15,     
    "foreArmRight": 16,
    "armLeft": 13,    
    "armRight": 14,
    "shoulderLeft": 11,    
    "shoulderRight": 12,

    // legs
    "hipLeft": 23,
    "hipRight": 24,
    "kneeLeft": 25,
    "kneeRight": 26,
    "ankleLeft": 27,
    "ankleRight": 28,
    "heelLeft": 29,
    "heelRight": 30,
    "toesLeft": 31,
    "toesRight": 32,

}

export const JOINT_POINTS_CONFIG: {[key: string]: number[]} = {

    "arm_left": [MEDIAPIPE_JOINTS_MAPPING.shoulderLeft, MEDIAPIPE_JOINTS_MAPPING.armLeft, MEDIAPIPE_JOINTS_MAPPING.hipLeft],
    "forearm_left": [MEDIAPIPE_JOINTS_MAPPING.armLeft, MEDIAPIPE_JOINTS_MAPPING.foreArmLeft, MEDIAPIPE_JOINTS_MAPPING.shoulderLeft],
    "knee_left": [MEDIAPIPE_JOINTS_MAPPING.hipLeft, MEDIAPIPE_JOINTS_MAPPING.kneeLeft, MEDIAPIPE_JOINTS_MAPPING.ankleLeft],
    "ankle_left": [MEDIAPIPE_JOINTS_MAPPING.kneeLeft, MEDIAPIPE_JOINTS_MAPPING.ankleLeft, MEDIAPIPE_JOINTS_MAPPING.heelLeft],
    "foot_left": [MEDIAPIPE_JOINTS_MAPPING.ankleLeft, MEDIAPIPE_JOINTS_MAPPING.heelLeft, MEDIAPIPE_JOINTS_MAPPING.toesLeft],

    "arm_right": [MEDIAPIPE_JOINTS_MAPPING.shoulderRight, MEDIAPIPE_JOINTS_MAPPING.armRight, MEDIAPIPE_JOINTS_MAPPING.hipRight],
    "forearm_right": [MEDIAPIPE_JOINTS_MAPPING.armRight, MEDIAPIPE_JOINTS_MAPPING.foreArmRight, MEDIAPIPE_JOINTS_MAPPING.shoulderRight],
    "knee_right": [MEDIAPIPE_JOINTS_MAPPING.hipRight, MEDIAPIPE_JOINTS_MAPPING.kneeRight, MEDIAPIPE_JOINTS_MAPPING.ankleRight],
    "ankle_right": [MEDIAPIPE_JOINTS_MAPPING.kneeRight, MEDIAPIPE_JOINTS_MAPPING.ankleRight, MEDIAPIPE_JOINTS_MAPPING.heelRight],
    "foot_right": [MEDIAPIPE_JOINTS_MAPPING.ankleRight, MEDIAPIPE_JOINTS_MAPPING.heelRight, MEDIAPIPE_JOINTS_MAPPING.toesRight],
}
