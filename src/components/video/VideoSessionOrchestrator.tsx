import { useState, useEffect, useCallback, useRef, useReducer } from 'react';
import { VideoStream, ModelViewer } from '@/components/video';
import { Button, ViewPanel } from '@/components/ui';
import type { GolemUIState, PoseDetectionResult } from '@/types';
import { useCalibrate } from '@/hooks';
import { calibrationReducer, CALIBRATION_HOLD_MS } from '@/lib/calibrate';

export function VideoSessionOrchestrator() {
  const poseRef = useRef<PoseDetectionResult | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [uiState, setUIState] = useState<GolemUIState>({
    isStreaming: false,
    showInitialView: true,
    isLoading: false,
    error: null,
  });

  const [calibrateStatus, dispatch] = useReducer(calibrationReducer, 'NO');   // stan kalibracji
  const { success: isCalibrated } = useCalibrate({ poseRef });               // czy poza jest okej

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
    dispatch({ type: 'FAILURE' });
  }, []);


  useEffect(() => {
    // stoisz dobrze i nie zaczal sie countdown utrzymania pozy dobrej
    if (isCalibrated && calibrateStatus === 'NO') {
      dispatch({ type: 'POSE_OK' });
    }
    // nie stoisz dobrze i zaczal sie countdown
    else if (!isCalibrated && calibrateStatus === 'STARTED') {
      dispatch({ type: 'POSE_LOST' });
    }
  }, [isCalibrated, calibrateStatus]);

  // czekales 2s w poprawnej pozie? -> mozna zaczac mapowac na model 3D
  useEffect(() => {
    if (calibrateStatus !== 'STARTED') return;

    const timer = setTimeout(() => dispatch({ type: 'HOLD_ELAPSED' }), CALIBRATION_HOLD_MS);
    return () => clearTimeout(timer);
  }, [calibrateStatus]);

  // czekales 2s w niepoprawnej pozie? -> wroc do kalibracji, cos jest nie tak z twoja poza
  useEffect(() => {
    if (calibrateStatus !== 'YES' || isCalibrated) return;

    const timer = setTimeout(() => dispatch({ type: 'POSE_LOST' }), CALIBRATION_HOLD_MS);
    return () => clearTimeout(timer);
  }, [calibrateStatus, isCalibrated]);

  return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch w-3/4">

        <ViewPanel className="aspect-3/4">
          {uiState.showInitialView ? (
            <div className="flex flex-col rounded-2xl items-center justify-center text-center p-8 h-full">
              <h2 className="text-2xl mb-4">Your perspective</h2>
              <p className="mb-8 max-w-sm">
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

        <ViewPanel className="aspect-3/4">
          {uiState.showInitialView ? (
            <div className="flex flex-col rounded-2xl p-8 h-full">
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
  );
}
