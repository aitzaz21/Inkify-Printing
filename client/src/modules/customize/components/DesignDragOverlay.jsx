import { useRef, useEffect, useCallback } from 'react';

// Chest zone as fraction of container dimensions — calibrated for camera fov=42, z=3.6
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

  const zoneW = ZONE.right  - ZONE.left;
  const zoneH = ZONE.bottom - ZONE.top;

  const disableOrbit = () => { if (orbitRef?.current) orbitRef.current.enabled = false; };
  const enableOrbit  = () => { if (orbitRef?.current) orbitRef.current.enabled = true; };

  const leftPct = ((ZONE.left + designX * zoneW)       * 100).toFixed(2) + '%';
  const topPct  = ((ZONE.top  + (1 - designY) * zoneH) * 100).toFixed(2) + '%';

  const handleMove = useCallback((clientX, clientY) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = (clientX - rect.left)  / rect.width;
    const ny = (clientY - rect.top)   / rect.height;
    const x = Math.max(0, Math.min(1, (nx - ZONE.left) / zoneW));
    const y = Math.max(0, Math.min(1, 1 - (ny - ZONE.top) / zoneH));
    onPositionChange(x, y);
  }, [onPositionChange, zoneW, zoneH]);

  const handleUp = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false;
      enableOrbit();
    }
  }, []);

  useEffect(() => {
    const onMove      = (e) => handleMove(e.clientX, e.clientY);
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

  const handleSize = Math.max(48, Math.round(72 * designScale));

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10, userSelect: 'none' }}
    >
      {/* Invisible drag zone — matches approximate design position in 3D */}
      <div
        style={{
          position:      'absolute',
          left:          leftPct,
          top:           topPct,
          transform:     `translate(-50%, -50%) rotate(${designRot}deg)`,
          width:         handleSize,
          height:        handleSize,
          cursor:        'grab',
          pointerEvents: 'auto',
          touchAction:   'none',
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
        {/* Dashed border indicates draggable region — design itself is rendered in 3D */}
        <div style={{
          position:      'absolute',
          inset:         0,
          border:        '1.5px dashed rgba(139,90,60,0.65)',
          borderRadius:  6,
          pointerEvents: 'none',
          boxShadow:     '0 0 8px rgba(107,66,38,0.2)',
        }} />
        {/* Corner handles */}
        {[
          { top: -3, left: -3 }, { top: -3, right: -3 },
          { bottom: -3, left: -3 }, { bottom: -3, right: -3 },
        ].map((pos, i) => (
          <div key={i} style={{
            position:      'absolute',
            width:         7, height: 7,
            background:    'rgba(139,90,60,0.9)',
            borderRadius:  2,
            pointerEvents: 'none',
            ...pos,
          }} />
        ))}
        {/* Grab icon */}
        <div style={{
          position:       'absolute',
          top:            '50%',
          left:           '50%',
          transform:      'translate(-50%, -50%)',
          fontSize:        10,
          color:          'rgba(201,150,122,0.85)',
          background:     'rgba(0,0,0,0.45)',
          borderRadius:    4,
          padding:         '2px 6px',
          pointerEvents:  'none',
          whiteSpace:     'nowrap',
          letterSpacing:  '0.04em',
          backdropFilter: 'blur(4px)',
        }}>
          ✦ drag
        </div>
      </div>
    </div>
  );
}
