import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../../shared/api/axios';
import { uploadAPI } from '../../../shared/api/upload.service';
import { Spinner } from '../../../shared/components/Spinner';

// ── Image upload drop zone (reuses mockup uploader) ──────────────────────────
function ImageDropZone({ url, pct, uploading, onFile, onClear }) {
  const inputRef = useRef(null);
  const [drag, setDrag]   = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    if (file.type !== 'image/png') { toast.error('Only PNG files are accepted (transparent background).'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('File must be under 10 MB.'); return; }
    onFile(file);
  };

  if (url) return (
    <div className="relative rounded-xl overflow-hidden group"
      style={{ aspectRatio: '3/4', background: 'linear-gradient(135deg,#111,#1a1a1a)', border: '1px solid rgba(34,197,94,0.25)' }}>
      <img src={url} alt="Shirt mockup" className="w-full h-full object-contain p-2" />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'rgba(0,0,0,0.58)' }}>
        <button onClick={onClear}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: 'rgba(239,68,68,0.9)', color: '#fff' }}>
          Remove
        </button>
      </div>
      <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
        style={{ background: 'rgba(34,197,94,0.85)', color: '#fff' }}>✓</div>
    </div>
  );

  if (uploading) return (
    <div className="rounded-xl flex flex-col items-center justify-center gap-3 p-4"
      style={{ aspectRatio: '3/4', background: 'rgba(107,66,38,0.06)', border: '1px dashed rgba(107,66,38,0.3)' }}>
      <Spinner size="sm" className="text-[#C9967A]" />
      <div className="w-full px-2">
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#6B4226,#C9967A)' }} />
        </div>
        <p className="text-center text-[10px] mt-1" style={{ color: 'rgba(201,150,122,0.7)' }}>{pct}%</p>
      </div>
    </div>
  );

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
      className="rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all p-3 text-center"
      style={{
        aspectRatio: '3/4',
        background: drag ? 'rgba(107,66,38,0.14)' : 'rgba(255,255,255,0.02)',
        border: `1.5px dashed ${drag ? 'rgba(201,150,122,0.65)' : 'rgba(255,255,255,0.1)'}`,
      }}
    >
      <span className="text-2xl">📷</span>
      <p className="text-white/50 text-[11px] font-medium leading-tight">Drop PNG here<br/>or click to browse</p>
      <p className="text-white/20 text-[10px]">Transparent bg · Max 10 MB</p>
      <input ref={inputRef} type="file" accept="image/png" hidden onChange={e => handleFile(e.target.files[0])} />
    </div>
  );
}

