import {PoseDetectionResult} from "@/types";
import {MEDIAPIPE_JOINTS_MAPPING } from "@/lib/mediapipe/mapping";
import { CalibrateJointConfig } from "@/types";

const CALIBRATE_JOINTS_CONFIG: CalibrateJointConfig = {
    joint_list: [
        "shoulderLeft",    
        "shoulderRight",
        "nose"
    ],
    visibility_threshold: 0.8,
    center_margin: 0.2
}

export function isCalibrated(poseDetection: PoseDetectionResult) { 
    return isPoseVisible(poseDetection) && isPoseCentered(poseDetection)
}

export function isPoseVisible(poseDetection: PoseDetectionResult) {
    for (const joint of CALIBRATE_JOINTS_CONFIG.joint_list) {
        const joint_index = MEDIAPIPE_JOINTS_MAPPING[joint];
        const joint_visibility = poseDetection.landmarks[0][joint_index].visibility;

        if (!isJointVisible(joint_visibility)) {
            return false
        }
    }
    return true
}

function isJointVisible(joint_visibility: number) {
    return joint_visibility >= CALIBRATE_JOINTS_CONFIG.visibility_threshold;
}

function isPoseCentered(poseDetection: PoseDetectionResult) {
    const nose_index = MEDIAPIPE_JOINTS_MAPPING["nose"];
    const nose_x = poseDetection.landmarks[0][nose_index].x;

    console.log(nose_x)

    const CENTER = 0.5;
    const leftMargin = CENTER - CALIBRATE_JOINTS_CONFIG.center_margin;
    const rightMargin = CENTER + CALIBRATE_JOINTS_CONFIG.center_margin;

    return nose_x >= leftMargin && nose_x <= rightMargin;
}
