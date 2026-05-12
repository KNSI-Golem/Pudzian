import React, { useRef, useEffect, useCallback } from 'react';
import { PoseLandmarker } from '@mediapipe/tasks-vision';
import { drawPoseLandmarks, clearCanvas, createDrawingUtils } from '@/lib/mediapipe';
import type { PoseDetectionResult } from '@/types';

interface PoseDetectionProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  poseLandmarker: PoseLandmarker | null;
  isActive: boolean;
  poseRef?: React.RefObject<PoseDetectionResult | null>;
}

export function usePoseDetection({
  videoRef,
  canvasRef,
  poseLandmarker,
  isActive,
  poseRef
}: PoseDetectionProps) {
  const isRunningRef = useRef(false);
  const lastVideoTimeRef = useRef(-1);
  const drawingUtilsRef = useRef<any>(null);
  const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  const predictPosture = useCallback(() => {
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;

    if (!videoElement || !canvasElement || !poseLandmarker || !isActive) {
      return;
    }

    if (videoElement.readyState < 2 || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      if (isRunningRef.current) {
        requestAnimationFrame(predictPosture);
      }
      return;
    }

    if (canvasElement.width !== videoElement.videoWidth) canvasElement.width = videoElement.videoWidth;
    if (canvasElement.height !== videoElement.videoHeight) canvasElement.height = videoElement.videoHeight;

    if (lastVideoTimeRef.current !== videoElement.currentTime) {
      lastVideoTimeRef.current = videoElement.currentTime;

      try {
        const startTimeMs = performance.now();
        const result = poseLandmarker.detectForVideo(videoElement, startTimeMs);

        if (canvasCtxRef.current && drawingUtilsRef.current && result.landmarks.length > 0) {
          clearCanvas(canvasCtxRef.current, canvasElement.width, canvasElement.height);

          const poseResult: PoseDetectionResult = {
            landmarks: result.landmarks,
            worldLandmarks: result.worldLandmarks,
          };

          if (poseRef) {
            poseRef.current = poseResult;
          }

          drawPoseLandmarks(canvasCtxRef.current, drawingUtilsRef.current, poseResult);
        }
      } catch (error) {
        console.error("detectForVideo error:", error);
      }
    }

    if (isRunningRef.current) {
      requestAnimationFrame(predictPosture);
    }
  }, [videoRef, canvasRef, poseLandmarker, isActive, poseRef]);

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