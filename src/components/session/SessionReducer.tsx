import { SessionState, SessionEvent } from '@/types';

export const initialSessionState: SessionState = {
  status: 'idle',
  error: null,
};

export function SessionReducer(state: SessionState, event: SessionEvent): SessionState {
  switch (event.type) {
    case 'START':
      return { status: 'active', error: null };

    case 'PAUSE':
      if (state.status !== 'active') return state;
      return { ...state, status: 'paused' };

    case 'RESUME':
      if (state.status !== 'paused') return state;
      return { status: 'active', error: null };

    case 'RESET':
      return initialSessionState;

    case 'ERROR':
      return { status: 'error', error: event.payload };

    default:
      return state;
  }
}