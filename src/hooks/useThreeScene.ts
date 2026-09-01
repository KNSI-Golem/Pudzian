import React, { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  GLTFLoader,
  type GLTF,
} from "three/examples/jsm/loaders/GLTFLoader.js";
import type {
  ModelLoadResult,
  ModelViewerRef,
  PoseDetectionResult,
} from "@/types";
import type { CalibrationStatus } from "@/types/calibrate";
import {
  buildRetargetRig,
  BodyCalibrationReference,
  BODY_BONE_ORDER,
  fitPerspectiveCameraToBounds,
  HandCalibrationTracker,
  LEFT_HAND_BONE_ORDER,
  RIGHT_HAND_BONE_ORDER,
  RotationStabilizer,
  resetOnCalibrationRestart,
  solveHandObservation,
  solveHandWorldTargets,
  solveBodyObservation,
  solveBodyWorldTargets,
  type BoneWorldTarget,
  type HandCalibrationStatus,
  worldToParentLocalRotation,
  type RetargetReferencePose,
  type RetargetRig,
} from "@/lib/animate";

function disposeObject(root: THREE.Object3D): void {
  root.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      for (const material of materials) {
        for (const value of Object.values(material)) {
          if (value instanceof THREE.Texture) value.dispose();
        }
        material.dispose();
      }
    }
    if (object instanceof THREE.SkinnedMesh) {
      object.skeleton.dispose();
    }
  });
}

