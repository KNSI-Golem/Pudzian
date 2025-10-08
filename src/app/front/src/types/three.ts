import * as THREE from 'three';

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
  controls?: any; // OrbitControls type
}

export interface ModelLoadResult {
  gltf: any;
}