import type { PoseDetectionResult } from "@/types";
import { MEDIAPIPE_JOINTS_MAPPING } from "@/lib/mediapipe/mapping";
import type { CalibrateJointConfig } from "@/types";

const CALIBRATE_JOINTS_CONFIG: CalibrateJointConfig = {
  joint_list: ["shoulderLeft", "shoulderRight", "nose"],
  visibility_threshold: 0.8,
  center_margin: 0.2,
};

export function isCalibrated(poseDetection: PoseDetectionResult): boolean {
  return isPoseVisible(poseDetection) && isPoseCentered(poseDetection);
}

export function isPoseVisible(poseDetection: PoseDetectionResult): boolean {
  const landmarks = poseDetection.landmarks[0];
  if (!landmarks) return false;

  for (const joint of CALIBRATE_JOINTS_CONFIG.joint_list) {
    const jointIndex = MEDIAPIPE_JOINTS_MAPPING[joint];
    const visibility = landmarks[jointIndex]?.visibility;
    if (!isJointVisible(visibility)) {
      return false;
    }
  }
  return true;
}

function isJointVisible(visibility: number | undefined): boolean {
  return (
    visibility !== undefined &&
    visibility >= CALIBRATE_JOINTS_CONFIG.visibility_threshold
  );
}

function isPoseCentered(poseDetection: PoseDetectionResult): boolean {
  const noseIndex = MEDIAPIPE_JOINTS_MAPPING.nose;
  const noseX = poseDetection.landmarks[0]?.[noseIndex]?.x;
  if (noseX === undefined || !Number.isFinite(noseX)) return false;

  const center = 0.5;
  const leftMargin = center - CALIBRATE_JOINTS_CONFIG.center_margin;
  const rightMargin = center + CALIBRATE_JOINTS_CONFIG.center_margin;
  return noseX >= leftMargin && noseX <= rightMargin;
}
