import {PoseDetectionResult} from "@/types/mediapipe";

export interface AnimateProps {
    poseResultRef: PoseDetectionResult;
}

export interface AnimateMappingConfig {
    handLeft: number;
    handRight: number;
    foreArmLeft: number;
    foreArmRight: number;
    armLeft: number;
    armRight: number;
    shoulderLeft: number;
    shoulderRight: number;
    hipLeft: number;
    hipRight: number;
    upLegLeft: number;
    upLegRight: number;
    legLeft: number;
    legRight: number;
    footLeft: number;
    footRight: number;
    heelLeft: number;
    heelRight: number;
    footIndexLeft: number;
    footIndexRight: number;
}

export const HAND_POINTS = {
    WRIST: 0,
    THUMB_CMC: 1, THUMB_MCP: 2, THUMB_IP: 3, THUMB_TIP: 4,
    INDEX_MCP: 5, INDEX_PIP: 6, INDEX_DIP: 7, INDEX_TIP: 8,
    MIDDLE_MCP: 9, MIDDLE_PIP: 10, MIDDLE_DIP: 11, MIDDLE_TIP: 12,
    RING_MCP: 13, RING_PIP: 14, RING_DIP: 15, RING_TIP: 16,
    PINKY_MCP: 17, PINKY_PIP: 18, PINKY_DIP: 19, PINKY_TIP: 20
};
