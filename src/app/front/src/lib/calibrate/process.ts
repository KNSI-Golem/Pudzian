import {PoseDetectionResult} from "@/types";
import {MEDIAPIPE_JOINTS_MAPPING } from "@/lib/mediapipe/mapping";
import { CalibrateJointConfig } from "@/types";

const CALIBRATE_JOINTS_CONFIG: CalibrateJointConfig = {
    joint_list: [
        "shoulderLeft",    
        "shoulderRight"
    ],
    visibility_threshold: 0.8
    // add center margin in %
}

export function isCalibrated(poseDetection: PoseDetectionResult, width: number, height: number) { 
    return isPoseVisible(poseDetection) // && isPoseCentered(poseDetection, width, height)
}

export function isPoseVisible(poseDetection: PoseDetectionResult) {
    for (const joint of CALIBRATE_JOINTS_CONFIG.joint_list) {
        const joint_index = MEDIAPIPE_JOINTS_MAPPING[joint];
        const joint_visibility = poseDetection.worldLandmarks[0][joint_index].visibility;

        if (!isJointVisible(joint_visibility)) {
            return false
        }
    }
    return true
}

function isJointVisible(joint_visibility: number) {
    return joint_visibility >= CALIBRATE_JOINTS_CONFIG.visibility_threshold;
}

export function isPoseCentered(poseDetection: PoseDetectionResult, width: number, height: number) { //is in right place?
    const head_x = poseDetection.worldLandmarks[0][0].x; // take index from config?
    const head_y = poseDetection.worldLandmarks[0][0].y;

    // add horizontal centering
    // if (head_x < getWidthCenterMargin(width) ) 

    // if (head_y < height / 2) { return false }

    return true
}

function getWidthCenterMargin(width: number) {
    return width / 2 // take into account pose landmarks offset etc 
}