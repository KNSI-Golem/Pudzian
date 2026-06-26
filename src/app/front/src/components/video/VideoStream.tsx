'use client';

import React, { useRef, useEffect } from 'react';
import { useMediaPipe, useVideoStream } from '@/hooks';
import { VIDEO_CONSTRAINTS } from '@/lib/constants';
import { formatErrorMessage } from '@/lib/utils';
import { VideoCanvas } from '@/components';
import { CameraPlaceholder } from '@/components';
import { usePoseDetection } from '@/components';
import { PoseDetectionResult } from '@/types';
import { CalibrateOutline } from './CalibrateOutline';
import { CalibrationStatus } from '@/types/calibrate';

interface VideoStreamProps {
  isStreaming: boolean;
  className?: string;
  onError?: (error: string) => void;
  poseRef?: React.RefObject<PoseDetectionResult | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  calibrateStatus: CalibrationStatus;
}

export function VideoStream({ 
  isStreaming, 
  className = "",
  onError,
  poseRef,
  videoRef,
  calibrateStatus
}: VideoStreamProps) {
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
    isActive: isStreaming && isActive,
    poseRef
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
        <div className="relative w-full h-full item-center justify-center">
          <VideoCanvas
            videoRef={videoRef}
            canvasRef={canvasRef}
            stream={stream}
          />
          
          <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
            <CalibrateOutline calibrateStatus={calibrateStatus} />
          </div>
        </div>
      ) : (
        <CameraPlaceholder />
      )}
    </div>
  );
}