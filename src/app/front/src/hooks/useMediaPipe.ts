import { useEffect, useState } from "react";
import type {
  HandLandmarker,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";
import {
  createHandLandmarker,
  createPoseLandmarker,
  handleMediaPipeError,
  runMediaPipeOperation,
} from "@/lib/mediapipe";
import type {
  HandMediaPipeConfig,
  MediaPipeConfig,
  MediaPipeHookReturn,
} from "@/types";

type UseMediaPipeConfig = {
  pose?: Partial<MediaPipeConfig>;
  hand?: Partial<HandMediaPipeConfig>;
};

export function useMediaPipe(
  config: UseMediaPipeConfig = {},
): MediaPipeHookReturn {
  const [poseLandmarker, setPoseLandmarker] =
    useState<PoseLandmarker | null>(null);
  const [handLandmarker, setHandLandmarker] =
    useState<HandLandmarker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [handError, setHandError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let poseInstance: PoseLandmarker | null = null;
    let handInstance: HandLandmarker | null = null;

    const initialize = async () => {
      setIsLoading(true);
      setError(null);
      setHandError(null);

      try {
        poseInstance = await createPoseLandmarker(config.pose);
        if (!active) {
          runMediaPipeOperation(() => poseInstance?.close());
          return;
        }
        setPoseLandmarker(poseInstance);
      } catch (initializationError) {
        if (active) {
          setError(handleMediaPipeError(initializationError));
        }
        return;
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }

      try {
        handInstance = await createHandLandmarker(config.hand);
        if (!active) {
          runMediaPipeOperation(() => handInstance?.close());
          return;
        }
        setHandLandmarker(handInstance);
      } catch (initializationError) {
        if (active) {
          setHandError(handleMediaPipeError(initializationError));
        }
      }
    };

    void initialize();

    return () => {
      active = false;
      runMediaPipeOperation(() => poseInstance?.close());
      runMediaPipeOperation(() => handInstance?.close());
    };
  }, [config.hand, config.pose]);

  return {
    poseLandmarker,
    handLandmarker,
    isLoading,
    error,
    handError,
  };
}
