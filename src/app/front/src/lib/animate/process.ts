import {NormalizedLandmark} from "@mediapipe/tasks-vision";
import {getRotationMatrix, getCrossProduct, getQuaternionFromRot, getVectorFromPoints, landmarkToVector3, normalizeVector} from "@/lib/animate/utils";
import {PoseDetectionResult} from "@/types";
import {JOINT_POINTS_CONFIG, MEDIAPIPE_JOINTS_CONFIG} from "@/lib/animate/mapping";
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

export function processForearmHybrid(poseDetection: PoseDetectionResult, jointName: string, handMarks?: NormalizedLandmark[]) {
    const joint_start = JOINT_POINTS_CONFIG[jointName][0]; // Shoulder
    const joint_middle = JOINT_POINTS_CONFIG[jointName][1]; // Elbow
    const joint_end = JOINT_POINTS_CONFIG[jointName][2]; // Wrist / Point Ref

    if (!handMarks || handMarks.length < 17) {
        return processAnimateJoint(poseDetection, jointName);
    }

    const nl0 = poseDetection.worldLandmarks[0][joint_start];
    const nl1 = poseDetection.worldLandmarks[0][joint_middle];
    
    const vY = getVectorFromPoints(landmarkToVector3(nl0), landmarkToVector3(nl1));
    
    // Z dłoni bierzemy płaszczyznę twistu
    const vPlane = getVectorFromPoints(landmarkToVector3(handMarks[5]), landmarkToVector3(handMarks[17]));
    
    const uY = normalizeVector(vY);
    const uSide = normalizeVector(vPlane);
    // Aby Z celowało w nas (+Z): Cross(Side, Y) = Z
    const uZ = normalizeVector(getCrossProduct(uSide, uY));
    const uX = normalizeVector(getCrossProduct(uY, uZ));
    
    const R = getRotationMatrix(uX, uY, uZ);
    return getQuaternionFromRot(R, GLOBAL_RETURN_QUAT);
}

export function processHandRoot(handMarks: NormalizedLandmark[], isLeft: boolean) {
    const pW0 = landmarkToVector3(handMarks[0]);  // Wrist
    const pM9 = landmarkToVector3(handMarks[9]);  // MiddleMCP
    const pI5 = landmarkToVector3(handMarks[5]);  // IndexMCP
    const pP17 = landmarkToVector3(handMarks[17]); // PinkyMCP
    
    const vY = getVectorFromPoints(pW0, pM9);
    const vSide = getVectorFromPoints(pI5, pP17); // Index→Pinky
    
    // Gdy dłoń wnętrzem do kamery, normalna dłoni musi cełować w +Z (ku kamerze).
    // physLeft (isLeft=true): vSide=(-X) w MediaPipe world, Cross(vY, vSide) = +Z ✓
    // physRight (isLeft=false): vSide=(+X) w MediaPipe world, Cross(vSide, vY) = +Z ✓
    const vForward = isLeft
        ? normalizeVector(getCrossProduct(vY, vSide))
        : normalizeVector(getCrossProduct(vSide, vY));
    
    return getStandardWorldQuat(vY, vForward);
}

export function processHandJoint(handLandmarks: NormalizedLandmark[], p_start: number, p_end: number) {
    // MediaPipe HandLandmarker ustawia visibility=0 dla worldLandmarks — nie filtrujemy po nim
    const nl0 = handLandmarks[p_start];
    const nl1 = handLandmarks[p_end];

    const pStart = landmarkToVector3(nl0);
    const pEnd = landmarkToVector3(nl1);
    
    const vWorld = getVectorFromPoints(pStart, pEnd);
    const vWorldNorm = normalizeVector(vWorld);
    
    return new THREE.Quaternion().setFromUnitVectors(LOCAL_Y, vWorldNorm);
}


