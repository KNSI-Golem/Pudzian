import {AnimateMappingConfig} from "@/types";

export const MEDIAPIPE_JOINTS_CONFIG: AnimateMappingConfig = {
    handLeft: 19,
    handRight: 20,
    foreArmLeft: 15,     
    foreArmRight: 16,
    armLeft: 13,    
    armRight: 14,
    shoulderLeft: 11,    
    shoulderRight: 12,
}

export const JOINT_POINTS_CONFIG: {[key: string]: number[]} = {
    'forearm_left': [MEDIAPIPE_JOINTS_CONFIG.armLeft, MEDIAPIPE_JOINTS_CONFIG.foreArmLeft, MEDIAPIPE_JOINTS_CONFIG.handLeft],
    'forearm_right': [MEDIAPIPE_JOINTS_CONFIG.armRight, MEDIAPIPE_JOINTS_CONFIG.foreArmRight, MEDIAPIPE_JOINTS_CONFIG.handRight],
    'arm_left': [MEDIAPIPE_JOINTS_CONFIG.shoulderLeft, MEDIAPIPE_JOINTS_CONFIG.armLeft, MEDIAPIPE_JOINTS_CONFIG.foreArmLeft],
    'arm_right': [MEDIAPIPE_JOINTS_CONFIG.shoulderRight, MEDIAPIPE_JOINTS_CONFIG.armRight, MEDIAPIPE_JOINTS_CONFIG.foreArmRight],
}
