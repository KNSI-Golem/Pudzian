import React from 'react';
import Image from 'next/image';
import { APP_CONFIG } from '@/lib/constants';

export function Header() {
  return (
    <header className="w-full p-4 border-b border-gray-600/50 sticky top-0 z-10 bg-opacity-80 backdrop-blur-sm" 
            style={{ backgroundColor: '#3a3a46cc' }}>
      <div className="container mx-auto flex items-center gap-4">
        <Image
          src="/logo.svg"
          alt="GOLEM Logo"
          width={50}
          height={50}
        />
        <div className="flex flex-col items-start">
          <h1 className="font-golem text-3xl font-bold tracking-widest text-white">
            Golem VR
          </h1>
          <p className="font-golem text-xs text-gray-300 -mt-1">
            {APP_CONFIG.fullName}
          </p>
        </div>
      </div>
    </header>
  );
}