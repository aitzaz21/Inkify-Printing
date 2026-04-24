import { useRef, useState, useCallback, useEffect } from 'react';

// ─── Canvas constants ─────────────────────────────────────────────────────────
const VW = 280;
const VH = 360;

// Print area: chest zone, well inside the body, below the armhole
const PRINT_AREA = {
  front: { x: 0.308, y: 0.415, w: 0.384, h: 0.370 },
  back:  { x: 0.308, y: 0.365, w: 0.384, h: 0.410 },
};

const BASE_SIZE = 82;

// ─── Shirt silhouette paths ───────────────────────────────────────────────────
// Based on a size-M flat-lay: shoulder span ~175 px, sleeve reach ~54 px each,
// body height ~186 px, collar ring ~80 px wide × 38 px tall.

const BODY_CREW =
  'M 100,50 ' +
  'C 88,42 68,52 54,64 ' +        // left shoulder: smooth outward-down slope
  'C 38,72 18,80 8,96 ' +         // sleeve sweeps outward along upper edge
  'C 2,110 2,126 6,144 ' +        // sleeve outer tip rounds at cuff corner
  'L 8,156 ' +                    // sleeve outer bottom edge
  'C 14,164 26,168 44,164 ' +     // cuff band: rounded inner corner
  'C 56,158 62,146 62,130 ' +     // armhole: concave arc rising to body
  'L 62,316 ' +                   // left body side seam (straight)
  'C 62,324 68,330 76,330 ' +     // left hem rounded corner
  'L 204,330 ' +                  // bottom hem
  'C 212,330 218,324 218,316 ' +  // right hem rounded corner
  'L 218,130 ' +                  // right body side seam
  'C 218,146 224,158 236,164 ' +  // right armhole: concave mirror
  'C 254,168 266,164 272,156 ' +  // right cuff band inner
  'L 274,144 ' +                  // right sleeve outer bottom
  'C 278,126 278,110 272,96 ' +   // right sleeve tip rounds
  'C 262,80 242,72 226,64 ' +     // right sleeve sweeps inward
  'C 212,52 192,42 180,50 ' +     // right shoulder slope
  'C 170,60 156,68 140,68 ' +     // right collar arc
  'C 124,68 110,60 100,50 Z';     // left collar arc

const BODY_VNECK =
  'M 100,50 ' +
  'C 88,42 68,52 54,64 ' +
  'C 38,72 18,80 8,96 ' +
  'C 2,110 2,126 6,144 ' +
  'L 8,156 ' +
  'C 14,164 26,168 44,164 ' +
  'C 56,158 62,146 62,130 ' +
  'L 62,316 ' +
  'C 62,324 68,330 76,330 ' +
  'L 204,330 ' +
  'C 212,330 218,324 218,316 ' +
  'L 218,130 ' +
  'C 218,146 224,158 236,164 ' +
  'C 254,168 266,164 272,156 ' +
  'L 274,144 ' +
  'C 278,126 278,110 272,96 ' +
  'C 262,80 242,72 226,64 ' +
  'C 212,52 192,42 180,50 ' +
  'L 140,116 L 100,50 Z';          // V-point replaces collar arc

// Crew collar band ring — sits above body attachment line
const COLLAR_CREW =
  'M 100,50 C 110,36 124,30 140,30 C 156,30 170,36 180,50 ' +
  'C 170,60 156,68 140,68 C 124,68 110,60 100,50 Z';

// Polo collar — wider, flatter, front-open horseshoe shape
const COLLAR_POLO =
  'M 96,48 C 108,34 124,28 140,28 C 156,28 172,34 184,48 ' +
  'L 182,60 C 170,50 156,46 140,46 C 124,46 110,50 98,60 Z';

const POLO_PLACKET = 'M 131,48 L 131,120 L 149,120 L 149,48 Z';
const POLO_BTNS = [{ cx: 140, cy: 66 }, { cx: 140, cy: 82 }, { cx: 140, cy: 98 }];

// Fabric wrinkle / drape paths (match body geometry)
const WRINKLES_FRONT = [
  'M 108,80 C 115,100 113,124 110,140',
  'M 172,80 C 165,100 167,124 170,140',
  'M 74,158 C 68,174 66,192 70,210',
  'M 206,158 C 212,174 214,192 210,210',
  'M 118,230 C 122,248 120,270 117,285',
  'M 162,230 C 158,248 160,270 163,285',
  'M 96,290 C 102,304 100,316 97,325',
  'M 184,290 C 178,304 180,316 183,325',
];

