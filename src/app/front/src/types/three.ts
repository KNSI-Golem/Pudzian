import * as THREE from 'three';
import type { PoseDetectionResult } from './mediapipe';

export interface ModelAnimConfig {
  hips: string;
  upLegLeft: string;
  legLeft: string;
  footLeft: string;
  upLegRight: string;
  legRight: string;
  footRight: string;

  armLeft: string;
  foreArmLeft: string;
  handLeft: string;
  
  armRight: string;
  foreArmRight: string;
  handRight: string;

  // Lewa dłoń (palce)
  thumbThumb1Left: string;
  thumbThumb2Left: string;
  thumbThumb3Left: string;
  index1Left: string;
  index2Left: string;
  index3Left: string;
  middle1Left: string;
  middle2Left: string;
  middle3Left: string;
  ring1Left: string;
  ring2Left: string;
  ring3Left: string;
  pinky1Left: string;
  pinky2Left: string;
  pinky3Left: string;

  // Prawa dłoń (palce)
  thumbThumb1Right: string;
  thumbThumb2Right: string;
  thumbThumb3Right: string;
  index1Right: string;
  index2Right: string;
  index3Right: string;
  middle1Right: string;
  middle2Right: string;
  middle3Right: string;
  ring1Right: string;
  ring2Right: string;
  ring3Right: string;
  pinky1Right: string;
  pinky2Right: string;
  pinky3Right: string;
}

export const TARGET_MODELS = {
  v1: "/models/result.gltf",
  clean: "/models/Final_Cleaned_Model.glb"
};

export interface ModelViewerProps {
  modelPath: string;
  isActive: boolean;
  className?: string;
  onError?: (error: string) => void;
  onLoad?: () => void;
  poseRef?: React.RefObject<PoseDetectionResult | null>;
}

export interface ModelViewerRef {
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  mixer?: THREE.AnimationMixer;
}

export interface ModelLoadResult {
  gltf: any;
}