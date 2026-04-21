import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { productAPI } from '../../products/services/product.service';
import { uploadAPI } from '../../../shared/api/upload.service';
import { Spinner } from '../../../shared/components/Spinner';
import { fmt } from '../../../shared/utils/currency';

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const emptyForm = () => ({
  name:        '',
  description: '',
  category:    'T-Shirt',
  badge:       '',
  image:       '',
  isActive:    true,
  basePrice:   1999,
  sizes:       [...DEFAULT_SIZES],
  colors:      [],
  sizePricing: {},
});

const Field = ({ label, children, error, hint }) => (
  <div>
    <label className="label">{label}</label>
    {hint && <p className="text-white/30 text-xs mb-1">{hint}</p>}
    {children}
    {error && <p className="error-text mt-1">⚠ {error}</p>}
  </div>
);

const ColorSwatch = ({ color, onRemove }) => (
  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
    <div className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0" style={{ background: color.hex }} />
    <span className="text-white/60 text-xs">{color.name}</span>
    <button type="button" onClick={onRemove} className="text-white/30 hover:text-red-400 transition-colors ml-1 text-sm leading-none">×</button>
  </div>
);

export default function AdminProductsPage() {
  const [products,     setProducts]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [modal,        setModal]        = useState(null);
  const [form,         setForm]         = useState(emptyForm());
  const [errors,       setErrors]       = useState({});
  const [imgUploading, setImgUploading] = useState(false);
  const [newColor,     setNewColor]     = useState({ name: '', hex: '#000000' });
  const [search,       setSearch]       = useState('');

  const load = () => {
    setLoading(true);
    productAPI.getAll({ activeOnly: false })
      .then(r => setProducts(r.data.products || []))
      .catch(() => toast.error('Failed to load products.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openCreate = () => {
    setForm(emptyForm());
    setErrors({});
    setNewColor({ name: '', hex: '#000000' });
    setModal('create');
  };

  const openEdit = (p) => {
    const sizePricingMap = p.sizePricing instanceof Map
      ? Object.fromEntries(p.sizePricing)
      : (p.sizePricing || {});
    setForm({
      name:        p.name || '',
      description: p.description || '',
      category:    p.category || 'T-Shirt',
      badge:       p.badge || '',
      image:       p.image || '',
      isActive:    p.isActive !== false,
      basePrice:   p.basePrice || 1999,
      sizes:       p.sizes?.length ? [...p.sizes] : [...DEFAULT_SIZES],
      colors:      p.colors ? [...p.colors] : [],
      sizePricing: { ...sizePricingMap },
    });
    setErrors({});
    setNewColor({ name: '', hex: '#000000' });
    setModal(p);
  };

  const closeModal = () => setModal(null);

  const validate = () => {
    const e = {};
    if (!form.name.trim())        e.name        = 'Required';
    if (!form.description.trim()) e.description = 'Required';
    if (!form.basePrice || isNaN(Number(form.basePrice)) || Number(form.basePrice) < 1)
      e.basePrice = 'Enter a valid price';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast.error('Only JPG/PNG/WEBP.'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB.'); return; }
    setImgUploading(true);
    try {
      const res = await uploadAPI.uploadProduct(file);
      setForm(f => ({ ...f, image: res.data.url }));
      toast.success('Image uploaded.');
    } catch { toast.error('Upload failed.'); }
    finally { setImgUploading(false); }
  };

  const addColor = () => {
    const name = newColor.name.trim();
    if (!name) { toast.error('Enter a color name.'); return; }
    if (form.colors.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Color already added.'); return;
    }
    setForm(f => ({ ...f, colors: [...f.colors, { name, hex: newColor.hex }] }));
    setNewColor({ name: '', hex: '#000000' });
  };

  const removeColor = (idx) => {
    setForm(f => ({ ...f, colors: f.colors.filter((_, i) => i !== idx) }));
  };

  const toggleSize = (size) => {
    setForm(f => {
      const sizes = f.sizes.includes(size)
        ? f.sizes.filter(s => s !== size)
        : [...f.sizes, size].sort((a, b) => DEFAULT_SIZES.indexOf(a) - DEFAULT_SIZES.indexOf(b));
      const sp = { ...f.sizePricing };
      if (!sizes.includes(size)) delete sp[size];
      return { ...f, sizes, sizePricing: sp };
    });
  };

  const setSizePremium = (size, val) => {
    const n = parseFloat(val);
    setForm(f => ({
      ...f,
      sizePricing: { ...f.sizePricing, [size]: isNaN(n) || n <= 0 ? undefined : n },
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const cleanSizePricing = {};
      Object.entries(form.sizePricing).forEach(([k, v]) => {
        if (v !== undefined && v !== null && !isNaN(Number(v)) && Number(v) > 0)
          cleanSizePricing[k] = Number(v);
      });
      const payload = {
        name:        form.name.trim(),
        description: form.description.trim(),
        category:    form.category || 'T-Shirt',
        badge:       form.badge?.trim() || null,
        image:       form.image || null,
        isActive:    form.isActive,
        basePrice:   Number(form.basePrice),
        sizes:       form.sizes,
        colors:      form.colors,
        sizePricing: cleanSizePricing,
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
    if (!confirm('Delete this product? This cannot be undone.')) return;
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

  const filtered = products.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const sizePricingInForm = form.sizePricing instanceof Map
    ? Object.fromEntries(form.sizePricing)
    : (form.sizePricing || {});

  return (
    <div className="space-y-6">
      {/* ── Modal ── */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.88)' }}
            onClick={closeModal}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="glass-card p-6 w-full max-w-2xl max-h-[92vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>

              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-display text-xl font-bold text-white">
                    {modal === 'create' ? 'Add New Product' : 'Edit Product'}
                  </h3>
                  <p className="text-white/35 text-xs mt-0.5">Fill in pricing, colors and sizes — these are visible to customers.</p>
                </div>
                <button onClick={closeModal} className="text-white/40 hover:text-white p-1 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-5" noValidate>
                {/* Basic info */}
                <div className="p-4 rounded-xl space-y-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-xs text-ink-brown font-medium tracking-widest uppercase">Basic Info</p>

                  <Field label="Product Name" error={errors.name}>
                    <input className="glass-input" value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Premium Oversized Tee" />
                  </Field>

                  <Field label="Description" error={errors.description}>
                    <textarea rows={2} className="glass-input resize-none" value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Brief product description shown on the product card…" />
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Category">
                      <input className="glass-input" value={form.category}
                        onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                        placeholder="T-Shirt" />
                    </Field>
                    <Field label="Badge (optional)">
                      <input className="glass-input" value={form.badge}
                        onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}
                        placeholder="New / Bestseller / Popular" />
                    </Field>
                  </div>
                </div>

                {/* Pricing */}
                <div className="p-4 rounded-xl space-y-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-xs text-ink-brown font-medium tracking-widest uppercase">Pricing (PKR)</p>

                  <Field label="Base Price" error={errors.basePrice} hint="Price for XS, S, M, L — larger sizes may have a premium">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm font-medium">PKR</span>
                      <input type="number" min="1" step="1" className="glass-input pl-12" value={form.basePrice}
                        onChange={e => setForm(f => ({ ...f, basePrice: e.target.value }))}
                        placeholder="1999" />
                    </div>
                  </Field>

                  {/* Size premiums */}
                  <div>
                    <p className="label mb-2">Size Premiums (optional)</p>
                    <p className="text-white/25 text-xs mb-3">Leave blank for no extra charge. Amount is added to base price.</p>
                    <div className="grid grid-cols-2 gap-3">
                      {form.sizes.map(size => {
                        const hasPremium = ['XL', 'XXL'].includes(size) || sizePricingInForm[size] > 0;
                        if (!hasPremium && !['XL', 'XXL'].includes(size)) return null;
                        return (
                          <div key={size} className="flex items-center gap-2">
                            <span className="text-white/50 text-xs font-medium w-8 flex-shrink-0">{size}</span>
                            <div className="relative flex-1">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30 text-xs">+PKR</span>
                              <input type="number" min="0" step="1" className="glass-input pl-12 py-1.5 text-sm"
                                value={sizePricingInForm[size] || ''}
                                onChange={e => setSizePremium(size, e.target.value)}
                                placeholder="0" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Sizes */}
                <div className="p-4 rounded-xl space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-xs text-ink-brown font-medium tracking-widest uppercase">Available Sizes</p>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_SIZES.map(size => (
                      <button key={size} type="button" onClick={() => toggleSize(size)}
                        className="px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200"
                        style={form.sizes.includes(size) ? {
                          background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', color: '#fff', border: '1px solid transparent',
                        } : {
                          background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)',
                        }}>
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Colors */}
                <div className="p-4 rounded-xl space-y-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-xs text-ink-brown font-medium tracking-widest uppercase">Colors</p>

                  {form.colors.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {form.colors.map((c, i) => (
                        <ColorSwatch key={i} color={c} onRemove={() => removeColor(i)} />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input type="color" value={newColor.hex}
                      onChange={e => setNewColor(n => ({ ...n, hex: e.target.value }))}
                      className="w-9 h-9 rounded-lg cursor-pointer border-0 p-0.5"
                      style={{ background: 'rgba(255,255,255,0.08)' }} />
                    <input className="glass-input flex-1" value={newColor.name}
                      onChange={e => setNewColor(n => ({ ...n, name: e.target.value }))}
                      placeholder="Color name (e.g. Midnight Black)"
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addColor(); } }} />
                    <button type="button" onClick={addColor}
                      className="px-4 py-2 rounded-xl text-xs font-medium text-white flex-shrink-0 transition-all"
                      style={{ background: 'rgba(107,66,38,0.3)', border: '1px solid rgba(107,66,38,0.4)' }}>
                      + Add
                    </button>
                  </div>
                </div>

                {/* Image */}
                <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-xs text-ink-brown font-medium tracking-widest uppercase mb-3">Display Image</p>
                  <label className="block cursor-pointer">
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                      onChange={e => handleImageUpload(e.target.files?.[0])} />
                    <div className="rounded-xl overflow-hidden transition-all hover:opacity-90"
                      style={{ border: '1.5px dashed rgba(107,66,38,0.35)', background: 'rgba(107,66,38,0.03)', minHeight: '120px' }}>
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
                            <svg className="w-8 h-8 text-ink-brown/30 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                            <p className="text-white/50 text-sm">Click to upload image</p>
                            <p className="text-white/25 text-xs mt-1">JPG, PNG, WEBP · Max 5MB</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </label>
                </div>

                {/* Active toggle */}
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                    className="w-10 h-6 rounded-full transition-all flex items-center px-0.5 flex-shrink-0"
                    style={{ background: form.isActive ? 'linear-gradient(135deg,#6B4226,#8B5A3C)' : 'rgba(255,255,255,0.1)' }}>
                    <div className="w-5 h-5 rounded-full bg-white shadow transition-transform"
                      style={{ transform: form.isActive ? 'translateX(16px)' : 'translateX(0)' }} />
                  </div>
                  <div>
                    <span className="text-white/70 text-sm font-medium">Active / Visible to customers</span>
                    <p className="text-white/30 text-xs">Hidden products won't show in the catalogue.</p>
                  </div>
                </label>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={saving}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60">
                    {saving && <Spinner size="sm" className="text-white" />}
                    {saving ? 'Saving…' : modal === 'create' ? 'Create Product' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs tracking-widest uppercase text-ink-brown mb-1">Catalogue</p>
          <h1 className="font-display text-2xl font-bold text-white">Products</h1>
          <p className="text-white/35 text-xs mt-1">Manage purchasable products — set prices, colors, sizes & availability.</p>
        </div>
        <button onClick={openCreate} className="btn-primary w-auto px-5 flex items-center gap-2 flex-shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
        </svg>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search products…"
          className="glass-input pl-9 py-2 text-sm rounded-xl" />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" className="text-ink-brown" /></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((p, i) => {
            const sizePricingMap = p.sizePricing instanceof Map
              ? Object.fromEntries(p.sizePricing)
              : (p.sizePricing || {});
            return (
              <motion.div key={p._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="glass-card overflow-hidden transition-all duration-200 hover:border-ink-brown/25"
                style={{ opacity: p.isActive ? 1 : 0.5 }}>

                {/* Image */}
                <div className="relative w-full" style={{ paddingBottom: '65%', background: 'rgba(107,66,38,0.07)' }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    {p.image
                      ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      : <svg className="w-10 h-10 text-ink-brown/20" fill="currentColor" viewBox="0 0 100 100">
                          <path d="M35 10 L20 25 L10 20 L15 45 L25 45 L25 90 L75 90 L75 45 L85 45 L90 20 L80 25 L65 10 C62 18 38 18 35 10Z" />
                        </svg>
                    }
                  </div>
                  {!p.isActive && (
                    <div className="absolute top-2 left-2">
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(239,68,68,0.15)', color: 'rgba(239,68,68,0.8)' }}>Hidden</span>
                    </div>
                  )}
                  {p.badge && (
                    <div className="absolute top-2 right-2">
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(107,66,38,0.35)', color: '#C48A5C' }}>{p.badge}</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-white text-xs font-semibold truncate">{p.name}</p>
                  <p className="text-white/40 text-xs mt-0.5 truncate">{p.category}</p>

                  {/* Price */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-ink-brown-light text-xs font-semibold">{fmt(p.basePrice || 0)}</span>
                    {Object.keys(sizePricingMap).length > 0 && (
                      <span className="text-white/25 text-[10px]">+ size</span>
                    )}
                  </div>

                  {/* Color dots */}
                  {p.colors?.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      {p.colors.slice(0, 6).map((c, ci) => (
                        <div key={ci} title={c.name} className="w-3 h-3 rounded-full border border-white/10 flex-shrink-0"
                          style={{ background: c.hex }} />
                      ))}
                      {p.colors.length > 6 && <span className="text-white/20 text-[10px]">+{p.colors.length - 6}</span>}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-1.5 mt-3">
                    <button onClick={() => openEdit(p)}
                      className="flex-1 text-xs py-1.5 rounded-lg transition-colors"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      Edit
                    </button>
                    <button onClick={() => handleToggleActive(p)}
                      className="text-xs px-2 py-1.5 rounded-lg flex-shrink-0"
                      style={p.isActive
                        ? { background: 'rgba(234,179,8,0.1)', color: '#ca8a04', border: '1px solid rgba(234,179,8,0.2)' }
                        : { background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
                      {p.isActive ? 'Hide' : 'Show'}
                    </button>
                    <button onClick={() => handleDelete(p._id)}
                      className="text-xs px-2 py-1.5 rounded-lg flex-shrink-0"
                      style={{ background: 'rgba(239,68,68,0.08)', color: 'rgba(239,68,68,0.7)', border: '1px solid rgba(239,68,68,0.12)' }}>
                      ×
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-white/30 text-sm">No products found.</p>
          {search && <button onClick={() => setSearch('')} className="mt-2 text-xs text-ink-brown hover:text-ink-brown-light transition-colors">Clear search</button>}
        </div>
      )}
    </div>
  );
}
