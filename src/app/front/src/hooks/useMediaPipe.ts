import { useState, useEffect } from "react";
import { PoseLandmarker } from "@mediapipe/tasks-vision";
import { createPoseLandmarker, handleMediaPipeError } from "@/lib/mediapipe";
import type { MediaPipeHookReturn, MediaPipeConfig } from "@/types";

/**
 * Custom hook for managing MediaPipe PoseLandmarker
 */
export function useMediaPipe(config?: Partial<MediaPipeConfig>): MediaPipeHookReturn {
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeMediaPipe = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const landmarker = await createPoseLandmarker(config);
        
        if (mounted) {
          setPoseLandmarker(landmarker);
        }
      } catch (err) {
        if (mounted) {
          const errorMessage = handleMediaPipeError(err);
          setError(errorMessage);
          console.error("Failed to initialize MediaPipe:", errorMessage);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeMediaPipe();

    return () => {
      mounted = false;
      // Clean up MediaPipe resources if needed
      if (poseLandmarker) {
        try {
          poseLandmarker.close();
        } catch (err) {
          console.warn("Error closing MediaPipe resources:", err);
        }
      }
    };
  }, [config]);

  return {
    poseLandmarker,
    isLoading,
    error,
  };
}