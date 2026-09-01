import { describe, expect, it } from "vitest";
import * as THREE from "three";
import {
  calibratedTargetWorldRotation,
  worldToParentLocalRotation,
} from "../retarget";

function expectSameRotation(
  actual: THREE.Quaternion,
  expected: THREE.Quaternion,
  tolerance = 1e-6,
): void {
  expect(Math.abs(actual.dot(expected))).toBeGreaterThan(1 - tolerance);
}

describe("calibrated retargeting", () => {
  it("maps the accepted source reference to the target bind orientation", () => {
    const reference = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0.3, -0.2, 0.6),
    );
    const bind = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(-0.5, 0.4, 0.1),
    );

    expectSameRotation(
      calibratedTargetWorldRotation(reference, reference, bind),
      bind,
    );
  });

  it("applies source world delta to target bind world rotation", () => {
    const reference = new THREE.Quaternion();
    const delta = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      Math.PI / 2,
    );
    const bind = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      Math.PI / 4,
    );

    expectSameRotation(
      calibratedTargetWorldRotation(delta, reference, bind),
      delta.clone().multiply(bind),
    );
  });

  it("converts a world target through the current parent orientation", () => {
    const parentWorld = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0.2, 0.7, -0.3),
    );
    const targetWorld = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(-0.6, 0.1, 0.8),
    );
    const local = worldToParentLocalRotation(parentWorld, targetWorld);

    expectSameRotation(parentWorld.clone().multiply(local), targetWorld);
  });
});
