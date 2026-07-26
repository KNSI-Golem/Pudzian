import * as THREE from 'three';
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { PoseDetectionResult } from './mediapipe';
import type { CalibrationStatus } from './calibrate';

export type ModelViewerProps = {
  modelPath: string;
  isActive: boolean;
  className?: string;
  onError?: (error: string) => void;
  onLoad?: () => void;
  poseRef?: React.RefObject<PoseDetectionResult | null>;
  calibrateStatus?: CalibrationStatus;
  onCalibrationFailure?: () => void;
}

export type ModelViewerRef = {
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  mixer?: THREE.AnimationMixer;
}

export type ModelLoadResult = {
  gltf: GLTF;
}
