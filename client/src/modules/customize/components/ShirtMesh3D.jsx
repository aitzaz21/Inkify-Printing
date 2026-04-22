import { useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { createShirtGeometry, CHEST_BOUNDS_3D } from '../utils/shirtShapes';

const lerp = (a, b, t) => a + (b - a) * t;

const printW  = CHEST_BOUNDS_3D.maxX - CHEST_BOUNDS_3D.minX;
const printH  = CHEST_BOUNDS_3D.maxY - CHEST_BOUNDS_3D.minY;
const printCX = (CHEST_BOUNDS_3D.minX + CHEST_BOUNDS_3D.maxX) / 2;
const printCY = (CHEST_BOUNDS_3D.minY + CHEST_BOUNDS_3D.maxY) / 2;

const PRINT_BORDER = [
  [CHEST_BOUNDS_3D.minX, CHEST_BOUNDS_3D.minY, 0.048],
  [CHEST_BOUNDS_3D.maxX, CHEST_BOUNDS_3D.minY, 0.048],
  [CHEST_BOUNDS_3D.maxX, CHEST_BOUNDS_3D.maxY, 0.048],
  [CHEST_BOUNDS_3D.minX, CHEST_BOUNDS_3D.maxY, 0.048],
  [CHEST_BOUNDS_3D.minX, CHEST_BOUNDS_3D.minY, 0.048],
];

export function ShirtMesh3D({
  typeId,
  color,
  designImage,
  designX     = 0.5,
  designY     = 0.55,
  designScale = 1.0,
  designRot   = 0,
  showPrintArea = false,
}) {
  const shirtRef    = useRef();
  const designRef   = useRef();
  const materialRef = useRef();
  const [designTex, setDesignTex] = useState(null);
  const [targetOpacity, setTargetOpacity] = useState(1);
  const opacityRef = useRef(1);

  const geometry = useMemo(() => createShirtGeometry(typeId), [typeId]);
  useEffect(() => () => geometry?.dispose(), [geometry]);

  const shirtMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    roughness: 0.82,
    metalness: 0.0,
    side: THREE.FrontSide,
  }), []);

  useEffect(() => { shirtMaterial.color.set(color); }, [color, shirtMaterial]);
  useEffect(() => () => shirtMaterial?.dispose(), [shirtMaterial]);

  useEffect(() => {
    if (!designImage) { setDesignTex(null); return; }
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';
    loader.load(
      designImage,
      (tex) => { tex.colorSpace = THREE.SRGBColorSpace; setDesignTex(tex); },
      undefined,
      () => setDesignTex(null),
    );
  }, [designImage]);

  useEffect(() => () => designTex?.dispose(), [designTex]);

  useEffect(() => {
    setTargetOpacity(0);
    const t = setTimeout(() => setTargetOpacity(1), 150);
    return () => clearTimeout(t);
  }, [typeId]);

  useFrame((_, delta) => {
    if (!shirtRef.current) return;
    opacityRef.current = lerp(opacityRef.current, targetOpacity, Math.min(1, delta * 8));
    shirtRef.current.material.opacity = opacityRef.current;
    shirtRef.current.material.transparent = opacityRef.current < 1;
  });

  const px = lerp(CHEST_BOUNDS_3D.minX, CHEST_BOUNDS_3D.maxX, designX);
  const py = lerp(CHEST_BOUNDS_3D.minY, CHEST_BOUNDS_3D.maxY, designY);
  const pz = 0.047;
  const BASE_DESIGN_SIZE = 0.68;

  return (
    <group>
      <mesh ref={shirtRef} geometry={geometry} material={shirtMaterial} castShadow receiveShadow />

      {/* Print area indicator */}
      {showPrintArea && (
        <>
          <mesh position={[printCX, printCY, 0.046]}>
            <planeGeometry args={[printW, printH]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.05} depthWrite={false} />
          </mesh>
          <Line
            points={PRINT_BORDER}
            color="#8B5A3C"
            lineWidth={1.5}
            dashed
            dashSize={0.045}
            gapSize={0.025}
          />
          {/* Corner crosshairs */}
          <Line
            points={[
              [printCX - 0.02, printCY, 0.048],
              [printCX + 0.02, printCY, 0.048],
            ]}
            color="rgba(139,90,60,0.5)"
            lineWidth={0.8}
          />
          <Line
            points={[
              [printCX, printCY - 0.02, 0.048],
              [printCX, printCY + 0.02, 0.048],
            ]}
            color="rgba(139,90,60,0.5)"
            lineWidth={0.8}
          />
        </>
      )}

      {designTex && (
        <mesh
          ref={designRef}
          position={[px, py, pz]}
          rotation={[0, 0, (designRot * Math.PI) / 180]}
          scale={[designScale * BASE_DESIGN_SIZE, designScale * BASE_DESIGN_SIZE, 1]}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            ref={materialRef}
            map={designTex}
            transparent
            alphaTest={0.04}
            depthWrite={false}
            side={THREE.FrontSide}
          />
        </mesh>
      )}
    </group>
  );
}
