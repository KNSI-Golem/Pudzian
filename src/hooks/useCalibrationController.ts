import { useEffect, useReducer, useCallback, useRef } from "react";
import { calibrationReducer } from "@/lib/calibrate";
import { isPoseCorrect } from "@/lib/calibrate/process";
import type { CalibrationStatus, PoseDetectionResult } from "@/types";

const CALIBRATION_HOLD_MS = 200

interface UseCalibrationControllerOptions {
  poseRef: React.RefObject<PoseDetectionResult | null>;
}

interface UseCalibrationControllerReturn {
  calibrateStatus: CalibrationStatus;
  handleCalibrationFailure: () => void;
}

export function useCalibrationController({
  poseRef,
}: UseCalibrationControllerOptions): UseCalibrationControllerReturn {
  const [calibrateStatus, dispatch] = useReducer(calibrationReducer, "NO");

  const isCorrectRef = useRef<boolean>(false);

  const handleCalibrationFailure = useCallback(() => {
    dispatch({ type: "FAILURE" });
  }, []);

  useEffect(() => {
    let animId: number;

    const tick = () => {
      const pose = poseRef.current;
      const valid = pose ? isPoseCorrect(pose) : false;
      isCorrectRef.current = valid;

      if (valid && calibrateStatus === "NO") {
        dispatch({ type: "POSE_OK" });
      } else if (!valid && calibrateStatus === "STARTED") {
        dispatch({ type: "POSE_LOST" });
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [poseRef, calibrateStatus]);

  useEffect(() => {
    if (calibrateStatus !== "STARTED") return;

    const timer = setTimeout(
      () => dispatch({ type: "HOLD_ELAPSED" }),
      CALIBRATION_HOLD_MS
    );
    return () => clearTimeout(timer);
  }, [calibrateStatus]);

  useEffect(() => {
    if (calibrateStatus !== "YES") return;

    const checkInterval = setInterval(() => {
      if (!isCorrectRef.current) {
        dispatch({ type: "POSE_LOST" });
      }
    }, CALIBRATION_HOLD_MS);

    return () => clearInterval(checkInterval);
  }, [calibrateStatus]);

  return {
    calibrateStatus,
    handleCalibrationFailure,
  };
}