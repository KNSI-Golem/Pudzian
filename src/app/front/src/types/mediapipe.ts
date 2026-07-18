import type {
  Category,
  HandLandmarker,
  Landmark,
  NormalizedLandmark,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";

declare const landmarkSpace: unique symbol;

type LandmarkSpace<TSpace extends string, TLandmark> =
  ReadonlyArray<TLandmark> & { readonly [landmarkSpace]: TSpace };

export type PoseImageLandmarks = LandmarkSpace<
  "pose-image",
  NormalizedLandmark
>;
export type PoseWorldLandmarks = LandmarkSpace<"pose-world", Landmark>;
export type HandImageLandmarks = LandmarkSpace<
  "hand-image",
  NormalizedLandmark
>;
export type HandWorldLandmarks = LandmarkSpace<"hand-world", Landmark>;

export type AnatomicalSide = "left" | "right";

export type HandednessEvidence = {
  label: "Left" | "Right";
  score: number;
};

export type DetectedHand = {
  imageLandmarks: HandImageLandmarks;
  worldLandmarks: HandWorldLandmarks;
  handedness?: HandednessEvidence;
  detectionIndex: number;
};

export type AssignedHand = DetectedHand & {
  side: AnatomicalSide;
  observedAtMs: number;
  assignmentConfidence: number;
  stale: boolean;
};

export type TrackingFrame = {
  poseImageLandmarks: PoseImageLandmarks;
  poseWorldLandmarks: PoseWorldLandmarks;
  detectedHands?: readonly DetectedHand[];
  leftHand?: AssignedHand;
  rightHand?: AssignedHand;
  timestampMs: number;
  imageSize: Readonly<{ width: number; height: number }>;
};

export type MediaPipeConfig = {
  runningMode: "VIDEO" | "IMAGE";
  numPoses: number;
};

export type HandMediaPipeConfig = {
  runningMode: "VIDEO" | "IMAGE";
  numHands: number;
  minHandDetectionConfidence: number;
  minHandPresenceConfidence: number;
  minTrackingConfidence: number;
};

/**
 * Compatibility result retained while the rendering path migrates to
 * TrackingFrame. Landmark spaces are intentionally typed differently.
 */
export type PoseDetectionResult = {
  landmarks: NormalizedLandmark[][];
  worldLandmarks: Landmark[][];
  segmentationMasks?: ImageData[];
  trackingFrame?: TrackingFrame;
};

export type VideoStreamConfig = {
  width: number;
  height: number;
  facingMode?: "user" | "environment";
};

export type MediaPipeHookReturn = {
  poseLandmarker: PoseLandmarker | null;
  handLandmarker?: HandLandmarker | null;
  isLoading: boolean;
  error: string | null;
  handError?: string | null;
};

export type DrawingConfig = {
  landmarkRadius: number;
  connectionColor: string;
  landmarkColor: string;
  connectionWidth: number;
};

export function handednessFromCategory(
  category: Category | undefined,
): HandednessEvidence | undefined {
  if (
    !category ||
    (category.categoryName !== "Left" && category.categoryName !== "Right")
  ) {
    return undefined;
  }

  return {
    label: category.categoryName,
    score: category.score,
  };
}
