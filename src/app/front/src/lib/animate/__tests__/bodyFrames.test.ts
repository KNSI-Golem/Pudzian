import { describe, expect, it } from "vitest";
import type { Landmark, NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { PoseDetectionResult } from "@/types";
import { POSE_LANDMARK } from "@/lib/mediapipe";
import { solveBodyObservation } from "../bodyFrames";

function point(x: number, y: number, z = 0): Landmark {
  return { x, y, z, visibility: 1 };
}

function syntheticPose(): PoseDetectionResult {
  const world = Array.from({ length: 33 }, () => point(0, 0));
  const image = Array.from(
    { length: 33 },
    () => ({ x: 0.5, y: 0.5, z: 0, visibility: 1 }) as NormalizedLandmark,
  );
  const set = (
    index: number,
    x: number,
    y: number,
    z = 0,
  ): void => {
    world[index] = point(x, y, z);
  };

  set(POSE_LANDMARK.leftHip, -0.2, 1);
  set(POSE_LANDMARK.rightHip, 0.2, 1);
  set(POSE_LANDMARK.leftShoulder, -0.3, 0.4);
  set(POSE_LANDMARK.rightShoulder, 0.3, 0.4);
  set(POSE_LANDMARK.leftElbow, -0.55, 0.58, -0.05);
  set(POSE_LANDMARK.rightElbow, 0.55, 0.58, -0.05);
  set(POSE_LANDMARK.leftWrist, -0.72, 0.78, 0.02);
  set(POSE_LANDMARK.rightWrist, 0.72, 0.78, 0.02);
  set(POSE_LANDMARK.leftKnee, -0.2, 1.5, -0.05);
  set(POSE_LANDMARK.rightKnee, 0.2, 1.5, -0.05);
  set(POSE_LANDMARK.leftAnkle, -0.2, 2, 0);
  set(POSE_LANDMARK.rightAnkle, 0.2, 2, 0);
  set(POSE_LANDMARK.leftHeel, -0.2, 2.05, 0.08);
  set(POSE_LANDMARK.rightHeel, 0.2, 2.05, 0.08);
  set(POSE_LANDMARK.leftFootIndex, -0.2, 2.05, -0.2);
  set(POSE_LANDMARK.rightFootIndex, 0.2, 2.05, -0.2);
  set(POSE_LANDMARK.leftEar, -0.1, 0.18);
  set(POSE_LANDMARK.rightEar, 0.1, 0.18);
  set(POSE_LANDMARK.nose, 0, 0.18, -0.15);

  return { landmarks: [image], worldLandmarks: [world] };
}

describe("whole-body observations", () => {
  it("separates observable body frames from segment directions", () => {
    const observation = solveBodyObservation(syntheticPose());
    expect(Object.keys(observation.frames)).toHaveLength(5);
    expect(Object.keys(observation.directions)).toHaveLength(10);
    for (const frame of Object.values(observation.frames)) {
      expect(frame?.valid).toBe(true);
      if (frame?.valid) {
        expect(frame.rotation.length()).toBeCloseTo(1, 10);
      }
    }
    for (const result of Object.values(observation.directions)) {
      expect(result?.valid).toBe(true);
      if (result?.valid) {
        expect(result.direction.length()).toBeCloseTo(1, 10);
      }
    }
  });

  it("keeps straight limbs observable without constructing a bend plane", () => {
    const pose = syntheticPose();
    const world = pose.worldLandmarks[0];
    world[POSE_LANDMARK.leftElbow] = point(-0.5, 0.4);
    world[POSE_LANDMARK.leftWrist] = point(-0.7, 0.4);
    const { directions } = solveBodyObservation(pose);
    expect(directions.leftUpperArm?.valid).toBe(true);
    expect(directions.leftForearm?.valid).toBe(true);
  });

  it("rejects zero-length limbs instead of emitting invalid rotations", () => {
    const pose = syntheticPose();
    const world = pose.worldLandmarks[0];
    const shoulder = world[POSE_LANDMARK.leftShoulder];
    world[POSE_LANDMARK.leftElbow] = { ...shoulder };
    world[POSE_LANDMARK.leftWrist] = { ...shoulder };
    const { directions } = solveBodyObservation(pose);
    expect(directions.leftUpperArm?.valid).toBe(false);
    expect(directions.leftForearm?.valid).toBe(false);
  });

  it("keeps all output finite after a left-right mirrored pose", () => {
    const pose = syntheticPose();
    pose.worldLandmarks[0].forEach((landmark) => {
      landmark.x *= -1;
    });
    const observation = solveBodyObservation(pose);
    for (const frame of Object.values(observation.frames)) {
      if (!frame?.valid) continue;
      expect(frame.rotation.toArray().every(Number.isFinite)).toBe(true);
    }
    for (const result of Object.values(observation.directions)) {
      if (!result?.valid) continue;
      expect(result.direction.toArray().every(Number.isFinite)).toBe(true);
    }
  });

  it("keeps pelvis orientation independent from shoulder twist", () => {
    const neutral = syntheticPose();
    const twisted = syntheticPose();
    twisted.worldLandmarks[0][POSE_LANDMARK.leftShoulder].z = 0.2;
    twisted.worldLandmarks[0][POSE_LANDMARK.rightShoulder].z = -0.2;

    const neutralFrames = solveBodyObservation(neutral).frames;
    const twistedFrames = solveBodyObservation(twisted).frames;
    expect(neutralFrames.hips?.valid).toBe(true);
    expect(twistedFrames.hips?.valid).toBe(true);
    expect(neutralFrames.torso?.valid).toBe(true);
    expect(twistedFrames.torso?.valid).toBe(true);
    if (
      neutralFrames.hips?.valid &&
      twistedFrames.hips?.valid &&
      neutralFrames.torso?.valid &&
      twistedFrames.torso?.valid
    ) {
      expect(
        neutralFrames.hips.rotation.angleTo(twistedFrames.hips.rotation),
      ).toBeLessThan(1e-10);
      expect(
        neutralFrames.torso.rotation.angleTo(
          twistedFrames.torso.rotation,
        ),
      ).toBeGreaterThan(0.1);
    }
  });

  it("keeps upper-arm direction independent from wrist motion", () => {
    const straight = syntheticPose();
    const bent = syntheticPose();
    bent.worldLandmarks[0][POSE_LANDMARK.leftWrist] = point(
      -0.5,
      0.2,
      0.4,
    );

    const straightDirection =
      solveBodyObservation(straight).directions.leftUpperArm;
    const bentDirection =
      solveBodyObservation(bent).directions.leftUpperArm;
    expect(straightDirection?.valid).toBe(true);
    expect(bentDirection?.valid).toBe(true);
    if (straightDirection?.valid && bentDirection?.valid) {
      expect(straightDirection.direction.angleTo(
        bentDirection.direction,
      )).toBeLessThan(1e-10);
    }
  });

  it("does not flip a near-straight arm under small wrist noise", () => {
    const first = syntheticPose();
    const second = syntheticPose();
    first.worldLandmarks[0][POSE_LANDMARK.leftElbow] = point(-0.5, 0.4);
    first.worldLandmarks[0][POSE_LANDMARK.leftWrist] = point(
      -0.7,
      0.40001,
    );
    second.worldLandmarks[0][POSE_LANDMARK.leftElbow] = point(-0.5, 0.4);
    second.worldLandmarks[0][POSE_LANDMARK.leftWrist] = point(
      -0.7,
      0.39999,
    );
    const firstDirection =
      solveBodyObservation(first).directions.leftForearm;
    const secondDirection =
      solveBodyObservation(second).directions.leftForearm;
    expect(firstDirection?.valid).toBe(true);
    expect(secondDirection?.valid).toBe(true);
    if (firstDirection?.valid && secondDirection?.valid) {
      expect(firstDirection.direction.angleTo(
        secondDirection.direction,
      )).toBeLessThan(1e-3);
    }
  });
});
