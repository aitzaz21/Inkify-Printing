import { useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { createShirtGeometry, CHEST_BOUNDS_3D } from '../utils/shirtShapes';

// Lerp helper
const lerp = (a, b, t) => a + (b - a) * t;

export function ShirtMesh3D({
  typeId,
  color,
  designImage,
  designX     = 0.5,   // 0 = left, 1 = right
  designY     = 0.6,   // 0 = bottom, 1 = top of chest area
  designScale = 1.0,   // multiplier on base size
  designRot   = 0,     // degrees
}) {
  const shirtRef      = useRef();
  const designRef     = useRef();
  const materialRef   = useRef();
  const [designTex, setDesignTex] = useState(null);
  const [targetOpacity, setTargetOpacity] = useState(1);
  const opacityRef = useRef(1);

  // ── Geometry (recreated only when shirt type changes) ──────
  const geometry = useMemo(() => createShirtGeometry(typeId), [typeId]);

  useEffect(() => {
    return () => { geometry?.dispose(); };
  }, [geometry]);

  // ── Shirt material ─────────────────────────────────────────
  const shirtMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    roughness: 0.82,
    metalness: 0.0,
    side: THREE.FrontSide,
  }), []);

  // Update color directly on material (no re-render needed)
  useEffect(() => {
    shirtMaterial.color.set(color);
  }, [color, shirtMaterial]);

  // Dispose on unmount
  useEffect(() => {
    return () => { shirtMaterial?.dispose(); };
  }, [shirtMaterial]);

  // ── Load design texture ────────────────────────────────────
  useEffect(() => {
    if (!designImage) { setDesignTex(null); return; }

    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';

    loader.load(
      designImage,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        // Preserve aspect ratio in UV — handled by plane scale below
        setDesignTex(tex);
      },
      undefined,
      () => setDesignTex(null),
    );

    return () => {
      // No cleanup needed; React will replace with new load on next effect
    };
  }, [designImage]);

  // Dispose design texture when it changes
  useEffect(() => {
    return () => { designTex?.dispose(); };
  }, [designTex]);

  // ── Fade animation on type change ─────────────────────────
  useEffect(() => {
    // Quick fade-out then fade-in when type switches
    setTargetOpacity(0);
    const t = setTimeout(() => setTargetOpacity(1), 150);
    return () => clearTimeout(t);
  }, [typeId]);

  useFrame((_, delta) => {
    if (!shirtRef.current) return;
    const speed = 8;
    opacityRef.current = lerp(opacityRef.current, targetOpacity, Math.min(1, delta * speed));
    shirtRef.current.material.opacity = opacityRef.current;
    shirtRef.current.material.transparent = opacityRef.current < 1;
  });

  // ── Compute design plane 3D position from normalised coords ─
  const px = lerp(CHEST_BOUNDS_3D.minX, CHEST_BOUNDS_3D.maxX, designX);
  const py = lerp(CHEST_BOUNDS_3D.minY, CHEST_BOUNDS_3D.maxY, designY);
  // ExtrudeGeometry depth=0.07, centered → front face at z≈+0.035; add 0.01 to avoid z-fighting
  const pz = 0.045;

  // Base design plane size (in 3D units) — scale applied via mesh.scale
  const BASE_DESIGN_SIZE = 0.68;

  return (
    <group>
      {/* Shirt body */}
      <mesh
        ref={shirtRef}
        geometry={geometry}
        material={shirtMaterial}
        castShadow
        receiveShadow
      />

      {/* Design overlay — only rendered when an image is loaded */}
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
