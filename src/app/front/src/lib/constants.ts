/**
 * Application constants
 */
export const APP_CONFIG = {
  name: "GOLEM VR",
  fullName: "KOŁO NAUKOWE SZTUCZNEJ INTELIGENCJI GOLEM",
  version: "1.0.0",
} as const;

export const VIDEO_CONSTRAINTS = {
  width: 640,
  height: 480,
  facingMode: "user",
} as const;

export const MEDIAPIPE_URLS = {
  wasm: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm",
  model: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
} as const;

export const ANIMATION_DELAYS = {
  grid: { min: 0, max: 2 },
  transition: 500,
} as const;