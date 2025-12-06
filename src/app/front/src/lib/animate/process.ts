import {NormalizedLandmark} from "@mediapipe/tasks-vision";
import {getRotationMatrix, getCrossProduct, getQuaternionFromRot, getVectorFromPoints, landmarkToVector3, normalizeVector} from "@/lib/animate/utils";
import {PoseDetectionResult} from "@/types";
import {MEDIAPIPE_JOINTS_CONFIG} from "@/lib/animate/mapping";

export function processAnimate({poseDetection}: PoseDetectionResult) {
    const hand_left_l = poseDetection.landmarks[MEDIAPIPE_JOINTS_CONFIG.handLeft];
    const forearm_left_l = poseDetection.landmarks[MEDIAPIPE_JOINTS_CONFIG.foreArmLeft];
    const arm_left_l = poseDetection.landmarks[MEDIAPIPE_JOINTS_CONFIG.armLeft];

    const forearm_left_q = getQuaternionFromLandmarks(hand_left_l, forearm_left_l, arm_left_l);

    return forearm_left_q
}

export function getQuaternionFromLandmarks(nl0: NormalizedLandmark,
                                           nl1: NormalizedLandmark,
                                           nl2: NormalizedLandmark) {
    const p0 = landmarkToVector3(nl0);
    const p1 = landmarkToVector3(nl1);
    const p2 = landmarkToVector3(nl2);

    const v0 = getVectorFromPoints(p0, p1);
    const v1 = getVectorFromPoints(p1, p2);
    const v2 = getCrossProduct(v0, v1);

    const u0 = normalizeVector(v0);
    const u1 = normalizeVector(v1);
    const u2 = normalizeVector(v2);

    const R = getRotationMatrix(u0, u1, u2);

    return getQuaternionFromRot(R);
}