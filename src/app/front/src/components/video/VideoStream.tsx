'use client';

import React, { useRef, useEffect } from 'react';
import { useMediaPipe, useVideoStream } from '@/hooks';
import { VIDEO_CONSTRAINTS } from '@/lib/constants';
import { formatErrorMessage } from '@/lib/utils';
import { VideoCanvas } from '@/components';
import { CameraPlaceholder } from '@/components';
import { usePoseDetection } from '@/components';

interface VideoStreamProps {
  isStreaming: boolean;
  className?: string;
  onError?: (error: string) => void;
}

export function VideoStream({ 
  isStreaming, 
  className = "",
  onError
}: VideoStreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { poseLandmarker, isLoading: isMediaPipeLoading, error: mediaPipeError } = useMediaPipe();

  const { 
    stream, 
    isActive, 
    error: streamError, 
    startStream, 
    stopStream 
  } = useVideoStream(VIDEO_CONSTRAINTS);

  const { startDetection, stopDetection } = usePoseDetection({
    videoRef,
    canvasRef,
    poseLandmarker,
    isActive: isStreaming && isActive
  });

  useEffect(() => {
    if (isStreaming && poseLandmarker && !isMediaPipeLoading) {
      startStream();
    } else if (!isStreaming) {
      stopStream();
    }
  }, [isStreaming, poseLandmarker, isMediaPipeLoading, startStream, stopStream]);

  useEffect(() => {
    const error = mediaPipeError || streamError;
    if (error && onError) {
      onError(formatErrorMessage(error));
    }
  }, [mediaPipeError, streamError, onError]);

  if (isStreaming && (isMediaPipeLoading || !poseLandmarker)) {
    return (
      <div className={`w-full h-full ${className}`}>
        <CameraPlaceholder message="INITIALIZING MEDIAPIPE..." />
      </div>
    );
  }

  if (streamError || mediaPipeError) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center ${className}`}>
        <CameraPlaceholder message="CAMERA ERROR" />
        <p className="text-red-400 text-sm mt-2 max-w-md text-center">
          {formatErrorMessage(streamError || mediaPipeError)}
        </p>
      </div>
    );
  }

  return (
    <div className={`w-full h-full ${className}`}>
      {isStreaming && stream ? (
        <VideoCanvas
          videoRef={videoRef}
          canvasRef={canvasRef}
          stream={stream}
        />
      ) : (
        <CameraPlaceholder />
      )}
    </div>
  );
}