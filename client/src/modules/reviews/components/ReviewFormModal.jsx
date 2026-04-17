import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { reviewAPI } from '../services/review.service';

const StarIcon = ({ filled }) => (
  <svg className={`w-6 h-6 transition-colors ${filled ? 'text-amber-400' : 'text-white/20'}`} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const LABEL = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

/**
 * ReviewFormModal
 * Props:
 *   order      – { _id, orderNumber }
 *   existing   – existing review object (for edit), or null
 *   onClose()  – called when modal should close
 *   onSaved(review) – called after successful create/update
 */
export default function ReviewFormModal({ order, existing, onClose, onSaved }) {
  const [rating,   setRating]   = useState(existing?.rating  || 0);
  const [hover,    setHover]    = useState(0);
  const [comment,  setComment]  = useState(existing?.comment || '');
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating)          return toast.error('Please select a star rating.');
    if (!comment.trim())  return toast.error('Please write a comment.');
    setSaving(true);
    try {
      let res;
      if (existing) {
        res = await reviewAPI.update(existing._id, { rating, comment });
        toast.success('Review updated!');
      } else {
        res = await reviewAPI.create({ orderId: order._id, rating, comment });
        toast.success('Review submitted! Thank you.');
      }
      onSaved(res.data.review);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete your review? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await reviewAPI.userDelete(existing._id);
      toast.success('Review deleted.');
      onSaved(null); // null signals deletion
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete review.');
    } finally {
      setDeleting(false);
    }
  };

  const displayRating = hover || rating;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      >
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-2xl p-6 sm:p-7"
          style={{
            background: 'linear-gradient(145deg, rgba(20,16,12,0.98) 0%, rgba(14,11,8,0.98) 100%)',
            border: '1px solid rgba(107,66,38,0.25)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-xs tracking-widest uppercase text-white/30 mb-0.5">
                {existing ? 'Edit Review' : 'Write a Review'}
              </p>
              <h2 className="font-display text-lg font-semibold text-white">
                Order #{order.orderNumber}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10 text-white/40 hover:text-white/70 flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Star Rating */}
            <div>
              <label className="block text-xs tracking-widest uppercase text-white/30 mb-3">
                Your Rating
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    className="transition-transform hover:scale-110 focus:outline-none"
                  >
                    <StarIcon filled={star <= displayRating} />
                  </button>
                ))}
                {displayRating > 0 && (
                  <span className="ml-2 text-sm font-medium" style={{ color: '#C48A5C' }}>
                    {LABEL[displayRating]}
                  </span>
                )}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-xs tracking-widest uppercase text-white/30 mb-2">
                Your Review
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us about your experience with this order…"
                rows={4}
                maxLength={500}
                className="w-full rounded-xl px-4 py-3 text-sm resize-none focus:outline-none transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.8)',
                  focusBorderColor: 'rgba(107,66,38,0.5)',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'rgba(107,66,38,0.5)'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
                onBlur={(e)  => { e.target.style.borderColor = 'rgba(255,255,255,0.1)';  e.target.style.background = 'rgba(255,255,255,0.04)'; }}
              />
              <p className="text-right text-xs text-white/20 mt-1">{comment.length}/500</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={saving || deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition-opacity"
                style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', color: '#fff' }}
              >
                {saving ? 'Saving…' : existing ? 'Update Review' : 'Submit Review'}
              </button>

              {existing && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving || deleting}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60 transition-colors"
                  style={{ background: 'rgba(239,68,68,0.1)', color: 'rgba(239,68,68,0.75)', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  {deleting ? '…' : 'Delete'}
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                disabled={saving || deleting}
                className="px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
