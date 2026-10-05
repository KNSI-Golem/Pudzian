import * as THREE from "three";
import {
  BODY_BONE_CONFIG,
  EXPECTED_BONE_PARENTS,
  LEFT_FINGER_CHAINS,
  RETARGET_BONE_IDS,
  RIGHT_FINGER_CHAINS,
  type FingerChainConfig,
  type RetargetBoneId,
} from "./boneConfig";
import type { RigProfile } from "./rigProfiles";
import {
  frameFromDirectionAndHinge,
  frameFromPalm,
  frameFromUpAndForward,
  FRAME_EPSILON,
  hingeFromPalmSpread,
} from "./sourceFrames";

export type FingerRigChain = Readonly<{
  bones: FingerChainConfig["bones"];
  boneOffsets: readonly [
    THREE.Quaternion,
    THREE.Quaternion,
    THREE.Quaternion,
  ];
}>;

export type FingerRig = Readonly<
  Record<"left" | "right", readonly FingerRigChain[]>
>;

function fingerChains(
  side: "left" | "right",
): readonly FingerChainConfig[] {
  return side === "left" ? LEFT_FINGER_CHAINS : RIGHT_FINGER_CHAINS;
}

export type RetargetRig = Readonly<{
  parents: typeof EXPECTED_BONE_PARENTS;
  fingerRig: FingerRig;
  bones: Readonly<Record<RetargetBoneId, THREE.Bone>>;
  localBindRotations: Readonly<Record<RetargetBoneId, THREE.Quaternion>>;
  worldBindRotations: Readonly<Record<RetargetBoneId, THREE.Quaternion>>;
  localBindPositions: Readonly<Record<RetargetBoneId, THREE.Vector3>>;
  localBindDirections: Readonly<
    Partial<Record<RetargetBoneId, THREE.Vector3>>
  >;
  worldBindDirections: Readonly<
    Partial<Record<RetargetBoneId, THREE.Vector3>>
  >;
  bindBodyWorldRotation: THREE.Quaternion;
  bindPalmWorldRotations: Readonly<
    Record<"left" | "right", THREE.Quaternion>
  >;
}>;

export class RigValidationError extends Error {
  constructor(
    message: string,
    readonly missingBones: readonly string[] = [],
    readonly duplicateBones: readonly string[] = [],
    readonly invalidTopology: readonly string[] = [],
  ) {
    super(message);
    this.name = "RigValidationError";
  }
}

export function normalizeRigName(name: string): string {
  return name.toLowerCase().replace(/[:_]/g, "");
}

function validateWorldScale(bone: THREE.Bone): void {
  const scale = bone.getWorldScale(new THREE.Vector3());
  const values = [scale.x, scale.y, scale.z];
  if (
    values.some((value) => !Number.isFinite(value) || value <= 0) ||
    Math.max(...values) - Math.min(...values) > 1e-3
  ) {
    throw new RigValidationError(
      `Bone ${bone.name} has a reflected or non-uniform world scale`,
    );
  }
}

function solveBindPalmFrame(
  bones: Readonly<Record<RetargetBoneId, THREE.Bone>>,
  side: "left" | "right",
): THREE.Quaternion {
  const wrist = bones[`${side}Hand`].getWorldPosition(new THREE.Vector3());
  const knuckles = (["Index1", "Middle1", "Ring1", "Pinky1"] as const)
    .map((finger) => bones[`${side}${finger}`].getWorldPosition(new THREE.Vector3()));
  const frame = frameFromPalm(wrist, knuckles, side);
  if (!frame.valid) {
    throw new RigValidationError(
      `Rig bind pose does not define a valid ${side} palm frame (${frame.reason})`,
    );
  }
  return frame.rotation;
}

