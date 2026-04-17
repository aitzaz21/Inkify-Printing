import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../../shared/api/axios';
import { uploadAPI } from '../../../shared/api/upload.service';
import { designAPI } from '../../marketplace/services/design.service';
import DesignCard from '../../marketplace/components/DesignCard';
import { useCart } from '../../../shared/context/CartContext';
import { Spinner } from '../../../shared/components/Spinner';

/* ── Step bar ─────────────────────────────────────────────── */
const StepBar = ({ current }) => {
  const steps = ['Shirt Type', 'Colour & Size', 'Add Design', 'Review'];
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
              style={{
                background: i <= current ? 'linear-gradient(135deg,#6B4226,#8B5A3C)' : 'rgba(255,255,255,0.06)',
                color: i <= current ? '#fff' : 'rgba(255,255,255,0.3)',
                boxShadow: i === current ? '0 0 0 4px rgba(107,66,38,0.15)' : 'none',
              }}>
              {i < current
                ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                : i + 1}
            </div>
            <span className="text-xs hidden sm:block"
              style={{ color: i === current ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)' }}>
              {s}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="w-10 sm:w-16 h-px mx-1 mb-4 transition-all duration-300"
              style={{ background: i < current ? 'rgba(107,66,38,0.6)' : 'rgba(255,255,255,0.1)' }} />
          )}
        </div>
      ))}
    </div>
  );
};

const Swatch = ({ color, selected, onClick }) => (
  <button onClick={onClick} title={color.name}
    className="w-9 h-9 rounded-full transition-all duration-150 hover:scale-110 flex-shrink-0"
    style={{
      background: color.hex,
      border: selected ? '2.5px solid #8B5A3C' : '2px solid rgba(255,255,255,0.15)',
      boxShadow: selected ? '0 0 0 3px rgba(107,66,38,0.25)' : 'none',
    }} />
);

const SizeBtn = ({ size, selected, extra, onClick }) => (
  <button onClick={onClick}
    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
    style={selected
      ? { background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', color: '#fff', border: '1.5px solid transparent' }
      : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.55)', border: '1.5px solid rgba(255,255,255,0.1)' }
    }>
    {size}{extra ? ` +PKR ${Math.round(extra).toLocaleString()}` : ''}
  </button>
);

const DESIGN_TABS = [
  { id: 'upload',      label: 'Upload Your Own'  },
  { id: 'marketplace', label: 'Browse Marketplace' },
  { id: 'none',        label: 'Plain (No Design)' },
];

