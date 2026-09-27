'use client';

import React from 'react';
import { Button, ViewPanel } from '@/components/ui';

interface InitialViewProps {
  onStart: () => void;
  error: string | null;
}

export function InitialView({ onStart, error }: InitialViewProps) {
  return (
    <div className="flex justify-center items-stretch w-full">
      <ViewPanel className="aspect-5/4">
        <div className="flex flex-col rounded-2xl items-center justify-center text-center p-8 h-full">
          <h2 className="text-2xl mb-4">GolemVR</h2>
          <p className="mb-8 max-w-sm">
            To get started, grant access to your camera. Our AI model will process
            the image in real time and create your digital version of the Golem.
          </p>
          <Button onClick={onStart}>
            Activate the Golem
          </Button>

          {error && (
            <p className="text-red-400 text-sm mt-4 max-w-sm">
              {error}
            </p>
          )}
        </div>
      </ViewPanel>
    </div>
  );
}