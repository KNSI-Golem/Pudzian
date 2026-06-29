export type GolemUIState = {
  isStreaming: boolean;
  showInitialView: boolean;
  isLoading: boolean;
  error: string | null;
}

export type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
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