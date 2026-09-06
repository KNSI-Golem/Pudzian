import type { CalibrationStatus, CalibrationEvent } from '@/types';

export const CALIBRATION_HOLD_MS = 2000;

// to jest reducer, ktory zarzadza przejsciem stanu
export function calibrationReducer(
  state: CalibrationStatus,
  event: CalibrationEvent,
): CalibrationStatus {
  switch (state) {
    // wchodzimy w stan trzymania kalibracji (pomaranczowy stan) tylko wtedy jezeli poza jest ok (POSE_OK)
    case 'NO':
      return event.type === 'POSE_OK' ? 'STARTED' : 'NO';

    // stan trzymania kalibracji juz dziala
    case 'STARTED':
      if (event.type === 'POSE_LOST') return 'NO';       // ruszył się -> od nowa
      if (event.type === 'HOLD_ELAPSED') return 'YES';   // utrzymał -> gotowe
      if (event.type === 'FAILURE') return 'NO';         // brak stabilnej referencji -> od nowa
      return 'STARTED';                                  // POSE_OK w trakcie trzymania: bez zmian

    case 'YES':
      // opuszczamy zielone przez jawna porazke albo przez utrzymujaca sie utrate
      if (event.type === 'FAILURE' || event.type === 'POSE_LOST') return 'NO';
      return 'YES';
  }
}
