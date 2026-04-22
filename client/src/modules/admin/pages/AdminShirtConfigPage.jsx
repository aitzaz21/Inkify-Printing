import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../../shared/api/axios';
import { Spinner } from '../../../shared/components/Spinner';
import { SHIRT_TYPE_META } from '../../customize/utils/shirtShapes';

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const PRESET_COLORS = [
  { name: 'White',       hex: '#FFFFFF' }, { name: 'Black',      hex: '#0B0B0B' },
  { name: 'Navy',        hex: '#1a2e4a' }, { name: 'Grey',       hex: '#6B6460' },
  { name: 'Ash',         hex: '#B2B2B2' }, { name: 'Brown',      hex: '#6B4226' },
  { name: 'Sand',        hex: '#D4B896' }, { name: 'Olive',      hex: '#6B7A4B' },
  { name: 'Royal Blue',  hex: '#2B5EA7' }, { name: 'Red',        hex: '#C0392B' },
  { name: 'Dusty Rose',  hex: '#C9967A' }, { name: 'Washed Black', hex: '#2A2A2A' },
];

export default function AdminShirtConfigPage() {
  const [config,      setConfig]      = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [toggling,    setToggling]    = useState(null);
  const [selectedId,  setSelectedId]  = useState(null); // which shirt type card is focused

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

  // ── Save colors / sizes / pricing ──────────────────────────
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

  // ── Toggle shirt type enabled/disabled ──────────────────────
  const toggleShirtType = async (id) => {
    setToggling(id);
    try {
      await api.patch(`/shirt-config/shirt-types/${id}/toggle`);
      toast.success('Shirt type updated.');
      load();
    } catch { toast.error('Failed to update.'); }
    finally { setToggling(null); }
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
      <div>
        <p className="text-xs tracking-widest uppercase text-ink-brown mb-1">Admin</p>
        <h1 className="font-display text-2xl font-bold text-white">Customization Settings</h1>
        <p className="text-white/35 text-sm mt-1">
          Manage the 3D shirt customizer visible to customers.
        </p>
      </div>

      {/* ── SHIRT TYPES (3 fixed, toggle enabled/disabled) ─── */}
      <div className="glass-card p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="font-display text-lg font-semibold text-white">3D Shirt Types</h2>
          <p className="text-white/35 text-xs mt-1">
            Three shirt types are built into the 3D viewer. Toggle each one on or off.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {config.shirtTypes.map(t => {
            const meta        = SHIRT_TYPE_META[t.id] || { label: t.name, description: '' };
            const isToggling  = toggling   === t.id;
            const isSelected  = selectedId === t.id;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedId(prev => prev === t.id ? null : t.id)}
                className="rounded-2xl p-5 flex flex-col gap-4 cursor-pointer"
                style={{
                  border: isSelected
                    ? '2px solid rgba(201,150,122,0.8)'
                    : t.enabled
                      ? '1px solid rgba(107,66,38,0.45)'
                      : '1px solid rgba(255,255,255,0.08)',
                  background: isSelected
                    ? 'rgba(107,66,38,0.16)'
                    : t.enabled
                      ? 'rgba(107,66,38,0.08)'
                      : 'rgba(255,255,255,0.02)',
                  opacity:    t.enabled ? 1 : 0.6,
                  transition: 'all 0.2s ease',
                  boxShadow:  isSelected ? '0 0 0 3px rgba(107,66,38,0.25)' : 'none',
                }}
              >
                {/* Header: label + SVG preview */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-display font-semibold text-white text-sm">{meta.label}</p>
                      {isSelected && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: 'rgba(201,150,122,0.2)', color: '#C9967A', border: '1px solid rgba(201,150,122,0.35)' }}>
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="text-white/35 text-xs mt-0.5">{meta.description}</p>
                  </div>
                  <div className="flex-shrink-0 w-12 h-12 ml-2"
                    style={{ color: isSelected ? '#C9967A' : t.enabled ? '#8B5A3C' : 'rgba(255,255,255,0.2)' }}>
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

                {/* Status badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: t.enabled ? '#22c55e' : 'rgba(255,255,255,0.25)' }} />
                    <span className="text-xs"
                      style={{ color: t.enabled ? 'rgba(34,197,94,0.9)' : 'rgba(255,255,255,0.35)' }}>
                      {t.enabled ? 'Visible to customers' : 'Hidden from customers'}
                    </span>
                  </div>
                </div>

                {/* Enable / Disable toggle — stops click propagation to card */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleShirtType(t.id); }}
                  disabled={isToggling}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-60"
                  style={t.enabled
                    ? { background: 'rgba(239,68,68,0.08)', color: 'rgba(239,68,68,0.85)', border: '1px solid rgba(239,68,68,0.2)' }
                    : { background: 'rgba(34,197,94,0.08)', color: 'rgba(34,197,94,0.85)', border: '1px solid rgba(34,197,94,0.2)' }
                  }
                >
                  {isToggling ? (
                    <Spinner size="sm" className="text-current" />
                  ) : t.enabled ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                      Disable (hide from customers)
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Enable (show to customers)
                    </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Selected type info panel */}
        {selectedId && (() => {
          const t    = config.shirtTypes.find(x => x.id === selectedId);
          const meta = SHIRT_TYPE_META[selectedId] || { label: t?.name, description: '' };
          return (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-5"
              style={{ background: 'rgba(107,66,38,0.1)', border: '1px solid rgba(107,66,38,0.35)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#C9967A]" />
                  <p className="text-white font-semibold text-sm">{meta.label} — Details</p>
                </div>
                <button onClick={() => setSelectedId(null)} className="text-white/30 hover:text-white/60 transition-colors text-sm">×</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="text-white/35 mb-0.5">Type ID</p>
                  <p className="text-white font-mono">{selectedId}</p>
                </div>
                <div>
                  <p className="text-white/35 mb-0.5">Status</p>
                  <p style={{ color: t?.enabled ? 'rgba(34,197,94,0.9)' : 'rgba(239,68,68,0.8)' }}>
                    {t?.enabled ? 'Active — visible to customers' : 'Disabled — hidden'}
                  </p>
                </div>
                <div>
                  <p className="text-white/35 mb-0.5">Model</p>
                  <p className="text-white/70">Built-in 3D geometry</p>
                </div>
              </div>
            </motion.div>
          );
        })()}

        <div className="rounded-xl p-4 flex items-start gap-3"
          style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)' }}>
          <span className="text-blue-400 text-lg flex-shrink-0">ℹ️</span>
          <p className="text-blue-300/70 text-xs leading-relaxed">
            Each shirt type renders as a real-time 3D model — no static images needed.
            The customer can rotate, zoom, and customise the shirt in 3D.
            Disabled types are hidden from the customer-facing customizer.
          </p>
        </div>
      </div>

      {/* ── COLORS ───────────────────────────────────────────── */}
      <div className="glass-card p-6 sm:p-8 space-y-5">
        <h2 className="font-display text-lg font-semibold text-white">Shirt Colours</h2>
        <p className="text-white/35 text-xs -mt-3">
          Selected colour updates instantly on the 3D model.
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

      {/* ── SIZES & PRICING ──────────────────────────────────── */}
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
          {saving ? 'Saving…' : '💾 Save Settings'}
        </button>
      </div>
    </div>
  );
}
