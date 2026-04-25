import { useRef, useState, useCallback, useEffect } from 'react';

// ViewBox matches the container's exact 3:4 aspect-ratio — shirt fills the frame
const VW = 300;
const VH = 400;

// Print area sits squarely on the body panel, well below the armhole
const PRINT_AREA = {
  front: { x: 0.302, y: 0.390, w: 0.396, h: 0.330 },
  back:  { x: 0.302, y: 0.345, w: 0.396, h: 0.375 },
};

const BASE_SIZE = 86;

// ─── Silhouette paths (size-M flat-lay, 300×400 canvas) ──────────────────────
//  Shirt occupies x 4..296 (sleeves) and y 38..390 (collar-top to hem).
//  Body panel: x 70..230, y 140..382.  Collar ring: 88 px wide, 38 px tall.
//  Each sleeve: 62 px horizontal reach, 46 px cuff opening.

const BODY_CREW =
  'M 106,60 ' +
  'C 92,52 70,60 56,72 ' +         // left shoulder slope (S-curve outward-down)
  'C 40,80 18,90 8,106 ' +         // sleeve upper outer edge sweeps out
  'C 2,122 2,138 6,156 ' +         // sleeve tip rounds at outer corner
  'L 8,168 ' +                     // sleeve outer bottom edge
  'C 16,176 28,180 50,176 ' +      // cuff band: wide inner rounded corner
  'C 62,170 70,158 70,142 ' +      // armhole: concave arc rising back to body
  'L 70,374 ' +                    // left body side seam (straight)
  'C 70,382 76,388 86,388 ' +      // left hem rounded corner
  'L 214,388 ' +                   // bottom hem
  'C 224,388 230,382 230,374 ' +   // right hem corner
  'L 230,142 ' +                   // right body side seam
  'C 230,158 238,170 250,176 ' +   // right armhole concave mirror
  'C 272,180 284,176 292,168 ' +   // right cuff inner rounded corner
  'L 294,156 ' +                   // right sleeve outer bottom
  'C 298,138 298,122 292,106 ' +   // right sleeve tip rounds
  'C 282,90 260,80 244,72 ' +      // right sleeve upper outer
  'C 230,60 208,52 194,60 ' +      // right shoulder slope
  'C 184,70 170,78 150,78 ' +      // right collar arc
  'C 130,78 116,70 106,60 Z';      // left collar arc

const BODY_VNECK =
  'M 106,60 ' +
  'C 92,52 70,60 56,72 ' +
  'C 40,80 18,90 8,106 ' +
  'C 2,122 2,138 6,156 ' +
  'L 8,168 ' +
  'C 16,176 28,180 50,176 ' +
  'C 62,170 70,158 70,142 ' +
  'L 70,374 ' +
  'C 70,382 76,388 86,388 ' +
  'L 214,388 ' +
  'C 224,388 230,382 230,374 ' +
  'L 230,142 ' +
  'C 230,158 238,170 250,176 ' +
  'C 272,180 284,176 292,168 ' +
  'L 294,156 ' +
  'C 298,138 298,122 292,106 ' +
  'C 282,90 260,80 244,72 ' +
  'C 230,60 208,52 194,60 ' +
  'L 150,124 L 106,60 Z';          // V-point replaces collar arc

// Crew collar ring — projects above the body attachment line
const COLLAR_CREW =
  'M 106,60 C 116,44 130,38 150,38 C 170,38 184,44 194,60 ' +
  'C 184,70 170,78 150,78 C 130,78 116,70 106,60 Z';

// Polo collar — wider, flatter open-front band
const COLLAR_POLO =
  'M 102,58 C 114,42 130,36 150,36 C 170,36 186,42 198,58 ' +
  'L 196,70 C 184,60 168,56 150,56 C 132,56 116,60 104,70 Z';

const POLO_PLACKET = 'M 141,58 L 141,128 L 159,128 L 159,58 Z';
const POLO_BTNS = [{ cx: 150, cy: 76 }, { cx: 150, cy: 94 }, { cx: 150, cy: 112 }];

// Fabric wrinkle paths — anchored at collar, armhole, and lower-body stress points
const WRINKLES_FRONT = [
  'M 128,90 C 134,112 132,136 128,154',
  'M 172,90 C 166,112 168,136 172,154',
  'M 86,182 C 80,200 78,220 82,238',
  'M 214,182 C 220,200 222,220 218,238',
  'M 130,258 C 134,278 132,300 128,318',
  'M 170,258 C 166,278 168,300 172,318',
  'M 104,322 C 110,338 108,354 104,368',
  'M 196,322 C 190,338 192,354 196,368',
];

