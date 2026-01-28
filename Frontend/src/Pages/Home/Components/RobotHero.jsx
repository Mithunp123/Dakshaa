import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, createPortal } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, Float, Sparkles, useAnimations, Text } from '@react-three/drei';
import * as THREE from 'three';

// Preload model immediately
useGLTF.preload('/models/robot_playground.glb');

const CyrusNametag = ({ bone }) => {
  if (!bone) return null;
  return createPortal(
    <group position={[0, 0, 0]}>
      {/* The Text - removed white debug box */}
      <Text
        position={[0, 0.2, 0.32]}
        rotation={[Math.PI / 2, Math.PI, 0]}
        fontSize={0.2}
        color="#f97316" // Orange text
        anchorX="center"
        anchorY="middle"
        characters="Cyrus"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        CYRUS
      </Text>
    </group>,
    bone
  );
};

function Model(props) {
  const { scene, animations } = useGLTF('/models/robot_optimized.glb');
  const group = useRef();
  const { actions, names } = useAnimations(animations, group);
  const rightArmRef = useRef();
  const rightHandRef = useRef();
  const chestRef = useRef();
  const [chestBone, setChestBone] = useState(null);

  // Handle Animations
  useEffect(() => {
    // Force Robot Material Colors to Palette (removing any other colors)
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        // Handle array of materials or single material
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => {
          if (material.color) {
            material.color.set('white');
          }
        });

        // Optional: Increase metalness/smoothness for a more "Cyber" look
        // child.material.metalness = 0.7; 
        // child.material.roughness = 0.3;
      }
    });

    if (names.length > 0) {
      const actionName = names.find(n => n.toLowerCase().includes('wave')) || names.find(n => n.toLowerCase().includes('idle')) || names[0];
      if (actions[actionName]) {
        actions[actionName].reset().fadeIn(0.5).play();
      }
    }
  }, [actions, names]);

  // Find bones on mount
  useEffect(() => {
    scene.traverse((obj) => {
      if (obj.isBone) {
        const name = obj.name.toLowerCase();

        // Find Chest/Spine for Nametag
        if (!chestRef.current && (name.includes('chest') || name.includes('spine') || name.includes('torso'))) {
          // Prefer Chest 
          if (name.includes('chest')) chestRef.current = obj;
          // Fallback to spine if no chest yet
          else if (!chestRef.current) chestRef.current = obj;
        }

        // Try to find Right arm/hand first, fallback to Left if needed
        if ((name.includes('shoulder') || name.includes('arm')) && (name.includes('r') || name.includes('right'))) {
          // Store reference for animation, prioritize Right
          if (!rightArmRef.current) rightArmRef.current = obj;
        }
        if ((name.includes('wrist') || name.includes('hand')) && (name.includes('r') || name.includes('right'))) {
          if (!rightHandRef.current) rightHandRef.current = obj;
        }
      }
    });

    // Fallbacks if Right side not found
    if (!rightArmRef.current || !rightHandRef.current) {
      scene.traverse((obj) => {
        if (obj.isBone) {
          const name = obj.name.toLowerCase();
          if (!rightArmRef.current && (name.includes('shoulder') || name.includes('arm')) && name.includes('l')) {
            rightArmRef.current = obj;
          }
          if (!rightHandRef.current && (name.includes('wrist') || name.includes('hand')) && name.includes('l')) {
            rightHandRef.current = obj;
          }
        }
      });
    }

    if (chestRef.current) {
      setChestBone(chestRef.current);
    }
  }, [scene]);

  useFrame((state, delta) => {
    // 1. Waving Animation
    if (names.length === 0 && rightArmRef.current) {
      rightArmRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 3) * 0.3 + 0.5;
      rightArmRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <group ref={group} {...props}>
      <primitive object={scene} />
      <CyrusNametag bone={chestBone} />
    </group>
  );
}



const RobotHero = () => {
  const [loadError, setLoadError] = useState(false);

  // Detect mobile device
  const isMobile = /iPhone|iPad|iPod|Android|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  useEffect(() => {
    // Handle WebGL context loss
    const handleContextLost = (event) => {
      event.preventDefault();
      console.warn('WebGL context lost. Reloading...');
      setLoadError(true);
    };

    const handleContextRestored = () => {
      console.log('WebGL context restored');
      setLoadError(false);
    };

    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('webglcontextlost', handleContextLost);
      canvas.addEventListener('webglcontextrestored', handleContextRestored);
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('webglcontextlost', handleContextLost);
        canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      }
    };
  }, []);

  if (loadError) {
    return (
      <div className="w-full h-[280px] xs:h-[320px] sm:h-[400px] md:h-[500px] lg:h-[600px] relative z-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">3D view temporarily unavailable</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-[280px] xs:h-[320px] sm:h-[400px] md:h-[500px] lg:h-[600px] relative z-20 ${!isMobile ? 'cursor-grab active:cursor-grabbing' : ''}`}>
      <Canvas
        camera={{ position: [0, 2, 10], fov: 35 }}
        gl={{ 
          alpha: true, 
          antialias: true, 
          powerPreference: 'high-performance',
          preserveDrawingBuffer: false,
          failIfMajorPerformanceCaveat: false
        }}
        dpr={[1, Math.min(window.devicePixelRatio, 2)]}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0); // Transparent background
        }}
        onError={(error) => {
          console.error('Canvas error:', error);
          setLoadError(true);
        }}
      >
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} color="cyan" />
        <pointLight position={[-10, -10, -10]} intensity={2} color="#f97316" />

        <Float
          speed={2}
          rotationIntensity={0.5}
          floatIntensity={1}
          floatingRange={[-0.2, 0.2]}
        >
          <Model scale={1.5} position={[0, -1.0, 0]} rotation={[0, -0.5, 0]} />
        </Float>

        <Sparkles count={80} scale={8} size={4} speed={0.4} opacity={0.6} color="#0ea5e9" />

        <OrbitControls
          enableZoom={false}
          autoRotate
          autoRotateSpeed={0.8}
          maxPolarAngle={Math.PI / 1.5}
          minPolarAngle={Math.PI / 3}
          // Disable all touch controls on mobile to allow page scrolling
          enabled={!isMobile}
          enablePan={!isMobile}
          enableRotate={!isMobile}
          // On mobile, only auto-rotate is active
        />
        <Environment preset="night" />
      </Canvas>
    </div>
  );
};

export default RobotHero;
