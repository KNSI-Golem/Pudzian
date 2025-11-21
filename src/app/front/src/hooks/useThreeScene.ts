import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { ModelViewerRef, ModelLoadResult } from '@/types';

export interface UseThreeSceneOptions {
  modelPath?: string;
}

export function useThreeScene(options: UseThreeSceneOptions = {}) {
  const {
    modelPath,
  } = options;

  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ModelViewerRef | null>(null);
  const animationIdRef = useRef<number | undefined>(undefined);
  
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

    const camera = new THREE.PerspectiveCamera(50, width/height, 0.1, 2000);
    camera.position.set(0, 130, 150);

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
      sceneRef.current.scene.add(model);

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

    sceneRef.current.renderer.render(sceneRef.current.scene, sceneRef.current.camera);
    
    animationIdRef.current = requestAnimationFrame(animate);
  }, []);

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

  // Start animation loop
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