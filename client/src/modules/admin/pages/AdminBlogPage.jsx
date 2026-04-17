import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../../shared/api/axios';
import { uploadAPI } from '../../../shared/api/upload.service';
import { Spinner } from '../../../shared/components/Spinner';

const emptyForm = () => ({
  title: '', slug: '', content: '', excerpt: '', author: 'Inkify Team',
  tags: '', image: '', isPublished: false, metaTitle: '', metaDescription: '',
});

const Field = ({ label, children, error, hint }) => (
  <div>
    <label className="label">{label}</label>
    {children}
    {hint  && <p className="text-white/25 text-xs mt-1">{hint}</p>}
    {error && <p className="error-text">⚠ {error}</p>}
  </div>
);

export default function AdminBlogPage() {
  const [blogs,    setBlogs]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState('');
  const [modal,    setModal]    = useState(null); // null | 'create' | blog object
  const [form,     setForm]     = useState(emptyForm());
  const [errors,   setErrors]   = useState({});
  const [imgUploading, setImgUploading] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/blog/admin/all')
      .then(r => setBlogs(r.data.blogs || []))
      .catch(() => toast.error('Failed to load blogs.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openCreate = () => { setForm(emptyForm()); setErrors({}); setModal('create'); };
  const openEdit   = (b) => {
    setForm({
      title: b.title || '', slug: b.slug || '', content: b.content || '',
      excerpt: b.excerpt || '', author: b.author || 'Inkify Team',
      tags: (b.tags || []).join(', '), image: b.image || '', isPublished: !!b.isPublished,
      metaTitle: b.metaTitle || '', metaDescription: b.metaDescription || '',
    });
    setErrors({});
    setModal(b);
  };
  const closeModal = () => { setModal(null); setErrors({}); };

  const validate = () => {
    const e = {};
    if (!form.title.trim())   e.title   = 'Title is required.';
    if (!form.content.trim()) e.content = 'Content is required.';
    if (!form.metaDescription.trim()) e.metaDescription = 'Meta Description is required for SEO.';
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
      set('image', res.data.url);
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
        title:       form.title.trim(),
        slug:        form.slug.trim() || undefined,
        content:     form.content.trim(),
        excerpt:     form.excerpt.trim(),
        author:      form.author.trim() || 'Inkify Team',
        tags:        form.tags.split(',').map(t => t.trim()).filter(Boolean),
        image:       form.image || null,
        isPublished: form.isPublished,
        metaTitle:       form.metaTitle.trim(),
        metaDescription: form.metaDescription.trim(),
      };
      if (modal === 'create') {
        await api.post('/blog', payload);
        toast.success('Blog post created!');
      } else {
        await api.put(`/blog/${modal._id}`, payload);
        toast.success('Blog post updated!');
      }
      load(); closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this blog post permanently?')) return;
    setDeleting(id);
    try {
      await api.delete(`/blog/${id}`);
      setBlogs(prev => prev.filter(b => b._id !== id));
      toast.success('Blog deleted.');
    } catch { toast.error('Delete failed.'); }
    finally { setDeleting(''); }
  };

  const handleTogglePublish = async (b) => {
    try {
      await api.put(`/blog/${b._id}`, { isPublished: !b.isPublished });
      load();
      toast.success(b.isPublished ? 'Unpublished.' : 'Published!');
    } catch { toast.error('Failed.'); }
  };

  return (
    <div className="space-y-6">
      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
            style={{ background:'rgba(0,0,0,0.88)' }} onClick={closeModal}>
            <motion.div initial={{ scale:0.93, opacity:0, y:20 }} animate={{ scale:1, opacity:1, y:0 }} exit={{ scale:0.93, opacity:0 }}
              className="glass-card p-6 w-full max-w-2xl my-8"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display text-lg font-bold text-white">
                  {modal === 'create' ? 'New Blog Post' : 'Edit Blog Post'}
                </h3>
                <button onClick={closeModal} className="text-white/40 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Title *" error={errors.title}>
                    <input className="glass-input" value={form.title} onChange={e=>set('title',e.target.value)} placeholder="How to Care for Your Custom Tee" />
                  </Field>
                  <Field label="SEO Slug" hint="Auto-generated if left blank">
                    <input className="glass-input font-mono text-sm" value={form.slug} onChange={e=>set('slug',e.target.value)} placeholder="care-for-custom-tee" />
                  </Field>
                </div>

                {/* Cover image */}
                <Field label="Cover Image">
                  <label className="block cursor-pointer">
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                      onChange={e => handleImageUpload(e.target.files?.[0])} />
                    <div className="rounded-xl overflow-hidden flex items-center justify-center transition-all"
                      style={{ border:'1.5px dashed rgba(107,66,38,0.35)', background:'rgba(107,66,38,0.03)', minHeight:'100px' }}>
                      {imgUploading ? <Spinner size="md" className="text-ink-brown m-4" /> :
                       form.image ? (
                        <div className="flex items-center gap-3 p-3 w-full">
                          <img src={form.image} alt="" className="w-16 h-12 object-cover rounded-lg flex-shrink-0" />
                          <p className="text-white/40 text-sm">Click to replace</p>
                        </div>
                       ) : (
                        <p className="text-white/30 text-sm p-4">Click to upload cover image (JPG/PNG/WEBP · max 5MB)</p>
                       )}
                    </div>
                  </label>
                </Field>

                <Field label="Content *" error={errors.content} hint="Plain text or basic HTML supported.">
                  <textarea rows={10} className="glass-input resize-y font-mono text-xs leading-relaxed"
                    value={form.content} onChange={e=>set('content',e.target.value)}
                    placeholder="Write your blog post here..." />
                </Field>

                <Field label="Excerpt" hint="Short preview shown on the blog listing (max 300 chars).">
                  <textarea rows={2} className="glass-input resize-none" value={form.excerpt}
                    onChange={e=>set('excerpt',e.target.value)} maxLength={300}
                    placeholder="A short description of this post..." />
                </Field>

                {/* SEO Fields */}
                <div className="rounded-xl p-4 space-y-4" style={{ background:'rgba(107,66,38,0.06)', border:'1px solid rgba(107,66,38,0.15)' }}>
                  <p className="text-xs font-medium tracking-widest uppercase text-ink-brown">SEO Settings</p>
                  <Field label="Meta Title" hint="Custom title for search engines (max 100 chars). Defaults to post title.">
                    <input className="glass-input" value={form.metaTitle} onChange={e=>set('metaTitle',e.target.value)} placeholder={form.title || 'Same as title'} maxLength={100} />
                  </Field>
                  <Field label="Meta Description *" error={errors.metaDescription} hint="Required. Shown in Google results (max 200 chars).">
                    <textarea rows={2} className="glass-input resize-none" value={form.metaDescription}
                      onChange={e=>set('metaDescription',e.target.value)} maxLength={200}
                      placeholder="Concise description for search engines..." />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Author">
                    <input className="glass-input" value={form.author} onChange={e=>set('author',e.target.value)} placeholder="Inkify Team" />
                  </Field>
                  <Field label="Tags" hint="Comma-separated">
                    <input className="glass-input" value={form.tags} onChange={e=>set('tags',e.target.value)} placeholder="printing, tips, fashion" />
                  </Field>
                </div>

                {/* Publish toggle */}
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl"
                  style={{ background:'rgba(34,197,94,0.05)', border:'1px solid rgba(34,197,94,0.12)' }}>
                  <div onClick={() => set('isPublished', !form.isPublished)}
                    className="w-10 h-6 rounded-full transition-all flex items-center px-0.5 flex-shrink-0"
                    style={{ background: form.isPublished ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'rgba(255,255,255,0.1)' }}>
                    <div className="w-5 h-5 rounded-full bg-white shadow transition-transform"
                      style={{ transform: form.isPublished ? 'translateX(16px)' : 'translateX(0)' }} />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{form.isPublished ? 'Published' : 'Draft'}</p>
                    <p className="text-white/35 text-xs">{form.isPublished ? 'Visible to all visitors' : 'Not visible to public'}</p>
                  </div>
                </label>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={saving}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60">
                    {saving && <Spinner size="sm" className="text-white" />}
                    {saving ? 'Saving…' : modal === 'create' ? 'Create Post' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs tracking-widest uppercase text-ink-brown mb-1">Content</p>
          <h1 className="font-display text-2xl font-bold text-white">Blog Posts</h1>
        </div>
        <button onClick={openCreate} className="btn-primary w-auto px-5 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          New Post
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" className="text-ink-brown" /></div>
      ) : blogs.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-4xl mb-3">📝</p>
          <p className="text-white/50 text-lg font-medium mb-1">No blog posts yet</p>
          <p className="text-white/25 text-sm mb-6">Create your first post to boost SEO.</p>
          <button onClick={openCreate} className="btn-primary w-auto px-8 mx-auto block">Write First Post</button>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.08]">
                {['Title','Author','Tags','Status','Date','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-white/30 tracking-widest uppercase font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {blogs.map((b, i) => (
                <motion.tr key={b._id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.03 }}
                  className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 max-w-[220px]">
                    <div className="flex items-center gap-3">
                      {b.image && <img src={b.image} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />}
                      <div>
                        <p className="text-white font-medium text-xs leading-snug line-clamp-2">{b.title}</p>
                        <p className="text-white/25 text-xs font-mono mt-0.5">{b.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white/50 text-xs">{b.author}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {b.tags?.slice(0,2).map(t => (
                        <span key={t} className="text-xs px-1.5 py-0.5 rounded-full"
                          style={{ background:'rgba(107,66,38,0.15)', color:'#C48A5C' }}>{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${b.isPublished ? 'text-emerald-400' : 'text-yellow-500/80'}`}
                      style={{ background: b.isPublished ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)' }}>
                      {b.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/30 text-xs">{new Date(b.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(b)}
                        className="text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                        style={{ background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.6)', border:'1px solid rgba(255,255,255,0.08)' }}>
                        Edit
                      </button>
                      <button onClick={() => handleTogglePublish(b)}
                        className="text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                        style={{ background: b.isPublished ? 'rgba(234,179,8,0.08)' : 'rgba(34,197,94,0.08)', color: b.isPublished ? '#ca8a04' : '#22c55e', border:`1px solid ${b.isPublished ? 'rgba(234,179,8,0.15)' : 'rgba(34,197,94,0.15)'}` }}>
                        {b.isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                      <button onClick={() => handleDelete(b._id)} disabled={deleting === b._id}
                        className="text-xs px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        style={{ background:'rgba(239,68,68,0.08)', color:'rgba(239,68,68,0.7)', border:'1px solid rgba(239,68,68,0.12)' }}>
                        {deleting === b._id ? '…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
