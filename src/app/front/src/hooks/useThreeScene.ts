import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { ModelViewerRef, ModelLoadResult } from '@/types';

export interface UseThreeSceneOptions {
  modelPath?: string;
  enableControls?: boolean;
  autoRotate?: boolean;
  backgroundColor?: string;
}

export function useThreeScene(options: UseThreeSceneOptions = {}) {
  const {
    modelPath,
    enableControls = true,
    autoRotate = false,
    backgroundColor = '#3a3a46'
  } = options;

  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ModelViewerRef | null>(null);
  const animationIdRef = useRef<number | undefined>(undefined);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<ModelLoadResult | null>(null);

  // Initialize scene
  const initScene = useCallback(() => {
    if (!mountRef.current || sceneRef.current) return;

    const rect = mountRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 1, 3);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.setScalar(1024);
    scene.add(directionalLight);

    // Controls setup
    let controls: OrbitControls | undefined;
    if (enableControls) {
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.autoRotate = false; // Disable auto-rotate to avoid conflicts
      controls.autoRotateSpeed = 0;
    }

    mountRef.current.appendChild(renderer.domElement);

    sceneRef.current = {
      camera,
      scene,
      renderer,
      controls
    };

  }, [backgroundColor, enableControls, autoRotate]);

  // Load GLTF model with fallback cube
  const loadModel = useCallback(async (path: string) => {
    if (!sceneRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      // Clear previous model
      setModel((currentModel) => {
        if (currentModel?.gltf && sceneRef.current) {
          sceneRef.current.scene.remove(currentModel.gltf.scene);
        }
        if (currentModel?.mesh && sceneRef.current) {
          sceneRef.current.scene.remove(currentModel.mesh);
        }
        return null;
      });

      // Try to load GLTF file
      const loader = new GLTFLoader();
      const gltf = await new Promise<any>((resolve, reject) => {
        loader.load(path, resolve, undefined, reject);
      });

      // Add model to scene
      const modelScene = gltf.scene;
      
      // Center and scale the model
      const box = new THREE.Box3().setFromObject(modelScene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 2 / maxDim;
      
      modelScene.position.copy(center).multiplyScalar(-scale);
      modelScene.scale.setScalar(scale);
      
      sceneRef.current.scene.add(modelScene);

      // Setup animations if present
      let mixer: THREE.AnimationMixer | undefined;
      if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(modelScene);
        gltf.animations.forEach((clip: THREE.AnimationClip) => {
          mixer!.clipAction(clip).play();
        });
        sceneRef.current.mixer = mixer;
      }

      setModel({ gltf, mixer });
      setIsLoading(false);

    } catch (err) {
      // If GLTF loading fails, create a fallback cube
      console.warn('GLTF loading failed, creating fallback cube:', err);
      
      try {
        // Create a simple animated cube as fallback
        const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        const material = new THREE.MeshStandardMaterial({ 
          color: 0x4a90e2,
          metalness: 0.2,
          roughness: 0.4
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 0, 0);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        sceneRef.current.scene.add(mesh);
        setModel({ mesh });
        setIsLoading(false);
        setError(null); // Clear error since we have a fallback
        
      } catch (fallbackErr) {
        const errorMessage = fallbackErr instanceof Error ? fallbackErr.message : 'Failed to create fallback model';
        setError(errorMessage);
        setIsLoading(false);
      }
    }
  }, []);

  // Animation loop
  const animate = useCallback(() => {
    if (!sceneRef.current) return;

    const delta = clockRef.current.getDelta();
    
    // Update mixer for GLTF animations
    if (sceneRef.current.mixer) {
      sceneRef.current.mixer.update(delta);
    }

    // Rotate fallback cube if present (when no GLTF animations)
    if (model?.mesh && !sceneRef.current.mixer) {
      model.mesh.rotation.x += delta * 0.5;
      model.mesh.rotation.y += delta * 0.3;
    }

    // Update controls
    if (sceneRef.current.controls) {
      sceneRef.current.controls.update();
    }

    // Render scene
    sceneRef.current.renderer.render(sceneRef.current.scene, sceneRef.current.camera);
    
    animationIdRef.current = requestAnimationFrame(animate);
  }, [model]);

  // Handle resize
  const handleResize = useCallback(() => {
    if (!sceneRef.current || !mountRef.current) return;

    const rect = mountRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    sceneRef.current.camera.aspect = width / height;
    sceneRef.current.camera.updateProjectionMatrix();
    sceneRef.current.renderer.setSize(width, height);
  }, []);

  // Initialize scene on mount
  useEffect(() => {
    initScene();
    
    const resizeObserver = new ResizeObserver(handleResize);
    if (mountRef.current) {
      resizeObserver.observe(mountRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
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

  // Load model when path changes
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
        cancelAnimationFrame(animationIdRef.current);
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