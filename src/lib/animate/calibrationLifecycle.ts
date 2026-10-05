import type { CalibrationStatus } from "@/types/calibrate";

export const BODY_CALIBRATION_DURATION_MS = 2000;
export const BODY_TRACKING_LOSS_RESET_MS = 1500;

export class BodyTrackingLossMonitor {
  private missingSinceMs: number | undefined;
  private triggered = false;

  reset(): void {
    this.missingSinceMs = undefined;
    this.triggered = false;
  }

  update(hasUsableBodyTargets: boolean, timestampMs: number): boolean {
    if (hasUsableBodyTargets) {
      this.reset();
      return false;
    }

    this.missingSinceMs ??= timestampMs;
    if (
      this.triggered ||
      timestampMs - this.missingSinceMs < BODY_TRACKING_LOSS_RESET_MS
    ) {
      return false;
    }

    this.triggered = true;
    return true;
  }
}

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
