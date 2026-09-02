import type { VariantProps } from 'class-variance-authority';

export type GolemUIState = {
  isStreaming: boolean;
  showInitialView: boolean;
  isLoading: boolean;
  error: string | null;
}

export type ViewPanelProps = {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export type AwakeningGridProps = {
  cellCount?: number;
  animationDelay?: number;
  className?: string;
}