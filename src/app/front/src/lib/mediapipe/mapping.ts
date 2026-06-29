import { MediapipeJointMapping } from "@/types/mediapipe";


export const MEDIAPIPE_JOINTS_MAPPING: MediapipeJointMapping = {
    "nose": 0,
    "handLeft": 19,
    "handRight": 20,
    "foreArmLeft": 15,     
    "foreArmRight": 16,
    "armLeft": 13,    
    "armRight": 14,
    "shoulderLeft": 11,    
    "shoulderRight": 12,
}

export const JOINT_POINTS_CONFIG: {[key: string]: number[]} = {
    "forearm_left": [MEDIAPIPE_JOINTS_MAPPING.handLeft, MEDIAPIPE_JOINTS_MAPPING.foreArmLeft, MEDIAPIPE_JOINTS_MAPPING.armLeft],
    "forearm_right": [MEDIAPIPE_JOINTS_MAPPING.handRight, MEDIAPIPE_JOINTS_MAPPING.foreArmRight, MEDIAPIPE_JOINTS_MAPPING.armRight],
    "arm_left": [MEDIAPIPE_JOINTS_MAPPING.foreArmLeft, MEDIAPIPE_JOINTS_MAPPING.armLeft, MEDIAPIPE_JOINTS_MAPPING.shoulderLeft],
    "arm_right": [MEDIAPIPE_JOINTS_MAPPING.foreArmRight, MEDIAPIPE_JOINTS_MAPPING.armRight, MEDIAPIPE_JOINTS_MAPPING.shoulderRight],
}
