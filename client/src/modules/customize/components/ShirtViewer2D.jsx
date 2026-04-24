import { useRef, useState, useCallback, useEffect } from 'react';

const VW = 280;
const VH = 360;

const PRINT_AREA = {
  front: { x: 0.268, y: 0.308, w: 0.464, h: 0.490 },
  back:  { x: 0.268, y: 0.255, w: 0.464, h: 0.540 },
};

const BASE_SIZE = 82;

// ─── Improved shirt paths – smoother bezier curves ────────────────────────────

const BODY_CREW =
  'M 104,50 ' +
  'C 95,44 78,58 68,67 ' +           // left shoulder slope
  'C 58,72 38,78 26,82 ' +           // outer shoulder to sleeve
  'C 16,88 7,106 6,126 ' +           // sleeve outer curve (rounded tip)
  'L 9,163 ' +                       // sleeve bottom outer
  'L 36,168 ' +                      // sleeve hem inner
  'C 46,163 53,157 60,152 ' +        // armhole concave curve
  'C 57,197 57,262 60,316 ' +        // left side (subtle taper)
  'C 60,323 66,328 72,328 ' +        // hem corner
  'L 208,328 ' +                     // bottom hem
  'C 214,328 220,323 220,316 ' +     // right hem corner
  'C 223,262 223,197 220,152 ' +     // right side (subtle taper)
  'C 227,157 234,163 244,168 ' +     // right armhole
  'L 271,163 ' +                     // right sleeve hem inner
  'C 274,148 274,134 274,126 ' +     // right sleeve bottom
  'C 273,106 263,88 252,82 ' +       // right sleeve outer
  'C 240,78 222,72 212,67 ' +        // outer right shoulder
  'C 202,58 185,44 176,50 ' +        // right shoulder slope
  'C 165,61 153,67 140,67 ' +        // right collar arc
  'C 127,67 115,61 104,50 Z';        // left collar arc

const BODY_VNECK =
  'M 104,50 ' +
  'C 95,44 78,58 68,67 ' +
  'C 58,72 38,78 26,82 ' +
  'C 16,88 7,106 6,126 ' +
  'L 9,163 L 36,168 ' +
  'C 46,163 53,157 60,152 ' +
  'C 57,197 57,262 60,316 ' +
  'C 60,323 66,328 72,328 L 208,328 ' +
  'C 214,328 220,323 220,316 ' +
  'C 223,262 223,197 220,152 ' +
  'C 227,157 234,163 244,168 ' +
  'L 271,163 ' +
  'C 274,148 274,134 274,126 ' +
  'C 273,106 263,88 252,82 ' +
  'C 240,78 222,72 212,67 ' +
  'C 202,58 185,44 176,50 ' +
  'L 140,112 L 104,50 Z';            // V-point instead of collar arc

const COLLAR_CREW =
  'M 104,50 C 115,39 127,33 140,33 C 153,33 165,39 176,50 ' +
  'C 165,61 153,67 140,67 C 127,67 115,61 104,50 Z';

const COLLAR_POLO =
  'M 100,49 C 112,36 126,30 140,30 C 154,30 168,36 180,49 ' +
  'L 178,57 C 166,48 153,44 140,44 C 127,44 114,48 102,57 Z';

const POLO_PLACKET = 'M 130,49 L 130,110 L 150,110 L 150,49 Z';
const POLO_BTNS = [{ cx: 140, cy: 64 }, { cx: 140, cy: 78 }, { cx: 140, cy: 92 }];

// Natural drape wrinkle paths
const WRINKLES_FRONT = [
  'M 110,78 C 116,95 114,115 112,130',   // left collar-chest wrinkle
  'M 168,78 C 164,95 166,115 168,130',   // right collar-chest wrinkle
  'M 82,158 C 76,170 74,182 78,196',     // left armhole tension
  'M 198,158 C 204,170 206,182 202,196', // right armhole tension
  'M 118,215 C 122,228 120,245 117,258', // lower-left body
  'M 162,215 C 158,228 160,245 163,258', // lower-right body
];

const WRINKLES_BACK = [
  'M 110,78 C 115,95 112,115 110,132',
  'M 170,78 C 165,95 168,115 170,132',
  'M 82,158 C 77,170 75,183 79,197',
  'M 198,158 C 203,170 205,183 201,197',
  'M 115,220 C 120,234 118,252 115,266',
  'M 165,220 C 160,234 162,252 165,266',
  'M 100,275 C 107,285 105,298 102,308',
  'M 180,275 C 173,285 175,298 178,308',
];

