export interface GolemUIState {
  isStreaming: boolean;
  showInitialView: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export interface ViewPanelProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export interface AwakeningGridProps {
  cellCount?: number;
  animationDelay?: number;
  className?: string;
}