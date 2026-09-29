import React from 'react';

export type IndicatorVariant = 'accent' | 'warn' | 'error' | 'neutral';

interface StatusIndicatorProps {
  label: string;
  value: string;
  variant: IndicatorVariant;
}

const variantStyles: Record<IndicatorVariant, string> = {
  accent: 'bg-accent',
  warn: 'bg-warn',
  error: 'bg-error',
  neutral: 'bg-secondary-foreground',
};

export function StatusIndicator({ label, value, variant }: StatusIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-3 h-3 rounded-full ${variantStyles[variant]}`} />
      <span className="text-sm font-medium capitalize text-white">
        {label}: {value.toLowerCase()}
      </span>
    </div>
  );
}