function getShirtDef(typeId, side) {
  if (typeId === 'vneck') {
    return side === 'front'
      ? { body: BODY_VNECK, collar: null, polo: false }
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
  const full = hex.replace('#', '');
  const padded = full.length === 3 ? full.split('').map(c => c+c).join('') : full;
  const n = parseInt(padded, 16) || 0;
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amt));
  const b = Math.max(0, Math.min(255, (n & 0xff) + amt));
  return `rgb(${r},${g},${b})`;
}

function lighten(hex, amt) { return darken(hex, amt); }

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
  const [dim, setDim]           = useState({ w: 380, h: 480 });
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
    sh = dim.h; sw = dim.h * aspect;
    ox = (dim.w - sw) / 2; oy = 0;
  } else {
    sw = dim.w; sh = dim.w / aspect;
    ox = 0; oy = (dim.h - sh) / 2;
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
    const newScale = Math.max(0.3, Math.min(2.5, initScale * newHalfW / initHalfW));
    onDesignResize(newScale);
  }, [onDesignResize]);

  const endResize = useCallback(() => { resizing.current = false; }, []);

  useEffect(() => {
    const mm = (e) => { moveDrag(e.clientX, e.clientY); moveResize(e.clientX); };
    const mu = () => { endDrag(); endResize(); };
    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup', mu);
    return () => {
      window.removeEventListener('mousemove', mm);
      window.removeEventListener('mouseup', mu);
    };
  }, [moveDrag, endDrag, moveResize, endResize]);

  const { body, collar, polo } = getShirtDef(typeId, side);
  const uid      = `sv2-${typeId.replace(/-/g, '')}-${side}`;
  const darkCol  = darken(color, -40);
  const darkCol2 = darken(color, -22);

  // Luminance: is this a light-colored shirt?
  const lum = (() => {
    const full = color.replace('#','');
    const pad  = full.length === 3 ? full.split('').map(c=>c+c).join('') : full;
    const n    = parseInt(pad, 16) || 0;
    return ((n>>16)*0.299 + ((n>>8)&0xff)*0.587 + (n&0xff)*0.114);
  })();
  const isLight = lum > 148;

  const wrinkles = side === 'back' ? WRINKLES_BACK : WRINKLES_FRONT;

  // Seam stroke values
  const seamColor    = isLight ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,255,0.05)';
  const wrinkleColor = isLight ? 'rgba(0,0,0,0.045)' : 'rgba(255,255,255,0.03)';
  const outlineColor = isLight ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.12)';

  return (
    <div ref={wrapRef} style={{ position:'relative', width:'100%', height:'100%', userSelect:'none' }}>

      {/* Ground shadow */}
      <div style={{
        position: 'absolute',
        bottom: `${oy + 1}px`,
        left: '50%',
        transform: 'translateX(-50%)',
        width: `${sw * 0.55}px`,
        height: '16px',
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(0,0,0,0.42) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* ── Main SVG ──────────────────────────────────────────────────────────── */}
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ position:'absolute', left:ox, top:oy, width:sw, height:sh, display:'block', zIndex:1, overflow:'visible' }}
      >
        <defs>
          {/* ── Fabric weave texture filter ── */}
          <filter id={`${uid}-fab`} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.82 0.58" numOctaves="4" seed="7" result="noise"/>
            <feColorMatrix in="noise" type="saturate" values="0" result="gray"/>
            <feBlend in="SourceGraphic" in2="gray" mode="multiply" result="blended"/>
            <feComposite in="blended" in2="SourceGraphic" operator="in"/>
          </filter>

          {/* ── Collar rib texture pattern ── */}
          <pattern id={`${uid}-rib`} x="0" y="0" width={VW} height="2.6" patternUnits="userSpaceOnUse">
            <rect y="0" width={VW} height="1.3" fill="rgba(0,0,0,0.09)"/>
          </pattern>

          {/* ── Cotton weave pattern ── */}
          <pattern id={`${uid}-cotton`} x="0" y="0" width="3.5" height="3.5" patternUnits="userSpaceOnUse">
            <rect width="3.5" height="3.5" fill="none"/>
            <rect y="0" width="3.5" height="1.75" fill="rgba(0,0,0,0.028)"/>
            <rect x="0" width="1.75" height="3.5" fill="rgba(0,0,0,0.018)"/>
          </pattern>

          {/* ── Body clip path ── */}
          <clipPath id={`${uid}-clip`}>
            <path d={body}/>
          </clipPath>

          {/* ── Collar clip path ── */}
          {collar && (
            <clipPath id={`${uid}-cclip`}>
              <path d={collar}/>
            </clipPath>
          )}

          {/* Side-to-side shading gradient */}
          <linearGradient id={`${uid}-sides`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={VW} y2="0">
            <stop offset="0%"    stopColor="#000" stopOpacity="0.30"/>
            <stop offset="14%"   stopColor="#000" stopOpacity="0.07"/>
            <stop offset="38%"   stopColor="#fff" stopOpacity="0.09"/>
            <stop offset="50%"   stopColor="#fff" stopOpacity="0.06"/>
            <stop offset="62%"   stopColor="#fff" stopOpacity="0.07"/>
            <stop offset="86%"   stopColor="#000" stopOpacity="0.07"/>
            <stop offset="100%"  stopColor="#000" stopOpacity="0.28"/>
          </linearGradient>

          {/* Top-to-bottom shading */}
          <linearGradient id={`${uid}-topbot`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={VH}>
            <stop offset="0%"    stopColor="#fff" stopOpacity="0.20"/>
            <stop offset="18%"   stopColor="#fff" stopOpacity="0.06"/>
            <stop offset="55%"   stopColor="#000" stopOpacity="0.02"/>
            <stop offset="85%"   stopColor="#000" stopOpacity="0.08"/>
            <stop offset="100%"  stopColor="#000" stopOpacity="0.18"/>
          </linearGradient>

          {/* Radial chest highlight – light from front */}
          <radialGradient id={`${uid}-chest`} gradientUnits="userSpaceOnUse" cx="140" cy="148" r="118">
            <stop offset="0%"    stopColor="#fff" stopOpacity="0.16"/>
            <stop offset="45%"   stopColor="#fff" stopOpacity="0.04"/>
            <stop offset="100%"  stopColor="#000" stopOpacity="0.05"/>
          </radialGradient>

          {/* Left sleeve tip gradient */}
          <linearGradient id={`${uid}-stl`} gradientUnits="userSpaceOnUse" x1="62" y1="0" x2="0" y2="0">
            <stop offset="0%"   stopColor="#000" stopOpacity="0"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0.28"/>
          </linearGradient>

          {/* Right sleeve tip gradient */}
          <linearGradient id={`${uid}-str`} gradientUnits="userSpaceOnUse" x1="218" y1="0" x2={VW} y2="0">
            <stop offset="0%"   stopColor="#000" stopOpacity="0"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0.28"/>
          </linearGradient>

          {/* Shoulder highlight */}
          <radialGradient id={`${uid}-shoulder`} gradientUnits="userSpaceOnUse" cx="140" cy="52" r="160">
            <stop offset="0%"   stopColor="#fff" stopOpacity="0.18"/>
            <stop offset="50%"  stopColor="#fff" stopOpacity="0.04"/>
            <stop offset="100%" stopColor="#fff" stopOpacity="0"/>
          </radialGradient>
        </defs>

        {/* ── 1. BASE FILL ────────────────────────────────────────────────────── */}
        <path d={body} fill={color}/>

        {/* ── 2. COTTON WEAVE TEXTURE (subtle pattern) ───────────────────────── */}
        <path d={body} fill={`url(#${uid}-cotton)`} opacity={isLight ? '1' : '0.5'}/>

        {/* ── 3. TURBULENCE FABRIC TEXTURE ───────────────────────────────────── */}
        <path d={body} fill={color} opacity="0.22" filter={`url(#${uid}-fab)`}/>

        {/* ── 4. SHADING GRADIENTS ────────────────────────────────────────────── */}
        {/* Side shadows */}
        <rect x="0" y="0" width={VW} height={VH}
          fill={`url(#${uid}-sides)`} clipPath={`url(#${uid}-clip)`}/>
        {/* Top-bottom shading */}
        <rect x="0" y="0" width={VW} height={VH}
          fill={`url(#${uid}-topbot)`} clipPath={`url(#${uid}-clip)`}/>
        {/* Chest radial highlight */}
        <rect x="0" y="0" width={VW} height={VH}
          fill={`url(#${uid}-chest)`} clipPath={`url(#${uid}-clip)`}/>
        {/* Shoulder specular highlight */}
        <rect x="0" y="0" width={VW} height="130"
          fill={`url(#${uid}-shoulder)`} clipPath={`url(#${uid}-clip)`}/>

        {/* ── 5. SLEEVE TIP SHADOWS ───────────────────────────────────────────── */}
        <rect x="0" y="78" width="64" height="94"
          fill={`url(#${uid}-stl)`} clipPath={`url(#${uid}-clip)`}/>
        <rect x="216" y="78" width="64" height="94"
          fill={`url(#${uid}-str)`} clipPath={`url(#${uid}-clip)`}/>

        {/* ── 6. ARMHOLE DEPTH SHADOWS ────────────────────────────────────────── */}
        {/* These simulate the concave shadow of the armhole opening */}
        <ellipse cx="60" cy="154" rx="24" ry="18"
          fill="rgba(0,0,0,0.20)" clipPath={`url(#${uid}-clip)`}/>
        <ellipse cx="220" cy="154" rx="24" ry="18"
          fill="rgba(0,0,0,0.20)" clipPath={`url(#${uid}-clip)`}/>

        {/* ── 7. INNER EDGE SHADOW (gives fabric thickness / 3D rim) ──────────── */}
        <path d={body} fill="none"
          stroke="rgba(0,0,0,0.18)"
          strokeWidth="11"
          strokeLinejoin="round"
          clipPath={`url(#${uid}-clip)`}/>

        {/* ── 8. WRINKLE / DRAPE LINES ────────────────────────────────────────── */}
        <g fill="none" stroke={wrinkleColor} strokeWidth="1.4" strokeLinecap="round">
          {wrinkles.map((d, i) => <path key={i} d={d}/>)}
        </g>

        {/* ── 9. SEAM LINES ───────────────────────────────────────────────────── */}
        <g fill="none" stroke={seamColor} strokeWidth="0.9" strokeLinecap="round">
          {/* Shoulder seams */}
          <path d="M 104,50 C 95,44 78,58 68,67"/>
          <path d="M 176,50 C 185,44 202,58 212,67"/>
          {/* Armhole seam curves */}
          <path d="M 36,168 C 44,164 52,159 60,152"/>
          <path d="M 244,168 C 236,164 228,159 220,152"/>
          {/* Side seams */}
          <path d="M 60,152 C 57,200 57,262 60,316"/>
          <path d="M 220,152 C 223,200 223,262 220,316"/>
          {/* Double-stitch bottom hem */}
          <path d="M 72,328 L 208,328"/>
          <path d="M 73,324 L 207,324"/>
          {/* Sleeve hems */}
          <path d="M 9,163 L 36,168"/>
          <path d="M 271,163 L 244,168"/>
          {/* Neck center line (subtle) */}
          <line x1="140" y1="67" x2="140" y2="86" strokeOpacity="0.5"/>
        </g>

        {/* ── 10. V-NECK EDGE DETAIL ──────────────────────────────────────────── */}
        {typeId === 'vneck' && side === 'front' && (
          <g fill="none">
            {/* Shadow edge of V */}
            <line x1="104" y1="50" x2="140" y2="112"
              stroke={isLight ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.06)'}
              strokeWidth="1.5"/>
            <line x1="176" y1="50" x2="140" y2="112"
              stroke={isLight ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.06)'}
              strokeWidth="1.5"/>
            {/* Highlight edge of V (offset 1px) */}
            <line x1="105" y1="52" x2="141" y2="114"
              stroke={isLight ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.07)'}
              strokeWidth="0.8"/>
            <line x1="175" y1="52" x2="139" y2="114"
              stroke={isLight ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.07)'}
              strokeWidth="0.8"/>
          </g>
        )}

        {/* ── 11. COLLAR BAND ─────────────────────────────────────────────────── */}
        {collar && (() => {
          const collarHighlightPath = typeId === 'polo' && side === 'front'
            ? `M 100,49 C 112,36 126,30 140,30 C 154,30 168,36 180,49`
            : `M 104,50 C 115,39 127,33 140,33 C 153,33 165,39 176,50`;
          const collarInnerPath = typeId === 'polo' && side === 'front'
            ? `M 102,57 C 114,48 127,44 140,44 C 153,44 166,48 178,57`
            : `M 104,50 C 115,61 127,67 140,67 C 153,67 165,61 176,50`;
          return (
            <>
              {/* 11a. Collar base fill (slightly darker than shirt) */}
              <path d={collar} fill={darkCol}/>

              {/* 11b. Collar shading from top */}
              <path d={collar} fill={`url(#${uid}-topbot)`} opacity="0.6"
                clipPath={`url(#${uid}-cclip)`}/>

              {/* 11c. Rib texture lines (knit appearance) */}
              <path d={collar} fill={`url(#${uid}-rib)`} opacity="0.7"
                clipPath={`url(#${uid}-cclip)`}/>

              {/* 11d. Inner shadow (collar folded fabric depth) */}
              <path d={collar} fill="none"
                stroke="rgba(0,0,0,0.22)" strokeWidth="4"
                clipPath={`url(#${uid}-cclip)`}/>

              {/* 11e. Outer highlight (top edge catches light) */}
              <path d={collarHighlightPath} fill="none"
                stroke={isLight ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.22)'}
                strokeWidth="1.2"/>

              {/* 11f. Inner collar shadow edge */}
              <path d={collarInnerPath} fill="none"
                stroke="rgba(0,0,0,0.18)" strokeWidth="1"/>
            </>
          );
        })()}

        {/* ── 12. POLO PLACKET + BUTTONS ──────────────────────────────────────── */}
        {polo && (
          <>
            {/* Placket fill */}
            <path d={POLO_PLACKET} fill={darkCol2}/>
            {/* Placket shading */}
            <path d={POLO_PLACKET} fill={`url(#${uid}-topbot)`} opacity="0.4"/>
            {/* Placket rib texture */}
            <path d={POLO_PLACKET} fill={`url(#${uid}-rib)`} opacity="0.5"/>
            {/* Placket side lines */}
            <line x1="130" y1="49" x2="130" y2="110"
              stroke={isLight ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.08)'}
              strokeWidth="0.9"/>
            <line x1="150" y1="49" x2="150" y2="110"
              stroke={isLight ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.08)'}
              strokeWidth="0.9"/>
            {/* Buttons with shine */}
            {POLO_BTNS.map((b, i) => (
              <g key={i}>
                <circle cx={b.cx} cy={b.cy} r="4.2" fill={darken(color, -70)}/>
                <circle cx={b.cx} cy={b.cy} r="3.2" fill="rgba(0,0,0,0.35)"/>
                <circle cx={b.cx} cy={b.cy} r="2.4" fill={darken(color, -55)}/>
                {/* Button shine dot */}
                <circle cx={b.cx - 0.9} cy={b.cy - 0.9} r="0.7" fill="rgba(255,255,255,0.30)"/>
                {/* Button thread holes */}
                <circle cx={b.cx - 1.0} cy={b.cy - 1.0} r="0.45" fill="rgba(0,0,0,0.50)"/>
                <circle cx={b.cx + 1.0} cy={b.cy + 1.0} r="0.45" fill="rgba(0,0,0,0.50)"/>
              </g>
            ))}
          </>
        )}

        {/* ── 13. OUTER EDGE HIGHLIGHT (very subtle top rim light) ────────────── */}
        <path d={body} fill="none"
          stroke={isLight ? 'rgba(255,255,255,0.50)' : 'rgba(255,255,255,0.08)'}
          strokeWidth="0.7" strokeLinejoin="round"/>

        {/* ── 14. OUTER OUTLINE (subtle dark edge) ────────────────────────────── */}
        <path d={body} fill="none"
          stroke={outlineColor}
          strokeWidth="1.5" strokeLinejoin="round"/>

        {/* ── 15. SIDE LABEL ──────────────────────────────────────────────────── */}
        <text
          x={VW / 2} y={VH - 5}
          textAnchor="middle"
          fill={isLight ? 'rgba(0,0,0,0.20)' : 'rgba(255,255,255,0.22)'}
          fontSize="7" fontFamily="'Inter',sans-serif"
          letterSpacing="3" fontWeight="700"
        >
          {side.toUpperCase()}
        </text>
      </svg>

      {/* ── Print area indicator ─────────────────────────────────────────────── */}
      {(showPrintArea || designImage) && (
        <div style={{
          position: 'absolute', zIndex: 2,
          left: pLeft, top: pTop, width: pW, height: pH,
          border: `1.5px dashed ${designImage ? 'rgba(201,150,122,0.45)' : 'rgba(201,150,122,0.72)'}`,
          borderRadius: 6,
          pointerEvents: 'none',
          boxSizing: 'border-box',
        }}>
          {!designImage && (
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:8, color:'rgba(201,150,122,0.5)', fontFamily:'sans-serif', letterSpacing:1.5, fontWeight:700 }}>
                PRINT AREA
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Design overlay + resize handles ─────────────────────────────────── */}
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
            {/* Selection outline */}
            <div style={{
              position: 'absolute', inset: -3,
              border: '1.5px dashed rgba(201,150,122,0.6)',
              borderRadius: 4, pointerEvents: 'none',
            }} />

            {/* Design image */}
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
                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.38))',
              }}
            />

            {/* Corner resize handles */}
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
                  boxShadow: '0 1px 5px rgba(0,0,0,0.5)',
                }}
              />
            ))}
          </div>
        );
      })()}
    </div>
  );
}
