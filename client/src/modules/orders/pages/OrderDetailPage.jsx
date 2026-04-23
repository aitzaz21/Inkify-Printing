import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { orderAPI } from '../services/order.service';
import { reviewAPI } from '../../reviews/services/review.service';
import { Spinner } from '../../../shared/components/Spinner';
import ReviewFormModal from '../../reviews/components/ReviewFormModal';

// ── Status config ─────────────────────────────────────────────────
const STATUS_COLORS = {
  pending:    '#ca8a04',
  confirmed:  '#3b82f6',
  processing: '#a855f7',
  dispatched: '#f97316',
  delivered:  '#22c55e',
  cancelled:  '#ef4444',
};
const STATUS_LABELS = {
  pending:    'Pending',
  confirmed:  'Confirmed',
  processing: 'Processing',
  dispatched: 'Dispatched',
  delivered:  'Delivered',
  cancelled:  'Cancelled',
};

const TIMELINE = [
  { key: 'pending',    label: 'Order Placed',    icon: '📋', desc: 'Order received and being reviewed' },
  { key: 'confirmed',  label: 'Confirmed',        icon: '✅', desc: 'Payment confirmed, queued for print' },
  { key: 'processing', label: 'Printing',         icon: '🖨', desc: 'Your design is being printed' },
  { key: 'dispatched', label: 'Dispatched',       icon: '📦', desc: 'Shipped with tracking' },
  { key: 'delivered',  label: 'Delivered',        icon: '🎉', desc: 'Arrived at your address' },
];