export interface UseThreeSceneOptions {
  modelPath?: string;
  poseRef?: React.RefObject<PoseDetectionResult | null>;
  calibrateStatus?: CalibrationStatus;
  onCalibrationFailure?: () => void;
}
export function useThreeScene(options: UseThreeSceneOptions = {}) {
  const {
    modelPath,
    poseRef,
    calibrateStatus,
    onCalibrationFailure,
  } = options;

  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<ModelViewerRef | null>(null);
  const sceneDisposalTimerRef = useRef<number | undefined>(undefined);
  const animationIdRef = useRef<number | undefined>(undefined);
  const rigRef = useRef<RetargetRig | null>(null);
  const referencePoseRef = useRef<RetargetReferencePose | null>(null);
  const bodyCalibrationRef = useRef(new BodyCalibrationReference());
  const lastCalibrationPoseRef = useRef<PoseDetectionResult | null>(null);
  const previousCalibrationStatusRef = useRef<CalibrationStatus | undefined>(
    undefined,
  );
  const handCalibrationsRef = useRef({
    left: new HandCalibrationTracker("left"),
    right: new HandCalibrationTracker("right"),
  });
  const stabilizerRef = useRef(new RotationStabilizer());
  const lastAnimationTimeRef = useRef<number | undefined>(undefined);
  const loadedGltfRef = useRef<GLTF | null>(null);
  const modelBoundsRef = useRef<THREE.Box3 | null>(null);
  const loadGenerationRef = useRef(0);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<ModelLoadResult | null>(null);
  const [handCalibrationStatus, setHandCalibrationStatus] = useState<
    Record<"left" | "right", HandCalibrationStatus>
  >({ left: "waiting", right: "waiting" });

  const initScene = useCallback(() => {
    if (sceneDisposalTimerRef.current !== undefined) {
      window.clearTimeout(sceneDisposalTimerRef.current);
      sceneDisposalTimerRef.current = undefined;
    }
    if (!mountRef.current || sceneRef.current) return;

    const rect = mountRef.current.getBoundingClientRect();
    const width = Math.max(rect.width, 1);
    const height = Math.max(rect.height, 1);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9c9ca5);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
    camera.position.set(0, 130, 150);

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2", {
      antialias: true,
      powerPreference: "default",
    });
    if (!context) {
      setError(
        "WebGL 2 is unavailable or temporarily blocked. Close other GPU-heavy tabs, verify browser hardware acceleration, and reload this page.",
      );
      return;
    }

    const renderer = new THREE.WebGLRenderer({
      canvas,
      context,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      setError(
        "The browser lost the WebGL context. Close other GPU-heavy tabs and reload this page.",
      );
    });
    canvas.addEventListener("webglcontextrestored", () => {
      setError(null);
    });

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
    directionalLight.position.set(5, 20, 8);
    scene.add(directionalLight);

    mountRef.current.appendChild(renderer.domElement);

    sceneRef.current = { camera, scene, renderer };
  }, []);

  const disposeScene = useCallback(() => {
    loadGenerationRef.current += 1;
    if (animationIdRef.current !== undefined) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = undefined;
    }
    const currentScene = sceneRef.current;
    if (!currentScene) return;
    if (loadedGltfRef.current) {
      currentScene.scene.remove(loadedGltfRef.current.scene);
      disposeObject(loadedGltfRef.current.scene);
      loadedGltfRef.current = null;
      modelBoundsRef.current = null;
    }
    currentScene.renderer.domElement.remove();
    currentScene.renderer.dispose();
    sceneRef.current = null;
    rigRef.current = null;
    referencePoseRef.current = null;
    bodyCalibrationRef.current.reset();
    lastCalibrationPoseRef.current = null;
    previousCalibrationStatusRef.current = undefined;
    handCalibrationsRef.current.left.reset();
    handCalibrationsRef.current.right.reset();
    stabilizerRef.current.reset();
    lastAnimationTimeRef.current = undefined;
  }, []);

  const loadModel = useCallback(async (path: string) => {
    const targetScene = sceneRef.current;
    if (!targetScene) return;
    const generation = ++loadGenerationRef.current;

    setIsLoading(true);
    setError(null);
    let pendingGltf: GLTF | null = null;

    try {
      const previous = loadedGltfRef.current;
      if (previous) {
        targetScene.scene.remove(previous.scene);
        disposeObject(previous.scene);
        loadedGltfRef.current = null;
        modelBoundsRef.current = null;
      }
      rigRef.current = null;
      handCalibrationsRef.current.left.reset();
      handCalibrationsRef.current.right.reset();
      setHandCalibrationStatus({ left: "waiting", right: "waiting" });
      stabilizerRef.current.reset();
      setModel(null);

      const loader = new GLTFLoader();
      pendingGltf = await new Promise<GLTF>((resolve, reject) => {
        loader.load(path, resolve, undefined, reject);
      });
      if (
        loadGenerationRef.current !== generation ||
        sceneRef.current !== targetScene
      ) {
        disposeObject(pendingGltf.scene);
        return;
      }

      pendingGltf.scene.updateWorldMatrix(true, true);
      rigRef.current = buildRetargetRig(pendingGltf.scene);
      handCalibrationsRef.current.left.reset();
      handCalibrationsRef.current.right.reset();
      setHandCalibrationStatus({ left: "waiting", right: "waiting" });
      stabilizerRef.current.reset();
      lastAnimationTimeRef.current = undefined;
      targetScene.scene.add(pendingGltf.scene);
      loadedGltfRef.current = pendingGltf;
      const modelBounds = new THREE.Box3().setFromObject(
        pendingGltf.scene,
        true,
      );
      fitPerspectiveCameraToBounds(targetScene.camera, modelBounds);
      modelBoundsRef.current = modelBounds;

      setModel({ gltf: pendingGltf });
      pendingGltf = null;
      setIsLoading(false);
    } catch (err) {
      if (pendingGltf) disposeObject(pendingGltf.scene);
      if (
        loadGenerationRef.current !== generation ||
        sceneRef.current !== targetScene
      ) {
        return;
      }
      const errorMessage = err instanceof Error ? err.message : 'Failed to load 3D model';
      console.error('Model loading error:', err);
      setError(errorMessage);
      setIsLoading(false);
    }
  }, []);

  const animate = useCallback(() => {
    if (!sceneRef.current) return;

    const timestampMs = performance.now();
    const previousTimestampMs = lastAnimationTimeRef.current;
    const deltaMs =
      previousTimestampMs === undefined
        ? 1000 / 60
        : timestampMs - previousTimestampMs;
    lastAnimationTimeRef.current = timestampMs;
    const pose = poseRef?.current;
    const rig = rigRef.current;
    resetOnCalibrationRestart(
      previousCalibrationStatusRef.current,
      calibrateStatus,
      () => {
        handCalibrationsRef.current.left.reset();
        handCalibrationsRef.current.right.reset();
        setHandCalibrationStatus({ left: "waiting", right: "waiting" });
        stabilizerRef.current.reset();
      },
    );
    previousCalibrationStatusRef.current = calibrateStatus;
    const newCalibrationPose =
      calibrateStatus === "STARTED" &&
      pose &&
      pose !== lastCalibrationPoseRef.current
        ? pose
        : undefined;
    if (newCalibrationPose) {
      lastCalibrationPoseRef.current = newCalibrationPose;
    }
    if (calibrateStatus === "NO") {
      lastCalibrationPoseRef.current = null;
    }
    const calibration = bodyCalibrationRef.current.update(
      calibrateStatus,
      newCalibrationPose
        ? solveBodyObservation(newCalibrationPose)
        : undefined,
      newCalibrationPose?.trackingFrame?.timestampMs ?? timestampMs,
    );
    referencePoseRef.current = calibration.reference ?? null;
    if (calibration.failed) {
      console.warn(
        "Calibration restarted because no stable body reference was captured",
      );
      onCalibrationFailure?.();
    }

    if (calibrateStatus === 'YES' && rig) {
      const observation = pose
        ? solveBodyObservation(pose)
        : { frames: {}, directions: {} };

      const reference = referencePoseRef.current;
      if (reference) {
        const parentWorld = new THREE.Quaternion();
        const applyTargets = (
          boneOrder: readonly (keyof RetargetRig["bones"])[],
          targets: readonly BoneWorldTarget[],
        ) => {
          const targetsByBone = new Map(
            targets.map((target) => [target.boneId, target]),
          );
          for (const boneId of boneOrder) {
            const bone = rig.bones[boneId];
            if (!bone.parent) continue;

            bone.parent.updateWorldMatrix(true, false);
            bone.parent.getWorldQuaternion(parentWorld);
            const worldTarget = targetsByBone.get(boneId);
            const localTarget = worldTarget
              ? worldToParentLocalRotation(parentWorld, worldTarget.rotation)
              : undefined;
            bone.quaternion.copy(
              stabilizerRef.current.step(
                boneId,
                bone.quaternion,
                localTarget,
                rig.localBindRotations[boneId],
                timestampMs,
                deltaMs,
              ),
            );
            bone.updateMatrix();
            bone.updateWorldMatrix(false, false);
          }
        };
        applyTargets(
          BODY_BONE_ORDER,
          solveBodyWorldTargets(rig, observation, reference),
        );

        const trackingFrame = pose?.trackingFrame;
        for (const side of ["left", "right"] as const) {
          const boneOrder =
            side === "left"
              ? LEFT_HAND_BONE_ORDER
              : RIGHT_HAND_BONE_ORDER;
          const hand = trackingFrame
            ? side === "left"
              ? trackingFrame.leftHand
              : trackingFrame.rightHand
            : undefined;
          const handObservation = hand
            ? solveHandObservation(hand)
            : undefined;
          const handCalibration =
            handCalibrationsRef.current[side].update(
              rig,
              hand,
              handObservation,
              trackingFrame?.timestampMs ?? timestampMs,
            );
          setHandCalibrationStatus((current) =>
            current[side] === handCalibration.status
              ? current
              : { ...current, [side]: handCalibration.status },
          );
          if (handObservation && handCalibration.reference) {
            applyTargets(
              boneOrder,
              solveHandWorldTargets(
                rig,
                handObservation,
                handCalibration.reference,
              ),
            );
            continue;
          }
          applyTargets(boneOrder, []);
        }
      }
    }

    sceneRef.current.renderer.render(sceneRef.current.scene, sceneRef.current.camera);

    animationIdRef.current = requestAnimationFrame(animate);
  }, [calibrateStatus, onCalibrationFailure, poseRef]);

  const handleResize = useCallback(() => {
    if (!sceneRef.current || !mountRef.current) return;

    const rect = mountRef.current.getBoundingClientRect();
    const width = Math.max(rect.width, 1);
    const height = Math.max(rect.height, 1);

    sceneRef.current.camera.aspect = width / height;
    if (modelBoundsRef.current) {
      fitPerspectiveCameraToBounds(
        sceneRef.current.camera,
        modelBoundsRef.current,
      );
    } else {
      sceneRef.current.camera.updateProjectionMatrix();
    }
    sceneRef.current.renderer.setSize(width, height);
  }, []);

  useEffect(() => {
    initScene();

    const resizeObserver = new ResizeObserver(handleResize);
    if (mountRef.current) {
      resizeObserver.observe(mountRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      if (animationIdRef.current !== undefined) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = undefined;
      }
      sceneDisposalTimerRef.current = window.setTimeout(() => {
        sceneDisposalTimerRef.current = undefined;
        disposeScene();
      }, 0);
    };
  }, [disposeScene, initScene, handleResize]);

  useEffect(() => {
    if (modelPath && sceneRef.current) {
      void loadModel(modelPath);
    } else {
      loadGenerationRef.current += 1;
      setIsLoading(false);
      const loaded = loadedGltfRef.current;
      if (loaded && sceneRef.current) {
        sceneRef.current.scene.remove(loaded.scene);
        disposeObject(loaded.scene);
        loadedGltfRef.current = null;
        modelBoundsRef.current = null;
        rigRef.current = null;
        handCalibrationsRef.current.left.reset();
        handCalibrationsRef.current.right.reset();
        setHandCalibrationStatus({ left: "waiting", right: "waiting" });
        stabilizerRef.current.reset();
        setModel(null);
      }
    }
  }, [modelPath, loadModel]);

  useEffect(() => {
    if (sceneRef.current) {
      animate();
    }
    return () => {
      if (animationIdRef.current !== undefined) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = undefined;
      }
    };
  }, [animate]);

  return {
    mountRef,
    isLoading,
    error,
    model,
    handCalibrationStatus,
    sceneRef: sceneRef.current,
  };
}
