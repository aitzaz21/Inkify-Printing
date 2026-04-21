import { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { ShirtMesh3D } from './ShirtMesh3D';

function FallbackMesh() {
  return (
    <mesh>
      <boxGeometry args={[0.6, 0.8, 0.08]} />
      <meshStandardMaterial color="#6B4226" opacity={0.4} transparent />
    </mesh>
  );
}

export function ShirtViewer3D({
  typeId,
  color,
  designImage,
  designX,
  designY,
  designScale,
  designRot,
  orbitRef,
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 3.6], fov: 42 }}
      dpr={[1, 2]}
      shadows
      // preserveDrawingBuffer lets us take a snapshot for order preview
      gl={{ preserveDrawingBuffer: true, antialias: true }}
      style={{ background: 'transparent' }}
    >
      {/* Scene background */}
      <color attach="background" args={['#0d0d0d']} />

      {/* Lighting */}
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[3, 5, 3]}
        intensity={1.3}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-3, 2, 2]} intensity={0.35} color="#ffffff" />
      <pointLight position={[0, -2, 3]} intensity={0.15} color="#b0b0ff" />

      <Suspense fallback={<FallbackMesh />}>
        <Environment preset="studio" />

        <ShirtMesh3D
          typeId={typeId}
          color={color}
          designImage={designImage}
          designX={designX}
          designY={designY}
          designScale={designScale}
          designRot={designRot}
        />

        {/* Ground shadow to give depth without a visible plane */}
        <ContactShadows
          position={[0, -1.45, 0]}
          opacity={0.38}
          scale={5}
          blur={2.8}
          far={1.6}
        />
      </Suspense>

      <OrbitControls
        ref={orbitRef}
        enablePan={false}
        enableZoom
        minDistance={2.2}
        maxDistance={6}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.78}
        autoRotate
        autoRotateSpeed={0.4}
        makeDefault
      />
    </Canvas>
  );
}
