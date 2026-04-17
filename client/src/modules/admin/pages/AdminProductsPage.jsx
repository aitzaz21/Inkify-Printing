import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { productAPI } from '../../products/services/product.service';
import { uploadAPI } from '../../../shared/api/upload.service';
import { Spinner } from '../../../shared/components/Spinner';

const emptyForm = () => ({ name:'', description:'', category:'T-Shirt', badge:'', image:'', isActive:true });

const Field = ({ label, children, error }) => (
  <div>
    <label className="label">{label}</label>
    {children}
    {error && <p className="error-text">⚠ {error}</p>}
  </div>
);

export default function AdminProductsPage() {
  const [products,     setProducts]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [modal,        setModal]        = useState(null); // null | 'create' | product object
  const [form,         setForm]         = useState(emptyForm());
  const [errors,       setErrors]       = useState({});
  const [imgUploading, setImgUploading] = useState(false);

  const load = () => {
    setLoading(true);
    productAPI.getAll({ activeOnly: false })
      .then(r => setProducts(r.data.products || []))
      .catch(() => toast.error('Failed to load products.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openCreate = () => { setForm(emptyForm()); setErrors({}); setModal('create'); };
  const openEdit   = (p)  => { setForm({ name:p.name||'', description:p.description||'', category:p.category||'T-Shirt', badge:p.badge||'', image:p.image||'', isActive:p.isActive!==false }); setErrors({}); setModal(p); };
  const closeModal = ()   => setModal(null);

  const validate = () => {
    const e = {};
    if (!form.name.trim())        e.name        = 'Required';
    if (!form.description.trim()) e.description = 'Required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) { toast.error('Only JPG/PNG/WEBP.'); return; }
    if (file.size > 5*1024*1024) { toast.error('Max 5MB.'); return; }
    setImgUploading(true);
    try {
      const res = await uploadAPI.uploadProduct(file);
      setForm(f => ({ ...f, image: res.data.url }));
      toast.success('Image uploaded.');
    } catch { toast.error('Upload failed.'); }
    finally { setImgUploading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name:        form.name.trim(),
        description: form.description.trim(),
        category:    form.category || 'T-Shirt',
        badge:       form.badge?.trim() || null,
        image:       form.image || null,
        isActive:    form.isActive,
        // Keep pricing/sizes intact but don't expose in UI
        basePrice:   modal !== 'create' ? modal.basePrice : 1999, // PKR default
      };
      if (modal === 'create') {
        await productAPI.create(payload);
        toast.success('Product created.');
      } else {
        await productAPI.update(modal._id, payload);
        toast.success('Product updated.');
      }
      load(); closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await productAPI.delete(id);
      setProducts(prev => prev.filter(p => p._id !== id));
      toast.success('Deleted.');
    } catch { toast.error('Delete failed.'); }
  };

  const handleToggleActive = async (p) => {
    try {
      await productAPI.update(p._id, { isActive: !p.isActive });
      load();
    } catch { toast.error('Update failed.'); }
  };

  return (
    <div className="space-y-6">
      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background:'rgba(0,0,0,0.85)' }}
            onClick={closeModal}>
            <motion.div initial={{ scale:0.92, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.92, opacity:0 }}
              className="glass-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display text-lg font-bold text-white">
                  {modal === 'create' ? 'Add Display Card' : 'Edit Display Card'}
                </h3>
                <button onClick={closeModal} className="text-white/40 hover:text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4" noValidate>
                <Field label="Product Name" error={errors.name}>
                  <input className="glass-input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Classic Crew Tee" />
                </Field>

                <Field label="Short Description" error={errors.description}>
                  <textarea rows={3} className="glass-input resize-none" value={form.description}
                    onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                    placeholder="A short description shown on the homepage card…" />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Category">
                    <input className="glass-input" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} placeholder="T-Shirt" />
                  </Field>
                  <Field label="Badge (optional)">
                    <input className="glass-input" value={form.badge} onChange={e=>setForm(f=>({...f,badge:e.target.value}))} placeholder="New / Bestseller" />
                  </Field>
                </div>

                {/* Image upload */}
                <div>
                  <label className="label">Display Image</label>
                  <label className="block cursor-pointer">
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                      onChange={e => handleImageUpload(e.target.files?.[0])} />
                    <div className="rounded-xl overflow-hidden transition-all"
                      style={{ border:'1.5px dashed rgba(107,66,38,0.35)', background:'rgba(107,66,38,0.03)', minHeight:'120px' }}>
                      <div className="flex items-center justify-center p-4">
                        {imgUploading ? (
                          <Spinner size="md" className="text-ink-brown" />
                        ) : form.image ? (
                          <div className="flex flex-col items-center gap-2">
                            <img src={form.image} alt="" className="max-h-24 object-contain rounded-lg" />
                            <p className="text-white/30 text-xs">Click to replace</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <p className="text-white/50 text-sm">Click to upload image</p>
                            <p className="text-white/25 text-xs mt-1">JPG, PNG, WEBP · Max 5MB</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </label>
                </div>

                {/* Active toggle */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <div onClick={() => setForm(f=>({...f,isActive:!f.isActive}))}
                    className="w-10 h-6 rounded-full transition-all flex items-center px-0.5"
                    style={{ background: form.isActive ? 'linear-gradient(135deg,#6B4226,#8B5A3C)' : 'rgba(255,255,255,0.1)' }}>
                    <div className="w-5 h-5 rounded-full bg-white shadow transition-transform"
                      style={{ transform: form.isActive ? 'translateX(16px)' : 'translateX(0)' }} />
                  </div>
                  <span className="text-white/60 text-sm">Show on homepage</span>
                </label>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={saving}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60">
                    {saving && <Spinner size="sm" className="text-white" />}
                    {saving ? 'Saving…' : 'Save Card'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs tracking-widest uppercase text-ink-brown mb-1">Homepage</p>
          <h1 className="font-display text-2xl font-bold text-white">Display Cards</h1>
          <p className="text-white/35 text-xs mt-1">These are purely for inspiration — no pricing or size logic.</p>
        </div>
        <button onClick={openCreate} className="btn-primary w-auto px-6 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add Card
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" className="text-ink-brown" /></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p, i) => (
            <motion.div key={p._id} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
              className="glass-card overflow-hidden"
              style={{ opacity: p.isActive ? 1 : 0.5 }}>
              <div className="relative w-full" style={{ paddingBottom:'65%', background:'rgba(107,66,38,0.07)' }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  {p.image
                    ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    : <svg className="w-10 h-10 text-ink-brown/20" fill="currentColor" viewBox="0 0 100 100"><path d="M35 10 L20 25 L10 20 L15 45 L25 45 L25 90 L75 90 L75 45 L85 45 L90 20 L80 25 L65 10 C62 18 38 18 35 10Z" /></svg>
                  }
                </div>
                {!p.isActive && (
                  <div className="absolute top-2 left-2">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background:'rgba(239,68,68,0.15)', color:'rgba(239,68,68,0.8)' }}>Hidden</span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-white text-xs font-medium truncate">{p.name}</p>
                <p className="text-white/40 text-xs mt-0.5 truncate">{p.category}</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => openEdit(p)}
                    className="flex-1 text-xs py-1.5 rounded-lg transition-colors"
                    style={{ background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.6)', border:'1px solid rgba(255,255,255,0.08)' }}>
                    Edit
                  </button>
                  <button onClick={() => handleToggleActive(p)}
                    className="text-xs px-2 py-1.5 rounded-lg"
                    style={{ background: p.isActive ? 'rgba(234,179,8,0.1)' : 'rgba(34,197,94,0.1)', color: p.isActive ? '#ca8a04' : '#22c55e', border:`1px solid ${p.isActive?'rgba(234,179,8,0.2)':'rgba(34,197,94,0.2)'}` }}>
                    {p.isActive ? 'Hide' : 'Show'}
                  </button>
                  <button onClick={() => handleDelete(p._id)}
                    className="text-xs px-2 py-1.5 rounded-lg"
                    style={{ background:'rgba(239,68,68,0.08)', color:'rgba(239,68,68,0.7)', border:'1px solid rgba(239,68,68,0.12)' }}>
                    ×
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
