import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../../shared/api/axios';
import { uploadAPI } from '../../../shared/api/upload.service';
import { designAPI } from '../../marketplace/services/design.service';
import DesignCard from '../../marketplace/components/DesignCard';
import { useCart } from '../../../shared/context/CartContext';
import { Spinner } from '../../../shared/components/Spinner';
import { SHIRT_TYPE_IDS, SHIRT_TYPE_META } from '../utils/shirtShapes';
import { DesignDragOverlay } from '../components/DesignDragOverlay';

// Lazy-load the heavy 3D viewer so it doesn't block the initial paint
const ShirtViewer3D = lazy(() =>
  import('../components/ShirtViewer3D').then(m => ({ default: m.ShirtViewer3D }))
);

// ── Small reusable UI pieces ─────────────────────────────────

const ColorSwatch = ({ color, selected, onClick }) => (
  <button
    onClick={onClick}
    title={color.name}
    style={{
      width: 34, height: 34,
      borderRadius: '50%',
      background: color.hex,
      border: selected ? '3px solid #8B5A3C' : '2px solid rgba(255,255,255,0.15)',
      boxShadow: selected ? '0 0 0 3px rgba(107,66,38,0.3)' : 'none',
      flexShrink: 0,
      transition: 'all 0.15s',
      cursor: 'pointer',
    }}
  />
);

const SizeBtn = ({ size, selected, extra, onClick }) => (
  <button
    onClick={onClick}
    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
    style={selected
      ? { background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', color: '#fff', border: '1.5px solid transparent' }
      : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.55)', border: '1.5px solid rgba(255,255,255,0.1)' }
    }
  >
    {size}{extra ? ` +${Math.round(extra).toLocaleString()}` : ''}
  </button>
);

const SectionCard = ({ title, icon, children }) => (
  <div className="rounded-2xl p-5 space-y-4"
    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
    <div className="flex items-center gap-2">
      {icon && <span className="text-ink-brown text-base">{icon}</span>}
      <h3 className="font-display text-sm font-semibold text-white tracking-wide uppercase">{title}</h3>
    </div>
    {children}
  </div>
);

// Shirt type icon SVGs
const SHIRT_SVG = {
  [SHIRT_TYPE_IDS.PLAIN_TSHIRT]: (
    <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
      <path d="M35 12 L20 27 L10 22 L15 47 L25 47 L25 88 L75 88 L75 47 L85 47 L90 22 L80 27 L65 12 C62 19 38 19 35 12Z" />
    </svg>
  ),
  [SHIRT_TYPE_IDS.POLO]: (
    <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
      <path d="M35 12 L20 27 L10 22 L15 47 L25 47 L25 88 L75 88 L75 47 L85 47 L90 22 L80 27 L65 12 C62 8 54 7 50 14 C46 7 38 8 35 12Z" />
      <rect x="46" y="14" width="8" height="22" rx="2" fill="rgba(0,0,0,0.2)" />
    </svg>
  ),
  [SHIRT_TYPE_IDS.VNECK]: (
    <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
      <path d="M35 12 L20 27 L10 22 L15 47 L25 47 L25 88 L75 88 L75 47 L85 47 L90 22 L80 27 L65 12 L50 40 Z" />
    </svg>
  ),
};

const DESIGN_TABS = [
  { id: 'upload',      label: 'Upload Own'       },
  { id: 'marketplace', label: 'Marketplace'      },
  { id: 'none',        label: 'Plain (No Print)' },
];

// ── Main Component ───────────────────────────────────────────

