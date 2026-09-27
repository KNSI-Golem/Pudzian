import { useState, useEffect, useRef, useCallback } from "react";
import { getUserMediaStream, stopMediaStream, checkMediaSupport } from "@/lib/mediapipe";
import type { VideoStreamConfig, SessionStatus } from "@/types";

interface UseVideoStreamOptions {
  status: SessionStatus;
  config?: Partial<VideoStreamConfig>;
}

interface UseVideoStreamReturn {
  stream: MediaStream | null;
  error: string | null;
}

export function useVideoStream({
  status,
  config,
}: UseVideoStreamOptions): UseVideoStreamReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startStream = useCallback(async () => {
    if (streamRef.current && streamRef.current.active) {
      return;
    }

    try {
      const supportCheck = checkMediaSupport();
      if (!supportCheck.supported) {
        throw new Error(supportCheck.error);
      }

      setError(null);
      const mediaStream = await getUserMediaStream(config);

      streamRef.current = mediaStream;
      setStream(mediaStream);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to start video stream";
      setError(errorMessage);
      console.error("Error starting video stream:", errorMessage);
    }
  }, [config]);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      stopMediaStream(streamRef.current);
      streamRef.current = null;
      setStream(null);
      setError(null);
    }
  }, []);

  useEffect(() => {
    switch (status) {
      case "active":
        if (streamRef.current) {
          streamRef.current.getVideoTracks().forEach((track) => {
            track.enabled = true;
          });
        }
        startStream();
        break;

      case "paused":
        if (streamRef.current) {
          streamRef.current.getVideoTracks().forEach((track) => {
            track.enabled = false;
          });
        }
        break;

      case "idle":
      case "error":
        stopStream();
        break;
    }
  }, [status, startStream, stopStream]);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return {
    stream,
    error,
  };
}