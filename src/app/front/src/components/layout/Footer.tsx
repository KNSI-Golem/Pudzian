import React from 'react';
import { APP_CONFIG } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="w-full p-4 mt-8">
      <div className="container mx-auto text-center text-sm text-gray-500">
        <p>
          &copy; 2025 {APP_CONFIG.fullName} | {APP_CONFIG.name}.
        </p>
      </div>
    </footer>
  );
}