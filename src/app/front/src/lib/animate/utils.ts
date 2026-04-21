import {NormalizedLandmark} from "@mediapipe/tasks-vision";
import * as THREE from 'three';

export function getQuaternionFromRot(R: THREE.Matrix3, targetQuat?: THREE.Quaternion) {
    const q = targetQuat || new THREE.Quaternion();
    const T = new THREE.Matrix4();
    T.setFromMatrix3(R);
    q.setFromRotationMatrix(T); 
    return q
}


export function getRotationMatrix(u1: THREE.Vector3,
                                  u2: THREE.Vector3,
                                  u3: THREE.Vector3) {
    const R = new THREE.Matrix3();
    R.set(u1.x, u2.x, u3.x,
          u1.y, u2.y, u3.y,
          u1.z, u2.z, u3.z)
    return R
}

export function normalizeVector(v: THREE.Vector3) {
    return v.normalize()
}

export function getCrossProduct(v1: THREE.Vector3,
                                v2: THREE.Vector3) {
    const v = new THREE.Vector3();
    v.crossVectors(v1, v2);
    return v
}

export function getVectorFromPoints(p1: THREE.Vector3,
                                    p2: THREE.Vector3) {
    const v = new THREE.Vector3();
    v.subVectors(p2, p1);
    return v
}

export function landmarkToVector3(nl: NormalizedLandmark) {
    return new THREE.Vector3(nl.x, -nl.y,-nl.z) // invert y and z for three.js coord system
}