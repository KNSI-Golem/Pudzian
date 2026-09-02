import React from 'react';

interface CameraPlaceholderProps {
  message?: string;
  className?: string;
}

export function CameraPlaceholder({ 
  message ="WAITING FOR CAMERA PERMISSIONS",
  className = ""
}: CameraPlaceholderProps) {
  return (
    <div className={`w-full h-full rounded shadow flex items-center justify-center font-bold ${className}`}>
      <div className="text-center">
        <p className="text-gray-400">{message}</p>
      </div>
    </div>
  );
}