const WRINKLES_BACK = [
  'M 128,90 C 134,112 132,136 128,154',
  'M 172,90 C 166,112 168,136 172,154',
  'M 86,182 C 80,200 78,222 82,240',
  'M 214,182 C 220,200 222,222 218,240',
  'M 128,262 C 132,284 130,308 126,324',
  'M 172,262 C 168,284 170,308 174,324',
  'M 102,328 C 108,346 106,362 102,376',
  'M 198,328 C 192,346 194,362 198,376',
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
  const f = hex.replace('#', '');
  const p = f.length === 3 ? f.split('').map(c => c + c).join('') : f;
  const n = parseInt(p, 16) || 0;
  return `rgb(${Math.max(0, Math.min(255, (n >> 16) + amt))},${Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amt))},${Math.max(0, Math.min(255, (n & 0xff) + amt))})`;
}
function getLum(hex) {
  const f = hex.replace('#', '');
  const p = f.length === 3 ? f.split('').map(c => c + c).join('') : f;
  const n = parseInt(p, 16) || 0;
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
  mockupUrl      = null,
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
    const ro = new ResizeObserver(([e]) =>
      setDim({ w: e.contentRect.width, h: e.contentRect.height })
    );
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

  const startDrag = useCallback((cx, cy) => {
    if (!onDesignMove) return;
    dragging.current = true;
    drag0.current = { mx: cx, my: cy, dx: designX, dy: designY };
  }, [onDesignMove, designX, designY]);

  const moveDrag = useCallback((cx, cy) => {
    if (!dragging.current || !onDesignMove) return;
    onDesignMove(
      Math.max(0, Math.min(1, drag0.current.dx + (cx - drag0.current.mx) / pW)),
      Math.max(0, Math.min(1, drag0.current.dy + (cy - drag0.current.my) / pH))
    );
  }, [onDesignMove, pW, pH]);

  const endDrag = useCallback(() => { dragging.current = false; }, []);

  const startResize = useCallback((cx, sign) => {
    if (!onDesignResize) return;
    resizing.current = true;
    resize0.current = { mx: cx, initScale: designScale, initHalfW: dSize / 2, sign };
  }, [onDesignResize, designScale, dSize]);

  const moveResize = useCallback((cx) => {
    if (!resizing.current || !onDesignResize) return;
    const { mx, initScale, initHalfW, sign } = resize0.current;
    const hw = initHalfW + (cx - mx) * sign;
    if (hw < 10) return;
    onDesignResize(Math.max(0.3, Math.min(2.5, initScale * hw / initHalfW)));
  }, [onDesignResize]);

  const endResize = useCallback(() => { resizing.current = false; }, []);

  useEffect(() => {
    const mm = (e) => { moveDrag(e.clientX, e.clientY); moveResize(e.clientX); };
    const mu = () => { endDrag(); endResize(); };
    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup',  mu);
    return () => { window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); };
  }, [moveDrag, endDrag, moveResize, endResize]);

  // ── Visual constants ────────────────────────────────────────────────────────
  const { body, collar, polo } = getShirtDef(typeId, side);
  const uid     = `sv-${typeId.replace(/-/g, '')}-${side}`;
  const lum     = getLum(color);
  const isLight = lum > 148;
  const darkCol  = darken(color, -40);
  const darkCol2 = darken(color, -22);
  const wrinkles = side === 'back' ? WRINKLES_BACK : WRINKLES_FRONT;
  const sc = isLight ? 'rgba(0,0,0,' : 'rgba(255,255,255,';
  const seamC    = `${sc}${isLight ? 0.10 : 0.06})`;
  const wrinkleC = `${sc}${isLight ? 0.06 : 0.035})`;
  const outlineC = `${sc}${isLight ? 0.30 : 0.15})`;

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', height: '100%', userSelect: 'none' }}>

      {/* Ground ellipse shadow */}
      <div style={{
        position: 'absolute', bottom: `${oy}px`, left: '50%',
        transform: 'translateX(-50%)',
        width: `${sw * 0.60}px`, height: '22px', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }}/>

      {/* ════════════════════════════════════════════════════════════════════════
          MAIN SVG  (300 × 400 viewBox — matches container 3:4 aspect ratio)
          ════════════════════════════════════════════════════════════════════ */}
      <svg viewBox={`0 0 ${VW} ${VH}`} xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'absolute', left: ox, top: oy, width: sw, height: sh,
                 display: 'block', zIndex: 1, overflow: 'visible' }}>
        <defs>
          {/* ── Drop-shadow filter for the whole shirt ── */}
          <filter id={`${uid}-drop`} x="-10%" y="-5%" width="120%" height="118%">
            <feDropShadow dx="0" dy="5" stdDeviation="8" floodColor="#000" floodOpacity="0.60"/>
          </filter>

          {/* ── Fabric turbulence (woven-cotton appearance) ── */}
          <filter id={`${uid}-fab`} x="-2%" y="-2%" width="104%" height="104%"
            colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.68 0.58" numOctaves="4"
              seed="19" result="noise"/>
            <feColorMatrix in="noise" type="saturate" values="0" result="gray"/>
            <feBlend in="SourceGraphic" in2="gray" mode="multiply" result="blnd"/>
            <feComposite in="blnd" in2="SourceGraphic" operator="in"/>
          </filter>

          {/* ── Micro-displacement for surface irregularity ── */}
          <filter id={`${uid}-disp`} x="-2%" y="-2%" width="104%" height="104%">
            <feTurbulence type="turbulence" baseFrequency="0.035 0.028"
              numOctaves="3" seed="7" result="t"/>
            <feDisplacementMap in="SourceGraphic" in2="t" scale="2.2"
              xChannelSelector="R" yChannelSelector="G"/>
          </filter>

          {/* ── Collar rib knit pattern ── */}
          <pattern id={`${uid}-rib`} x="0" y="0" width={VW} height="3"
            patternUnits="userSpaceOnUse">
            <rect width={VW} height="1.5" fill="rgba(0,0,0,0.10)"/>
          </pattern>

          {/* ── Woven cotton grid ── */}
          <pattern id={`${uid}-wv`} x="0" y="0" width="4.5" height="4.5"
            patternUnits="userSpaceOnUse">
            <rect width="4.5" height="4.5" fill="none"/>
            <rect width="4.5" height="2.25" fill="rgba(0,0,0,0.028)"/>
            <rect width="2.25" height="4.5" fill="rgba(0,0,0,0.018)"/>
          </pattern>

          {/* ── Clip paths ── */}
          <clipPath id={`${uid}-clip`}><path d={body}/></clipPath>
          {collar && <clipPath id={`${uid}-cclip`}><path d={collar}/></clipPath>}

          {/* ══ Gradients ══════════════════════════════════════════════════════ */}

          {/* Side vignette — darkens left & right edges strongly */}
          <linearGradient id={`${uid}-sides`} gradientUnits="userSpaceOnUse"
            x1="0" y1="0" x2={VW} y2="0">
            <stop offset="0%"   stopColor="#000" stopOpacity="0.48"/>
            <stop offset="10%"  stopColor="#000" stopOpacity="0.14"/>
            <stop offset="28%"  stopColor="#fff" stopOpacity="0.07"/>
            <stop offset="50%"  stopColor="#fff" stopOpacity="0.03"/>
            <stop offset="72%"  stopColor="#fff" stopOpacity="0.07"/>
            <stop offset="90%"  stopColor="#000" stopOpacity="0.14"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0.46"/>
          </linearGradient>

          {/* Top-to-bottom lighting */}
          <linearGradient id={`${uid}-topbot`} gradientUnits="userSpaceOnUse"
            x1="0" y1="0" x2="0" y2={VH}>
            <stop offset="0%"   stopColor="#fff" stopOpacity="0.24"/>
            <stop offset="14%"  stopColor="#fff" stopOpacity="0.09"/>
            <stop offset="42%"  stopColor="#000" stopOpacity="0.00"/>
            <stop offset="76%"  stopColor="#000" stopOpacity="0.10"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0.30"/>
          </linearGradient>

          {/* Center-chest radial highlight (primary light source) */}
          <radialGradient id={`${uid}-chest`} gradientUnits="userSpaceOnUse"
            cx="150" cy="248" r="168">
            <stop offset="0%"   stopColor="#fff" stopOpacity="0.24"/>
            <stop offset="30%"  stopColor="#fff" stopOpacity="0.07"/>
            <stop offset="65%"  stopColor="#000" stopOpacity="0.04"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0.18"/>
          </radialGradient>

          {/* Strong radial edge vignette — primary depth cue */}
          <radialGradient id={`${uid}-vign`} gradientUnits="userSpaceOnUse"
            cx="150" cy="240" r="210">
            <stop offset="0%"   stopColor="#000" stopOpacity="0.00"/>
            <stop offset="50%"  stopColor="#000" stopOpacity="0.03"/>
            <stop offset="75%"  stopColor="#000" stopOpacity="0.22"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0.58"/>
          </radialGradient>

          {/* Shoulder/collar specular (upper-front key light) */}
          <radialGradient id={`${uid}-key`} gradientUnits="userSpaceOnUse"
            cx="150" cy="60" r="210">
            <stop offset="0%"   stopColor="#fff" stopOpacity="0.26"/>
            <stop offset="38%"  stopColor="#fff" stopOpacity="0.07"/>
            <stop offset="100%" stopColor="#fff" stopOpacity="0.00"/>
          </radialGradient>

          {/* Left sleeve outer shadow gradient */}
          <linearGradient id={`${uid}-stl`} gradientUnits="userSpaceOnUse"
            x1="72" y1="0" x2="0" y2="0">
            <stop offset="0%"   stopColor="#000" stopOpacity="0.00"/>
            <stop offset="55%"  stopColor="#000" stopOpacity="0.18"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0.46"/>
          </linearGradient>

          {/* Right sleeve outer shadow gradient */}
          <linearGradient id={`${uid}-str`} gradientUnits="userSpaceOnUse"
            x1="228" y1="0" x2={VW} y2="0">
            <stop offset="0%"   stopColor="#000" stopOpacity="0.00"/>
            <stop offset="55%"  stopColor="#000" stopOpacity="0.18"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0.46"/>
          </linearGradient>

          {/* Sleeve panel ambient (sleeves face slightly away from camera) */}
          <linearGradient id={`${uid}-slvL`} gradientUnits="userSpaceOnUse"
            x1="72" y1="0" x2="0" y2="0">
            <stop offset="0%"   stopColor="#000" stopOpacity="0.00"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0.16"/>
          </linearGradient>
          <linearGradient id={`${uid}-slvR`} gradientUnits="userSpaceOnUse"
            x1="228" y1="0" x2={VW} y2="0">
            <stop offset="0%"   stopColor="#000" stopOpacity="0.00"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0.16"/>
          </linearGradient>

          {/* Side-seam groove shadow (seam ridge dips below fabric surface) */}
          <linearGradient id={`${uid}-smL`} gradientUnits="userSpaceOnUse"
            x1="62" y1="0" x2="80" y2="0">
            <stop offset="0%"   stopColor="#000" stopOpacity="0.00"/>
            <stop offset="50%"  stopColor="#000" stopOpacity="0.22"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0.00"/>
          </linearGradient>
          <linearGradient id={`${uid}-smR`} gradientUnits="userSpaceOnUse"
            x1="220" y1="0" x2="238" y2="0">
            <stop offset="0%"   stopColor="#000" stopOpacity="0.00"/>
            <stop offset="50%"  stopColor="#000" stopOpacity="0.22"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0.00"/>
          </linearGradient>

          {/* Underarm fold — fabric bunches where sleeve meets body */}
          <radialGradient id={`${uid}-uaL`} gradientUnits="userSpaceOnUse"
            cx="70" cy="168" r="28">
            <stop offset="0%"   stopColor="#000" stopOpacity="0.36"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0.00"/>
          </radialGradient>
          <radialGradient id={`${uid}-uaR`} gradientUnits="userSpaceOnUse"
            cx="230" cy="168" r="28">
            <stop offset="0%"   stopColor="#000" stopOpacity="0.36"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0.00"/>
          </radialGradient>

          {/* Collar cast-shadow strip on chest */}
          <linearGradient id={`${uid}-csh`} gradientUnits="userSpaceOnUse"
            x1="0" y1="78" x2="0" y2="122">
            <stop offset="0%"   stopColor="#000" stopOpacity="0.30"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0.00"/>
          </linearGradient>

          {/* Hem fold shadow */}
          <linearGradient id={`${uid}-hem`} gradientUnits="userSpaceOnUse"
            x1="0" y1="365" x2="0" y2="388">
            <stop offset="0%"   stopColor="#000" stopOpacity="0.00"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0.26"/>
          </linearGradient>

          {/* Cuff fold shadow */}
          <linearGradient id={`${uid}-cuf`} gradientUnits="userSpaceOnUse"
            x1="0" y1="160" x2="0" y2="182">
            <stop offset="0%"   stopColor="#000" stopOpacity="0.00"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0.22"/>
          </linearGradient>
        </defs>

        {/* ══════════════════════════════════════════════════════════════════════
            PAINT LAYERS  (bottom → top)
            ══════════════════════════════════════════════════════════════════ */}

        {mockupUrl ? (
          /* ── Mockup image mode: admin-uploaded PNG replaces SVG rendering ── */
          <>
            <image
              href={mockupUrl}
              x="0" y="0"
              width={VW} height={VH}
              preserveAspectRatio="xMidYMid meet"
              filter={`url(#${uid}-drop)`}
            />
            <text x={VW / 2} y={VH - 8} textAnchor="middle"
              fill="rgba(255,255,255,0.22)"
              fontSize="7" fontFamily="'Inter',sans-serif"
              letterSpacing="4.5" fontWeight="700">
              {side.toUpperCase()}
            </text>
          </>
        ) : (
          /* ── SVG rendering mode: 27-layer procedural shirt ── */
          <>

        {/* 1 ─ Base fill + realistic drop-shadow */}
        <path d={body} fill={color} filter={`url(#${uid}-drop)`}/>

        {/* 2 ─ Woven cotton grid texture */}
        <path d={body} fill={`url(#${uid}-wv)`} opacity={isLight ? '1' : '0.6'}/>

        {/* 3 ─ Fabric noise (fractal cotton weave) */}
        <path d={body} fill={color} opacity="0.32" filter={`url(#${uid}-fab)`}/>

        {/* 4 ─ Primary lighting gradients */}
        <rect x="0" y="0" width={VW} height={VH}
          fill={`url(#${uid}-sides)`}  clipPath={`url(#${uid}-clip)`}/>
        <rect x="0" y="0" width={VW} height={VH}
          fill={`url(#${uid}-topbot)`} clipPath={`url(#${uid}-clip)`}/>
        <rect x="0" y="0" width={VW} height={VH}
          fill={`url(#${uid}-chest)`}  clipPath={`url(#${uid}-clip)`}/>
        <rect x="0" y="0" width={VW} height="160"
          fill={`url(#${uid}-key)`}    clipPath={`url(#${uid}-clip)`}/>

        {/* 5 ─ Radial edge vignette — most important depth cue */}
        <rect x="0" y="0" width={VW} height={VH}
          fill={`url(#${uid}-vign)`} clipPath={`url(#${uid}-clip)`}/>

        {/* 6 ─ Sleeve panel ambient shading (sleeves tilt away from light) */}
        <rect x="0"   y="50" width="74" height="138"
          fill={`url(#${uid}-slvL)`} clipPath={`url(#${uid}-clip)`}/>
        <rect x="226" y="50" width="74" height="138"
          fill={`url(#${uid}-slvR)`} clipPath={`url(#${uid}-clip)`}/>

        {/* 7 ─ Sleeve outer-edge deep shadow */}
        <rect x="0"   y="62" width="74" height="122"
          fill={`url(#${uid}-stl)`} clipPath={`url(#${uid}-clip)`}/>
        <rect x="226" y="62" width="74" height="122"
          fill={`url(#${uid}-str)`} clipPath={`url(#${uid}-clip)`}/>

        {/* 8 ─ Cuff-fold shadow */}
        <rect x="0" y="160" width={VW} height="22"
          fill={`url(#${uid}-cuf)`} clipPath={`url(#${uid}-clip)`}/>

        {/* 9 ─ Armhole concave depth shadow (double ellipse) */}
        <ellipse cx="70"  cy="160" rx="32" ry="28" fill="rgba(0,0,0,0.32)" clipPath={`url(#${uid}-clip)`}/>
        <ellipse cx="230" cy="160" rx="32" ry="28" fill="rgba(0,0,0,0.32)" clipPath={`url(#${uid}-clip)`}/>
        <ellipse cx="70"  cy="156" rx="16" ry="14" fill="rgba(0,0,0,0.22)" clipPath={`url(#${uid}-clip)`}/>
        <ellipse cx="230" cy="156" rx="16" ry="14" fill="rgba(0,0,0,0.22)" clipPath={`url(#${uid}-clip)`}/>

        {/* 10 ─ Underarm fold crease */}
        <rect x="0" y="140" width={VW} height="58"
          fill={`url(#${uid}-uaL)`} clipPath={`url(#${uid}-clip)`}/>
        <rect x="0" y="140" width={VW} height="58"
          fill={`url(#${uid}-uaR)`} clipPath={`url(#${uid}-clip)`}/>

        {/* 11 ─ Side-seam groove */}
        <rect x="62"  y="140" width="18" height="238" fill={`url(#${uid}-smL)`} clipPath={`url(#${uid}-clip)`}/>
        <rect x="220" y="140" width="18" height="238" fill={`url(#${uid}-smR)`} clipPath={`url(#${uid}-clip)`}/>

        {/* 12 ─ Shoulder-cap crease line (shadow + highlight pair) */}
        <path d="M 92,76 C 80,90 68,106 62,124"
          fill="none" stroke="rgba(0,0,0,0.20)" strokeWidth="5" strokeLinecap="round"
          clipPath={`url(#${uid}-clip)`}/>
        <path d="M 208,76 C 220,90 232,106 238,124"
          fill="none" stroke="rgba(0,0,0,0.20)" strokeWidth="5" strokeLinecap="round"
          clipPath={`url(#${uid}-clip)`}/>
        <path d="M 90,74 C 78,88 66,104 60,122"
          fill="none"
          stroke={isLight ? 'rgba(255,255,255,0.40)' : 'rgba(255,255,255,0.14)'}
          strokeWidth="1.4" strokeLinecap="round"
          clipPath={`url(#${uid}-clip)`}/>
        <path d="M 210,74 C 222,88 234,104 240,122"
          fill="none"
          stroke={isLight ? 'rgba(255,255,255,0.40)' : 'rgba(255,255,255,0.14)'}
          strokeWidth="1.4" strokeLinecap="round"
          clipPath={`url(#${uid}-clip)`}/>

        {/* 13 ─ Collar cast-shadow on chest */}
        <rect x="70" y="78" width="160" height="44"
          fill={`url(#${uid}-csh)`} clipPath={`url(#${uid}-clip)`}/>

        {/* 14 ─ Hem fold shadow */}
        <rect x="70" y="365" width="160" height="23"
          fill={`url(#${uid}-hem)`} clipPath={`url(#${uid}-clip)`}/>

        {/* 15 ─ Inner-rim fabric-thickness shadow (gives 3D edge) */}
        <path d={body} fill="none" stroke="rgba(0,0,0,0.26)" strokeWidth="16"
          strokeLinejoin="round" clipPath={`url(#${uid}-clip)`}/>

        {/* 16 ─ Micro surface displacement */}
        <path d={body} fill={color} opacity="0.10" filter={`url(#${uid}-disp)`}/>

        {/* 17 ─ Wrinkle / drape lines */}
        <g fill="none" stroke={wrinkleC} strokeWidth="1.7" strokeLinecap="round">
          {wrinkles.map((d, i) => <path key={i} d={d}/>)}
        </g>

        {/* 18 ─ Seam relief underlay (thick dark stroke — makes seams look recessed) */}
        <g fill="none"
          stroke={isLight ? 'rgba(0,0,0,0.11)' : 'rgba(0,0,0,0.18)'}
          strokeWidth="4" strokeLinecap="round">
          <path d="M 106,60 C 92,52 70,60 56,72"/>
          <path d="M 194,60 C 208,52 230,60 244,72"/>
          <path d="M 50,176 C 62,170 70,158 70,142"/>
          <path d="M 250,176 C 238,170 230,158 230,142"/>
          <path d="M 70,142 L 70,374"/>
          <path d="M 230,142 L 230,374"/>
          <path d="M 8,168 C 16,176 28,180 50,176"/>
          <path d="M 292,168 C 284,176 272,180 250,176"/>
        </g>

        {/* 19 ─ Fine seam stitch lines */}
        <g fill="none" stroke={seamC} strokeWidth="1.1" strokeLinecap="round">
          <path d="M 106,60 C 92,52 70,60 56,72"/>
          <path d="M 194,60 C 208,52 230,60 244,72"/>
          <path d="M 50,176 C 62,170 70,158 70,142"/>
          <path d="M 250,176 C 238,170 230,158 230,142"/>
          <path d="M 70,142 L 70,374"/>
          <path d="M 230,142 L 230,374"/>
          {/* Double-needle hem */}
          <path d="M 86,388 L 214,388"/>
          <path d="M 87,384 L 213,384"/>
          {/* Sleeve cuff double-stitch */}
          <path d="M 8,168 C 16,176 28,180 50,176"/>
          <path d="M 292,168 C 284,176 272,180 250,176"/>
          <path d="M 8,163 C 16,171 28,175 50,171"/>
          <path d="M 292,163 C 284,171 272,175 250,171"/>
          {/* Center neck guideline */}
          <line x1="150" y1="78" x2="150" y2="104" strokeOpacity="0.5"/>
        </g>

        {/* 20 ─ V-neck cut detail */}
        {typeId === 'vneck' && side === 'front' && (
          <g fill="none">
            <line x1="106" y1="60" x2="150" y2="124"
              stroke={isLight ? 'rgba(0,0,0,0.17)' : 'rgba(255,255,255,0.08)'}
              strokeWidth="1.7"/>
            <line x1="194" y1="60" x2="150" y2="124"
              stroke={isLight ? 'rgba(0,0,0,0.17)' : 'rgba(255,255,255,0.08)'}
              strokeWidth="1.7"/>
            <line x1="107" y1="62" x2="151" y2="126"
              stroke={isLight ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.11)'}
              strokeWidth="1.0"/>
            <line x1="193" y1="62" x2="149" y2="126"
              stroke={isLight ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.11)'}
              strokeWidth="1.0"/>
          </g>
        )}

        {/* 21 ─ Collar band */}
        {collar && (() => {
          const isPoloFront = typeId === 'polo' && side === 'front';
          const topEdge = isPoloFront
            ? 'M 102,58 C 114,42 130,36 150,36 C 170,36 186,42 198,58'
            : 'M 106,60 C 116,44 130,38 150,38 C 170,38 184,44 194,60';
          const innerEdge = isPoloFront
            ? 'M 104,70 C 116,60 132,56 150,56 C 168,56 184,60 196,70'
            : 'M 106,60 C 116,70 130,78 150,78 C 170,78 184,70 194,60';
          return (
            <>
              <path d={collar} fill={darkCol}/>
              <path d={collar} fill={`url(#${uid}-topbot)`} opacity="0.7"
                clipPath={`url(#${uid}-cclip)`}/>
              <path d={collar} fill={`url(#${uid}-rib)`} opacity="0.80"
                clipPath={`url(#${uid}-cclip)`}/>
              <path d={collar} fill={`url(#${uid}-wv)`} opacity="0.85"
                clipPath={`url(#${uid}-cclip)`}/>
              <path d={collar} fill="none" stroke="rgba(0,0,0,0.32)" strokeWidth="6"
                clipPath={`url(#${uid}-cclip)`}/>
              <path d={collar} fill={`url(#${uid}-vign)`} opacity="0.6"
                clipPath={`url(#${uid}-cclip)`}/>
              <path d={topEdge} fill="none"
                stroke={isLight ? 'rgba(255,255,255,0.70)' : 'rgba(255,255,255,0.28)'}
                strokeWidth="1.5"/>
              <path d={innerEdge} fill="none"
                stroke="rgba(0,0,0,0.24)" strokeWidth="1.2"/>
            </>
          );
        })()}

        {/* 22 ─ Polo placket + buttons */}
        {polo && (
          <>
            <path d={POLO_PLACKET} fill={darkCol2}/>
            <path d={POLO_PLACKET} fill={`url(#${uid}-topbot)`} opacity="0.55"/>
            <path d={POLO_PLACKET} fill={`url(#${uid}-rib)`}    opacity="0.60"/>
            <line x1="141" y1="58" x2="141" y2="128"
              stroke={isLight ? 'rgba(0,0,0,0.17)' : 'rgba(255,255,255,0.10)'}
              strokeWidth="1.1"/>
            <line x1="159" y1="58" x2="159" y2="128"
              stroke={isLight ? 'rgba(0,0,0,0.17)' : 'rgba(255,255,255,0.10)'}
              strokeWidth="1.1"/>
            {POLO_BTNS.map((b, i) => (
              <g key={i}>
                <circle cx={b.cx} cy={b.cy} r="5"    fill={darken(color, -78)}/>
                <circle cx={b.cx} cy={b.cy} r="3.8"  fill="rgba(0,0,0,0.38)"/>
                <circle cx={b.cx} cy={b.cy} r="2.8"  fill={darken(color, -60)}/>
                <circle cx={b.cx - 1.1} cy={b.cy - 1.1} r="0.85" fill="rgba(255,255,255,0.34)"/>
                <circle cx={b.cx - 1.2} cy={b.cy - 1.2} r="0.52" fill="rgba(0,0,0,0.58)"/>
                <circle cx={b.cx + 1.2} cy={b.cy + 1.2} r="0.52" fill="rgba(0,0,0,0.58)"/>
              </g>
            ))}
          </>
        )}

        {/* 23 ─ Back neck label */}
        {side === 'back' && (
          <g>
            <rect x="138" y="80" width="24" height="14" rx="2"
              fill={isLight ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.28)'}
              stroke={isLight ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.12)'}
              strokeWidth="0.6"/>
            <rect x="141" y="83" width="18" height="8" rx="1"
              fill={darken(color, isLight ? -20 : -12)}/>
            <line x1="146" y1="83.5" x2="146" y2="90.5"
              stroke={isLight ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.22)'}
              strokeWidth="0.7"/>
            <line x1="150" y1="83.5" x2="150" y2="90.5"
              stroke={isLight ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.22)'}
              strokeWidth="0.7"/>
            <line x1="154" y1="83.5" x2="154" y2="90.5"
              stroke={isLight ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.22)'}
              strokeWidth="0.7"/>
          </g>
        )}

        {/* 24 ─ Center fold crease */}
        <line x1="150" y1="78" x2="150" y2="374"
          stroke={isLight ? 'rgba(0,0,0,0.032)' : 'rgba(255,255,255,0.022)'}
          strokeWidth="1.1" strokeDasharray="1.2,5"/>

        {/* 25 ─ Outer rim highlight (top edge catches light) */}
        <path d={body} fill="none"
          stroke={isLight ? 'rgba(255,255,255,0.60)' : 'rgba(255,255,255,0.12)'}
          strokeWidth="0.9" strokeLinejoin="round"/>

        {/* 26 ─ Outer dark contour */}
        <path d={body} fill="none"
          stroke={outlineC} strokeWidth="1.8" strokeLinejoin="round"/>

        {/* 27 ─ FRONT / BACK text */}
        <text x={VW / 2} y={VH - 8} textAnchor="middle"
          fill={isLight ? 'rgba(0,0,0,0.17)' : 'rgba(255,255,255,0.18)'}
          fontSize="7" fontFamily="'Inter',sans-serif"
          letterSpacing="4.5" fontWeight="700">
          {side.toUpperCase()}
        </text>

          </> /* end SVG mode */
        )} {/* end mockupUrl conditional */}
      </svg>

      {/* ── Print area indicator ─────────────────────────────────────────────── */}
      {(showPrintArea || designImage) && (
        <div style={{
          position: 'absolute', zIndex: 2,
          left: pLeft, top: pTop, width: pW, height: pH,
          border: `1.5px dashed ${designImage
            ? 'rgba(201,150,122,0.45)' : 'rgba(201,150,122,0.78)'}`,
          borderRadius: 7, pointerEvents: 'none', boxSizing: 'border-box',
        }}>
          {!designImage && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 8, color: 'rgba(201,150,122,0.58)',
                fontFamily: 'sans-serif', letterSpacing: 1.8, fontWeight: 700 }}>
                PRINT AREA
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Design overlay with drag + corner resize ─────────────────────────── */}
      {designImage && (() => {
        const dH = dSize * imgAspect;
        return (
          <div style={{
            position: 'absolute', zIndex: 3,
            left: dLeft, top: dTop, width: dSize, height: dH,
            transform: `translate(-50%,-50%) rotate(${designRot}deg)`,
            overflow: 'visible',
          }}>
            <div style={{
              position: 'absolute', inset: -3,
              border: '1.5px dashed rgba(201,150,122,0.68)',
              borderRadius: 4, pointerEvents: 'none',
            }}/>
            <img
              src={designImage} alt="Design" draggable={false}
              onLoad={(e) => {
                const { naturalWidth: nw, naturalHeight: nh } = e.currentTarget;
                if (nw > 0) setImgAspect(nh / nw);
              }}
              onMouseDown={(e) => { startDrag(e.clientX, e.clientY); e.preventDefault(); }}
              onTouchStart={(e) => { const t = e.touches[0]; startDrag(t.clientX, t.clientY); e.preventDefault(); }}
              onTouchMove={(e)  => { const t = e.touches[0]; moveDrag(t.clientX, t.clientY); }}
              onTouchEnd={endDrag}
              style={{
                width: '100%', height: '100%',
                objectFit: 'contain', display: 'block',
                cursor: onDesignMove ? 'grab' : 'default',
                userSelect: 'none', WebkitUserDrag: 'none',
                filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.48))',
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
                  position: 'absolute', ...h.pos, transform: h.t,
                  width: 12, height: 12, background: '#fff',
                  border: '2.5px solid #8B5A3C', borderRadius: 2,
                  cursor: h.c, boxShadow: '0 1px 5px rgba(0,0,0,0.55)',
                }}
              />
            ))}
          </div>
        );
      })()}
    </div>
  );
}
