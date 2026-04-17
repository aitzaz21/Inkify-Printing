import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { reviewAPI } from '../services/review.service';
import { Spinner } from '../../../shared/components/Spinner';

const STARS = [1,2,3,4,5];

const ReviewCard = ({ review, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: (index % 6) * 0.06, duration: 0.4 }}
    className="glass-card p-6 flex flex-col gap-4 hover:border-ink-brown/35 transition-all duration-300"
  >
    <div className="flex gap-0.5">
      {STARS.map(s => (
        <svg key={s} className={`w-4 h-4 ${s <= review.rating ? 'text-ink-brown' : 'text-white/10'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
    <p className="text-white/55 text-sm leading-relaxed flex-1">&ldquo;{review.comment}&rdquo;</p>
    <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
      <div className="flex items-center gap-3">
        {review.user?.avatar
          ? <img src={review.user.avatar} alt="" className="w-8 h-8 rounded-lg object-cover" />
          : <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
              {review.user?.firstName?.[0]}{review.user?.lastName?.[0]}
            </div>
        }
        <div>
          <p className="text-white text-sm font-medium">{review.user?.firstName} {review.user?.lastName}</p>
          <p className="text-white/30 text-xs">
            {review.order?.orderNumber && `Order ${review.order.orderNumber} · `}
            {new Date(review.createdAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>
      {review.isFeatured && (
        <span className="text-xs px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(107,66,38,0.15)', color: '#C48A5C', border: '1px solid rgba(107,66,38,0.2)' }}>
          Featured
        </span>
      )}
    </div>
  </motion.div>
);

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [total,   setTotal]   = useState(0);

  useEffect(() => {
    setLoading(true);
    reviewAPI.getAll({ page, limit: 12 })
      .then(r => {
        setReviews(r.data.reviews || []);
        setPages(r.data.pages || 1);
        setTotal(r.data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="min-h-screen">
      <div className="relative pt-28 pb-14 px-4 sm:px-6 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(107,66,38,0.18) 0%, transparent 70%)' }} />
        <motion.div initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.55 }}
          className="relative z-10 max-w-2xl mx-auto">
          <p className="text-xs font-medium tracking-widest uppercase text-ink-brown mb-3">Testimonials</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
            Customer <span className="italic text-gradient">Reviews</span>
          </h1>
          <p className="text-white/40 text-sm sm:text-base leading-relaxed">
            Real feedback from real customers who trust Inkify Printing.
          </p>
          {total > 0 && (
            <p className="text-white/25 text-xs mt-3">{total} review{total !== 1 ? 's' : ''}</p>
          )}
        </motion.div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" className="text-ink-brown" /></div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-24 glass-card">
            <p className="text-4xl mb-3">⭐</p>
            <p className="text-white/40 text-lg font-medium">No reviews yet</p>
            <p className="text-white/25 text-sm mt-1">Reviews will appear here once customers leave feedback.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((r, i) => <ReviewCard key={r._id} review={r} index={i} />)}
            </div>
            {pages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className="w-9 h-9 rounded-xl text-sm font-medium transition-all"
                    style={p === page
                      ? { background:'linear-gradient(135deg,#6B4226,#8B5A3C)', color:'#fff' }
                      : { background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.45)', border:'1px solid rgba(255,255,255,0.1)' }
                    }>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
