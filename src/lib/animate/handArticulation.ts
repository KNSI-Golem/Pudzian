import * as THREE from "three";
import {
  LEFT_FINGER_CHAINS,
  RIGHT_FINGER_CHAINS,
  type FingerChainConfig,
  type RetargetBoneId,
} from "./boneConfig";
import {
  fingerDirections,
  worldFingerDirections,
  type HandObservation,
} from "./handFrames";
import type { FingerRig, FingerRigChain } from "./rig";
import {
  COLLINEAR_EPSILON,
  frameFromDirectionAndHinge,
  hingeFromPalmSpread,
} from "./sourceFrames";

export type FingerFrame = Readonly<{
  boneId: RetargetBoneId;
  palmLocalRotation: THREE.Quaternion;
}>;

function chains(side: "left" | "right"): readonly FingerChainConfig[] {
  return side === "left" ? LEFT_FINGER_CHAINS : RIGHT_FINGER_CHAINS;
}

// Segment directions leave axial roll undetermined; the palm supplies a hinge prior.
function fingerHinge(
  observation: HandObservation,
  chain: FingerChainConfig,
  rootDirection: THREE.Vector3,
): THREE.Vector3 | undefined {
  const rootPlanar = new THREE.Vector3(
    rootDirection.x,
    rootDirection.y,
    0,
  );
  const base = observation.worldPalmPoints[chain.landmarks[0]];
  const basePlanar = new THREE.Vector3(base.x, base.y, 0);

  let spread: THREE.Vector3 | undefined;
  if (basePlanar.lengthSq() >= COLLINEAR_EPSILON) {
    basePlanar.normalize();
    // The MCP base keeps the hinge observable near 90-degree flexion.
    const visibility = THREE.MathUtils.clamp(rootPlanar.length(), 0, 1);
    if (rootPlanar.lengthSq() >= COLLINEAR_EPSILON) {
      rootPlanar.normalize();
      if (rootPlanar.dot(basePlanar) < 0) rootPlanar.negate();
    } else {
      rootPlanar.copy(basePlanar);
    }
    spread = rootPlanar
      .multiplyScalar(visibility)
      .addScaledVector(basePlanar, 1 - visibility)
      .normalize();
  } else if (rootPlanar.lengthSq() >= COLLINEAR_EPSILON) {
    spread = rootPlanar.normalize();
  }

  const prior = spread ? hingeFromPalmSpread(spread) : undefined;
  if (!chain.thumb) return prior;

  const worldDirections = worldFingerDirections(observation, chain);
  if (!worldDirections) return prior;

  const normal = new THREE.Vector3()
    .crossVectors(worldDirections[0], worldDirections[1])
    .add(
      new THREE.Vector3().crossVectors(
        worldDirections[1],
        worldDirections[2],
      ),
    );
  if (!prior) return undefined;

  // Unnormalized n(n·prior) vanishes at extension and is invariant to n -> -n.
  return prior.addScaledVector(normal, normal.dot(prior)).normalize();
}

function solveChain(
  observation: HandObservation,
  sourceChain: FingerChainConfig,
  targetChain: FingerRigChain,
): readonly FingerFrame[] {
  const directions = fingerDirections(observation, sourceChain);
  if (!directions) return [];

  const hinge = fingerHinge(
    observation,
    sourceChain,
    directions[0],
  );
  if (!hinge) return [];

  const frames: FingerFrame[] = [];
  for (const [index, boneId] of targetChain.bones.entries()) {
    const frame = frameFromDirectionAndHinge(
      directions[index],
      hinge,
    );
    if (!frame.valid) return [];

    frames.push(Object.freeze({
      boneId,
      palmLocalRotation: frame.rotation
        .multiply(targetChain.boneOffsets[index])
        .normalize(),
    }));
  }
  return frames;
}

export function solveFingerArticulation(
  rig: FingerRig,
  observation: HandObservation,
): readonly FingerFrame[] {
  const sourceChains = chains(observation.side);
  const targetChains = rig[observation.side];
  const frames: FingerFrame[] = [];

  for (const [index, sourceChain] of sourceChains.entries()) {
    const targetChain = targetChains[index];
    if (!targetChain) continue;
    frames.push(
      ...solveChain(
        observation,
        sourceChain,
        targetChain,
      ),
    );
  }

  return frames;
}
