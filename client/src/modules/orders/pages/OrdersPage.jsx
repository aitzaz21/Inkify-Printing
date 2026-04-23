import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { orderAPI } from '../services/order.service';
import { reviewAPI } from '../../reviews/services/review.service';
import { Spinner } from '../../../shared/components/Spinner';
import ReviewFormModal from '../../reviews/components/ReviewFormModal';

// ── Status config ─────────────────────────────────────────────────
const STATUS = {
  pending:    { bg:'rgba(234,179,8,0.12)',  text:'#ca8a04',  dot:'#ca8a04',  label:'Pending'    },
  confirmed:  { bg:'rgba(59,130,246,0.12)', text:'#3b82f6',  dot:'#3b82f6',  label:'Confirmed'  },
  processing: { bg:'rgba(168,85,247,0.12)', text:'#a855f7',  dot:'#a855f7',  label:'Processing' },
  dispatched: { bg:'rgba(249,115,22,0.12)', text:'#f97316',  dot:'#f97316',  label:'Dispatched' },
  delivered:  { bg:'rgba(34,197,94,0.12)',  text:'#22c55e',  dot:'#22c55e',  label:'Delivered'  },
  cancelled:  { bg:'rgba(239,68,68,0.12)',  text:'#ef4444',  dot:'#ef4444',  label:'Cancelled'  },
};

const FILTERS = ['All', 'Pending', 'Confirmed', 'Processing', 'Dispatched', 'Delivered', 'Cancelled'];

function StatusPill({ status }) {
  const s = STATUS[status] || STATUS.pending;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: s.bg, color: s.text }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
}

function StarRow({ n = 5 }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} className={`w-3.5 h-3.5 ${s <= n ? 'text-amber-400' : 'text-white/15'}`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      ))}
    </span>
  );
}

