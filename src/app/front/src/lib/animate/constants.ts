import * as THREE from 'three';

export const X_AXIS = new THREE.Vector3(1, 0, 0);
export const Y_AXIS = new THREE.Vector3(0, 1, 0);
export const Z_AXIS = new THREE.Vector3(0, 0, 1);

export const NEG_X_AXIS = new THREE.Vector3(-1, 0, 0);
export const NEG_Y_AXIS = new THREE.Vector3(0, -1, 0);
export const NEG_Z_AXIS = new THREE.Vector3(0, 0, -1);

export const TURN_180_LOCAL_Y = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);

export const T_FOREARM_LEFT_TPOSE = new THREE.Matrix4().makeBasis(Y_AXIS, X_AXIS, NEG_Z_AXIS)
export const T_FOREARM_RIGHT_TPOSE = new THREE.Matrix4().makeBasis(NEG_Y_AXIS, NEG_X_AXIS, NEG_Z_AXIS)
export const T_HAND_LEFT_TPOSE = new THREE.Matrix4().makeBasis(Z_AXIS, X_AXIS, Y_AXIS)
export const T_HAND_RIGHT_TPOSE = new THREE.Matrix4().makeBasis(NEG_Z_AXIS, NEG_X_AXIS, Y_AXIS)

export const QUAT_FOREARM_LEFT_TPOSE = new THREE.Quaternion().setFromRotationMatrix(T_FOREARM_LEFT_TPOSE)
export const QUAT_FOREARM_RIGHT_TPOSE = new THREE.Quaternion().setFromRotationMatrix(T_FOREARM_RIGHT_TPOSE)
export const QUAT_HAND_LEFT_TPOSE = new THREE.Quaternion().setFromRotationMatrix(T_HAND_LEFT_TPOSE)
export const QUAT_HAND_RIGHT_TPOSE = new THREE.Quaternion().setFromRotationMatrix(T_HAND_RIGHT_TPOSE)