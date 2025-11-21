import React from 'react';
import { cn } from '@/lib/utils';
import type { ViewPanelProps } from '@/types';

export function ViewPanel({ children, title, className }: ViewPanelProps) {
  return (
    <div className={cn(
      "flex flex-col rounded-lg view-panel transition-all duration-500",
      className
    )}>
      {title && (
        <div className="p-4 border-b border-gray-600/50">
          <h2 className="font-golem text-xl text-white">{title}</h2>
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}