import { useState, useEffect, useRef, useCallback } from "react";
import { getUserMediaStream, stopMediaStream, checkMediaSupport } from "@/lib/mediapipe";
import type { VideoStreamConfig } from "@/types";

interface UseVideoStreamReturn {
  stream: MediaStream | null;
  isActive: boolean;
  error: string | null;
  startStream: () => Promise<void>;
  stopStream: () => void;
}

/**
 * Custom hook for managing video stream from user camera
 */
export function useVideoStream(config?: Partial<VideoStreamConfig>): UseVideoStreamReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startStream = useCallback(async () => {
    try {
      // Check browser support first
      const supportCheck = checkMediaSupport();
      if (!supportCheck.supported) {
        throw new Error(supportCheck.error);
      }

      setError(null);
      const mediaStream = await getUserMediaStream(config);
      
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setIsActive(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to start video stream";
      setError(errorMessage);
      console.error("Error starting video stream:", errorMessage);
    }
  }, [config]);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      stopMediaStream(streamRef.current);
      streamRef.current = null;
      setStream(null);
      setIsActive(false);
      setError(null);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        stopMediaStream(streamRef.current);
      }
    };
  }, []);

  return {
    stream,
    isActive,
    error,
    startStream,
    stopStream,
  };
}