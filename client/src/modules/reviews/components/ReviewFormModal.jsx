import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { reviewAPI } from '../services/review.service';

// ── Rating config ─────────────────────────────────────────────────
const RATINGS = [
  { value: 1, emoji: '😞', label: 'Poor',      color: '#ef4444', desc: 'Very disappointed' },
  { value: 2, emoji: '😕', label: 'Fair',      color: '#f97316', desc: 'Below expectations' },
  { value: 3, emoji: '😐', label: 'Good',      color: '#eab308', desc: 'Met basic expectations' },
  { value: 4, emoji: '🙂', label: 'Very Good', color: '#22c55e', desc: 'Really happy with this!' },
  { value: 5, emoji: '😍', label: 'Excellent', color: '#C9967A', desc: 'Absolutely loved it!' },
];

// ── One-tap quick suggestions (appear after rating) ───────────────
const SUGGESTIONS = [
  { icon: '👕', text: 'Great print quality'   },
  { icon: '🚀', text: 'Fast delivery'          },
  { icon: '✅', text: 'Exactly as expected'    },
  { icon: '🎨', text: 'Love the design'        },
  { icon: '❤️', text: 'Will order again'       },
  { icon: '👌', text: 'Perfect fit and finish' },
];

const StarSVG = ({ size = 44, filled, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill={filled ? color : 'none'}
    stroke={filled ? color : 'rgba(255,255,255,0.18)'}
    strokeWidth={filled ? 0 : 1.5}>
    <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>
);

export default function ReviewFormModal({ order, existing, onClose, onSaved }) {
  const [rating,     setRating]     = useState(existing?.rating  || 0);
  const [hover,      setHover]      = useState(0);
  const [comment,    setComment]    = useState(existing?.comment || '');
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [poppedStar, setPoppedStar] = useState(null);
  const [submitted,  setSubmitted]  = useState(false);
  const textareaRef = useRef(null);

  const displayRating = hover || rating;
  const activeMeta    = displayRating ? RATINGS[displayRating - 1] : null;

  // Close on Escape
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);

  const handleStarClick = (star) => {
    setRating(star);
    setPoppedStar(star);
    setTimeout(() => setPoppedStar(null), 320);
  };

  // Tap a suggestion chip → append to textarea
  const handleSuggestion = (text) => {
    const next = comment.trim() ? `${comment.trim()}, ${text.toLowerCase()}` : text;
    setComment(next);
    textareaRef.current?.focus();
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!rating) return toast.error('Please tap a star to rate your order.');

    // Comment is optional — auto-fill with the rating label if blank
    const finalComment = comment.trim() || `${activeMeta?.emoji} ${activeMeta?.label}`;

    setSaving(true);
    try {
      let res;
      if (existing) {
        res = await reviewAPI.update(existing._id, { rating, comment: finalComment });
      } else {
        res = await reviewAPI.create({ orderId: order._id, rating, comment: finalComment });
      }
      setSubmitted(true);
      setTimeout(() => {
        onSaved(res.data.review);
        onClose();
      }, 1600);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete your review? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await reviewAPI.userDelete(existing._id);
      toast.success('Review deleted.');
      onSaved(null);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete.');
      setDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(160deg,#16100C 0%,#0e0b08 100%)',
            border: '1px solid rgba(107,66,38,0.30)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.65)',
          }}
        >
          {/* ── Success overlay ──────────────────────────────── */}
          <AnimatePresence>
            {submitted && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-3xl"
                style={{ background: 'rgba(11,7,4,0.97)' }}>
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                  style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', boxShadow: '0 0 40px rgba(107,66,38,0.55)' }}>
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </motion.div>
                <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="font-display text-2xl font-bold text-white mb-1">
                  Thank you! 🎉
                </motion.p>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                  className="text-white/45 text-sm text-center px-8">
                  Your review helps other customers choose with confidence.
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Drag handle (mobile) ─────────────────────────── */}
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-white/15" />
          </div>

          {/* ── Header ──────────────────────────────────────── */}
          <div className="px-6 pt-4 pb-5 flex items-start justify-between">
            <div>
              <p className="text-[#C9967A] text-xs font-bold tracking-widest uppercase mb-0.5">
                {existing ? 'Edit Your Review' : 'Rate Your Order'}
              </p>
              <h2 className="font-display text-xl font-bold text-white leading-tight">
                {order.orderNumber}
              </h2>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/10 text-white/30 hover:text-white flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 pb-6 space-y-5">

            {/* ── Big star selector ────────────────────────────── */}
            <div>
              <p className="text-white/55 text-sm mb-4 text-center">
                How was your experience?
              </p>

              {/* Stars row — centered, big, easy to tap */}
              <div className="flex items-center justify-center gap-3 mb-4">
                {RATINGS.map(({ value, color }) => (
                  <motion.button
                    key={value}
                    type="button"
                    onClick={() => handleStarClick(value)}
                    onMouseEnter={() => setHover(value)}
                    onMouseLeave={() => setHover(0)}
                    animate={poppedStar === value ? { scale: [1, 1.45, 0.88, 1.1, 1] } : {}}
                    transition={{ duration: 0.32 }}
                    className="focus:outline-none"
                    style={{
                      filter: value <= displayRating
                        ? `drop-shadow(0 0 10px ${color}70)`
                        : 'none',
                      transition: 'filter 0.15s',
                    }}
                  >
                    <StarSVG
                      size={44}
                      filled={value <= displayRating}
                      color={value <= displayRating
                        ? RATINGS[displayRating - 1]?.color
                        : 'rgba(255,255,255,0.18)'}
                    />
                  </motion.button>
                ))}
              </div>

              {/* Mood badge */}
              <AnimatePresence mode="wait">
                {activeMeta ? (
                  <motion.div
                    key={activeMeta.value}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                    style={{ background: `${activeMeta.color}14`, border: `1px solid ${activeMeta.color}30` }}>
                    <span className="text-2xl">{activeMeta.emoji}</span>
                    <div className="flex-1">
                      <p className="font-bold text-sm leading-tight" style={{ color: activeMeta.color }}>
                        {activeMeta.label}
                      </p>
                      <p className="text-white/40 text-xs mt-0.5">{activeMeta.desc}</p>
                    </div>
                    {/* Quick-submit hint when no comment */}
                    {!comment.trim() && (
                      <button
                        type="button"
                        onClick={() => handleSubmit()}
                        disabled={saving}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl flex-shrink-0 transition-all hover:opacity-90 active:scale-95"
                        style={{ background: activeMeta.color, color: '#fff' }}>
                        Submit →
                      </button>
                    )}
                  </motion.div>
                ) : (
                  <motion.div key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center justify-center gap-2 py-3 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <span className="text-lg">👆</span>
                    <span className="text-white/30 text-sm">Tap a star above to rate</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Quick suggestions (show after rating picked) ─── */}
            <AnimatePresence>
              {rating > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}>
                  <p className="text-white/35 text-xs mb-2 font-medium">Quick add (optional)</p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => {
                      const used = comment.toLowerCase().includes(s.text.toLowerCase());
                      return (
                        <button
                          key={s.text}
                          type="button"
                          onClick={() => !used && handleSuggestion(s.text)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                          style={used
                            ? { background: 'rgba(107,66,38,0.35)', color: '#C9967A', border: '1px solid rgba(107,66,38,0.45)', cursor: 'default' }
                            : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.10)', cursor: 'pointer' }
                          }>
                          <span>{s.icon}</span>
                          {s.text}
                          {used && <span className="text-[#C9967A]">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Optional comment textarea ────────────────────── */}
            <AnimatePresence>
              {rating > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-white/40 text-xs">Add a comment <span className="text-white/22">(optional)</span></p>
                    <span className={`text-xs transition-colors ${
                      comment.length > 450 ? 'text-red-400' : 'text-white/20'
                    }`}>{comment.length}/500</span>
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share more about your experience…"
                    rows={3}
                    maxLength={500}
                    className="w-full rounded-xl px-4 py-3 text-sm resize-none focus:outline-none transition-all duration-200"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.09)',
                      color: 'rgba(255,255,255,0.85)',
                      lineHeight: '1.6',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(107,66,38,0.6)';
                      e.target.style.background  = 'rgba(255,255,255,0.06)';
                      e.target.style.boxShadow   = '0 0 0 3px rgba(107,66,38,0.12)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255,255,255,0.09)';
                      e.target.style.background  = 'rgba(255,255,255,0.04)';
                      e.target.style.boxShadow   = 'none';
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Submit button ────────────────────────────────── */}
            <div className="space-y-2">
              <motion.button
                type="button"
                onClick={handleSubmit}
                disabled={saving || deleting || !rating}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-35"
                style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', color: '#fff', boxShadow: '0 4px 20px rgba(107,66,38,0.4)' }}
              >
                {saving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Submitting…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>
                    </svg>
                    {existing ? 'Update Review' : rating ? 'Submit Review' : 'Pick a rating first'}
                  </>
                )}
              </motion.button>

              <div className="flex gap-2">
                {existing && (
                  <button type="button" onClick={handleDelete} disabled={saving || deleting}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
                    style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.20)' }}>
                    {deleting ? 'Deleting…' : 'Delete Review'}
                  </button>
                )}
                <button type="button" onClick={onClose} disabled={saving || deleting}
                  className="flex-1 py-2.5 rounded-xl text-xs font-medium transition-all disabled:opacity-40"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {rating ? 'Maybe later' : 'Close'}
                </button>
              </div>
            </div>

            <p className="text-white/18 text-xs text-center">
              Reviews are public · Comment is optional
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