export default function CustomizePage() {
  const navigate    = useNavigate();
  const { state }   = useLocation();
  const { addItem } = useCart();

  const [step, setStep] = useState(0);

  // Config loaded from admin's Customization Settings
  const [config,  setConfig]  = useState(null);
  const [cfgLoad, setCfgLoad] = useState(true);

  // Step 0 — Shirt type
  const [selectedType, setSelectedType] = useState(null); // { name, image }

  // Step 1 — Color, Size, Qty
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize,  setSelectedSize]  = useState('M');
  const [qty,           setQty]           = useState(1);

  // Step 2 — Design
  const [designTab,      setDesignTab]      = useState('upload');
  const [designUrl,      setDesignUrl]      = useState('');
  const [designNote,     setDesignNote]     = useState('');
  const [designPrice,    setDesignPrice]    = useState(0);
  const [uploading,      setUploading]      = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [localPreview,   setLocalPreview]   = useState('');
  const [mktDesigns,     setMktDesigns]     = useState([]);
  const [mktLoading,     setMktLoading]     = useState(false);
  const [selectedMkt,    setSelectedMkt]    = useState(null);

  // Load shirt config from backend
  useEffect(() => {
    api.get('/shirt-config')
      .then(r => {
        const cfg = r.data.config;
        setConfig(cfg);
        if (cfg.shirtTypes?.length) setSelectedType(cfg.shirtTypes[0]);
        if (cfg.colors?.length)     setSelectedColor(cfg.colors[0]);
        if (cfg.sizes?.length && !cfg.sizes.includes('M')) setSelectedSize(cfg.sizes[0]);
      })
      .catch(() => toast.error('Failed to load configuration.'))
      .finally(() => setCfgLoad(false));
  }, []);

  // Pre-fill if coming from marketplace
  useEffect(() => {
    const pre = state?.selectedDesign || state?.preSelectedDesign;
    if (pre) {
      // Store pre-selected design but start from step 0 so user can choose shirt type & color first
      setDesignTab('marketplace');
      setSelectedMkt(pre);
      setDesignUrl(pre.imageUrl);
      setDesignPrice(pre.price || 0);
      // Start from step 0 so user picks shirt type and color before reviewing
      setStep(0);
    }
  }, [state]);

  // Load marketplace designs when tab activated
  useEffect(() => {
    if (designTab === 'marketplace' && mktDesigns.length === 0) {
      setMktLoading(true);
      designAPI.getApproved({ limit: 24 })
        .then(r => setMktDesigns(r.data.designs || []))
        .catch(() => toast.error('Failed to load designs.'))
        .finally(() => setMktLoading(false));
    }
  }, [designTab, mktDesigns.length]);

  const sizePricingMap = config?.sizePricing instanceof Map
    ? Object.fromEntries(config.sizePricing)
    : (config?.sizePricing || {});

  const unitPrice = () => {
    const base  = config?.basePrice || 0;
    const extra = sizePricingMap[selectedSize] || 0;
    return Math.round((base + extra + designPrice) * 100) / 100;
  };
  const lineTotal = () => Math.round(unitPrice() * qty * 100) / 100;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) { toast.error('Only JPG, PNG, WEBP.'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5 MB.'); return; }
    setLocalPreview(URL.createObjectURL(file));
    setUploading(true); setUploadProgress(0);
    try {
      const res = await uploadAPI.uploadDesign(file, p => setUploadProgress(p));
      setDesignUrl(res.data.url);
      setDesignPrice(0);
      toast.success('Design uploaded!');
    } catch {
      toast.error('Upload failed.'); setLocalPreview('');
    } finally { setUploading(false); setUploadProgress(0); }
    e.target.value = '';
  };

  const handleSelectMarketplace = (d) => {
    setSelectedMkt(d); setDesignUrl(d.imageUrl); setDesignPrice(d.price || 0);
    toast.success(`"${d.title}" selected`);
  };

  const clearDesign = () => {
    setDesignUrl(''); setLocalPreview(''); setSelectedMkt(null); setDesignPrice(0);
  };

  const handleAddToCart = () => {
    if (!config) return;
    addItem({
      productId:   'custom',
      productName: selectedType?.name || 'Custom Shirt',
      shirtType:   selectedType?.name || '',
      color:       selectedColor?.name || 'Default',
      colorHex:    selectedColor?.hex  || '#FFFFFF',
      size:        selectedSize,
      quantity:    qty,
      unitPrice:   unitPrice(),
      designUrl:   designUrl || null,
      designId:    selectedMkt?._id   || null,
      designNote,
      designTitle: selectedMkt?.title || null,
      designPrice,
      image:       selectedType?.image || null,
    });
    navigate('/cart');
  };

  if (cfgLoad) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" className="text-ink-brown" />
    </div>
  );

  if (!config) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center glass-card p-10">
        <p className="text-white/50 mb-4">Customization settings not available.</p>
        <button onClick={() => navigate('/designs')} className="btn-primary w-auto px-8">← Back</button>
      </div>
    </div>
  );

  // Preview image: ONLY changes with shirt type, NOT color
  const mockupImg  = selectedType?.image || null;
  const previewImg = designTab === 'none' ? null : (localPreview || designUrl || selectedMkt?.imageUrl);

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-xs tracking-widest uppercase text-ink-brown mb-2">Design Studio</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">Customise Your Shirt</h1>
        </div>

        <StepBar current={step} />

        {/* Design pre-selected indicator — shown on steps 0 and 1 */}
        {selectedMkt && step < 2 && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background:'rgba(34,197,94,0.07)', border:'1px solid rgba(34,197,94,0.18)' }}>
            <img src={selectedMkt.imageUrl} alt="" className="w-9 h-9 object-contain rounded-lg flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-emerald-400 text-xs font-medium">Design selected: <span className="text-white">{selectedMkt.title}</span></p>
              <p className="text-white/30 text-xs">Pick your shirt type and colour, then continue.</p>
            </div>
            <button onClick={clearDesign} className="text-white/25 hover:text-white/60 text-xs transition-colors flex-shrink-0">Remove</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* LEFT: Mockup preview — image only changes with shirt type */}
          <div className="sticky top-24">
            <div className="glass-card overflow-hidden">
              <div className="relative w-full" style={{ paddingBottom: '100%' }}>
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{ background: selectedColor?.hex ? `${selectedColor.hex}18` : 'rgba(107,66,38,0.07)' }}>
                  {mockupImg
                    ? <img src={mockupImg} alt={selectedType?.name} className="w-full h-full object-contain p-8" />
                    : (
                      <div className="flex flex-col items-center gap-4 text-center p-8">
                        <svg className="w-28 h-28 text-ink-brown/15" fill="currentColor" viewBox="0 0 100 100">
                          <path d="M35 10 L20 25 L10 20 L15 45 L25 45 L25 90 L75 90 L75 45 L85 45 L90 20 L80 25 L65 10 C62 18 38 18 35 10Z" />
                        </svg>
                        <p className="text-white/20 text-sm">Upload a shirt type image<br/>in Customization Settings</p>
                      </div>
                    )
                  }
                  {previewImg && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <img src={previewImg} alt="Design" className="max-w-[40%] max-h-[40%] object-contain"
                        style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }} />
                    </div>
                  )}
                </div>
              </div>
              {/* Live price */}
              <div className="p-5 border-t border-white/[0.08] flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/35">Unit price</p>
                  <p className="font-display text-2xl font-bold text-white">PKR {Math.round(unitPrice()).toLocaleString()}</p>
                  {designPrice > 0 && (
                    <p className="text-xs text-white/25 mt-0.5">inc. PKR {Math.round(designPrice).toLocaleString()} design</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/35">×{qty} total</p>
                  <p className="font-display text-xl font-semibold text-ink-brown-light">PKR {Math.round(lineTotal()).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Step panels */}
          <div>
            <AnimatePresence mode="wait">

              {/* ── Step 0: Shirt Type ── */}
              {step === 0 && (
                <motion.div key="s0"
                  initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
                  transition={{ duration:0.22 }}
                  className="glass-card p-6 sm:p-8 space-y-6">
                  <h2 className="font-display text-xl font-semibold text-white">Choose Shirt Type</h2>

                  {config.shirtTypes.length === 0 ? (
                    <div className="text-center py-8 text-white/30 text-sm">
                      No shirt types configured yet.<br/>Admin can add them in Customization Settings.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {config.shirtTypes.map((t, i) => {
                        const isSelected = selectedType?.name === t.name;
                        return (
                          <button key={i} onClick={() => setSelectedType(t)}
                            className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200 group"
                            style={{
                              border: isSelected ? '2px solid rgba(107,66,38,0.7)' : '1.5px solid rgba(255,255,255,0.08)',
                              background: isSelected ? 'rgba(107,66,38,0.15)' : 'rgba(255,255,255,0.02)',
                            }}>
                            <div className="w-full rounded-lg overflow-hidden aspect-square"
                              style={{ background: 'rgba(255,255,255,0.04)' }}>
                              {t.image
                                ? <img src={t.image} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <svg className="w-8 h-8 text-ink-brown/30" fill="currentColor" viewBox="0 0 100 100">
                                      <path d="M35 10 L20 25 L10 20 L15 45 L25 45 L25 90 L75 90 L75 45 L85 45 L90 20 L80 25 L65 10 C62 18 38 18 35 10Z" />
                                    </svg>
                                  </div>
                                )
                              }
                            </div>
                            <p className="text-xs font-medium text-center leading-tight"
                              style={{ color: isSelected ? '#fff' : 'rgba(255,255,255,0.55)' }}>
                              {t.name}
                            </p>
                            {isSelected && (
                              <div className="w-4 h-4 rounded-full flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
                                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <button onClick={() => setStep(1)} disabled={!selectedType}
                    className="btn-primary disabled:opacity-50">
                    Continue to Colour & Size →
                  </button>
                </motion.div>
              )}

              {/* ── Step 1: Colour & Size ── */}
              {step === 1 && (
                <motion.div key="s1"
                  initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
                  transition={{ duration:0.22 }}
                  className="glass-card p-6 sm:p-8 space-y-7">
                  <h2 className="font-display text-xl font-semibold text-white">Colour & Size</h2>

                  {/* Colour — does NOT change mockup image */}
                  {config.colors.length > 0 && (
                    <div>
                      <p className="label mb-3">
                        Colour — <span className="text-white/60 normal-case tracking-normal">{selectedColor?.name}</span>
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {config.colors.map((c, i) => (
                          <Swatch key={i} color={c} selected={selectedColor?.name === c.name} onClick={() => setSelectedColor(c)} />
                        ))}
                      </div>
                      <p className="text-white/20 text-xs mt-2">Colour selection does not change the shirt preview image.</p>
                    </div>
                  )}

                  {/* Size */}
                  {config.sizes.length > 0 && (
                    <div>
                      <p className="label mb-3">
                        Size — <span className="text-white/60 normal-case tracking-normal">{selectedSize}</span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {config.sizes.map(s => (
                          <SizeBtn key={s} size={s} selected={selectedSize === s}
                            extra={sizePricingMap[s]} onClick={() => setSelectedSize(s)} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Qty */}
                  <div>
                    <p className="label mb-3">Quantity</p>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setQty(q => Math.max(1, q - 1))}
                        className="w-9 h-9 rounded-xl text-white/60 hover:text-white transition-colors flex items-center justify-center"
                        style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)' }}>−</button>
                      <span className="font-display text-xl font-bold text-white w-8 text-center">{qty}</span>
                      <button onClick={() => setQty(q => q + 1)}
                        className="w-9 h-9 rounded-xl text-white/60 hover:text-white transition-colors flex items-center justify-center"
                        style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)' }}>+</button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setStep(0)} className="btn-secondary">← Back</button>
                    <button onClick={() => setStep(2)} className="btn-primary">Continue to Design →</button>
                  </div>
                </motion.div>
              )}

              {/* ── Step 2: Design ── */}
              {step === 2 && (
                <motion.div key="s2"
                  initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
                  transition={{ duration:0.22 }}
                  className="glass-card p-6 sm:p-8 space-y-5">
                  <h2 className="font-display text-xl font-semibold text-white">Add Your Design</h2>

                  {/* Tabs */}
                  <div className="flex rounded-xl p-1 gap-1" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                    {DESIGN_TABS.map(t => (
                      <button key={t.id} onClick={() => setDesignTab(t.id)}
                        className="flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-150"
                        style={designTab === t.id
                          ? { background:'linear-gradient(135deg,#6B4226,#8B5A3C)', color:'#fff' }
                          : { color:'rgba(255,255,255,0.4)' }
                        }>
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Upload */}
                  {designTab === 'upload' && (
                    <label className="block cursor-pointer">
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />
                      <div className="relative w-full rounded-xl overflow-hidden transition-all duration-200"
                        style={{ paddingBottom:'60%', border:'1.5px dashed rgba(107,66,38,0.4)', background:'rgba(107,66,38,0.03)' }}>
                        <div className="absolute inset-0 flex items-center justify-center">
                          {uploading ? (
                            <div className="flex flex-col items-center gap-3">
                              <Spinner size="md" className="text-ink-brown" />
                              <div className="w-32 h-1 rounded-full bg-white/10 overflow-hidden">
                                <motion.div className="h-full rounded-full" style={{ background:'linear-gradient(90deg,#6B4226,#8B5A3C)' }}
                                  animate={{ width:`${uploadProgress}%` }} transition={{ duration:0.2 }} />
                              </div>
                              <span className="text-white/40 text-xs">{uploadProgress}%</span>
                            </div>
                          ) : localPreview || designUrl ? (
                            <div className="flex flex-col items-center gap-2 p-4">
                              <img src={localPreview || designUrl} alt="Design" className="max-h-28 object-contain rounded-lg" />
                              <p className="text-white/40 text-xs">Click to replace</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-3 p-6 text-center">
                              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                style={{ background:'rgba(107,66,38,0.15)', border:'1px solid rgba(107,66,38,0.3)' }}>
                                <svg className="w-6 h-6 text-ink-brown" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-white/70 text-sm font-medium">Click to upload</p>
                                <p className="text-white/30 text-xs mt-0.5">JPG, PNG, WEBP · Max 5 MB</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </label>
                  )}

                  {/* Marketplace */}
                  {designTab === 'marketplace' && (
                    <div>
                      {mktLoading ? (
                        <div className="flex justify-center py-8"><Spinner size="md" className="text-ink-brown" /></div>
                      ) : mktDesigns.length === 0 ? (
                        <p className="text-white/30 text-sm text-center py-8">No approved designs yet.</p>
                      ) : (
                        <>
                          {selectedMkt && (
                            <div className="mb-4 p-3 rounded-xl flex items-center gap-3"
                              style={{ background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)' }}>
                              <img src={selectedMkt.imageUrl} alt="" className="w-10 h-10 object-contain rounded-lg" />
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-xs font-medium truncate">"{selectedMkt.title}" selected</p>
                                <p className="text-emerald-400/70 text-xs">{selectedMkt.price === 0 ? 'Free' : `+PKR ${Math.round(selectedMkt.price).toLocaleString()}`}</p>
                              </div>
                              <button onClick={clearDesign} className="text-white/30 hover:text-white text-xs">Change</button>
                            </div>
                          )}
                          <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                            {mktDesigns.map((d, i) => (
                              <DesignCard key={d._id} design={d} index={i} selectable onSelect={handleSelectMarketplace} />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Plain */}
                  {designTab === 'none' && (
                    <div className="flex flex-col items-center gap-3 py-8 text-center">
                      <div className="text-4xl">👕</div>
                      <p className="text-white/60 text-sm font-medium">Plain shirt — no print</p>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="label">Placement notes <span className="text-white/25 normal-case tracking-normal">(optional)</span></label>
                    <textarea rows={2} className="glass-input resize-none" value={designNote}
                      onChange={e => setDesignNote(e.target.value)}
                      placeholder="e.g. Centre chest, 20×20 cm, 3 cm from collar…" />
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setStep(1)} className="btn-secondary">← Back</button>
                    <button onClick={() => setStep(3)}
                      disabled={designTab === 'upload' && !designUrl && !uploading}
                      className="btn-primary disabled:opacity-50">
                      Review Order →
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── Step 3: Review ── */}
              {step === 3 && (
                <motion.div key="s3"
                  initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
                  transition={{ duration:0.22 }}
                  className="glass-card p-6 sm:p-8 space-y-5">
                  <h2 className="font-display text-xl font-semibold text-white">Review Your Order</h2>

                  <div className="rounded-xl p-4 space-y-3"
                    style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
                    {[
                      { k:'Shirt Type', v: selectedType?.name || '—' },
                      { k:'Colour',     v: selectedColor?.name || '—' },
                      { k:'Size',       v: selectedSize },
                      { k:'Qty',        v: qty },
                      { k:'Design',     v: designTab === 'none' ? 'Plain (no print)' : designTab === 'marketplace' ? `"${selectedMkt?.title}"` : 'Custom upload ✓' },
                    ].map(({ k, v }) => (
                      <div key={k} className="flex justify-between text-sm">
                        <span className="text-white/40">{k}</span>
                        <span className="text-white font-medium">{String(v)}</span>
                      </div>
                    ))}
                    <div className="h-px bg-white/[0.08] my-1" />
                    <div className="flex justify-between text-sm">
                      <span className="text-white/40">Base price</span>
                      <span className="text-white">PKR {Math.round(config.basePrice + (sizePricingMap[selectedSize] || 0)).toLocaleString()}</span>
                    </div>
                    {designPrice > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-white/40">Design fee</span>
                        <span className="text-white">+PKR {Math.round(designPrice).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-white/60 font-medium">Line total</span>
                      <span className="font-display text-lg font-bold text-ink-brown-light">PKR {Math.round(lineTotal()).toLocaleString()}</span>
                    </div>
                  </div>

                  {designNote && (
                    <div className="rounded-xl p-4" style={{ background:'rgba(107,66,38,0.07)', border:'1px solid rgba(107,66,38,0.18)' }}>
                      <p className="text-xs text-white/35 mb-1">Placement notes</p>
                      <p className="text-white/65 text-sm">{designNote}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button onClick={() => setStep(2)} className="btn-secondary">← Back</button>
                    <button onClick={handleAddToCart} className="btn-primary flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
                      </svg>
                      Add to Cart
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
