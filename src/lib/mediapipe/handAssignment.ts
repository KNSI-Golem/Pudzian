import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import type {
  AnatomicalSide,
  AssignedHand,
  DetectedHand,
  PoseDetectionResult,
  TrackingFrame,
} from "@/types";
import { HAND_LANDMARK, POSE_LANDMARK } from "./mapping";

export type HandAssignmentConfig = Readonly<{
  maximumWristDistanceFraction: number;
  dropoutHoldMs: number;
  continuityWeight: number;
  handednessWeight: number;
  swapHandednessLabels: boolean;
}>;

const DEFAULT_CONFIG: HandAssignmentConfig = {
  maximumWristDistanceFraction: 0.22,
  dropoutHoldMs: 180,
  continuityWeight: 0.35,
  handednessWeight: 0.08,
  swapHandednessLabels: false,
};

type Point = Readonly<{ x: number; y: number }>;

type SideState = {
  hand: AssignedHand;
  wrist: Point;
  velocity: Point;
};

type Candidate = {
  detectionIndex: number;
  cost: number;
  geometryCost: number;
};

function pixelPoint(
  landmark: NormalizedLandmark,
  imageSize: TrackingFrame["imageSize"],
): Point {
  return {
    x: landmark.x * imageSize.width,
    y: landmark.y * imageSize.height,
  };
}

function normalizedPixelDistance(
  a: Point,
  b: Point,
  imageSize: TrackingFrame["imageSize"],
): number {
  const diagonal = Math.hypot(imageSize.width, imageSize.height);
  return diagonal > 0 ? Math.hypot(a.x - b.x, a.y - b.y) / diagonal : Infinity;
}

function expectedHandedness(
  side: AnatomicalSide,
  swap: boolean,
): "Left" | "Right" {
  const label = side === "left" ? "Left" : "Right";
  if (!swap) return label;
  return label === "Left" ? "Right" : "Left";
}

function predictWrist(
  state: SideState | undefined,
  timestampMs: number,
): Point | undefined {
  if (!state) return undefined;
  const elapsedSeconds = Math.min(
    Math.max((timestampMs - state.hand.observedAtMs) / 1000, 0),
    0.1,
  );
  return {
    x: state.wrist.x + state.velocity.x * elapsedSeconds,
    y: state.wrist.y + state.velocity.y * elapsedSeconds,
  };
}

function poseWrist(
  frame: TrackingFrame,
  side: AnatomicalSide,
): Point | undefined {
  const index =
    side === "left" ? POSE_LANDMARK.leftWrist : POSE_LANDMARK.rightWrist;
  const landmark = frame.poseImageLandmarks[index];
  return landmark ? pixelPoint(landmark, frame.imageSize) : undefined;
}

function detectedWrist(
  frame: TrackingFrame,
  hand: DetectedHand,
): Point | undefined {
  const landmark = hand.imageLandmarks[HAND_LANDMARK.wrist];
  return landmark ? pixelPoint(landmark, frame.imageSize) : undefined;
}

function enumerateAssignments(
  left: readonly Candidate[],
  right: readonly Candidate[],
  unassignedCost: number,
): Readonly<{ left?: Candidate; right?: Candidate }> {
  const choices = <T>(values: readonly T[]): readonly (T | undefined)[] => [
    undefined,
    ...values,
  ];
  let best: { left?: Candidate; right?: Candidate; cost: number } = {
    cost: unassignedCost * 2,
  };

  for (const leftCandidate of choices(left)) {
    for (const rightCandidate of choices(right)) {
      if (
        leftCandidate &&
        rightCandidate &&
        leftCandidate.detectionIndex === rightCandidate.detectionIndex
      ) {
        continue;
      }
      const cost =
        (leftCandidate?.cost ?? unassignedCost) +
        (rightCandidate?.cost ?? unassignedCost);
      if (cost < best.cost) {
        best = { left: leftCandidate, right: rightCandidate, cost };
      }
    }
  }
  return best;
}

export class HandAssignmentTracker {
  private readonly config: HandAssignmentConfig;
  private readonly state: Partial<Record<AnatomicalSide, SideState>> = {};

