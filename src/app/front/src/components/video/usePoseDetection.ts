import React, { useRef, useEffect, useCallback } from 'react';
import { PoseLandmarker } from '@mediapipe/tasks-vision';
import { drawPoseLandmarks, clearCanvas, createDrawingUtils } from '@/lib/mediapipe';
import { VIDEO_CONSTRAINTS } from '@/lib/constants';
import type { PoseDetectionResult } from '@/types';

interface PoseDetectionProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  poseLandmarker: PoseLandmarker | null;
  isActive: boolean;
}

export function usePoseDetection({
  videoRef,
  canvasRef,
  poseLandmarker,
  isActive
}: PoseDetectionProps) {
  const isRunningRef = useRef(false);
  const lastVideoTimeRef = useRef(-1);
  const drawingUtilsRef = useRef<any>(null);
  const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  const predictPosture = useCallback(async () => {
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;

    if (!videoElement || !canvasElement || !poseLandmarker || !isActive) {
      return;
    }

    if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      if (isRunningRef.current) {
        requestAnimationFrame(predictPosture);
      }
      return;
    }

    // Set canvas dimensions to match video
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;

    const startTimeMs = performance.now();

    try {
      if (lastVideoTimeRef.current !== videoElement.currentTime) {
        lastVideoTimeRef.current = videoElement.currentTime;
        
        const result = await poseLandmarker.detectForVideo(videoElement, startTimeMs);
        
        if (canvasCtxRef.current && drawingUtilsRef.current && result.landmarks.length > 0) {
          clearCanvas(canvasCtxRef.current, canvasElement.width, canvasElement.height);
          
          const poseResult: PoseDetectionResult = {
            landmarks: result.landmarks,
            worldLandmarks: result.worldLandmarks,
          };
          
          drawPoseLandmarks(canvasCtxRef.current, drawingUtilsRef.current, poseResult);
        }
      }

      if (isRunningRef.current) {
        requestAnimationFrame(predictPosture);
      }
    } catch (error) {
      console.error("Error during pose detection:", error);
    }
  }, [videoRef, canvasRef, poseLandmarker, isActive]);

  const startDetection = useCallback(() => {
    if (!canvasRef.current) return;

    canvasCtxRef.current = canvasRef.current.getContext("2d");
    if (canvasCtxRef.current) {
      drawingUtilsRef.current = createDrawingUtils(canvasCtxRef.current);
    }

    isRunningRef.current = true;
    predictPosture();
  }, [canvasRef, predictPosture]);

  const stopDetection = useCallback(() => {
    isRunningRef.current = false;
    lastVideoTimeRef.current = -1;
  }, []);

  useEffect(() => {
    if (isActive && poseLandmarker) {
      startDetection();
    } else {
      stopDetection();
    }

    return () => {
      stopDetection();
    };
  }, [isActive, poseLandmarker, startDetection, stopDetection]);

  return {
    startDetection,
    stopDetection,
  };
}