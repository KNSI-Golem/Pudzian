import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { calculateCameraFit } from "../cameraFit";

describe("model camera fitting", () => {
  it("centers the selected bounds and contains their depth", () => {
    const bounds = new THREE.Box3(
      new THREE.Vector3(-20, 10, -5),
      new THREE.Vector3(20, 190, 15),
    );
    const fit = calculateCameraFit(bounds, 50, 16 / 9);

    expect(fit.target.toArray()).toEqual([0, 100, 5]);
    expect(fit.position.z).toBeGreaterThan(bounds.max.z);
    expect(fit.near).toBeGreaterThan(0);
    expect(fit.far).toBeGreaterThan(fit.position.z - bounds.min.z);
  });

  it("moves farther away for a narrow viewer", () => {
    const bounds = new THREE.Box3(
      new THREE.Vector3(-100, -50, -10),
      new THREE.Vector3(100, 50, 10),
    );
    const wide = calculateCameraFit(bounds, 50, 2);
    const narrow = calculateCameraFit(bounds, 50, 0.5);

    expect(narrow.position.z - narrow.target.z).toBeGreaterThan(
      wide.position.z - wide.target.z,
    );
  });

  it("rejects empty model bounds", () => {
    expect(() =>
      calculateCameraFit(new THREE.Box3(), 50, 1),
    ).toThrow(/empty/);
  });
});
