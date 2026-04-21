import {NormalizedLandmark} from "@mediapipe/tasks-vision";
import {getRotationMatrix, getCrossProduct, getQuaternionFromRot, getVectorFromPoints, landmarkToVector3, normalizeVector} from "@/lib/animate/utils";
import {PoseDetectionResult} from "@/types";
import {JOINT_POINTS_CONFIG} from "@/lib/animate/mapping";
import * as THREE from 'three';

const LOCAL_Y = new THREE.Vector3(0, 1, 0);
export const GLOBAL_RETURN_QUAT = new THREE.Quaternion();
export function processAnimateJoint(poseDetection: PoseDetectionResult, jointName: string) {
    const joint_start = JOINT_POINTS_CONFIG[jointName][0];
    const joint_middle = JOINT_POINTS_CONFIG[jointName][1];
    const joint_end = JOINT_POINTS_CONFIG[jointName][2];

    const nl0 = poseDetection.worldLandmarks[0][joint_start];
    const nl1 = poseDetection.worldLandmarks[0][joint_middle];
    const nl2 = poseDetection.worldLandmarks[0][joint_end];

    return getQuaternionFromLandmarks(nl0, nl1, nl2);
}

export function processHandJoint(handLandmarks: NormalizedLandmark[], p_start: number, p_end: number) {
    const nl0 = handLandmarks[p_start];
    const nl1 = handLandmarks[p_end];
    return getQuaternionForFinger(nl0, nl1);
}

export function getHipsTranslationAndRotation(poseDetection: PoseDetectionResult) {
    const leftHip = poseDetection.worldLandmarks[0][23]; // MEDIAPIPE_JOINTS_CONFIG.hipLeft
    const rightHip = poseDetection.worldLandmarks[0][24];
    
    // Average position for the root
    const rootPos = new THREE.Vector3(
        -(leftHip.x + rightHip.x) / 2.0,
        -(leftHip.y + rightHip.y) / 2.0,
        -(leftHip.z + rightHip.z) / 2.0
    );

    // X/Z rotation calculation from hips line
    const pLeft = landmarkToVector3(leftHip);
    const pRight = landmarkToVector3(rightHip);
    const hipsVec = getVectorFromPoints(pRight, pLeft); // points left
    
    // Obliczamy tylko rotację Y (yaw), aby nie wywrócić modelu do góry nogami z powodu ambiguous osi w setFromUnitVectors.
    const angle = Math.atan2(-hipsVec.z, hipsVec.x);
    
    const rootQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);

    return { rootPos, rootQuat };
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

    return getQuaternionFromRot(R, GLOBAL_RETURN_QUAT);
}

export function getQuaternionForFinger(nl0: NormalizedLandmark, nl1: NormalizedLandmark) {
    const p0 = landmarkToVector3(nl0);
    const p1 = landmarkToVector3(nl1);
    
    const vWorld = getVectorFromPoints(p0, p1);
    const vWorldNorm = normalizeVector(vWorld);
    
    return GLOBAL_RETURN_QUAT.setFromUnitVectors(LOCAL_Y, vWorldNorm);
}