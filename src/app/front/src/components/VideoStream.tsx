'use client';

import { useEffect, useRef, useState } from "react";
import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils
} from "@mediapipe/tasks-vision";

interface VideoStreamProps {
  isStreaming: boolean;
  className?: string;
}

export default function VideoStream({ isStreaming, className = "" }: VideoStreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const webcamRunningRef = useRef(false);
  const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawingUtilsRef = useRef<DrawingUtils | null>(null);
  const lastVideoTimeRef = useRef(-1);

  useEffect(() => {
    const createPoseLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );

        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        });

        setPoseLandmarker(landmarker);
      } catch (error) {
        console.error("Error creating pose landmarker:", error);
      }
    };
    
    createPoseLandmarker();
  }, []);

  const predictPosture = async () => {
    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;

    if (!videoElement || !poseLandmarker) return;

    if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      if (webcamRunningRef.current) {
        requestAnimationFrame(predictPosture);
      }
      return;
    }

    canvasElement!.width = videoElement.videoWidth;
    canvasElement!.height = videoElement.videoHeight;

    const startTimeMs = performance.now();

    try {
      if (lastVideoTimeRef.current !== videoElement.currentTime) {
        lastVideoTimeRef.current = videoElement.currentTime;
        
        const result = await poseLandmarker.detectForVideo(videoElement, startTimeMs);
        
        if (canvasCtxRef.current && drawingUtilsRef.current) {
          canvasCtxRef.current.save();
          canvasCtxRef.current.clearRect(0, 0, canvasElement!.width, canvasElement!.height);
          
          for (const landmark of result.landmarks) {
            drawingUtilsRef.current.drawLandmarks(landmark, {
              radius: (data: any) => DrawingUtils.lerp(data.from.z, -0.15, 0.1, 5, 1)
            });
            drawingUtilsRef.current.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS);
          }
          
          canvasCtxRef.current.restore();
        }
      }

      if (webcamRunningRef.current) {
        requestAnimationFrame(predictPosture);
      }
    } catch (error) {
      console.error("Error during pose detection:", error);
    }
  };

  const startVideo = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: 640,
          height: 480
        }
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        webcamRunningRef.current = true;
      }
      
      if (canvasRef.current) {
        canvasCtxRef.current = canvasRef.current.getContext("2d");
        if (canvasCtxRef.current) {
          drawingUtilsRef.current = new DrawingUtils(canvasCtxRef.current);
        }
      }
      
      predictPosture();
    } catch (error) {
      console.error("Error accessing user camera:", error);
    }
  };

  const stopVideo = () => {
    webcamRunningRef.current = false;
    
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
    if (isStreaming && poseLandmarker) {
      startVideo();
    } else {
      stopVideo();
    }

    return () => stopVideo();
  }, [isStreaming, poseLandmarker]);

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {isStreaming ? (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="rounded shadow"
            style={{ 
              width: "640px",
              height: "480px",
              backgroundColor: "#000",
              transform: "scaleX(-1)"
            }}
          />
          <canvas
            ref={canvasRef}
            className="absolute left-0 top-0 rounded shadow"
            style={{
              width: "640px",
              height: "480px",
              transform: "scaleX(-1)"
            }}
          />
        </div>
      ) : (
        <div
          className="rounded shadow flex items-center justify-center bg-black text-white font-bold"
          style={{
            width: "640px",
            height: "480px"
          }}
        >
          <div className="text-center">
            <svg 
              className="w-16 h-16 mx-auto mb-4 opacity-50" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M15 10l4.55a1 1 0 011.45.89V14a1 1 0 01-1.45.89L15 12M4 6h11a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1z"
              />
            </svg>
            <p className="text-gray-400">CAMERA FEED</p>
          </div>
        </div>
      )}
    </div>
  );
}