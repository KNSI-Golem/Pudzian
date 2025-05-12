'use client';

import { useEffect, useRef, useState } from "react";

export default function UserVideo({ isStreaming }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);

  const startVideo = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
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
      startVideo();
    } else {
      stopVideo();
    }
    return () => stopVideo();
  }, [isStreaming]);

  return (
    <div className="flex flex-col items-center justify-center">
      {isStreaming ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="rounded shadow"
          style={{ width: "640px", height: "480px", backgroundColor: "#000" }}
        />
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
