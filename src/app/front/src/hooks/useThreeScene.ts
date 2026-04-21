import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { ModelViewerRef, ModelLoadResult } from '@/types';
import type { PoseDetectionResult } from '@/types';
import { processAnimateJoint, processHandJoint, getHipsTranslationAndRotation } from '@/lib/animate';
import { ANIM_JOINTS_CONFIG, LIMB_CONFIGS, FINGER_PAIRS_LEFT, FINGER_PAIRS_RIGHT } from '@/lib/animate/boneConfig';

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
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<ModelLoadResult | null>(null);;

  const initScene = useCallback(() => {
    if (!mountRef.current || sceneRef.current) return;

    const rect = mountRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9c9ca5)

    const camera = new THREE.PerspectiveCamera(45, width/height, 0.1, 2000);
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

      model.traverse((child: any) => {
        if (child.isMesh && !child.isSkinnedMesh) {
          child.visible = false;
        }
        if (child.isBone) {
          restPosesCacheRef.current[child.name] = child.quaternion.clone();
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

    const scratchWorldQuat = new THREE.Quaternion();
    const scratchLocalQuat = new THREE.Quaternion();
    const fallbackRestPose = new THREE.Quaternion();

    const getCachedJoint = (name: string) => {
      if (jointsCacheRef.current[name] === undefined) {
        jointsCacheRef.current[name] = sceneRef.current!.scene.getObjectByName(name) || null;
      }
      return jointsCacheRef.current[name];
    };

    if (pose && pose.worldLandmarks && pose.worldLandmarks.length > 0) {
      
      // Wyłączamy bezpośrednie modyfikowanie pozycji miednicy (T-pose anchor)
      // aby zapobiec unoszeniu modelu do góry nogami przez root motion.
      // Model pozostaje centralnie, a kończyny śledzą użytkownika.

      for (const {name, process} of LIMB_CONFIGS) {
          const joint = getCachedJoint(name);
          if(joint && joint.parent) {
              const animData = processAnimateJoint(pose, process);
              joint.parent.updateWorldMatrix(true, false);
              
              const restPose = restPosesCacheRef.current[name] || fallbackRestPose;
              joint.parent.getWorldQuaternion(scratchWorldQuat);
              
              scratchLocalQuat.copy(scratchWorldQuat).invert().multiply(animData).multiply(restPose);
              joint.quaternion.copy(scratchLocalQuat);
          }
      }

      if (pose.leftHandWorldLandmarks && pose.leftHandWorldLandmarks.length > 0) {
          const handMarks = pose.leftHandWorldLandmarks[0];
          for (const {name, pStart, pEnd} of FINGER_PAIRS_LEFT) {
              const joint = getCachedJoint(name);
              if(joint && joint.parent) {
                  const animData = processHandJoint(handMarks, pStart, pEnd);
                  joint.parent.updateWorldMatrix(true, false);
                  
                  const restPose = restPosesCacheRef.current[name] || fallbackRestPose;
                  joint.parent.getWorldQuaternion(scratchWorldQuat);
                  
                  scratchLocalQuat.copy(scratchWorldQuat).invert().multiply(animData).multiply(restPose);
                  joint.quaternion.copy(scratchLocalQuat);
              }
          }
      }

      if (pose.rightHandWorldLandmarks && pose.rightHandWorldLandmarks.length > 0) {
          const handMarks = pose.rightHandWorldLandmarks[0];
          for (const {name, pStart, pEnd} of FINGER_PAIRS_RIGHT) {
              const joint = getCachedJoint(name);
              if(joint && joint.parent) {
                  const animData = processHandJoint(handMarks, pStart, pEnd);
                  joint.parent.updateWorldMatrix(true, false);
                  
                  const restPose = restPosesCacheRef.current[name] || fallbackRestPose;
                  joint.parent.getWorldQuaternion(scratchWorldQuat);
                  
                  scratchLocalQuat.copy(scratchWorldQuat).invert().multiply(animData).multiply(restPose);
                  joint.quaternion.copy(scratchLocalQuat);
              }
          }
      }
    }

    sceneRef.current.renderer.render(sceneRef.current.scene, sceneRef.current.camera);

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