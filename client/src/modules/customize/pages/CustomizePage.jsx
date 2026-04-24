import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../../shared/api/axios';
import { uploadAPI } from '../../../shared/api/upload.service';
import { designAPI } from '../../marketplace/services/design.service';
import { useCart } from '../../../shared/context/CartContext';
import { Spinner } from '../../../shared/components/Spinner';
import { SHIRT_TYPE_IDS, SHIRT_TYPE_META } from '../utils/shirtTypes';
import { ShirtViewer2D } from '../components/ShirtViewer2D';

// ── Shirt SVG thumbnails (for selector) ──────────────────────────────────────
const SHIRT_SVG = {
  [SHIRT_TYPE_IDS.PLAIN_TSHIRT]: (
    <svg viewBox="0 0 100 110" fill="currentColor" className="w-full h-full">
      <path d="M38 10 L22 26 L8 20 L13 50 L24 50 L24 100 L76 100 L76 50 L87 50 L92 20 L78 26 L62 10 C59 18 41 18 38 10Z" />
    </svg>
  ),
  [SHIRT_TYPE_IDS.POLO]: (
    <svg viewBox="0 0 100 110" fill="currentColor" className="w-full h-full">
      <path d="M38 10 L22 26 L8 20 L13 50 L24 50 L24 100 L76 100 L76 50 L87 50 L92 20 L78 26 L62 10 C60 6 55 5 50 12 C45 5 40 6 38 10Z" />
      <rect x="47" y="12" width="6" height="24" rx="2" fill="rgba(0,0,0,0.18)" />
      <circle cx="50" cy="17" r="1.5" fill="rgba(0,0,0,0.28)" />
      <circle cx="50" cy="23" r="1.5" fill="rgba(0,0,0,0.28)" />
      <circle cx="50" cy="29" r="1.5" fill="rgba(0,0,0,0.28)" />
    </svg>
  ),
  [SHIRT_TYPE_IDS.VNECK]: (
    <svg viewBox="0 0 100 110" fill="currentColor" className="w-full h-full">
      <path d="M38 10 L22 26 L8 20 L13 50 L24 50 L24 100 L76 100 L76 50 L87 50 L92 20 L78 26 L62 10 L50 46 Z" />
    </svg>
  ),
};

// Quick placement positions within print area (0-1)
const QUICK_POSITIONS = [
  { label: '↖', title: 'Top Left',      x: 0.18, y: 0.15 },
  { label: '↑', title: 'Top Center',    x: 0.5,  y: 0.15 },
  { label: '↗', title: 'Top Right',     x: 0.82, y: 0.15 },
  { label: '←', title: 'Mid Left',      x: 0.18, y: 0.5  },
  { label: '⊙', title: 'Center',        x: 0.5,  y: 0.5  },
  { label: '→', title: 'Mid Right',     x: 0.82, y: 0.5  },
  { label: '↙', title: 'Bottom Left',   x: 0.18, y: 0.85 },
  { label: '↓', title: 'Bottom Center', x: 0.5,  y: 0.85 },
  { label: '↘', title: 'Bottom Right',  x: 0.82, y: 0.85 },
];

const STEPS = [
  { id: 1, label: 'Product', hint: 'Select shirt style, color & size' },
  { id: 2, label: 'Design',  hint: 'Upload designs for front & back'  },
  { id: 3, label: 'Review',  hint: 'Set quantity & place your order'  },
];

const DESIGN_TABS = [
  { id: 'upload',      label: 'Upload Design', icon: '⬆' },
  { id: 'marketplace', label: 'Marketplace',   icon: '🛍' },
  { id: 'none',        label: 'Plain Shirt',   icon: '👕' },
];

// ── Per-side design state factory ─────────────────────────────────────────────
const initSide = () => ({
  tab:         'upload',
  url:         '',
  localPreview:'',
  mktDesign:   null,
  designPrice: 0,
  x:    0.5,
  y:    0.5,
  scale:    1.0,
  rotation: 0,
});

// ── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ current, onStepClick, maxReached }) {
  return (
    <div className="flex items-center gap-0 w-full max-w-sm mx-auto mb-6">
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? '1' : 'initial' }}>
          <button
            onClick={() => s.id <= maxReached && onStepClick(s.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
              current === s.id ? 'text-white shadow-lg'
                : s.id < current ? 'text-[#C9967A] cursor-pointer hover:text-white'
                : 'text-white/25 cursor-default'
            }`}
            style={current === s.id ? { background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', boxShadow: '0 4px 14px rgba(107,66,38,0.4)' } : {}}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              s.id < current ? 'bg-[#6B4226]/60 text-[#C9967A]'
                : current === s.id ? 'bg-white/20 text-white'
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
  return <p className="text-xs font-semibold tracking-widest uppercase text-white/40 mb-3">{children}</p>;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CustomizePage() {
  const navigate    = useNavigate();
  const { state }   = useLocation();
  const { addItem } = useCart();

  // Steps
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

  // 2D viewer side
  const [activeSide, setActiveSide] = useState('front');

  // Per-side design state
  const [front, setFront] = useState(initSide);
  const [back,  setBack]  = useState(initSide);

  // Shared upload state
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [dragOver,  setDragOver]  = useState(false);

  // Marketplace designs (shared between both sides)
  const [mktDesigns, setMktDesigns] = useState([]);
  const [mktLoading, setMktLoading] = useState(false);

  // Design placement note & size guide
  const [designNote,     setDesignNote]     = useState('');
  const [showSizeGuide,  setShowSizeGuide]  = useState(false);

  // Active side helpers
  const activeSideState    = activeSide === 'front' ? front : back;
  const setActiveSideState = activeSide === 'front' ? setFront : setBack;

  const activeDesignImg = activeSideState.tab === 'none'
    ? null
    : (activeSideState.localPreview || activeSideState.url || null);

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

  // Pre-fill from marketplace navigation
  useEffect(() => {
    const pre = state?.selectedDesign || state?.preSelectedDesign;
    if (pre) {
      setActiveSide('front');
      setFront(s => ({ ...s, tab: 'marketplace', mktDesign: pre, url: pre.imageUrl, designPrice: pre.price || 0 }));
      setStep(2);
      setMaxReached(m => Math.max(m, 2));
    }
  }, [state]);

  // Load marketplace designs on demand
  useEffect(() => {
    if (activeSideState.tab === 'marketplace' && mktDesigns.length === 0) {
      setMktLoading(true);
      designAPI.getApproved({ limit: 24 })
        .then(r => setMktDesigns(r.data.designs || []))
        .catch(() => toast.error('Failed to load designs.'))
        .finally(() => setMktLoading(false));
    }
  }, [activeSideState.tab, mktDesigns.length]);

  // ── Pricing ──────────────────────────────────────────────────────────────
  const sizePricingMap = config?.sizePricing instanceof Map
    ? Object.fromEntries(config.sizePricing)
    : (config?.sizePricing || {});

  const totalDesignPrice = (front.url ? front.designPrice : 0) + (back.url ? back.designPrice : 0);

  const unitPrice = () => {
    const base  = config?.basePrice || 0;
    const extra = sizePricingMap[size] || 0;
    return Math.round(base + extra + totalDesignPrice);
  };
  const lineTotal = () => Math.round(unitPrice() * qty);

  // ── File upload ──────────────────────────────────────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target?.files?.[0] || e;
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG, or WEBP files.'); return;
    }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max file size is 5 MB.'); return; }

    // Capture which side we're uploading for
    const targetSide = activeSide;
    const setSide    = targetSide === 'front' ? setFront : setBack;

    const preview = URL.createObjectURL(file);
    setSide(s => ({ ...s, localPreview: preview, url: '', mktDesign: null, designPrice: 0 }));
    setUploading(true);
    setUploadPct(0);

    try {
      const res = await uploadAPI.uploadDesign(file, p => setUploadPct(p));
      setSide(s => ({ ...s, url: res.data.url }));
      toast.success(`Design uploaded for ${targetSide}!`);
    } catch {
      toast.error('Upload failed. Please try again.');
      setSide(s => ({ ...s, localPreview: '' }));
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
    setActiveSideState(s => ({ ...s, url: '', localPreview: '', mktDesign: null, designPrice: 0 }));
  };

  const handleSelectMkt = (d) => {
    setActiveSideState(s => ({ ...s, mktDesign: d, url: d.imageUrl, designPrice: d.price || 0, localPreview: '' }));
    toast.success(`"${d.title}" selected for ${activeSide} side`);
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
      productId:   'custom',
      productName: `${typeMeta?.label || 'Custom Shirt'} (Custom)`,
      shirtType:    typeMeta?.label || typeId,
      shirtTypeId:  typeId,
      color:        color.name,
      colorHex:     color.hex,
      size,
      quantity:     qty,
      unitPrice:    unitPrice(),
      // Front design
      frontDesignUrl:       front.url || null,
      frontDesignId:        front.mktDesign?._id || null,
      frontDesignTransform: front.url
        ? { x: front.x, y: front.y, scale: front.scale, rotation: front.rotation }
        : null,
      // Back design
      backDesignUrl:        back.url || null,
      backDesignId:         back.mktDesign?._id || null,
      backDesignTransform:  back.url
        ? { x: back.x, y: back.y, scale: back.scale, rotation: back.rotation }
        : null,
      // Backward-compat primary design fields
      designUrl:       front.url || back.url || null,
      designId:        front.mktDesign?._id || back.mktDesign?._id || null,
      designNote,
      designTitle:     front.mktDesign?.title || back.mktDesign?.title || null,
      designPrice:     totalDesignPrice,
      designTransform: front.url
        ? { x: front.x, y: front.y, scale: front.scale, rotation: front.rotation }
        : (back.url ? { x: back.x, y: back.y, scale: back.scale, rotation: back.rotation } : null),
      image: front.localPreview || front.url || back.localPreview || back.url || null,
    });
    toast.success('Added to cart!');
    navigate('/cart');
  };

  // ── Loading / error states ───────────────────────────────────────────────
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
  const hasAnyDesign = !!(front.url || back.url);

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
          <p className="text-white/35 text-sm mt-2 leading-relaxed">
            Realistic 2D preview · Front &amp; back · Drag to position
          </p>
        </div>

        {/* Step indicator */}
        <StepIndicator current={step} onStepClick={goToStep} maxReached={maxReached} />

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-6 items-start">

          {/* ── LEFT: 2D Viewer (sticky) ──────────────────────────────── */}
          <div className="sticky top-20">

            {/* Viewer container */}
            <div
              className="rounded-3xl overflow-hidden relative"
              style={{
                background:  '#111',
                border:      '1px solid rgba(255,255,255,0.09)',
                aspectRatio: '3/4',
              }}
            >
              <ShirtViewer2D
                typeId={typeId}
                color={color.hex}
                side={activeSide}
                designImage={activeDesignImg}
                designX={activeSideState.x}
                designY={activeSideState.y}
                designScale={activeSideState.scale}
                designRot={activeSideState.rotation}
                onDesignMove={activeDesignImg
                  ? (x, y) => setActiveSideState(s => ({ ...s, x, y }))
                  : null
                }
                onDesignResize={activeDesignImg
                  ? (scale) => setActiveSideState(s => ({ ...s, scale }))
                  : null
                }
                showPrintArea={step === 2}
              />

              {/* Context hint */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none w-max max-w-[calc(100%-24px)]"
                style={{
                  background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '4px 12px',
                }}>
                {activeDesignImg ? (
                  <p className="text-white/45 text-xs whitespace-nowrap">Drag design to reposition</p>
                ) : step === 2 ? (
                  <p className="text-[#8B5A3C] text-xs whitespace-nowrap">Upload a design to preview</p>
                ) : (
                  <p className="text-white/35 text-xs whitespace-nowrap">Front / Back toggle below</p>
                )}
              </div>
            </div>

            {/* Front / Back toggle — bottom of viewer */}
            <div className="flex mt-3 p-1 gap-1 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {(['front', 'back']).map(s => (
                <button
                  key={s}
                  onClick={() => setActiveSide(s)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200"
                  style={activeSide === s
                    ? { background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', color: '#fff', boxShadow: '0 2px 8px rgba(107,66,38,0.4)' }
                    : { color: 'rgba(255,255,255,0.4)' }
                  }
                >
                  <span style={{ fontSize: 13 }}>{s === 'front' ? '⬛' : '⬜'}</span>
                  {s.charAt(0).toUpperCase() + s.slice(1)} Side
                  {((s === 'front' && front.url) || (s === 'back' && back.url)) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* Price bar */}
            <div className="mt-3 rounded-2xl px-4 py-3.5 flex items-center justify-between gap-2 min-w-0"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="min-w-0 flex-1">
                <p className="text-white/35 text-xs mb-0.5">Unit price</p>
                <p className="font-display text-xl sm:text-2xl font-bold text-white leading-none truncate">
                  PKR {unitPrice().toLocaleString()}
                </p>
                {totalDesignPrice > 0 && (
                  <p className="text-white/25 text-[11px] mt-1 truncate">
                    +PKR {Math.round(totalDesignPrice).toLocaleString()} design
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-white/35 text-xs mb-0.5">×{qty}</p>
                <p className="font-display text-lg sm:text-xl font-semibold text-[#C9967A] leading-none whitespace-nowrap">
                  PKR {lineTotal().toLocaleString()}
                </p>
              </div>
            </div>

            {/* Selection pills */}
            <div className="hidden lg:flex mt-3 gap-2 flex-wrap">
              <Pill color={color.hex}>{color.name}</Pill>
              <Pill>{SHIRT_TYPE_META[typeId]?.label || typeId}</Pill>
              <Pill>Size {size}</Pill>
              {front.url && <Pill accent>Front design</Pill>}
              {back.url  && <Pill accent>Back design</Pill>}
            </div>
          </div>

          {/* ── RIGHT: Step content ───────────────────────────────────── */}
          <div>
            <AnimatePresence mode="wait">

              {/* ━━ STEP 1 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              {step === 1 && (
                <motion.div key="step1"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.22 }} className="space-y-4">
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
                            <motion.button key={t.id} onClick={() => setTypeId(t.id)} whileTap={{ scale: 0.96 }}
                              className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-200"
                              style={{
                                border:     sel ? '2px solid rgba(107,66,38,0.9)' : '1.5px solid rgba(255,255,255,0.08)',
                                background: sel ? 'rgba(107,66,38,0.18)' : 'rgba(255,255,255,0.02)',
                              }}>
                              <div className="w-14 h-18 flex items-center justify-center"
                                style={{ color: sel ? '#C9967A' : 'rgba(255,255,255,0.25)', width: 56, height: 68 }}>
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
                          <button key={i} onClick={() => setColor(c)} title={c.name}
                            className="transition-all duration-150"
                            style={{
                              width: 36, height: 36, borderRadius: '50%', background: c.hex,
                              border: color.name === c.name ? '3px solid #8B5A3C' : '2px solid rgba(255,255,255,0.12)',
                              boxShadow: color.name === c.name ? '0 0 0 3px rgba(107,66,38,0.35)' : 'none',
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
                        <button onClick={() => setShowSizeGuide(true)}
                          className="text-xs text-[#C9967A] hover:text-white transition-colors flex items-center gap-1">
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
                            <button key={s} onClick={() => setSize(s)}
                              className="flex flex-col items-center justify-center py-2.5 rounded-xl text-xs font-semibold transition-all duration-150"
                              style={sel
                                ? { background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', color: '#fff', border: '1.5px solid transparent' }
                                : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.55)', border: '1.5px solid rgba(255,255,255,0.08)' }
                              }>
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

              {/* ━━ STEP 2 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              {step === 2 && (
                <motion.div key="step2"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.22 }} className="space-y-4">
                  <StepHeading n={2} title="Add Your Design" subtitle="Upload designs for the front and/or back" />

                  {/* Side selector within design step */}
                  <div className="flex gap-2 p-1 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {(['front', 'back']).map(s => (
                      <button key={s} onClick={() => setActiveSide(s)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150"
                        style={activeSide === s
                          ? { background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', color: '#fff' }
                          : { color: 'rgba(255,255,255,0.4)' }
                        }>
                        {s === 'front' ? '⬛' : '⬜'}
                        {s.charAt(0).toUpperCase() + s.slice(1)} Side
                        {((s === 'front' && front.url) || (s === 'back' && back.url)) && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Design source tabs */}
                  <Card>
                    <div className="flex gap-1 p-1 rounded-xl mb-4"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      {DESIGN_TABS.map(t => (
                        <button key={t.id}
                          onClick={() => setActiveSideState(s => ({ ...s, tab: t.id }))}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-150"
                          style={activeSideState.tab === t.id
                            ? { background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', color: '#fff' }
                            : { color: 'rgba(255,255,255,0.4)' }
                          }>
                          <span>{t.icon}</span>
                          <span className="hidden sm:inline">{t.label}</span>
                        </button>
                      ))}
                    </div>

                    <AnimatePresence mode="wait">

                      {/* Upload tab */}
                      {activeSideState.tab === 'upload' && (
                        <motion.div key={`upload-${activeSide}`}
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="space-y-3">

                          {(activeSideState.localPreview || activeSideState.url) && !uploading && (
                            <div className="flex items-center gap-4 p-4 rounded-2xl"
                              style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.18)' }}>
                              <div className="relative flex-shrink-0">
                                <img
                                  src={activeSideState.localPreview || activeSideState.url}
                                  alt="Design preview"
                                  className="w-20 h-20 object-contain rounded-xl"
                                  style={{ background: 'rgba(255,255,255,0.06)' }}
                                />
                                <div className="absolute inset-0 rounded-xl ring-1 ring-[#8B5A3C]/40" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                  </svg>
                                  <p className="text-emerald-400 text-xs font-semibold">Design ready</p>
                                </div>
                                <p className="text-white/50 text-xs">Visible on {activeSide} of shirt</p>
                                <p className="text-white/30 text-xs mt-0.5">Drag design on viewer to reposition</p>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="cursor-pointer">
                                  <input type="file" accept="image/jpeg,image/png,image/webp"
                                    onChange={handleFileChange} className="hidden" />
                                  <span className="block text-xs px-3 py-1.5 rounded-lg text-white/50 hover:text-white transition-colors"
                                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    Replace
                                  </span>
                                </label>
                                <button onClick={clearDesign}
                                  className="text-xs px-3 py-1.5 rounded-lg text-red-400/70 hover:text-red-400 transition-colors"
                                  style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}>
                                  Remove
                                </button>
                              </div>
                            </div>
                          )}

                          {uploading && (
                            <div className="p-5 rounded-2xl flex flex-col items-center gap-3"
                              style={{ background: 'rgba(107,66,38,0.08)', border: '1.5px dashed rgba(107,66,38,0.35)' }}>
                              <Spinner size="md" className="text-ink-brown" />
                              <div className="w-full max-w-xs">
                                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                                  <motion.div className="h-full rounded-full"
                                    style={{ background: 'linear-gradient(90deg,#6B4226,#C9967A)' }}
                                    animate={{ width: `${uploadPct}%` }} transition={{ duration: 0.2 }} />
                                </div>
                                <p className="text-white/40 text-xs text-center mt-2">Uploading… {uploadPct}%</p>
                              </div>
                            </div>
                          )}

                          {!uploading && !(activeSideState.localPreview || activeSideState.url) && (
                            <label className="block cursor-pointer"
                              onDrop={handleDrop}
                              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                              onDragLeave={() => setDragOver(false)}>
                              <input type="file" accept="image/jpeg,image/png,image/webp"
                                onChange={handleFileChange} className="hidden" />
                              <motion.div
                                animate={{ borderColor: dragOver ? 'rgba(139,90,60,0.9)' : 'rgba(107,66,38,0.4)' }}
                                className="rounded-2xl p-8 text-center transition-all duration-200 flex flex-col items-center gap-4"
                                style={{
                                  border: '2px dashed rgba(107,66,38,0.4)',
                                  background: dragOver ? 'rgba(107,66,38,0.12)' : 'rgba(107,66,38,0.04)',
                                }}>
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                                  style={{ background: 'rgba(107,66,38,0.18)', border: '1px solid rgba(107,66,38,0.35)' }}>
                                  <svg className="w-8 h-8 text-[#8B5A3C]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-white/80 text-sm font-semibold">
                                    Upload for {activeSide.charAt(0).toUpperCase() + activeSide.slice(1)} side
                                  </p>
                                  <p className="text-white/35 text-xs mt-1">
                                    Drag & drop or <span className="text-[#C9967A] underline underline-offset-2">browse files</span>
                                  </p>
                                  <p className="text-white/20 text-xs mt-2">JPG · PNG · WEBP · Max 5 MB</p>
                                </div>
                              </motion.div>
                            </label>
                          )}
                        </motion.div>
                      )}

                      {/* Marketplace tab */}
                      {activeSideState.tab === 'marketplace' && (
                        <motion.div key={`mkt-${activeSide}`}
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                          {activeSideState.mktDesign && (
                            <div className="mb-3 p-3 rounded-xl flex items-center gap-3"
                              style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)' }}>
                              <img src={activeSideState.mktDesign.imageUrl} alt="" className="w-12 h-12 object-contain rounded-lg flex-shrink-0"
                                style={{ background: 'rgba(255,255,255,0.05)' }} />
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">"{activeSideState.mktDesign.title}"</p>
                                <p className="text-emerald-400/70 text-xs">
                                  {activeSideState.mktDesign.price === 0 ? 'Free' : `+PKR ${Math.round(activeSideState.mktDesign.price).toLocaleString()}`}
                                </p>
                              </div>
                              <button onClick={clearDesign}
                                className="text-white/30 hover:text-white transition-colors text-xs px-2 py-1 rounded-lg hover:bg-white/5">
                                Change
                              </button>
                            </div>
                          )}
                          {mktLoading ? (
                            <div className="flex justify-center py-8"><Spinner size="md" className="text-ink-brown" /></div>
                          ) : mktDesigns.length === 0 ? (
                            <div className="text-center py-8">
                              <p className="text-white/30 text-sm">No approved designs yet.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1 custom-scroll">
                              {mktDesigns.map(d => (
                                <button key={d._id} onClick={() => handleSelectMkt(d)}
                                  className="relative group rounded-xl overflow-hidden transition-all duration-150"
                                  style={{
                                    aspectRatio: '1',
                                    border: activeSideState.mktDesign?._id === d._id
                                      ? '2px solid rgba(139,90,60,0.9)'
                                      : '1.5px solid rgba(255,255,255,0.06)',
                                    background: 'rgba(255,255,255,0.03)',
                                  }}>
                                  <img src={d.imageUrl} alt={d.title} className="w-full h-full object-contain p-2"
                                    style={{ background: 'rgba(255,255,255,0.04)' }} />
                                  {activeSideState.mktDesign?._id === d._id && (
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
                      {activeSideState.tab === 'none' && (
                        <motion.div key={`none-${activeSide}`}
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="flex flex-col items-center gap-3 py-8 text-center">
                          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                            style={{ background: 'rgba(107,66,38,0.12)', border: '1px solid rgba(107,66,38,0.2)' }}>
                            <span className="text-3xl">👕</span>
                          </div>
                          <div>
                            <p className="text-white/60 text-sm font-semibold">No print on {activeSide} side</p>
                            <p className="text-white/25 text-xs mt-1">The {activeSide} of the shirt will be blank.</p>
                          </div>
                        </motion.div>
                      )}

                    </AnimatePresence>
                  </Card>

                  {/* Design placement controls — shown when active side has a design */}
                  <AnimatePresence>
                    {activeDesignImg && (
                      <motion.div key={`placement-${activeSide}`}
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                        <Card>
                          <SectionLabel>Placement — {activeSide.charAt(0).toUpperCase() + activeSide.slice(1)} Side</SectionLabel>

                          <div className="mb-4 px-3 py-2 rounded-xl flex items-center gap-2"
                            style={{ background: 'rgba(107,66,38,0.08)', border: '1px solid rgba(107,66,38,0.2)' }}>
                            <svg className="w-3.5 h-3.5 text-[#8B5A3C] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                            </svg>
                            <p className="text-white/45 text-xs">Drag the design image on the shirt preview to reposition it</p>
                          </div>

                          {/* Quick position grid */}
                          <div className="mb-4">
                            <p className="text-white/35 text-xs mb-2">Quick position</p>
                            <div className="grid grid-cols-3 gap-1.5 w-full max-w-[180px]">
                              {QUICK_POSITIONS.map(pos => (
                                <button key={pos.title}
                                  onClick={() => setActiveSideState(s => ({ ...s, x: pos.x, y: pos.y }))}
                                  title={pos.title}
                                  className="h-9 rounded-lg text-sm font-medium transition-all duration-150 hover:text-white"
                                  style={{
                                    background: (Math.abs(activeSideState.x - pos.x) < 0.07 && Math.abs(activeSideState.y - pos.y) < 0.07)
                                      ? 'rgba(107,66,38,0.5)' : 'rgba(255,255,255,0.05)',
                                    border: (Math.abs(activeSideState.x - pos.x) < 0.07 && Math.abs(activeSideState.y - pos.y) < 0.07)
                                      ? '1.5px solid rgba(139,90,60,0.7)' : '1.5px solid rgba(255,255,255,0.08)',
                                    color: (Math.abs(activeSideState.x - pos.x) < 0.07 && Math.abs(activeSideState.y - pos.y) < 0.07)
                                      ? '#fff' : 'rgba(255,255,255,0.4)',
                                  }}>
                                  {pos.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Scale slider */}
                          <div className="space-y-1.5 mb-3">
                            <div className="flex justify-between text-xs">
                              <span className="text-white/40">Scale</span>
                              <span className="text-white font-medium">{activeSideState.scale.toFixed(2)}×</span>
                            </div>
                            <input type="range" min="0.3" max="2.5" step="0.05"
                              value={activeSideState.scale}
                              onChange={e => setActiveSideState(s => ({ ...s, scale: parseFloat(e.target.value) }))}
                              className="w-full accent-ink-brown" />
                            <div className="flex justify-between text-[10px] text-white/20">
                              <span>Small</span><span>Large</span>
                            </div>
                          </div>

                          {/* Rotation slider */}
                          <div className="space-y-1.5 mb-3">
                            <div className="flex justify-between text-xs">
                              <span className="text-white/40">Rotation</span>
                              <span className="text-white font-medium">{activeSideState.rotation}°</span>
                            </div>
                            <input type="range" min="-180" max="180" step="1"
                              value={activeSideState.rotation}
                              onChange={e => setActiveSideState(s => ({ ...s, rotation: parseInt(e.target.value) }))}
                              className="w-full accent-ink-brown" />
                            <div className="flex justify-between text-[10px] text-white/20">
                              <span>−180°</span><span>0°</span><span>+180°</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-1">
                            <button
                              onClick={() => setActiveSideState(s => ({ ...s, x: 0.5, y: 0.5, scale: 1.0, rotation: 0 }))}
                              className="text-xs text-white/30 hover:text-white/60 transition-colors">
                              ↺ Reset position
                            </button>
                            <button onClick={clearDesign}
                              className="text-xs text-white/25 hover:text-red-400 transition-colors">
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

              {/* ━━ STEP 3 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
              {step === 3 && (
                <motion.div key="step3"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.22 }} className="space-y-4">
                  <StepHeading n={3} title="Review Your Order" subtitle="Check everything and set quantity" />

                  {/* Summary */}
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
                      {/* Front design */}
                      <SummaryRow label="Front Design">
                        {front.url ? (
                          <div className="flex items-center gap-2">
                            <img src={front.localPreview || front.url} alt="" className="w-8 h-8 object-contain rounded-lg flex-shrink-0"
                              style={{ background: 'rgba(255,255,255,0.06)' }} />
                            <span className="text-white text-sm">{front.mktDesign?.title || 'Custom upload'}</span>
                          </div>
                        ) : <span className="text-white/40 text-sm">None (plain)</span>}
                      </SummaryRow>
                      {/* Back design */}
                      <SummaryRow label="Back Design">
                        {back.url ? (
                          <div className="flex items-center gap-2">
                            <img src={back.localPreview || back.url} alt="" className="w-8 h-8 object-contain rounded-lg flex-shrink-0"
                              style={{ background: 'rgba(255,255,255,0.06)' }} />
                            <span className="text-white text-sm">{back.mktDesign?.title || 'Custom upload'}</span>
                          </div>
                        ) : <span className="text-white/40 text-sm">None (plain back)</span>}
                      </SummaryRow>
                    </div>
                  </Card>

                  {/* Quantity */}
                  <Card>
                    <SectionLabel>Quantity</SectionLabel>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setQty(q => Math.max(1, q - 1))}
                        className="w-10 h-10 rounded-xl font-bold text-white/70 hover:text-white transition-all flex items-center justify-center text-xl"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)' }}>−</button>
                      <span className="font-display text-2xl font-bold text-white w-8 text-center">{qty}</span>
                      <button onClick={() => setQty(q => q + 1)}
                        className="w-10 h-10 rounded-xl font-bold text-white/70 hover:text-white transition-all flex items-center justify-center text-xl"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)' }}>+</button>
                      <span className="text-white/35 text-sm ml-2">
                        {qty > 1 ? `PKR ${unitPrice().toLocaleString()} × ${qty}` : ''}
                      </span>
                    </div>
                  </Card>

                  {/* Placement notes */}
                  <Card>
                    <SectionLabel>Placement Notes <span className="normal-case text-white/20 font-normal tracking-normal">(optional)</span></SectionLabel>
                    <textarea rows={2}
                      className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 resize-none focus:outline-none focus:ring-1 focus:ring-[#6B4226] transition-all"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
                      value={designNote}
                      onChange={e => setDesignNote(e.target.value)}
                      placeholder="e.g. Centre chest on front, name on back…"
                    />
                    <p className="text-white/20 text-xs mt-1.5">Instructions for our print team.</p>
                  </Card>

                  {/* Price breakdown */}
                  <Card>
                    <SectionLabel>Price Breakdown</SectionLabel>
                    <div className="space-y-2">
                      <PriceRow label="Base price" value={config.basePrice} />
                      {sizePricingMap[size] > 0 && (
                        <PriceRow label={`Size surcharge (${size})`} value={sizePricingMap[size]} />
                      )}
                      {front.url && front.designPrice > 0 && (
                        <PriceRow label="Front design fee" value={front.designPrice} />
                      )}
                      {back.url && back.designPrice > 0 && (
                        <PriceRow label="Back design fee" value={back.designPrice} />
                      )}
                      <div className="border-t border-white/10 pt-2 mt-2">
                        <PriceRow label="Unit price" value={unitPrice()} highlight />
                      </div>
                      <PriceRow label={`Quantity ×${qty}`} value={lineTotal()} highlight bold />
                    </div>
                  </Card>

                  {/* CTA */}
                  <motion.button onClick={handleAddToCart}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
                    className="w-full py-4 rounded-2xl font-display font-semibold text-base flex items-center justify-center gap-3"
                    style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', color: '#fff', boxShadow: '0 8px 28px rgba(107,66,38,0.5)' }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowSizeGuide(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="rounded-3xl p-6 w-full max-w-md"
              style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.1)' }}
              onClick={e => e.stopPropagation()}>
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
                      { s:'XS', chest:'84–89',  len:'66', sh:'41' },
                      { s:'S',  chest:'89–94',  len:'69', sh:'43' },
                      { s:'M',  chest:'94–99',  len:'72', sh:'45' },
                      { s:'L',  chest:'99–104', len:'74', sh:'47' },
                      { s:'XL', chest:'104–109',len:'76', sh:'49' },
                      { s:'XXL',chest:'109–114',len:'78', sh:'51' },
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
              <p className="text-white/25 text-xs mt-4">Measurements are approximate.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

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
        <button onClick={onBack}
          className="px-5 py-3 rounded-xl text-sm font-medium text-white/50 hover:text-white transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.09)' }}>
          ← Back
        </button>
      )}
      {onNext && (
        <motion.button onClick={onNext} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
          className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', boxShadow: '0 4px 16px rgba(107,66,38,0.35)' }}>
          {nextLabel}
        </motion.button>
      )}
    </div>
  );
}

function Pill({ children, color, accent }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
      style={{
        background: accent ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
        border: accent ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(255,255,255,0.08)',
        color: accent ? 'rgba(74,222,128,0.9)' : 'rgba(255,255,255,0.55)',
      }}>
      {color && <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color, border: '1px solid rgba(255,255,255,0.15)' }} />}
      {children}
    </div>
  );
}

function SummaryRow({ label, value, children }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-white/40 text-sm flex-shrink-0">{label}</span>
      <div className="text-right min-w-0 flex-1">
        {children || <span className="text-white text-sm font-medium line-clamp-2 text-right">{value}</span>}
      </div>
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
