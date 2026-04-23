import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { reviewAPI } from '../services/review.service';
import { useAuth } from '../../../shared/hooks/useAuthContext';
import { Spinner } from '../../../shared/components/Spinner';

// ── Star helpers ──────────────────────────────────────────────────
const StarFilled = ({ size = 16, color = '#fbbf24' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>
);

const StarEmpty = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>
);

function StarRow({ rating, size = 16 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        s <= rating
          ? <StarFilled key={s} size={size} />
          : <StarEmpty  key={s} size={size} />
      ))}
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────────
function Avatar({ user, size = 36 }) {
  if (user?.avatar) {
    return <img src={user.avatar} alt="" style={{ width: size, height: size }} className="rounded-xl object-cover flex-shrink-0" />;
  }
  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`;
  return (
    <div style={{ width: size, height: size, background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', borderRadius: 10 }}
      className="flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
      {initials || '?'}
    </div>
  );
}

// ── Rating distribution bar ───────────────────────────────────────
function DistBar({ star, count, total, delay = 0 }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 group">
      <div className="flex items-center gap-1 w-8 flex-shrink-0">
        <span className="text-white/55 text-xs font-semibold">{star}</span>
        <StarFilled size={11} />
      </div>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg,#6B4226,#C9967A)' }}
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay, ease: 'easeOut' }}
        />
      </div>
      <span className="text-white/35 text-xs w-8 text-right flex-shrink-0">{pct}%</span>
    </div>
  );
}

// ── Review card ───────────────────────────────────────────────────
function ReviewCard({ review, index, featured }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.comment?.length > 200;

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: (index % 6) * 0.07, duration: 0.45 }}
      className="rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1"
      style={{
        background: featured ? 'rgba(107,66,38,0.10)' : 'rgba(18,14,10,0.80)',
        border: featured ? '1px solid rgba(201,150,122,0.35)' : '1px solid rgba(107,66,38,0.22)',
        boxShadow: featured
          ? '0 8px 32px rgba(107,66,38,0.18), inset 0 1px 0 rgba(255,255,255,0.06)'
          : '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Stars + featured badge */}
      <div className="flex items-start justify-between gap-2">
        <StarRow rating={review.rating} size={15} />
        {featured && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: 'rgba(201,150,122,0.18)', color: '#C9967A', border: '1px solid rgba(201,150,122,0.3)' }}>
            ✦ Featured
          </span>
        )}
      </div>

      {/* Quote */}
      <div className="flex-1">
        <p className="text-white/82 text-sm leading-relaxed"
          style={{ fontStyle: 'normal' }}>
          <span className="text-[#8B5A3C] font-display text-lg leading-none mr-1">"</span>
          {isLong && !expanded
            ? review.comment.slice(0, 200) + '…'
            : review.comment}
          <span className="text-[#8B5A3C] font-display text-lg leading-none ml-0.5">"</span>
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-[#C9967A] text-xs mt-2 hover:text-white transition-colors font-medium"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Author */}
      <div className="pt-3 flex items-center justify-between gap-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2.5">
          <Avatar user={review.user} size={34} />
          <div>
            <p className="text-white text-sm font-semibold leading-tight">
              {review.user?.firstName} {review.user?.lastName}
            </p>
            <p className="text-white/35 text-xs mt-0.5">
              {review.order?.orderNumber ? `${review.order.orderNumber} · ` : ''}
              {new Date(review.createdAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
        {/* Verified badge */}
        {review.order?.orderNumber && (
          <div className="flex items-center gap-1 flex-shrink-0"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.18)', borderRadius: 999, padding: '3px 8px' }}>
            <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span className="text-emerald-400 text-[10px] font-semibold">Verified</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export default function ReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [total,   setTotal]   = useState(0);
  const [filter,  setFilter]  = useState(0); // 0 = all, 1-5 = star filter

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: 12 };
    if (filter > 0) params.rating = filter;
    reviewAPI.getAll(params)
      .then(r => {
        setReviews(r.data.reviews || []);
        setPages(r.data.pages  || 1);
        setTotal(r.data.total  || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, filter]);

  useEffect(() => {
    reviewAPI.getStats()
      .then(r => setStats(r.data))
      .catch(() => {});
  }, []);

  const avgRating  = stats?.avgRating  || 0;
  const dist       = stats?.distribution || {};
  const totalCount = stats?.total || total;

  const handleFilterChange = (star) => {
    setFilter(star);
    setPage(1);
  };

  return (
    <div className="min-h-screen">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-16 px-4 sm:px-6 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -5%, rgba(107,66,38,0.22) 0%, transparent 70%)' }} className="absolute inset-0" />
          <div className="absolute inset-0 opacity-[0.018]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.3) 1px,transparent 1px)', backgroundSize: '64px 64px' }} />
        </div>

        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.55 }}
          className="relative z-10 max-w-4xl mx-auto text-center">

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-5"
            style={{ background: 'rgba(107,66,38,0.12)', border: '1px solid rgba(107,66,38,0.28)', color: '#C9967A' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9967A]" />
            Verified Customer Reviews
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
            Real People, <span className="italic text-gradient">Real Results</span>
          </h1>
          <p className="text-white/55 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Every review is from a verified customer who actually ordered from us.
          </p>

          {/* Aggregate rating display */}
          {avgRating > 0 && (
            <motion.div initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }} transition={{ delay:0.2 }}
              className="inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mt-8 px-6 py-4 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', maxWidth: '100%' }}>
              <div className="text-center sm:text-left">
                <p className="font-display text-5xl font-bold text-white leading-none">{avgRating.toFixed(1)}</p>
                <div className="flex items-center justify-center sm:justify-start gap-1 mt-1.5">
                  {[1,2,3,4,5].map(s => (
                    <StarFilled key={s} size={18}
                      color={s <= Math.round(avgRating) ? '#fbbf24' : 'rgba(251,191,36,0.2)'} />
                  ))}
                </div>
              </div>
              <div className="hidden sm:block w-px h-10 bg-white/10 flex-shrink-0" />
              <div className="text-center sm:text-left">
                <p className="text-white font-bold text-lg">{totalCount.toLocaleString()} Reviews</p>
                <p className="text-white/40 text-sm">from verified customers</p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">

        {/* ── Stats + Filter sidebar layout ──────────────────── */}
        {stats && (
          <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
            className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 mb-10">

            {/* Rating breakdown */}
            <div className="rounded-2xl p-5 space-y-4"
              style={{ background: 'rgba(18,14,10,0.80)', border: '1px solid rgba(107,66,38,0.22)' }}>
              <p className="text-white font-semibold text-sm">Rating Breakdown</p>
              <div className="space-y-2.5">
                {[5,4,3,2,1].map((star, i) => (
                  <DistBar key={star} star={star} count={dist[star] || 0} total={totalCount} delay={i * 0.08} />
                ))}
              </div>

              {/* Filter by star */}
              <div className="pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-white/40 text-xs mb-2">Filter by rating</p>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => handleFilterChange(0)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={filter === 0
                      ? { background:'linear-gradient(135deg,#6B4226,#8B5A3C)', color:'#fff' }
                      : { background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.5)', border:'1px solid rgba(255,255,255,0.1)' }
                    }>
                    All
                  </button>
                  {[5,4,3,2,1].map(s => (
                    <button key={s} onClick={() => handleFilterChange(s)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                      style={filter === s
                        ? { background:'rgba(251,191,36,0.2)', color:'#fbbf24', border:'1px solid rgba(251,191,36,0.35)' }
                        : { background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.45)', border:'1px solid rgba(255,255,255,0.08)' }
                      }>
                      {s} <StarFilled size={10} color={filter === s ? '#fbbf24' : 'rgba(255,255,255,0.4)'} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: 'Average Rating', value: `${avgRating.toFixed(1)} / 5`, icon: '⭐' },
                { label: 'Total Reviews',  value: totalCount.toLocaleString(),    icon: '💬' },
                { label: '5-Star Reviews', value: `${dist[5] || 0}`,              icon: '🏆' },
                { label: 'Verified Buyers',value: `${totalCount}`,               icon: '✅' },
                { label: 'Satisfaction',   value: totalCount > 0
                    ? `${Math.round(((dist[4] || 0) + (dist[5] || 0)) / totalCount * 100)}%`
                    : '—',                                                         icon: '💯' },
                { label: 'Response Rate',  value: '100%',                          icon: '🎯' },
              ].map((s, i) => (
                <motion.div key={i}
                  initial={{ opacity:0, y:12 }} whileInView={{ opacity:1, y:0 }}
                  viewport={{ once:true }} transition={{ delay:i*0.06 }}
                  className="rounded-2xl p-4 flex flex-col gap-1"
                  style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
                  <span className="text-base">{s.icon}</span>
                  <p className="font-display text-xl font-bold text-white truncate leading-tight">{s.value}</p>
                  <p className="text-white/40 text-xs leading-tight">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Reviews grid ──────────────────────────────────── */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-white/50 text-sm">
            {filter > 0
              ? <><span className="text-white font-semibold">{filter}-star</span> reviews</>
              : <><span className="text-white font-semibold">{total}</span> review{total !== 1 ? 's' : ''}</>
            }
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" className="text-ink-brown" /></div>
        ) : reviews.length === 0 ? (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
            className="text-center py-20 rounded-2xl"
            style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-5xl mb-4">✨</p>
            <p className="text-white text-lg font-semibold mb-1">
              {filter > 0 ? `No ${filter}-star reviews yet` : 'No reviews yet'}
            </p>
            <p className="text-white/35 text-sm">
              {filter > 0 ? 'Try a different star rating filter' : 'Be the first to share your experience!'}
            </p>
            {filter > 0 && (
              <button onClick={() => handleFilterChange(0)}
                className="mt-4 text-[#C9967A] text-sm hover:text-white transition-colors">
                View all reviews →
              </button>
            )}
          </motion.div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {reviews.map((r, i) => (
              <div key={r._id} className="break-inside-avoid">
                <ReviewCard review={r} index={i} featured={r.isFeatured} />
              </div>
            ))}
          </div>
        )}

        {/* ── Pagination ────────────────────────────────────── */}
        {pages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
              style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.6)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>

            {Array.from({ length: pages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === pages || Math.abs(p - page) <= 1)
              .reduce((acc, p, i, arr) => {
                if (i > 0 && arr[i - 1] !== p - 1) acc.push('…');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === '…' ? (
                  <span key={`dots-${i}`} className="text-white/25 text-sm px-1">…</span>
                ) : (
                  <button key={p} onClick={() => setPage(p)}
                    className="w-9 h-9 rounded-xl text-sm font-semibold transition-all"
                    style={p === page
                      ? { background:'linear-gradient(135deg,#6B4226,#8B5A3C)', color:'#fff', boxShadow:'0 2px 12px rgba(107,66,38,0.4)' }
                      : { background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.5)', border:'1px solid rgba(255,255,255,0.1)' }
                    }>
                    {p}
                  </button>
                )
              )
            }

            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
              style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.6)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        )}

        {/* ── CTA section ───────────────────────────────────── */}
        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          className="mt-16 rounded-3xl p-8 text-center relative overflow-hidden"
          style={{ background:'linear-gradient(135deg,rgba(107,66,38,0.2),rgba(107,66,38,0.08))', border:'1px solid rgba(107,66,38,0.3)' }}>
          <div className="absolute inset-0 opacity-30 pointer-events-none"
            style={{ background:'radial-gradient(ellipse at 50% 0%, rgba(201,150,122,0.3), transparent 60%)' }} />
          <div className="relative z-10">
            <p className="text-3xl mb-3">⭐</p>
            <h3 className="font-display text-2xl font-bold text-white mb-2">
              Had a great experience?
            </h3>
            <p className="text-white/55 text-sm mb-6 max-w-sm mx-auto">
              Your review helps other customers and motivates our team to keep delivering quality.
            </p>
            {user ? (
              <Link to="/orders"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
                style={{ background:'linear-gradient(135deg,#6B4226,#8B5A3C)', color:'#fff', boxShadow:'0 4px 20px rgba(107,66,38,0.45)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
                Leave a Review from My Orders
              </Link>
            ) : (
              <Link to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
                style={{ background:'linear-gradient(135deg,#6B4226,#8B5A3C)', color:'#fff', boxShadow:'0 4px 20px rgba(107,66,38,0.4)' }}>
                Sign in to leave a review
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