const WRINKLES_BACK = [
  'M 108,80 C 115,100 113,124 110,140',
  'M 172,80 C 165,100 167,124 170,140',
  'M 74,158 C 68,174 66,192 70,210',
  'M 206,158 C 212,174 214,192 210,210',
  'M 115,234 C 120,252 118,274 115,290',
  'M 165,234 C 160,252 162,274 165,290',
  'M 94,295 C 102,308 100,320 96,330',
  'M 186,295 C 178,308 180,320 184,330',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getShirtDef(typeId, side) {
  if (typeId === 'vneck') {
    return side === 'front'
      ? { body: BODY_VNECK, collar: null,        polo: false }
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
  const full   = hex.replace('#', '');
  const padded = full.length === 3 ? full.split('').map(c => c + c).join('') : full;
  const n = parseInt(padded, 16) || 0;
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amt));
  const b = Math.max(0, Math.min(255, (n & 0xff) + amt));
  return `rgb(${r},${g},${b})`;
}

function getLum(hex) {
  const full = hex.replace('#', '');
  const pad  = full.length === 3 ? full.split('').map(c => c + c).join('') : full;
  const n    = parseInt(pad, 16) || 0;
  return (n >> 16) * 0.299 + ((n >> 8) & 0xff) * 0.587 + (n & 0xff) * 0.114;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ShirtViewer2D({
  typeId         = 'plain-tshirt',
  color          = '#FFFFFF',
  side           = 'front',
  designImage    = null,
  designX        = 0.5,
  designY        = 0.5,
  designScale    = 1.0,
  designRot      = 0,
  onDesignMove   = null,
  onDesignResize = null,
  showPrintArea  = false,
}) {
  const wrapRef  = useRef(null);
  const dragging = useRef(false);
  const drag0    = useRef({ mx: 0, my: 0, dx: 0, dy: 0 });
  const resizing = useRef(false);
  const resize0  = useRef({ mx: 0, initScale: 1, initHalfW: 0, sign: 1 });
  const [dim, setDim]             = useState({ w: 380, h: 480 });
  const [imgAspect, setImgAspect] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      setDim({ w: e.contentRect.width, h: e.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const aspect = VW / VH;
  let sw, sh, ox, oy;
  if (dim.w / dim.h > aspect) {
    sh = dim.h; sw = dim.h * aspect; ox = (dim.w - sw) / 2; oy = 0;
  } else {
    sw = dim.w; sh = dim.w / aspect; ox = 0; oy = (dim.h - sh) / 2;
  }
  const sf = sw / VW;

  const pa    = PRINT_AREA[side];
  const pLeft = ox + pa.x * VW * sf;
  const pTop  = oy + pa.y * VH * sf;
  const pW    = pa.w * VW * sf;
  const pH    = pa.h * VH * sf;

  const dLeft = pLeft + designX * pW;
  const dTop  = pTop  + designY * pH;
  const dSize = BASE_SIZE * sf * designScale;

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

  const startResize = useCallback((clientX, sign) => {
    if (!onDesignResize) return;
    resizing.current = true;
    resize0.current = { mx: clientX, initScale: designScale, initHalfW: dSize / 2, sign };
  }, [onDesignResize, designScale, dSize]);

  const moveResize = useCallback((clientX) => {
    if (!resizing.current || !onDesignResize) return;
    const { mx, initScale, initHalfW, sign } = resize0.current;
    const delta = (clientX - mx) * sign;
    const newHalfW = initHalfW + delta;
    if (newHalfW < 10) return;
    onDesignResize(Math.max(0.3, Math.min(2.5, initScale * newHalfW / initHalfW)));
  }, [onDesignResize]);

  const endResize = useCallback(() => { resizing.current = false; }, []);

  useEffect(() => {
    const mm = (e) => { moveDrag(e.clientX, e.clientY); moveResize(e.clientX); };
    const mu = () => { endDrag(); endResize(); };
    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup', mu);
    return () => { window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); };
  }, [moveDrag, endDrag, moveResize, endResize]);

  // ─── Derived visual values ────────────────────────────────────────────────
  const { body, collar, polo } = getShirtDef(typeId, side);
  const uid      = `sv2d-${typeId.replace(/-/g, '')}-${side}`;
  const lum      = getLum(color);
  const isLight  = lum > 148;
  const darkCol  = darken(color, -38);
  const darkCol2 = darken(color, -20);
  const wrinkles = side === 'back' ? WRINKLES_BACK : WRINKLES_FRONT;

  // Adaptive stroke colours based on shirt brightness
  const seamOpacity    = isLight ? 0.11 : 0.06;
  const wrinkleOpacity = isLight ? 0.06 : 0.035;
  const outlineOpacity = isLight ? 0.28 : 0.14;
  const seamColor    = isLight ? `rgba(0,0,0,${seamOpacity})`    : `rgba(255,255,255,${seamOpacity})`;
  const wrinkleColor = isLight ? `rgba(0,0,0,${wrinkleOpacity})` : `rgba(255,255,255,${wrinkleOpacity})`;
  const outlineColor = isLight ? `rgba(0,0,0,${outlineOpacity})` : `rgba(255,255,255,${outlineOpacity})`;

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', height: '100%', userSelect: 'none' }}>

      {/* ── Soft ground shadow ──────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: `${oy}px`, left: '50%',
        transform: 'translateX(-50%)',
        width: `${sw * 0.58}px`, height: '20px',
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(0,0,0,0.50) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* ── Main SVG ─────────────────────────────────────────────────────────── */}
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'absolute', left: ox, top: oy, width: sw, height: sh, display: 'block', zIndex: 1, overflow: 'visible' }}
      >
        <defs>
          {/* ── Drop shadow filter for entire shirt ── */}
          <filter id={`${uid}-drop`} x="-8%" y="-4%" width="116%" height="116%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.55"/>
          </filter>

          {/* ── Fabric noise / cotton weave texture ── */}
          <filter id={`${uid}-fab`} x="-2%" y="-2%" width="104%" height="104%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.72 0.62" numOctaves="4" seed="14" result="noise"/>
            <feColorMatrix in="noise" type="saturate" values="0" result="gray"/>
            <feBlend in="SourceGraphic" in2="gray" mode="multiply" result="blended"/>
            <feComposite in="blended" in2="SourceGraphic" operator="in"/>
          </filter>

          {/* ── Subtle displacement for fabric surface irregularity ── */}
          <filter id={`${uid}-disp`} x="-2%" y="-2%" width="104%" height="104%">
            <feTurbulence type="turbulence" baseFrequency="0.04 0.03" numOctaves="3" seed="5" result="turb"/>
            <feDisplacementMap in="SourceGraphic" in2="turb" scale="1.8" xChannelSelector="R" yChannelSelector="G"/>
          </filter>

          {/* ── Collar ribbing pattern ── */}
          <pattern id={`${uid}-rib`} x="0" y="0" width={VW} height="2.8" patternUnits="userSpaceOnUse">
            <rect width={VW} height="1.4" fill="rgba(0,0,0,0.10)"/>
          </pattern>

          {/* ── Cotton weave grid pattern ── */}
          <pattern id={`${uid}-cotton`} x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
            <rect width="4" height="4" fill="none"/>
            <rect width="4" height="2" fill="rgba(0,0,0,0.030)"/>
            <rect width="2" height="4" fill="rgba(0,0,0,0.020)"/>
          </pattern>

          {/* ── Clip paths ── */}
          <clipPath id={`${uid}-clip`}><path d={body}/></clipPath>
          {collar && <clipPath id={`${uid}-cclip`}><path d={collar}/></clipPath>}

          {/* ── Gradients ── */}

          {/* Left-to-right edge darkening */}
          <linearGradient id={`${uid}-sides`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={VW} y2="0">
            <stop offset="0%"   stopColor="#000" stopOpacity="0.42"/>
            <stop offset="10%"  stopColor="#000" stopOpacity="0.12"/>
            <stop offset="30%"  stopColor="#fff" stopOpacity="0.08"/>
            <stop offset="50%"  stopColor="#fff" stopOpacity="0.04"/>
            <stop offset="70%"  stopColor="#fff" stopOpacity="0.08"/>
            <stop offset="90%"  stopColor="#000" stopOpacity="0.12"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0.40"/>
          </linearGradient>

          {/* Top-to-bottom shading */}
          <linearGradient id={`${uid}-topbot`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={VH}>
            <stop offset="0%"   stopColor="#fff" stopOpacity="0.22"/>
            <stop offset="15%"  stopColor="#fff" stopOpacity="0.08"/>
            <stop offset="45%"  stopColor="#000" stopOpacity="0.00"/>
            <stop offset="78%"  stopColor="#000" stopOpacity="0.10"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0.28"/>
          </linearGradient>

          {/* Center-chest radial highlight (main light source) */}
          <radialGradient id={`${uid}-chest`} gradientUnits="userSpaceOnUse" cx="140" cy="195" r="145">
            <stop offset="0%"   stopColor="#fff" stopOpacity="0.22"/>
            <stop offset="35%"  stopColor="#fff" stopOpacity="0.06"/>
            <stop offset="70%"  stopColor="#000" stopOpacity="0.04"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0.16"/>
          </radialGradient>

          {/* Strong edge vignette — most important for 3D realism */}
          <radialGradient id={`${uid}-vign`} gradientUnits="userSpaceOnUse" cx="140" cy="195" r="175">
            <stop offset="0%"   stopColor="#000" stopOpacity="0.00"/>
            <stop offset="55%"  stopColor="#000" stopOpacity="0.04"/>
            <stop offset="80%"  stopColor="#000" stopOpacity="0.22"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0.52"/>
          </radialGradient>

          {/* Shoulder area specular (upper-front light) */}
          <radialGradient id={`${uid}-shoulder`} gradientUnits="userSpaceOnUse" cx="140" cy="50" r="180">
            <stop offset="0%"   stopColor="#fff" stopOpacity="0.24"/>
            <stop offset="40%"  stopColor="#fff" stopOpacity="0.07"/>
            <stop offset="100%" stopColor="#fff" stopOpacity="0.00"/>
          </radialGradient>

          {/* Left sleeve outer shadow */}
          <linearGradient id={`${uid}-stl`} gradientUnits="userSpaceOnUse" x1="62" y1="0" x2="0" y2="0">
            <stop offset="0%"   stopColor="#000" stopOpacity="0.00"/>
            <stop offset="60%"  stopColor="#000" stopOpacity="0.18"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0.42"/>
          </linearGradient>

          {/* Right sleeve outer shadow */}
          <linearGradient id={`${uid}-str`} gradientUnits="userSpaceOnUse" x1="218" y1="0" x2={VW} y2="0">
            <stop offset="0%"   stopColor="#000" stopOpacity="0.00"/>
            <stop offset="60%"  stopColor="#000" stopOpacity="0.18"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0.42"/>
          </linearGradient>

          {/* Collar cast-shadow onto chest — thin gradient strip */}
          <linearGradient id={`${uid}-colshadow`} gradientUnits="userSpaceOnUse" x1="0" y1="68" x2="0" y2="108">
            <stop offset="0%"   stopColor="#000" stopOpacity="0.28"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0.00"/>
          </linearGradient>

          {/* Hem fold shadow — darker at very bottom */}
          <linearGradient id={`${uid}-hem`} gradientUnits="userSpaceOnUse" x1="0" y1="310" x2="0" y2="330">
            <stop offset="0%"   stopColor="#000" stopOpacity="0.00"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0.22"/>
          </linearGradient>

          {/* Cuff-edge shadow gradient (bottom of each sleeve) */}
          <linearGradient id={`${uid}-cuffl`} gradientUnits="userSpaceOnUse" x1="0" y1="148" x2="0" y2="170">
            <stop offset="0%"   stopColor="#000" stopOpacity="0.00"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0.20"/>
          </linearGradient>

          {/* Sleeve-panel ambient darkening — sleeves sit slightly away from light */}
          <linearGradient id={`${uid}-sleeveL`} gradientUnits="userSpaceOnUse" x1="64" y1="0" x2="0" y2="0">
            <stop offset="0%"   stopColor="#000" stopOpacity="0.00"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0.14"/>
          </linearGradient>
          <linearGradient id={`${uid}-sleeveR`} gradientUnits="userSpaceOnUse" x1="216" y1="0" x2={VW} y2="0">
            <stop offset="0%"   stopColor="#000" stopOpacity="0.00"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0.14"/>
          </linearGradient>

          {/* Side-seam inner-groove shadow (seam ridge catches less light) */}
          <linearGradient id={`${uid}-seamL`} gradientUnits="userSpaceOnUse" x1="56" y1="0" x2="72" y2="0">
            <stop offset="0%"   stopColor="#000" stopOpacity="0.00"/>
            <stop offset="50%"  stopColor="#000" stopOpacity="0.20"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0.00"/>
          </linearGradient>
          <linearGradient id={`${uid}-seamR`} gradientUnits="userSpaceOnUse" x1="208" y1="0" x2="224" y2="0">
            <stop offset="0%"   stopColor="#000" stopOpacity="0.00"/>
            <stop offset="50%"  stopColor="#000" stopOpacity="0.20"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0.00"/>
          </linearGradient>

          {/* Underarm fold shadow — fabric tension crease below sleeve junction */}
          <radialGradient id={`${uid}-underL`} gradientUnits="userSpaceOnUse" cx="62" cy="156" r="22">
            <stop offset="0%"   stopColor="#000" stopOpacity="0.32"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0.00"/>
          </radialGradient>
          <radialGradient id={`${uid}-underR`} gradientUnits="userSpaceOnUse" cx="218" cy="156" r="22">
            <stop offset="0%"   stopColor="#000" stopOpacity="0.32"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0.00"/>
          </radialGradient>
        </defs>

        {/* ══ LAYER 1 — Base fill with drop shadow ══════════════════════════════ */}
        <path d={body} fill={color} filter={`url(#${uid}-drop)`}/>

        {/* ══ LAYER 2 — Cotton weave texture ════════════════════════════════════ */}
        <path d={body} fill={`url(#${uid}-cotton)`} opacity={isLight ? '1' : '0.55'}/>

        {/* ══ LAYER 3 — Fabric noise (woven-cotton look) ════════════════════════ */}
        <path d={body} fill={color} opacity="0.30" filter={`url(#${uid}-fab)`}/>

        {/* ══ LAYER 4 — Primary shading gradients ═══════════════════════════════ */}
        {/* Side-to-side edge darkening */}
        <rect x="0" y="0" width={VW} height={VH} fill={`url(#${uid}-sides)`}    clipPath={`url(#${uid}-clip)`}/>
        {/* Top-to-bottom tone */}
        <rect x="0" y="0" width={VW} height={VH} fill={`url(#${uid}-topbot)`}   clipPath={`url(#${uid}-clip)`}/>
        {/* Center-chest highlight */}
        <rect x="0" y="0" width={VW} height={VH} fill={`url(#${uid}-chest)`}    clipPath={`url(#${uid}-clip)`}/>
        {/* Shoulder specular */}
        <rect x="0" y="0" width={VW} height="150" fill={`url(#${uid}-shoulder)`} clipPath={`url(#${uid}-clip)`}/>

        {/* ══ LAYER 5 — Strong edge vignette (makes fabric look 3D) ════════════ */}
        <rect x="0" y="0" width={VW} height={VH} fill={`url(#${uid}-vign)`} clipPath={`url(#${uid}-clip)`}/>

        {/* ══ LAYER 6 — Sleeve panel ambient shading ════════════════════════════ */}
        {/* Sleeves are angled away from the main light — slightly darker */}
        <rect x="0"   y="44" width="66" height="128" fill={`url(#${uid}-sleeveL)`} clipPath={`url(#${uid}-clip)`}/>
        <rect x="214" y="44" width="66" height="128" fill={`url(#${uid}-sleeveR)`} clipPath={`url(#${uid}-clip)`}/>

        {/* ══ LAYER 7 — Sleeve outer-edge deep shadows ══════════════════════════ */}
        <rect x="0"   y="58" width="66" height="112" fill={`url(#${uid}-stl)`} clipPath={`url(#${uid}-clip)`}/>
        <rect x="214" y="58" width="66" height="112" fill={`url(#${uid}-str)`} clipPath={`url(#${uid}-clip)`}/>

        {/* ══ LAYER 8 — Sleeve cuff-hem fold shadow ═════════════════════════════ */}
        <rect x="0" y="148" width={VW} height="22" fill={`url(#${uid}-cuffl)`} clipPath={`url(#${uid}-clip)`}/>

        {/* ══ LAYER 9 — Armhole concave depth shadows ═══════════════════════════ */}
        <ellipse cx="62"  cy="148" rx="30" ry="26" fill="rgba(0,0,0,0.30)" clipPath={`url(#${uid}-clip)`}/>
        <ellipse cx="218" cy="148" rx="30" ry="26" fill="rgba(0,0,0,0.30)" clipPath={`url(#${uid}-clip)`}/>
        <ellipse cx="62"  cy="144" rx="15" ry="13" fill="rgba(0,0,0,0.20)" clipPath={`url(#${uid}-clip)`}/>
        <ellipse cx="218" cy="144" rx="15" ry="13" fill="rgba(0,0,0,0.20)" clipPath={`url(#${uid}-clip)`}/>

        {/* ══ LAYER 10 — Underarm fold crease (fabric tension below junction) ══ */}
        <rect x="0" y="130" width={VW} height="50"
          fill={`url(#${uid}-underL)`} clipPath={`url(#${uid}-clip)`}/>
        <rect x="0" y="130" width={VW} height="50"
          fill={`url(#${uid}-underR)`} clipPath={`url(#${uid}-clip)`}/>

        {/* ══ LAYER 11 — Side-seam groove shadows ═══════════════════════════════ */}
        {/* Creates the illusion that the seam is a 3D ridge */}
        <rect x="56"  y="126" width="16" height="194" fill={`url(#${uid}-seamL)`} clipPath={`url(#${uid}-clip)`}/>
        <rect x="208" y="126" width="16" height="194" fill={`url(#${uid}-seamR)`} clipPath={`url(#${uid}-clip)`}/>

        {/* ══ LAYER 12 — Shoulder-cap crease ════════════════════════════════════ */}
        {/* Shadow fold where sleeve cap seam is visible on the shoulder */}
        <path d="M 86,66 C 74,78 62,92 56,108"
          fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="4" strokeLinecap="round"
          clipPath={`url(#${uid}-clip)`}/>
        <path d="M 194,66 C 206,78 218,92 224,108"
          fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="4" strokeLinecap="round"
          clipPath={`url(#${uid}-clip)`}/>
        {/* Highlight on the shoulder cap ridge (opposite side of shadow) */}
        <path d="M 84,65 C 72,77 60,91 54,107"
          fill="none"
          stroke={isLight ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'}
          strokeWidth="1.2" strokeLinecap="round"
          clipPath={`url(#${uid}-clip)`}/>
        <path d="M 196,65 C 208,77 220,91 226,107"
          fill="none"
          stroke={isLight ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'}
          strokeWidth="1.2" strokeLinecap="round"
          clipPath={`url(#${uid}-clip)`}/>

        {/* ══ LAYER 13 — Collar shadow cast on the chest ════════════════════════ */}
        <rect x="62" y="68" width="156" height="42" fill={`url(#${uid}-colshadow)`} clipPath={`url(#${uid}-clip)`}/>

        {/* ══ LAYER 14 — Hem fold shadow ════════════════════════════════════════ */}
        <rect x="62" y="310" width="156" height="20" fill={`url(#${uid}-hem)`} clipPath={`url(#${uid}-clip)`}/>

        {/* ══ LAYER 15 — Inner-edge fabric thickness shadow (3D rim) ═══════════ */}
        <path d={body} fill="none" stroke="rgba(0,0,0,0.24)" strokeWidth="14"
          strokeLinejoin="round" clipPath={`url(#${uid}-clip)`}/>

        {/* ══ LAYER 16 — Surface-displacement micro-texture ═════════════════════ */}
        <path d={body} fill={color} opacity="0.09" filter={`url(#${uid}-disp)`}/>

        {/* ══ LAYER 17 — Fabric drape / wrinkle lines ══════════════════════════ */}
        <g fill="none" stroke={wrinkleColor} strokeWidth="1.6" strokeLinecap="round">
          {wrinkles.map((d, i) => <path key={i} d={d}/>)}
        </g>

        {/* ══ LAYER 18 — Seam relief: shadow stroke UNDER stitching ════════════ */}
        {/* Thick dark underlay makes seams look recessed / 3D */}
        <g fill="none" stroke={isLight ? 'rgba(0,0,0,0.10)' : 'rgba(0,0,0,0.16)'}
          strokeWidth="3.5" strokeLinecap="round">
          <path d="M 100,50 C 88,42 68,52 54,64"/>
          <path d="M 180,50 C 192,42 212,52 226,64"/>
          <path d="M 44,164 C 56,158 62,146 62,130"/>
          <path d="M 236,164 C 224,158 218,146 218,130"/>
          <path d="M 62,130 L 62,316"/>
          <path d="M 218,130 L 218,316"/>
          <path d="M 8,156 C 14,164 26,168 44,164"/>
          <path d="M 272,156 C 266,164 254,168 236,164"/>
        </g>

        {/* ══ LAYER 19 — Seam stitching fine lines (on top of relief) ══════════ */}
        <g fill="none" stroke={seamColor} strokeWidth="1.0" strokeLinecap="round">
          <path d="M 100,50 C 88,42 68,52 54,64"/>
          <path d="M 180,50 C 192,42 212,52 226,64"/>
          <path d="M 44,164 C 56,158 62,146 62,130"/>
          <path d="M 236,164 C 224,158 218,146 218,130"/>
          <path d="M 62,130 L 62,316"/>
          <path d="M 218,130 L 218,316"/>
          {/* Double-needle bottom hem */}
          <path d="M 76,330 L 204,330"/>
          <path d="M 77,326 L 203,326"/>
          {/* Sleeve cuff double-stitch */}
          <path d="M 8,156 C 14,164 26,168 44,164"/>
          <path d="M 272,156 C 266,164 254,168 236,164"/>
          <path d="M 8,152 C 14,160 26,163.5 44,160"/>
          <path d="M 272,152 C 266,160 254,163.5 236,160"/>
          {/* Center neck line */}
          <line x1="140" y1="68" x2="140" y2="92" strokeOpacity="0.5"/>
        </g>

        {/* ══ LAYER 21 — V-neck cut edge detail ════════════════════════════════ */}
        {typeId === 'vneck' && side === 'front' && (
          <g fill="none">
            <line x1="100" y1="50" x2="140" y2="116"
              stroke={isLight ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.08)'}
              strokeWidth="1.6"/>
            <line x1="180" y1="50" x2="140" y2="116"
              stroke={isLight ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.08)'}
              strokeWidth="1.6"/>
            <line x1="101" y1="52" x2="141" y2="118"
              stroke={isLight ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.10)'}
              strokeWidth="0.9"/>
            <line x1="179" y1="52" x2="139" y2="118"
              stroke={isLight ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.10)'}
              strokeWidth="0.9"/>
          </g>
        )}

        {/* ══ LAYER 22 — Collar band ════════════════════════════════════════════ */}
        {collar && (() => {
          const isPoloFront = typeId === 'polo' && side === 'front';
          const topEdge = isPoloFront
            ? 'M 96,48 C 108,34 124,28 140,28 C 156,28 172,34 184,48'
            : 'M 100,50 C 110,36 124,30 140,30 C 156,30 170,36 180,50';
          const innerEdge = isPoloFront
            ? 'M 98,60 C 110,50 124,46 140,46 C 156,46 170,50 182,60'
            : 'M 100,50 C 110,60 124,68 140,68 C 156,68 170,60 180,50';
          return (
            <>
              {/* Base fill — slightly darker than body */}
              <path d={collar} fill={darkCol}/>
              {/* Top-to-bottom tone on collar */}
              <path d={collar} fill={`url(#${uid}-topbot)`} opacity="0.7"
                clipPath={`url(#${uid}-cclip)`}/>
              {/* Rib knit texture */}
              <path d={collar} fill={`url(#${uid}-rib)`} opacity="0.75"
                clipPath={`url(#${uid}-cclip)`}/>
              {/* Cotton weave on collar */}
              <path d={collar} fill={`url(#${uid}-cotton)`} opacity="0.8"
                clipPath={`url(#${uid}-cclip)`}/>
              {/* Inner-edge shadow (collar has depth/fold) */}
              <path d={collar} fill="none" stroke="rgba(0,0,0,0.30)" strokeWidth="5"
                clipPath={`url(#${uid}-cclip)`}/>
              {/* Outer top-edge highlight (catches overhead light) */}
              <path d={topEdge} fill="none"
                stroke={isLight ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.25)'}
                strokeWidth="1.4"/>
              {/* Inner bottom-edge shadow line */}
              <path d={innerEdge} fill="none"
                stroke="rgba(0,0,0,0.22)" strokeWidth="1.1"/>
              {/* Vignette on collar edges */}
              <path d={collar} fill={`url(#${uid}-vign)`} opacity="0.5"
                clipPath={`url(#${uid}-cclip)`}/>
            </>
          );
        })()}

        {/* ══ LAYER 23 — Polo placket + buttons ════════════════════════════════ */}
        {polo && (
          <>
            <path d={POLO_PLACKET} fill={darkCol2}/>
            <path d={POLO_PLACKET} fill={`url(#${uid}-topbot)`} opacity="0.5"/>
            <path d={POLO_PLACKET} fill={`url(#${uid}-rib)`} opacity="0.55"/>
            <line x1="131" y1="48" x2="131" y2="120"
              stroke={isLight ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.09)'}
              strokeWidth="1.0"/>
            <line x1="149" y1="48" x2="149" y2="120"
              stroke={isLight ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.09)'}
              strokeWidth="1.0"/>
            {POLO_BTNS.map((b, i) => (
              <g key={i}>
                <circle cx={b.cx} cy={b.cy} r="4.5" fill={darken(color, -75)}/>
                <circle cx={b.cx} cy={b.cy} r="3.4" fill="rgba(0,0,0,0.38)"/>
                <circle cx={b.cx} cy={b.cy} r="2.5" fill={darken(color, -58)}/>
                <circle cx={b.cx - 1.0} cy={b.cy - 1.0} r="0.75" fill="rgba(255,255,255,0.32)"/>
                <circle cx={b.cx - 1.1} cy={b.cy - 1.1} r="0.48" fill="rgba(0,0,0,0.55)"/>
                <circle cx={b.cx + 1.1} cy={b.cy + 1.1} r="0.48" fill="rgba(0,0,0,0.55)"/>
              </g>
            ))}
          </>
        )}

        {/* ══ LAYER 24 — Back neck label (realistic detail, back side only) ════ */}
        {side === 'back' && (
          <g>
            <rect x="130" y="70" width="20" height="13" rx="1.5"
              fill={isLight ? 'rgba(255,255,255,0.70)' : 'rgba(0,0,0,0.25)'}
              stroke={isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.10)'}
              strokeWidth="0.5"/>
            <rect x="133" y="72.5" width="14" height="8" rx="1"
              fill={darken(color, isLight ? -18 : -10)}/>
            <line x1="137" y1="73" x2="137" y2="80"
              stroke={isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.18)'}
              strokeWidth="0.6"/>
            <line x1="140" y1="73" x2="140" y2="80"
              stroke={isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.18)'}
              strokeWidth="0.6"/>
            <line x1="143" y1="73" x2="143" y2="80"
              stroke={isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.18)'}
              strokeWidth="0.6"/>
          </g>
        )}

        {/* ══ LAYER 25 — Center fold crease ════════════════════════════════════ */}
        <line x1="140" y1="70" x2="140" y2="320"
          stroke={isLight ? 'rgba(0,0,0,0.032)' : 'rgba(255,255,255,0.022)'}
          strokeWidth="1" strokeDasharray="1,4"/>

        {/* ══ LAYER 26 — Outer rim highlight ═══════════════════════════════════ */}
        <path d={body} fill="none"
          stroke={isLight ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.10)'}
          strokeWidth="0.8" strokeLinejoin="round"/>

        {/* ══ LAYER 27 — Outer dark outline ════════════════════════════════════ */}
        <path d={body} fill="none"
          stroke={outlineColor} strokeWidth="1.6" strokeLinejoin="round"/>

        {/* ══ LAYER 28 — FRONT / BACK label ════════════════════════════════════ */}
        <text
          x={VW / 2} y={VH - 7}
          textAnchor="middle"
          fill={isLight ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.18)'}
          fontSize="6.5" fontFamily="'Inter',sans-serif"
          letterSpacing="4" fontWeight="700"
        >
          {side.toUpperCase()}
        </text>
      </svg>

      {/* ── Print area dashed box ────────────────────────────────────────────── */}
      {(showPrintArea || designImage) && (
        <div style={{
          position: 'absolute', zIndex: 2,
          left: pLeft, top: pTop, width: pW, height: pH,
          border: `1.5px dashed ${designImage ? 'rgba(201,150,122,0.45)' : 'rgba(201,150,122,0.75)'}`,
          borderRadius: 6, pointerEvents: 'none', boxSizing: 'border-box',
        }}>
          {!designImage && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 8, color: 'rgba(201,150,122,0.55)', fontFamily: 'sans-serif', letterSpacing: 1.5, fontWeight: 700 }}>
                PRINT AREA
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Design overlay + corner resize handles ───────────────────────────── */}
      {designImage && (() => {
        const dH = dSize * imgAspect;
        return (
          <div style={{
            position: 'absolute', zIndex: 3,
            left: dLeft, top: dTop,
            width: dSize, height: dH,
            transform: `translate(-50%,-50%) rotate(${designRot}deg)`,
            overflow: 'visible',
          }}>
            <div style={{
              position: 'absolute', inset: -3,
              border: '1.5px dashed rgba(201,150,122,0.65)',
              borderRadius: 4, pointerEvents: 'none',
            }} />
            <img
              src={designImage}
              alt="Design"
              draggable={false}
              onLoad={(e) => {
                const { naturalWidth: nw, naturalHeight: nh } = e.currentTarget;
                if (nw > 0) setImgAspect(nh / nw);
              }}
              onMouseDown={(e) => { startDrag(e.clientX, e.clientY); e.preventDefault(); }}
              onTouchStart={(e) => { const t = e.touches[0]; startDrag(t.clientX, t.clientY); e.preventDefault(); }}
              onTouchMove={(e)  => { const t = e.touches[0]; moveDrag(t.clientX,  t.clientY); }}
              onTouchEnd={endDrag}
              style={{
                width: '100%', height: '100%',
                objectFit: 'contain', display: 'block',
                cursor: onDesignMove ? 'grab' : 'default',
                userSelect: 'none', WebkitUserDrag: 'none',
                filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.45))',
              }}
            />
            {onDesignResize && [
              { pos: { left: 0,  top: 0    }, t: 'translate(-50%,-50%)', c: 'nw-resize', sign: -1 },
              { pos: { right: 0, top: 0    }, t: 'translate(50%,-50%)',  c: 'ne-resize', sign: 1  },
              { pos: { left: 0,  bottom: 0 }, t: 'translate(-50%,50%)',  c: 'sw-resize', sign: -1 },
              { pos: { right: 0, bottom: 0 }, t: 'translate(50%,50%)',   c: 'se-resize', sign: 1  },
            ].map((h, i) => (
              <div key={i}
                onMouseDown={(e) => { e.stopPropagation(); startResize(e.clientX, h.sign); e.preventDefault(); }}
                style={{
                  position: 'absolute', ...h.pos,
                  transform: h.t,
                  width: 12, height: 12,
                  background: '#fff',
                  border: '2.5px solid #8B5A3C',
                  borderRadius: 2,
                  cursor: h.c,
                  boxShadow: '0 1px 5px rgba(0,0,0,0.55)',
                }}
              />
            ))}
          </div>
        );
      })()}
    </div>
  );
}
