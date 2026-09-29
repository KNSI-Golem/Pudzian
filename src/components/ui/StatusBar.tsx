import React from 'react';
import type { SessionStatus } from '@/types';
import { Button } from './Button';
import { StatusIndicator, IndicatorVariant } from './StatusIndicator';

interface StatusBarProps {
  status: SessionStatus;
  onError: (error: string) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

const getSessionVariant = (status: SessionStatus): IndicatorVariant => {
  switch (status) {
    case 'active':
      return 'accent';
    case 'paused':
      return 'warn';
    default:
      return 'error';
  }
};


export function StatusBar({
  status,
  onError,
  onPause,
  onResume,
  onStop,
}: StatusBarProps) {
  return (
    <div className="flex items-center justify-between w-full bg-secondary p-4 rounded-xl border border-secondary-foreground">
      <div className="flex items-center gap-6">
        <StatusIndicator
          label="Status"
          value={status}
          variant={getSessionVariant(status)}
        />

        <div className="h-4 w-px bg-secondary-foreground/40" />

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