  constructor(config: Partial<HandAssignmentConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  reset(): void {
    delete this.state.left;
    delete this.state.right;
  }

  assign(frame: TrackingFrame): TrackingFrame {
    const detectedHands = frame.detectedHands ?? [];
    const candidates: Record<AnatomicalSide, Candidate[]> = {
      left: [],
      right: [],
    };

    for (const side of ["left", "right"] as const) {
      const posePoint = poseWrist(frame, side);
      if (!posePoint) continue;
      const predicted = predictWrist(this.state[side], frame.timestampMs);

      detectedHands.forEach((hand, detectionIndex) => {
        const wrist = detectedWrist(frame, hand);
        if (!wrist) return;
        const geometryCost = normalizedPixelDistance(
          wrist,
          posePoint,
          frame.imageSize,
        );
        if (geometryCost > this.config.maximumWristDistanceFraction) return;

        const continuityCost = predicted
          ? normalizedPixelDistance(wrist, predicted, frame.imageSize)
          : 0;
        const handednessPenalty =
          hand.handedness &&
          hand.handedness.label !==
            expectedHandedness(side, this.config.swapHandednessLabels)
            ? hand.handedness.score * this.config.handednessWeight
            : 0;
        candidates[side].push({
          detectionIndex,
          geometryCost,
          cost:
            geometryCost +
            continuityCost * this.config.continuityWeight +
            handednessPenalty,
        });
      });
    }

    const selected = enumerateAssignments(
      candidates.left,
      candidates.right,
      this.config.maximumWristDistanceFraction * 1.1,
    );
    const leftHand = this.updateSide("left", selected.left, frame);
    const rightHand = this.updateSide("right", selected.right, frame);

    return Object.freeze({
      ...frame,
      leftHand,
      rightHand,
    });
  }

  private updateSide(
    side: AnatomicalSide,
    candidate: Candidate | undefined,
    frame: TrackingFrame,
  ): AssignedHand | undefined {
    const previous = this.state[side];
    const hand = candidate
      ? (frame.detectedHands ?? [])[candidate.detectionIndex]
      : undefined;
    const wrist = hand ? detectedWrist(frame, hand) : undefined;

    if (hand && wrist && candidate) {
      const elapsedSeconds = previous
        ? Math.max((frame.timestampMs - previous.hand.observedAtMs) / 1000, 1 / 120)
        : 0;
      const velocity =
        previous && elapsedSeconds > 0
          ? {
              x: (wrist.x - previous.wrist.x) / elapsedSeconds,
              y: (wrist.y - previous.wrist.y) / elapsedSeconds,
            }
          : { x: 0, y: 0 };
      const maximumSpeed = Math.hypot(
        frame.imageSize.width,
        frame.imageSize.height,
      ) * 3;
      const speed = Math.hypot(velocity.x, velocity.y);
      if (speed > maximumSpeed) {
        const scale = maximumSpeed / speed;
        velocity.x *= scale;
        velocity.y *= scale;
      }
      const assigned: AssignedHand = Object.freeze({
        ...hand,
        side,
        observedAtMs: frame.timestampMs,
        assignmentConfidence: Math.max(
          0,
          1 -
            candidate.geometryCost /
              this.config.maximumWristDistanceFraction,
        ),
        stale: false,
      });
      this.state[side] = { hand: assigned, wrist, velocity };
      return assigned;
    }

    if (
      previous &&
      frame.timestampMs - previous.hand.observedAtMs <=
        this.config.dropoutHoldMs
    ) {
      const stale = Object.freeze({ ...previous.hand, stale: true });
      this.state[side] = { ...previous, hand: stale };
      return stale;
    }

    delete this.state[side];
    return undefined;
  }
}

export function assignHandsInResult(
  result: PoseDetectionResult,
  tracker: HandAssignmentTracker,
): PoseDetectionResult {
  if (!result.trackingFrame) return result;
  return {
    ...result,
    trackingFrame: tracker.assign(result.trackingFrame),
  };
}
