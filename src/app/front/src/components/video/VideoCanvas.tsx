import React, { useRef, useEffect } from 'react';

interface VideoCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  stream: MediaStream | null;
  width?: number;
  height?: number;
}

export function VideoCanvas({ 
  videoRef, 
  canvasRef, 
  stream, 
  width = 640, 
  height = 480 
}: VideoCanvasProps) {
  
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, videoRef]);

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="rounded shadow"
        style={{ 
          width: `${width}px`,
          height: `${height}px`,
          backgroundColor: "#000",
          transform: "scaleX(-1)"
        }}
      />
      <canvas
        ref={canvasRef}
        className="absolute left-0 top-0 rounded shadow"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          transform: "scaleX(-1)"
        }}
      />
    </div>
  );
}