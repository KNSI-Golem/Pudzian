import React, { useCallback, useEffect, useRef } from "react";
import type {
  HandLandmarker,
  HandLandmarkerResult,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";
import {
  clearCanvas,
  createDrawingUtils,
  createTrackingResult,
  assignHandsInResult,
  drawHandLandmarks,
  drawPoseLandmarks,
  HandAssignmentTracker,
  runMediaPipeOperation,
} from "@/lib/mediapipe";
import type { PoseDetectionResult } from "@/types";

interface PoseDetectionProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  poseLandmarker: PoseLandmarker | null;
  handLandmarker?: HandLandmarker | null;
  isActive: boolean;
  poseRef?: React.RefObject<PoseDetectionResult | null>;
}

export function usePoseDetection({
  videoRef,
  canvasRef,
  poseLandmarker,
  handLandmarker,
  isActive,
  poseRef,
}: PoseDetectionProps) {
  const isRunningRef = useRef(false);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const runGenerationRef = useRef(0);
  const lastVideoTimeRef = useRef(-1);
  const drawingUtilsRef = useRef<ReturnType<
    typeof createDrawingUtils
  > | null>(null);
  const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const reportedHandRuntimeErrorRef = useRef(false);
  const handAssignmentRef = useRef(new HandAssignmentTracker());

  const predictPosture = useCallback((generation: number) => {
    if (
      !isRunningRef.current ||
      generation !== runGenerationRef.current
    ) {
      return;
    }
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;

    if (!videoElement || !canvasElement || !poseLandmarker || !isActive) {
      return;
    }

    if (
      videoElement.readyState < 2 ||
      videoElement.videoWidth === 0 ||
      videoElement.videoHeight === 0
    ) {
      if (
        isRunningRef.current &&
        generation === runGenerationRef.current
      ) {
        animationFrameRef.current = requestAnimationFrame(() =>
          predictPosture(generation),
        );
      }
      return;
    }

    if (canvasElement.width !== videoElement.videoWidth) {
      canvasElement.width = videoElement.videoWidth;
    }
    if (canvasElement.height !== videoElement.videoHeight) {
      canvasElement.height = videoElement.videoHeight;
    }

    if (lastVideoTimeRef.current !== videoElement.currentTime) {
      lastVideoTimeRef.current = videoElement.currentTime;
      const timestampMs = performance.now();

      try {
        const poseResult = runMediaPipeOperation(() =>
          poseLandmarker.detectForVideo(videoElement, timestampMs),
        );
        let handResult: HandLandmarkerResult | undefined;

        if (poseResult.landmarks.length > 0 && handLandmarker) {
          try {
            handResult = runMediaPipeOperation(() =>
              handLandmarker.detectForVideo(videoElement, timestampMs),
            );
            reportedHandRuntimeErrorRef.current = false;
          } catch (handError) {
            if (!reportedHandRuntimeErrorRef.current) {
              console.warn(
                "Hand tracking failed; continuing with body tracking",
                handError,
              );
              reportedHandRuntimeErrorRef.current = true;
            }
          }
        }

        const trackingResult = createTrackingResult(
          poseResult,
          handResult,
          timestampMs,
          {
            width: videoElement.videoWidth,
            height: videoElement.videoHeight,
          },
        );
        const result = trackingResult
          ? assignHandsInResult(trackingResult, handAssignmentRef.current)
          : undefined;

        if (canvasCtxRef.current && drawingUtilsRef.current) {
          clearCanvas(
            canvasCtxRef.current,
            canvasElement.width,
            canvasElement.height,
          );
        }

        if (result) {
          if (poseRef) {
            poseRef.current = result;
          }
          if (canvasCtxRef.current && drawingUtilsRef.current) {
            drawPoseLandmarks(
              canvasCtxRef.current,
              drawingUtilsRef.current,
              result,
            );
            drawHandLandmarks(drawingUtilsRef.current, result);
          }
        } else if (poseRef) {
          poseRef.current = null;
        }
      } catch (poseError) {
        console.error("Pose detection failed", poseError);
        if (poseRef) {
          poseRef.current = null;
        }
      }
    }

    if (
      isRunningRef.current &&
      generation === runGenerationRef.current
    ) {
      animationFrameRef.current = requestAnimationFrame(() =>
        predictPosture(generation),
      );
    }
  }, [
    canvasRef,
    handLandmarker,
    isActive,
    poseLandmarker,
    poseRef,
    videoRef,
  ]);

  const startDetection = useCallback(() => {
    if (!canvasRef.current || isRunningRef.current) return;

    canvasCtxRef.current = canvasRef.current.getContext("2d");
    if (canvasCtxRef.current) {
      drawingUtilsRef.current = createDrawingUtils(canvasCtxRef.current);
    }

    isRunningRef.current = true;
    const generation = ++runGenerationRef.current;
    animationFrameRef.current = requestAnimationFrame(() =>
      predictPosture(generation),
    );
  }, [canvasRef, predictPosture]);

  const stopDetection = useCallback(() => {
    isRunningRef.current = false;
    runGenerationRef.current += 1;
    if (animationFrameRef.current !== undefined) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
    lastVideoTimeRef.current = -1;
    reportedHandRuntimeErrorRef.current = false;
    handAssignmentRef.current.reset();
    if (poseRef) {
      poseRef.current = null;
    }
  }, [poseRef]);

  useEffect(() => {
    if (isActive && poseLandmarker) {
      startDetection();
    } else {
      stopDetection();
    }

    return stopDetection;
  }, [isActive, poseLandmarker, startDetection, stopDetection]);

  return {
    startDetection,
    stopDetection,
  };
}