function StarRow({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} className={`w-4 h-4 ${s <= rating ? 'text-amber-400' : 'text-white/15'}`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      ))}
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order,      setOrder]      = useState(null);
  const [myReview,   setMyReview]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    Promise.all([
      orderAPI.getMyOrder(id),
      reviewAPI.getMy().catch(() => ({ data: { reviews: [] } })),
    ]).then(([ordRes, revRes]) => {
      const ord = ordRes.data.order;
      setOrder(ord);
      const found = (revRes.data.reviews || []).find(r => r.order?._id === ord._id);
      setMyReview(found || null);
    }).catch(() => setError('Order not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" className="text-ink-brown" />
    </div>
  );
  if (error) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400 text-lg mb-3">{error}</p>
        <Link to="/orders" className="text-[#C9967A] hover:text-white transition-colors text-sm">← Back to Orders</Link>
      </div>
    </div>
  );

  const statusIdx   = TIMELINE.findIndex(t => t.key === order.status);
  const isCancelled = order.status === 'cancelled';
  const isDelivered = order.status === 'delivered';
  const sc          = STATUS_COLORS[order.status] || STATUS_COLORS.pending;

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">

      {/* Review modal */}
      <AnimatePresence>
        {showReview && (
          <ReviewFormModal
            order={order}
            existing={myReview}
            onClose={() => setShowReview(false)}
            onSaved={(rev) => {
              setMyReview(rev);
              setShowReview(false);
            }}
          />
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <Link to="/orders" className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors mb-8">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          All Orders
        </Link>

        {/* ── Header card ─────────────────────────────────────── */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          className="rounded-2xl p-6 sm:p-8 mb-5"
          style={{ background:'rgba(18,14,10,0.82)', border:'1px solid rgba(107,66,38,0.25)', boxShadow:'0 8px 32px rgba(0,0,0,0.45)' }}>

          <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between mb-6">
            <div>
              <p className="text-white/35 text-xs mb-1">
                {new Date(order.createdAt).toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
              </p>
              <h1 className="font-display text-2xl font-bold text-white mb-2.5">{order.orderNumber}</h1>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ background:`${sc}18`, color:sc, border:`1px solid ${sc}28` }}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:sc }} />
                {STATUS_LABELS[order.status] || order.status}
              </span>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl font-bold text-white">
                PKR {Math.round(order.total).toLocaleString()}
              </p>
              <p className="text-white/35 text-xs mt-1 capitalize">
                {order.paymentMethod} · <span className={order.paymentStatus === 'paid' ? 'text-emerald-400' : 'text-yellow-400'}>{order.paymentStatus}</span>
              </p>
            </div>
          </div>

          {/* ── Progress timeline ────────────────────────────── */}
          {!isCancelled && (
            <div className="relative">
              {/* Connecting line */}
              <div className="absolute top-5 left-5 right-5 h-px"
                style={{ background:'rgba(255,255,255,0.07)' }} />
              <div className="absolute top-5 left-5 h-px transition-all duration-700"
                style={{
                  background:'linear-gradient(90deg,#6B4226,#C9967A)',
                  width: statusIdx >= 0
                    ? `${(statusIdx / (TIMELINE.length - 1)) * (100 - (10 / TIMELINE.length))}%`
                    : '0%',
                }} />

              <div className="relative flex justify-between">
                {TIMELINE.map((step, i) => {
                  const done    = i < statusIdx;
                  const current = i === statusIdx;
                  const future  = i > statusIdx;
                  return (
                    <div key={step.key} className="flex flex-col items-center gap-2" style={{ width: `${100 / TIMELINE.length}%` }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-base transition-all duration-300 relative z-10"
                        style={{
                          background: done ? 'rgba(34,197,94,0.18)' : current ? 'linear-gradient(135deg,#6B4226,#8B5A3C)' : 'rgba(255,255,255,0.05)',
                          border: done ? '2px solid rgba(34,197,94,0.4)' : current ? '2px solid rgba(107,66,38,0.5)' : '1px solid rgba(255,255,255,0.09)',
                          boxShadow: current ? '0 0 0 4px rgba(107,66,38,0.18)' : 'none',
                        }}>
                        {done ? (
                          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        ) : (
                          <span className={future ? 'text-white/20 text-sm' : 'text-sm'}>{step.icon}</span>
                        )}
                      </div>
                      <div className="text-center px-1">
                        <p className={`text-[10px] font-semibold leading-tight ${done ? 'text-emerald-400/70' : current ? 'text-white' : 'text-white/25'}`}>
                          {step.label}
                        </p>
                        {current && (
                          <p className="text-[9px] text-[#C9967A]/70 mt-0.5 hidden sm:block leading-tight">
                            {step.desc}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isCancelled && (
            <div className="flex items-center gap-3 p-4 rounded-xl mt-2"
              style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)' }}>
              <span className="text-red-400 text-xl">🚫</span>
              <div>
                <p className="text-red-400 text-sm font-semibold">Order Cancelled</p>
                <p className="text-white/40 text-xs mt-0.5">
                  {order.adminNote || 'This order has been cancelled.'}
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Items card ──────────────────────────────────────── */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.08 }}
          className="rounded-2xl p-6 sm:p-8 mb-5"
          style={{ background:'rgba(18,14,10,0.82)', border:'1px solid rgba(107,66,38,0.22)', boxShadow:'0 4px 20px rgba(0,0,0,0.35)' }}>
          <h2 className="font-display text-lg font-bold text-white mb-5">Order Items</h2>
          <div className="space-y-4">
            {order.items.map((item, i) => {
              const designImg = item.frontDesignUrl || item.designUrl || null;
              return (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl"
                  style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)' }}>
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                    style={{ background:`${item.colorHex || '#fff'}14`, border:'1px solid rgba(255,255,255,0.08)' }}>
                    {designImg ? (
                      <img src={designImg} alt="Design" className="w-full h-full object-contain p-1.5" />
                    ) : (
                      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 100 100"
                        style={{ color: item.colorHex || 'rgba(107,66,38,0.4)' }}>
                        <path d="M35 10 L20 25 L10 20 L15 45 L25 45 L25 90 L75 90 L75 45 L85 45 L90 20 L80 25 L65 10 C62 18 38 18 35 10Z" />
                      </svg>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{item.productName}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                      <span className="text-white/50 text-xs flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full border border-white/20 flex-shrink-0" style={{ background: item.colorHex }} />
                        {item.color}
                      </span>
                      <span className="text-white/50 text-xs">Size {item.size}</span>
                      <span className="text-white/50 text-xs">×{item.quantity}</span>
                    </div>
                    {item.designNote && (
                      <p className="text-white/30 text-xs mt-1 italic truncate">"{item.designNote}"</p>
                    )}
                    {(item.frontDesignUrl || item.backDesignUrl) && (
                      <div className="flex gap-1.5 mt-1.5">
                        {item.frontDesignUrl && <span className="text-[10px] text-[#C9967A]/70 font-medium">Front ✓</span>}
                        {item.backDesignUrl  && <span className="text-[10px] text-[#C9967A]/70 font-medium">Back ✓</span>}
                      </div>
                    )}
                  </div>

                  <p className="font-display text-base font-bold text-white flex-shrink-0">
                    PKR {Math.round(item.unitPrice * item.quantity).toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Price breakdown */}
          <div className="mt-5 pt-4 space-y-2"
            style={{ borderTop:'1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Subtotal</span>
              <span className="text-white/85">PKR {Math.round(order.subtotal).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Shipping</span>
              <span className={order.shipping === 0 ? 'text-emerald-400 text-sm font-medium' : 'text-white/85 text-sm'}>
                {order.shipping === 0 ? 'Free' : `PKR ${Math.round(order.shipping).toLocaleString()}`}
              </span>
            </div>
            <div className="flex justify-between pt-1" style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-white font-semibold">Total</span>
              <span className="font-display text-xl font-bold" style={{ color:'#C9967A' }}>
                PKR {Math.round(order.total).toLocaleString()}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Shipping address ────────────────────────────────── */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.14 }}
          className="rounded-2xl p-6 sm:p-7 mb-5"
          style={{ background:'rgba(18,14,10,0.82)', border:'1px solid rgba(107,66,38,0.22)', boxShadow:'0 4px 20px rgba(0,0,0,0.3)' }}>
          <h2 className="font-display text-lg font-bold text-white mb-4">Shipping Address</h2>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background:'rgba(107,66,38,0.15)', border:'1px solid rgba(107,66,38,0.25)' }}>
              <svg className="w-4 h-4 text-[#C9967A]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
            <address className="not-italic text-white/70 text-sm leading-relaxed">
              <span className="text-white font-semibold">
                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
              </span><br />
              {order.shippingAddress.street}<br />
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
              {order.shippingAddress.country}
              {order.shippingAddress.phone && (
                <><br /><span className="text-white/50">{order.shippingAddress.phone}</span></>
              )}
            </address>
          </div>
        </motion.div>

        {/* ── Review section (delivered orders) ───────────────── */}
        {isDelivered && (
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
            className="rounded-2xl p-6 sm:p-7"
            style={{
              background: myReview ? 'rgba(34,197,94,0.06)' : 'linear-gradient(135deg,rgba(107,66,38,0.18),rgba(107,66,38,0.08))',
              border: myReview ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(107,66,38,0.32)',
              boxShadow:'0 4px 20px rgba(0,0,0,0.3)',
            }}>

            {myReview ? (
              /* Existing review */
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <p className="text-emerald-400 font-semibold text-sm">Review submitted</p>
                  </div>
                  <StarRow rating={myReview.rating} />
                  <p className="text-white/75 text-sm mt-2.5 leading-relaxed italic">
                    "{myReview.comment}"
                  </p>
                  <p className="text-white/30 text-xs mt-2">
                    {new Date(myReview.createdAt).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })}
                  </p>
                </div>
                <button onClick={() => setShowReview(true)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80 flex-shrink-0"
                  style={{ background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.5)', border:'1px solid rgba(255,255,255,0.1)' }}>
                  Edit
                </button>
              </div>
            ) : (
              /* Review prompt */
              <div className="flex flex-col sm:flex-row items-center gap-5">
                <div className="text-4xl flex-shrink-0">🎉</div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="font-display text-xl font-bold text-white mb-1">
                    Your order has arrived!
                  </p>
                  <p className="text-white/55 text-sm">
                    How was your experience? Your feedback helps thousands of other customers.
                  </p>
                </div>
                <motion.button
                  onClick={() => setShowReview(true)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all"
                  style={{ background:'linear-gradient(135deg,#6B4226,#8B5A3C)', color:'#fff', boxShadow:'0 4px 20px rgba(107,66,38,0.45)' }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                  Leave a Review
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
