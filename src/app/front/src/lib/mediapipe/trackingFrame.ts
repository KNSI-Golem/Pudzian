import type {
  HandLandmarkerResult,
  Landmark,
  NormalizedLandmark,
  PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";
import type {
  DetectedHand,
  HandImageLandmarks,
  HandWorldLandmarks,
  PoseDetectionResult,
  PoseImageLandmarks,
  PoseWorldLandmarks,
  TrackingFrame,
} from "@/types";
import { handednessFromCategory } from "@/types";

function freezeNormalized(
  landmarks: readonly NormalizedLandmark[],
): readonly NormalizedLandmark[] {
  return Object.freeze(
    landmarks.map((landmark) => Object.freeze({ ...landmark })),
  );
}

function freezeWorld(landmarks: readonly Landmark[]): readonly Landmark[] {
  return Object.freeze(
    landmarks.map((landmark) => Object.freeze({ ...landmark })),
  );
}

export function createTrackingResult(
  poseResult: PoseLandmarkerResult,
  handResult: HandLandmarkerResult | undefined,
  timestampMs: number,
  imageSize: Readonly<{ width: number; height: number }>,
): PoseDetectionResult | undefined {
  const poseImage = poseResult.landmarks[0];
  const poseWorld = poseResult.worldLandmarks[0];
  if (!poseImage || !poseWorld) {
    return undefined;
  }

  const frozenPoseImage = freezeNormalized(
    poseImage,
  ) as PoseImageLandmarks;
  const frozenPoseWorld = freezeWorld(poseWorld) as PoseWorldLandmarks;
  const handednesses = handResult?.handednesses ?? handResult?.handedness ?? [];
  const detectedHands: DetectedHand[] = [];

  for (let index = 0; index < (handResult?.landmarks.length ?? 0); index += 1) {
    const imageLandmarks = handResult?.landmarks[index];
    const worldLandmarks = handResult?.worldLandmarks[index];
    if (!imageLandmarks || !worldLandmarks) {
      continue;
    }
    detectedHands.push(
      Object.freeze({
        imageLandmarks: freezeNormalized(
          imageLandmarks,
        ) as HandImageLandmarks,
        worldLandmarks: freezeWorld(worldLandmarks) as HandWorldLandmarks,
        handedness: handednessFromCategory(handednesses[index]?.[0]),
        detectionIndex: index,
      }),
    );
  }

  const trackingFrame: TrackingFrame = Object.freeze({
    poseImageLandmarks: frozenPoseImage,
    poseWorldLandmarks: frozenPoseWorld,
    detectedHands: Object.freeze(detectedHands),
    timestampMs,
    imageSize: Object.freeze({ ...imageSize }),
  });

  return {
    landmarks: [Array.from(frozenPoseImage)],
    worldLandmarks: [Array.from(frozenPoseWorld)],
    trackingFrame,
  };
}
