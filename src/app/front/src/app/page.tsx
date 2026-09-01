'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { VideoStream, ModelViewer } from '@/components/video';
import { Button, ViewPanel, AwakeningGrid } from '@/components/ui';
import type { GolemUIState, PoseDetectionResult } from '@/types';
import { useCalibrate } from '@/hooks';
import { CalibrationStatus } from '@/types/calibrate';

export default function Home() {
  const poseRef = useRef<PoseDetectionResult | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const calibrationAcceptedRef = useRef(false);

  const [uiState, setUIState] = useState<GolemUIState>({
    isStreaming: false,
    showInitialView: true,
    isLoading: false,
    error: null,
  });

  const [calibrateStatus, setCalibrateStatus] = useState<CalibrationStatus>('NO');
  const [calibrationAttempt, setCalibrationAttempt] = useState(0);

  const { success: isCalibrated } = useCalibrate({ poseRef });

  const handleActivate = useCallback(() => {
    setUIState(prev => ({
      ...prev,
      showInitialView: false,
      isStreaming: true,
    }));
  }, []);

  const handleError = useCallback((error: string) => {
    setUIState(prev => {
      if (prev.error !== error) {
        return {
          ...prev,
          error,
          isLoading: false,
        };
      }
      return prev;
    });
  }, []);

  const handleCalibrationFailure = useCallback(() => {
    calibrationAcceptedRef.current = false;
    setCalibrateStatus("NO");
    setCalibrationAttempt((attempt) => attempt + 1);
  }, []);

  useEffect(() => {
    if (calibrationAcceptedRef.current) return;

    if (isCalibrated) {
      setCalibrateStatus('STARTED');

      const timer = setTimeout(() => {
        calibrationAcceptedRef.current = true;
        setCalibrateStatus('YES');
      }, 2000);

      return () => clearTimeout(timer);
    }

    setCalibrateStatus('NO');
  }, [calibrationAttempt, isCalibrated]);

  return (
    <main className="flex-grow container mx-auto p-4 md:p-8 flex items-center justify-center">
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        
        <ViewPanel className="aspect-[4/3]">
          {uiState.showInitialView ? (
            <div className="flex flex-col items-center justify-center text-center p-8 h-full">
              <h2 className="font-golem text-2xl mb-4 text-white">Your perspective</h2>
              <p className="text-gray-300 mb-8 max-w-sm">
                To get started, grant access to your camera. Our AI model will process the image in real time and create your digital version of the Golem.
              </p>
              <Button onClick={handleActivate}>
                Activate the Golem
              </Button>
              {uiState.error && (
                <p className="text-red-400 text-sm mt-4 max-w-sm">
                  {uiState.error}
                </p>
              )}
            </div>
          ) : (
            <VideoStream 
              isStreaming={uiState.isStreaming} 
              onError={handleError}
              poseRef={poseRef}
              videoRef={videoRef}
              calibrateStatus={calibrateStatus}
            />
          )}
        </ViewPanel>

        <ViewPanel className="aspect-[4/3]">
          {uiState.showInitialView ? (
            <div className="flex flex-col items-center justify-center h-full p-8">
              <h2 className="font-golem text-2xl mb-4 text-white">The Golem is waiting</h2>
              <AwakeningGrid />
            </div>
          ) : (
            <ModelViewer 
              modelPath="/models/mixamo_blue_person.glb"
              isActive={uiState.isStreaming}
              onError={handleError}
              poseRef={poseRef}
              calibrateStatus={calibrateStatus}
              onCalibrationFailure={handleCalibrationFailure}
            />
          )}
        </ViewPanel>

      </div>
    </main>
  );
}
