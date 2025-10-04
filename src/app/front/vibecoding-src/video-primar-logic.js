'use client';

import { useEffect, useRef, useState } from "react";
import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils
} from "@mediapipe/tasks-vision";

export default function UserVideo({ isStreaming }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [poseLandmarker, setPoseLandmarker] = useState(null);
  const [stream, setStream] = useState(null);

  let webcamRunning = false;
  let canvasCtx;
  let drawingUtils;
  let lastVideoTime = -1;

  useEffect(() => {
    const createPoseLandmarker = async () => {
      const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );

      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
              "models/pose_landmarker_lite.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
      });

      setPoseLandmarker(landmarker);
    };
    createPoseLandmarker();
  }, []);

  const predictPosture = async () => {

    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;

    if (videoElement == null) {return;}

    if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      requestAnimationFrame(predictPosture);
      return;
    }

    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;

    let startTimeMs = performance.now();

    try {
      if (lastVideoTime !== videoElement.currentTime) {
        lastVideoTime = videoElement.currentTime;
        poseLandmarker.detectForVideo(videoElement, startTimeMs, (result) => {
          canvasCtx.save();
          canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
          for (const landmark of result.landmarks) {
            drawingUtils.drawLandmarks(landmark, {
              radius: (data) => DrawingUtils.lerp(data.from.z, -0.15, 0.1, 5, 1)
            });
            drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS);
          }
          canvasCtx.restore();
        });

        if (webcamRunning) {
          requestAnimationFrame(predictPosture);
        }
      }

    } catch (error) {
      console.error("Error during pose detection:", error);
    }
  };

  const startVideo = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        webcamRunning = true
      }
      if (canvasRef.current) {
        canvasCtx = canvasRef.current.getContext("2d");
        drawingUtils = new DrawingUtils(canvasCtx);
      }
      predictPosture();

    } catch (error) {
      console.error("Error accessing user camera:", error);
    }
  };

  const stopVideo = () => {
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  useEffect(() => {
    if (isStreaming) {
      if (!poseLandmarker) return;
      startVideo();
    }
    return () => stopVideo();
  }, [isStreaming, poseLandmarker]);

  return (
    <div className="flex flex-col items-center justify-center">
      {isStreaming ? (
          <div style={{position: "relative"}}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="rounded shadow"
              style={{ width: "640px",
                height: "480px",
                backgroundColor: "#000",
                transform: "scaleX(-1)",}}
            />
            <canvas
                ref={canvasRef}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: "640px",
                  height: "480px",
                  transform: "scaleX(-1)",
                }}
            />
      </div>
      ) : (
        <div
          className="rounded shadow"
          style={{
            width: "640px",
            height: "480px",
            backgroundColor: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#000",
            fontWeight: "bold",
          }}
        >
        </div>
      )}
    </div>
  );
}
