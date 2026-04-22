import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { ModelViewerRef, ModelLoadResult } from '@/types';
import type { PoseDetectionResult } from '@/types';
import { processAnimateJoint, processHandJoint, getHipsTranslationAndRotation, processForearmHybrid, processHandRoot, processSpine, processShoulder, processHead, processFoot, getStandardWorldQuat } from '@/lib/animate';
import { ANIM_JOINTS_CONFIG, LIMB_CONFIGS, FINGER_PAIRS_LEFT, FINGER_PAIRS_RIGHT } from '@/lib/animate/boneConfig';
import { JOINT_POINTS_CONFIG, MEDIAPIPE_JOINTS_CONFIG } from '@/lib/animate/mapping';
import { perfTracker } from '@/lib/perf/perfTracker';

export interface UseThreeSceneOptions {
  modelPath?: string;
  poseRef?: React.RefObject<PoseDetectionResult | null>;
}
export function useThreeScene(options: UseThreeSceneOptions = {}) {
  const {
    modelPath,
    poseRef
  } = options;

  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<ModelViewerRef | null>(null);
  const animationIdRef = useRef<number | undefined>(undefined);
  const jointsCacheRef = useRef<Record<string, THREE.Object3D | null>>({});
  const restPosesCacheRef = useRef<Record<string, THREE.Quaternion>>({});
  const worldRestPosesCacheRef = useRef<Record<string, THREE.Quaternion>>({});
  const hipsDeltaWorldRef = useRef<THREE.Quaternion>(new THREE.Quaternion());

  const visibilityCountersRef = useRef<Record<string, number>>({});
  const visibilityStatesRef = useRef<Record<string, 'visible' | 'hidden'>>({});
  const HYSTERESIS_THRESHOLD = 3; // Obniżony próg dla szybszej reakcji
  const VISIBILITY_THRESHOLD = 0.2;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<ModelLoadResult | null>(null);

  const initScene = useCallback(() => {
    if (!mountRef.current || sceneRef.current) return;

    const rect = mountRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9c9ca5)

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(0, 100, 300); // 300, żeby na 100% zmieścić całego robota!

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
    directionalLight.position.set(5, 20, 8);
    scene.add(directionalLight);

    mountRef.current.appendChild(renderer.domElement);

    sceneRef.current = {
      camera,
      scene,
      renderer,
    };

  }, []);

  const loadModel = useCallback(async (path: string) => {
    if (!sceneRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      setModel((currentModel) => {
        if (currentModel?.gltf && sceneRef.current) {
          sceneRef.current.scene.remove(currentModel.gltf.scene);
        }
        return null;
      });

      const loader = new GLTFLoader();
      const gltf = await new Promise<any>((resolve, reject) => {
        loader.load(path, resolve, undefined, reject);
      });

      const model = gltf.scene;
      model.name = 'GolemModel';
      model.updateWorldMatrix(true, true);
      model.updateMatrixWorld(true);

      const configValues = Object.values(ANIM_JOINTS_CONFIG);
      const sanitize = (s: string) => s.toLowerCase().replace(/[:_]/g, '');

      model.traverse((child: any) => {
        if (child.isMesh && !child.isSkinnedMesh) {
          child.visible = false;
        }
        if (child.isBone) {
          const sanitizedChild = sanitize(child.name);
          // Szukamy czy nazwa kości pasuje do któregokolwiek klucza w konfiguracji
          const configKey = configValues.find(v => sanitize(v) === sanitizedChild);

          const keyToStore = configKey || child.name;
          restPosesCacheRef.current[keyToStore] = child.quaternion.clone();
          worldRestPosesCacheRef.current[keyToStore] = child.getWorldQuaternion(new THREE.Quaternion());
        }
      });

      if (sceneRef.current) {
        const oldModel = sceneRef.current.scene.getObjectByName('GolemModel');
        if (oldModel) {
          sceneRef.current.scene.remove(oldModel);
        }
        sceneRef.current.scene.add(model);
      }

      setModel({ gltf });
      setIsLoading(false);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load 3D model';
      console.error('Model loading error:', err);
      setError(errorMessage);
      setIsLoading(false);
    }
  }, []);

  const animate = useCallback(() => {
    if (!sceneRef.current) return;

    const pose = poseRef?.current;
    if (!pose || !pose.worldLandmarks || pose.worldLandmarks.length === 0 || !pose.landmarks?.[0]) {
      animationIdRef.current = requestAnimationFrame(animate);
      return;
    }

    const getStandardTPoseQuat = (boneName: string): THREE.Quaternion => {
      if (boneName.includes('UpLeg') || boneName.includes('Leg')) {
        // Noga: Y w dół (-1), Z w przód (1)
        return getStandardWorldQuat(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, 1));
      }
      if (boneName.includes('Shoulder') || boneName.includes('Arm') || boneName.includes('Hand') || boneName.includes('Finger') || boneName.includes('Thumb') || boneName.toLowerCase().includes('index') || boneName.toLowerCase().includes('middle') || boneName.toLowerCase().includes('ring') || boneName.toLowerCase().includes('pinky')) {
        const isLeft = boneName.toLowerCase().includes('left');
        // Bark/Ramię/Dłoń/Palec: Y w bok (L:1, R:-1), Z w DÓŁ (0, -1, 0) - standard Mixamo dłonie płasko do ziemi
        return getStandardWorldQuat(new THREE.Vector3(isLeft ? 1 : -1, 0, 0), new THREE.Vector3(0, -1, 0));
      }
      if (boneName.includes('Foot')) {
        // Stopa: Y w przód (1), Z w górę (czyli forward dla bazy to Up 0,1,0)
        return getStandardWorldQuat(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0));
      }
      // Tułów/Głowa: Y w górę (1), Z w przód (1)
      return getStandardWorldQuat(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1));
    };

    const scratchWorldQuat = new THREE.Quaternion();
    const scratchLocalQuat = new THREE.Quaternion();
    const fallbackRestPose = new THREE.Quaternion();

    const getCachedJoint = (name: string) => {
      if (jointsCacheRef.current[name] === undefined) {
        // 1. Próba bezpośrednia
        let obj = sceneRef.current!.scene.getObjectByName(name);

        // 2. Próba z dwukropkiem (częsty format Mixamo w GLB/FBX)
        if (!obj && name.startsWith('mixamorig')) {
          const withColon = name.replace('mixamorig', 'mixamorig:');
          obj = sceneRef.current!.scene.getObjectByName(withColon);
        }

        // 3. Fallback: przeszukanie po uproszczonej nazwie (case-insensitive i bez znaków specjalnych)
        if (!obj) {
          const target = name.toLowerCase().replace(/[:_]/g, '');
          sceneRef.current!.scene.traverse((child) => {
            if (obj) return;
            const childName = child.name.toLowerCase().replace(/[:_]/g, '');
            if (childName === target || childName.includes(target)) {
              obj = child;
            }
          });
        }

        jointsCacheRef.current[name] = obj || null;
      }
      return jointsCacheRef.current[name];
    };

    // Hips Rotation (Anchored without translation)
    const hipsJoint = getCachedJoint(ANIM_JOINTS_CONFIG.hips);
    let rootQuat = new THREE.Quaternion();
    if (hipsJoint && hipsJoint.parent) {
      const result = getHipsTranslationAndRotation(pose);
      rootQuat = result.rootQuat;

      // Zapisujemy deltaWorld miednicy dla kończyn w T-Pose (by nogi podążały za pochyleniem tułowia przy braku widoczności)
      const tPoseHips = getStandardTPoseQuat(ANIM_JOINTS_CONFIG.hips);
      hipsDeltaWorldRef.current.copy(rootQuat).multiply(tPoseHips.invert());

      hipsJoint.position.x = result.rootPos.x;
      hipsJoint.position.z = result.rootPos.z;

      hipsJoint.parent.updateWorldMatrix(true, false);
      const restPose = restPosesCacheRef.current[ANIM_JOINTS_CONFIG.hips] || fallbackRestPose;
      hipsJoint.parent.getWorldQuaternion(scratchWorldQuat);
      scratchLocalQuat.copy(scratchWorldQuat).invert().multiply(rootQuat).multiply(restPose);
      hipsJoint.quaternion.slerp(scratchLocalQuat, 0.2);
    }

    const spineBaseQuat = rootQuat.clone();
    const spineTargetQuat = processSpine(pose);
    const headTargetQuat = processHead(pose);

    const spineFractions = [
      { name: ANIM_JOINTS_CONFIG.spine, fraction: 0.33 },
      { name: ANIM_JOINTS_CONFIG.spine1, fraction: 0.66 },
      { name: ANIM_JOINTS_CONFIG.spine2, fraction: 1.0 }
    ];

    const directApplyJoints = [
      ...spineFractions.map(({ name, fraction }) => ({
        name,
        quat: spineBaseQuat.clone().slerp(spineTargetQuat, fraction)
      })),
      { name: ANIM_JOINTS_CONFIG.shoulderLeft, quat: processShoulder(pose, 'Left') },
      { name: ANIM_JOINTS_CONFIG.shoulderRight, quat: processShoulder(pose, 'Right') },
      { name: ANIM_JOINTS_CONFIG.neck, quat: spineTargetQuat.clone().slerp(headTargetQuat, 0.5) },
      { name: ANIM_JOINTS_CONFIG.head, quat: headTargetQuat }
    ];


    directApplyJoints.forEach(({ name, quat }) => {
      const joint = getCachedJoint(name);
      if (joint && joint.parent) {
        joint.parent.updateWorldMatrix(true, false);

        const tPoseStd = getStandardTPoseQuat(name);
        const deltaWorld = quat.clone().multiply(tPoseStd.clone().invert());

        const worldRestPose = worldRestPosesCacheRef.current[name] || fallbackRestPose;
        const targetWorld = deltaWorld.multiply(worldRestPose);

        joint.parent.getWorldQuaternion(scratchWorldQuat);
        scratchLocalQuat.copy(scratchWorldQuat).invert().multiply(targetWorld);
        joint.quaternion.slerp(scratchLocalQuat, 0.2);
      }
    });

    const VISIBILITY_THRESHOLD = 0.2;

    for (const { name, process } of LIMB_CONFIGS) {
      if (['spine', 'spine1', 'spine2', 'neck', 'head', 'hips', 'arm_left', 'arm_right', 'forearm_left', 'forearm_right', 'hand_left', 'hand_right', 'foot_left', 'foot_right', 'toe_left', 'toe_right'].includes(name)) {
        continue;
      }

      const joint = getCachedJoint(name);
      if (joint && joint.parent) {
        const jointIndices = JOINT_POINTS_CONFIG[process];
        const midPointIdx = jointIndices ? jointIndices[1] : undefined;
        const liveVisibility = (midPointIdx !== undefined) ? (pose.landmarks[0][midPointIdx]?.visibility ?? 1.0) : 1.0;

        // Maszyna stanów widoczności
        let state = visibilityStatesRef.current[name] || 'visible';
        let counter = visibilityCountersRef.current[name] || 0;

        if (state === 'visible') {
          if (liveVisibility < VISIBILITY_THRESHOLD) {
            // Nagły zanik: zamrażamy (zostawiamy ostatnią pozycję) przez X klatek
            if (counter < HYSTERESIS_THRESHOLD) {
              visibilityCountersRef.current[name] = counter + 1;
              continue; // Zamrożenie (brak update'u quat)
            } else {
              visibilityStatesRef.current[name] = 'hidden';
              visibilityCountersRef.current[name] = 0;
              state = 'hidden';
            }
          } else {
            visibilityCountersRef.current[name] = 0;
          }
        } else { // Stan 'hidden'
          if (liveVisibility > VISIBILITY_THRESHOLD) {
            // Powrót: czekamy do stabilizacji przez X klatek
            if (counter < HYSTERESIS_THRESHOLD) {
              visibilityCountersRef.current[name] = counter + 1;
            } else {
              visibilityStatesRef.current[name] = 'visible';
              visibilityCountersRef.current[name] = 0;
              state = 'visible';
            }
          } else {
            visibilityCountersRef.current[name] = 0;
          }
        }

        let deltaWorld: THREE.Quaternion;
        if (state === 'hidden') {
          // Reset do T-pose relatywnego do miednicy
          deltaWorld = hipsDeltaWorldRef.current.clone();
        } else {
          const liveQuat = processAnimateJoint(pose, process);
          const tPoseQuat = getStandardTPoseQuat(name);
          deltaWorld = liveQuat.clone().multiply(tPoseQuat.invert());
        }

        const worldRestPose = worldRestPosesCacheRef.current[name] || fallbackRestPose;
        const targetWorld = deltaWorld.multiply(worldRestPose);

        joint.parent.updateWorldMatrix(true, false);
        joint.parent.getWorldQuaternion(scratchWorldQuat);
        scratchLocalQuat.copy(scratchWorldQuat).invert().multiply(targetWorld);
        joint.quaternion.slerp(scratchLocalQuat, 0.2);
      }
    }

    // Animacja stóp DeltaWorld
    const feet = [
      { name: ANIM_JOINTS_CONFIG.footLeft, category: 'Left' as const },
      { name: ANIM_JOINTS_CONFIG.footRight, category: 'Right' as const }
    ];

    feet.forEach(({ name, category }) => {
      const joint = getCachedJoint(name);
      if (joint && joint.parent) {
        const ankleIdx = category === 'Left' ? 27 : 28;
        const liveVisibility = pose.landmarks[0][ankleIdx]?.visibility ?? 1.0;

        let state = visibilityStatesRef.current[name] || 'visible';
        let counter = visibilityCountersRef.current[name] || 0;

        if (state === 'visible') {
          if (liveVisibility < VISIBILITY_THRESHOLD) {
            if (counter < HYSTERESIS_THRESHOLD) {
              visibilityCountersRef.current[name] = counter + 1;
              return; // Freeze
            } else {
              visibilityStatesRef.current[name] = 'hidden';
              visibilityCountersRef.current[name] = 0;
              state = 'hidden';
            }
          } else {
            visibilityCountersRef.current[name] = 0;
          }
        } else {
          if (liveVisibility > VISIBILITY_THRESHOLD) {
            if (counter < HYSTERESIS_THRESHOLD) {
              visibilityCountersRef.current[name] = counter + 1;
            } else {
              visibilityStatesRef.current[name] = 'visible';
              visibilityCountersRef.current[name] = 0;
              state = 'visible';
            }
          } else {
            visibilityCountersRef.current[name] = 0;
          }
        }

        let deltaWorld: THREE.Quaternion;
        if (state === 'hidden') {
          deltaWorld = hipsDeltaWorldRef.current.clone();
        } else {
          const liveQuat = processFoot(pose, category);
          const tPoseQuat = getStandardTPoseQuat(name);
          deltaWorld = liveQuat.clone().multiply(tPoseQuat.invert());
        }

        const worldRestPose = worldRestPosesCacheRef.current[name] || fallbackRestPose;
        const targetWorld = deltaWorld.multiply(worldRestPose);

        joint.parent.updateWorldMatrix(true, false);
        joint.parent.getWorldQuaternion(scratchWorldQuat);
        scratchLocalQuat.copy(scratchWorldQuat).invert().multiply(targetWorld);
        joint.quaternion.slerp(scratchLocalQuat, 0.2);
      }
    });

    // Unified arm chain — hierarchiczna histeryza z dwóch poziomów:
    // 1. Łokieć (armLeft/Right): jesli niewidoczny → wszystko ponizej w T-pose
    // 2. Dłoń (handLandmarks): jesli brak → forearm animuje, hand+palce w T-pose
    const ARM_CONFIGS = [
      {
        category: 'Left' as const,
        elbowIdx: MEDIAPIPE_JOINTS_CONFIG.armLeft,         // landmark 13
        wristIdx: MEDIAPIPE_JOINTS_CONFIG.foreArmLeft,     // landmark 15
        foreArmName: ANIM_JOINTS_CONFIG.foreArmLeft,
        handName: ANIM_JOINTS_CONFIG.handLeft,
        foreArmTpose: new THREE.Matrix4().makeBasis(new THREE.Vector3(0,1,0), new THREE.Vector3(1,0,0), new THREE.Vector3(0,0,-1)),
        fingerPairs: FINGER_PAIRS_LEFT,
        marks: pose.leftHandWorldLandmarks,
      },
      {
        category: 'Right' as const,
        elbowIdx: MEDIAPIPE_JOINTS_CONFIG.armRight,        // landmark 14
        wristIdx: MEDIAPIPE_JOINTS_CONFIG.foreArmRight,    // landmark 16
        foreArmName: ANIM_JOINTS_CONFIG.foreArmRight,
        handName: ANIM_JOINTS_CONFIG.handRight,
        foreArmTpose: new THREE.Matrix4().makeBasis(new THREE.Vector3(0,-1,0), new THREE.Vector3(-1,0,0), new THREE.Vector3(0,0,-1)),
        fingerPairs: FINGER_PAIRS_RIGHT,
        marks: pose.rightHandWorldLandmarks,
      },
    ];

    ARM_CONFIGS.forEach(({ category, elbowIdx, wristIdx, foreArmName, handName, foreArmTpose, fingerPairs, marks }) => {
      // --- Krok 1: Widoczność łokcia ---
      const elbowKey = `elbow_${category}`;
      const elbowVis = pose.landmarks[0][elbowIdx]?.visibility ?? 1.0;
      let elbowState = visibilityStatesRef.current[elbowKey] || 'visible';
      let elbowCounter = visibilityCountersRef.current[elbowKey] || 0;

      if (elbowState === 'visible') {
        if (elbowVis < VISIBILITY_THRESHOLD) {
          if (elbowCounter < HYSTERESIS_THRESHOLD) { visibilityCountersRef.current[elbowKey] = elbowCounter + 1; }
          else { visibilityStatesRef.current[elbowKey] = 'hidden'; visibilityCountersRef.current[elbowKey] = 0; elbowState = 'hidden'; }
        } else { visibilityCountersRef.current[elbowKey] = 0; }
      } else {
        if (elbowVis >= VISIBILITY_THRESHOLD) {
          if (elbowCounter < HYSTERESIS_THRESHOLD) { visibilityCountersRef.current[elbowKey] = elbowCounter + 1; }
          else { visibilityStatesRef.current[elbowKey] = 'visible'; visibilityCountersRef.current[elbowKey] = 0; elbowState = 'visible'; }
        } else { visibilityCountersRef.current[elbowKey] = 0; }
      }

      // --- Krok 2: Forearm ---
      const foreArmJoint = getCachedJoint(foreArmName);
      if (foreArmJoint && foreArmJoint.parent) {
        let targetLocalForeArm: THREE.Quaternion;
        if (elbowState === 'hidden') {
          // Przedrami\u0119 wyprostowane wzgl\u0119dem ramienia (lokalny T-pose)
          targetLocalForeArm = restPosesCacheRef.current[foreArmName] || new THREE.Quaternion();
        } else {
          const handMarks = marks && marks.length > 0 ? marks[0] : undefined;
          const liveQuat = processForearmHybrid(pose, category === 'Left' ? 'forearm_left' : 'forearm_right', handMarks);
          const tPoseQuat = new THREE.Quaternion().setFromRotationMatrix(foreArmTpose);
          const foreArmTargetWorld = liveQuat.clone().multiply(tPoseQuat.invert()).multiply(worldRestPosesCacheRef.current[foreArmName] || fallbackRestPose);
          
          foreArmJoint.parent.updateWorldMatrix(true, false);
          foreArmJoint.parent.getWorldQuaternion(scratchWorldQuat);
          targetLocalForeArm = scratchWorldQuat.clone().invert().multiply(foreArmTargetWorld);
        }
        foreArmJoint.quaternion.slerp(targetLocalForeArm, 0.2);
      }

      // --- Krok 3: Widoczność dłoni ---
      const hasHandMarks = marks && marks.length > 0;
      const wristVis = pose.landmarks[0][wristIdx]?.visibility ?? 1.0;
      const handKey = handName;
      let handState = visibilityStatesRef.current[handKey] || 'visible';
      let handCounter = visibilityCountersRef.current[handKey] || 0;
      const handVisible = elbowState === 'visible' && wristVis >= VISIBILITY_THRESHOLD && hasHandMarks;

      if (handState === 'visible') {
        if (!handVisible) {
          if (handCounter < HYSTERESIS_THRESHOLD) { visibilityCountersRef.current[handKey] = handCounter + 1; }
          else { visibilityStatesRef.current[handKey] = 'hidden'; visibilityCountersRef.current[handKey] = 0; handState = 'hidden'; }
        } else { visibilityCountersRef.current[handKey] = 0; }
      } else {
        if (handVisible) {
          if (handCounter < HYSTERESIS_THRESHOLD) { visibilityCountersRef.current[handKey] = handCounter + 1; }
          else { visibilityStatesRef.current[handKey] = 'visible'; visibilityCountersRef.current[handKey] = 0; handState = 'visible'; }
        } else { visibilityCountersRef.current[handKey] = 0; }
      }

      // --- Krok 4: Hand root + palce ---
      const handRoot = getCachedJoint(handName);
      if (!handRoot || !handRoot.parent) return;

      // T-Pose dłoni (wynika z anatomii modelu: kciuk ±Z, palce ±X, grzbiet +Y)
      const tPoseHand = category === 'Left'
        ? new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(
            new THREE.Vector3(0,0,1), new THREE.Vector3(1,0,0), new THREE.Vector3(0,1,0)))
        : new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(
            new THREE.Vector3(0,0,-1), new THREE.Vector3(-1,0,0), new THREE.Vector3(0,1,0)));

      let targetLocalHand: THREE.Quaternion;
      if (handState === 'hidden') {
        // D\u0142o\u0144 wyprostowana wzgl\u0119dem przedramienia (lokalny T-pose)
        targetLocalHand = restPosesCacheRef.current[handName] || new THREE.Quaternion();
      } else {
        if (!marks || marks.length === 0) return; // Zabezpieczenie przed b\u0142\u0119dem marks[0] podczas trwania histerezy (freeze)
        const liveHand = processHandRoot(marks![0], category === 'Left');
        const handTargetWorld = liveHand.clone().multiply(tPoseHand.clone().invert()).multiply(worldRestPosesCacheRef.current[handName] || fallbackRestPose);
        
        handRoot.parent.updateWorldMatrix(true, false);
        handRoot.parent.getWorldQuaternion(scratchWorldQuat);
        targetLocalHand = scratchWorldQuat.clone().invert().multiply(handTargetWorld);
      }
      handRoot.quaternion.slerp(targetLocalHand, 0.3);

      // Palce: local rest pose gdy hidden, pe\u0142na animacja gdy visible
      const hasPalce = marks && marks.length > 0;
      for (const pair of fingerPairs) {
        const joint = getCachedJoint(pair.name);
        if (!joint || !joint.parent) continue;

        if (handState === 'hidden') {
          // Powr\u00f3t palc\u00f3w do lokalnej pozycji T-pose
          scratchLocalQuat.copy(restPosesCacheRef.current[pair.name] || new THREE.Quaternion());
        } else {
          const fingerWorldQuat = processHandJoint(marks![0], pair.pStart, pair.pEnd);
          if (!fingerWorldQuat) continue;
          const deltaFinger = fingerWorldQuat.clone().multiply(tPoseHand.clone().invert());
          const targetWorldF = deltaFinger.multiply(worldRestPosesCacheRef.current[pair.name] || fallbackRestPose);
          joint.parent.updateWorldMatrix(true, false);
          joint.parent.getWorldQuaternion(scratchWorldQuat);
          scratchLocalQuat.copy(scratchWorldQuat).invert().multiply(targetWorldF);
        }
        joint.quaternion.slerp(scratchLocalQuat, 0.4);
      }
    });


    sceneRef.current.renderer.render(sceneRef.current.scene, sceneRef.current.camera);

    perfTracker.markThreeFrame();
    animationIdRef.current = requestAnimationFrame(animate);
  }, [poseRef]);

  const handleResize = useCallback(() => {
    if (!sceneRef.current || !mountRef.current) return;

    const rect = mountRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    sceneRef.current.camera.aspect = width / height;
    sceneRef.current.camera.updateProjectionMatrix();
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
      if (animationIdRef.current) {
        if (typeof animationIdRef.current === "number") {
          cancelAnimationFrame(animationIdRef.current);
        }
      }
      if (sceneRef.current) {
        if (sceneRef.current.renderer.domElement.parentNode) {
          sceneRef.current.renderer.domElement.parentNode.removeChild(
            sceneRef.current.renderer.domElement
          );
        }
        sceneRef.current.renderer.dispose();
        sceneRef.current = null;
      }
    };
  }, [initScene, handleResize]);

  useEffect(() => {
    if (modelPath && sceneRef.current) {
      loadModel(modelPath);
    }
  }, [modelPath, loadModel]);

  useEffect(() => {
    if (sceneRef.current) {
      animate();
    }
    return () => {
      if (animationIdRef.current) {
        if (typeof animationIdRef.current === "number") {
          cancelAnimationFrame(animationIdRef.current);
        }
      }
    };
  }, [animate]);

  return {
    mountRef,
    isLoading,
    error,
    model,
    sceneRef: sceneRef.current
  };
}