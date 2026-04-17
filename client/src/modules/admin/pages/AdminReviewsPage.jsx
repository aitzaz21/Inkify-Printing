import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { reviewAPI } from '../../reviews/services/review.service';
import { Spinner } from '../../../shared/components/Spinner';

const STARS = [1,2,3,4,5];

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting,  setActing]  = useState('');

  const load = () => {
    setLoading(true);
    reviewAPI.getAdminAll({ limit: 100 })
      .then(r => setReviews(r.data.reviews || []))
      .catch(() => toast.error('Failed to load reviews.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const featuredCount = reviews.filter(r => r.isFeatured).length;

  const handleToggleFeature = async (id) => {
    setActing(id);
    try {
      const r = await reviewAPI.toggleFeature(id);
      setReviews(prev => prev.map(rv => rv._id === id ? r.data.review : rv));
      toast.success(r.data.review.isFeatured ? 'Review featured on homepage.' : 'Removed from featured.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    } finally { setActing(''); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this review permanently?')) return;
    setActing(id);
    try {
      await reviewAPI.delete(id);
      setReviews(prev => prev.filter(r => r._id !== id));
      toast.success('Review deleted.');
    } catch { toast.error('Failed.'); }
    finally { setActing(''); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <p className="text-xs tracking-widest uppercase text-ink-brown mb-1">Moderation</p>
          <h1 className="font-display text-2xl font-bold text-white">Reviews</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(107,66,38,0.15)', color: '#C48A5C', border: '1px solid rgba(107,66,38,0.2)' }}>
            {featuredCount}/3 Featured
          </span>
        </div>
      </div>

      <div className="glass-card p-4 text-xs text-white/40 flex items-center gap-2"
        style={{ background:'rgba(107,66,38,0.06)', border:'1px solid rgba(107,66,38,0.15)' }}>
        <svg className="w-4 h-4 text-ink-brown flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        Select up to 3 reviews to feature on the homepage. You cannot create reviews — only customers who received their orders can leave reviews.
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" className="text-ink-brown" /></div>
      ) : reviews.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-4xl mb-3">⭐</p>
          <p className="text-white/40 text-lg mb-1">No reviews yet</p>
          <p className="text-white/25 text-sm">Reviews will appear here when customers submit feedback on delivered orders.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r, i) => (
            <motion.div key={r._id}
              initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.03 }}
              className="glass-card p-5"
              style={{ borderColor: r.isFeatured ? 'rgba(107,66,38,0.4)' : undefined }}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {r.user?.avatar
                    ? <img src={r.user.avatar} alt="" className="w-10 h-10 rounded-xl object-cover" />
                    : <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
                        {r.user?.firstName?.[0]}{r.user?.lastName?.[0]}
                      </div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <span className="text-white font-medium text-sm">{r.user?.firstName} {r.user?.lastName}</span>
                    <span className="text-white/30 text-xs">{r.user?.email}</span>
                    {r.isFeatured && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background:'rgba(107,66,38,0.2)', color:'#C48A5C', border:'1px solid rgba(107,66,38,0.3)' }}>
                        ★ Featured
                      </span>
                    )}
                  </div>
                  <div className="flex gap-0.5 mb-2">
                    {STARS.map(s => (
                      <svg key={s} className={`w-3.5 h-3.5 ${s <= r.rating ? 'text-ink-brown' : 'text-white/10'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-white/55 text-sm leading-relaxed">&ldquo;{r.comment}&rdquo;</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-white/25">
                    <span>Order: {r.order?.orderNumber || '—'}</span>
                    <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {acting === r._id ? (
                    <Spinner size="sm" className="text-ink-brown" />
                  ) : (
                    <>
                      <button onClick={() => handleToggleFeature(r._id)}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                        style={r.isFeatured
                          ? { background:'rgba(234,179,8,0.1)', color:'#ca8a04', border:'1px solid rgba(234,179,8,0.2)' }
                          : { background:'rgba(34,197,94,0.1)', color:'#22c55e', border:'1px solid rgba(34,197,94,0.2)' }
                        }>
                        {r.isFeatured ? 'Unfeature' : '★ Feature'}
                      </button>
                      <button onClick={() => handleDelete(r._id)}
                        className="text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                        style={{ background:'rgba(239,68,68,0.08)', color:'rgba(239,68,68,0.7)', border:'1px solid rgba(239,68,68,0.15)' }}>
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