function buildFingerRig(
  worldBindDirections: Readonly<
    Partial<Record<RetargetBoneId, THREE.Vector3>>
  >,
  worldBindRotations: Readonly<
    Record<RetargetBoneId, THREE.Quaternion>
  >,
  bindPalmWorldRotations: Readonly<
    Record<"left" | "right", THREE.Quaternion>
  >,
): FingerRig {
  const result = {} as Record<"left" | "right", FingerRigChain[]>;

  for (const side of ["left", "right"] as const) {
    const inversePalm = bindPalmWorldRotations[side].clone().invert();

    result[side] = fingerChains(side).map((chain) => {
      const bindDirections = chain.bones.map((boneId) =>
        worldBindDirections[boneId]!
          .clone()
          .applyQuaternion(inversePalm)
          .normalize(),
      );
      const bindHinge = hingeFromPalmSpread(bindDirections[0]);
      if (!bindHinge) {
        throw new RigValidationError(
          "Rig does not define a stable finger frame for " + chain.bones[0],
        );
      }

      const boneOffsets = chain.bones.map((boneId, index) => {
        const frame = frameFromDirectionAndHinge(
          bindDirections[index],
          bindHinge,
        );
        if (!frame.valid) {
          throw new RigValidationError(
            "Rig does not define an anatomical frame for " + boneId,
          );
        }

        return frame.rotation
          .clone()
          .invert()
          .multiply(
            inversePalm
              .clone()
              .multiply(worldBindRotations[boneId])
              .normalize(),
          )
          .normalize();
      }) as [THREE.Quaternion, THREE.Quaternion, THREE.Quaternion];

      return Object.freeze({
        bones: chain.bones,
        boneOffsets: Object.freeze(boneOffsets),
      });
    });
  }

  return Object.freeze({
    left: Object.freeze(result.left),
    right: Object.freeze(result.right),
  });
}