// ── Shirt-type form modal (add / edit) ────────────────────────────────────────
function TypeFormModal({ initial, onSave, onClose, saving }) {
  const [name,        setName]        = useState(initial?.name        || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [sortOrder,   setSortOrder]   = useState(initial?.sortOrder   ?? 0);
  const [error,       setError]       = useState('');

  const handleSave = () => {
    if (!name.trim()) { setError('Shirt type name is required.'); return; }
    onSave({ name: name.trim(), description: description.trim(), sortOrder: parseInt(sortOrder) || 0 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.82)' }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.16 }}
        className="w-full max-w-md rounded-2xl p-6 space-y-4"
        style={{ background: '#1a1612', border: '1px solid rgba(107,66,38,0.35)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-white">
            {initial ? 'Edit Shirt Type' : 'New Shirt Type'}
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="label text-xs">Name <span className="text-red-400">*</span></label>
            <input className={`glass-input ${error ? 'border-red-500/50' : ''}`}
              value={name} onChange={e => { setName(e.target.value); setError(''); }}
              placeholder="e.g. Plain T-Shirt, Polo Shirt, Hoodie" autoFocus />
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
          </div>
          <div>
            <label className="label text-xs">Description <span className="text-white/30">(optional)</span></label>
            <input className="glass-input" value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Classic crew neck cotton tee" />
          </div>
          <div>
            <label className="label text-xs">Display Order</label>
            <input type="number" min="0" className="glass-input w-24"
              value={sortOrder} onChange={e => setSortOrder(e.target.value)} />
            <p className="text-white/25 text-[11px] mt-1">Lower = shown first in the customizer</p>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm text-white/50 hover:text-white transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', boxShadow: '0 4px 14px rgba(107,66,38,0.35)' }}>
            {saving ? <><Spinner size="sm" className="text-white" /> Saving…</> : initial ? 'Save Changes' : 'Create Shirt Type'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Full preview modal ────────────────────────────────────────────────────────
function PreviewModal({ item, typeName, onClose }) {
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.88)' }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.93 }} transition={{ duration: 0.18 }}
        className="relative w-full max-w-[280px]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full border border-white/20" style={{ background: item.hex }} />
            <div>
              <p className="text-white text-sm font-semibold">{item.colorName}</p>
              <p className="text-white/35 text-xs">{typeName}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all text-sm">
            ✕
          </button>
        </div>
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)', aspectRatio: '3/4', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>
          <img src={item.imageUrl} alt={item.colorName}
            className="w-full h-full object-contain p-4"
            style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.6))' }} />
        </div>
        <p className="text-white/20 text-[10px] text-center mt-2">Click outside to close</p>
      </motion.div>
    </div>
  );
}

// ── Inline add-color form ─────────────────────────────────────────────────────
function AddColorForm({ typeId, onAdded }) {
  const [colorName,  setColorName]  = useState('');
  const [hex,        setHex]        = useState('#FFFFFF');
  const [imageUrl,   setImageUrl]   = useState('');
  const [pct,        setPct]        = useState(0);
  const [uploading,  setUploading]  = useState(false);
  const [saving,     setSaving]     = useState(false);

  const handleUpload = async (file) => {
    setUploading(true); setPct(0);
    try {
      const res = await uploadAPI.uploadMockup(file, p => setPct(p));
      setImageUrl(res.data.url);
      toast.success('Image uploaded.');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Upload failed.');
    } finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!colorName.trim()) { toast.error('Enter a colour name.'); return; }
    if (!imageUrl)         { toast.error('Upload a shirt image first.'); return; }
    setSaving(true);
    try {
      await api.post(`/shirt-types/${typeId}/colors`, { colorName: colorName.trim(), hex, imageUrl });
      toast.success('Colour added!');
      setColorName(''); setHex('#FFFFFF'); setImageUrl(''); setPct(0);
      onAdded();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Save failed.');
    } finally { setSaving(false); }
  };

  return (
    <div className="rounded-2xl p-5 space-y-4"
      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <p className="text-sm font-semibold text-white">Add Colour Variant</p>

      {/* Colour info */}
      <div className="flex gap-3 items-end flex-wrap">
        <div>
          <label className="label text-xs">Colour Name <span className="text-red-400">*</span></label>
          <input className="glass-input w-36" value={colorName}
            onChange={e => setColorName(e.target.value)} placeholder="e.g. White, Navy" />
        </div>
        <div>
          <label className="label text-xs">Hex Code</label>
          <div className="flex items-center gap-2">
            <input type="color" value={hex} onChange={e => setHex(e.target.value)}
              className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0.5"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
            <input className="glass-input w-24 font-mono text-sm" value={hex}
              onChange={e => setHex(e.target.value)} placeholder="#FFFFFF" />
          </div>
        </div>
        {hex && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl self-end"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="w-6 h-6 rounded-full border border-white/20" style={{ background: hex }} />
            <span className="text-white/45 text-xs">{colorName || 'Preview'}</span>
          </div>
        )}
      </div>

      {/* Image upload */}
      <div>
        <label className="label text-xs mb-2">
          Shirt Image for this colour <span className="text-red-400">*</span>
          <span className="text-white/30 ml-2">PNG · transparent background · 900×1200px · max 10 MB</span>
        </label>
        <div className="max-w-[160px]">
          <ImageDropZone
            url={imageUrl} pct={pct} uploading={uploading}
            onFile={handleUpload}
            onClear={() => setImageUrl('')}
          />
        </div>
        {!imageUrl && !uploading && (
          <p className="text-amber-400/60 text-xs mt-2 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            Upload a PNG image showing the shirt in this colour with a transparent background.
          </p>
        )}
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button onClick={handleSave}
          disabled={saving || uploading || !imageUrl || !colorName.trim()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-all"
          style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', boxShadow: '0 4px 12px rgba(107,66,38,0.35)' }}>
          {saving ? <><Spinner size="sm" className="text-white" /> Saving…</> : '+ Add Colour'}
        </button>
        {imageUrl && colorName.trim() && (
          <p className="text-emerald-400/60 text-xs">Ready to save</p>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminShirtTypesPage() {
  const [shirtTypes,   setShirtTypes]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [typeModal,    setTypeModal]    = useState(null);  // null | 'new' | {existing type}
  const [typeSaving,   setTypeSaving]   = useState(false);
  const [expanded,     setExpanded]     = useState(null);  // which type's accordion is open
  const [toggling,     setToggling]     = useState(null);
  const [deleting,     setDeleting]     = useState(null);
  const [deletingColor,setDeletingColor]= useState(null);
  const [preview,      setPreview]      = useState(null);  // { colorVariant, typeName }

  const load = () => {
    setLoading(true);
    api.get('/shirt-types/admin')
      .then(r => setShirtTypes(r.data.shirtTypes || []))
      .catch(() => toast.error('Failed to load shirt types.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  // ── Create / Edit ───────────────────────────────────────────────────────────
  const handleTypeSave = async (form) => {
    setTypeSaving(true);
    try {
      if (typeModal?._id) {
        await api.put(`/shirt-types/${typeModal._id}`, form);
        toast.success('Updated.');
      } else {
        const res = await api.post('/shirt-types', form);
        setExpanded(res.data.shirtType._id);
      }
      setTypeModal(null);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Save failed.');
    } finally { setTypeSaving(false); }
  };

  // ── Toggle ──────────────────────────────────────────────────────────────────
  const handleToggle = async (id) => {
    setToggling(id);
    try {
      await api.patch(`/shirt-types/${id}/toggle`);
      load();
    } catch { toast.error('Toggle failed.'); }
    finally { setToggling(null); }
  };

  // ── Delete type ─────────────────────────────────────────────────────────────
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? All its colour variants will be removed too.`)) return;
    setDeleting(id);
    try {
      await api.delete(`/shirt-types/${id}`);
      toast.success('Deleted.');
      if (expanded === id) setExpanded(null);
      load();
    } catch { toast.error('Delete failed.'); }
    finally { setDeleting(null); }
  };

  // ── Delete colour ───────────────────────────────────────────────────────────
  const handleDeleteColor = async (typeId, colorId, colorName) => {
    if (!window.confirm(`Remove "${colorName}" from this shirt type?`)) return;
    setDeletingColor(colorId);
    try {
      await api.delete(`/shirt-types/${typeId}/colors/${colorId}`);
      toast.success('Colour removed.');
      load();
    } catch { toast.error('Delete failed.'); }
    finally { setDeletingColor(null); }
  };

  return (
    <div className="space-y-8">

      {/* Modals */}
      <AnimatePresence>
        {typeModal !== null && (
          <TypeFormModal
            initial={typeModal?._id ? typeModal : null}
            onSave={handleTypeSave}
            onClose={() => setTypeModal(null)}
            saving={typeSaving}
          />
        )}
        {preview && (
          <PreviewModal
            item={preview.color}
            typeName={preview.typeName}
            onClose={() => setPreview(null)}
          />
        )}
      </AnimatePresence>

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs tracking-widest uppercase text-ink-brown mb-1">Admin</p>
          <h1 className="font-display text-2xl font-bold text-white">Shirt Types</h1>
          <p className="text-white/35 text-sm mt-1">
            Create shirt types, add colour variants, and upload a mockup image per colour.
            Only active types with at least one colour appear in the customer customizer.
          </p>
        </div>
        <button onClick={() => setTypeModal('new')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', boxShadow: '0 4px 14px rgba(107,66,38,0.35)' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
          Add Shirt Type
        </button>
      </div>

      {/* Info tip */}
      <div className="rounded-2xl p-4 flex items-start gap-3"
        style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)' }}>
        <span className="text-blue-400 flex-shrink-0 mt-0.5">ℹ</span>
        <div className="text-xs leading-relaxed" style={{ color: 'rgba(147,197,253,0.75)' }}>
          <p className="font-semibold text-blue-300 mb-1">How it works</p>
          <p>
            Each shirt type you add (e.g. "Plain T-Shirt", "Polo Shirt") will appear as an option in the
            Design Studio. For every colour you add to a shirt type, upload a <strong>PNG photo</strong> of
            that shirt in that colour with a <strong>transparent background</strong>. Customers will see the
            exact photo when they pick that shirt + colour combination.
          </p>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" className="text-ink-brown" /></div>
      ) : shirtTypes.length === 0 ? (
        <div className="glass-card p-14 text-center space-y-4">
          <div className="text-4xl">👕</div>
          <p className="text-white/60 text-sm">No shirt types created yet.</p>
          <p className="text-white/30 text-xs max-w-sm mx-auto leading-relaxed">
            Add your first shirt type, then add colour variants with photos. Customers will see these in the Design Studio.
          </p>
          <button onClick={() => setTypeModal('new')}
            className="mt-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
            + Add First Shirt Type
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {shirtTypes.map(type => {
            const isOpen = expanded === type._id;
            return (
              <motion.div key={type._id} layout
                className="rounded-2xl overflow-hidden"
                style={{
                  border: isOpen ? '1px solid rgba(107,66,38,0.5)' : '1px solid rgba(255,255,255,0.07)',
                  background: isOpen ? 'rgba(107,66,38,0.06)' : 'rgba(255,255,255,0.02)',
                  opacity: type.isActive ? 1 : 0.55,
                }}>

                {/* Header row */}
                <div className="flex items-center gap-3 px-5 py-4">
                  {/* Expand toggle */}
                  <button onClick={() => setExpanded(isOpen ? null : type._id)}
                    className="flex-1 flex items-center gap-4 text-left min-w-0">
                    {/* Colour swatches preview */}
                    <div className="flex -space-x-1.5 flex-shrink-0">
                      {type.colors.length === 0 ? (
                        <div className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs"
                          style={{ borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)' }}>
                          ?
                        </div>
                      ) : type.colors.slice(0,6).map(c => (
                        <div key={c._id} title={c.colorName}
                          className="w-7 h-7 rounded-full border-2 flex-shrink-0"
                          style={{ background: c.hex, borderColor: 'rgba(0,0,0,0.4)' }} />
                      ))}
                      {type.colors.length > 6 && (
                        <div className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[9px] font-bold"
                          style={{ background: '#1a1a1a', borderColor: 'rgba(0,0,0,0.4)', color: 'rgba(255,255,255,0.5)' }}>
                          +{type.colors.length - 6}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{type.name}</p>
                      <p className="text-white/35 text-xs mt-0.5">
                        {type.colors.length === 0
                          ? 'No colours yet — click to add'
                          : `${type.colors.length} colour${type.colors.length > 1 ? 's' : ''}`}
                        {type.description && ` · ${type.description}`}
                      </p>
                    </div>
                    <svg className="w-4 h-4 flex-shrink-0 ml-auto transition-transform duration-200"
                      style={{ color: 'rgba(255,255,255,0.3)', transform: isOpen ? 'rotate(180deg)' : 'none' }}
                      fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>

                  {/* Status + action buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={type.isActive
                        ? { background: 'rgba(34,197,94,0.1)', color: 'rgba(34,197,94,0.85)', border: '1px solid rgba(34,197,94,0.2)' }
                        : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)' }
                      }>
                      {type.isActive ? 'Active' : 'Hidden'}
                    </span>
                    <button onClick={() => setTypeModal(type)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                      style={{ background: 'rgba(107,66,38,0.12)', color: '#C9967A', border: '1px solid rgba(107,66,38,0.22)' }}>
                      Edit
                    </button>
                    <button onClick={() => handleToggle(type._id)} disabled={toggling === type._id}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                      style={type.isActive
                        ? { background: 'rgba(239,68,68,0.08)', color: 'rgba(239,68,68,0.75)', border: '1px solid rgba(239,68,68,0.15)' }
                        : { background: 'rgba(34,197,94,0.08)', color: 'rgba(34,197,94,0.75)', border: '1px solid rgba(34,197,94,0.15)' }
                      }>
                      {toggling === type._id ? <Spinner size="sm" className="text-current" /> : type.isActive ? 'Hide' : 'Show'}
                    </button>
                    <button onClick={() => handleDelete(type._id, type.name)} disabled={deleting === type._id}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-red-500/12 disabled:opacity-50"
                      style={{ color: 'rgba(239,68,68,0.55)', border: '1px solid rgba(239,68,68,0.1)' }}>
                      {deleting === type._id
                        ? <Spinner size="sm" className="text-current" />
                        : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                      }
                    </button>
                  </div>
                </div>

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

                        {/* Existing colours grid */}
                        {type.colors.length > 0 && (
                          <div className="pt-4 space-y-3">
                            <p className="text-xs font-semibold tracking-widest uppercase"
                              style={{ color: 'rgba(255,255,255,0.3)' }}>
                              Colour Variants ({type.colors.length})
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                              {type.colors.map(c => (
                                <div key={c._id} className="rounded-xl overflow-hidden"
                                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                  {/* Image */}
                                  <div className="relative group"
                                    style={{ aspectRatio: '3/4', background: 'linear-gradient(135deg,#111,#1a1a1a)' }}>
                                    <img src={c.imageUrl} alt={c.colorName}
                                      className="w-full h-full object-contain p-2" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                      style={{ background: 'rgba(0,0,0,0.6)' }}>
                                      <button
                                        onClick={() => setPreview({ color: c, typeName: type.name })}
                                        className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold"
                                        style={{ background: 'rgba(107,66,38,0.9)', color: '#fff' }}>
                                        Preview
                                      </button>
                                    </div>
                                  </div>
                                  {/* Info + delete */}
                                  <div className="p-2.5 flex items-center justify-between gap-1">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <div className="w-3.5 h-3.5 rounded-full flex-shrink-0 border border-white/15"
                                        style={{ background: c.hex }} />
                                      <span className="text-white/70 text-xs truncate">{c.colorName}</span>
                                    </div>
                                    <button
                                      onClick={() => handleDeleteColor(type._id, c._id, c.colorName)}
                                      disabled={deletingColor === c._id}
                                      className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center transition-all hover:bg-red-500/20 disabled:opacity-40"
                                      style={{ color: 'rgba(239,68,68,0.6)' }}>
                                      {deletingColor === c._id
                                        ? <Spinner size="sm" className="text-current" />
                                        : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
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
                        <div className="pt-2">
                          <AddColorForm typeId={type._id} onAdded={load} />
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