export default function CustomizePage() {
  const navigate    = useNavigate();
  const { state }   = useLocation();
  const { addItem } = useCart();
  const orbitRef    = useRef(null);

  // Config
  const [config,   setConfig]   = useState(null);
  const [cfgLoad,  setCfgLoad]  = useState(true);

  // Shirt options
  const [typeId,   setTypeId]   = useState(SHIRT_TYPE_IDS.PLAIN_TSHIRT);
  const [color,    setColor]    = useState({ name: 'White', hex: '#FFFFFF' });
  const [size,     setSize]     = useState('M');
  const [qty,      setQty]      = useState(1);

  // Design
  const [designTab,   setDesignTab]   = useState('upload');
  const [designUrl,   setDesignUrl]   = useState('');
  const [localPreview, setLocalPreview] = useState('');
  const [designNote,  setDesignNote]  = useState('');
  const [designPrice, setDesignPrice] = useState(0);
  const [uploading,   setUploading]   = useState(false);
  const [uploadPct,   setUploadPct]   = useState(0);
  const [selectedMkt, setSelectedMkt] = useState(null);
  const [mktDesigns,  setMktDesigns]  = useState([]);
  const [mktLoading,  setMktLoading]  = useState(false);

  // 3D design transform (normalised 0–1)
  const [dX,   setDX]   = useState(0.5);   // horizontal position in chest zone
  const [dY,   setDY]   = useState(0.55);  // vertical position in chest zone
  const [dScale, setDScale] = useState(1.0);
  const [dRot,  setDRot]  = useState(0);    // degrees

  // Active section on mobile (accordion-style)
  const [activeSection, setActiveSection] = useState('type');

  // ── Load config ───────────────────────────────────────────
  useEffect(() => {
    api.get('/shirt-config')
      .then(r => {
        const cfg = r.data.config;
        setConfig(cfg);
        // Default to first enabled shirt type
        const firstEnabled = cfg.shirtTypes?.find(t => t.enabled);
        if (firstEnabled) setTypeId(firstEnabled.id);
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
      setDesignTab('marketplace');
      setSelectedMkt(pre);
      setDesignUrl(pre.imageUrl);
      setDesignPrice(pre.price || 0);
    }
  }, [state]);

  // Load marketplace designs when tab switches to it
  useEffect(() => {
    if (designTab === 'marketplace' && mktDesigns.length === 0) {
      setMktLoading(true);
      designAPI.getApproved({ limit: 24 })
        .then(r => setMktDesigns(r.data.designs || []))
        .catch(() => toast.error('Failed to load designs.'))
        .finally(() => setMktLoading(false));
    }
  }, [designTab, mktDesigns.length]);

  // ── Pricing helpers ───────────────────────────────────────
  const sizePricingMap = config?.sizePricing instanceof Map
    ? Object.fromEntries(config.sizePricing)
    : (config?.sizePricing || {});

  const unitPrice = () => {
    const base  = config?.basePrice || 0;
    const extra = sizePricingMap[size] || 0;
    return Math.round(base + extra + designPrice);
  };

  const lineTotal = () => Math.round(unitPrice() * qty);

  // Active design image (for 3D viewer and drag overlay)
  const activeDesignImg = designTab === 'none' ? null : (localPreview || designUrl || null);

  // ── File upload ───────────────────────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG, or WEBP files.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max file size is 5 MB.'); return; }

    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);
    setDesignUrl('');
    setUploading(true);
    setUploadPct(0);

    try {
      const res = await uploadAPI.uploadDesign(file, p => setUploadPct(p));
      setDesignUrl(res.data.url);
      setDesignPrice(0);
      toast.success('Design uploaded!');
    } catch {
      toast.error('Upload failed. Please try again.');
      setLocalPreview('');
    } finally {
      setUploading(false);
      setUploadPct(0);
    }
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileChange({ target: { files: [file], value: '' } });
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

  // ── Add to Cart ───────────────────────────────────────────
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
      // Store design transform for order fulfilment context
      designTransform: activeDesignImg
        ? { x: dX, y: dY, scale: dScale, rotation: dRot }
        : null,
      image:        activeDesignImg || null,
    });
    navigate('/cart');
  };

  // ── Accordion helpers (mobile) ────────────────────────────
  const toggle = (id) => setActiveSection(s => s === id ? null : id);

  // ── Loading / error states ────────────────────────────────
  if (cfgLoad) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" className="text-ink-brown" />
    </div>
  );
  if (!config) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center glass-card p-10">
        <p className="text-white/50 mb-4">Customization settings unavailable.</p>
        <button onClick={() => navigate('/')} className="btn-primary w-auto px-8">← Back to Home</button>
      </div>
    </div>
  );

  const enabledTypes = config.shirtTypes?.filter(t => t.enabled) || [];

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="min-h-screen pt-20 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Page header */}
        <div className="text-center mb-8">
          <p className="text-xs tracking-widest uppercase text-ink-brown mb-1.5">Design Studio</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
            Customise Your Shirt
          </h1>
          <p className="text-white/35 text-sm mt-2">
            Real-time 3D preview · Drag to position your design
          </p>
        </div>

        {/* Main layout: 3D viewer (left) + Controls (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-start">

          {/* ── LEFT: 3D Viewer ── */}
          <div className="sticky top-20">
            <div className="rounded-3xl overflow-hidden relative"
              style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', aspectRatio: '1' }}>

              {/* Three.js Canvas */}
              <Suspense fallback={
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                  style={{ background: '#111' }}>
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
                />
              </Suspense>

              {/* Design drag overlay — sits on top of canvas */}
              <DesignDragOverlay
                designImage={activeDesignImg}
                designX={dX}
                designY={dY}
                designScale={dScale}
                designRot={dRot}
                onPositionChange={(x, y) => { setDX(x); setDY(y); }}
                orbitRef={orbitRef}
              />

              {/* Hint badge */}
              {activeDesignImg && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none"
                  style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
                           border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '4px 14px' }}>
                  <p className="text-white/50 text-xs">Drag design to reposition · Scroll to zoom</p>
                </div>
              )}
            </div>

            {/* Price bar below viewer */}
            <div className="mt-4 rounded-2xl p-4 flex items-center justify-between"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div>
                <p className="text-white/35 text-xs">Unit price</p>
                <p className="font-display text-2xl font-bold text-white">
                  PKR {unitPrice().toLocaleString()}
                </p>
                {designPrice > 0 && (
                  <p className="text-white/25 text-xs mt-0.5">
                    inc. PKR {Math.round(designPrice).toLocaleString()} design fee
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-white/35 text-xs">×{qty} total</p>
                <p className="font-display text-xl font-semibold text-ink-brown-light">
                  PKR {lineTotal().toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Control Panel ── */}
          <div className="space-y-3">

            {/* 1. Shirt Type */}
            <SectionCard title="Shirt Type" icon="👕">
              {enabledTypes.length === 0 ? (
                <p className="text-white/30 text-sm">No shirt types enabled. Check admin settings.</p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {enabledTypes.map(t => {
                    const meta = SHIRT_TYPE_META[t.id] || { label: t.name, description: '' };
                    const isSelected = typeId === t.id;
                    return (
                      <motion.button
                        key={t.id}
                        onClick={() => setTypeId(t.id)}
                        whileTap={{ scale: 0.96 }}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200"
                        style={{
                          border: isSelected
                            ? '2px solid rgba(107,66,38,0.8)'
                            : '1.5px solid rgba(255,255,255,0.08)',
                          background: isSelected ? 'rgba(107,66,38,0.15)' : 'rgba(255,255,255,0.02)',
                        }}
                      >
                        <div className="w-14 h-14"
                          style={{ color: isSelected ? '#8B5A3C' : 'rgba(255,255,255,0.2)' }}>
                          {SHIRT_SVG[t.id]}
                        </div>
                        <span className="text-xs font-medium leading-tight text-center"
                          style={{ color: isSelected ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                          {meta.label}
                        </span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor"
                              strokeWidth="3" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </SectionCard>

            {/* 2. Color */}
            {config.colors?.length > 0 && (
              <SectionCard title="Color" icon="🎨">
                <div className="flex flex-wrap gap-2.5">
                  {config.colors.map((c, i) => (
                    <ColorSwatch
                      key={i}
                      color={c}
                      selected={color.name === c.name}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
                <p className="text-white/35 text-xs">
                  Selected: <span className="text-white">{color.name}</span>
                </p>
              </SectionCard>
            )}

            {/* 3. Size & Quantity */}
            {config.sizes?.length > 0 && (
              <SectionCard title="Size & Quantity" icon="📐">
                <div>
                  <p className="text-white/40 text-xs mb-2">
                    Size — <span className="text-white">{size}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {config.sizes.map(s => (
                      <SizeBtn
                        key={s}
                        size={s}
                        selected={size === s}
                        extra={sizePricingMap[s]}
                        onClick={() => setSize(s)}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-1">
                  <p className="text-white/40 text-xs w-16">Quantity</p>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setQty(q => Math.max(1, q - 1))}
                      className="w-8 h-8 rounded-lg text-white/60 hover:text-white transition-colors flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      −
                    </button>
                    <span className="font-display text-lg font-bold text-white w-6 text-center">{qty}</span>
                    <button onClick={() => setQty(q => q + 1)}
                      className="w-8 h-8 rounded-lg text-white/60 hover:text-white transition-colors flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      +
                    </button>
                  </div>
                </div>
              </SectionCard>
            )}

            {/* 4. Design */}
            <SectionCard title="Design" icon="🖼">
              {/* Tabs */}
              <div className="flex rounded-xl p-1 gap-1"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {DESIGN_TABS.map(t => (
                  <button key={t.id} onClick={() => setDesignTab(t.id)}
                    className="flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-150"
                    style={designTab === t.id
                      ? { background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', color: '#fff' }
                      : { color: 'rgba(255,255,255,0.4)' }
                    }>
                    {t.label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">

                {/* Upload own */}
                {designTab === 'upload' && (
                  <motion.div key="upload"
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <label
                      className="block cursor-pointer"
                      onDrop={handleDrop}
                      onDragOver={e => e.preventDefault()}
                    >
                      <input type="file" accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileChange} className="hidden" />
                      <div className="relative w-full rounded-xl overflow-hidden transition-all duration-200"
                        style={{
                          paddingBottom: '52%',
                          border: '1.5px dashed rgba(107,66,38,0.45)',
                          background: 'rgba(107,66,38,0.04)',
                        }}>
                        <div className="absolute inset-0 flex items-center justify-center">
                          {uploading ? (
                            <div className="flex flex-col items-center gap-3">
                              <Spinner size="md" className="text-ink-brown" />
                              <div className="w-32 h-1 rounded-full bg-white/10 overflow-hidden">
                                <motion.div className="h-full rounded-full"
                                  style={{ background: 'linear-gradient(90deg,#6B4226,#8B5A3C)' }}
                                  animate={{ width: `${uploadPct}%` }} transition={{ duration: 0.2 }} />
                              </div>
                              <span className="text-white/35 text-xs">{uploadPct}%</span>
                            </div>
                          ) : (localPreview || designUrl) ? (
                            <div className="flex flex-col items-center gap-2 p-4">
                              <img src={localPreview || designUrl} alt="Design preview"
                                className="max-h-24 object-contain rounded-lg" />
                              <p className="text-white/35 text-xs">Click to replace</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-3 p-6 text-center">
                              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                style={{ background: 'rgba(107,66,38,0.15)', border: '1px solid rgba(107,66,38,0.3)' }}>
                                <svg className="w-6 h-6 text-ink-brown" fill="none" stroke="currentColor"
                                  strokeWidth="1.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round"
                                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-white/65 text-sm font-medium">Click or drag to upload</p>
                                <p className="text-white/25 text-xs mt-0.5">JPG, PNG, WEBP · Max 5 MB</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </label>

                    {(localPreview || designUrl) && (
                      <button onClick={clearDesign}
                        className="text-xs text-white/30 hover:text-red-400 transition-colors mt-2">
                        × Remove design
                      </button>
                    )}
                  </motion.div>
                )}

                {/* Marketplace */}
                {designTab === 'marketplace' && (
                  <motion.div key="marketplace"
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {selectedMkt && (
                      <div className="mb-3 p-3 rounded-xl flex items-center gap-3"
                        style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)' }}>
                        <img src={selectedMkt.imageUrl} alt="" className="w-10 h-10 object-contain rounded-lg flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-medium truncate">"{selectedMkt.title}"</p>
                          <p className="text-emerald-400/70 text-xs">
                            {selectedMkt.price === 0 ? 'Free' : `+PKR ${Math.round(selectedMkt.price).toLocaleString()}`}
                          </p>
                        </div>
                        <button onClick={clearDesign} className="text-white/30 hover:text-white text-xs">Change</button>
                      </div>
                    )}

                    {mktLoading ? (
                      <div className="flex justify-center py-6">
                        <Spinner size="md" className="text-ink-brown" />
                      </div>
                    ) : mktDesigns.length === 0 ? (
                      <p className="text-white/30 text-sm text-center py-6">No approved designs yet.</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
                        {mktDesigns.map((d, i) => (
                          <DesignCard key={d._id} design={d} index={i} selectable onSelect={handleSelectMkt} />
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Plain */}
                {designTab === 'none' && (
                  <motion.div key="none"
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-2 py-6 text-center">
                    <div className="text-3xl">👕</div>
                    <p className="text-white/50 text-sm font-medium">Plain shirt — no print</p>
                    <p className="text-white/25 text-xs">Shirt will be printed without any design.</p>
                  </motion.div>
                )}

              </AnimatePresence>
            </SectionCard>

            {/* 5. Design Controls — only shown when a design is active */}
            <AnimatePresence>
              {activeDesignImg && (
                <motion.div
                  key="design-controls"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <SectionCard title="Design Controls" icon="✏️">
                    {/* Scale */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/40">Scale</span>
                        <span className="text-white">{dScale.toFixed(2)}×</span>
                      </div>
                      <input type="range" min="0.3" max="2.2" step="0.05"
                        value={dScale}
                        onChange={e => setDScale(parseFloat(e.target.value))}
                        className="w-full accent-ink-brown" />
                    </div>

                    {/* Rotation */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/40">Rotation</span>
                        <span className="text-white">{dRot}°</span>
                      </div>
                      <input type="range" min="-180" max="180" step="1"
                        value={dRot}
                        onChange={e => setDRot(parseInt(e.target.value))}
                        className="w-full accent-ink-brown" />
                    </div>

                    {/* Position (fine-tune via sliders) */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-white/40">Horizontal</span>
                          <span className="text-white">{Math.round(dX * 100)}%</span>
                        </div>
                        <input type="range" min="0" max="1" step="0.01"
                          value={dX}
                          onChange={e => setDX(parseFloat(e.target.value))}
                          className="w-full accent-ink-brown" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-white/40">Vertical</span>
                          <span className="text-white">{Math.round(dY * 100)}%</span>
                        </div>
                        <input type="range" min="0" max="1" step="0.01"
                          value={dY}
                          onChange={e => setDY(parseFloat(e.target.value))}
                          className="w-full accent-ink-brown" />
                      </div>
                    </div>

                    {/* Reset button */}
                    <button
                      onClick={() => { setDX(0.5); setDY(0.55); setDScale(1.0); setDRot(0); }}
                      className="text-xs text-white/30 hover:text-white/60 transition-colors">
                      ↺ Reset to default
                    </button>
                  </SectionCard>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 6. Placement Notes */}
            <SectionCard title="Placement Notes" icon="📝">
              <textarea
                rows={2}
                className="glass-input resize-none text-sm"
                value={designNote}
                onChange={e => setDesignNote(e.target.value)}
                placeholder="e.g. Centre chest, 20×20 cm, 3 cm from collar…"
              />
              <p className="text-white/20 text-xs">
                Optional instructions for our print team.
              </p>
            </SectionCard>

            {/* Add to Cart CTA */}
            <motion.button
              onClick={handleAddToCart}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 rounded-2xl font-display font-semibold text-base flex items-center justify-center gap-3 transition-all"
              style={{
                background: 'linear-gradient(135deg,#6B4226,#8B5A3C)',
                color: '#fff',
                boxShadow: '0 6px 24px rgba(107,66,38,0.45)',
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
              </svg>
              Add to Cart — PKR {lineTotal().toLocaleString()}
            </motion.button>

          </div>
          {/* end control panel */}

        </div>
        {/* end main grid */}

      </div>
    </div>
  );
}
