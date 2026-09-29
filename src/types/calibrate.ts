export type CalibrationStatus = 'NO' | 'STARTED' | 'YES';

export type CalibrationEvent =
  | { type: 'POSE_OK' }
  | { type: 'POSE_LOST' }
  | { type: 'HOLD_ELAPSED' }
  | { type: 'FAILURE' };

export type CalibrateConfig = {
  detectionDelay: number;
}

export type CalibrateJointConfig = {
  joint_list: string[];
  visibility_threshold: number;
  center_margin: number;
}