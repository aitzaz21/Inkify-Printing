import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../../shared/api/axios';
import { Spinner } from '../../../shared/components/Spinner';

const EMPTY_FORM = { bankName: '', accountTitle: '', accountNumber: '', iban: '', instructions: '', sortOrder: 0 };

function FormModal({ initial, onSave, onClose, saving }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const setF = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => { const n={...e}; delete n[k]; return n; }); };

  const validate = () => {
    const e = {};
    if (!form.bankName.trim())      e.bankName      = 'Required';
    if (!form.accountTitle.trim())  e.accountTitle  = 'Required';
    if (!form.accountNumber.trim()) e.accountNumber = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => { if (validate()) onSave(form); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.82)' }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.16 }}
        className="w-full max-w-md rounded-2xl p-6 space-y-5"
        style={{ background: '#1a1612', border: '1px solid rgba(107,66,38,0.35)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-white">
            {initial ? 'Edit Payment Account' : 'Add Payment Account'}
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="space-y-4">
          {/* Bank / Account name */}
          <div>
            <label className="label text-xs">Bank / Account Name <span className="text-red-400">*</span></label>
            <input className={`glass-input ${errors.bankName ? 'border-red-500/50' : ''}`}
              value={form.bankName}
              onChange={e => setF('bankName', e.target.value)}
              placeholder="e.g. HBL, JazzCash, EasyPaisa, Meezan Bank" />
            {errors.bankName && <p className="text-red-400 text-xs mt-1">{errors.bankName}</p>}
          </div>

          {/* Account title */}
          <div>
            <label className="label text-xs">Account Title <span className="text-red-400">*</span></label>
            <input className={`glass-input ${errors.accountTitle ? 'border-red-500/50' : ''}`}
              value={form.accountTitle}
              onChange={e => setF('accountTitle', e.target.value)}
              placeholder="e.g. Muhammad Ali Khan" />
            {errors.accountTitle && <p className="text-red-400 text-xs mt-1">{errors.accountTitle}</p>}
          </div>

          {/* Account number */}
          <div>
            <label className="label text-xs">Account Number <span className="text-red-400">*</span></label>
            <input className={`glass-input font-mono ${errors.accountNumber ? 'border-red-500/50' : ''}`}
              value={form.accountNumber}
              onChange={e => setF('accountNumber', e.target.value)}
              placeholder="e.g. 03XX-XXXXXXX or 0123456789012" />
            {errors.accountNumber && <p className="text-red-400 text-xs mt-1">{errors.accountNumber}</p>}
          </div>

          {/* IBAN (optional) */}
          <div>
            <label className="label text-xs">IBAN <span className="text-white/30">(optional)</span></label>
            <input className="glass-input font-mono"
              value={form.iban}
              onChange={e => setF('iban', e.target.value)}
              placeholder="e.g. PK36ALFH0000000000000000" />
          </div>

          {/* Instructions (optional) */}
          <div>
            <label className="label text-xs">Instructions for customer <span className="text-white/30">(optional)</span></label>
            <textarea className="glass-input resize-none" rows={2}
              value={form.instructions}
              onChange={e => setF('instructions', e.target.value)}
              placeholder="e.g. Send payment to this number and upload screenshot below." />
          </div>

          {/* Sort order */}
          <div>
            <label className="label text-xs">Display Order</label>
            <input type="number" min="0" className="glass-input w-24"
              value={form.sortOrder}
              onChange={e => setF('sortOrder', parseInt(e.target.value) || 0)} />
            <p className="text-white/25 text-[11px] mt-1">Lower number = shown first</p>
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
            {saving ? <><Spinner size="sm" className="text-white" /> Saving…</> : 'Save Account'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminPaymentMethodsPage() {
  const [methods,  setMethods]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null); // null | 'add' | { editing method }
  const [saving,   setSaving]   = useState(false);
  const [toggling, setToggling] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/payment-methods/all')
      .then(r => setMethods(r.data.methods || []))
      .catch(() => toast.error('Failed to load payment methods.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (modal?._id) {
        await api.put(`/payment-methods/${modal._id}`, form);
        toast.success('Account updated.');
      } else {
        await api.post('/payment-methods', form);
        toast.success('Account added.');
      }
      setModal(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed.');
    } finally { setSaving(false); }
  };

  const handleToggle = async (id) => {
    setToggling(id);
    try {
      await api.patch(`/payment-methods/${id}/toggle`);
      load();
    } catch { toast.error('Toggle failed.'); }
    finally { setToggling(null); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payment account? Orders that used it will still reference the name.')) return;
    setDeleting(id);
    try {
      await api.delete(`/payment-methods/${id}`);
      toast.success('Deleted.');
      load();
    } catch { toast.error('Delete failed.'); }
    finally { setDeleting(null); }
  };

  return (
    <div className="space-y-8">

      <AnimatePresence>
        {modal !== null && (
          <FormModal
            initial={modal?._id ? modal : null}
            onSave={handleSave}
            onClose={() => setModal(null)}
            saving={saving}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs tracking-widest uppercase text-ink-brown mb-1">Admin</p>
          <h1 className="font-display text-2xl font-bold text-white">Payment Methods</h1>
          <p className="text-white/35 text-sm mt-1">
            Manage the bank / mobile accounts customers can transfer money to.
          </p>
        </div>
        <button onClick={() => setModal('add')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', boxShadow: '0 4px 14px rgba(107,66,38,0.35)' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
          Add Account
        </button>
      </div>

      {/* Info banner */}
      <div className="rounded-2xl p-4 flex items-start gap-3"
        style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)' }}>
        <span className="text-blue-400 text-base flex-shrink-0 mt-0.5">ℹ</span>
        <div className="text-xs leading-relaxed" style={{ color: 'rgba(147,197,253,0.75)' }}>
          <p className="font-semibold text-blue-300 mb-1">How manual payment works</p>
          <p>Customers select one of your accounts, transfer the amount, then upload a screenshot as proof.
            The order stays <strong>pending</strong> until you manually verify the screenshot and confirm the order.
            Always check the proof in the order detail before confirming.</p>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" className="text-ink-brown" /></div>
      ) : methods.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-2xl"
            style={{ background: 'rgba(107,66,38,0.12)', border: '1px solid rgba(107,66,38,0.2)' }}>
            🏦
          </div>
          <p className="text-white/60 text-sm">No payment accounts added yet.</p>
          <p className="text-white/30 text-xs">Add your first account to enable bank-transfer payments at checkout.</p>
          <button onClick={() => setModal('add')}
            className="mt-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
            + Add First Account
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {methods.map(m => (
            <motion.div key={m._id} layout
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="glass-card p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              style={{ opacity: m.isActive ? 1 : 0.55 }}>

              {/* Bank icon */}
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: m.isActive ? 'rgba(107,66,38,0.15)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                🏦
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-white text-sm">{m.bankName}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={m.isActive
                      ? { background: 'rgba(34,197,94,0.12)', color: 'rgba(34,197,94,0.9)', border: '1px solid rgba(34,197,94,0.2)' }
                      : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)' }
                    }>
                    {m.isActive ? 'Active' : 'Hidden'}
                  </span>
                </div>
                <p className="text-white/55 text-xs">{m.accountTitle}</p>
                <p className="text-white/70 text-sm font-mono">{m.accountNumber}</p>
                {m.iban && <p className="text-white/35 text-xs font-mono">IBAN: {m.iban}</p>}
                {m.instructions && (
                  <p className="text-white/35 text-xs italic mt-1">"{m.instructions}"</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => setModal(m)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ background: 'rgba(107,66,38,0.12)', color: '#C9967A', border: '1px solid rgba(107,66,38,0.25)' }}>
                  Edit
                </button>
                <button onClick={() => handleToggle(m._id)} disabled={toggling === m._id}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                  style={m.isActive
                    ? { background: 'rgba(239,68,68,0.08)', color: 'rgba(239,68,68,0.8)', border: '1px solid rgba(239,68,68,0.18)' }
                    : { background: 'rgba(34,197,94,0.08)', color: 'rgba(34,197,94,0.8)', border: '1px solid rgba(34,197,94,0.18)' }
                  }>
                  {toggling === m._id ? <Spinner size="sm" className="text-current" /> : m.isActive ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => handleDelete(m._id)} disabled={deleting === m._id}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-red-500/15 disabled:opacity-50"
                  style={{ color: 'rgba(239,68,68,0.6)', border: '1px solid rgba(239,68,68,0.12)' }}>
                  {deleting === m._id
                    ? <Spinner size="sm" className="text-current" />
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                  }
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
