import { useState, useEffect, useRef, useCallback } from "react";
import { isCalibrated } from "@/lib/calibrate";
import type { PoseDetectionResult } from '@/types';

interface UseCalibrateReturn {
  success: boolean;
}

interface UseCalibrateOptions {
  poseRef?: React.RefObject<PoseDetectionResult | null>;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
}

export function useCalibrate(options: UseCalibrateOptions): UseCalibrateReturn {
  const { poseRef, videoRef } = options;

  const [success, setSuccess] = useState(false);

  const checkCalibration = useCallback(() => {

    const videoElement = videoRef?.current;
    if (!videoElement) return;

    if (videoElement.readyState < 2 || videoElement.videoWidth === 0) return;

    const width = videoElement.videoWidth;
    const height = videoElement.videoHeight;
    
    const poseDetection = poseRef?.current;

    if (poseDetection) {
      const calibrated = isCalibrated(poseDetection, width, height);
      setSuccess(calibrated);
    }
  }, [poseRef, videoRef]);

  useEffect(() => {
    checkCalibration();

    const timerId = setInterval(checkCalibration, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, [checkCalibration]);

  return { success }
}