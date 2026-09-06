import { describe, expect, it } from "vitest";
import { calibrationReducer } from "../reducer";

describe("calibration reducer", () => {
  it("starts holding once the pose is good", () => {
    expect(calibrationReducer("NO", { type: "POSE_OK" })).toBe("STARTED");
  });

  it("stays NO on any event other than POSE_OK", () => {
    expect(calibrationReducer("NO", { type: "POSE_LOST" })).toBe("NO");
    expect(calibrationReducer("NO", { type: "HOLD_ELAPSED" })).toBe("NO");
    expect(calibrationReducer("NO", { type: "FAILURE" })).toBe("NO");
  });

  it("reaches YES only after the hold elapses", () => {
    expect(calibrationReducer("STARTED", { type: "HOLD_ELAPSED" })).toBe("YES");
  });

  it("drops back to NO when the pose is lost or the reference fails mid-hold", () => {
    expect(calibrationReducer("STARTED", { type: "POSE_LOST" })).toBe("NO");
    expect(calibrationReducer("STARTED", { type: "FAILURE" })).toBe("NO");
  });

  it("keeps holding when the pose stays good", () => {
    expect(calibrationReducer("STARTED", { type: "POSE_OK" })).toBe("STARTED");
  });

  it("leaves YES on a lost pose or failure, forcing re-calibration", () => {
    expect(calibrationReducer("YES", { type: "POSE_LOST" })).toBe("NO");
    expect(calibrationReducer("YES", { type: "FAILURE" })).toBe("NO");
  });

  it("stays YES on a good pose or a stray hold event", () => {
    expect(calibrationReducer("YES", { type: "POSE_OK" })).toBe("YES");
    expect(calibrationReducer("YES", { type: "HOLD_ELAPSED" })).toBe("YES");
  });
});
