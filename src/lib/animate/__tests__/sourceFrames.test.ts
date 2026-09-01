import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { MEDIAPIPE_TO_THREE, transformMediaPipeDirection } from "../coordinateSpace";
import {
  frameFromPrimaryAndPlane,
  frameFromUpAndForward,
} from "../sourceFrames";

describe("coordinate conversion", () => {
  it("is a proper rotation and not a reflection", () => {
    expect(MEDIAPIPE_TO_THREE.determinant()).toBeCloseTo(1, 12);
  });

  it("keeps anatomical X while flipping MediaPipe Y and Z", () => {
    expect(
      transformMediaPipeDirection(new THREE.Vector3(1, 2, 3)).toArray(),
    ).toEqual([1, -2, -3]);
  });
});

describe("anatomical frame construction", () => {
  it("returns identity for Three.js canonical up and forward", () => {
    const result = frameFromUpAndForward(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 1),
    );

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(Math.abs(result.rotation.dot(new THREE.Quaternion()))).toBeCloseTo(
        1,
        10,
      );
      expect(result.rotation.length()).toBeCloseTo(1, 10);
    }
  });

  it("rejects collinear frame inputs", () => {
    expect(
      frameFromUpAndForward(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 2, 0),
      ),
    ).toEqual({ valid: false, reason: "collinear" });
  });

  it("is invariant to landmark measurement scale", () => {
    const large = frameFromUpAndForward(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 1),
    );
    const handSized = frameFromUpAndForward(
      new THREE.Vector3(0, 0.04, 0),
      new THREE.Vector3(0, 0, 0.002),
    );
    expect(large.valid).toBe(true);
    expect(handSized.valid).toBe(true);
    if (large.valid && handSized.valid) {
      expect(Math.abs(large.rotation.dot(handSized.rotation))).toBeCloseTo(
        1,
        10,
      );
    }
  });

  it("rejects a straight limb without inventing a global twist axis", () => {
    expect(
      frameFromPrimaryAndPlane(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 2, 0),
      ),
    ).toEqual({ valid: false, reason: "collinear" });
  });
});
