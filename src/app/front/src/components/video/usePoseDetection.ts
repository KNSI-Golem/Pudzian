import React, { useRef, useEffect, useCallback } from 'react';
import { PoseLandmarker, HandLandmarker } from '@mediapipe/tasks-vision';
import { drawPoseLandmarks, clearCanvas, createDrawingUtils } from '@/lib/mediapipe';
import type { PoseDetectionResult } from '@/types';
import { perfTracker } from '@/lib/perf/perfTracker';

const LEFT_WRIST_IDX = 15;
const RIGHT_WRIST_IDX = 16;

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

        perfTracker.markVideoFrame();
        const pStart = perfTracker.startPose();
        const poseResultRaw = await poseLandmarker.detectForVideo(videoElement, startTimeMs);
        perfTracker.endPose(pStart);
        
        const hStart = perfTracker.startHand();
        const handResultRaw = await handLandmarker.detectForVideo(videoElement, startTimeMs);
        perfTracker.endHand(hStart);

        if (canvasCtxRef.current && drawingUtilsRef.current && poseResultRaw.landmarks.length > 0) {
          clearCanvas(canvasCtxRef.current, canvasElement.width, canvasElement.height);

          let leftHandLandmarks = undefined;
          let rightHandLandmarks = undefined;
          let leftHandWorldLandmarks = undefined;
          let rightHandWorldLandmarks = undefined;

          const distanceSq2D = (a: { x: number; y: number }, b: { x: number; y: number }) => {
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            return dx * dx + dy * dy;
          };

          const detectedHands = handResultRaw.landmarks
            .map((landmarks, index) => ({
              landmarks,
              worldLandmarks: handResultRaw.worldLandmarks[index],
              handedness: handResultRaw.handedness[index]?.[0]?.categoryName,
            }))
            .filter((h) => h.landmarks && h.landmarks[0]);

          const poseLandmarks = poseResultRaw.landmarks[0];
          const poseLeftWrist = poseLandmarks?.[LEFT_WRIST_IDX];
          const poseRightWrist = poseLandmarks?.[RIGHT_WRIST_IDX];

          // Przypisanie dłoni opieramy o odległość do nadgarstków z Pose,
          // dzięki czemu nie przeskakują strony przy niepewnym handedness.
          if (detectedHands.length > 0 && poseLeftWrist && poseRightWrist) {
            const candidates = detectedHands
              .map((h) => ({
                ...h,
                dLeft: distanceSq2D(h.landmarks[0], poseLeftWrist),
                dRight: distanceSq2D(h.landmarks[0], poseRightWrist),
              }))
              .sort((a, b) => Math.min(a.dLeft, a.dRight) - Math.min(b.dLeft, b.dRight))
              .slice(0, 2);

            if (candidates.length === 1) {
              const hand = candidates[0];
              if (hand.dLeft <= hand.dRight) {
                leftHandLandmarks = hand.landmarks;
                leftHandWorldLandmarks = hand.worldLandmarks;
              } else {
                rightHandLandmarks = hand.landmarks;
                rightHandWorldLandmarks = hand.worldLandmarks;
              }
            } else if (candidates.length === 2) {
              const [h0, h1] = candidates;
              const directCost = h0.dLeft + h1.dRight;
              const swappedCost = h0.dRight + h1.dLeft;

              if (directCost <= swappedCost) {
                leftHandLandmarks = h0.landmarks;
                leftHandWorldLandmarks = h0.worldLandmarks;
                rightHandLandmarks = h1.landmarks;
                rightHandWorldLandmarks = h1.worldLandmarks;
              } else {
                leftHandLandmarks = h1.landmarks;
                leftHandWorldLandmarks = h1.worldLandmarks;
                rightHandLandmarks = h0.landmarks;
                rightHandWorldLandmarks = h0.worldLandmarks;
              }
            }
          } else if (handResultRaw.handedness.length > 0) {
            // Fallback dla sytuacji bez wiarygodnych nadgarstków z Pose.
            handResultRaw.handedness.forEach((handednessList, index) => {
              const category = handednessList[0].categoryName;
              if (category === "Left") {
                rightHandLandmarks = handResultRaw.landmarks[index];
                rightHandWorldLandmarks = handResultRaw.worldLandmarks[index];
              } else if (category === "Right") {
                leftHandLandmarks = handResultRaw.landmarks[index];
                leftHandWorldLandmarks = handResultRaw.worldLandmarks[index];
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
        } else {
          if (canvasCtxRef.current) {
            clearCanvas(canvasCtxRef.current, canvasElement.width, canvasElement.height);
          }
          if (poseRef) {
            poseRef.current = null;
          }
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
    if (poseRef) {
      poseRef.current = null;
    }
  }, [poseRef]);

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