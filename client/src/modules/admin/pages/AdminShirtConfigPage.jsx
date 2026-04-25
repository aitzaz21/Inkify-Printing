import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../../shared/api/axios';
import { uploadAPI } from '../../../shared/api/upload.service';
import { Spinner } from '../../../shared/components/Spinner';
import { SHIRT_TYPE_META } from '../../customize/utils/shirtTypes';

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const PRESET_COLORS = [
  { name: 'White',       hex: '#FFFFFF' }, { name: 'Black',      hex: '#0B0B0B' },
  { name: 'Navy',        hex: '#1a2e4a' }, { name: 'Grey',       hex: '#6B6460' },
  { name: 'Ash',         hex: '#B2B2B2' }, { name: 'Brown',      hex: '#6B4226' },
  { name: 'Sand',        hex: '#D4B896' }, { name: 'Olive',      hex: '#6B7A4B' },
  { name: 'Royal Blue',  hex: '#2B5EA7' }, { name: 'Red',        hex: '#C0392B' },
  { name: 'Dusty Rose',  hex: '#C9967A' }, { name: 'Washed Black', hex: '#2A2A2A' },
];

// ── Drop zone sub-component ──────────────────────────────────────────────────
function MockupDropZone({ label, url, pct, uploading, onFile, onClear, required }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    if (file.type !== 'image/png') {
      toast.error('Only PNG files are accepted for mockups.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File exceeds 10 MB limit.');
      return;
    }
    onFile(file);
  };

  if (url) {
    return (
      <div>
        <p className="text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {label} {required && <span className="text-emerald-400">✓</span>}
        </p>
        <div className="relative rounded-xl overflow-hidden group"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', aspectRatio: '3/4' }}>
          <img src={url} alt={label} className="w-full h-full object-contain" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'rgba(0,0,0,0.5)' }}>
            <button onClick={onClear}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: 'rgba(239,68,68,0.9)', color: '#fff' }}>
              Remove
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (uploading) {
    return (
      <div>
        <p className="text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</p>
        <div className="rounded-xl flex flex-col items-center justify-center gap-3 p-6"
          style={{ background: 'rgba(107,66,38,0.08)', border: '1px dashed rgba(107,66,38,0.4)', aspectRatio: '3/4' }}>
          <Spinner size="sm" className="text-[#C9967A]" />
          <div className="w-full px-4">
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="h-full rounded-full transition-all duration-300"
                style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#6B4226,#C9967A)' }} />
            </div>
            <p className="text-center text-xs mt-1.5" style={{ color: 'rgba(201,150,122,0.8)' }}>{pct}% uploaded</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
        {label} {required && <span style={{ color: 'rgba(239,68,68,0.8)' }}>*</span>}
      </p>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
        className="rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all p-4"
        style={{
          aspectRatio: '3/4',
          background: drag ? 'rgba(107,66,38,0.18)' : 'rgba(255,255,255,0.02)',
          border: `1.5px dashed ${drag ? 'rgba(201,150,122,0.7)' : 'rgba(255,255,255,0.12)'}`,
        }}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
          style={{ background: 'rgba(107,66,38,0.15)', color: '#C9967A' }}>
          ⬆
        </div>
        <p className="text-white/60 text-xs text-center font-medium">Drop PNG here</p>
        <p className="text-white/30 text-[10px] text-center leading-relaxed">
          or click to browse
        </p>
        <input ref={inputRef} type="file" accept="image/png" hidden
          onChange={(e) => handleFile(e.target.files[0])} />
      </div>
    </div>
  );
}

