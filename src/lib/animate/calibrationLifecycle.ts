import type { CalibrationStatus } from "@/types/calibrate";

export function resetOnCalibrationRestart(
  previous: CalibrationStatus | undefined,
  current: CalibrationStatus | undefined,
  reset: () => void,
): boolean {
  const restarted =
    previous !== current && (current === "NO" || current === "STARTED");
  if (restarted) reset();
  return restarted;
}
