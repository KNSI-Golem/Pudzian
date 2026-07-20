import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import * as THREE from "three";
import {
  BODY_BONE_CONFIG,
  EXPECTED_BONE_PARENTS,
  MIXAMO_BONE_NAMES,
} from "../boneConfig";
import { buildRetargetRig } from "../rig";

type GltfNode = {
  name?: string;
  children?: number[];
  matrix?: number[];
  translation?: number[];
  rotation?: number[];
  scale?: number[];
};

type GltfJson = {
  asset: { version: string };
  nodes: GltfNode[];
  skins?: { joints: number[] }[];
};

function readSelectedGlb(): GltfJson {
  const file = fs.readFileSync(
    path.join(process.cwd(), "public/models/mixamo_blue_person.glb"),
  );
  expect(file.toString("ascii", 0, 4)).toBe("glTF");
  expect(file.readUInt32LE(4)).toBe(2);
  expect(file.readUInt32LE(8)).toBe(file.length);
  const jsonLength = file.readUInt32LE(12);
  const jsonChunkType = file.readUInt32LE(16);
  expect(jsonChunkType).toBe(0x4e4f534a);
  return JSON.parse(
    file.toString("utf8", 20, 20 + jsonLength).trim(),
  ) as GltfJson;
}

function localMatrix(node: GltfNode): THREE.Matrix4 {
  if (node.matrix) return new THREE.Matrix4().fromArray(node.matrix);
  return new THREE.Matrix4().compose(
    new THREE.Vector3().fromArray(node.translation ?? [0, 0, 0]),
    new THREE.Quaternion().fromArray(node.rotation ?? [0, 0, 0, 1]),
    new THREE.Vector3().fromArray(node.scale ?? [1, 1, 1]),
  );
}

