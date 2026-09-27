'use client';

import React, { useRef, useEffect } from 'react';
import { useMediaPipe, useVideoStream, usePoseDetection } from '@/hooks';
import { VIDEO_CONSTRAINTS } from '@/lib/constants';
import { formatErrorMessage } from '@/lib/utils';
import { VideoCanvas, CameraPlaceholder, CalibrateOutline } from '@/components';
import type { SessionStatus, PoseDetectionResult } from '@/types';
import type { CalibrationStatus } from '@/types/calibrate';

interface VideoStreamProps {
  status: SessionStatus;
  className?: string;
  onError?: (error: string) => void;
  poseRef?: React.RefObject<PoseDetectionResult | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  calibrateStatus: CalibrationStatus;
}

export function VideoStream({ 
  status, 
  className = "",
  onError,
  poseRef,
  videoRef,
  calibrateStatus
}: VideoStreamProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    poseLandmarker,
    handLandmarker,
    isLoading: isMediaPipeLoading,
    error: mediaPipeError,
  } = useMediaPipe();

  const { stream, error: streamError } = useVideoStream({
    status,
    config: VIDEO_CONSTRAINTS,
  });

  usePoseDetection({
    videoRef,
    canvasRef,
    poseLandmarker,
    handLandmarker,
    status,
    poseRef,
  });

  useEffect(() => {
    const error = mediaPipeError || streamError;
    if (error && onError) {
      onError(formatErrorMessage(error));
    }
  }, [mediaPipeError, streamError, onError]);

  if (status !== 'idle' && (isMediaPipeLoading || !poseLandmarker)) {
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
        <p className="text-error text-sm mt-2 max-w-md text-center">
          {formatErrorMessage(streamError || mediaPipeError)}
        </p>
      </div>
    );
  }

  return (
    <div className={`w-full h-full ${className}`}>
      {status !== 'idle' && stream ? (
        <div className="relative w-full h-full flex items-center justify-center">
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