import React from 'react';
import type { SessionStatus } from '@/types';
import type { CalibrationStatus } from '@/types/calibrate';
import { Button } from './Button';

interface StatusBarProps {
  status: SessionStatus;
  calibrateStatus: CalibrationStatus;
  onError: (error: string) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export function StatusBar({
    status,
    calibrateStatus,
    onError,
    onPause,
    onResume,
    onStop,
    }: StatusBarProps) {

    return (
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
    );
}