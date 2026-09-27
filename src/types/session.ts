export type SessionStatus = 'idle' | 'active' | 'paused' | 'error';

export interface SessionState {
  status: SessionStatus;
  error: string | null;
}

export type SessionEvent =
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'RESET' }
  | { type: 'ERROR'; payload: string };