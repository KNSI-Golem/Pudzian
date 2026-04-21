import React, { useRef, useEffect, useCallback } from 'react';
import { PoseLandmarker, HandLandmarker } from '@mediapipe/tasks-vision';
import { drawPoseLandmarks, clearCanvas, createDrawingUtils } from '@/lib/mediapipe';
import type { PoseDetectionResult } from '@/types';

interface PoseDetectionProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  poseLandmarker: PoseLandmarker | null;
  handLandmarker: HandLandmarker | null;
  isActive: boolean;
  poseRef?: React.RefObject<PoseDetectionResult | null>;
}

export function usePoseDetection({
  videoRef,
  canvasRef,
  poseLandmarker,
  handLandmarker,
  isActive,
  poseRef
}: PoseDetectionProps) {
  const isRunningRef = useRef(false);
  const lastVideoTimeRef = useRef(-1);
  const drawingUtilsRef = useRef<any>(null);
  const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  const predictPosture = useCallback(async () => {
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;

    if (!videoElement || !canvasElement || !poseLandmarker || !handLandmarker || !isActive) {
      return;
    }

    if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      if (isRunningRef.current) {
        requestAnimationFrame(predictPosture);
      }
      return;
    }

    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;

    const startTimeMs = performance.now();

    try {
      if (lastVideoTimeRef.current !== videoElement.currentTime) {
        lastVideoTimeRef.current = videoElement.currentTime;

        const [poseResultRaw, handResultRaw] = await Promise.all([
          poseLandmarker.detectForVideo(videoElement, startTimeMs),
          handLandmarker.detectForVideo(videoElement, startTimeMs)
        ]);

        if (canvasCtxRef.current && drawingUtilsRef.current && poseResultRaw.landmarks.length > 0) {
          clearCanvas(canvasCtxRef.current, canvasElement.width, canvasElement.height);

          let leftHandLandmarks = undefined;
          let rightHandLandmarks = undefined;
          let leftHandWorldLandmarks = undefined;
          let rightHandWorldLandmarks = undefined;

          if (handResultRaw.handedness.length > 0) {
            handResultRaw.handedness.forEach((handednessList, index) => {
              const category = handednessList[0].categoryName;
              if (category === "Left") {
                leftHandLandmarks = handResultRaw.landmarks[index];
                leftHandWorldLandmarks = handResultRaw.worldLandmarks[index];
              } else if (category === "Right") {
                rightHandLandmarks = handResultRaw.landmarks[index];
                rightHandWorldLandmarks = handResultRaw.worldLandmarks[index];
              }
            });
          }

          const poseResult: PoseDetectionResult = {
            landmarks: poseResultRaw.landmarks, // landmarks are here
            worldLandmarks: poseResultRaw.worldLandmarks,
            leftHandLandmarks: leftHandLandmarks ? [leftHandLandmarks] : undefined,
            rightHandLandmarks: rightHandLandmarks ? [rightHandLandmarks] : undefined,
            leftHandWorldLandmarks: leftHandWorldLandmarks ? [leftHandWorldLandmarks] : undefined,
            rightHandWorldLandmarks: rightHandWorldLandmarks ? [rightHandWorldLandmarks] : undefined,
          };

          if (poseRef) {
            poseRef.current = poseResult;
          }

          drawPoseLandmarks(canvasCtxRef.current, drawingUtilsRef.current, poseResult);
        }
      }

      if (isRunningRef.current) {
        requestAnimationFrame(predictPosture);
      }
    } catch (error) {
      console.error("Error during pose detection:", error);
    }
  }, [videoRef, canvasRef, poseLandmarker, handLandmarker, isActive, poseRef]);

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
    if (isActive && poseLandmarker && handLandmarker) {
      startDetection();
    } else {
      stopDetection();
    }

    return () => {
      stopDetection();
    };
  }, [isActive, poseLandmarker, handLandmarker, startDetection, stopDetection]);

  return {
    startDetection,
    stopDetection,
  };
}