import { useRef, useState, useCallback, useEffect } from 'react';

const VW = 280;
const VH = 360;

// Print area as fraction of SVG viewBox
const PRINT_AREA = {
  front: { x: 0.268, y: 0.308, w: 0.464, h: 0.490 },
  back:  { x: 0.268, y: 0.255, w: 0.464, h: 0.540 },
};

// Base design size in SVG units at scale=1.0
const BASE_SIZE = 82;

// ─── Shirt paths (280×360 viewBox) ───────────────────────────────────────────

const BODY_CREW =
  'M 104,50 C 95,45 79,59 68,67 L 26,84 L 6,126 L 9,163 L 36,168 ' +
  'L 60,152 L 60,316 C 60,323 66,328 72,328 L 208,328 ' +
  'C 214,328 220,323 220,316 L 220,152 L 244,168 L 271,163 ' +
  'L 274,126 L 254,84 L 212,67 C 201,59 185,45 176,50 ' +
  'C 165,61 153,67 140,67 C 127,67 115,61 104,50 Z';

const BODY_VNECK =
  'M 104,50 C 95,45 79,59 68,67 L 26,84 L 6,126 L 9,163 L 36,168 ' +
  'L 60,152 L 60,316 C 60,323 66,328 72,328 L 208,328 ' +
  'C 214,328 220,323 220,316 L 220,152 L 244,168 L 271,163 ' +
  'L 274,126 L 254,84 L 212,67 C 201,59 185,45 176,50 L 140,112 L 104,50 Z';

const COLLAR_CREW =
  'M 104,50 C 115,40 127,34 140,34 C 153,34 165,40 176,50 ' +
  'C 165,61 153,67 140,67 C 127,67 115,61 104,50 Z';

const COLLAR_POLO =
  'M 100,50 C 112,37 126,31 140,31 C 154,31 168,37 180,50 ' +
  'L 178,58 C 166,49 153,45 140,45 C 127,45 114,49 102,58 Z';

const POLO_PLACKET = 'M 130,50 L 130,108 L 150,108 L 150,50 Z';
const POLO_BTNS = [{ cx: 140, cy: 65 }, { cx: 140, cy: 79 }, { cx: 140, cy: 93 }];

// Subtle fold/wrinkle lines inside the shirt body
const FOLD_LINES = [
  'M 90,140 Q 100,160 95,185',
  'M 185,143 Q 178,162 181,188',
  'M 130,220 Q 140,230 133,255',
  'M 150,218 Q 142,232 147,258',
];

function getShirtDef(typeId, side) {
  if (typeId === 'vneck') {
    return side === 'front'
      ? { body: BODY_VNECK, collar: null,       polo: false }
      : { body: BODY_CREW,  collar: COLLAR_CREW, polo: false };
  }
  if (typeId === 'polo') {
    return side === 'front'
      ? { body: BODY_CREW, collar: COLLAR_POLO, polo: true }
      : { body: BODY_CREW, collar: COLLAR_CREW, polo: false };
  }
  return { body: BODY_CREW, collar: COLLAR_CREW, polo: false };
}

