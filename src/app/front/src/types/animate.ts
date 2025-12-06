import {PoseDetectionResult} from "@/types/mediapipe";

export interface AnimateProps {
    poseResultRef: PoseDetectionResult;
}

export interface AnimateMappingConfig {
    handLeft: number,
    handRight: number,
    foreArmLeft: number,
    foreArmRight: number,
    armLeft: number,
    armRight: number,
    shoulderLeft: number,
    shoulderRight: number,
}
