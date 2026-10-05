import * as THREE from "three";
import { MAX_TRACKING_FRAME_AGE_MS } from "../mediapipe/trackingFrame";
import {
  LEFT_FINGER_CHAINS,
  RIGHT_FINGER_CHAINS,
  type FingerChainConfig,
} from "./boneConfig";
import {
  fingerDirections,
  type HandObservation,
} from "./handFrames";
import {
  createHandReference,
  type HandReferencePose,
} from "./handRetarget";
import type { RetargetRig } from "./rig";

export type HandCalibrationStatus =
  | "waiting"
  | "sampling"
  | "calibrated";

export type HandCalibrationUpdate = Readonly<{
  status: HandCalibrationStatus;
  reference?: HandReferencePose;
}>;

export const HAND_CALIBRATION_LIMITS = Object.freeze({
  palmFacingCameraRadians: THREE.MathUtils.degToRad(30),
  fingersDownRadians: THREE.MathUtils.degToRad(35),
  wristNeutralDot: Math.cos(THREE.MathUtils.degToRad(35)),
  extendedSegmentDot: Math.cos(THREE.MathUtils.degToRad(35)),
  minimumExtendedFingers: 3,
  samplingDurationMs: 350,
  minimumSamples: 10,
  maximumObservationGapMs: MAX_TRACKING_FRAME_AGE_MS,
  maximumAngularSpreadRadians: THREE.MathUtils.degToRad(12),
});

const CAMERA_DOWN = new THREE.Vector3(0, -1, 0);
const CAMERA_FORWARD = new THREE.Vector3(0, 0, 1);
const PALM_LOCAL_UP = new THREE.Vector3(0, 1, 0);
const PALM_LOCAL_FORWARD = new THREE.Vector3(0, 0, 1);

function fingerChains(side: "left" | "right"): readonly FingerChainConfig[] {
  return side === "left" ? LEFT_FINGER_CHAINS : RIGHT_FINGER_CHAINS;
}

function nonThumbChains(
  side: "left" | "right",
): readonly FingerChainConfig[] {
  return fingerChains(side).filter((chain) => !chain.thumb);
}

function isExtended(
  observation: HandObservation,
  chain: FingerChainConfig,
): boolean {
  const directions = fingerDirections(observation, chain);
  return Boolean(
    directions &&
      directions[0].dot(directions[1]) >=
        HAND_CALIBRATION_LIMITS.extendedSegmentDot &&
      directions[1].dot(directions[2]) >=
        HAND_CALIBRATION_LIMITS.extendedSegmentDot,
  );
}

export function isHandCalibrationPose(
  observation: HandObservation,
): boolean {
  const palmUp = PALM_LOCAL_UP.clone().applyQuaternion(
    observation.palmWorldRotation,
  );
  const palmForward = PALM_LOCAL_FORWARD.clone().applyQuaternion(
    observation.palmWorldRotation,
  );
  if (
    palmForward.angleTo(CAMERA_FORWARD) >
      HAND_CALIBRATION_LIMITS.palmFacingCameraRadians ||
    palmUp.angleTo(CAMERA_DOWN) >
      HAND_CALIBRATION_LIMITS.fingersDownRadians
  ) {
    return false;
  }

  const extended = nonThumbChains(observation.side).filter((chain) =>
    isExtended(observation, chain),
  );
  if (
    extended.length < HAND_CALIBRATION_LIMITS.minimumExtendedFingers
  ) {
    return false;
  }

  const firstSegments = extended
    .map((chain) => fingerDirections(observation, chain)?.[0])
    .filter(
      (direction): direction is THREE.Vector3 => Boolean(direction),
    );
  const averageFingerDirection = firstSegments
    .reduce(
      (sum, direction) => sum.add(direction),
      new THREE.Vector3(),
    )
    .normalize();

  return (
    averageFingerDirection.lengthSq() > 0 &&
    averageFingerDirection.dot(PALM_LOCAL_UP) >=
      HAND_CALIBRATION_LIMITS.wristNeutralDot
  );
}

function averageRotations(
  samples: readonly THREE.Quaternion[],
): THREE.Quaternion {
  const first = samples[0];
  const sum = new THREE.Vector4(0, 0, 0, 0);
  for (const sample of samples) {
    const sign = first.dot(sample) < 0 ? -1 : 1;
    sum.x += sample.x * sign;
    sum.y += sample.y * sign;
    sum.z += sample.z * sign;
    sum.w += sample.w * sign;
  }
  return new THREE.Quaternion(sum.x, sum.y, sum.z, sum.w).normalize();
}

export class HandCalibrationTracker {
  private readonly samples: THREE.Quaternion[] = [];
  private stableDurationMs = 0;
  private lastSampleTimestampMs: number | undefined;
  private interrupted = false;
  private reference: HandReferencePose | undefined;

  constructor(readonly side: "left" | "right") {}

  reset(): void {
    this.samples.length = 0;
    this.stableDurationMs = 0;
    this.lastSampleTimestampMs = undefined;
    this.interrupted = false;
    this.reference = undefined;
  }

  getStatus(): HandCalibrationStatus {
    if (this.reference) return "calibrated";
    return this.samples.length > 0 ? "sampling" : "waiting";
  }

  update(
    rig: RetargetRig,
    observation: HandObservation | undefined,
    timestampMs: number,
  ): HandCalibrationUpdate {
    if (this.reference) {
      return { status: "calibrated", reference: this.reference };
    }

    let sampleGapMs =
      this.lastSampleTimestampMs === undefined
        ? undefined
        : timestampMs - this.lastSampleTimestampMs;
    // Missing observations interrupt the sampling window; slow but fresh
    // detector updates still contribute distinct, steady samples.
    if (
      sampleGapMs !== undefined &&
      sampleGapMs > HAND_CALIBRATION_LIMITS.maximumObservationGapMs &&
      (!observation || this.interrupted)
    ) {
      this.reset();
      sampleGapMs = undefined;
    }

    if (!observation) {
      if (this.samples.length > 0 && sampleGapMs !== undefined) {
        this.interrupted = true;
        return { status: "sampling" };
      }
      this.reset();
      return { status: "waiting" };
    }

    if (
      observation.side !== this.side ||
      !isHandCalibrationPose(observation)
    ) {
      this.reset();
      return { status: "waiting" };
    }
    if (timestampMs === this.lastSampleTimestampMs) {
      return { status: this.getStatus() };
    }

    const sample = observation.palmWorldRotation.clone().normalize();

    if (
      this.samples.length > 0 &&
      !this.interrupted &&
      sampleGapMs !== undefined
    ) {
      this.stableDurationMs += sampleGapMs;
    }
    this.interrupted = false;
    this.lastSampleTimestampMs = timestampMs;
    this.samples.push(sample);

    const averagePalm = averageRotations(
      this.samples,
    );
    if (
      this.samples.some(
        (value) =>
          value.angleTo(averagePalm) >
          HAND_CALIBRATION_LIMITS.maximumAngularSpreadRadians,
      )
    ) {
      this.samples.splice(0, this.samples.length, sample);
      this.stableDurationMs = 0;
      return { status: "sampling" };
    }

    if (
      this.stableDurationMs >=
        HAND_CALIBRATION_LIMITS.samplingDurationMs &&
      this.samples.length >= HAND_CALIBRATION_LIMITS.minimumSamples
    ) {
      this.reference = createHandReference(
        rig,
        this.side,
        averagePalm,
      );
    }

    return {
      status: this.getStatus(),
      reference: this.reference,
    };
  }
}
