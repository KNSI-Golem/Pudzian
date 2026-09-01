import React from 'react';

export function CameraIcon() {
  return (
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
  );
}

interface CameraPlaceholderProps {
  message?: string;
  className?: string;
}

export function CameraPlaceholder({ 
  message = "CAMERA FEED",
  className = ""
}: CameraPlaceholderProps) {
  return (
    <div className={`w-full h-full rounded shadow flex items-center justify-center text-white font-bold ${className}`}>
      <div className="text-center">
        <CameraIcon />
        <p className="text-gray-400">{message}</p>
      </div>
    </div>
  );
}