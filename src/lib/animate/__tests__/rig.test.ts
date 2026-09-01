import { describe, expect, it } from "vitest";
import * as THREE from "three";
import {
  EXPECTED_BONE_PARENTS,
  MIXAMO_BONE_NAMES,
  type RetargetBoneId,
} from "../boneConfig";
import { buildRetargetRig, RigValidationError } from "../rig";

function createCompleteRig(): THREE.Group {
  const root = new THREE.Group();
  const bones = {} as Record<RetargetBoneId, THREE.Bone>;
  for (const [boneId, name] of Object.entries(MIXAMO_BONE_NAMES) as [
    RetargetBoneId,
    string,
  ][]) {
    const bone = new THREE.Bone();
    bone.name = name;
    bones[boneId] = bone;
  }
  for (const boneId of Object.keys(bones) as RetargetBoneId[]) {
    const parentId = EXPECTED_BONE_PARENTS[boneId];
    (parentId ? bones[parentId] : root).add(bones[boneId]);
    bones[boneId].position.set(0, 1, 0);
  }
  bones.hips.position.set(0, 0, 0);
  bones.leftShoulder.position.set(0.5, 0.2, 0);
  bones.rightShoulder.position.set(-0.5, 0.2, 0);
  bones.leftUpperArm.position.set(0.5, 0, 0);
  bones.leftForearm.position.set(1, 0, 0);
  bones.leftHand.position.set(1, 0, 0);
  bones.rightUpperArm.position.set(-0.5, 0, 0);
  bones.rightForearm.position.set(-1, 0, 0);
  bones.rightHand.position.set(-1, 0, 0);
  bones.leftIndex1.position.set(0.2, 1, 0);
  bones.leftMiddle1.position.set(0, 1, 0);
  bones.leftPinky1.position.set(-0.2, 1, 0);
  bones.rightIndex1.position.set(-0.2, 1, 0);
  bones.rightMiddle1.position.set(0, 1, 0);
  bones.rightPinky1.position.set(0.2, 1, 0);
  for (const [boneId, bone] of Object.entries(bones) as [
    RetargetBoneId,
    THREE.Bone,
  ][]) {
    if (!/[123]$/.test(boneId) || !boneId.endsWith("3")) continue;
    const end = new THREE.Bone();
    end.name = `${bone.name.replace(/3$/, "")}4`;
    end.position.set(0, 1, 0);
    bone.add(end);
  }
  return root;
}

describe("retarget rig validation", () => {
  it("resolves every configured bone exactly once", () => {
    const rig = buildRetargetRig(createCompleteRig());
    expect(Object.keys(rig.bones)).toHaveLength(50);
    expect(rig.bones.leftUpperArm.name).toBe("mixamorig:LeftArm");
    expect(rig.worldBindDirections.leftUpperArm?.length()).toBeCloseTo(1);
    expect(rig.bindBodyWorldRotation.length()).toBeCloseTo(1);
    expect(rig.bindPalmWorldRotations.left.length()).toBeCloseTo(1);
    expect(rig.bindPalmWorldRotations.right.length()).toBeCloseTo(1);
  });

  it("reports missing bones explicitly", () => {
    const root = createCompleteRig();
    root.getObjectByName("mixamorig:Head")!.removeFromParent();

    expect(() => buildRetargetRig(root)).toThrowError(RigValidationError);
    try {
      buildRetargetRig(root);
    } catch (error) {
      expect((error as RigValidationError).missingBones).toContain(
        "mixamorig:Head",
      );
    }
  });

  it("rejects duplicate normalized names", () => {
    const root = createCompleteRig();
    const duplicate = new THREE.Bone();
    duplicate.name = "mixamorigLeftArm";
    root.add(duplicate);

    expect(() => buildRetargetRig(root)).toThrow(/duplicate/);
  });

  it("rejects reflected skeleton ancestry", () => {
    const root = createCompleteRig();
    root.scale.x = -1;

    expect(() => buildRetargetRig(root)).toThrow(/reflected or non-uniform/);
  });

  it("rejects a configured bone under the wrong parent", () => {
    const root = createCompleteRig();
    const hand = root.getObjectByName("mixamorig:LeftHand")!;
    root.getObjectByName("mixamorig:Hips")!.add(hand);
    expect(() => buildRetargetRig(root)).toThrow(/topology/);
  });
});
