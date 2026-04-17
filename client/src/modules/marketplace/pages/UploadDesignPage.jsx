import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { designAPI } from '../services/design.service';
import { uploadAPI } from '../../../shared/api/upload.service';
import { Spinner } from '../../../shared/components/Spinner';
import api from '../../../shared/api/axios';

const MAX_MB   = 5;
const ACCEPTED = ['image/jpeg','image/png','image/webp'];
const PAYMENT_METHODS = ['Bank Transfer','JazzCash','EasyPaisa','SadaPay','Nayapay','PayPal','Other'];

/* ── First-time account details modal ── */
const AccountSetupModal = ({ onSave, onSkip }) => {
  const [form,   setForm]   = useState({ method:'Bank Transfer', accountName:'', accountNumber:'' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.accountName.trim() || !form.accountNumber.trim()) {
      toast.error('Please fill in account name and number.'); return;
    }
    setSaving(true);
    try {
      await api.post('/users/me/payment-accounts', { ...form, isPrimary: true });
      toast.success('Payment account saved!');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save account.');
    } finally { setSaving(false); }
  };

  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(0,0,0,0.88)' }}
    >
      <motion.div
        initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.9, opacity:0 }}
        className="glass-card p-6 sm:p-8 w-full max-w-md"
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background:'rgba(107,66,38,0.18)', border:'1px solid rgba(107,66,38,0.3)' }}>
            <svg className="w-5 h-5 text-ink-brown" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-white">Set Up Payment Account</h3>
            <p className="text-white/45 text-sm mt-0.5">
              Before listing designs, add your payment details so we can pay you when your designs sell.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Payment method */}
          <div>
            <label className="label">Payment Method</label>
            <select className="glass-input" value={form.method} onChange={e => set('method', e.target.value)}>
              {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Account name */}
          <div>
            <label className="label">Account Name</label>
            <input className="glass-input" value={form.accountName}
              onChange={e => set('accountName', e.target.value)}
              placeholder="Full name on account" />
          </div>

          {/* Account number */}
          <div>
            <label className="label">
              {form.method === 'JazzCash' || form.method === 'EasyPaisa'
                ? 'Mobile Number' : form.method === 'Bank Transfer'
                ? 'IBAN / Account Number' : 'Account ID / Email'}
            </label>
            <input className="glass-input" value={form.accountNumber}
              onChange={e => set('accountNumber', e.target.value)}
              placeholder={
                form.method === 'JazzCash' || form.method === 'EasyPaisa'
                  ? '03XX-XXXXXXX' : form.method === 'Bank Transfer'
                  ? 'PK00XXXX...' : 'your@email.com'
              } />
          </div>

          <div className="p-3 rounded-xl text-xs text-white/40 flex items-start gap-2"
            style={{ background:'rgba(107,66,38,0.07)', border:'1px solid rgba(107,66,38,0.15)' }}>
            <svg className="w-3.5 h-3.5 text-ink-brown flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            Your payment details are stored securely. You can update them anytime from your profile.
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onSkip} className="btn-secondary flex-1 text-sm">
            Skip for now
          </button>
          <button onClick={handleSave} disabled={saving}
            className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm disabled:opacity-60">
            {saving && <Spinner size="sm" className="text-white" />}
            {saving ? 'Saving…' : 'Save & Continue'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function UploadDesignPage() {
  const navigate = useNavigate();

  const [form,       setForm]      = useState({ title:'', description:'', price:'', tags:'' });
  const [imageUrl,   setImageUrl]  = useState('');
  const [preview,    setPreview]   = useState('');
  const [uploading,  setUploading] = useState(false);
  const [progress,   setProgress]  = useState(0);
  const [submitting, setSubmitting]= useState(false);
  const [errors,     setErrors]    = useState({});

  // Account setup modal state
  const [checkingAccount, setCheckingAccount] = useState(true);
  const [showAccountModal, setShowAccountModal] = useState(false);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => { const n={...e}; delete n[k]; return n; }); };

  // Check on mount: does this user have a payment account already?
  useEffect(() => {
    api.get('/users/me/payment-accounts')
      .then(r => {
        const accounts = r.data.paymentAccounts || [];
        if (accounts.length === 0) {
          setShowAccountModal(true);
        }
      })
      .catch(() => {
        // If request fails (e.g. not logged in), just proceed silently
      })
      .finally(() => setCheckingAccount(false));
  }, []);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) { toast.error('Only JPG, PNG, WEBP allowed.'); return; }
    if (file.size > MAX_MB * 1024 * 1024) { toast.error('Max 5 MB.'); return; }
    setPreview(URL.createObjectURL(file));
    setUploading(true); setProgress(0);
    try {
      const res = await uploadAPI.uploadDesign(file, p => setProgress(p));
      setImageUrl(res.data.url);
      toast.success('Image uploaded!');
    } catch {
      toast.error('Upload failed.'); setPreview('');
    } finally { setUploading(false); setProgress(0); }
    e.target.value = '';
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!imageUrl)           e.image = 'Please upload an image';
    if (form.price && isNaN(+form.price)) e.price = 'Invalid price';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await designAPI.create({
        title:       form.title.trim(),
        description: form.description.trim(),
        imageUrl,
        price:       parseFloat(form.price) || 0,
        tags:        form.tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      toast.success('Design submitted for review! You\'ll be notified once approved.');
      navigate('/profile/designs');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed.');
    } finally { setSubmitting(false); }
  };

  if (checkingAccount) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" className="text-ink-brown" />
    </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      {/* First-time account setup modal */}
      <AnimatePresence>
        {showAccountModal && (
          <AccountSetupModal
            onSave={() => setShowAccountModal(false)}
            onSkip={() => setShowAccountModal(false)}
          />
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}>
          <p className="text-xs tracking-widest uppercase text-ink-brown mb-2">Marketplace</p>
          <h1 className="font-display text-3xl font-bold text-white mb-8">Upload Your Design</h1>

          <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-8 space-y-6" noValidate>

            {/* Image upload */}
            <div>
              <label className="label">Design Image <span className="text-red-400">*</span></label>
              <label className="block cursor-pointer">
                <input type="file" accept={ACCEPTED.join(',')} onChange={handleFile} className="hidden" />
                <div className="relative w-full rounded-2xl overflow-hidden transition-all duration-200 hover:border-ink-brown/50"
                  style={{ paddingBottom:'56%', border:`1.5px dashed ${errors.image ? 'rgba(239,68,68,0.5)' : 'rgba(107,66,38,0.35)'}`, background:'rgba(107,66,38,0.03)' }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    {uploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <Spinner size="md" className="text-ink-brown" />
                        <div className="w-36 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <motion.div className="h-full rounded-full" style={{ background:'linear-gradient(90deg,#6B4226,#8B5A3C)' }}
                            animate={{ width:`${progress}%` }} transition={{ duration:0.2 }} />
                        </div>
                        <span className="text-white/40 text-xs">{progress}%</span>
                      </div>
                    ) : preview ? (
                      <div className="w-full h-full flex items-center justify-center p-4">
                        <img src={preview} alt="Preview" className="max-h-full object-contain rounded-xl" />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3 p-8 text-center">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                          style={{ background:'rgba(107,66,38,0.15)', border:'1px solid rgba(107,66,38,0.3)' }}>
                          <svg className="w-7 h-7 text-ink-brown" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white/70 font-medium">Click to upload your design</p>
                          <p className="text-white/30 text-sm mt-1">JPG, PNG, WEBP · Max {MAX_MB} MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </label>
              {errors.image && <p className="error-text mt-1">⚠ {errors.image}</p>}
            </div>

            {/* Title */}
            <div>
              <label className="label">Design Title <span className="text-red-400">*</span></label>
              <input className={`glass-input ${errors.title ? 'border-red-500/40' : ''}`}
                value={form.title} onChange={e => set('title', e.target.value)}
                placeholder="e.g. Mountain Sunrise Graphic" maxLength={80} />
              {errors.title && <p className="error-text">⚠ {errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="label">Description <span className="text-white/30 text-xs normal-case tracking-normal">(optional)</span></label>
              <textarea rows={3} className="glass-input resize-none"
                value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="What's the story behind this design?" maxLength={500} />
            </div>

            {/* Price */}
            <div>
              <label className="label">Your Asking Price (PKR) <span className="text-white/30 text-xs normal-case tracking-normal">(0 = free)</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35 text-sm font-medium">PKR</span>
                <input type="number" min="0" step="50"
                  className={`glass-input pl-14 ${errors.price ? 'border-red-500/40' : ''}`}
                  value={form.price} onChange={e => set('price', e.target.value)}
                  placeholder="500" />
              </div>
              {errors.price && <p className="error-text">⚠ {errors.price}</p>}
              <p className="text-white/25 text-xs mt-1">This amount is added to the shirt price when customers buy your design.</p>
            </div>

            {/* Tags */}
            <div>
              <label className="label">Tags <span className="text-white/30 text-xs normal-case tracking-normal">(comma separated)</span></label>
              <input className="glass-input"
                value={form.tags} onChange={e => set('tags', e.target.value)}
                placeholder="minimalist, nature, abstract" />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={submitting || uploading}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60">
                {submitting && <Spinner size="sm" className="text-white" />}
                {submitting ? 'Submitting…' : 'Submit for Review'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
