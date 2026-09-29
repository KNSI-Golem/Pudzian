import type { CalibrationStatus, CalibrationEvent } from '@/types';

export function calibrationReducer(
  state: CalibrationStatus,
  event: CalibrationEvent,
): CalibrationStatus {
  switch (state) {
    case 'NO':
      return event.type === 'POSE_OK' ? 'STARTED' : 'NO';

    case 'STARTED':
      if (event.type === 'POSE_LOST') return 'NO';
      if (event.type === 'HOLD_ELAPSED') return 'YES';
      if (event.type === 'FAILURE') return 'NO';
      return 'STARTED';

    case 'YES':
      if (event.type === 'FAILURE' || event.type === 'POSE_LOST') return 'NO';
      return 'YES';
  }
}