// ── Order card ────────────────────────────────────────────────────
function OrderCard({ order, review, onReview, index }) {
  const hasDesign = order.items.some(i => i.frontDesignUrl || i.designUrl || i.backDesignUrl);
  const isDelivered = order.status === 'delivered';

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.055, duration: 0.4 }}
      className="rounded-2xl overflow-hidden transition-all duration-250 hover:-translate-y-0.5"
      style={{
        background: 'rgba(18,14,10,0.82)',
        border: isDelivered && !review
          ? '1px solid rgba(107,66,38,0.35)'
          : '1px solid rgba(107,66,38,0.20)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      }}
    >
      {/* Review prompt banner for unreviewed delivered orders */}
      {isDelivered && !review && (
        <div className="flex items-center justify-between px-5 py-2.5"
          style={{ background:'linear-gradient(135deg,rgba(107,66,38,0.22),rgba(107,66,38,0.10))', borderBottom:'1px solid rgba(107,66,38,0.25)' }}>
          <div className="flex items-center gap-2">
            <span className="text-base">⭐</span>
            <p className="text-[#D4A67A] text-xs font-semibold">Your order was delivered! Share your experience.</p>
          </div>
          <button onClick={() => onReview(order, null)}
            className="text-xs font-bold px-3 py-1 rounded-lg transition-all hover:opacity-90 flex-shrink-0"
            style={{ background:'linear-gradient(135deg,#6B4226,#8B5A3C)', color:'#fff' }}>
            Write Review
          </button>
        </div>
      )}

      {/* Reviewed badge */}
      {isDelivered && review && (
        <div className="flex items-center justify-between px-5 py-2.5"
          style={{ background:'rgba(34,197,94,0.07)', borderBottom:'1px solid rgba(34,197,94,0.15)' }}>
          <div className="flex items-center gap-2">
            <StarRow n={review.rating} />
            <p className="text-emerald-400/80 text-xs font-medium">You reviewed this order</p>
          </div>
          <button onClick={() => onReview(order, review)}
            className="text-xs text-white/40 hover:text-white/70 transition-colors">
            Edit
          </button>
        </div>
      )}

      {/* Main card body */}
      <div className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            {/* Order number + status + date */}
            <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
              <span className="font-display font-bold text-white text-base tracking-tight">
                {order.orderNumber}
              </span>
              <StatusPill status={order.status} />
              {hasDesign && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background:'rgba(107,66,38,0.18)', color:'#C9967A', border:'1px solid rgba(107,66,38,0.28)' }}>
                  Custom
                </span>
              )}
              <span className="text-white/30 text-xs">
                {new Date(order.createdAt).toLocaleDateString('en-US', { day:'numeric', month:'short', year:'numeric' })}
              </span>
            </div>

            {/* Items */}
            <p className="text-white/60 text-sm leading-relaxed">
              {order.items.map(i => `${i.productName} ×${i.quantity}`).join(' · ')}
            </p>

            {/* Payment */}
            <p className="text-white/30 text-xs mt-1.5 capitalize">
              {order.paymentMethod} · {order.paymentStatus}
            </p>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-right">
              <p className="font-display text-xl font-bold text-white">
                PKR {Math.round(order.total).toLocaleString()}
              </p>
              <p className="text-white/30 text-xs mt-0.5">
                {order.items.length} item{order.items.length > 1 ? 's' : ''}
              </p>
            </div>
            <Link to={`/orders/${order._id}`}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all hover:-translate-y-0.5"
              style={{ background:'rgba(107,66,38,0.15)', color:'#C9967A', border:'1px solid rgba(107,66,38,0.28)' }}>
              View
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export default function OrdersPage() {
  const { state }   = useLocation();
  const [orders,    setOrders]    = useState([]);
  const [reviews,   setReviews]   = useState({});   // { orderId: review }
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('All');
  const [reviewCtx, setReviewCtx] = useState(null); // { order, existing }

  useEffect(() => {
    Promise.all([
      orderAPI.getMyOrders(),
      reviewAPI.getMy().catch(() => ({ data: { reviews: [] } })),
    ]).then(([ordRes, revRes]) => {
      setOrders(ordRes.data.orders || []);
      const map = {};
      (revRes.data.reviews || []).forEach(r => {
        if (r.order?._id) map[r.order._id] = r;
      });
      setReviews(map);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleReviewSaved = (orderId, rev) => {
    setReviews(prev => {
      if (!rev) { const next = { ...prev }; delete next[orderId]; return next; }
      return { ...prev, [orderId]: rev };
    });
  };

  const filteredOrders = filter === 'All'
    ? orders
    : orders.filter(o => o.status === filter.toLowerCase());

  const pendingReviews = orders.filter(o => o.status === 'delivered' && !reviews[o._id]).length;

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">

      {/* Review form modal */}
      <AnimatePresence>
        {reviewCtx && (
          <ReviewFormModal
            order={reviewCtx.order}
            existing={reviewCtx.existing}
            onClose={() => setReviewCtx(null)}
            onSaved={(rev) => {
              handleReviewSaved(reviewCtx.order._id, rev);
              setReviewCtx(null);
            }}
          />
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto">

        {/* Success banner */}
        <AnimatePresence>
          {state?.success && (
            <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              className="mb-8 p-5 rounded-2xl flex items-center gap-4"
              style={{ background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.22)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background:'rgba(34,197,94,0.15)' }}>
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold">Order placed successfully!</p>
                <p className="text-white/50 text-sm">Check your email for confirmation details.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-widest uppercase text-[#C9967A] mb-1 font-semibold">History</p>
            <h1 className="font-display text-3xl font-bold text-white">My Orders</h1>
          </div>
          {pendingReviews > 0 && (
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl"
              style={{ background:'rgba(107,66,38,0.12)', border:'1px solid rgba(107,66,38,0.28)' }}>
              <span className="text-sm">⭐</span>
              <p className="text-[#C9967A] text-xs font-semibold">
                {pendingReviews} order{pendingReviews > 1 ? 's' : ''} awaiting review
              </p>
            </div>
          )}
        </div>

        {/* Status filter tabs */}
        {orders.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-6">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={filter === f
                  ? { background:'linear-gradient(135deg,#6B4226,#8B5A3C)', color:'#fff', boxShadow:'0 2px 12px rgba(107,66,38,0.35)' }
                  : { background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.50)', border:'1px solid rgba(255,255,255,0.09)' }
                }>
                {f}
                {f !== 'All' && (
                  <span className="ml-1.5 opacity-70">
                    ({orders.filter(o => o.status === f.toLowerCase()).length})
                  </span>
                )}
                {f === 'All' && <span className="ml-1.5 opacity-70">({orders.length})</span>}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" className="text-ink-brown" /></div>
        ) : orders.length === 0 ? (
          <motion.div initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }}
            className="text-center py-20 rounded-3xl"
            style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background:'rgba(107,66,38,0.12)', border:'1px solid rgba(107,66,38,0.2)' }}>
              <svg className="w-8 h-8 text-[#8B5A3C]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
              </svg>
            </div>
            <p className="text-white text-lg font-semibold mb-1">No orders yet</p>
            <p className="text-white/40 text-sm mb-6">Start shopping and your orders will appear here.</p>
            <Link to="/designs"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
              style={{ background:'linear-gradient(135deg,#6B4226,#8B5A3C)', color:'#fff', boxShadow:'0 4px 16px rgba(107,66,38,0.4)' }}>
              Browse Products
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </motion.div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-white/40 text-sm">No {filter.toLowerCase()} orders found.</p>
            <button onClick={() => setFilter('All')} className="text-[#C9967A] text-xs mt-2 hover:text-white transition-colors">
              View all orders
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order, i) => (
              <OrderCard
                key={order._id}
                order={order}
                review={reviews[order._id]}
                onReview={(ord, existing) => setReviewCtx({ order: ord, existing })}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
