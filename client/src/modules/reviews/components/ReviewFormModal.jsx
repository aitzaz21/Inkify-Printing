import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { reviewAPI } from '../services/review.service';

// ── Rating metadata ───────────────────────────────────────────────
const RATINGS = [
  { value: 1, emoji: '😞', label: 'Poor',      color: '#ef4444', desc: 'Very disappointed with the experience' },
  { value: 2, emoji: '😕', label: 'Fair',      color: '#f97316', desc: 'Below my expectations'               },
  { value: 3, emoji: '😐', label: 'Good',      color: '#eab308', desc: 'Decent, met my basic expectations'   },
  { value: 4, emoji: '🙂', label: 'Very Good', color: '#22c55e', desc: 'Really happy with this order!'       },
  { value: 5, emoji: '😍', label: 'Excellent', color: '#C9967A', desc: 'Absolutely love it — 10/10 would order again' },
];

const PLACEHOLDERS = [
  'The print quality was amazing and the shirt fit perfectly…',
  'Delivery was super fast and the design came out exactly as expected…',
  'Really impressed with the fabric quality and vibrant colors…',
  'The customization process was easy and the result exceeded my expectations…',
];

// Star SVG
const StarSVG = ({ size = 40, filled, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={filled ? color : 'rgba(255,255,255,0.2)'} strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>
);

export default function ReviewFormModal({ order, existing, onClose, onSaved }) {
  const [rating,    setRating]    = useState(existing?.rating  || 0);
  const [hover,     setHover]     = useState(0);
  const [comment,   setComment]   = useState(existing?.comment || '');
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const [poppedStar, setPoppedStar] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const textareaRef = useRef(null);

  const placeholder = PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)];
  const displayRating = hover || rating;
  const activeMeta = displayRating ? RATINGS[displayRating - 1] : null;

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Auto-focus textarea when rating selected
  useEffect(() => {
    if (rating > 0 && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [rating]);

  const handleStarClick = (star) => {
    setRating(star);
    setPoppedStar(star);
    setTimeout(() => setPoppedStar(null), 350);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating)         return toast.error('Please select a star rating first.');
    if (!comment.trim()) return toast.error('Please share a few words about your experience.');
    if (comment.trim().length < 10) return toast.error('Please write at least 10 characters.');

    setSaving(true);
    try {
      let res;
      if (existing) {
        res = await reviewAPI.update(existing._id, { rating, comment });
      } else {
        res = await reviewAPI.create({ orderId: order._id, rating, comment });
      }
      setSubmitted(true);
      setTimeout(() => {
        onSaved(res.data.review);
        onClose();
      }, 1800);
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
      toast.error(err.response?.data?.message || 'Failed to delete review.');
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
        style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.97 }}
          transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, #16100C 0%, #0e0b08 100%)',
            border: '1px solid rgba(107,66,38,0.28)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
          }}
        >
          {/* ── Success overlay ────────────────────────────── */}
          <AnimatePresence>
            {submitted && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-3xl"
                style={{ background: 'rgba(11,7,4,0.96)' }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                  style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', boxShadow: '0 0 40px rgba(107,66,38,0.5)' }}
                >
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" strokeDasharray="60" strokeDashoffset="0" style={{ animation: 'checkDraw 0.4s 0.3s ease-out both' }} />
                  </svg>
                </motion.div>
                <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="font-display text-xl font-bold text-white mb-1">
                  {existing ? 'Review updated!' : 'Thank you!'}
                </motion.p>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                  className="text-white/45 text-sm">
                  {existing ? 'Your review has been updated.' : 'Your review helps other customers.'}
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Header ─────────────────────────────────────── */}
          <div className="px-6 pt-6 pb-5 flex items-start justify-between"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <p className="text-[#C9967A] text-xs font-semibold tracking-widest uppercase mb-1">
                {existing ? 'Edit Review' : 'Write a Review'}
              </p>
              <h2 className="font-display text-xl font-bold text-white">
                {order.orderNumber}
              </h2>
              <p className="text-white/40 text-xs mt-0.5">Share your honest experience</p>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/10 text-white/35 hover:text-white flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">

            {/* ── Star Rating ────────────────────────────────── */}
            <div>
              <p className="text-white/60 text-sm font-medium mb-4">How would you rate your experience?</p>

              {/* Stars */}
              <div className="flex items-center gap-2 mb-3">
                {RATINGS.map(({ value, color }) => (
                  <motion.button
                    key={value}
                    type="button"
                    onClick={() => handleStarClick(value)}
                    onMouseEnter={() => setHover(value)}
                    onMouseLeave={() => setHover(0)}
                    animate={poppedStar === value ? { scale: [1, 1.4, 0.9, 1.08, 1] } : {}}
                    transition={{ duration: 0.35 }}
                    className="focus:outline-none transition-transform duration-150"
                    style={{ filter: value <= displayRating ? `drop-shadow(0 0 8px ${color}66)` : 'none' }}
                  >
                    <StarSVG
                      size={38}
                      filled={value <= displayRating}
                      color={value <= displayRating ? RATINGS[displayRating - 1]?.color : 'rgba(255,255,255,0.2)'}
                    />
                  </motion.button>
                ))}
              </div>

              {/* Mood indicator */}
              <AnimatePresence mode="wait">
                {activeMeta ? (
                  <motion.div
                    key={activeMeta.value}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.18 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{
                      background: `${activeMeta.color}12`,
                      border: `1px solid ${activeMeta.color}28`,
                    }}
                  >
                    <span className="text-2xl flex-shrink-0">{activeMeta.emoji}</span>
                    <div>
                      <p className="text-sm font-bold" style={{ color: activeMeta.color }}>
                        {activeMeta.label}
                      </p>
                      <p className="text-white/45 text-xs">{activeMeta.desc}</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-4 py-3 rounded-xl flex items-center gap-2"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <span className="text-white/20 text-sm">← Tap a star to rate your experience</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Comment ────────────────────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/60 text-sm font-medium">Tell us more</p>
                <span className={`text-xs font-medium transition-colors ${
                  comment.length > 450 ? 'text-red-400' : comment.length > 200 ? 'text-[#C9967A]' : 'text-white/25'
                }`}>
                  {comment.length} / 500
                </span>
              </div>
              <textarea
                ref={textareaRef}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={placeholder}
                rows={4}
                maxLength={500}
                className="w-full rounded-xl px-4 py-3.5 text-sm resize-none focus:outline-none transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: 'rgba(255,255,255,0.88)',
                  lineHeight: '1.6',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(107,66,38,0.6)';
                  e.target.style.background  = 'rgba(255,255,255,0.06)';
                  e.target.style.boxShadow   = '0 0 0 3px rgba(107,66,38,0.14)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.10)';
                  e.target.style.background  = 'rgba(255,255,255,0.04)';
                  e.target.style.boxShadow   = 'none';
                }}
              />
              {comment.length > 0 && comment.length < 10 && (
                <p className="text-amber-400/70 text-xs mt-1.5">Write at least 10 characters to submit</p>
              )}
            </div>

            {/* ── Actions ────────────────────────────────────── */}
            <div className="space-y-2.5 pt-1">
              <motion.button
                type="submit"
                disabled={saving || deleting || !rating || !comment.trim() || comment.length < 10}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-40"
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
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                    {existing ? 'Update Review' : 'Submit Review'}
                  </>
                )}
              </motion.button>

              <div className="flex gap-2">
                {existing && (
                  <button type="button" onClick={handleDelete} disabled={saving || deleting}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                    style={{ background: 'rgba(239,68,68,0.09)', color: '#f87171', border: '1px solid rgba(239,68,68,0.22)' }}>
                    {deleting ? 'Deleting…' : '🗑 Delete Review'}
                  </button>
                )}
                <button type="button" onClick={onClose} disabled={saving || deleting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.09)' }}>
                  Cancel
                </button>
              </div>
            </div>

            <p className="text-white/20 text-xs text-center">
              Reviews are public and may be featured on the homepage
            </p>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
