import { useRef, useEffect, useCallback } from 'react';

// Chest zone as fraction of container dimensions
// Calibrated for camera fov=42, z=3.6
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

  // Screen position from normalized coords
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

  const basePx = 80;
  const designSizePx = Math.round(basePx * designScale);

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10, userSelect: 'none' }}
    >
      {/* Print area zone boundary */}
      <div style={{
        position:      'absolute',
        left:          `${ZONE.left  * 100}%`,
        top:           `${ZONE.top   * 100}%`,
        width:         `${zoneW      * 100}%`,
        height:        `${zoneH      * 100}%`,
        border:        '1.5px dashed rgba(139,90,60,0.4)',
        borderRadius:  '8px',
        pointerEvents: 'none',
      }}>
        {/* "Print Area" label */}
        <span style={{
          position:   'absolute',
          top:        -18,
          left:       '50%',
          transform:  'translateX(-50%)',
          fontSize:   10,
          color:      'rgba(139,90,60,0.6)',
          whiteSpace: 'nowrap',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          Print Area
        </span>
      </div>

      {/* Draggable design handle */}
      <div
        style={{
          position:      'absolute',
          left:          leftPct,
          top:           topPct,
          transform:     `translate(-50%, -50%) rotate(${designRot}deg)`,
          width:         designSizePx,
          height:        designSizePx,
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
        {/* Design preview image */}
        <img
          src={designImage}
          alt="Design"
          draggable={false}
          style={{
            width:         '100%',
            height:        '100%',
            objectFit:     'contain',
            opacity:       0.85,
            pointerEvents: 'none',
            display:       'block',
          }}
        />
        {/* Selection border */}
        <div style={{
          position:      'absolute',
          inset:         -4,
          border:        '2px dashed rgba(139,90,60,0.8)',
          borderRadius:  6,
          pointerEvents: 'none',
          boxShadow:     '0 0 12px rgba(107,66,38,0.3)',
        }} />
        {/* Corner handles */}
        {[
          { top: -4, left: -4 }, { top: -4, right: -4 },
          { bottom: -4, left: -4 }, { bottom: -4, right: -4 },
        ].map((pos, i) => (
          <div key={i} style={{
            position:        'absolute',
            width:           8, height: 8,
            background:      '#8B5A3C',
            borderRadius:    2,
            pointerEvents:   'none',
            ...pos,
          }} />
        ))}
        {/* Drag label */}
        <div style={{
          position:      'absolute',
          top:           '50%',
          left:          '50%',
          transform:     'translate(-50%, -50%)',
          fontSize:       9,
          color:         'rgba(255,255,255,0.7)',
          background:    'rgba(0,0,0,0.5)',
          borderRadius:   4,
          padding:        '1px 5px',
          pointerEvents: 'none',
          whiteSpace:    'nowrap',
          letterSpacing: '0.04em',
        }}>
          ✦ drag
        </div>
      </div>
    </div>
  );
}