export function getHipsTranslationAndRotation(poseDetection: PoseDetectionResult) {
    const leftHip = poseDetection.worldLandmarks[0][23]; // MEDIAPIPE_JOINTS_CONFIG.hipLeft
    const rightHip = poseDetection.worldLandmarks[0][24];
    
    // Zastosowanie uziemienia translacji (Mnożnik skali np. 100 na Y, by dopasować do skali Mixamo)
    const SCALING = 100.0;
    const rootPos = new THREE.Vector3(
        -(leftHip.x + rightHip.x) / 2.0 * SCALING,
        -(leftHip.y + rightHip.y) / 2.0 * SCALING,         // Odpowiednio podciągamy środek miednicy na wyskokość z MediaPipe
        -(leftHip.z + rightHip.z) / 2.0 * SCALING
    );

    const pLeft = landmarkToVector3(leftHip);
    const pRight = landmarkToVector3(rightHip);
    
    // Obliczamy vY używając wektora z bioder do ramion (aby biodra posiadały Tilt przód-tył i na boki!)
    const leftShoulder = poseDetection.worldLandmarks[0][MEDIAPIPE_JOINTS_CONFIG.shoulderLeft];
    const rightShoulder = poseDetection.worldLandmarks[0][MEDIAPIPE_JOINTS_CONFIG.shoulderRight];
    const pMidShoulder = new THREE.Vector3().addVectors(landmarkToVector3(leftShoulder), landmarkToVector3(rightShoulder)).multiplyScalar(0.5);
    const pMidHip = new THREE.Vector3().addVectors(pLeft, pRight).multiplyScalar(0.5);
    const vY = getVectorFromPoints(pMidHip, pMidShoulder);

    // Wyliczamy wektor Forward dla korzenia (Hips) - Celuje w kamerę (+Z)
    const vSide = getVectorFromPoints(pLeft, pRight); // Left to Right (-X)
    // Cross(Y, -X) = Z. Model staje przodem do nas.
    const vForward = normalizeVector(getCrossProduct(vY, vSide));

    const rootQuat = getStandardWorldQuat(vY, vForward);

    return { rootPos, rootQuat };
}

export function getStandardWorldQuat(vY: THREE.Vector3, vForward: THREE.Vector3) {
    const uY = normalizeVector(vY);
    const uZ_target = normalizeVector(vForward);
    const uX = normalizeVector(getCrossProduct(uY, uZ_target));
    const uZ = normalizeVector(getCrossProduct(uX, uY));
    
    const R = getRotationMatrix(uX, uY, uZ);
    return getQuaternionFromRot(R, new THREE.Quaternion());
}

export function getQuaternionFromLandmarks(nl0: NormalizedLandmark,
                                           nl1: NormalizedLandmark,
                                           nl2: NormalizedLandmark) {
    const p0 = landmarkToVector3(nl0);
    const p1 = landmarkToVector3(nl1);
    const p2 = landmarkToVector3(nl2);

    return getQuaternionFromPoints(p0, p1, p2);
}