export function buildRetargetRig(
  root: THREE.Object3D,
  profile: RigProfile,
): RetargetRig {
  root.updateWorldMatrix(true, true);

  const candidates = new Map<string, THREE.Bone[]>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Bone)) {
      return;
    }
    const key = normalizeRigName(object.name);
    const matches = candidates.get(key) ?? [];
    matches.push(object);
    candidates.set(key, matches);
  });

  const missingBones: string[] = [];
  const duplicateBones: string[] = [];
  const bones = {} as Record<RetargetBoneId, THREE.Bone>;

  const assignedBones = new Set<THREE.Bone>();
  for (const boneId of RETARGET_BONE_IDS) {
    const targetName = profile.bones[boneId];
    const matches = candidates.get(normalizeRigName(targetName)) ?? [];
    if (matches.length === 0) {
      missingBones.push(targetName);
      continue;
    }
    if (matches.length > 1) {
      duplicateBones.push(targetName);
      continue;
    }
    if (assignedBones.has(matches[0])) {
      throw new RigValidationError(`Bone ${targetName} is assigned to more than one role`);
    }
    assignedBones.add(matches[0]);
    bones[boneId] = matches[0];
  }

  if (missingBones.length > 0 || duplicateBones.length > 0) {
    const details = [
      missingBones.length > 0 ? `missing: ${missingBones.join(", ")}` : "",
      duplicateBones.length > 0
        ? `duplicate: ${duplicateBones.join(", ")}`
        : "",
    ]
      .filter(Boolean)
      .join("; ");
    throw new RigValidationError(
      `Invalid retarget rig (${details})`,
      missingBones,
      duplicateBones,
    );
  }

  const invalidTopology: string[] = [];
  for (const [boneId, parentId] of Object.entries(
    EXPECTED_BONE_PARENTS,
  ) as [RetargetBoneId, RetargetBoneId][]) {
    if (bones[boneId].parent !== bones[parentId]) {
      invalidTopology.push(
        `${profile.bones[boneId]} must be a direct child of ${profile.bones[parentId]}`,
      );
    }
  }
  if (invalidTopology.length > 0) {
    throw new RigValidationError(
      `Invalid retarget rig topology (${invalidTopology.join("; ")})`,
      [],
      [],
      invalidTopology,
    );
  }

  const localBindRotations = {} as Record<
    RetargetBoneId,
    THREE.Quaternion
  >;
  const worldBindRotations = {} as Record<
    RetargetBoneId,
    THREE.Quaternion
  >;
  const localBindPositions = {} as Record<RetargetBoneId, THREE.Vector3>;

  for (const boneId of Object.keys(bones) as RetargetBoneId[]) {
    const bone = bones[boneId];
    validateWorldScale(bone);
    localBindRotations[boneId] = bone.quaternion.clone().normalize();
    worldBindRotations[boneId] = bone
      .getWorldQuaternion(new THREE.Quaternion())
      .normalize();
    localBindPositions[boneId] = bone.position.clone();
  }

  const primaryChildren = new Map<RetargetBoneId, RetargetBoneId>();
  for (const config of BODY_BONE_CONFIG) {
    if (config.mode === "swing") {
      primaryChildren.set(config.bone, config.primaryChild);
    }
  }
  const fingerBones = new Set<RetargetBoneId>();
  for (const chain of [...LEFT_FINGER_CHAINS, ...RIGHT_FINGER_CHAINS]) {
    chain.bones.forEach((boneId) => fingerBones.add(boneId));
    primaryChildren.set(chain.bones[0], chain.bones[1]);
    primaryChildren.set(chain.bones[1], chain.bones[2]);
  }

  const localBindDirections: Partial<
    Record<RetargetBoneId, THREE.Vector3>
  > = {};
  const worldBindDirections: Partial<
    Record<RetargetBoneId, THREE.Vector3>
  > = {};
  const directionBones = new Set([
    ...primaryChildren.keys(),
    ...fingerBones,
  ]);
  for (const boneId of directionBones) {
    const configuredChildId = primaryChildren.get(boneId);
    const child: THREE.Object3D | undefined = configuredChildId
      ? bones[configuredChildId]
      : bones[boneId].children[0];
    if (
      !child ||
      (configuredChildId && child.parent !== bones[boneId])
    ) {
      throw new RigValidationError(
        `Bone ${bones[boneId].name} has no primary child for direction retargeting`,
      );
    }
    const worldDirection = child
      .getWorldPosition(new THREE.Vector3())
      .sub(bones[boneId].getWorldPosition(new THREE.Vector3()));
    if (
      !Number.isFinite(worldDirection.x) ||
      !Number.isFinite(worldDirection.y) ||
      !Number.isFinite(worldDirection.z) ||
      worldDirection.lengthSq() < FRAME_EPSILON
    ) {
      throw new RigValidationError(
        `Bone ${bones[boneId].name} has an invalid primary-child bind direction`,
      );
    }
    worldDirection.normalize();
    const localDirection = worldDirection
      .clone()
      .applyQuaternion(worldBindRotations[boneId].clone().invert())
      .normalize();
    localBindDirections[boneId] = localDirection;
    worldBindDirections[boneId] = worldDirection;
  }

  const hipsPosition = bones.hips.getWorldPosition(new THREE.Vector3());
  const leftShoulderPosition = bones.leftShoulder.getWorldPosition(
    new THREE.Vector3(),
  );
  const rightShoulderPosition = bones.rightShoulder.getWorldPosition(
    new THREE.Vector3(),
  );
  const shoulderMidpoint = leftShoulderPosition
    .clone()
    .add(rightShoulderPosition)
    .multiplyScalar(0.5);
  const bodyUp = shoulderMidpoint.clone().sub(hipsPosition);
  const bodyLateral = leftShoulderPosition
    .clone()
    .sub(rightShoulderPosition);
  const bodyForward = new THREE.Vector3().crossVectors(
    bodyLateral,
    bodyUp,
  );
  const bindBodyFrame = frameFromUpAndForward(bodyUp, bodyForward);
  if (!bindBodyFrame.valid) {
    throw new RigValidationError(
      `Rig bind pose does not define a valid hips-to-shoulders body frame (${bindBodyFrame.reason})`,
    );
  }
  const bindPalmWorldRotations = Object.freeze({
    left: solveBindPalmFrame(bones, "left"),
    right: solveBindPalmFrame(bones, "right"),
  });

  const fingerRig = buildFingerRig(
    worldBindDirections,
    worldBindRotations,
    bindPalmWorldRotations,
  );

  return Object.freeze({
    fingerRig,
    parents: EXPECTED_BONE_PARENTS,
    bones: Object.freeze(bones),
    localBindRotations: Object.freeze(localBindRotations),
    worldBindRotations: Object.freeze(worldBindRotations),
    localBindPositions: Object.freeze(localBindPositions),
    localBindDirections: Object.freeze(localBindDirections),
    worldBindDirections: Object.freeze(worldBindDirections),
    bindBodyWorldRotation: bindBodyFrame.rotation,
    bindPalmWorldRotations,
  });
}
