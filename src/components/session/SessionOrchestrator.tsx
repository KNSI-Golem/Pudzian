'use client';

import React, { useRef, useReducer, useCallback } from 'react';
import { useCalibrationController } from '@/hooks';
import { SessionReducer, initialSessionState } from './SessionReducer';
import { InitialView } from '@/components/layout';
import { ActiveSessionView } from '@/components/layout';
import type { PoseDetectionResult } from '@/types';

export function SessionOrchestrator() {
  const poseRef = useRef<PoseDetectionResult | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [state, dispatch] = useReducer(SessionReducer, initialSessionState);
  const { calibrateStatus, handleCalibrationFailure } = useCalibrationController({ poseRef });

  const handleError = useCallback((error: string) => {
    dispatch({ type: 'ERROR', payload: error });
  }, []);

  return (
    <div className="w-3/4 flex justify-center">
      {state.status === 'idle' ? (
        <InitialView
          error={state.error}
          onStart={() => dispatch({ type: 'START' })}
        />
      ) : (
        <ActiveSessionView
          status={state.status}
          videoRef={videoRef}
          poseRef={poseRef}
          calibrateStatus={calibrateStatus}
          onCalibrationFailure={handleCalibrationFailure}
          onError={handleError}
          onPause={() => dispatch({ type: 'PAUSE' })}
          onResume={() => dispatch({ type: 'RESUME' })}
          onStop={() => dispatch({ type: 'RESET' })}
        />
      )}
    </div>
  );
}