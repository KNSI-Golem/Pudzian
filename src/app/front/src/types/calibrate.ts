export type CalibrateConfig = {
  detectionDelay: number;
}

export type CalibrateOutlineProps = {
  calibrateStatus: "NO" | "STARTED" | "YES";
}

export type CalibrateJointConfig = {
  joint_list: string[];
  visibility_threshold: number;
}