import { useState, useEffect, useRef, lazy, Suspense, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../../shared/api/axios';
import { uploadAPI } from '../../../shared/api/upload.service';
import { designAPI } from '../../marketplace/services/design.service';
import { useCart } from '../../../shared/context/CartContext';
import { Spinner } from '../../../shared/components/Spinner';
import { SHIRT_TYPE_IDS, SHIRT_TYPE_META } from '../utils/shirtShapes';
import { DesignDragOverlay } from '../components/DesignDragOverlay';

const ShirtViewer3D = lazy(() =>
  import('../components/ShirtViewer3D').then(m => ({ default: m.ShirtViewer3D }))
);

// ── Shirt SVG previews (full-body, readable at larger sizes) ─────────────────
const SHIRT_SVG = {
  [SHIRT_TYPE_IDS.PLAIN_TSHIRT]: (
    <svg viewBox="0 0 100 110" fill="currentColor" className="w-full h-full drop-shadow-sm">
      <path d="M38 10 L22 26 L8 20 L13 50 L24 50 L24 100 L76 100 L76 50 L87 50 L92 20 L78 26 L62 10 C59 18 41 18 38 10Z" />
    </svg>
  ),
  [SHIRT_TYPE_IDS.POLO]: (
    <svg viewBox="0 0 100 110" fill="currentColor" className="w-full h-full drop-shadow-sm">
      <path d="M38 10 L22 26 L8 20 L13 50 L24 50 L24 100 L76 100 L76 50 L87 50 L92 20 L78 26 L62 10 C60 6 55 5 50 12 C45 5 40 6 38 10Z" />
      <rect x="47" y="12" width="6" height="24" rx="2" fill="rgba(0,0,0,0.18)" />
      <circle cx="50" cy="17" r="1.5" fill="rgba(0,0,0,0.25)" />
      <circle cx="50" cy="23" r="1.5" fill="rgba(0,0,0,0.25)" />
      <circle cx="50" cy="29" r="1.5" fill="rgba(0,0,0,0.25)" />
    </svg>
  ),
  [SHIRT_TYPE_IDS.VNECK]: (
    <svg viewBox="0 0 100 110" fill="currentColor" className="w-full h-full drop-shadow-sm">
      <path d="M38 10 L22 26 L8 20 L13 50 L24 50 L24 100 L76 100 L76 50 L87 50 L92 20 L78 26 L62 10 L50 46 Z" />
    </svg>
  ),
};

// Quick placement positions (normalized 0-1 in chest zone)
const QUICK_POSITIONS = [
  { label: '↖', title: 'Top Left',     x: 0.2,  y: 0.82 },
  { label: '↑', title: 'Top Center',   x: 0.5,  y: 0.82 },
  { label: '↗', title: 'Top Right',    x: 0.8,  y: 0.82 },
  { label: '←', title: 'Mid Left',     x: 0.2,  y: 0.55 },
  { label: '⊙', title: 'Center',       x: 0.5,  y: 0.55 },
  { label: '→', title: 'Mid Right',    x: 0.8,  y: 0.55 },
  { label: '↙', title: 'Bottom Left',  x: 0.2,  y: 0.28 },
  { label: '↓', title: 'Bottom Center',x: 0.5,  y: 0.28 },
  { label: '↘', title: 'Bottom Right', x: 0.8,  y: 0.28 },
];

const STEPS = [
  { id: 1, label: 'Product',  hint: 'Select shirt style, color & size'  },
  { id: 2, label: 'Design',   hint: 'Upload or choose a design'         },
  { id: 3, label: 'Review',   hint: 'Set quantity & place your order'   },
];

const DESIGN_TABS = [
  { id: 'upload',      label: 'Upload Design', icon: '⬆' },
  { id: 'marketplace', label: 'Marketplace',   icon: '🛍' },
  { id: 'none',        label: 'Plain Shirt',   icon: '👕' },
];

// ── Tiny components ─────────────────────────────────────────────────────────

function StepIndicator({ current, onStepClick, maxReached }) {
  return (
    <div className="flex items-center gap-0 w-full max-w-sm mx-auto mb-6">
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? '1' : 'initial' }}>
          <button
            onClick={() => s.id <= maxReached && onStepClick(s.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
              current === s.id
                ? 'text-white shadow-lg'
                : s.id < current
                ? 'text-[#C9967A] cursor-pointer hover:text-white'
                : 'text-white/25 cursor-default'
            }`}
            style={current === s.id ? {
              background: 'linear-gradient(135deg,#6B4226,#8B5A3C)',
              boxShadow: '0 4px 14px rgba(107,66,38,0.4)',
            } : {}}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              s.id < current
                ? 'bg-[#6B4226]/60 text-[#C9967A]'
                : current === s.id
                ? 'bg-white/20 text-white'
                : 'bg-white/5 text-white/25'
            }`}>
              {s.id < current ? '✓' : s.id}
            </span>
            <span className="hidden sm:inline">{s.label}</span>
          </button>
          {i < STEPS.length - 1 && (
            <div className="flex-1 mx-1.5">
              <div className={`h-px transition-all duration-300 ${s.id < current ? 'bg-[#6B4226]/60' : 'bg-white/10'}`} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Card({ children, className = '' }) {
  return (
    <div className={`rounded-2xl p-5 ${className}`}
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="text-xs font-semibold tracking-widest uppercase text-white/40 mb-3">{children}</p>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function CustomizePage() {
  const navigate    = useNavigate();
  const { state }   = useLocation();
  const { addItem } = useCart();
  const orbitRef    = useRef(null);

  // Step
  const [step,       setStep]       = useState(1);
  const [maxReached, setMaxReached] = useState(1);

  // Config
  const [config,  setConfig]  = useState(null);
  const [cfgLoad, setCfgLoad] = useState(true);

  // Shirt options
  const [typeId, setTypeId] = useState(SHIRT_TYPE_IDS.PLAIN_TSHIRT);
  const [color,  setColor]  = useState({ name: 'White', hex: '#FFFFFF' });
  const [size,   setSize]   = useState('M');
  const [qty,    setQty]    = useState(1);

  // Design
  const [designTab,    setDesignTab]    = useState('upload');
  const [designUrl,    setDesignUrl]    = useState('');
  const [localPreview, setLocalPreview] = useState('');
  const [designNote,   setDesignNote]   = useState('');
  const [designPrice,  setDesignPrice]  = useState(0);
  const [uploading,    setUploading]    = useState(false);
  const [uploadPct,    setUploadPct]    = useState(0);
  const [selectedMkt,  setSelectedMkt]  = useState(null);
  const [mktDesigns,   setMktDesigns]   = useState([]);
  const [mktLoading,   setMktLoading]   = useState(false);
  const [dragOver,     setDragOver]     = useState(false);

  // 3D design transform (normalised 0–1)
  const [dX,     setDX]     = useState(0.5);
  const [dY,     setDY]     = useState(0.55);
  const [dScale, setDScale] = useState(1.0);
  const [dRot,   setDRot]   = useState(0);

  // 3D viewer state
  const [viewerHovered, setViewerHovered] = useState(false);

  // Size guide modal
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  // ── Config load ──────────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/shirt-config')
      .then(r => {
        const cfg = r.data.config;
        setConfig(cfg);
        const first = cfg.shirtTypes?.find(t => t.enabled);
        if (first) setTypeId(first.id);
        if (cfg.colors?.length)  setColor(cfg.colors[0]);
        if (cfg.sizes?.length && !cfg.sizes.includes('M')) setSize(cfg.sizes[0]);
      })
      .catch(() => toast.error('Failed to load configuration.'))
      .finally(() => setCfgLoad(false));
  }, []);

  // Pre-fill design from marketplace navigation
  useEffect(() => {
    const pre = state?.selectedDesign || state?.preSelectedDesign;
    if (pre) {
      setDesignTab('marketplace');
      setSelectedMkt(pre);
      setDesignUrl(pre.imageUrl);
      setDesignPrice(pre.price || 0);
      setStep(2);
      setMaxReached(s => Math.max(s, 2));
    }
  }, [state]);

  // Load marketplace designs
  useEffect(() => {
    if (designTab === 'marketplace' && mktDesigns.length === 0) {
      setMktLoading(true);
      designAPI.getApproved({ limit: 24 })
        .then(r => setMktDesigns(r.data.designs || []))
        .catch(() => toast.error('Failed to load designs.'))
        .finally(() => setMktLoading(false));
    }
  }, [designTab, mktDesigns.length]);

  // ── Pricing ──────────────────────────────────────────────────────────────
  const sizePricingMap = config?.sizePricing instanceof Map
    ? Object.fromEntries(config.sizePricing)
    : (config?.sizePricing || {});

  const unitPrice = () => {
    const base  = config?.basePrice || 0;
    const extra = sizePricingMap[size] || 0;
    return Math.round(base + extra + designPrice);
  };
  const lineTotal = () => Math.round(unitPrice() * qty);

  const activeDesignImg = designTab === 'none' ? null : (localPreview || designUrl || null);

  // ── File upload ──────────────────────────────────────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target?.files?.[0] || e;
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG, or WEBP files.'); return;
    }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max file size is 5 MB.'); return; }

    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);
    setDesignUrl('');
    setSelectedMkt(null);
    setDesignPrice(0);
    setUploading(true);
    setUploadPct(0);

    try {
      const res = await uploadAPI.uploadDesign(file, p => setUploadPct(p));
      setDesignUrl(res.data.url);
      toast.success('Design uploaded!');
    } catch {
      toast.error('Upload failed. Please try again.');
      setLocalPreview('');
    } finally {
      setUploading(false);
      setUploadPct(0);
    }
    if (e.target) e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileChange(file);
  };

  const clearDesign = () => {
    setDesignUrl(''); setLocalPreview(''); setSelectedMkt(null); setDesignPrice(0);
  };

  const handleSelectMkt = (d) => {
    setSelectedMkt(d);
    setDesignUrl(d.imageUrl);
    setDesignPrice(d.price || 0);
    setLocalPreview('');
    toast.success(`"${d.title}" selected`);
  };

  // ── Step navigation ──────────────────────────────────────────────────────
  const goToStep = useCallback((n) => {
    setStep(n);
    setMaxReached(m => Math.max(m, n));
  }, []);

  const handleNext = () => goToStep(Math.min(step + 1, 3));
  const handleBack = () => goToStep(Math.max(step - 1, 1));

  // ── Add to Cart ──────────────────────────────────────────────────────────
  const handleAddToCart = () => {
    if (!config) return;
    const typeMeta = SHIRT_TYPE_META[typeId];
    addItem({
      productId:    'custom',
      productName:  `${typeMeta?.label || 'Custom Shirt'} (Custom)`,
      shirtType:    typeMeta?.label || typeId,
      shirtTypeId:  typeId,
      color:        color.name,
      colorHex:     color.hex,
      size,
      quantity:     qty,
      unitPrice:    unitPrice(),
      designUrl:    designUrl || null,
      designId:     selectedMkt?._id   || null,
      designNote,
      designTitle:  selectedMkt?.title || null,
      designPrice,
      designTransform: activeDesignImg
        ? { x: dX, y: dY, scale: dScale, rotation: dRot }
        : null,
      image: activeDesignImg || null,
    });
    toast.success('Added to cart!');
    navigate('/cart');
  };

  // ── Loading states ───────────────────────────────────────────────────────
  if (cfgLoad) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" className="text-ink-brown" />
    </div>
  );
  if (!config) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-10 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-white/50 mb-4">Customization settings unavailable.</p>
        <button onClick={() => navigate('/')} className="btn-primary px-8">← Back to Home</button>
      </div>
    </div>
  );

  const enabledTypes = config.shirtTypes?.filter(t => t.enabled) || [];

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pt-20 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Page header */}
        <div className="text-center mb-8">
          <p className="text-xs tracking-widest uppercase text-ink-brown mb-1.5">Design Studio</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
            Create Your Custom Shirt
          </h1>
          <p className="text-white/35 text-sm mt-2">
            Real-time 3D preview · Drag to position your design
          </p>
        </div>

        {/* Step indicator */}
        <StepIndicator current={step} onStepClick={goToStep} maxReached={maxReached} />

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-6 items-start">

          {/* ── LEFT: 3D Viewer (sticky) ─────────────────────────────── */}
          <div className="sticky top-20">
            {/* Viewer container */}
            <div
              className="rounded-3xl overflow-hidden relative"
              style={{
                background:  '#0d0d0d',
                border:      '1px solid rgba(255,255,255,0.08)',
                aspectRatio: '1',
              }}
              onMouseEnter={() => setViewerHovered(true)}
              onMouseLeave={() => setViewerHovered(false)}
            >
              <Suspense fallback={
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                  style={{ background: '#0d0d0d' }}>
                  <Spinner size="lg" className="text-ink-brown" />
                  <p className="text-white/30 text-xs">Loading 3D viewer…</p>
                </div>
              }>
                <ShirtViewer3D
                  typeId={typeId}
                  color={color.hex}
                  designImage={activeDesignImg}
                  designX={dX}
                  designY={dY}
                  designScale={dScale}
                  designRot={dRot}
                  orbitRef={orbitRef}
                  autoRotate={!viewerHovered && step !== 2}
                  showPrintArea={step === 2 && !activeDesignImg}
                />
              </Suspense>

              {/* Design drag overlay */}
              <DesignDragOverlay
                designImage={activeDesignImg}
                designX={dX}
                designY={dY}
                designScale={dScale}
                designRot={dRot}
                onPositionChange={(x, y) => { setDX(x); setDY(y); }}
                orbitRef={orbitRef}
              />

              {/* Context badge */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none"
                style={{
                  background:    'rgba(0,0,0,0.6)',
                  backdropFilter:'blur(8px)',
                  border:        '1px solid rgba(255,255,255,0.08)',
                  borderRadius:  20,
                  padding:       '4px 14px',
                }}>
                {activeDesignImg ? (
                  <p className="text-white/45 text-xs">Drag design · Scroll to zoom · Rotate to inspect</p>
                ) : step === 2 ? (
                  <p className="text-[#8B5A3C] text-xs">Print area shown — add a design to place it</p>
                ) : (
                  <p className="text-white/35 text-xs">Scroll to zoom · Click &amp; drag to rotate</p>
                )}
              </div>
            </div>

            {/* Price bar */}
            <div className="mt-3 rounded-2xl px-5 py-4 flex items-center justify-between"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div>
                <p className="text-white/35 text-xs mb-0.5">Unit price</p>
                <p className="font-display text-2xl font-bold text-white leading-none">
                  PKR {unitPrice().toLocaleString()}
                </p>
                {designPrice > 0 && (
                  <p className="text-white/25 text-xs mt-1">
                    inc. PKR {Math.round(designPrice).toLocaleString()} design fee
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-white/35 text-xs mb-0.5">×{qty} items</p>
                <p className="font-display text-xl font-semibold text-[#C9967A] leading-none">
                  PKR {lineTotal().toLocaleString()}
                </p>
              </div>
            </div>

            {/* Current selections summary (desktop) */}
            <div className="hidden lg:flex mt-3 gap-2 flex-wrap">
              <Pill color={color.hex}>{color.name}</Pill>
              <Pill>{SHIRT_TYPE_META[typeId]?.label || typeId}</Pill>
              <Pill>Size {size}</Pill>
              {activeDesignImg && <Pill accent>Design added</Pill>}
            </div>
          </div>

          {/* ── RIGHT: Step content ──────────────────────────────────── */}
          <div>
            <AnimatePresence mode="wait">

              {/* ━━ STEP 1: Product ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              {step === 1 && (
                <motion.div key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-4"
                >
                  <StepHeading n={1} title="Choose Your Shirt" subtitle="Pick a style, color, and size" />

                  {/* Shirt type */}
                  <Card>
                    <SectionLabel>Shirt Style</SectionLabel>
                    {enabledTypes.length === 0 ? (
                      <p className="text-white/30 text-sm">No shirt types available.</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-3">
                        {enabledTypes.map(t => {
                          const meta = SHIRT_TYPE_META[t.id] || { label: t.name, description: '' };
                          const sel  = typeId === t.id;
                          return (
                            <motion.button
                              key={t.id}
                              onClick={() => setTypeId(t.id)}
                              whileTap={{ scale: 0.96 }}
                              className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-200 group"
                              style={{
                                border:     sel ? '2px solid rgba(107,66,38,0.9)' : '1.5px solid rgba(255,255,255,0.08)',
                                background: sel ? 'rgba(107,66,38,0.18)' : 'rgba(255,255,255,0.02)',
                              }}
                            >
                              <div className="w-16 h-20 flex items-center justify-center"
                                style={{ color: sel ? '#C9967A' : 'rgba(255,255,255,0.25)' }}>
                                {SHIRT_SVG[t.id]}
                              </div>
                              <div className="text-center">
                                <p className="text-xs font-semibold leading-tight"
                                  style={{ color: sel ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                                  {meta.label}
                                </p>
                                <p className="text-[10px] mt-0.5 leading-tight"
                                  style={{ color: sel ? 'rgba(201,150,122,0.8)' : 'rgba(255,255,255,0.25)' }}>
                                  {meta.description}
                                </p>
                              </div>
                              {sel && (
                                <div className="w-4 h-4 rounded-full flex items-center justify-center"
                                  style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
                                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                  </svg>
                                </div>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    )}
                  </Card>

                  {/* Color */}
                  {config.colors?.length > 0 && (
                    <Card>
                      <SectionLabel>Color</SectionLabel>
                      <div className="flex flex-wrap gap-2.5 mb-3">
                        {config.colors.map((c, i) => (
                          <button
                            key={i}
                            onClick={() => setColor(c)}
                            title={c.name}
                            className="transition-all duration-150"
                            style={{
                              width:      36,
                              height:     36,
                              borderRadius: '50%',
                              background: c.hex,
                              border:     color.name === c.name
                                ? '3px solid #8B5A3C'
                                : '2px solid rgba(255,255,255,0.12)',
                              boxShadow:  color.name === c.name
                                ? '0 0 0 3px rgba(107,66,38,0.35)'
                                : 'none',
                              flexShrink: 0,
                            }}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color.hex, border: '1px solid rgba(255,255,255,0.2)' }} />
                        <p className="text-white text-sm font-medium">{color.name}</p>
                      </div>
                    </Card>
                  )}

                  {/* Size */}
                  {config.sizes?.length > 0 && (
                    <Card>
                      <div className="flex items-center justify-between mb-3">
                        <SectionLabel>Size</SectionLabel>
                        <button
                          onClick={() => setShowSizeGuide(true)}
                          className="text-xs text-[#C9967A] hover:text-white transition-colors flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4.5 7.5h15a2.25 2.25 0 010 4.5h-15a2.25 2.25 0 010-4.5z" />
                          </svg>
                          Size Guide
                        </button>
                      </div>
                      <div className="grid grid-cols-6 gap-2">
                        {config.sizes.map(s => {
                          const extra = sizePricingMap[s];
                          const sel   = size === s;
                          return (
                            <button
                              key={s}
                              onClick={() => setSize(s)}
                              className="flex flex-col items-center justify-center py-2.5 rounded-xl text-xs font-semibold transition-all duration-150"
                              style={sel
                                ? { background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', color: '#fff', border: '1.5px solid transparent' }
                                : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.55)', border: '1.5px solid rgba(255,255,255,0.08)' }
                              }
                            >
                              <span>{s}</span>
                              {extra ? <span className="text-[9px] mt-0.5 opacity-70">+{extra}</span> : null}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-white/30 text-xs mt-2">
                        Selected: <span className="text-white">{size}</span>
                        {sizePricingMap[size] ? <span className="text-[#C9967A]"> (+PKR {sizePricingMap[size].toLocaleString()})</span> : null}
                      </p>
                    </Card>
                  )}

                  <NavButtons onNext={handleNext} nextLabel="Continue to Design →" />
                </motion.div>
              )}

              {/* ━━ STEP 2: Design ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              {step === 2 && (
                <motion.div key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-4"
                >
                  <StepHeading n={2} title="Add Your Design" subtitle="Upload an image or choose from the marketplace" />

                  {/* Design source tabs */}
                  <Card>
                    <div className="flex gap-1 p-1 rounded-xl mb-4"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      {DESIGN_TABS.map(t => (
                        <button
                          key={t.id}
                          onClick={() => setDesignTab(t.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-150"
                          style={designTab === t.id
                            ? { background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', color: '#fff' }
                            : { color: 'rgba(255,255,255,0.4)' }
                          }
                        >
                          <span>{t.icon}</span>
                          <span className="hidden sm:inline">{t.label}</span>
                        </button>
                      ))}
                    </div>

                    <AnimatePresence mode="wait">

                      {/* Upload tab */}
                      {designTab === 'upload' && (
                        <motion.div key="upload"
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                          <label
                            className="block cursor-pointer"
                            onDrop={handleDrop}
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                          >
                            <input type="file" accept="image/jpeg,image/png,image/webp"
                              onChange={handleFileChange} className="hidden" />
                            <div
                              className="relative w-full rounded-2xl overflow-hidden transition-all duration-200"
                              style={{
                                paddingBottom: '55%',
                                border: dragOver
                                  ? '2px dashed rgba(139,90,60,0.8)'
                                  : '2px dashed rgba(107,66,38,0.35)',
                                background: dragOver
                                  ? 'rgba(107,66,38,0.1)'
                                  : 'rgba(107,66,38,0.04)',
                              }}
                            >
                              <div className="absolute inset-0 flex items-center justify-center">
                                {uploading ? (
                                  <div className="flex flex-col items-center gap-3 px-6 w-full">
                                    <Spinner size="md" className="text-ink-brown" />
                                    <div className="w-full max-w-xs">
                                      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                                        <motion.div
                                          className="h-full rounded-full"
                                          style={{ background: 'linear-gradient(90deg,#6B4226,#8B5A3C)' }}
                                          animate={{ width: `${uploadPct}%` }}
                                          transition={{ duration: 0.2 }}
                                        />
                                      </div>
                                      <p className="text-white/35 text-xs text-center mt-1.5">{uploadPct}% uploaded</p>
                                    </div>
                                  </div>
                                ) : (localPreview || designUrl) ? (
                                  <div className="flex flex-col items-center gap-2 p-4">
                                    <div className="relative">
                                      <img src={localPreview || designUrl} alt="Design preview"
                                        className="max-h-28 object-contain rounded-xl shadow-lg" />
                                      <div className="absolute inset-0 rounded-xl ring-2 ring-[#8B5A3C]/40" />
                                    </div>
                                    <p className="text-white/40 text-xs">Click to replace</p>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center gap-4 p-6 text-center">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                                      style={{ background: 'rgba(107,66,38,0.15)', border: '1px solid rgba(107,66,38,0.3)' }}>
                                      <svg className="w-7 h-7 text-[#8B5A3C]" fill="none" stroke="currentColor"
                                        strokeWidth="1.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round"
                                          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                      </svg>
                                    </div>
                                    <div>
                                      <p className="text-white/70 text-sm font-semibold">
                                        {dragOver ? 'Drop your file here' : 'Click or drag to upload'}
                                      </p>
                                      <p className="text-white/30 text-xs mt-1">JPG, PNG, WEBP · Max 5 MB</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </label>
                          {(localPreview || designUrl) && !uploading && (
                            <button onClick={clearDesign}
                              className="text-xs text-white/25 hover:text-red-400 transition-colors mt-2 flex items-center gap-1">
                              <span>×</span> Remove design
                            </button>
                          )}
                        </motion.div>
                      )}

                      {/* Marketplace tab */}
                      {designTab === 'marketplace' && (
                        <motion.div key="marketplace"
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                          {selectedMkt && (
                            <div className="mb-3 p-3 rounded-xl flex items-center gap-3"
                              style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)' }}>
                              <img src={selectedMkt.imageUrl} alt="" className="w-12 h-12 object-contain rounded-lg flex-shrink-0"
                                style={{ background: 'rgba(255,255,255,0.05)' }} />
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">"{selectedMkt.title}"</p>
                                <p className="text-emerald-400/70 text-xs">
                                  {selectedMkt.price === 0 ? 'Free' : `+PKR ${Math.round(selectedMkt.price).toLocaleString()}`}
                                </p>
                              </div>
                              <button onClick={clearDesign}
                                className="text-white/30 hover:text-white transition-colors text-xs px-2 py-1 rounded-lg hover:bg-white/5">
                                Change
                              </button>
                            </div>
                          )}

                          {mktLoading ? (
                            <div className="flex justify-center py-8">
                              <Spinner size="md" className="text-ink-brown" />
                            </div>
                          ) : mktDesigns.length === 0 ? (
                            <div className="text-center py-8">
                              <p className="text-white/30 text-sm">No approved designs yet.</p>
                              <button onClick={() => setDesignTab('upload')}
                                className="text-[#C9967A] text-xs mt-2 hover:text-white transition-colors">
                                Upload your own →
                              </button>
                            </div>
                          ) : (
                            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1 custom-scroll">
                              {mktDesigns.map(d => (
                                <button
                                  key={d._id}
                                  onClick={() => handleSelectMkt(d)}
                                  className="relative group rounded-xl overflow-hidden transition-all duration-150"
                                  style={{
                                    aspectRatio: '1',
                                    border: selectedMkt?._id === d._id
                                      ? '2px solid rgba(139,90,60,0.9)'
                                      : '1.5px solid rgba(255,255,255,0.06)',
                                    background: 'rgba(255,255,255,0.03)',
                                  }}
                                >
                                  <img src={d.imageUrl} alt={d.title}
                                    className="w-full h-full object-contain p-2"
                                    style={{ background: 'rgba(255,255,255,0.04)' }}
                                  />
                                  {selectedMkt?._id === d._id && (
                                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center"
                                      style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
                                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                      </svg>
                                    </div>
                                  )}
                                  <div className="absolute inset-x-0 bottom-0 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                                    <p className="text-white text-[9px] truncate">{d.title}</p>
                                    <p className="text-[#C9967A] text-[9px]">
                                      {d.price === 0 ? 'Free' : `+PKR ${Math.round(d.price)}`}
                                    </p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}

                      {/* Plain shirt */}
                      {designTab === 'none' && (
                        <motion.div key="none"
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="flex flex-col items-center gap-3 py-8 text-center">
                          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                            style={{ background: 'rgba(107,66,38,0.12)', border: '1px solid rgba(107,66,38,0.2)' }}>
                            <span className="text-3xl">👕</span>
                          </div>
                          <div>
                            <p className="text-white/60 text-sm font-semibold">Plain shirt — no print</p>
                            <p className="text-white/25 text-xs mt-1">Your shirt will be made without any design.</p>
                          </div>
                        </motion.div>
                      )}

                    </AnimatePresence>
                  </Card>

                  {/* Design placement controls — shown when a design is active */}
                  <AnimatePresence>
                    {activeDesignImg && (
                      <motion.div
                        key="placement"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <Card>
                          <SectionLabel>Position & Scale</SectionLabel>

                          {/* Quick position grid */}
                          <div className="mb-4">
                            <p className="text-white/35 text-xs mb-2">Quick position</p>
                            <div className="grid grid-cols-3 gap-1.5 w-full max-w-[180px]">
                              {QUICK_POSITIONS.map(pos => (
                                <button
                                  key={pos.title}
                                  onClick={() => { setDX(pos.x); setDY(pos.y); }}
                                  title={pos.title}
                                  className="h-9 rounded-lg text-sm font-medium transition-all duration-150 hover:text-white"
                                  style={{
                                    background: (Math.abs(dX - pos.x) < 0.05 && Math.abs(dY - pos.y) < 0.05)
                                      ? 'rgba(107,66,38,0.5)'
                                      : 'rgba(255,255,255,0.05)',
                                    border: (Math.abs(dX - pos.x) < 0.05 && Math.abs(dY - pos.y) < 0.05)
                                      ? '1.5px solid rgba(139,90,60,0.7)'
                                      : '1.5px solid rgba(255,255,255,0.08)',
                                    color: (Math.abs(dX - pos.x) < 0.05 && Math.abs(dY - pos.y) < 0.05)
                                      ? '#fff' : 'rgba(255,255,255,0.4)',
                                  }}
                                >
                                  {pos.label}
                                </button>
                              ))}
                            </div>
                            <p className="text-white/20 text-[10px] mt-1.5">Or drag the design directly on the shirt</p>
                          </div>

                          {/* Scale */}
                          <div className="space-y-1.5 mb-3">
                            <div className="flex justify-between text-xs">
                              <span className="text-white/40">Scale</span>
                              <span className="text-white font-medium">{dScale.toFixed(2)}×</span>
                            </div>
                            <input type="range" min="0.3" max="2.2" step="0.05"
                              value={dScale}
                              onChange={e => setDScale(parseFloat(e.target.value))}
                              className="w-full accent-ink-brown" />
                            <div className="flex justify-between text-[10px] text-white/20">
                              <span>Small</span><span>Large</span>
                            </div>
                          </div>

                          {/* Rotation */}
                          <div className="space-y-1.5 mb-3">
                            <div className="flex justify-between text-xs">
                              <span className="text-white/40">Rotation</span>
                              <span className="text-white font-medium">{dRot}°</span>
                            </div>
                            <input type="range" min="-180" max="180" step="1"
                              value={dRot}
                              onChange={e => setDRot(parseInt(e.target.value))}
                              className="w-full accent-ink-brown" />
                            <div className="flex justify-between text-[10px] text-white/20">
                              <span>−180°</span><span>0°</span><span>+180°</span>
                            </div>
                          </div>

                          {/* Reset + Remove */}
                          <div className="flex items-center justify-between mt-1">
                            <button
                              onClick={() => { setDX(0.5); setDY(0.55); setDScale(1.0); setDRot(0); }}
                              className="text-xs text-white/30 hover:text-white/60 transition-colors flex items-center gap-1">
                              ↺ Reset position
                            </button>
                            <button onClick={clearDesign}
                              className="text-xs text-white/25 hover:text-red-400 transition-colors flex items-center gap-1">
                              × Remove design
                            </button>
                          </div>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <NavButtons onBack={handleBack} onNext={handleNext} nextLabel="Continue to Review →" />
                </motion.div>
              )}

              {/* ━━ STEP 3: Review & Order ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              {step === 3 && (
                <motion.div key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-4"
                >
                  <StepHeading n={3} title="Review Your Order" subtitle="Check everything and set quantity" />

                  {/* Order summary */}
                  <Card>
                    <SectionLabel>Order Summary</SectionLabel>
                    <div className="space-y-3">
                      <SummaryRow label="Shirt" value={SHIRT_TYPE_META[typeId]?.label || typeId} />
                      <SummaryRow label="Color">
                        <div className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ background: color.hex, border: '1px solid rgba(255,255,255,0.15)' }} />
                          <span className="text-white text-sm">{color.name}</span>
                        </div>
                      </SummaryRow>
                      <SummaryRow label="Size" value={size} />
                      <SummaryRow label="Design">
                        {activeDesignImg ? (
                          <div className="flex items-center gap-2">
                            <img src={activeDesignImg} alt="" className="w-8 h-8 object-contain rounded-lg flex-shrink-0"
                              style={{ background: 'rgba(255,255,255,0.06)' }} />
                            <span className="text-white text-sm">
                              {selectedMkt?.title || 'Custom upload'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-white/40 text-sm">None (plain)</span>
                        )}
                      </SummaryRow>
                    </div>
                  </Card>

                  {/* Quantity */}
                  <Card>
                    <SectionLabel>Quantity</SectionLabel>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setQty(q => Math.max(1, q - 1))}
                        className="w-10 h-10 rounded-xl font-bold text-white/70 hover:text-white transition-all flex items-center justify-center text-xl"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)' }}
                      >−</button>
                      <span className="font-display text-2xl font-bold text-white w-8 text-center">{qty}</span>
                      <button
                        onClick={() => setQty(q => q + 1)}
                        className="w-10 h-10 rounded-xl font-bold text-white/70 hover:text-white transition-all flex items-center justify-center text-xl"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)' }}
                      >+</button>
                      <span className="text-white/35 text-sm ml-2">
                        {qty > 1 ? `PKR ${unitPrice().toLocaleString()} × ${qty}` : ''}
                      </span>
                    </div>
                  </Card>

                  {/* Placement notes */}
                  <Card>
                    <SectionLabel>Placement Notes <span className="normal-case text-white/20 font-normal tracking-normal">(optional)</span></SectionLabel>
                    <textarea
                      rows={2}
                      className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 resize-none focus:outline-none focus:ring-1 focus:ring-[#6B4226] transition-all"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
                      value={designNote}
                      onChange={e => setDesignNote(e.target.value)}
                      placeholder="e.g. Centre chest, 20×20 cm, 3 cm from collar…"
                    />
                    <p className="text-white/20 text-xs mt-1.5">
                      Instructions for our print team.
                    </p>
                  </Card>

                  {/* Price breakdown */}
                  <Card>
                    <SectionLabel>Price Breakdown</SectionLabel>
                    <div className="space-y-2">
                      <PriceRow label="Base price" value={config.basePrice} />
                      {sizePricingMap[size] > 0 && (
                        <PriceRow label={`Size surcharge (${size})`} value={sizePricingMap[size]} />
                      )}
                      {designPrice > 0 && (
                        <PriceRow label="Design fee" value={designPrice} />
                      )}
                      <div className="border-t border-white/10 pt-2 mt-2">
                        <PriceRow label="Unit price" value={unitPrice()} highlight />
                      </div>
                      <PriceRow label={`Quantity ×${qty}`} value={lineTotal()} highlight bold />
                    </div>
                  </Card>

                  {/* CTA */}
                  <motion.button
                    onClick={handleAddToCart}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-4 rounded-2xl font-display font-semibold text-base flex items-center justify-center gap-3"
                    style={{
                      background:  'linear-gradient(135deg,#6B4226,#8B5A3C)',
                      color:       '#fff',
                      boxShadow:   '0 8px 28px rgba(107,66,38,0.5)',
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
                    </svg>
                    Add to Cart — PKR {lineTotal().toLocaleString()}
                  </motion.button>

                  <button onClick={handleBack}
                    className="w-full py-2.5 rounded-xl text-sm text-white/35 hover:text-white/60 transition-colors">
                    ← Back to Design
                  </button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Size Guide Modal */}
      <AnimatePresence>
        {showSizeGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowSizeGuide(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="rounded-3xl p-6 w-full max-w-md"
              style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.1)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display text-lg font-bold text-white">Size Guide</h3>
                <button onClick={() => setShowSizeGuide(false)} className="text-white/40 hover:text-white transition-colors text-xl">×</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 text-white/50 font-medium">Size</th>
                      <th className="text-center py-2 text-white/50 font-medium">Chest (cm)</th>
                      <th className="text-center py-2 text-white/50 font-medium">Length (cm)</th>
                      <th className="text-center py-2 text-white/50 font-medium">Shoulder (cm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { s: 'XS',  chest: '84–89',  len: '66',  sh: '41' },
                      { s: 'S',   chest: '89–94',  len: '69',  sh: '43' },
                      { s: 'M',   chest: '94–99',  len: '72',  sh: '45' },
                      { s: 'L',   chest: '99–104', len: '74',  sh: '47' },
                      { s: 'XL',  chest: '104–109',len: '76',  sh: '49' },
                      { s: 'XXL', chest: '109–114',len: '78',  sh: '51' },
                    ].filter(r => !config.sizes || config.sizes.includes(r.s)).map(r => (
                      <tr key={r.s} className="border-b border-white/5"
                        style={{ background: size === r.s ? 'rgba(107,66,38,0.12)' : 'transparent' }}>
                        <td className="py-2.5 font-semibold" style={{ color: size === r.s ? '#C9967A' : 'rgba(255,255,255,0.7)' }}>{r.s}</td>
                        <td className="py-2.5 text-center text-white/60">{r.chest}</td>
                        <td className="py-2.5 text-center text-white/60">{r.len}</td>
                        <td className="py-2.5 text-center text-white/60">{r.sh}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-white/25 text-xs mt-4">Measurements are approximate. For best fit, measure a well-fitting shirt you own.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Small helper components ──────────────────────────────────────────────────

function StepHeading({ n, title, subtitle }) {
  return (
    <div className="mb-1">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
          {n}
        </div>
        <h2 className="font-display text-lg font-bold text-white">{title}</h2>
      </div>
      <p className="text-white/35 text-sm ml-8">{subtitle}</p>
    </div>
  );
}

function NavButtons({ onBack, onNext, nextLabel = 'Continue →' }) {
  return (
    <div className="flex gap-3 pt-1">
      {onBack && (
        <button
          onClick={onBack}
          className="px-5 py-3 rounded-xl text-sm font-medium text-white/50 hover:text-white transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.09)' }}
        >
          ← Back
        </button>
      )}
      {onNext && (
        <motion.button
          onClick={onNext}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
          className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', boxShadow: '0 4px 16px rgba(107,66,38,0.35)' }}
        >
          {nextLabel}
        </motion.button>
      )}
    </div>
  );
}

function Pill({ children, color, accent }) {
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
      style={{
        background: accent ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
        border: accent ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(255,255,255,0.08)',
        color: accent ? 'rgba(74,222,128,0.9)' : 'rgba(255,255,255,0.55)',
      }}
    >
      {color && <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color, border: '1px solid rgba(255,255,255,0.15)' }} />}
      {children}
    </div>
  );
}

function SummaryRow({ label, value, children }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/40 text-sm">{label}</span>
      {children || <span className="text-white text-sm font-medium">{value}</span>}
    </div>
  );
}

function PriceRow({ label, value, highlight, bold }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${bold ? 'font-semibold text-white' : 'text-white/40'}`}>{label}</span>
      <span className={`text-sm font-${bold ? 'bold' : 'medium'} ${highlight ? (bold ? 'text-[#C9967A]' : 'text-white') : 'text-white'}`}>
        PKR {Math.round(value).toLocaleString()}
      </span>
    </div>
  );
}
