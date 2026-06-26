import * as THREE from 'three';
import type { PoseDetectionResult } from './mediapipe';

export type ModelAnimConfig = {
  handLeft: string;
  handRight: string;
  foreArmLeft: string;
  foreArmRight: string;
  armLeft: string;
  armRight: string;
}

export type ModelViewerProps = {
  modelPath: string;
  isActive: boolean;
  className?: string;
  onError?: (error: string) => void;
  onLoad?: () => void;
  poseRef?: React.RefObject<PoseDetectionResult | null>;
}

export type ModelViewerRef = {
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  mixer?: THREE.AnimationMixer;
}

export type ModelLoadResult = {
  gltf: any;
}