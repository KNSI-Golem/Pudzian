import {NormalizedLandmark} from "@mediapipe/tasks-vision";
import {getRotationMatrix, getCrossProduct, getQuaternionFromRot, getVectorFromPoints, landmarkToVector3, normalizeVector} from "@/lib/animate/utils";
import {PoseDetectionResult} from "@/types";
import {JOINT_POINTS_CONFIG} from "@/lib/animate/mapping";
import * as THREE from 'three';


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

export function getQuaternionFromLandmarks(nl0: NormalizedLandmark,
                                           nl1: NormalizedLandmark,
                                           nl2: NormalizedLandmark) {
    const p0 = landmarkToVector3(nl0);
    const p1 = landmarkToVector3(nl1);
    const p2 = landmarkToVector3(nl2);

    const vY = getVectorFromPoints(p0, p1);
    const vPlane = getVectorFromPoints(p1, p2);

    const uY = normalizeVector(vY);
    const uPlane = normalizeVector(vPlane);

    let uX = getCrossProduct(uY, uPlane);
    if (uX.lengthSq() < 1e-6) {
        if (Math.abs(uY.x) < 0.9) {
             uX = normalizeVector(getCrossProduct(new THREE.Vector3(1, 0, 0), uY));
        } else {
             uX = normalizeVector(getCrossProduct(new THREE.Vector3(0, 1, 0), uY));
        }
    } else {
        uX = normalizeVector(uX);
    }

    const uZ = normalizeVector(getCrossProduct(uX, uY));

    const R = getRotationMatrix(uX, uY, uZ);

    return getQuaternionFromRot(R);
}