export function getQuaternionFromPoints(p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3) {
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

export function processSpine(poseDetection: PoseDetectionResult) {
    const leftHip = poseDetection.worldLandmarks[0][MEDIAPIPE_JOINTS_CONFIG.hipLeft];
    const rightHip = poseDetection.worldLandmarks[0][MEDIAPIPE_JOINTS_CONFIG.hipRight];
    const leftShoulder = poseDetection.worldLandmarks[0][MEDIAPIPE_JOINTS_CONFIG.shoulderLeft];
    const rightShoulder = poseDetection.worldLandmarks[0][MEDIAPIPE_JOINTS_CONFIG.shoulderRight];

    const pMidHip = new THREE.Vector3().addVectors(landmarkToVector3(leftHip), landmarkToVector3(rightHip)).multiplyScalar(0.5);
    const pMidShoulder = new THREE.Vector3().addVectors(landmarkToVector3(leftShoulder), landmarkToVector3(rightShoulder)).multiplyScalar(0.5);
    
    const pLeftShoulder = landmarkToVector3(leftShoulder);
    const pRightShoulder = landmarkToVector3(rightShoulder);

    const vY = getVectorFromPoints(pMidHip, pMidShoulder);
    const vSide = getVectorFromPoints(pLeftShoulder, pRightShoulder);
    // Aby klatka patrzyła na nas (+Z):
    const vForward = normalizeVector(getCrossProduct(vY, vSide)); 

    return getStandardWorldQuat(vY, vForward);
}

export function processShoulder(poseDetection: PoseDetectionResult, category: 'Left' | 'Right') {
    const leftShoulder = poseDetection.worldLandmarks[0][MEDIAPIPE_JOINTS_CONFIG.shoulderLeft];
    const rightShoulder = poseDetection.worldLandmarks[0][MEDIAPIPE_JOINTS_CONFIG.shoulderRight];

    const pLeftShoulder = landmarkToVector3(leftShoulder);
    const pRightShoulder = landmarkToVector3(rightShoulder);
    const pMidShoulder = new THREE.Vector3().addVectors(pLeftShoulder, pRightShoulder).multiplyScalar(0.5);
    
    // Pobieramy wektory miednicy i barków by wyznaczyć absolutną orientację klatki piersiowej
    const leftHip = poseDetection.worldLandmarks[0][MEDIAPIPE_JOINTS_CONFIG.hipLeft];
    const rightHip = poseDetection.worldLandmarks[0][MEDIAPIPE_JOINTS_CONFIG.hipRight];
    const pMidHip = new THREE.Vector3().addVectors(landmarkToVector3(leftHip), landmarkToVector3(rightHip)).multiplyScalar(0.5);
    
    const vTorsoUp = getVectorFromPoints(pMidHip, pMidShoulder);
    const vTorsoSide = getVectorFromPoints(pLeftShoulder, pRightShoulder);
    // TorsoForward musi celować w nas (+Z):
    const vTorsoForward = normalizeVector(getCrossProduct(vTorsoUp, vTorsoSide));

    // Wyznaczamy wektor obojczyka. Left: od Mid do Left. Right: od Mid do Right.
    const targetShoulder = category === 'Left' ? pLeftShoulder : pRightShoulder;
    const clavicleVec = getVectorFromPoints(pMidShoulder, targetShoulder);

    // Ustawiamy clavicleVec jako główną oś (Y) kości. 
    const vY = clavicleVec;
    return getStandardWorldQuat(vY, vTorsoForward);
}

export function processHead(poseDetection: PoseDetectionResult) {
    const earL = poseDetection.worldLandmarks[0][MEDIAPIPE_JOINTS_CONFIG.earLeft];
    const earR = poseDetection.worldLandmarks[0][MEDIAPIPE_JOINTS_CONFIG.earRight];
    const leftShoulder = poseDetection.worldLandmarks[0][MEDIAPIPE_JOINTS_CONFIG.shoulderLeft];
    const rightShoulder = poseDetection.worldLandmarks[0][MEDIAPIPE_JOINTS_CONFIG.shoulderRight];

    const pEarL = landmarkToVector3(earL);
    const pEarR = landmarkToVector3(earR);
    const pMidEar = new THREE.Vector3().addVectors(pEarL, pEarR).multiplyScalar(0.5);
    const pMidShoulder = new THREE.Vector3().addVectors(landmarkToVector3(leftShoulder), landmarkToVector3(rightShoulder)).multiplyScalar(0.5);

    const vY = getVectorFromPoints(pMidShoulder, pMidEar);
    const vSide = getVectorFromPoints(pEarL, pEarR);
    // Cross(vY, vSide): Forward points towards camera (+Z) because vSide is earR-earL (X is negative in MediaPipe).
    // This matches a head facing the user in T-pose (Standard World Forward = +Z).
    const vForward = normalizeVector(getCrossProduct(vY, vSide));

    return getStandardWorldQuat(vY, vForward);
}

export function getQuaternionForFinger(nl0: NormalizedLandmark, nl1: NormalizedLandmark, vPalmForward: THREE.Vector3) {
    const p0 = landmarkToVector3(nl0);
    const p1 = landmarkToVector3(nl1);
    
    const vFinger = getVectorFromPoints(p0, p1);
    // Używamy getStandardWorldQuat by palec miał poprawny Roll względem dłoni
    return getStandardWorldQuat(vFinger, vPalmForward);
}

export function processFoot(poseDetection: PoseDetectionResult, category: 'Left' | 'Right') {
    const ankleIdx = category === 'Left' ? MEDIAPIPE_JOINTS_CONFIG.legLeft : MEDIAPIPE_JOINTS_CONFIG.legRight;
    const toeIdx = category === 'Left' ? MEDIAPIPE_JOINTS_CONFIG.footIndexLeft : MEDIAPIPE_JOINTS_CONFIG.footIndexRight;
    const heelIdx = category === 'Left' ? MEDIAPIPE_JOINTS_CONFIG.heelLeft : MEDIAPIPE_JOINTS_CONFIG.heelRight;

    const pAnkle = landmarkToVector3(poseDetection.worldLandmarks[0][ankleIdx]);
    const pToe = landmarkToVector3(poseDetection.worldLandmarks[0][toeIdx]);
    const pHeel = landmarkToVector3(poseDetection.worldLandmarks[0][heelIdx]);

    const vY = getVectorFromPoints(pHeel, pToe);
    const uY = normalizeVector(vY);
    const uX = normalizeVector(getCrossProduct(uY, new THREE.Vector3(0, 1, 0)));
    const uZ = normalizeVector(getCrossProduct(uX, uY));

    const R = getRotationMatrix(uX, uY, uZ);
    return getQuaternionFromRot(R, GLOBAL_RETURN_QUAT);
}