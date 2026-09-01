import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { RotationStabilizer } from "../stability";

const identity = () => new THREE.Quaternion();
const quarterTurn = () =>
  new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 1, 0),
    Math.PI / 2,
  );

function simulate(frameMs: number, durationMs: number): THREE.Quaternion {
  const stabilizer = new RotationStabilizer();
  let result = identity();
  for (let now = frameMs; now <= durationMs + 1e-6; now += frameMs) {
    result = stabilizer.step(
      "leftHand",
      result,
      quarterTurn(),
      identity(),
      now,
      frameMs,
    );
  }
  return result;
}

describe("RotationStabilizer", () => {
  it("produces equivalent smoothing at different frame rates", () => {
    const at30Fps = simulate(1000 / 30, 1000);
    const at60Fps = simulate(1000 / 60, 1000);
    expect(at30Fps.angleTo(at60Fps)).toBeLessThan(1e-8);
  });

  it("uses the shortest quaternion hemisphere", () => {
    const stabilizer = new RotationStabilizer();
    const target = quarterTurn();
    const negated = new THREE.Quaternion(
      -target.x,
      -target.y,
      -target.z,
      -target.w,
    );
    const normal = stabilizer.step(
      "leftHand",
      identity(),
      target,
      identity(),
      16,
      16,
    );
    stabilizer.reset();
    const equivalent = stabilizer.step(
      "leftHand",
      identity(),
      negated,
      identity(),
      16,
      16,
    );
    expect(normal.angleTo(equivalent)).toBeLessThan(1e-10);
  });

  it("holds a missing target before returning smoothly to bind", () => {
    const stabilizer = new RotationStabilizer();
    const tracked = stabilizer.step(
      "leftHand",
      identity(),
      quarterTurn(),
      identity(),
      0,
      100,
    );
    const held = stabilizer.step(
      "leftHand",
      tracked,
      undefined,
      identity(),
      100,
      100,
    );
    const returning = stabilizer.step(
      "leftHand",
      held,
      undefined,
      identity(),
      200,
      100,
    );
    expect(held.angleTo(tracked)).toBeLessThan(1e-10);
    expect(returning.angleTo(identity())).toBeLessThan(
      held.angleTo(identity()),
    );
    expect(returning.angleTo(identity())).toBeGreaterThan(0);
  });

  it("clamps long frame gaps after a suspended tab", () => {
    const stabilizer = new RotationStabilizer();
    const result = stabilizer.step(
      "leftHand",
      identity(),
      quarterTurn(),
      identity(),
      10_000,
      10_000,
    );
    expect(result.angleTo(identity())).toBeLessThan(Math.PI / 2);
  });
});
