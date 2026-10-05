import { useState, useEffect, useCallback } from "react";
import { isCalibrated } from "@/lib/calibrate";
import { isTrackingResultFresh } from "@/lib/mediapipe/trackingFrame";
import type { PoseDetectionResult } from '@/types';

interface UseCalibrateReturn {
  success: boolean;
}

interface UseCalibrateOptions {
  poseRef?: React.RefObject<PoseDetectionResult | null>;
}

export function useCalibrate(options: UseCalibrateOptions): UseCalibrateReturn {
  const { poseRef } = options;

  const [success, setSuccess] = useState(false);

  const checkCalibration = useCallback(() => {
    
    const poseDetection = poseRef?.current;

    if (isTrackingResultFresh(poseDetection, performance.now())) {
      const calibrated = isCalibrated(poseDetection);
      setSuccess(calibrated);
    } else {
      setSuccess(false);
    }
  }, [poseRef]);

  useEffect(() => {
    checkCalibration();

    const timerId = setInterval(checkCalibration, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, [checkCalibration]);

  return { success }
}
