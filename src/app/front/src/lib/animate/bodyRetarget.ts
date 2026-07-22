import * as THREE from "three";
import type { DirectionResult, FrameResult } from "@/types";
import type { CalibrationStatus } from "@/types/calibrate";
import {
  BODY_BONE_CONFIG,
  type RetargetBoneId,
  type SourceFrameId,
} from "./boneConfig";
import type { BodyObservation, BodySourceFrames } from "./bodyFrames";
import { createReferencePose, type RetargetReferencePose } from "./referencePose";
import { calibratedTargetWorldRotation } from "./retarget";
import type { RetargetRig } from "./rig";

export type BoneWorldTarget = Readonly<{
  boneId: RetargetBoneId;
  rotation: THREE.Quaternion;
}>;

export type BodyReferenceWindowOptions = Readonly<{
  minimumSamples: number;
  maximumSamples: number;
  maximumAngularDeviationRadians: number;
}>;

const DEFAULT_REFERENCE_WINDOW_OPTIONS: BodyReferenceWindowOptions = {
  minimumSamples: 5,
  maximumSamples: 60,
  maximumAngularDeviationRadians: THREE.MathUtils.degToRad(12),
};

function validFrame(
  frames: BodySourceFrames,
  frameId: SourceFrameId,
): Extract<FrameResult, { valid: true }> | undefined {
  const frame = frames[frameId];
  return frame?.valid ? frame : undefined;
}

export function captureBodyReference(
  frames: BodySourceFrames,
  capturedAtMs: number,
): RetargetReferencePose | undefined {
  const requiredFrames = new Set(
    BODY_BONE_CONFIG.flatMap((config) =>
      config.mode === "frame" ? [config.source] : [],
    ),
  );
  const rotations: Partial<Record<SourceFrameId, THREE.Quaternion>> = {};

  for (const frameId of requiredFrames) {
    const frame = validFrame(frames, frameId);
    if (!frame) {
      return undefined;
    }
    rotations[frameId] = frame.rotation;
  }

  return createReferencePose(rotations, capturedAtMs);
}

function averageRotations(
  rotations: readonly THREE.Quaternion[],
): THREE.Quaternion {
  const reference = rotations[0];
  const sum = new THREE.Vector4(0, 0, 0, 0);
  for (const rotation of rotations) {
    const sign = reference.dot(rotation) < 0 ? -1 : 1;
    sum.x += rotation.x * sign;
    sum.y += rotation.y * sign;
    sum.z += rotation.z * sign;
    sum.w += rotation.w * sign;
  }
  return new THREE.Quaternion(sum.x, sum.y, sum.z, sum.w).normalize();
}

export class BodyReferenceWindow {
  private readonly options: BodyReferenceWindowOptions;
  private readonly samples: RetargetReferencePose[] = [];
  private lastTimestampMs: number | undefined;

  constructor(options: Partial<BodyReferenceWindowOptions> = {}) {
    this.options = { ...DEFAULT_REFERENCE_WINDOW_OPTIONS, ...options };
  }

  reset(): void {
    this.samples.length = 0;
    this.lastTimestampMs = undefined;
  }

  add(observation: BodyObservation, timestampMs: number): boolean {
    if (timestampMs === this.lastTimestampMs) return false;
    this.lastTimestampMs = timestampMs;
    const candidate = captureBodyReference(observation.frames, timestampMs);
    if (!candidate) return false;
    this.samples.push(candidate);
    if (this.samples.length > this.options.maximumSamples) {
      this.samples.shift();
    }
    return true;
  }

  finish(capturedAtMs: number): RetargetReferencePose | undefined {
    if (this.samples.length < this.options.minimumSamples) return undefined;
    const frameIds = Object.keys(
      this.samples[0].sourceWorldRotations,
    ) as SourceFrameId[];
    const averaged: Partial<Record<SourceFrameId, THREE.Quaternion>> = {};

    for (const frameId of frameIds) {
      const rotations = this.samples
        .map((sample) => sample.sourceWorldRotations[frameId])
        .filter((rotation): rotation is THREE.Quaternion => Boolean(rotation));
      if (rotations.length !== this.samples.length) return undefined;
      const mean = averageRotations(rotations);
      if (
        rotations.some(
          (rotation) =>
            rotation.angleTo(mean) >
            this.options.maximumAngularDeviationRadians,
        )
      ) {
        return undefined;
      }
      averaged[frameId] = mean;
    }

    return createReferencePose(averaged, capturedAtMs);
  }
}

export type BodyCalibrationUpdate = Readonly<{
  reference?: RetargetReferencePose;
  failed: boolean;
}>;

export class BodyCalibrationReference {
  private readonly window: BodyReferenceWindow;
  private previousStatus: CalibrationStatus | undefined;
  private reference: RetargetReferencePose | undefined;

  constructor(options: Partial<BodyReferenceWindowOptions> = {}) {
    this.window = new BodyReferenceWindow(options);
  }

  reset(): void {
    this.window.reset();
    this.previousStatus = undefined;
    this.reference = undefined;
  }

  update(
    status: CalibrationStatus | undefined,
    observation: BodyObservation | undefined,
    timestampMs: number,
  ): BodyCalibrationUpdate {
    if (status === "NO" && this.previousStatus !== "NO") {
      this.window.reset();
      this.reference = undefined;
    }

    if (status === "STARTED") {
      if (this.previousStatus !== "STARTED") {
        this.window.reset();
        this.reference = undefined;
      }
      if (observation) this.window.add(observation, timestampMs);
    }

    let failed = false;
    if (status === "YES" && this.previousStatus === "STARTED") {
      this.reference = this.window.finish(timestampMs);
      failed = !this.reference;
    }

    this.previousStatus = status;
    return { reference: this.reference, failed };
  }
}

export function solveBodyWorldTargets(
  rig: RetargetRig,
  observation: BodyObservation,
  reference: RetargetReferencePose,
): readonly BoneWorldTarget[] {
  const targets: BoneWorldTarget[] = [];
  const referenceTorso = reference.sourceWorldRotations.torso;
  if (!referenceTorso) return targets;
  const bodySpaceAlignment = rig.bindBodyWorldRotation
    .clone()
    .multiply(referenceTorso.clone().invert())
    .normalize();

  for (const config of BODY_BONE_CONFIG) {
    if (config.mode === "frame") {
      const live = validFrame(observation.frames, config.source);
      const referenceRotation =
        reference.sourceWorldRotations[config.source];
      if (!live || !referenceRotation) continue;
      targets.push({
        boneId: config.bone,
        rotation: calibratedTargetWorldRotation(
          live.rotation,
          referenceRotation,
          rig.worldBindRotations[config.bone],
          config.weight,
        ),
      });
      continue;
    }

    const result: DirectionResult | undefined =
      observation.directions[config.source];
    const bindDirection = rig.worldBindDirections[config.bone];
    if (!result?.valid || !bindDirection) continue;
    const mappedDirection = result.direction
      .clone()
      .applyQuaternion(bodySpaceAlignment)
      .normalize();
    const swing = new THREE.Quaternion().setFromUnitVectors(
      bindDirection,
      mappedDirection,
    );
    const weightedSwing = new THREE.Quaternion().slerp(
      swing,
      config.weight,
    );
    targets.push({
      boneId: config.bone,
      rotation: weightedSwing
        .multiply(rig.worldBindRotations[config.bone])
        .normalize(),
    });
  }

  return targets;
}
