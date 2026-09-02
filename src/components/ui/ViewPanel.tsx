import React from 'react';
import { cn } from '@/lib/utils';
import type { ViewPanelProps } from '@/types';

export function ViewPanel({ children, className }: ViewPanelProps) {
  return (
    <div className={cn(
      "flex flex-col rounded-2xl items-center justify-center text-center bg-zinc-900/70 border border-zinc-600",
      className
    )}>
        {children}
    </div>
  );
}