describe("selected production GLB", () => {
  const gltf = readSelectedGlb();

  it("matches the approved binary asset hash", () => {
    const file = fs.readFileSync(
      path.join(process.cwd(), "public/models/mixamo_blue_person.glb"),
    );
    expect(createHash("sha256").update(file).digest("hex")).toBe(
      "b405eff1ec099c72b648b4261bea71a702dea964d9db0ff45de5b826feb3a1fd",
    );
  });

  it("is glTF 2.0 with exactly one node for every required rig bone", () => {
    expect(gltf.asset.version).toBe("2.0");
    for (const requiredName of Object.values(MIXAMO_BONE_NAMES)) {
      expect(
        gltf.nodes.filter((node) => node.name === requiredName),
        requiredName,
      ).toHaveLength(1);
    }
  });

  it("includes every required bone in the active skin", () => {
    expect(gltf.skins).toHaveLength(1);
    const joints = new Set(gltf.skins?.[0]?.joints ?? []);
    for (const requiredName of Object.values(MIXAMO_BONE_NAMES)) {
      const nodeIndex = gltf.nodes.findIndex(
        (node) => node.name === requiredName,
      );
      expect(joints.has(nodeIndex), requiredName).toBe(true);
    }
  });

  it("uses the configured direct parent-child topology", () => {
    const nodeByName = new Map(
      gltf.nodes.map((node, index) => [node.name, index]),
    );
    const parentByChild = new Map<number, number>();
    gltf.nodes.forEach((node, parentIndex) => {
      node.children?.forEach((childIndex) => {
        parentByChild.set(childIndex, parentIndex);
      });
    });
    for (const [boneId, parentId] of Object.entries(
      EXPECTED_BONE_PARENTS,
    )) {
      const boneIndex = nodeByName.get(
        MIXAMO_BONE_NAMES[boneId as keyof typeof MIXAMO_BONE_NAMES],
      );
      const parentIndex = nodeByName.get(
        MIXAMO_BONE_NAMES[parentId as keyof typeof MIXAMO_BONE_NAMES],
      );
      expect(parentByChild.get(boneIndex!), boneId).toBe(parentIndex);
    }
  });

  it("derives body-chain bind directions from the selected rig", () => {
    const nodeByName = new Map(
      gltf.nodes.map((node, index) => [node.name, index]),
    );
    const parentByChild = new Map<number, number>();
    gltf.nodes.forEach((node, parentIndex) => {
      node.children?.forEach((childIndex) => {
        parentByChild.set(childIndex, parentIndex);
      });
    });
    const worldCache = new Map<number, THREE.Matrix4>();
    const worldMatrix = (nodeIndex: number): THREE.Matrix4 => {
      const cached = worldCache.get(nodeIndex);
      if (cached) return cached;
      const parentIndex = parentByChild.get(nodeIndex);
      const world =
        parentIndex === undefined
          ? localMatrix(gltf.nodes[nodeIndex])
          : worldMatrix(parentIndex)
              .clone()
              .multiply(localMatrix(gltf.nodes[nodeIndex]));
      worldCache.set(nodeIndex, world);
      return world;
    };

    for (const config of BODY_BONE_CONFIG) {
      if (config.mode !== "swing") continue;
      const boneIndex = nodeByName.get(MIXAMO_BONE_NAMES[config.bone])!;
      const childIndex = nodeByName.get(
        MIXAMO_BONE_NAMES[config.primaryChild],
      )!;
      const childLocalOffset = new THREE.Vector3().setFromMatrixPosition(
        localMatrix(gltf.nodes[childIndex]),
      );
      expect(childLocalOffset.length(), config.bone).toBeGreaterThan(1e-6);

      const boneWorld = worldMatrix(boneIndex);
      const childWorld = worldMatrix(childIndex);
      const boneRotation = new THREE.Quaternion();
      boneWorld.decompose(
        new THREE.Vector3(),
        boneRotation,
        new THREE.Vector3(),
      );
      const derivedDirection = childLocalOffset
        .clone()
        .normalize()
        .applyQuaternion(boneRotation);
      const observedDirection = new THREE.Vector3()
        .setFromMatrixPosition(childWorld)
        .sub(new THREE.Vector3().setFromMatrixPosition(boneWorld))
        .normalize();
      expect(
        derivedDirection.angleTo(observedDirection),
        config.bone,
      ).toBeLessThan(1e-5);
    }
  });

  it("builds direction contracts from the selected GLB hierarchy", () => {
    const joints = new Set(gltf.skins?.[0]?.joints ?? []);
    const objects = gltf.nodes.map((node, index) => {
      const object = joints.has(index)
        ? new THREE.Bone()
        : new THREE.Object3D();
      object.name = node.name ?? "";
      object.matrix.copy(localMatrix(node));
      object.matrix.decompose(
        object.position,
        object.quaternion,
        object.scale,
      );
      return object;
    });
    const childIndices = new Set<number>();
    gltf.nodes.forEach((node, index) => {
      node.children?.forEach((childIndex) => {
        objects[index].add(objects[childIndex]);
        childIndices.add(childIndex);
      });
    });
    const root = new THREE.Group();
    objects.forEach((object, index) => {
      if (!childIndices.has(index)) root.add(object);
    });

    const rig = buildRetargetRig(root);
    for (const config of BODY_BONE_CONFIG) {
      if (config.mode !== "swing") continue;
      expect(
        rig.worldBindDirections[config.bone]?.length(),
        config.bone,
      ).toBeCloseTo(1, 10);
    }
    expect(rig.worldBindDirections.leftIndex3?.length()).toBeCloseTo(
      1,
      10,
    );
    expect(rig.bindPalmWorldRotations.left.length()).toBeCloseTo(1, 10);
    expect(rig.bindPalmWorldRotations.right.length()).toBeCloseTo(1, 10);
  });

  it("has positive, uniform world scale throughout the required skeleton", () => {
    const parentByChild = new Map<number, number>();
    gltf.nodes.forEach((node, parentIndex) => {
      node.children?.forEach((childIndex) => {
        parentByChild.set(childIndex, parentIndex);
      });
    });
    const worldCache = new Map<number, THREE.Matrix4>();
    const worldMatrix = (nodeIndex: number): THREE.Matrix4 => {
      const cached = worldCache.get(nodeIndex);
      if (cached) return cached;
      const local = localMatrix(gltf.nodes[nodeIndex]);
      const parentIndex = parentByChild.get(nodeIndex);
      const world =
        parentIndex === undefined
          ? local
          : worldMatrix(parentIndex).clone().multiply(local);
      worldCache.set(nodeIndex, world);
      return world;
    };

    for (const requiredName of Object.values(MIXAMO_BONE_NAMES)) {
      const nodeIndex = gltf.nodes.findIndex(
        (node) => node.name === requiredName,
      );
      const world = worldMatrix(nodeIndex);
      expect(world.determinant(), requiredName).toBeGreaterThan(0);
      const scale = new THREE.Vector3();
      world.decompose(new THREE.Vector3(), new THREE.Quaternion(), scale);
      expect(Math.max(scale.x, scale.y, scale.z) - Math.min(
        scale.x,
        scale.y,
        scale.z,
      ), requiredName).toBeLessThan(1e-3);
    }
  });
});
