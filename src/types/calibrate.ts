export type CalibrationStatus = 'NO' | 'STARTED' | 'YES';

export type CalibrationEvent =
  | { type: 'POSE_OK' }       // poza widoczna i wyśrodkowana
  | { type: 'POSE_LOST' }     // straciliśmy dobrą pozę
  | { type: 'HOLD_ELAPSED' }  // utrzymano pozę przez czas trzymania
  | { type: 'FAILURE' };      // ModelViewer nie złapał stabilnej referencji

export type CalibrateConfig = {
  detectionDelay: number;
}

export type CalibrateJointConfig = {
  joint_list: string[];
  visibility_threshold: number;
  center_margin: number;
}