function darken(hex, amt) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (n >> 16) + amt);
  const g = Math.max(0, ((n >> 8) & 0xff) + amt);
  const b = Math.max(0, (n & 0xff) + amt);
  return `rgb(${r},${g},${b})`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ShirtViewer2D({
  typeId       = 'plain-tshirt',
  color        = '#FFFFFF',
  side         = 'front',
  designImage  = null,
  designX      = 0.5,
  designY      = 0.5,
  designScale  = 1.0,
  designRot    = 0,
  onDesignMove = null,
  showPrintArea = false,
}) {
  const wrapRef  = useRef(null);
  const dragging = useRef(false);
  const drag0    = useRef({ mx: 0, my: 0, dx: 0, dy: 0 });
  const [dim, setDim] = useState({ w: 380, h: 480 });

  // Track container size
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      setDim({ w: e.contentRect.width, h: e.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Compute display rect (preserving aspect ratio, centered)
  const aspect = VW / VH;
  let sw, sh, ox, oy;
  if (dim.w / dim.h > aspect) {
    sh = dim.h; sw = dim.h * aspect;
    ox = (dim.w - sw) / 2; oy = 0;
  } else {
    sw = dim.w; sh = dim.w / aspect;
    ox = 0; oy = (dim.h - sh) / 2;
  }
  const sf = sw / VW; // px per SVG unit

  // Print area in pixels
  const pa    = PRINT_AREA[side];
  const pLeft = ox + pa.x * VW * sf;
  const pTop  = oy + pa.y * VH * sf;
  const pW    = pa.w * VW * sf;
  const pH    = pa.h * VH * sf;

  // Design center in pixels
  const dLeft = pLeft + designX * pW;
  const dTop  = pTop  + designY * pH;
  const dSize = BASE_SIZE * sf * designScale;

  // Drag
  const startDrag = useCallback((clientX, clientY) => {
    if (!onDesignMove) return;
    dragging.current = true;
    drag0.current = { mx: clientX, my: clientY, dx: designX, dy: designY };
  }, [onDesignMove, designX, designY]);

  const moveDrag = useCallback((clientX, clientY) => {
    if (!dragging.current || !onDesignMove) return;
    const nx = Math.max(0, Math.min(1, drag0.current.dx + (clientX - drag0.current.mx) / pW));
    const ny = Math.max(0, Math.min(1, drag0.current.dy + (clientY - drag0.current.my) / pH));
    onDesignMove(nx, ny);
  }, [onDesignMove, pW, pH]);

  const endDrag = useCallback(() => { dragging.current = false; }, []);

  useEffect(() => {
    const mm = (e) => moveDrag(e.clientX, e.clientY);
    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup', endDrag);
    return () => { window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', endDrag); };
  }, [moveDrag, endDrag]);

  const { body, collar, polo } = getShirtDef(typeId, side);
  const darkCol = darken(color, -32);
  const uid = `sv2-${typeId.replace('-', '')}-${side}`;

  // Determine if shirt is "light" (to adjust shadow opacity)
  const isLight = (() => {
    const n = parseInt(color.replace('#', ''), 16);
    const lum = ((n >> 16) * 0.299 + ((n >> 8) & 0xff) * 0.587 + (n & 0xff) * 0.114);
    return lum > 160;
  })();

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', height: '100%', userSelect: 'none' }}>

      {/* Subtle drop shadow beneath shirt */}
      <div style={{
        position: 'absolute',
        bottom: `${oy + 2}px`,
        left: '50%',
        transform: 'translateX(-50%)',
        width: `${sw * 0.52}px`,
        height: '14px',
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(0,0,0,0.38) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* ── Shirt SVG ─────────────────────────────────────────────────────────── */}
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'absolute', left: ox, top: oy, width: sw, height: sh, display: 'block', zIndex: 1 }}
      >
        <defs>
          {/* Fabric weave texture */}
          <filter id={`${uid}-fab`} x="-2%" y="-2%" width="104%" height="104%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.78 0.52" numOctaves="4" seed="12" result="n"/>
            <feColorMatrix in="n" type="saturate" values="0" result="g"/>
            <feBlend in="SourceGraphic" in2="g" mode="multiply" result="b"/>
            <feComposite in="b" in2="SourceGraphic" operator="in"/>
          </filter>

          {/* Clip to shirt body */}
          <clipPath id={`${uid}-clip`}>
            <path d={body} />
          </clipPath>

          {/* Horizontal shading (darker sides, lighter center) */}
          <linearGradient id={`${uid}-sh`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#000" stopOpacity="0.24"/>
            <stop offset="16%"  stopColor="#000" stopOpacity="0.06"/>
            <stop offset="46%"  stopColor="#fff" stopOpacity="0.07"/>
            <stop offset="54%"  stopColor="#fff" stopOpacity="0.05"/>
            <stop offset="84%"  stopColor="#000" stopOpacity="0.06"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0.22"/>
          </linearGradient>

          {/* Vertical shading (lighter top, darker bottom) */}
          <linearGradient id={`${uid}-sv`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#fff" stopOpacity="0.18"/>
            <stop offset="28%"  stopColor="#fff" stopOpacity="0.03"/>
            <stop offset="75%"  stopColor="#000" stopOpacity="0.04"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0.14"/>
          </linearGradient>

          {/* Sleeve shadow (darker at tips) */}
          <linearGradient id={`${uid}-sl`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"  stopColor="#000" stopOpacity="0.22"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0"/>
          </linearGradient>
          <linearGradient id={`${uid}-sr`} x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%"  stopColor="#000" stopOpacity="0.22"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0"/>
          </linearGradient>
        </defs>

        {/* ── Base color ─────────────────────────────────────────────── */}
        <path d={body} fill={color} />

        {/* ── Fabric texture ─────────────────────────────────────────── */}
        <path d={body} fill={color} opacity="0.14" filter={`url(#${uid}-fab)`} />

        {/* ── Gradient shading ──────────────────────────────────────── */}
        <rect x="0" y="0" width={VW} height={VH} fill={`url(#${uid}-sh)`} clipPath={`url(#${uid}-clip)`} />
        <rect x="0" y="0" width={VW} height={VH} fill={`url(#${uid}-sv)`} clipPath={`url(#${uid}-clip)`} />

        {/* ── Sleeve tip shading ─────────────────────────────────────── */}
        <rect x="0" y="80" width="62" height="90" fill={`url(#${uid}-sl)`} clipPath={`url(#${uid}-clip)`} opacity="0.8" />
        <rect x="218" y="80" width="62" height="90" fill={`url(#${uid}-sr)`} clipPath={`url(#${uid}-clip)`} opacity="0.8" />

        {/* ── Subtle fold lines ─────────────────────────────────────── */}
        <g fill="none" stroke={isLight ? 'rgba(0,0,0,0.055)' : 'rgba(255,255,255,0.04)'} strokeWidth="1.2" strokeLinecap="round">
          {FOLD_LINES.map((d, i) => <path key={i} d={d} />)}
        </g>

        {/* ── Seam lines ────────────────────────────────────────────── */}
        <g fill="none" stroke={isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.06)'} strokeWidth="0.9" strokeLinecap="round">
          {/* Shoulder seams */}
          <path d="M 104,50 C 95,45 79,59 68,67"/>
          <path d="M 176,50 C 185,45 201,59 212,67"/>
          {/* Armhole curves */}
          <path d="M 36,168 Q 48,162 60,152"/>
          <path d="M 244,168 Q 232,162 220,152"/>
          {/* Side seams */}
          <line x1="60" y1="152" x2="60" y2="316"/>
          <line x1="220" y1="152" x2="220" y2="316"/>
          {/* Bottom hem double stitch */}
          <path d="M 72,328 L 208,328"/>
          <path d="M 74,323 L 206,323"/>
          {/* Sleeve hems */}
          <path d="M 9,163 L 36,168"/>
          <path d="M 271,163 L 244,168"/>
          {/* Center front seam (subtle) */}
          <line x1="140" y1="67" x2="140" y2="85" strokeOpacity="0.5"/>
        </g>

        {/* ── V-neck accent ──────────────────────────────────────────── */}
        {typeId === 'vneck' && side === 'front' && (
          <g fill="none" stroke={isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.08)'} strokeWidth="1">
            <line x1="104" y1="50" x2="140" y2="112"/>
            <line x1="176" y1="50" x2="140" y2="112"/>
            {/* V-neck inner edge highlight */}
            <line x1="105" y1="52" x2="140" y2="114" stroke={isLight ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.06)'} />
            <line x1="175" y1="52" x2="140" y2="114" stroke={isLight ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.06)'} />
          </g>
        )}

        {/* ── Collar band ───────────────────────────────────────────── */}
        {collar && (
          <>
            <path d={collar} fill={darkCol} />
            <path d={collar} fill={`url(#${uid}-sv)`} opacity="0.7" />
            {/* Collar stitching */}
            <path d={collar} fill="none"
              stroke={isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.06)'}
              strokeWidth="0.7"
            />
            {/* Collar highlight edge */}
            <path
              d={typeId === 'polo' && side === 'front'
                ? 'M 100,50 C 112,37 126,31 140,31 C 154,31 168,37 180,50'
                : 'M 104,50 C 115,40 127,34 140,34 C 153,34 165,40 176,50'}
              fill="none"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="1"
            />
          </>
        )}

        {/* ── Polo placket + buttons ─────────────────────────────────── */}
        {polo && (
          <>
            <path d={POLO_PLACKET} fill={darkCol} />
            <path d={POLO_PLACKET} fill={`url(#${uid}-sv)`} opacity="0.5" />
            <line x1="130" y1="50" x2="130" y2="108" stroke={isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.07)'} strokeWidth="0.8"/>
            <line x1="150" y1="50" x2="150" y2="108" stroke={isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.07)'} strokeWidth="0.8"/>
            {POLO_BTNS.map((b, i) => (
              <g key={i}>
                <circle cx={b.cx} cy={b.cy} r="3.4" fill={darken(color, -60)} />
                <circle cx={b.cx} cy={b.cy} r="2.2" fill="rgba(0,0,0,0.45)" />
                <circle cx={b.cx - 0.7} cy={b.cy - 0.7} r="0.6" fill="rgba(255,255,255,0.25)" />
              </g>
            ))}
          </>
        )}

        {/* ── Shirt outline ──────────────────────────────────────────── */}
        <path d={body} fill="none"
          stroke={isLight ? 'rgba(0,0,0,0.20)' : 'rgba(255,255,255,0.10)'}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* ── Side label ────────────────────────────────────────────── */}
        <text
          x={VW / 2} y={VH - 6}
          textAnchor="middle"
          fill={isLight ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.20)'}
          fontSize="7.5"
          fontFamily="'Inter', sans-serif"
          letterSpacing="3"
          fontWeight="600"
        >
          {side.toUpperCase()}
        </text>
      </svg>

      {/* ── Print area border ─────────────────────────────────────────── */}
      {(showPrintArea || designImage) && (
        <div style={{
          position: 'absolute', zIndex: 2,
          left: pLeft, top: pTop,
          width: pW, height: pH,
          border: `1.5px dashed ${designImage ? 'rgba(201,150,122,0.5)' : 'rgba(201,150,122,0.75)'}`,
          borderRadius: 6,
          pointerEvents: 'none',
          boxSizing: 'border-box',
        }}>
          {!designImage && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 9, color: 'rgba(201,150,122,0.55)', fontFamily: 'sans-serif', letterSpacing: 1 }}>
                PRINT AREA
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Design image overlay ──────────────────────────────────────── */}
      {designImage && (
        <img
          src={designImage}
          alt="Design"
          draggable={false}
          onMouseDown={(e) => { startDrag(e.clientX, e.clientY); e.preventDefault(); }}
          onTouchStart={(e) => { const t = e.touches[0]; startDrag(t.clientX, t.clientY); e.preventDefault(); }}
          onTouchMove={(e) => { const t = e.touches[0]; moveDrag(t.clientX, t.clientY); }}
          onTouchEnd={endDrag}
          style={{
            position: 'absolute', zIndex: 3,
            left: dLeft, top: dTop,
            width: dSize, height: 'auto',
            transform: `translate(-50%, -50%) rotate(${designRot}deg)`,
            cursor: onDesignMove ? 'grab' : 'default',
            userSelect: 'none',
            WebkitUserDrag: 'none',
            maxWidth: 'none',
            filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.32))',
          }}
        />
      )}
    </div>
  );
}
