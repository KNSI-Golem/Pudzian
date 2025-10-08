import React, { useRef, useEffect } from 'react';

interface VideoCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  stream: MediaStream | null;
}

export function VideoCanvas({ 
  videoRef, 
  canvasRef, 
  stream
}: VideoCanvasProps) {
  
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, videoRef]);

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover rounded shadow"
        style={{ 
          backgroundColor: "#000",
          transform: "scaleX(-1)"
        }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full rounded shadow"
        style={{
          transform: "scaleX(-1)"
        }}
      />
    </div>
  );
}