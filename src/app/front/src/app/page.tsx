'use client';

import { useState } from 'react';
import { VideoStream } from '@/components/video';
import { Button, ViewPanel, AwakeningGrid } from '@/components/ui';
import type { GolemUIState } from '@/types';

export default function Home() {
  const [uiState, setUIState] = useState<GolemUIState>({
    isStreaming: false,
    showInitialView: true,
    isLoading: false,
    error: null,
  });

  const handleActivate = () => {
    setUIState(prev => ({
      ...prev,
      showInitialView: false,
      isStreaming: true,
    }));
  };

  const handleError = (error: string) => {
    setUIState(prev => ({
      ...prev,
      error,
      isLoading: false,
    }));
  };

  return (
    <main className="flex-grow container mx-auto p-4 md:p-8 flex items-center justify-center">
      <div className="w-full grid grid-cols-1 lg:grid-cols-11 gap-8 items-stretch">
        
        <ViewPanel className="lg:col-span-5 h-[60vh]">
          {uiState.showInitialView ? (
            <div className="flex flex-col items-center justify-center text-center p-8 h-full">
              <h2 className="font-golem text-2xl mb-4 text-white">TWOJA PERSPEKTYWA</h2>
              <p className="text-gray-300 mb-8 max-w-sm">
                Aby rozpocząć, zezwól na dostęp do kamery. Nasz model sztucznej inteligencji przetworzy obraz w czasie rzeczywistym i stworzy Twoją cyfrową wersję Golema.
              </p>
              <Button onClick={handleActivate}>
                Aktywuj Golema
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
            />
          )}
        </ViewPanel>

        <ViewPanel className="lg:col-span-6 h-[60vh]">
          {uiState.showInitialView ? (
            <div className="flex flex-col items-center justify-center h-full p-8">
              <h2 className="font-golem text-2xl mb-4 text-white">GOLEM CZEKA</h2>
              <AwakeningGrid />
              <p className="text-gray-400 mt-8 text-sm">Inicjalizacja modelu...</p>
            </div>
          ) : (
            <VideoStream 
              isStreaming={uiState.isStreaming}
              onError={handleError}
            />
          )}
        </ViewPanel>

      </div>
    </main>
  );
}
