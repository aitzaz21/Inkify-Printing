import { useRef, useEffect, useCallback } from 'react';

/**
 * Transparent HTML overlay that sits on top of the 3D canvas.
 * Lets the user drag the design to any position inside the shirt's chest zone.
 *
 * Design zone percentages are calibrated to match where the shirt's chest
 * sits within the rendered canvas (given camera fov=42, z=3.6, shirt size ~2.2x2.3u).
 */

// Chest zone as fraction of container dimensions
const ZONE = { left: 0.20, top: 0.28, right: 0.80, bottom: 0.70 };

export function DesignDragOverlay({
  designImage,
  designX,
  designY,
  designScale,
  designRot,
  onPositionChange,
  orbitRef,
}) {
  const containerRef = useRef(null);
  const isDragging   = useRef(false);

  const disableOrbit = () => { if (orbitRef?.current) orbitRef.current.enabled = false; };
  const enableOrbit  = () => { if (orbitRef?.current) orbitRef.current.enabled = true; };

  // Compute screen-space position from normalised (designX, designY)
  const zoneW  = ZONE.right  - ZONE.left;
  const zoneH  = ZONE.bottom - ZONE.top;
  const leftPct = ((ZONE.left + designX * zoneW)       * 100).toFixed(2) + '%';
  const topPct  = ((ZONE.top  + (1 - designY) * zoneH) * 100).toFixed(2) + '%';

  const handleMove = useCallback((clientX, clientY) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = (clientX - rect.left)  / rect.width;
    const ny = (clientY - rect.top)   / rect.height;

    const x = Math.max(0, Math.min(1, (nx - ZONE.left) / zoneW));
    const y = Math.max(0, Math.min(1, 1 - (ny - ZONE.top)  / zoneH));
    onPositionChange(x, y);
  }, [onPositionChange, zoneW, zoneH]);

  const handleUp = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false;
      enableOrbit();
    }
  }, []);

  useEffect(() => {
    const onMove = (e) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e) => {
      if (!isDragging.current) return;
      e.preventDefault();
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   handleUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend',  handleUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   handleUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend',  handleUp);
    };
  }, [handleMove, handleUp]);

  if (!designImage) return null;

  const designSizePx = Math.round(76 * designScale);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute', inset: 0,
        pointerEvents: 'none',
        zIndex: 10,
        userSelect: 'none',
      }}
    >
      {/* Chest zone boundary — subtle dashed guide */}
      <div style={{
        position:    'absolute',
        left:        `${ZONE.left  * 100}%`,
        top:         `${ZONE.top   * 100}%`,
        width:       `${zoneW      * 100}%`,
        height:      `${zoneH      * 100}%`,
        border:      '1.5px dashed rgba(139,90,60,0.35)',
        borderRadius: '10px',
        pointerEvents: 'none',
      }} />

      {/* Draggable design handle */}
      <div
        style={{
          position:  'absolute',
          left:      leftPct,
          top:       topPct,
          transform: `translate(-50%, -50%) rotate(${designRot}deg)`,
          width:     designSizePx,
          height:    designSizePx,
          cursor:    isDragging.current ? 'grabbing' : 'grab',
          pointerEvents: 'auto',
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          isDragging.current = true;
          disableOrbit();
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          isDragging.current = true;
          disableOrbit();
        }}
      >
        {/* Design preview */}
        <img
          src={designImage}
          alt="Design"
          draggable={false}
          style={{
            width: '100%', height: '100%',
            objectFit: 'contain',
            opacity: 0.82,
            pointerEvents: 'none',
          }}
        />
        {/* Dashed selection border */}
        <div style={{
          position:    'absolute', inset: -3,
          border:      '2px dashed rgba(139,90,60,0.75)',
          borderRadius: 6,
          pointerEvents: 'none',
        }} />
        {/* Move cursor icon */}
        <div style={{
          position: 'absolute', top: -12, left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 11, color: 'rgba(255,255,255,0.55)',
          letterSpacing: '0.05em',
          pointerEvents: 'none',
        }}>
          ✦ drag
        </div>
      </div>
    </div>
  );
}
