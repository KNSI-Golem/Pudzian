import * as THREE from 'three';

export interface ModelAnimConfig {
  handLeft: string;
  handRight: string;
  foreArmLeft: string;
  foreArmRight: string;
}

export interface ModelViewerProps {
  modelPath: string;
  isActive: boolean;
  className?: string;
  onError?: (error: string) => void;
  onLoad?: () => void;
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