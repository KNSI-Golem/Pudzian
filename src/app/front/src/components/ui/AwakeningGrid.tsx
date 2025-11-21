import React, { useEffect, useRef } from 'react';
import { cn, randomDelay } from '@/lib/utils';
import type { AwakeningGridProps } from '@/types';

export function AwakeningGrid({
  cellCount = 100,
  animationDelay = 2,
  className
}: AwakeningGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    // Clear existing cells
    grid.innerHTML = '';

    // Generate animated cells
    for (let i = 0; i < cellCount; i++) {
      const cell = document.createElement('div');
      cell.style.animationDelay = randomDelay(animationDelay);
      grid.appendChild(cell);
    }
  }, [cellCount, animationDelay]);

  return (
    <div
      ref={gridRef}
      className={cn(
        "golem-awakening-grid w-48 h-48 opacity-50",
        className
      )}
    />
  );
}