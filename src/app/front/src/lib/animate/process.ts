import {Landmark} from "@mediapipe/tasks-vision";
import {getRotationMatrix, getCrossProduct, getQuaternionFromRot, getVectorFromPoints, landmarkToVector3, normalizeVector} from "@/lib/animate/utils";
import {PoseDetectionResult} from "@/types";
import {JOINT_POINTS_CONFIG} from "@/lib/animate/mapping";


export function processAnimateJoint(poseDetection: PoseDetectionResult, jointName: string) {
    const joint_start = JOINT_POINTS_CONFIG[jointName][0];
    const joint_middle = JOINT_POINTS_CONFIG[jointName][1];
    const joint_end = JOINT_POINTS_CONFIG[jointName][2];

    const nl0 = poseDetection.worldLandmarks[0][joint_start];
    const nl1 = poseDetection.worldLandmarks[0][joint_middle];
    const nl2 = poseDetection.worldLandmarks[0][joint_end];

    const joint_q = getQuaternionFromLandmarks(nl0, nl1, nl2);

    return joint_q
}

export function getQuaternionFromLandmarks(nl0: Landmark,
                                           nl1: Landmark,
                                           nl2: Landmark) {
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