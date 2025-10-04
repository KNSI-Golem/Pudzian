'use client';

import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { useRef } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export const ModelViewer = ({ isVisible }) => {
    return (
        <Canvas style={{ height: '480px', width: '640px' }}>
            {isVisible ? <EthereumModel /> : null}
        </Canvas>
    );
};

export const EthereumModel = () => {
    const myModel = useLoader(GLTFLoader, '/turtle.glb');
    const modelRef = useRef(null);

    useFrame((_state, delta) => {
        if (modelRef.current) {
            modelRef.current.rotation.y += delta / 2;
        }
    });

    return (
        <>
            <pointLight position={[-10, -10, -10]} color="#48cc90" intensity={5000} />
            <pointLight position={[10, 10, 10]} color="#36e2e2" intensity={5000} />
            <primitive
                object={myModel.scene}
                ref={modelRef}
                scale={[3, 3, 3]}
            />
        </>
    );
};