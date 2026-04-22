import { Suspense } from 'react';
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
  showPrintArea = false,
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 3.6], fov: 42 }}
      dpr={[1, 2]}
      shadows
      gl={{ preserveDrawingBuffer: true, antialias: true }}
      style={{ background: 'transparent' }}
    >
      <color attach="background" args={['#0d0d0d']} />

      <ambientLight intensity={0.6} />
      <directionalLight
        position={[3, 5, 3]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-3, 2, 2]} intensity={0.4} color="#ffffff" />
      <pointLight position={[0, -2, 3]} intensity={0.2} color="#b0b0ff" />
      <pointLight position={[0, 3, -2]} intensity={0.15} color="#ffffff" />

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
          showPrintArea={showPrintArea}
        />

        <ContactShadows
          position={[0, -1.45, 0]}
          opacity={0.4}
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
        autoRotate={false}
        makeDefault
      />
    </Canvas>
  );
}
