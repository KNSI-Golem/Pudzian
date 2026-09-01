import * as THREE from "three";
import type { SourceFrameId } from "./boneConfig";

export type SourceFrameMap = Readonly<
  Partial<Record<SourceFrameId, THREE.Quaternion>>
>;

export type RetargetReferencePose = Readonly<{
  capturedAtMs: number;
  sourceWorldRotations: SourceFrameMap;
}>;

export function createReferencePose(
  sourceFrames: SourceFrameMap,
  capturedAtMs: number,
): RetargetReferencePose {
  const clonedFrames: Partial<Record<SourceFrameId, THREE.Quaternion>> = {};

  for (const [frameId, rotation] of Object.entries(sourceFrames) as [
    SourceFrameId,
    THREE.Quaternion,
  ][]) {
    clonedFrames[frameId] = rotation.clone().normalize();
  }

  return Object.freeze({
    capturedAtMs,
    sourceWorldRotations: Object.freeze(clonedFrames),
  });
}
