'use client';

import { useState, useEffect } from 'react';
import VideoStream from '../components/VideoStream';

export default function Home() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [showInitialView, setShowInitialView] = useState(true);

  const handleActivate = () => {
    setShowInitialView(false);
    setIsStreaming(true);
  };

  useEffect(() => {
    const generateAwakeningCells = () => {
      const cells = [];
      for (let i = 0; i < 100; i++) {
        cells.push(
          <div 
            key={i} 
            style={{ animationDelay: `${Math.random() * 2}s` }} 
          />
        );
      }
      return cells;
    };

    if (showInitialView) {
      const awakeningGrid = document.querySelector('.golem-awakening-grid');
      if (awakeningGrid) {
        awakeningGrid.innerHTML = '';
        generateAwakeningCells().forEach(cell => {
          const div = document.createElement('div');
          div.style.animationDelay = `${Math.random() * 2}s`;
          awakeningGrid.appendChild(div);
        });
      }
    }
  }, [showInitialView]);

  return (
    <main className="flex-grow container mx-auto p-4 md:p-8 flex items-center justify-center">
      <div className="w-full grid grid-cols-1 lg:grid-cols-11 gap-8 items-stretch">
        
        <div className="lg:col-span-5 h-[60vh] flex flex-col rounded-lg view-panel transition-all duration-500">
          {showInitialView ? (
            <div className="flex flex-col items-center justify-center text-center p-8 h-full">
              <h2 className="font-golem text-2xl mb-4 text-white">TWOJA PERSPEKTYWA</h2>
              <p className="text-gray-300 mb-8 max-w-sm">
                Aby rozpocząć, zezwól na dostęp do kamery. Nasz model sztucznej inteligencji przetworzy obraz w czasie rzeczywistym i stworzy Twoją cyfrową wersję Golema.
              </p>
              <button 
                onClick={handleActivate}
                className="golem-button py-3 px-8 rounded-lg font-golem"
              >
                Aktywuj Golema
              </button>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <VideoStream isStreaming={isStreaming} />
            </div>
          )}
        </div>

        <div className="lg:col-span-6 h-[60vh] flex flex-col rounded-lg view-panel transition-all duration-500">
          {showInitialView ? (
            <div className="flex flex-col items-center justify-center h-full p-8">
              <h2 className="font-golem text-2xl mb-4 text-white">GOLEM CZEKA</h2>
              <div className="golem-awakening-grid w-48 h-48 opacity-50"></div>
              <p className="text-gray-400 mt-8 text-sm">Inicjalizacja modelu...</p>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <VideoStream isStreaming={isStreaming} />
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
