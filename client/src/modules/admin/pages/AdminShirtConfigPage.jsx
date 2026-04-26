import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../../shared/api/axios';
import { uploadAPI } from '../../../shared/api/upload.service';
import { Spinner } from '../../../shared/components/Spinner';

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const PRESET_COLORS = [
  { name: 'White',       hex: '#FFFFFF' }, { name: 'Black',      hex: '#0B0B0B' },
  { name: 'Navy',        hex: '#1a2e4a' }, { name: 'Grey',       hex: '#6B6460' },
  { name: 'Ash',         hex: '#B2B2B2' }, { name: 'Brown',      hex: '#6B4226' },
  { name: 'Sand',        hex: '#D4B896' }, { name: 'Olive',      hex: '#6B7A4B' },
  { name: 'Royal Blue',  hex: '#2B5EA7' }, { name: 'Red',        hex: '#C0392B' },
  { name: 'Dusty Rose',  hex: '#C9967A' }, { name: 'Washed Black', hex: '#2A2A2A' },
];
const EMPTY_FORM = { colorName: '', hex: '#FFFFFF', frontUrl: '', backUrl: '', frontPct: 0, backPct: 0, frontUploading: false, backUploading: false };

// ── Mockup image drop zone ────────────────────────────────────────────────────
function DropZone({ label, required, url, pct, uploading, onFile, onClear }) {
  const ref  = useRef(null);
  const [drag, setDrag] = useState(false);

  const pick = (file) => {
    if (!file) return;
    if (file.type !== 'image/png') { toast.error('Only PNG files accepted.'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Max 10 MB.'); return; }
    onFile(file);
  };

  if (url) return (
    <div>
      <p className="text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
        {label} <span className="text-emerald-400">✓</span>
      </p>
      <div className="relative rounded-xl overflow-hidden group"
        style={{ aspectRatio: '3/4', background: '#111', border: '1px solid rgba(34,197,94,0.25)' }}>
        <img src={url} alt={label} className="w-full h-full object-contain p-1.5" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(0,0,0,0.55)' }}>
          <button onClick={onClear}
            className="px-3 py-1 rounded-lg text-xs font-semibold"
            style={{ background: 'rgba(239,68,68,0.9)', color: '#fff' }}>
            Remove
          </button>
        </div>
      </div>
    </div>
  );

  if (uploading) return (
    <div>
      <p className="text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</p>
      <div className="rounded-xl flex flex-col items-center justify-center gap-2 p-4"
        style={{ aspectRatio: '3/4', background: 'rgba(107,66,38,0.06)', border: '1px dashed rgba(107,66,38,0.3)' }}>
        <Spinner size="sm" className="text-[#C9967A]" />
        <div className="w-full px-2">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#6B4226,#C9967A)', transition: 'width .3s' }} />
          </div>
          <p className="text-center text-[10px] mt-1" style={{ color: 'rgba(201,150,122,0.7)' }}>{pct}%</p>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <p className="text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
        {label} {required && <span className="text-red-400">*</span>}
      </p>
      <div
        onClick={() => ref.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
        className="rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer text-center p-3 transition-all"
        style={{
          aspectRatio: '3/4',
          background: drag ? 'rgba(107,66,38,0.14)' : 'rgba(255,255,255,0.02)',
          border: `1.5px dashed ${drag ? 'rgba(201,150,122,0.65)' : 'rgba(255,255,255,0.1)'}`,
        }}
      >
        <span className="text-xl">📷</span>
        <p className="text-white/40 text-[11px] leading-tight">Drop PNG<br/>or click</p>
        <p className="text-white/20 text-[10px]">Transparent · 10 MB</p>
        <input ref={ref} type="file" accept="image/png" hidden onChange={e => pick(e.target.files[0])} />
      </div>
    </div>
  );
}

// ── Full-size preview modal ────────────────────────────────────────────────────
function PreviewModal({ item, typeName, onClose }) {
  const [side, setSide] = useState('front');
  if (!item) return null;
  const url = side === 'front' ? item.frontUrl : item.backUrl;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.9)' }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.93 }} transition={{ duration: 0.16 }}
        className="relative w-full max-w-[260px]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border border-white/20" style={{ background: item.hex }} />
            <p className="text-white text-sm font-semibold">{item.colorName}</p>
            <p className="text-white/35 text-xs">· {typeName}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors text-xl leading-none ml-3">✕</button>
        </div>
        {/* Side toggle */}
        <div className="flex gap-1.5 mb-3">
          {[['front','Front'], ['back','Back']].map(([s, label]) => {
            const has = s === 'front' ? !!item.frontUrl : !!item.backUrl;
            return (
              <button key={s} onClick={() => has && setSide(s)} disabled={!has}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30"
                style={side === s && has
                  ? { background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', color: '#fff' }
                  : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }
                }>
                {label}{!has && ' (none)'}
              </button>
            );
          })}
        </div>
        <div className="rounded-2xl overflow-hidden flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)', aspectRatio: '3/4', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>
          {url
            ? <img src={url} alt="" className="w-full h-full object-contain p-4" style={{ filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.6))' }} />
            : <p className="text-white/20 text-xs">No {side} image</p>
          }
        </div>
        <p className="text-white/20 text-[10px] text-center mt-2">Click outside to close</p>
      </motion.div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminShirtConfigPage() {
  const [config,      setConfig]      = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);

  // Shirt type management
  const [newTypeName,    setNewTypeName]    = useState('');
  const [addingType,     setAddingType]     = useState(false);
  const [expandedType,   setExpandedType]   = useState(null);
  const [toggling,       setToggling]       = useState(null);
  const [deletingType,   setDeletingType]   = useState(null);
  const [deletingMockup, setDeletingMockup] = useState(null);
  const [mockupSaving,   setMockupSaving]   = useState(false);
  const [previewItem,    setPreviewItem]     = useState(null);
  const [mockupForm,     setMockupForm]      = useState(EMPTY_FORM);

  // Global colours
  const [colorName, setColorName] = useState('');
  const [colorHex,  setColorHex]  = useState('#FFFFFF');

  // Sizes
  const [newSize, setNewSize] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/shirt-config')
      .then(r => setConfig(r.data.config))
      .catch(() => toast.error('Failed to load config.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  // Reset mockup form when accordion changes
  useEffect(() => { setMockupForm(EMPTY_FORM); }, [expandedType]);

  // ── Shirt type: add ───────────────────────────────────────────────────────
  const addShirtType = async () => {
    const name = newTypeName.trim();
    if (!name) { toast.error('Enter a shirt type name.'); return; }
    setAddingType(true);
    try {
      const r = await api.post('/shirt-config/shirt-types', { name });
      setNewTypeName('');
      setConfig(r.data.config);
      // Auto-expand the newly added type
      const newType = r.data.config.shirtTypes.at(-1);
      if (newType) setExpandedType(newType._id);
      toast.success(`"${name}" added.`);
    } catch (e) { toast.error(e?.response?.data?.message || 'Failed to add.'); }
    finally { setAddingType(false); }
  };

  // ── Shirt type: delete ────────────────────────────────────────────────────
  const deleteShirtType = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? All its colour variants will be removed.`)) return;
    setDeletingType(id);
    try {
      const r = await api.delete(`/shirt-config/shirt-types/${id}`);
      setConfig(r.data.config);
      if (expandedType === id) setExpandedType(null);
      toast.success('Shirt type deleted.');
    } catch { toast.error('Delete failed.'); }
    finally { setDeletingType(null); }
  };

  // ── Shirt type: toggle ────────────────────────────────────────────────────
  const toggleShirtType = async (id) => {
    setToggling(id);
    try {
      const r = await api.patch(`/shirt-config/shirt-types/${id}/toggle`);
      setConfig(r.data.config);
    } catch { toast.error('Toggle failed.'); }
    finally { setToggling(null); }
  };

  // ── Colour variant: upload image ──────────────────────────────────────────
  const uploadImg = async (file, side) => {
    setMockupForm(f => ({ ...f, [`${side}Uploading`]: true, [`${side}Pct`]: 0 }));
    try {
      const res = await uploadAPI.uploadMockup(file, pct => setMockupForm(f => ({ ...f, [`${side}Pct`]: pct })));
      setMockupForm(f => ({ ...f, [`${side}Url`]: res.data.url, [`${side}Uploading`]: false }));
      toast.success(`${side === 'front' ? 'Front' : 'Back'} image uploaded.`);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Upload failed.');
      setMockupForm(f => ({ ...f, [`${side}Uploading`]: false }));
    }
  };

  // ── Colour variant: save ──────────────────────────────────────────────────
  const saveMockup = async (typeId) => {
    const { colorName: cn, hex, frontUrl, backUrl } = mockupForm;
    if (!cn.trim()) { toast.error('Enter a colour name.'); return; }
    if (!frontUrl)  { toast.error('Upload a front image.'); return; }
    setMockupSaving(true);
    try {
      const r = await api.post(`/shirt-config/shirt-types/${typeId}/mockups`, {
        colorName: cn.trim(), hex, frontUrl, backUrl,
      });
      setConfig(r.data.config);
      setMockupForm(EMPTY_FORM);
      toast.success('Colour variant saved!');
    } catch { toast.error('Save failed.'); }
    finally { setMockupSaving(false); }
  };

  // ── Colour variant: delete ────────────────────────────────────────────────
  const deleteMockup = async (typeId, mockupId) => {
    setDeletingMockup(mockupId);
    try {
      const r = await api.delete(`/shirt-config/shirt-types/${typeId}/mockups/${mockupId}`);
      setConfig(r.data.config);
      toast.success('Colour removed.');
    } catch { toast.error('Delete failed.'); }
    finally { setDeletingMockup(null); }
  };

  // ── Quick-fill form colour from global list ───────────────────────────────
  const fillColor = (c) => setMockupForm(f => ({ ...f, colorName: c.name, hex: c.hex }));

  // ── Global colours ────────────────────────────────────────────────────────
  const addColor = () => {
    if (!colorName.trim()) { toast.error('Enter a colour name.'); return; }
    if (config.colors.some(c => c.name.toLowerCase() === colorName.trim().toLowerCase())) {
      toast.error('Already exists.'); return;
    }
    setConfig(p => ({ ...p, colors: [...p.colors, { name: colorName.trim(), hex: colorHex }] }));
    setColorName(''); setColorHex('#FFFFFF');
  };
  const removeColor = (i) => setConfig(p => ({ ...p, colors: p.colors.filter((_, idx) => idx !== i) }));
  const addPreset   = (c) => { if (!config.colors.some(x => x.name === c.name)) setConfig(p => ({ ...p, colors: [...p.colors, c] })); };

  // ── Sizes ─────────────────────────────────────────────────────────────────
  const toggleSize = (s) => setConfig(p => ({ ...p, sizes: p.sizes.includes(s) ? p.sizes.filter(x => x !== s) : [...p.sizes, s] }));
  const addCustomSize = () => {
    const s = newSize.trim().toUpperCase();
    if (!s || config.sizes.includes(s)) { if (s) toast.error('Already added.'); return; }
    setConfig(p => ({ ...p, sizes: [...p.sizes, s] })); setNewSize('');
  };

  // ── Save global settings ──────────────────────────────────────────────────
  const saveGeneral = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const sizePricingObj = config.sizePricing instanceof Map
        ? Object.fromEntries(config.sizePricing)
        : (config.sizePricing || {});
      await api.put('/shirt-config', { colors: config.colors, sizes: config.sizes, basePrice: config.basePrice, sizePricing: sizePricingObj });
      toast.success('Settings saved.');
    } catch { toast.error('Save failed.'); }
    finally { setSaving(false); }
  };

  const sizePricingMap = config?.sizePricing instanceof Map
    ? Object.fromEntries(config.sizePricing)
    : (config?.sizePricing || {});

  if (loading) return <div className="flex justify-center py-16"><Spinner size="lg" className="text-ink-brown" /></div>;
  if (!config) return <div className="text-center py-16 glass-card"><p className="text-white/30">Failed to load.</p></div>;

  return (
    <div className="space-y-8">
      {/* Preview modal */}
      <AnimatePresence>
        {previewItem && <PreviewModal item={previewItem.mockup} typeName={previewItem.typeName} onClose={() => setPreviewItem(null)} />}
      </AnimatePresence>

      {/* Header */}
      <div>
        <p className="text-xs tracking-widest uppercase text-ink-brown mb-1">Admin</p>
        <h1 className="font-display text-2xl font-bold text-white">Customization Settings</h1>
        <p className="text-white/35 text-sm mt-1">Manage shirt types, mockup images, colours, sizes, and pricing.</p>
      </div>

      {/* ═══════════════════════════════════════════════════
          SHIRT TYPES
          ═══════════════════════════════════════════════ */}
      <div className="glass-card p-6 sm:p-8 space-y-6">

        {/* Section header + add form */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1">
            <h2 className="font-display text-lg font-semibold text-white">Shirt Types</h2>
            <p className="text-white/35 text-xs mt-1">
              Add as many shirt types as you want. For each type, add colour variants and upload front &amp; back PNG mockup images.
            </p>
          </div>
          <div className="flex gap-2 items-center flex-shrink-0">
            <input
              className="glass-input w-44 text-sm"
              value={newTypeName}
              onChange={e => setNewTypeName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addShirtType()}
              placeholder="e.g. Polo Shirt"
            />
            <button onClick={addShirtType} disabled={addingType || !newTypeName.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', boxShadow: '0 3px 12px rgba(107,66,38,0.35)' }}>
              {addingType ? <Spinner size="sm" className="text-white" /> : '+'}
              Add
            </button>
          </div>
        </div>

        {/* Image requirement notice */}
        <div className="rounded-2xl p-4 flex items-start gap-3"
          style={{ background: 'rgba(201,150,122,0.07)', border: '1px solid rgba(201,150,122,0.18)' }}>
          <span style={{ color: '#C9967A', fontSize: 14, flexShrink: 0, marginTop: 1 }}>📐</span>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(201,150,122,0.75)' }}>
            <strong style={{ color: '#C9967A' }}>Mockup image requirements:</strong> PNG only · Transparent background ·
            Recommended 900 × 1200 px (3:4 ratio) · Max 10 MB per image.
            Upload a <strong>front</strong> image (required) and a <strong>back</strong> image (optional) for each colour.
          </p>
        </div>

        {/* Shirt types list */}
        {config.shirtTypes.length === 0 ? (
          <div className="text-center py-8 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
            <p className="text-4xl mb-3">👕</p>
            <p className="text-white/40 text-sm">No shirt types yet.</p>
            <p className="text-white/25 text-xs mt-1">Type a name above and click "Add" to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {config.shirtTypes.map(type => {
              const isOpen = expandedType === type._id;
              return (
                <div key={type._id} className="rounded-2xl overflow-hidden"
                  style={{
                    border:     isOpen ? '1px solid rgba(107,66,38,0.5)' : '1px solid rgba(255,255,255,0.07)',
                    background: isOpen ? 'rgba(107,66,38,0.06)' : 'rgba(255,255,255,0.02)',
                    opacity:    type.enabled ? 1 : 0.5,
                  }}>

                  {/* ── Accordion header ── */}
                  <div className="flex items-center gap-3 px-5 py-4">

                    {/* Expand toggle area */}
                    <button onClick={() => setExpandedType(isOpen ? null : type._id)}
                      className="flex-1 flex items-center gap-4 text-left min-w-0">

                      {/* Colour swatch strip */}
                      <div className="flex -space-x-1.5 flex-shrink-0">
                        {type.mockups.length === 0 ? (
                          <div className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold"
                            style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)' }}>?</div>
                        ) : type.mockups.slice(0,6).map(m => (
                          <div key={m._id} title={m.colorName}
                            className="w-7 h-7 rounded-full border-2 flex-shrink-0"
                            style={{ background: m.hex, borderColor: 'rgba(0,0,0,0.4)' }} />
                        ))}
                        {type.mockups.length > 6 && (
                          <div className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[9px] font-bold"
                            style={{ background: '#1a1a1a', borderColor: 'rgba(0,0,0,0.4)', color: 'rgba(255,255,255,0.5)' }}>
                            +{type.mockups.length - 6}
                          </div>
                        )}
                      </div>

                      {/* Name + count */}
                      <div className="min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{type.name}</p>
                        <p className="text-white/35 text-xs">
                          {type.mockups.length === 0 ? 'No colours yet — click to add' : `${type.mockups.length} colour variant${type.mockups.length > 1 ? 's' : ''}`}
                        </p>
                      </div>

                      {/* Chevron */}
                      <svg className="w-4 h-4 flex-shrink-0 ml-auto transition-transform duration-200"
                        style={{ color: 'rgba(255,255,255,0.3)', transform: isOpen ? 'rotate(180deg)' : 'none' }}
                        fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                      </svg>
                    </button>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs px-2 py-0.5 rounded-full hidden sm:inline"
                        style={type.enabled
                          ? { background: 'rgba(34,197,94,0.1)', color: 'rgba(34,197,94,0.85)', border: '1px solid rgba(34,197,94,0.2)' }
                          : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)' }
                        }>
                        {type.enabled ? 'Visible' : 'Hidden'}
                      </span>
                      <button onClick={() => toggleShirtType(type._id)} disabled={toggling === type._id}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                        style={type.enabled
                          ? { background: 'rgba(239,68,68,0.08)', color: 'rgba(239,68,68,0.75)', border: '1px solid rgba(239,68,68,0.15)' }
                          : { background: 'rgba(34,197,94,0.08)', color: 'rgba(34,197,94,0.75)', border: '1px solid rgba(34,197,94,0.15)' }
                        }>
                        {toggling === type._id ? <Spinner size="sm" className="text-current" /> : type.enabled ? 'Hide' : 'Show'}
                      </button>
                      <button onClick={() => deleteShirtType(type._id, type.name)} disabled={deletingType === type._id}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-red-500/12 disabled:opacity-40"
                        style={{ color: 'rgba(239,68,68,0.55)', border: '1px solid rgba(239,68,68,0.1)' }}>
                        {deletingType === type._id
                          ? <Spinner size="sm" className="text-current" />
                          : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        }
                      </button>
                    </div>
                  </div>

                  {/* ── Accordion body ── */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div className="px-5 pb-6 space-y-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>

                          {/* Existing colour variants grid */}
                          {type.mockups.length > 0 && (
                            <div className="pt-4 space-y-3">
                              <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                Colour Variants
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                                {type.mockups.map(m => (
                                  <div key={m._id} className="rounded-xl overflow-hidden"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>

                                    {/* Front + back thumbnail row */}
                                    <div className="grid grid-cols-2 gap-px p-1.5 pb-0"
                                      style={{ background: '#111' }}>
                                      {/* Front */}
                                      <div className="relative group rounded-lg overflow-hidden"
                                        style={{ aspectRatio: '3/4', background: '#1a1a1a' }}>
                                        {m.frontUrl
                                          ? <img src={m.frontUrl} alt="front" className="w-full h-full object-contain p-0.5" />
                                          : <div className="w-full h-full flex items-center justify-center"><span className="text-white/15 text-[10px]">F</span></div>
                                        }
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                          style={{ background: 'rgba(0,0,0,0.55)' }}>
                                          <button onClick={() => setPreviewItem({ mockup: m, typeName: type.name })}
                                            className="text-[9px] px-1.5 py-0.5 rounded font-semibold"
                                            style={{ background: 'rgba(107,66,38,0.9)', color: '#fff' }}>
                                            View
                                          </button>
                                        </div>
                                        <span className="absolute top-0.5 left-0.5 text-[8px] px-1 rounded font-bold"
                                          style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.6)' }}>F</span>
                                      </div>
                                      {/* Back */}
                                      <div className="relative group rounded-lg overflow-hidden"
                                        style={{ aspectRatio: '3/4', background: '#1a1a1a' }}>
                                        {m.backUrl
                                          ? <img src={m.backUrl} alt="back" className="w-full h-full object-contain p-0.5" />
                                          : <div className="w-full h-full flex items-center justify-center"><span className="text-white/15 text-[10px]">B</span></div>
                                        }
                                        {m.backUrl && (
                                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            style={{ background: 'rgba(0,0,0,0.55)' }}>
                                            <button onClick={() => setPreviewItem({ mockup: { ...m }, typeName: type.name })}
                                              className="text-[9px] px-1.5 py-0.5 rounded font-semibold"
                                              style={{ background: 'rgba(107,66,38,0.9)', color: '#fff' }}>
                                              View
                                            </button>
                                          </div>
                                        )}
                                        <span className="absolute top-0.5 left-0.5 text-[8px] px-1 rounded font-bold"
                                          style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.6)' }}>B</span>
                                      </div>
                                    </div>

                                    {/* Colour info + delete */}
                                    <div className="px-2 py-2 flex items-center justify-between gap-1">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <div className="w-3 h-3 rounded-full flex-shrink-0 border border-white/15"
                                          style={{ background: m.hex }} />
                                        <span className="text-white/70 text-xs truncate">{m.colorName}</span>
                                      </div>
                                      <button onClick={() => deleteMockup(type._id, m._id)} disabled={deletingMockup === m._id}
                                        className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center hover:bg-red-500/20 disabled:opacity-40 transition-all"
                                        style={{ color: 'rgba(239,68,68,0.6)' }}>
                                        {deletingMockup === m._id
                                          ? <Spinner size="sm" className="text-current" />
                                          : <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                                            </svg>
                                        }
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Add colour form */}
                          <div className="rounded-2xl p-5 space-y-5"
                            style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <p className="text-sm font-semibold text-white">
                              {type.mockups.length > 0 ? 'Add Another Colour' : 'Add Your First Colour'}
                            </p>

                            {/* Step 1: colour */}
                            <div className="space-y-2.5">
                              <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.28)' }}>Step 1 — Choose colour</p>

                              {/* Quick-fill from global colours */}
                              {config.colors.length > 0 && (
                                <div>
                                  <p className="text-white/30 text-xs mb-2">Quick-fill from global colours:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {config.colors.map((c, i) => {
                                      const alreadyHas = type.mockups.some(m => m.hex.toLowerCase() === c.hex.toLowerCase());
                                      return (
                                        <button key={i} onClick={() => fillColor(c)}
                                          title={`${c.name}${alreadyHas ? ' (already added)' : ''}`}
                                          className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-all"
                                          style={{
                                            background: mockupForm.hex.toLowerCase() === c.hex.toLowerCase()
                                              ? 'rgba(107,66,38,0.4)' : 'rgba(255,255,255,0.04)',
                                            border: mockupForm.hex.toLowerCase() === c.hex.toLowerCase()
                                              ? '1px solid rgba(201,150,122,0.5)' : '1px solid rgba(255,255,255,0.07)',
                                            color: alreadyHas ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.65)',
                                          }}>
                                          <div className="w-3 h-3 rounded-full border border-white/15" style={{ background: c.hex }} />
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
                                  <label className="label text-xs">Hex</label>
                                  <div className="flex items-center gap-2">
                                    <input type="color" value={mockupForm.hex}
                                      onChange={e => setMockupForm(f => ({ ...f, hex: e.target.value }))}
                                      className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0.5"
                                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                                    <input className="glass-input w-24 font-mono text-sm" value={mockupForm.hex}
                                      onChange={e => setMockupForm(f => ({ ...f, hex: e.target.value }))}
                                      placeholder="#FFFFFF" />
                                  </div>
                                </div>
                                {mockupForm.hex && (
                                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl self-end"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <div className="w-5 h-5 rounded-full border border-white/20" style={{ background: mockupForm.hex }} />
                                    <span className="text-white/40 text-xs">{mockupForm.colorName || 'Preview'}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Step 2: images */}
                            <div className="space-y-2.5">
                              <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.28)' }}>
                                Step 2 — Upload mockup images
                              </p>
                              <div className="grid grid-cols-2 gap-4 max-w-xs">
                                <DropZone label="Front" required
                                  url={mockupForm.frontUrl} pct={mockupForm.frontPct} uploading={mockupForm.frontUploading}
                                  onFile={f => uploadImg(f, 'front')}
                                  onClear={() => setMockupForm(fv => ({ ...fv, frontUrl: '' }))} />
                                <DropZone label="Back (optional)"
                                  url={mockupForm.backUrl} pct={mockupForm.backPct} uploading={mockupForm.backUploading}
                                  onFile={f => uploadImg(f, 'back')}
                                  onClear={() => setMockupForm(fv => ({ ...fv, backUrl: '' }))} />
                              </div>
                            </div>

                            {/* Save button */}
                            <div className="flex items-center gap-3">
                              <button onClick={() => saveMockup(type._id)}
                                disabled={mockupSaving || !mockupForm.frontUrl || !mockupForm.colorName.trim() || mockupForm.frontUploading || mockupForm.backUploading}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-all"
                                style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', boxShadow: '0 4px 12px rgba(107,66,38,0.35)' }}>
                                {mockupSaving ? <><Spinner size="sm" className="text-white" /> Saving…</> : 'Save Colour Variant'}
                              </button>
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
        )}
      </div>

      {/* ═══════════════════════════════════════════════════
          GLOBAL COLOURS (for quick-fill reference)
          ═══════════════════════════════════════════════ */}
      <div className="glass-card p-6 sm:p-8 space-y-5">
        <h2 className="font-display text-lg font-semibold text-white">Global Colour Palette</h2>
        <p className="text-white/35 text-xs -mt-3">
          A reference palette for quick-filling colour names when adding shirt variants above.
        </p>

        <div className="flex flex-wrap gap-3">
          {config.colors.map((c, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl group"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-5 h-5 rounded-full border border-white/15" style={{ background: c.hex }} />
              <span className="text-white/70 text-xs">{c.name}</span>
              <button onClick={() => removeColor(i)} className="text-white/25 hover:text-red-400 transition-colors ml-1 text-xs">×</button>
            </div>
          ))}
        </div>

        <div>
          <p className="text-white/30 text-xs mb-2">Quick add presets:</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c, i) => {
              const exists = config.colors.some(x => x.name === c.name);
              return (
                <button key={i} onClick={() => addPreset(c)} disabled={exists} title={c.name}
                  className="w-7 h-7 rounded-full transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-default"
                  style={{ background: c.hex, border: exists ? '2px solid rgba(107,66,38,0.6)' : '2px solid rgba(255,255,255,0.1)' }} />
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="label text-xs">Name</label>
            <input className="glass-input w-36" value={colorName} onChange={e => setColorName(e.target.value)} placeholder="e.g. Teal" />
          </div>
          <div>
            <label className="label text-xs">Hex</label>
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
            + Add
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          SIZES & PRICING
          ═══════════════════════════════════════════════ */}
      <div className="glass-card p-6 sm:p-8 space-y-5">
        <h2 className="font-display text-lg font-semibold text-white">Sizes & Pricing</h2>

        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="label text-xs">Base Price (PKR)</label>
            <input type="number" step="1" min="0" className="glass-input w-32"
              value={config.basePrice}
              onChange={e => setConfig(p => ({ ...p, basePrice: parseFloat(e.target.value) || 0 }))} />
          </div>
          <p className="text-white/30 text-xs self-end pb-3">Base price for all orders. Size surcharges added on top.</p>
        </div>

        <div>
          <p className="label text-xs mb-2">Available Sizes</p>
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
              onChange={e => setNewSize(e.target.value)} placeholder="Custom size"
              onKeyDown={e => e.key === 'Enter' && addCustomSize()} />
            <button onClick={addCustomSize}
              className="px-3 py-2 rounded-xl text-sm"
              style={{ background: 'rgba(107,66,38,0.2)', color: '#C48A5C', border: '1px solid rgba(107,66,38,0.3)' }}>
              + Add
            </button>
          </div>
        </div>

        {config.sizes.length > 0 && (
          <div>
            <p className="label text-xs mb-2">Size Surcharges (PKR)</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {config.sizes.map(s => (
                <div key={s} className="flex items-center gap-2">
                  <span className="text-white/60 text-sm w-12">{s}</span>
                  <input type="number" step="1" min="0" className="glass-input flex-1 text-sm" placeholder="0"
                    value={sizePricingMap[s] || ''}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      const nm  = { ...sizePricingMap };
                      if (val > 0) nm[s] = val; else delete nm[s];
                      setConfig(p => ({ ...p, sizePricing: nm }));
                    }} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button onClick={saveGeneral} disabled={saving}
          className="flex items-center gap-2 px-8 py-3 rounded-xl font-medium text-sm disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', color: '#fff', boxShadow: '0 4px 16px rgba(107,66,38,0.4)' }}>
          {saving && <Spinner size="sm" className="text-white" />}
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
