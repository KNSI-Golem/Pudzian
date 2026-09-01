import { describe, expect, it, vi } from "vitest";
import { resetOnCalibrationRestart } from "../calibrationLifecycle";

describe("retargeting calibration lifecycle", () => {
  it("discards hand state once on entry into NO or STARTED", () => {
    const reset = vi.fn();

    expect(resetOnCalibrationRestart("YES", "STARTED", reset)).toBe(true);
    expect(resetOnCalibrationRestart("STARTED", "STARTED", reset)).toBe(false);
    expect(resetOnCalibrationRestart("STARTED", "YES", reset)).toBe(false);
    expect(resetOnCalibrationRestart("YES", "NO", reset)).toBe(true);
    expect(reset).toHaveBeenCalledTimes(2);
  });

  it("allows the next observation to replace the discarded reference", () => {
    let reference: { capturedAtMs: number } | undefined = {
      capturedAtMs: 10,
    };
    const reset = () => {
      reference = undefined;
    };

    resetOnCalibrationRestart("YES", "STARTED", reset);
    if (!reference) reference = { capturedAtMs: 20 };

    expect(reference.capturedAtMs).toBe(20);
  });
});
