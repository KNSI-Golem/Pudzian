'use client';

import React from 'react';
import { VideoStream, ModelViewer } from '@/components/video';
import { Button, ViewPanel } from '@/components/ui';
import type { SessionStatus, PoseDetectionResult } from '@/types';
import type { CalibrationStatus } from '@/types/calibrate';

interface ActiveSessionViewProps {
  status: SessionStatus;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  poseRef: React.RefObject<PoseDetectionResult | null>;
  calibrateStatus: CalibrationStatus;
  onError: (error: string) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export function ActiveSessionView({
  status,
  videoRef,
  poseRef,
  calibrateStatus,
  onError,
  onPause,
  onResume,
  onStop,
}: ActiveSessionViewProps) {
  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="flex items-center justify-between w-full bg-secondary 0 p-4 rounded-xl border border-secondary-foreground">
        <div className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full ${
              status === 'active'
                ? 'bg-accent'
                : status === 'paused'
                ? 'bg-warn'
                : 'bg-error'
            }`}
          />
          <span className="text-sm font-medium capitalize text-white">
            Status: {status}
          </span>
        </div>

        <div className="flex gap-3">
          {status === 'active' && (
            <Button onClick={onPause} variant="primary">
              Pause
            </Button>
          )}
          {status === 'paused' && (
            <Button onClick={onResume}>
              Resume
            </Button>
          )}
          <Button onClick={onStop} variant="outline">
            Stop
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch w-full">
        <ViewPanel className="aspect-3/4 relative">
          <VideoStream
            status={status}
            onError={onError}
            poseRef={poseRef}
            videoRef={videoRef}
            calibrateStatus={calibrateStatus}
          />
          
          {status === 'paused' && (
            <div className="absolute inset-0 bg-secondary-foreground/30 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-2xl">
              <p className="text-lg font-semibold">App Paused</p>
              <Button onClick={onResume} className="mt-4">
                Resume
              </Button>
            </div>
          )}
        </ViewPanel>

        <ViewPanel className="aspect-3/4 relative">
          <ModelViewer
            status={status}
            modelPath="/models/mixamo_blue_person.glb"
            onError={onError}
            poseRef={poseRef}
            calibrateStatus={calibrateStatus}
          />
        </ViewPanel>
      </div>
    </div>
  );
}