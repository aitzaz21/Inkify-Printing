import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../../shared/api/axios';
import { uploadAPI } from '../../../shared/api/upload.service';
import { Spinner } from '../../../shared/components/Spinner';

const ALL_SIZES = ['XS','S','M','L','XL','XXL','XXXL'];
const PRESET_COLORS = [
  { name:'White',      hex:'#FFFFFF' }, { name:'Black',      hex:'#0B0B0B' },
  { name:'Navy',       hex:'#1a2e4a' }, { name:'Grey',       hex:'#6B6460' },
  { name:'Ash',        hex:'#B2B2B2' }, { name:'Brown',      hex:'#6B4226' },
  { name:'Sand',       hex:'#D4B896' }, { name:'Olive',      hex:'#6B7A4B' },
  { name:'Royal Blue', hex:'#2B5EA7' }, { name:'Red',        hex:'#C0392B' },
  { name:'Dusty Rose', hex:'#C9967A' }, { name:'Washed Black',hex:'#2A2A2A'},
];

export default function AdminShirtConfigPage() {
  const [config,    setConfig]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);

  // New shirt type form
  const [newTypeName,  setNewTypeName]  = useState('');
  const [addingType,   setAddingType]   = useState(false);

  // Image upload state per shirt type index
  const [uploadingIdx, setUploadingIdx] = useState(null);

  // Color form
  const [colorName, setColorName] = useState('');
  const [colorHex,  setColorHex]  = useState('#FFFFFF');

  // Size / pricing form
  const [newSize,   setNewSize]   = useState('');

  const load = () => {
    setLoading(true);
    api.get('/shirt-config')
      .then(r => setConfig(r.data.config))
      .catch(() => toast.error('Failed to load config.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  // ── Save general settings (colors, sizes, pricing) ──────────
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

  // ── Shirt types ────────────────────────────────────────────
  const addShirtType = async () => {
    if (!newTypeName.trim()) { toast.error('Enter a name.'); return; }
    setAddingType(true);
    try {
      await api.post('/shirt-config/shirt-types', { name: newTypeName.trim() });
      setNewTypeName('');
      toast.success('Shirt type added.');
      load();
    } catch { toast.error('Failed.'); }
    finally { setAddingType(false); }
  };

  const deleteShirtType = async (idx) => {
    if (!confirm(`Delete "${config.shirtTypes[idx].name}"?`)) return;
    try {
      await api.delete(`/shirt-config/shirt-types/${idx}`);
      toast.success('Deleted.');
      load();
    } catch { toast.error('Failed.'); }
  };

  const handleTypeImageUpload = async (idx, file) => {
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) { toast.error('Only JPG/PNG/WEBP.'); return; }
    if (file.size > 5*1024*1024) { toast.error('Max 5MB.'); return; }
    setUploadingIdx(idx);
    try {
      const res = await uploadAPI.uploadProduct(file);
      await api.patch(`/shirt-config/shirt-types/${idx}`, { image: res.data.url });
      toast.success('Image uploaded.');
      load();
    } catch { toast.error('Upload failed.'); }
    finally { setUploadingIdx(null); }
  };

  // ── Colors ─────────────────────────────────────────────────
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

  // ── Sizes ──────────────────────────────────────────────────
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
    <div className="flex justify-center py-16"><Spinner size="lg" className="text-ink-brown" /></div>
  );

  if (!config) return (
    <div className="text-center py-16 glass-card"><p className="text-white/30">Failed to load configuration.</p></div>
  );

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-widest uppercase text-ink-brown mb-1">Admin</p>
        <h1 className="font-display text-2xl font-bold text-white">Customization Settings</h1>
        <p className="text-white/35 text-sm mt-1">Configure everything that appears on the customer Customize page.</p>
      </div>

      {/* ── SHIRT TYPES ──────────────────────────────────────── */}
      <div className="glass-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-white">Shirt Types</h2>
            <p className="text-white/35 text-xs mt-0.5">Each type shows its own image. Image changes when customer switches type.</p>
          </div>
        </div>

        {/* Existing types */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {config.shirtTypes.map((t, idx) => (
            <motion.div key={idx} initial={{ opacity:0 }} animate={{ opacity:1 }}
              className="rounded-xl overflow-hidden"
              style={{ border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.03)' }}>
              {/* Image area */}
              <label className="block relative cursor-pointer group" style={{ paddingBottom:'80%', background:'rgba(107,66,38,0.07)' }}>
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                  onChange={e => handleTypeImageUpload(idx, e.target.files?.[0])} />
                <div className="absolute inset-0 flex items-center justify-center">
                  {uploadingIdx === idx ? (
                    <Spinner size="md" className="text-ink-brown" />
                  ) : t.image ? (
                    <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-center p-3">
                      <svg className="w-8 h-8 text-ink-brown/25" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      <span className="text-white/25 text-xs">Upload image</span>
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    style={{ background:'rgba(0,0,0,0.5)' }}>
                    <span className="text-white text-xs font-medium">Change image</span>
                  </div>
                </div>
              </label>
              <div className="p-3">
                <p className="text-white text-xs font-medium truncate mb-2">{t.name}</p>
                <button onClick={() => deleteShirtType(idx)}
                  className="text-xs px-2 py-1 rounded-lg w-full transition-colors"
                  style={{ background:'rgba(239,68,68,0.08)', color:'rgba(239,68,68,0.7)', border:'1px solid rgba(239,68,68,0.12)' }}>
                  Remove
                </button>
              </div>
            </motion.div>
          ))}

          {/* Add new type */}
          <div className="rounded-xl flex flex-col items-center justify-center gap-3 p-4"
            style={{ border:'1.5px dashed rgba(107,66,38,0.3)', background:'rgba(107,66,38,0.03)', minHeight:'160px' }}>
            <input className="glass-input text-xs w-full" placeholder="Type name…" value={newTypeName}
              onChange={e => setNewTypeName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addShirtType()} />
            <button onClick={addShirtType} disabled={addingType}
              className="text-xs px-3 py-1.5 rounded-lg font-medium w-full disabled:opacity-50"
              style={{ background:'linear-gradient(135deg,#6B4226,#8B5A3C)', color:'#fff' }}>
              {addingType ? '…' : '+ Add Type'}
            </button>
          </div>
        </div>
      </div>

      {/* ── COLORS ───────────────────────────────────────────── */}
      <div className="glass-card p-6 sm:p-8 space-y-5">
        <h2 className="font-display text-lg font-semibold text-white">Shirt Colours</h2>

        {/* Current colors */}
        <div className="flex flex-wrap gap-3">
          {config.colors.map((c, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl group"
              style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-5 h-5 rounded-full border border-white/15 flex-shrink-0" style={{ background: c.hex }} />
              <span className="text-white/70 text-xs">{c.name}</span>
              <button onClick={() => removeColor(i)}
                className="text-white/25 hover:text-red-400 transition-colors ml-1 text-xs">×</button>
            </div>
          ))}
        </div>

        {/* Preset quick-add */}
        <div>
          <p className="text-white/35 text-xs mb-2">Quick add presets:</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c, i) => {
              const exists = config.colors.some(x => x.name === c.name);
              return (
                <button key={i} onClick={() => addPresetColor(c)} disabled={exists} title={c.name}
                  className="w-7 h-7 rounded-full transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-default"
                  style={{ background: c.hex, border: exists ? '2px solid rgba(107,66,38,0.6)' : '2px solid rgba(255,255,255,0.1)' }} />
              );
            })}
          </div>
        </div>

        {/* Custom color add */}
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="label text-xs">Name</label>
            <input className="glass-input w-36" value={colorName} onChange={e => setColorName(e.target.value)} placeholder="e.g. Teal" />
          </div>
          <div>
            <label className="label text-xs">Hex Colour</label>
            <div className="flex items-center gap-2">
              <input type="color" value={colorHex} onChange={e => setColorHex(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0.5"
                style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)' }} />
              <input className="glass-input w-28 font-mono text-sm" value={colorHex}
                onChange={e => setColorHex(e.target.value)} placeholder="#RRGGBB" />
            </div>
          </div>
          <button onClick={addColor}
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background:'rgba(107,66,38,0.2)', color:'#C48A5C', border:'1px solid rgba(107,66,38,0.3)' }}>
            + Add Colour
          </button>
        </div>
      </div>

      {/* ── SIZES & PRICING ──────────────────────────────────── */}
      <div className="glass-card p-6 sm:p-8 space-y-5">
        <h2 className="font-display text-lg font-semibold text-white">Sizes & Pricing</h2>

        {/* Base price */}
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="label text-xs">Base Price (PKR)</label>
            <input type="number" step="0.01" min="0" className="glass-input w-28"
              value={config.basePrice}
              onChange={e => setConfig(prev => ({ ...prev, basePrice: parseFloat(e.target.value) || 0 }))} />
          </div>
          <p className="text-white/30 text-xs self-end pb-3">Base price applied to all orders. Size surcharges added on top.</p>
        </div>

        {/* Size toggles */}
        <div>
          <p className="label text-xs mb-2">Available Sizes (toggle to enable/disable)</p>
          <div className="flex flex-wrap gap-2">
            {ALL_SIZES.map(s => {
              const active = config.sizes.includes(s);
              return (
                <button key={s} onClick={() => toggleSize(s)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={active
                    ? { background:'linear-gradient(135deg,#6B4226,#8B5A3C)', color:'#fff' }
                    : { background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.4)', border:'1px solid rgba(255,255,255,0.1)' }
                  }>
                  {s}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 mt-3">
            <input className="glass-input w-28 text-sm" value={newSize} onChange={e => setNewSize(e.target.value)}
              placeholder="Custom size" onKeyDown={e => e.key === 'Enter' && addCustomSize()} />
            <button onClick={addCustomSize}
              className="px-3 py-2 rounded-xl text-sm"
              style={{ background:'rgba(107,66,38,0.2)', color:'#C48A5C', border:'1px solid rgba(107,66,38,0.3)' }}>
              + Add
            </button>
          </div>
        </div>

        {/* Size surcharges */}
        {config.sizes.length > 0 && (
          <div>
            <p className="label text-xs mb-2">Size Surcharges (PKR added to base price)</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {config.sizes.map(s => (
                <div key={s} className="flex items-center gap-2">
                  <span className="text-white/60 text-sm w-10">{s}</span>
                  <input type="number" step="0.5" min="0" className="glass-input flex-1 text-sm"
                    placeholder="0"
                    value={sizePricingMap[s] || ''}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      const newMap = { ...sizePricingMap };
                      if (val > 0) newMap[s] = val; else delete newMap[s];
                      setConfig(prev => ({ ...prev, sizePricing: newMap }));
                    }} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Save general button */}
      <div className="flex justify-end">
        <button onClick={saveGeneral} disabled={saving}
          className="flex items-center gap-2 px-8 py-3 rounded-xl font-medium text-sm disabled:opacity-60"
          style={{ background:'linear-gradient(135deg,#6B4226,#8B5A3C)', color:'#fff', boxShadow:'0 4px 16px rgba(107,66,38,0.4)' }}>
          {saving && <Spinner size="sm" className="text-white" />}
          {saving ? 'Saving…' : '💾 Save All Settings'}
        </button>
      </div>
    </div>
  );
}
