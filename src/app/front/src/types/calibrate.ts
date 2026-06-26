export type CalibrationStatus = 'NO' | 'STARTED' | 'YES';

export type CalibrateConfig = {
  detectionDelay: number;
}

export type CalibrateJointConfig = {
  joint_list: string[];
  visibility_threshold: number;
}