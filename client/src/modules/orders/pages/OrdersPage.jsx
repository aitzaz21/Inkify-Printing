import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { orderAPI } from '../services/order.service';
import { Spinner } from '../../../shared/components/Spinner';

const STATUS_STYLES = {
  pending:    { bg: 'rgba(234,179,8,0.12)',   color: '#ca8a04', label: 'Pending'    },
  confirmed:  { bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6', label: 'Confirmed'  },
  processing: { bg: 'rgba(168,85,247,0.12)',  color: '#a855f7', label: 'Processing' },
  dispatched: { bg: 'rgba(249,115,22,0.12)',  color: '#f97316', label: 'Dispatched' },
  delivered:  { bg: 'rgba(34,197,94,0.12)',   color: '#22c55e', label: 'Delivered'  },
  cancelled:  { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444', label: 'Cancelled'  },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span className="text-xs font-medium px-2.5 py-1 rounded-full"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
};

export default function OrdersPage() {
  const { state } = useLocation();
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderAPI.getMyOrders()
      .then(r => setOrders(r.data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Success banner */}
        {state?.success && (
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-5 rounded-2xl flex items-center gap-4"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(34,197,94,0.15)' }}>
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <p className="text-white font-medium">Order placed successfully!</p>
              <p className="text-white/40 text-sm">Check your email for confirmation details.</p>
            </div>
          </motion.div>
        )}

        <div className="mb-10">
          <p className="text-xs tracking-widest uppercase text-ink-brown mb-1">History</p>
          <h1 className="font-display text-3xl font-bold text-white">My Orders</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" className="text-ink-brown" /></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/40 mb-6">No orders yet.</p>
            <Link to="/designs" className="btn-primary w-auto inline-flex px-8">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="glass-card p-5 sm:p-6 hover:border-ink-brown/30 transition-all duration-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className="font-display font-bold text-white">{order.orderNumber}</span>
                      <StatusBadge status={order.status} />
                      <span className="text-white/25 text-xs">{new Date(order.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <p className="text-white/45 text-sm truncate">
                      {order.items.map(i => `${i.productName} ×${i.quantity}`).join(' · ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="font-display text-lg font-bold text-white">PKR {Math.round(order.total).toLocaleString()}</p>
                      <p className="text-white/30 text-xs capitalize">{order.paymentMethod}</p>
                    </div>
                    <Link
                      to={`/orders/${order._id}`}
                      className="flex items-center gap-1.5 text-xs text-ink-brown-light hover:text-white transition-colors"
                    >
                      Details
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
