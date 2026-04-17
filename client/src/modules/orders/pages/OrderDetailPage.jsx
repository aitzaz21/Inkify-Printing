import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { orderAPI } from '../services/order.service';
import { Spinner } from '../../../shared/components/Spinner';

const STATUS_STYLES = {
  pending:    { color: '#ca8a04', label: 'Pending'    },
  confirmed:  { color: '#3b82f6', label: 'Confirmed'  },
  processing: { color: '#a855f7', label: 'Processing' },
  dispatched: { color: '#f97316', label: 'Dispatched' },
  delivered:  { color: '#22c55e', label: 'Delivered'  },
  cancelled:  { color: '#ef4444', label: 'Cancelled'  },
};

const TIMELINE = ['pending','confirmed','processing','dispatched','delivered'];

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    orderAPI.getMyOrder(id)
      .then(r => setOrder(r.data.order))
      .catch(() => setError('Order not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" className="text-ink-brown" /></div>;
  if (error)   return <div className="min-h-screen flex items-center justify-center"><p className="text-red-400">{error}</p></div>;

  const statusIdx = TIMELINE.indexOf(order.status);
  const s = STATUS_STYLES[order.status] || STATUS_STYLES.pending;

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link to="/orders" className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors mb-8">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          All Orders
        </Link>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
            <div>
              <p className="text-white/40 text-xs mb-1">{new Date(order.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <h1 className="font-display text-2xl font-bold text-white mb-2">{order.orderNumber}</h1>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: `${s.color}20`, color: s.color }}>
                {s.label}
              </span>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl font-bold text-white">PKR {Math.round(order.total).toLocaleString()}</p>
              <p className="text-white/30 text-xs mt-1 capitalize">{order.paymentMethod} · {order.paymentStatus}</p>
            </div>
          </div>

          {/* Progress timeline */}
          {order.status !== 'cancelled' && (
            <div className="mt-6 flex items-center gap-0">
              {TIMELINE.map((s, i) => (
                <div key={s} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all"
                      style={{
                        background: i <= statusIdx ? 'linear-gradient(135deg,#6B4226,#8B5A3C)' : 'rgba(255,255,255,0.06)',
                        border: i === statusIdx ? '2px solid rgba(107,66,38,0.5)' : '1px solid transparent',
                      }}>
                      {i < statusIdx ? (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      ) : (
                        <span className="text-white/60 text-[10px]">{i + 1}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-white/30 capitalize hidden sm:block">{s}</span>
                  </div>
                  {i < TIMELINE.length - 1 && (
                    <div className="flex-1 h-px mx-1 mb-4"
                      style={{ background: i < statusIdx ? 'rgba(107,66,38,0.5)' : 'rgba(255,255,255,0.08)' }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Items */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="glass-card p-6 sm:p-8 mb-6">
          <h2 className="font-display text-lg font-semibold text-white mb-4">Items</h2>
          <div className="space-y-4">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${item.colorHex || '#fff'}18`, border: '1px solid rgba(255,255,255,0.07)' }}>
                  {item.designUrl ? (
                    <img src={item.designUrl} alt="Design" className="w-full h-full object-contain p-1 rounded-xl" />
                  ) : (
                    <svg className="w-7 h-7 text-ink-brown/30" fill="currentColor" viewBox="0 0 100 100">
                      <path d="M35 10 L20 25 L10 20 L15 45 L25 45 L25 90 L75 90 L75 45 L85 45 L90 20 L80 25 L65 10 C62 18 38 18 35 10Z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{item.productName}</p>
                  <p className="text-white/40 text-xs">{item.color} / {item.size} × {item.quantity}</p>
                  {item.designNote && <p className="text-white/25 text-xs mt-0.5 truncate">Note: {item.designNote}</p>}
                </div>
                <p className="font-display text-base font-bold text-white flex-shrink-0">
                  PKR {Math.round(item.unitPrice * item.quantity).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-white/[0.08] space-y-2">
            <div className="flex justify-between text-sm"><span className="text-white/40">Subtotal</span><span className="text-white">PKR {Math.round(order.subtotal).toLocaleString()}</span></div>
            <div className="flex justify-between text-sm"><span className="text-white/40">Shipping</span><span className="text-white">{order.shipping === 0 ? 'Free' : `PKR ${Math.round(order.shipping).toLocaleString()}`}</span></div>
            <div className="flex justify-between font-medium"><span className="text-white">Total</span><span className="font-display text-lg text-ink-brown-light">PKR {Math.round(order.total).toLocaleString()}</span></div>
          </div>
        </motion.div>

        {/* Shipping address */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="glass-card p-6 sm:p-8">
          <h2 className="font-display text-lg font-semibold text-white mb-4">Shipping Address</h2>
          <address className="not-italic text-white/50 text-sm leading-relaxed">
            {order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />
            {order.shippingAddress.street}<br />
            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
            {order.shippingAddress.country}
            {order.shippingAddress.phone && <><br />{order.shippingAddress.phone}</>}
          </address>
        </motion.div>
      </div>
    </div>
  );
}
