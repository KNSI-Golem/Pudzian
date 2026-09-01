import * as THREE from "three";
import type { AssignedHand } from "@/types";
import {
  LEFT_FINGER_CHAINS,
  RIGHT_FINGER_CHAINS,
  type FingerChainConfig,
} from "./boneConfig";
import type { HandObservation } from "./handFrames";
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
  fingersUpRadians: THREE.MathUtils.degToRad(35),
  wristNeutralDot: Math.cos(THREE.MathUtils.degToRad(35)),
  extendedSegmentDot: Math.cos(THREE.MathUtils.degToRad(35)),
  minimumExtendedFingers: 3,
  samplingDurationMs: 350,
  minimumSamples: 10,
  maximumAngularSpreadRadians: THREE.MathUtils.degToRad(12),
});

const CAMERA_UP = new THREE.Vector3(0, 1, 0);
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
  const directions = chain.bones.map(
    (boneId) => observation.directions[boneId],
  );
  if (directions.some((direction) => !direction?.valid)) return false;
  const [first, second, third] = directions as [
    Extract<(typeof directions)[number], { valid: true }>,
    Extract<(typeof directions)[number], { valid: true }>,
    Extract<(typeof directions)[number], { valid: true }>,
  ];
  return (
    first.direction.dot(second.direction) >=
      HAND_CALIBRATION_LIMITS.extendedSegmentDot &&
    second.direction.dot(third.direction) >=
      HAND_CALIBRATION_LIMITS.extendedSegmentDot
  );
}

export function isHandCalibrationPose(
  hand: AssignedHand,
  observation: HandObservation,
): boolean {
  if (hand.stale) return false;
  const handBone = hand.side === "left" ? "leftHand" : "rightHand";
  const palm = observation.frames[handBone];
  if (!palm?.valid) return false;

  const palmUp = PALM_LOCAL_UP.clone().applyQuaternion(palm.rotation);
  const palmForward = PALM_LOCAL_FORWARD
    .clone()
    .applyQuaternion(palm.rotation);
  if (
    palmForward.angleTo(CAMERA_FORWARD) >
      HAND_CALIBRATION_LIMITS.palmFacingCameraRadians ||
    palmUp.angleTo(CAMERA_UP) >
      HAND_CALIBRATION_LIMITS.fingersUpRadians
  ) {
    return false;
  }

  const chains = nonThumbChains(hand.side);
  const extended = chains.filter((chain) =>
    isExtended(observation, chain),
  );
  if (
    extended.length < HAND_CALIBRATION_LIMITS.minimumExtendedFingers
  ) {
    return false;
  }

  const firstSegments = extended
    .map((chain) => observation.directions[chain.bones[0]])
    .filter(
      (
        direction,
      ): direction is Extract<typeof direction, { valid: true }> =>
        Boolean(direction?.valid),
    );
  const averageFingerDirection = firstSegments
    .reduce(
      (sum, direction) => sum.add(direction.direction),
      new THREE.Vector3(),
    )
    .normalize();
  return (
    averageFingerDirection.lengthSq() > 0 &&
    averageFingerDirection.dot(palmUp) >=
      HAND_CALIBRATION_LIMITS.wristNeutralDot
  );
}

function averageRotations(
  samples: readonly THREE.Quaternion[],
): THREE.Quaternion {
  const first = samples[0];
  const sum = new THREE.Vector4();
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
  private status: HandCalibrationStatus = "waiting";
  private readonly samples: THREE.Quaternion[] = [];
  private samplingStartedAtMs: number | undefined;
  private lastSampleTimestampMs: number | undefined;
  private reference: HandReferencePose | undefined;

  constructor(readonly side: "left" | "right") {}

  reset(): void {
    this.status = "waiting";
    this.samples.length = 0;
    this.samplingStartedAtMs = undefined;
    this.lastSampleTimestampMs = undefined;
    this.reference = undefined;
  }

  getStatus(): HandCalibrationStatus {
    return this.status;
  }

  update(
    rig: RetargetRig,
    hand: AssignedHand | undefined,
    observation: HandObservation | undefined,
    timestampMs: number,
  ): HandCalibrationUpdate {
    if (this.reference) {
      return { status: "calibrated", reference: this.reference };
    }
    if (
      !hand ||
      hand.side !== this.side ||
      !observation ||
      !isHandCalibrationPose(hand, observation)
    ) {
      this.reset();
      return { status: this.status };
    }
    if (timestampMs === this.lastSampleTimestampMs) {
      return { status: this.status };
    }
    this.lastSampleTimestampMs = timestampMs;

    const handBone =
      this.side === "left" ? "leftHand" : "rightHand";
    const palm = observation.frames[handBone];
    if (!palm?.valid) {
      this.reset();
      return { status: this.status };
    }
    if (this.status === "waiting") {
      this.status = "sampling";
      this.samplingStartedAtMs = timestampMs;
    }
    this.samples.push(palm.rotation.clone().normalize());

    const average = averageRotations(this.samples);
    const excessiveSpread = this.samples.some(
      (sample) =>
        sample.angleTo(average) >
        HAND_CALIBRATION_LIMITS.maximumAngularSpreadRadians,
    );
    if (excessiveSpread) {
      this.samples.splice(0, this.samples.length, palm.rotation.clone());
      this.samplingStartedAtMs = timestampMs;
      return { status: this.status };
    }

    const durationMs = timestampMs - (this.samplingStartedAtMs ?? timestampMs);
    if (
      durationMs >= HAND_CALIBRATION_LIMITS.samplingDurationMs &&
      this.samples.length >= HAND_CALIBRATION_LIMITS.minimumSamples
    ) {
      this.reference = createHandReference(
        rig,
        this.side,
        average,
        timestampMs,
      );
      this.status = "calibrated";
    }
    return { status: this.status, reference: this.reference };
  }
}
