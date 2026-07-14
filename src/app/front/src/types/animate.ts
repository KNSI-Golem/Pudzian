import {PoseDetectionResult} from "@/types/mediapipe";

export interface AnimateProps {
    poseResultRef: PoseDetectionResult;
}

export interface AnimateMappingConfig {
    [key: string]: number;
}