// ── Preview modal ────────────────────────────────────────────────────────────
function PreviewModal({ item, onClose }) {
  const [side, setSide] = useState('front');
  if (!item) return null;
  const url = side === 'front' ? item.frontUrl : item.backUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.88)' }}
      onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.18 }}
        className="relative w-full max-w-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full border border-white/20 flex-shrink-0"
              style={{ background: item.hex }} />
            <span className="text-white font-semibold text-sm">{item.colorName}</span>
            <span className="text-white/35 text-xs">· {item.typeLabel}</span>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all text-sm">
            ✕
          </button>
        </div>

        {/* Side switcher */}
        <div className="flex gap-2 mb-3">
          {['front', 'back'].map(s => {
            const available = s === 'front' ? !!item.frontUrl : !!item.backUrl;
            return (
              <button key={s} onClick={() => available && setSide(s)} disabled={!available}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={side === s && available
                  ? { background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', color: '#fff' }
                  : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.08)' }
                }>
                {s.charAt(0).toUpperCase() + s.slice(1)}
                {!available && ' (none)'}
              </button>
            );
          })}
        </div>

        {/* Mockup preview */}
        <div className="rounded-2xl overflow-hidden flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', aspectRatio: '3/4', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>
          {url ? (
            <img src={url} alt={`${item.colorName} ${side}`}
              className="w-full h-full object-contain p-4"
              style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.6))' }} />
          ) : (
            <p className="text-white/20 text-xs">No {side} mockup uploaded</p>
          )}
        </div>

        {/* Dimension reminder */}
        <p className="text-white/25 text-[10px] text-center mt-2.5 leading-relaxed">
          900 × 1200 px · PNG · Transparent background
        </p>
      </motion.div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function AdminShirtConfigPage() {
  const [config,      setConfig]      = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [toggling,    setToggling]    = useState(null);

  // Mockup management
  const [expandedMockupType, setExpandedMockupType] = useState(null);
  const [mockupForm, setMockupForm] = useState({
    colorName: '', hex: '#FFFFFF',
    frontUrl: '', backUrl: '',
    frontPct: 0, backPct: 0,
    frontUploading: false, backUploading: false,
  });
  const [mockupSaving,   setMockupSaving]   = useState(false);
  const [deletingMockup, setDeletingMockup] = useState(null);
  const [previewItem,    setPreviewItem]    = useState(null);

  // Color form
  const [colorName, setColorName] = useState('');
  const [colorHex,  setColorHex]  = useState('#FFFFFF');

  // Size form
  const [newSize, setNewSize] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/shirt-config')
      .then(r => setConfig(r.data.config))
      .catch(() => toast.error('Failed to load config.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  // ── General settings save ────────────────────────────────────
  const saveGeneral = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const sizePricingObj = config.sizePricing instanceof Map
        ? Object.fromEntries(config.sizePricing)
        : (config.sizePricing || {});
      await api.put('/shirt-config', {
        colors:      config.colors,
        sizes:       config.sizes,
        basePrice:   config.basePrice,
        sizePricing: sizePricingObj,
      });
      toast.success('Settings saved.');
      load();
    } catch { toast.error('Save failed.'); }
    finally { setSaving(false); }
  };

  // ── Toggle shirt type ────────────────────────────────────────
  const toggleShirtType = async (id) => {
    setToggling(id);
    try {
      await api.patch(`/shirt-config/shirt-types/${id}/toggle`);
      toast.success('Shirt type updated.');
      load();
    } catch { toast.error('Failed to update.'); }
    finally { setToggling(null); }
  };

  // ── Mockup upload ────────────────────────────────────────────
  const uploadMockupFile = async (file, side) => {
    setMockupForm(f => ({ ...f, [`${side}Uploading`]: true, [`${side}Pct`]: 0 }));
    try {
      const res = await uploadAPI.uploadMockup(file, (pct) =>
        setMockupForm(f => ({ ...f, [`${side}Pct`]: pct }))
      );
      setMockupForm(f => ({ ...f, [`${side}Url`]: res.data.url, [`${side}Uploading`]: false }));
      toast.success(`${side.charAt(0).toUpperCase() + side.slice(1)} mockup uploaded.`);
    } catch (e) {
      const msg = e?.response?.data?.message || 'Upload failed.';
      toast.error(msg);
      setMockupForm(f => ({ ...f, [`${side}Uploading`]: false }));
    }
  };

  // ── Mockup save ──────────────────────────────────────────────
  const saveMockup = async (typeId) => {
    const { colorName: cn, hex, frontUrl, backUrl } = mockupForm;
    if (!cn.trim()) { toast.error('Enter a color name.'); return; }
    if (!hex)       { toast.error('Choose a color.'); return; }
    if (!frontUrl)  { toast.error('Upload a front mockup image first.'); return; }
    setMockupSaving(true);
    try {
      await api.post(`/shirt-config/shirt-types/${typeId}/mockups`, {
        colorName: cn.trim(), hex, frontUrl, backUrl,
      });
      toast.success('Mockup saved!');
      setMockupForm({ colorName: '', hex: '#FFFFFF', frontUrl: '', backUrl: '', frontPct: 0, backPct: 0, frontUploading: false, backUploading: false });
      load();
    } catch { toast.error('Failed to save mockup.'); }
    finally { setMockupSaving(false); }
  };

  // ── Mockup delete ────────────────────────────────────────────
  const deleteMockup = async (typeId, mockupId) => {
    setDeletingMockup(mockupId);
    try {
      await api.delete(`/shirt-config/shirt-types/${typeId}/mockups/${mockupId}`);
      toast.success('Mockup removed.');
      load();
    } catch { toast.error('Failed to delete.'); }
    finally { setDeletingMockup(null); }
  };

  // ── Fill form from existing global color ─────────────────────
  const fillFromGlobalColor = (c) => {
    setMockupForm(f => ({ ...f, colorName: c.name, hex: c.hex }));
  };

  // ── Colors ──────────────────────────────────────────────────
  const addColor = () => {
    if (!colorName.trim()) { toast.error('Enter a color name.'); return; }
    if (config.colors.some(c => c.name.toLowerCase() === colorName.trim().toLowerCase())) {
      toast.error('Color already exists.'); return;
    }
    setConfig(prev => ({ ...prev, colors: [...prev.colors, { name: colorName.trim(), hex: colorHex }] }));
    setColorName(''); setColorHex('#FFFFFF');
  };

  const removeColor = (idx) => {
    setConfig(prev => ({ ...prev, colors: prev.colors.filter((_, i) => i !== idx) }));
  };

  const addPresetColor = (c) => {
    if (config.colors.some(x => x.name === c.name)) return;
    setConfig(prev => ({ ...prev, colors: [...prev.colors, c] }));
  };

  // ── Sizes ────────────────────────────────────────────────────
  const toggleSize = (s) => {
    const exists = config.sizes.includes(s);
    setConfig(prev => ({
      ...prev,
      sizes: exists ? prev.sizes.filter(x => x !== s) : [...prev.sizes, s],
    }));
  };

  const addCustomSize = () => {
    const s = newSize.trim().toUpperCase();
    if (!s) return;
    if (config.sizes.includes(s)) { toast.error('Already added.'); return; }
    setConfig(prev => ({ ...prev, sizes: [...prev.sizes, s] }));
    setNewSize('');
  };

  const sizePricingMap = config?.sizePricing instanceof Map
    ? Object.fromEntries(config.sizePricing)
    : (config?.sizePricing || {});

  if (loading) return (
    <div className="flex justify-center py-16">
      <Spinner size="lg" className="text-ink-brown" />
    </div>
  );

  if (!config) return (
    <div className="text-center py-16 glass-card">
      <p className="text-white/30">Failed to load configuration.</p>
    </div>
  );

  return (
    <div className="space-y-8">

      {/* Preview modal */}
      <AnimatePresence>
        {previewItem && <PreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />}
      </AnimatePresence>

      {/* Page header */}
      <div>
        <p className="text-xs tracking-widest uppercase text-ink-brown mb-1">Admin</p>
        <h1 className="font-display text-2xl font-bold text-white">Customization Settings</h1>
        <p className="text-white/35 text-sm mt-1">
          Manage shirt types, mockup images, colours, sizes, and pricing.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SHIRT TYPES SECTION
          ═══════════════════════════════════════════════════════════════ */}
      <div className="glass-card p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="font-display text-lg font-semibold text-white">Shirt Types</h2>
          <p className="text-white/35 text-xs mt-1">
            Three fixed shirt types. Toggle each on or off for customers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {config.shirtTypes.map(t => {
            const meta       = SHIRT_TYPE_META[t.id] || { label: t.name, description: '' };
            const isToggling = toggling === t.id;
            const mockupCount = t.mockups?.length || 0;
            return (
              <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-5 flex flex-col gap-4"
                style={{
                  border: t.enabled ? '1px solid rgba(107,66,38,0.45)' : '1px solid rgba(255,255,255,0.08)',
                  background: t.enabled ? 'rgba(107,66,38,0.08)' : 'rgba(255,255,255,0.02)',
                  opacity: t.enabled ? 1 : 0.6,
                }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-display font-semibold text-white text-sm">{meta.label}</p>
                    <p className="text-white/35 text-xs mt-0.5">{meta.description}</p>
                    <p className="text-xs mt-1.5" style={{ color: mockupCount > 0 ? 'rgba(34,197,94,0.8)' : 'rgba(255,255,255,0.25)' }}>
                      {mockupCount > 0 ? `${mockupCount} mockup${mockupCount > 1 ? 's' : ''} uploaded` : 'No mockups yet'}
                    </p>
                  </div>
                  <div className="flex-shrink-0 w-10 h-10 ml-2"
                    style={{ color: t.enabled ? '#8B5A3C' : 'rgba(255,255,255,0.2)' }}>
                    <svg viewBox="0 0 100 110" fill="currentColor" className="w-full h-full drop-shadow-sm">
                      {t.id === 'vneck'
                        ? <path d="M38 10 L22 26 L8 20 L13 50 L24 50 L24 100 L76 100 L76 50 L87 50 L92 20 L78 26 L62 10 L50 46 Z" />
                        : t.id === 'polo'
                          ? <><path d="M38 10 L22 26 L8 20 L13 50 L24 50 L24 100 L76 100 L76 50 L87 50 L92 20 L78 26 L62 10 C60 6 55 5 50 12 C45 5 40 6 38 10Z" /><rect x="47" y="12" width="6" height="20" rx="2" fill="rgba(0,0,0,0.2)" /></>
                          : <path d="M38 10 L22 26 L8 20 L13 50 L24 50 L24 100 L76 100 L76 50 L87 50 L92 20 L78 26 L62 10 C59 18 41 18 38 10Z" />
                      }
                    </svg>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: t.enabled ? '#22c55e' : 'rgba(255,255,255,0.25)' }} />
                  <span className="text-xs"
                    style={{ color: t.enabled ? 'rgba(34,197,94,0.9)' : 'rgba(255,255,255,0.35)' }}>
                    {t.enabled ? 'Visible to customers' : 'Hidden from customers'}
                  </span>
                </div>

                <button onClick={() => toggleShirtType(t.id)} disabled={isToggling}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-60"
                  style={t.enabled
                    ? { background: 'rgba(239,68,68,0.08)', color: 'rgba(239,68,68,0.85)', border: '1px solid rgba(239,68,68,0.2)' }
                    : { background: 'rgba(34,197,94,0.08)', color: 'rgba(34,197,94,0.85)', border: '1px solid rgba(34,197,94,0.2)' }
                  }>
                  {isToggling ? <Spinner size="sm" className="text-current" /> : t.enabled ? 'Disable' : 'Enable'}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SHIRT MOCKUPS SECTION
          ═══════════════════════════════════════════════════════════════ */}
      <div className="glass-card p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="font-display text-lg font-semibold text-white">Shirt Mockups</h2>
          <p className="text-white/35 text-xs mt-1">
            Upload real PNG shirt images per type and colour. When a mockup is available for the
            customer's selection, it replaces the default rendered shirt automatically.
          </p>
        </div>

        {/* ── Requirements banner ── */}
        <div className="rounded-2xl p-4 sm:p-5 space-y-3"
          style={{ background: 'rgba(201,150,122,0.07)', border: '1px solid rgba(201,150,122,0.20)' }}>
          <div className="flex items-center gap-2 mb-1">
            <span style={{ color: '#C9967A', fontSize: 15 }}>📐</span>
            <p className="text-sm font-semibold" style={{ color: '#C9967A' }}>Mockup Upload Requirements</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: '🖼', title: 'Format', desc: 'PNG only — required for transparent background' },
              { icon: '📏', title: 'Dimensions', desc: '900 × 1200 px (3 : 4 ratio) for best fit' },
              { icon: '✂', title: 'Background', desc: 'Must be fully transparent (no white/colour fill)' },
              { icon: '📦', title: 'File size', desc: 'Maximum 10 MB per image' },
              { icon: '🎽', title: 'Framing', desc: 'Shirt centred with ~5 % padding on each side' },
              { icon: '💡', title: 'Lighting', desc: 'Flat lay on white or transparent — no props' },
            ].map(r => (
              <div key={r.title} className="flex items-start gap-2.5">
                <span className="flex-shrink-0 text-base">{r.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-white/70">{r.title}</p>
                  <p className="text-xs text-white/40 leading-relaxed">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl p-3 mt-1"
            style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)' }}>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(147,197,253,0.75)' }}>
              <span className="font-semibold text-blue-300">Tip:</span> Upload separate mockups for each
              colour variant you offer. Customers who select a colour without a mockup will still see the
              default rendered shirt automatically — so you can add mockups gradually.
            </p>
          </div>
        </div>

        {/* ── Per shirt-type sections ── */}
        <div className="space-y-4">
          {config.shirtTypes.map(shirtType => {
            const meta     = SHIRT_TYPE_META[shirtType.id] || { label: shirtType.name };
            const isOpen   = expandedMockupType === shirtType.id;
            const mockups  = shirtType.mockups || [];

            return (
              <div key={shirtType.id} className="rounded-2xl overflow-hidden"
                style={{ border: isOpen ? '1px solid rgba(107,66,38,0.5)' : '1px solid rgba(255,255,255,0.07)', background: isOpen ? 'rgba(107,66,38,0.06)' : 'rgba(255,255,255,0.02)' }}>

                {/* Header row */}
                <button
                  onClick={() => setExpandedMockupType(isOpen ? null : shirtType.id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(107,66,38,0.15)' }}>
                      <svg viewBox="0 0 100 110" fill="#8B5A3C" className="w-4 h-4">
                        {shirtType.id === 'vneck'
                          ? <path d="M38 10 L22 26 L8 20 L13 50 L24 50 L24 100 L76 100 L76 50 L87 50 L92 20 L78 26 L62 10 L50 46 Z" />
                          : shirtType.id === 'polo'
                            ? <path d="M38 10 L22 26 L8 20 L13 50 L24 50 L24 100 L76 100 L76 50 L87 50 L92 20 L78 26 L62 10 C60 6 55 5 50 12 C45 5 40 6 38 10Z" />
                            : <path d="M38 10 L22 26 L8 20 L13 50 L24 50 L24 100 L76 100 L76 50 L87 50 L92 20 L78 26 L62 10 C59 18 41 18 38 10Z" />
                        }
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{meta.label}</p>
                      <p className="text-white/35 text-xs">
                        {mockups.length === 0 ? 'No mockups — click to add' : `${mockups.length} colour mockup${mockups.length > 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {mockups.length > 0 && (
                      <div className="flex -space-x-1.5">
                        {mockups.slice(0, 5).map(m => (
                          <div key={m._id || m.hex} className="w-5 h-5 rounded-full border-2 flex-shrink-0"
                            style={{ background: m.hex, borderColor: 'rgba(0,0,0,0.4)' }} />
                        ))}
                        {mockups.length > 5 && (
                          <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-[8px] font-bold"
                            style={{ background: '#1a1a1a', borderColor: 'rgba(0,0,0,0.4)', color: 'rgba(255,255,255,0.6)' }}>
                            +{mockups.length - 5}
                          </div>
                        )}
                      </div>
                    )}
                    <svg className="w-4 h-4 transition-transform duration-200"
                      style={{ color: 'rgba(255,255,255,0.35)', transform: isOpen ? 'rotate(180deg)' : 'none' }}
                      fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </div>
                </button>

                {/* Expanded content */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="px-5 pb-6 space-y-6"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>

                        {/* ── Existing mockups grid ── */}
                        {mockups.length > 0 && (
                          <div className="pt-4 space-y-3">
                            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
                              Uploaded Mockups
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                              {mockups.map(m => (
                                <div key={m._id || m.hex} className="rounded-xl overflow-hidden"
                                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>

                                  {/* Mockup thumbnail */}
                                  <div className="relative group"
                                    style={{ aspectRatio: '3/4', background: 'linear-gradient(135deg,#111,#1a1a1a)' }}>
                                    {m.frontUrl ? (
                                      <img src={m.frontUrl} alt={m.colorName}
                                        className="w-full h-full object-contain p-2" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-white/15 text-xs">No front</span>
                                      </div>
                                    )}
                                    {/* Back indicator */}
                                    {m.backUrl && (
                                      <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold"
                                        style={{ background: 'rgba(34,197,94,0.85)', color: '#fff' }}>
                                        F+B
                                      </div>
                                    )}
                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                      style={{ background: 'rgba(0,0,0,0.6)' }}>
                                      <button
                                        onClick={() => setPreviewItem({ ...m, typeLabel: meta.label })}
                                        className="px-2 py-1 rounded-lg text-[10px] font-semibold"
                                        style={{ background: 'rgba(107,66,38,0.9)', color: '#fff' }}>
                                        Preview
                                      </button>
                                    </div>
                                  </div>

                                  {/* Mockup info */}
                                  <div className="p-2.5 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <div className="w-3.5 h-3.5 rounded-full flex-shrink-0 border border-white/15"
                                        style={{ background: m.hex }} />
                                      <span className="text-white/70 text-xs truncate">{m.colorName}</span>
                                    </div>
                                    <button
                                      onClick={() => deleteMockup(shirtType.id, m._id)}
                                      disabled={deletingMockup === m._id}
                                      className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-all hover:bg-red-500/20 disabled:opacity-50"
                                      style={{ color: 'rgba(239,68,68,0.7)' }}>
                                      {deletingMockup === m._id
                                        ? <Spinner size="sm" className="text-current" />
                                        : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                                      }
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* ── Add new mockup form ── */}
                        <div className="rounded-2xl p-5 space-y-5"
                          style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <p className="text-sm font-semibold text-white">
                            {mockups.length > 0 ? 'Add Another Colour Mockup' : 'Add Your First Mockup'}
                          </p>

                          {/* Step 1: Colour selection */}
                          <div className="space-y-3">
                            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.30)' }}>
                              Step 1 — Choose colour
                            </p>

                            {/* Quick-fill from global colours */}
                            {config.colors.length > 0 && (
                              <div>
                                <p className="text-white/35 text-xs mb-2">Quick-fill from your configured colours:</p>
                                <div className="flex flex-wrap gap-2">
                                  {config.colors.map((c, i) => {
                                    const alreadyHas = mockups.some(m => m.hex.toLowerCase() === c.hex.toLowerCase());
                                    return (
                                      <button key={i} onClick={() => fillFromGlobalColor(c)}
                                        title={`${c.name} ${alreadyHas ? '(already has mockup)' : ''}`}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all"
                                        style={{
                                          background: mockupForm.hex.toLowerCase() === c.hex.toLowerCase()
                                            ? 'rgba(107,66,38,0.4)' : 'rgba(255,255,255,0.04)',
                                          border: mockupForm.hex.toLowerCase() === c.hex.toLowerCase()
                                            ? '1px solid rgba(201,150,122,0.5)' : '1px solid rgba(255,255,255,0.08)',
                                          color: alreadyHas ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.65)',
                                        }}>
                                        <div className="w-3.5 h-3.5 rounded-full border border-white/20"
                                          style={{ background: c.hex }} />
                                        {c.name}
                                        {alreadyHas && <span className="text-emerald-400/60">✓</span>}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Manual colour input */}
                            <div className="flex gap-3 items-end flex-wrap">
                              <div>
                                <label className="label text-xs">Colour Name</label>
                                <input className="glass-input w-36" value={mockupForm.colorName}
                                  onChange={e => setMockupForm(f => ({ ...f, colorName: e.target.value }))}
                                  placeholder="e.g. Forest Green" />
                              </div>
                              <div>
                                <label className="label text-xs">Hex Value</label>
                                <div className="flex items-center gap-2">
                                  <input type="color" value={mockupForm.hex}
                                    onChange={e => setMockupForm(f => ({ ...f, hex: e.target.value }))}
                                    className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0.5"
                                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                                  <input className="glass-input w-28 font-mono text-sm" value={mockupForm.hex}
                                    onChange={e => setMockupForm(f => ({ ...f, hex: e.target.value }))}
                                    placeholder="#RRGGBB" />
                                </div>
                              </div>
                              {mockupForm.hex && (
                                <div className="flex items-center gap-2 px-3 py-2 rounded-xl self-end"
                                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                  <div className="w-6 h-6 rounded-full border border-white/20"
                                    style={{ background: mockupForm.hex }} />
                                  <span className="text-white/50 text-xs">{mockupForm.colorName || 'Preview'}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Step 2: Image uploads */}
                          <div className="space-y-3">
                            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.30)' }}>
                              Step 2 — Upload mockup images (PNG · transparent background)
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                              <MockupDropZone
                                label="Front view"
                                required
                                url={mockupForm.frontUrl}
                                pct={mockupForm.frontPct}
                                uploading={mockupForm.frontUploading}
                                onFile={(file) => uploadMockupFile(file, 'front')}
                                onClear={() => setMockupForm(f => ({ ...f, frontUrl: '' }))}
                              />
                              <MockupDropZone
                                label="Back view (optional)"
                                url={mockupForm.backUrl}
                                pct={mockupForm.backPct}
                                uploading={mockupForm.backUploading}
                                onFile={(file) => uploadMockupFile(file, 'back')}
                                onClear={() => setMockupForm(f => ({ ...f, backUrl: '' }))}
                              />
                            </div>
                          </div>

                          {/* Save button */}
                          <div className="flex items-center gap-3 pt-1">
                            <button onClick={() => saveMockup(shirtType.id)}
                              disabled={mockupSaving || !mockupForm.frontUrl || !mockupForm.colorName.trim() || mockupForm.frontUploading || mockupForm.backUploading}
                              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 transition-all"
                              style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', color: '#fff', boxShadow: '0 4px 14px rgba(107,66,38,0.35)' }}>
                              {mockupSaving && <Spinner size="sm" className="text-white" />}
                              {mockupSaving ? 'Saving…' : 'Save Mockup'}
                            </button>
                            {!mockupForm.frontUrl && (
                              <p className="text-white/30 text-xs">Upload a front image to enable save</p>
                            )}
                            {mockupForm.frontUrl && mockupForm.colorName.trim() && !mockupSaving && (
                              <p className="text-emerald-400/60 text-xs">Ready to save</p>
                            )}
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          COLOURS SECTION
          ═══════════════════════════════════════════════════════════════ */}
      <div className="glass-card p-6 sm:p-8 space-y-5">
        <h2 className="font-display text-lg font-semibold text-white">Shirt Colours</h2>
        <p className="text-white/35 text-xs -mt-3">
          Global colour list shown to customers in the customizer. Add mockup images above for each colour.
        </p>

        {/* Current colors */}
        <div className="flex flex-wrap gap-3">
          {config.colors.map((c, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl group"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-5 h-5 rounded-full border border-white/15 flex-shrink-0"
                style={{ background: c.hex }} />
              <span className="text-white/70 text-xs">{c.name}</span>
              <button onClick={() => removeColor(i)}
                className="text-white/25 hover:text-red-400 transition-colors ml-1 text-xs">×</button>
            </div>
          ))}
        </div>

        {/* Quick-add presets */}
        <div>
          <p className="text-white/35 text-xs mb-2">Quick add presets:</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c, i) => {
              const exists = config.colors.some(x => x.name === c.name);
              return (
                <button key={i} onClick={() => addPresetColor(c)} disabled={exists}
                  title={c.name}
                  className="w-7 h-7 rounded-full transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-default"
                  style={{
                    background: c.hex,
                    border: exists ? '2px solid rgba(107,66,38,0.6)' : '2px solid rgba(255,255,255,0.1)',
                  }} />
              );
            })}
          </div>
        </div>

        {/* Custom color add */}
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="label text-xs">Name</label>
            <input className="glass-input w-36" value={colorName}
              onChange={e => setColorName(e.target.value)} placeholder="e.g. Teal" />
          </div>
          <div>
            <label className="label text-xs">Hex Colour</label>
            <div className="flex items-center gap-2">
              <input type="color" value={colorHex} onChange={e => setColorHex(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0.5"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
              <input className="glass-input w-28 font-mono text-sm" value={colorHex}
                onChange={e => setColorHex(e.target.value)} placeholder="#RRGGBB" />
            </div>
          </div>
          <button onClick={addColor}
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(107,66,38,0.2)', color: '#C48A5C', border: '1px solid rgba(107,66,38,0.3)' }}>
            + Add Colour
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SIZES & PRICING SECTION
          ═══════════════════════════════════════════════════════════════ */}
      <div className="glass-card p-6 sm:p-8 space-y-5">
        <h2 className="font-display text-lg font-semibold text-white">Sizes & Pricing</h2>

        {/* Base price */}
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="label text-xs">Base Price (PKR)</label>
            <input type="number" step="1" min="0" className="glass-input w-32"
              value={config.basePrice}
              onChange={e => setConfig(prev => ({ ...prev, basePrice: parseFloat(e.target.value) || 0 }))} />
          </div>
          <p className="text-white/30 text-xs self-end pb-3">
            Base price for all orders. Size surcharges added on top.
          </p>
        </div>

        {/* Size toggles */}
        <div>
          <p className="label text-xs mb-2">Available Sizes (click to toggle)</p>
          <div className="flex flex-wrap gap-2">
            {ALL_SIZES.map(s => {
              const active = config.sizes.includes(s);
              return (
                <button key={s} onClick={() => toggleSize(s)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={active
                    ? { background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', color: '#fff' }
                    : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }
                  }>
                  {s}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 mt-3">
            <input className="glass-input w-28 text-sm" value={newSize}
              onChange={e => setNewSize(e.target.value)}
              placeholder="Custom size"
              onKeyDown={e => e.key === 'Enter' && addCustomSize()} />
            <button onClick={addCustomSize}
              className="px-3 py-2 rounded-xl text-sm"
              style={{ background: 'rgba(107,66,38,0.2)', color: '#C48A5C', border: '1px solid rgba(107,66,38,0.3)' }}>
              + Add
            </button>
          </div>
        </div>

        {/* Size surcharges */}
        {config.sizes.length > 0 && (
          <div>
            <p className="label text-xs mb-2">Size Surcharges (PKR added to base)</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {config.sizes.map(s => (
                <div key={s} className="flex items-center gap-2">
                  <span className="text-white/60 text-sm w-12">{s}</span>
                  <input type="number" step="1" min="0" className="glass-input flex-1 text-sm"
                    placeholder="0"
                    value={sizePricingMap[s] || ''}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      const nm = { ...sizePricingMap };
                      if (val > 0) nm[s] = val; else delete nm[s];
                      setConfig(prev => ({ ...prev, sizePricing: nm }));
                    }} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button onClick={saveGeneral} disabled={saving}
          className="flex items-center gap-2 px-8 py-3 rounded-xl font-medium text-sm disabled:opacity-60"
          style={{
            background: 'linear-gradient(135deg,#6B4226,#8B5A3C)',
            color: '#fff',
            boxShadow: '0 4px 16px rgba(107,66,38,0.4)',
          }}>
          {saving && <Spinner size="sm" className="text-white" />}
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
