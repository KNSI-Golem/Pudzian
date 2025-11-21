'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useThreeScene } from '@/hooks/useThreeScene';
import type { ModelViewerProps } from '@/types';

export function ModelViewer({ 
  modelPath, 
  isActive, 
  className = "", 
  onError,
  onLoad 
}: ModelViewerProps) {
  const { mountRef, isLoading, error, model } = useThreeScene({
    modelPath: isActive ? modelPath : undefined,
    enableControls: true,
  });

  const lastErrorRef = useRef<string | null>(null);
  const lastModelRef = useRef<any>(null);

  // Stable error handler
  const handleError = useCallback((errorMessage: string) => {
    if (onError && errorMessage !== lastErrorRef.current) {
      lastErrorRef.current = errorMessage;
      onError(errorMessage);
    }
  }, [onError]);

  // Stable load handler
  const handleLoad = useCallback(() => {
    if (onLoad) {
      onLoad();
    }
  }, [onLoad]);

  // Handle error callback - only call when error changes
  useEffect(() => {
    if (error && error !== lastErrorRef.current) {
      handleError(error);
    }
  }, [error, handleError]);

  // Handle load callback - only call when model changes
  useEffect(() => {
    if (model && model !== lastModelRef.current) {
      lastModelRef.current = model;
      handleLoad();
    }
  }, [model, handleLoad]);

  return (
    <div className={`w-full h-full relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-10">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-white text-sm">Ładowanie modelu 3D...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-75 z-10">
          <div className="text-center p-4">
            <p className="text-white text-sm mb-2">Błąd ładowania modelu:</p>
            <p className="text-red-200 text-xs">{error}</p>
          </div>
        </div>
      )}
      
      <div 
        ref={mountRef} 
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
}