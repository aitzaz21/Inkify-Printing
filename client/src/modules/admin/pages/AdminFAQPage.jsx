import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../../shared/api/axios';
import { Spinner } from '../../../shared/components/Spinner';

const FAQ_CATEGORIES = ['General','Ordering','Shipping','Payments','Designs','Returns'];
const emptyForm = () => ({ question:'', answer:'', category:'General', sortOrder:0, isActive:true });

const Field = ({ label, children, error }) => (
  <div>
    <label className="label">{label}</label>
    {children}
    {error && <p className="error-text">⚠ {error}</p>}
  </div>
);

export default function AdminFAQPage() {
  const [faqs,     setFaqs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [modal,    setModal]    = useState(null);
  const [form,     setForm]     = useState(emptyForm());
  const [errors,   setErrors]   = useState({});
  const [activeCategory, setActiveCategory] = useState('All');

  const load = () => {
    setLoading(true);
    api.get('/faq/admin/all')
      .then(r => setFaqs(r.data.faqs || []))
      .catch(() => toast.error('Failed to load FAQs.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openCreate = () => { setForm(emptyForm()); setErrors({}); setModal('create'); };
  const openEdit   = (f) => { setForm({ question:f.question, answer:f.answer, category:f.category||'General', sortOrder:f.sortOrder||0, isActive:f.isActive!==false }); setErrors({}); setModal(f); };
  const closeModal = () => { setModal(null); setErrors({}); };

  const validate = () => {
    const e = {};
    if (!form.question.trim()) e.question = 'Question required.';
    if (!form.answer.trim())   e.answer   = 'Answer required.';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form, question: form.question.trim(), answer: form.answer.trim() };
      if (modal === 'create') {
        await api.post('/faq', payload);
        toast.success('FAQ added!');
      } else {
        await api.put(`/faq/${modal._id}`, payload);
        toast.success('FAQ updated!');
      }
      load(); closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this FAQ?')) return;
    try {
      await api.delete(`/faq/${id}`);
      setFaqs(prev => prev.filter(f => f._id !== id));
      toast.success('FAQ deleted.');
    } catch { toast.error('Delete failed.'); }
  };

  const handleToggleActive = async (f) => {
    try {
      await api.put(`/faq/${f._id}`, { isActive: !f.isActive });
      load();
    } catch { toast.error('Failed.'); }
  };

  const categories = ['All', ...new Set(faqs.map(f => f.category).filter(Boolean))];
  const filtered = activeCategory === 'All' ? faqs : faqs.filter(f => f.category === activeCategory);

  return (
    <div className="space-y-6">
      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background:'rgba(0,0,0,0.88)' }} onClick={closeModal}>
            <motion.div initial={{ scale:0.93, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.93, opacity:0 }}
              className="glass-card p-6 w-full max-w-lg"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display text-lg font-bold text-white">
                  {modal === 'create' ? 'Add FAQ' : 'Edit FAQ'}
                </h3>
                <button onClick={closeModal} className="text-white/40 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4" noValidate>
                <Field label="Question *" error={errors.question}>
                  <input className="glass-input" value={form.question} onChange={e=>set('question',e.target.value)}
                    placeholder="How long does delivery take?" />
                </Field>

                <Field label="Answer *" error={errors.answer}>
                  <textarea rows={4} className="glass-input resize-none" value={form.answer}
                    onChange={e=>set('answer',e.target.value)}
                    placeholder="Provide a clear and helpful answer..." />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Category">
                    <select className="glass-input" value={form.category} onChange={e=>set('category',e.target.value)}>
                      {FAQ_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Sort Order">
                    <input type="number" min="0" className="glass-input" value={form.sortOrder}
                      onChange={e=>set('sortOrder',parseInt(e.target.value)||0)} />
                  </Field>
                </div>

                {/* Active toggle */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <div onClick={() => set('isActive', !form.isActive)}
                    className="w-10 h-6 rounded-full transition-all flex items-center px-0.5"
                    style={{ background: form.isActive ? 'linear-gradient(135deg,#6B4226,#8B5A3C)' : 'rgba(255,255,255,0.1)' }}>
                    <div className="w-5 h-5 rounded-full bg-white shadow transition-transform"
                      style={{ transform: form.isActive ? 'translateX(16px)' : 'translateX(0)' }} />
                  </div>
                  <span className="text-white/60 text-sm">{form.isActive ? 'Visible on FAQ page' : 'Hidden from FAQ page'}</span>
                </label>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={saving}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60">
                    {saving && <Spinner size="sm" className="text-white" />}
                    {saving ? 'Saving…' : modal === 'create' ? 'Add FAQ' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs tracking-widest uppercase text-ink-brown mb-1">Support</p>
          <h1 className="font-display text-2xl font-bold text-white">FAQ Management</h1>
        </div>
        <button onClick={openCreate} className="btn-primary w-auto px-5 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add FAQ
        </button>
      </div>

      {/* Category filter */}
      {categories.length > 2 && (
        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <button key={c} onClick={() => setActiveCategory(c)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={activeCategory === c
                ? { background:'linear-gradient(135deg,#6B4226,#8B5A3C)', color:'#fff' }
                : { background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.45)', border:'1px solid rgba(255,255,255,0.1)' }
              }>
              {c}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" className="text-ink-brown" /></div>
      ) : faqs.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-4xl mb-3">💬</p>
          <p className="text-white/50 text-lg font-medium mb-1">No FAQs yet</p>
          <p className="text-white/25 text-sm mb-6">Add common questions to help customers.</p>
          <button onClick={openCreate} className="btn-primary w-auto px-8 mx-auto block">Add First FAQ</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((f, i) => (
            <motion.div key={f._id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.03 }}
              className="glass-card p-4"
              style={{ opacity: f.isActive ? 1 : 0.55 }}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background:'rgba(107,66,38,0.15)', color:'#C48A5C', border:'1px solid rgba(107,66,38,0.2)' }}>
                      {f.category}
                    </span>
                    {!f.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background:'rgba(239,68,68,0.1)', color:'rgba(239,68,68,0.7)' }}>Hidden</span>
                    )}
                  </div>
                  <p className="text-white font-medium text-sm">{f.question}</p>
                  <p className="text-white/45 text-xs mt-1 leading-relaxed line-clamp-2">{f.answer}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => openEdit(f)}
                    className="text-xs px-2.5 py-1.5 rounded-lg"
                    style={{ background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.6)', border:'1px solid rgba(255,255,255,0.08)' }}>
                    Edit
                  </button>
                  <button onClick={() => handleToggleActive(f)}
                    className="text-xs px-2.5 py-1.5 rounded-lg"
                    style={{ background: f.isActive ? 'rgba(234,179,8,0.08)' : 'rgba(34,197,94,0.08)', color: f.isActive ? '#ca8a04' : '#22c55e', border:`1px solid ${f.isActive?'rgba(234,179,8,0.15)':'rgba(34,197,94,0.15)'}` }}>
                    {f.isActive ? 'Hide' : 'Show'}
                  </button>
                  <button onClick={() => handleDelete(f._id)}
                    className="text-xs px-2.5 py-1.5 rounded-lg"
                    style={{ background:'rgba(239,68,68,0.08)', color:'rgba(239,68,68,0.7)', border:'1px solid rgba(239,68,68,0.12)' }}>
                    Delete
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
