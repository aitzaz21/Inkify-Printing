import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { contentAPI } from '../../../shared/api/content.service';
import { uploadAPI } from '../../../shared/api/upload.service';
import { Spinner } from '../../../shared/components/Spinner';

const TABS = ['Hero', 'Reviews', 'Privacy Policy'];

const Field = ({ label, children }) => (
  <div>
    <label className="label">{label}</label>
    {children}
  </div>
);

export default function AdminContentPage() {
  const [content,  setContent]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [tab,      setTab]      = useState(0);

  // Hero state
  const [headline, setHeadline] = useState('');
  const [sub,      setSub]      = useState('');
  const [heroFile, setHeroFile] = useState(null);
  const [uploading,setUploading]= useState(false);

  // Reviews state
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, text: '', date: '' });
  const [addingReview, setAddingReview] = useState(false);

  // Privacy
  const [privacy, setPrivacy] = useState('');

  useEffect(() => {
    contentAPI.get()
      .then(r => {
        const c = r.data.content;
        setContent(c);
        setHeadline(c.heroHeadline || '');
        setSub(c.heroSubheadline || '');
        setPrivacy(c.privacyPolicy || '');
      })
      .catch(() => toast.error('Failed to load content.'))
      .finally(() => setLoading(false));
  }, []);

  // ── Hero ──────────────────────────────────────────────────────
  const handleSaveHeroText = async () => {
    setSaving(true);
    try {
      const r = await contentAPI.update({ heroHeadline: headline, heroSubheadline: sub });
      setContent(r.data.content);
      toast.success('Hero text saved.');
    } catch { toast.error('Save failed.'); }
    finally { setSaving(false); }
  };

  const handleHeroUpload = async () => {
    if (!heroFile) return;
    setUploading(true);
    try {
      const up  = await uploadAPI.uploadHero(heroFile);
      const r   = await contentAPI.addHeroImage({ url: up.data.url, publicId: up.data.publicId, alt: 'Hero' });
      setContent(r.data.content);
      setHeroFile(null);
      toast.success('Hero image added.');
    } catch { toast.error('Upload failed.'); }
    finally { setUploading(false); }
  };

  const handleRemoveHero = async (id) => {
    if (!confirm('Remove this hero image?')) return;
    try {
      const r = await contentAPI.removeHeroImage(id);
      setContent(r.data.content);
      toast.success('Image removed.');
    } catch { toast.error('Remove failed.'); }
  };

  // ── Reviews ───────────────────────────────────────────────────
  const handleAddReview = async () => {
    if (!reviewForm.name.trim() || !reviewForm.text.trim()) {
      toast.error('Name and review text are required.'); return;
    }
    setAddingReview(true);
    try {
      const r = await contentAPI.addReview(reviewForm);
      setContent(r.data.content);
      setReviewForm({ name: '', rating: 5, text: '', date: '' });
      toast.success('Review added.');
    } catch { toast.error('Failed to add review.'); }
    finally { setAddingReview(false); }
  };

  const handleRemoveReview = async (id) => {
    if (!confirm('Delete this review?')) return;
    try {
      const r = await contentAPI.removeReview(id);
      setContent(r.data.content);
      toast.success('Review deleted.');
    } catch { toast.error('Delete failed.'); }
  };

  // ── Privacy ───────────────────────────────────────────────────
  const handleSavePrivacy = async () => {
    setSaving(true);
    try {
      const r = await contentAPI.update({ privacyPolicy: privacy });
      setContent(r.data.content);
      toast.success('Privacy policy saved.');
    } catch { toast.error('Save failed.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" className="text-ink-brown" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-widest uppercase text-ink-brown mb-1">Site Management</p>
        <h1 className="font-display text-2xl font-bold text-white">Content</h1>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', width: 'fit-content' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150"
            style={tab === i
              ? { background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', color: '#fff' }
              : { color: 'rgba(255,255,255,0.45)' }
            }>
            {t}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Hero tab ── */}
        {tab === 0 && (
          <motion.div key="hero" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Hero text */}
            <div className="glass-card p-6 space-y-4">
              <h2 className="font-display text-base font-semibold text-white">Hero Text</h2>
              <Field label="Headline">
                <input className="glass-input" value={headline} onChange={e => setHeadline(e.target.value)} placeholder="Your Design. Our Precision." />
              </Field>
              <Field label="Sub-headline">
                <input className="glass-input" value={sub} onChange={e => setSub(e.target.value)} placeholder="Premium custom T-shirts..." />
              </Field>
              <button onClick={handleSaveHeroText} disabled={saving} className="btn-primary w-auto px-8">
                {saving ? 'Saving…' : 'Save Text'}
              </button>
            </div>

            {/* Hero images */}
            <div className="glass-card p-6 space-y-4">
              <h2 className="font-display text-base font-semibold text-white">Hero Images</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {content?.heroImages?.map(img => (
                  <div key={img._id} className="relative rounded-xl overflow-hidden" style={{ paddingBottom: '56%' }}>
                    <img src={img.url} alt={img.alt} className="absolute inset-0 w-full h-full object-cover" />
                    <button onClick={() => handleRemoveHero(img._id)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/80 flex items-center justify-center text-white text-xs hover:bg-red-500 transition-colors">
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <label className="flex-1">
                  <input type="file" accept="image/*" className="hidden" onChange={e => setHeroFile(e.target.files?.[0] || null)} />
                  <div className="glass-input cursor-pointer text-white/40 text-sm truncate">
                    {heroFile ? heroFile.name : 'Click to select image…'}
                  </div>
                </label>
                <button onClick={handleHeroUpload} disabled={!heroFile || uploading} className="btn-primary w-auto px-6 disabled:opacity-50">
                  {uploading ? 'Uploading…' : 'Upload'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Reviews tab ── */}
        {tab === 1 && (
          <motion.div key="reviews" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="glass-card p-6 space-y-4">
              <h2 className="font-display text-base font-semibold text-white">Add Review</h2>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Customer Name">
                  <input className="glass-input" value={reviewForm.name} onChange={e => setReviewForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Doe" />
                </Field>
                <Field label="Rating (1–5)">
                  <input type="number" min="1" max="5" className="glass-input" value={reviewForm.rating} onChange={e => setReviewForm(f => ({ ...f, rating: +e.target.value }))} />
                </Field>
                <div className="col-span-2">
                  <Field label="Review Text">
                    <textarea rows={3} className="glass-input resize-none" value={reviewForm.text} onChange={e => setReviewForm(f => ({ ...f, text: e.target.value }))} placeholder="Amazing quality..." />
                  </Field>
                </div>
                <Field label="Date (optional)">
                  <input className="glass-input" value={reviewForm.date} onChange={e => setReviewForm(f => ({ ...f, date: e.target.value }))} placeholder="March 2024" />
                </Field>
              </div>
              <button onClick={handleAddReview} disabled={addingReview} className="btn-primary w-auto px-8">
                {addingReview ? 'Adding…' : 'Add Review'}
              </button>
            </div>

            {/* Existing reviews */}
            <div className="glass-card overflow-hidden">
              <div className="p-5 border-b border-white/[0.08]">
                <h2 className="font-display text-base font-semibold text-white">Reviews ({content?.reviews?.length || 0})</h2>
              </div>
              {content?.reviews?.length ? (
                <div className="divide-y divide-white/5">
                  {content.reviews.map(r => (
                    <div key={r._id} className="flex items-start gap-4 px-5 py-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white text-sm font-medium">{r.name}</span>
                          <span className="text-yellow-400 text-xs">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                          {r.date && <span className="text-white/30 text-xs">{r.date}</span>}
                        </div>
                        <p className="text-white/50 text-sm">{r.text}</p>
                      </div>
                      <button onClick={() => handleRemoveReview(r._id)}
                        className="text-red-400/50 hover:text-red-400 transition-colors text-xs flex-shrink-0">Delete</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-white/30 py-10 text-sm">No reviews yet.</p>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Privacy tab ── */}
        {tab === 2 && (
          <motion.div key="privacy" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="glass-card p-6 space-y-4">
              <h2 className="font-display text-base font-semibold text-white">Privacy Policy</h2>
              <p className="text-white/35 text-xs">Write in plain text or Markdown. This will be shown on the /privacy page.</p>
              <textarea rows={20} className="glass-input resize-y font-mono text-sm" value={privacy}
                onChange={e => setPrivacy(e.target.value)}
                placeholder="## Privacy Policy&#10;&#10;Last updated: ...&#10;&#10;Your privacy matters..." />
              <button onClick={handleSavePrivacy} disabled={saving} className="btn-primary w-auto px-8">
                {saving ? 'Saving…' : 'Save Privacy Policy'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
