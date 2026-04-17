import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { orderAPI } from '../../orders/services/order.service';
import { Spinner } from '../../../shared/components/Spinner';

const STATUS_COLORS = {
  pending:    { bg:'rgba(234,179,8,0.12)',  color:'#ca8a04',  label:'Pending'    },
  confirmed:  { bg:'rgba(59,130,246,0.12)', color:'#3b82f6',  label:'Confirmed'  },
  processing: { bg:'rgba(168,85,247,0.12)', color:'#a855f7',  label:'Processing' },
  dispatched: { bg:'rgba(249,115,22,0.12)', color:'#f97316',  label:'Dispatched' },
  delivered:  { bg:'rgba(34,197,94,0.12)',  color:'#22c55e',  label:'Delivered'  },
  cancelled:  { bg:'rgba(239,68,68,0.12)',  color:'#ef4444',  label:'Cancelled'  },
};
const STATUSES = ['pending','confirmed','processing','dispatched','delivered','cancelled'];

/* ── Confirmation modal ── */
const ConfirmModal = ({ orderId, orderNumber, nextStatus, onConfirm, onCancel }) => (
  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background:'rgba(0,0,0,0.85)' }}>
    <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.9, opacity:0 }}
      className="glass-card p-6 max-w-sm w-full">
      <div className="text-center mb-5">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ background:'rgba(107,66,38,0.15)', border:'1px solid rgba(107,66,38,0.3)' }}>
          <svg className="w-6 h-6 text-ink-brown" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h3 className="text-white font-display text-lg font-bold">Confirm Status Change</h3>
        <p className="text-white/50 text-sm mt-2">
          Change <span className="text-white font-medium">{orderNumber}</span> to{' '}
          <span style={{ color: STATUS_COLORS[nextStatus]?.color }} className="font-semibold capitalize">{nextStatus}</span>?
        </p>
        <p className="text-white/30 text-xs mt-2">A notification email will be sent to the customer.</p>
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button onClick={onConfirm}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
          style={{ background:'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
          Yes, Update
        </button>
      </div>
    </motion.div>
  </motion.div>
);

/* ── Design Preview panel ── */
const DesignPanel = ({ order, onClose }) => {
  const items = order.items.filter(i => i.designUrl);
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(0,0,0,0.85)' }} onClick={onClose}>
      <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.9, opacity:0 }}
        className="glass-card p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-display font-bold">Designs — {order.orderNumber}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        {items.length === 0 ? (
          <p className="text-white/30 text-sm text-center py-8">No design uploads for this order.</p>
        ) : items.map((item, i) => (
          <div key={i} className="rounded-xl overflow-hidden mb-4"
            style={{ border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.03)' }}>
            <div className="p-3 border-b border-white/6 flex justify-between items-start">
              <div>
                <p className="text-white text-sm font-medium">{item.productName || item.shirtType}</p>
                <p className="text-white/40 text-xs">{item.color} / {item.size} × {item.quantity}</p>
                {item.designNote && <p className="text-white/30 text-xs italic mt-0.5">"{item.designNote}"</p>}
                {item.designId && (
                  <p className="text-ink-brown text-xs mt-0.5">Marketplace design</p>
                )}
              </div>
              <a href={item.designUrl}
                download={`${order._id}-${order.user?._id || 'user'}-design${i+1}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background:'rgba(107,66,38,0.2)', color:'#C48A5C', border:'1px solid rgba(107,66,38,0.3)' }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Download
              </a>
            </div>
            <div className="p-3 flex justify-center" style={{ background:'rgba(0,0,0,0.2)' }}>
              <img src={item.designUrl} alt="Design" className="max-h-44 object-contain rounded-lg" />
            </div>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
};

/* ── Order Card ── */
const OrderCard = ({ order, onStatusChange }) => {
  const [expanded, setExpanded] = useState(false);
  const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
  const hasDesign = order.items.some(i => i.designUrl);
  const [showDesign, setShowDesign] = useState(false);

  return (
    <>
      <AnimatePresence>{showDesign && <DesignPanel order={order} onClose={() => setShowDesign(false)} />}</AnimatePresence>

      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
        className="glass-card p-5 space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display font-bold text-white text-base">{order.orderNumber}</span>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full capitalize"
                style={{ background:sc.bg, color:sc.color }}>{order.status}</span>
              <span className={`text-xs font-medium ${order.paymentStatus==='paid'?'text-emerald-400':'text-yellow-500/80'}`}>
                {order.paymentStatus}
              </span>
            </div>
            <p className="text-white/35 text-xs mt-0.5">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-display font-bold text-white text-lg">PKR {Math.round(order.total).toLocaleString()}</p>
            <p className="text-white/35 text-xs capitalize">{order.paymentMethod}</p>
          </div>
        </div>

        {/* Customer + Address */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl p-3 space-y-1" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-white/30 text-xs tracking-widest uppercase">Customer</p>
            <p className="text-white text-sm font-medium">{order.user?.firstName} {order.user?.lastName}</p>
            <p className="text-white/50 text-xs">{order.user?.email}</p>
          </div>
          <div className="rounded-xl p-3 space-y-1" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-white/30 text-xs tracking-widest uppercase">Delivery Address</p>
            {order.shippingAddress ? (
              <>
                <p className="text-white/70 text-xs">{order.shippingAddress.street}</p>
                <p className="text-white/70 text-xs">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                <p className="text-white/70 text-xs">{order.shippingAddress.country}</p>
                {order.shippingAddress.phone && <p className="text-white/50 text-xs">{order.shippingAddress.phone}</p>}
              </>
            ) : <p className="text-white/30 text-xs italic">Not provided</p>}
          </div>
        </div>

        {/* Payment details for card payments */}
        {order.paymentMethod === 'card' && (
          <div className="rounded-xl p-3"
            style={{ background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.15)' }}>
            <p className="text-white/30 text-xs tracking-widest uppercase mb-1">Card Payment</p>
            <p className="text-white/70 text-xs">
              Transaction ID: <span className="font-mono text-white/90 ml-1">{order.transactionId || '—'}</span>
            </p>
            {order.paymentReference && (
              <p className="text-white/50 text-xs mt-0.5">
                Reference: <span className="font-mono">{order.paymentReference}</span>
              </p>
            )}
          </div>
        )}

        {/* Items (expandable) */}
        <div>
          <button onClick={() => setExpanded(v => !v)}
            className="flex items-center justify-between w-full text-left py-2 px-3 rounded-xl transition-colors"
            style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-white/60 text-xs font-medium">{order.items.length} item(s)</span>
            <svg className={`w-4 h-4 text-white/30 transition-transform ${expanded?'rotate-180':''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
                className="overflow-hidden">
                <div className="pt-2 space-y-2">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)' }}>
                      <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-sm"
                        style={{ background: item.colorHex ? `${item.colorHex}20` : 'rgba(107,66,38,0.15)', border:'1px solid rgba(255,255,255,0.07)' }}>
                        {item.colorHex ? (
                          <div className="w-4 h-4 rounded-full" style={{ background: item.colorHex }} />
                        ) : '👕'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium truncate">{item.productName || item.shirtType}</p>
                        <p className="text-white/40 text-xs">{item.color} · {item.size} · ×{item.quantity}</p>
                        {item.designNote && <p className="text-white/25 text-xs italic truncate">"{item.designNote}"</p>}
                      </div>
                      <span className="text-white text-xs font-semibold flex-shrink-0">
                        PKR {Math.round(item.unitPrice * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-white/6">
          {/* Status selector */}
          <select
            value={order.status}
            onChange={e => onStatusChange(order._id, order.orderNumber, e.target.value)}
            className="flex-1 text-xs rounded-lg px-3 py-2 focus:outline-none cursor-pointer"
            style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.7)', minWidth:'130px' }}>
            {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>

          {/* Design view/download */}
          <button onClick={() => setShowDesign(true)} title={hasDesign ? 'View designs' : 'No designs'}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
            style={{
              background: hasDesign ? 'rgba(107,66,38,0.18)' : 'rgba(255,255,255,0.04)',
              color:      hasDesign ? '#C48A5C'               : 'rgba(255,255,255,0.2)',
              border:     hasDesign ? '1px solid rgba(107,66,38,0.28)' : '1px solid rgba(255,255,255,0.06)',
              cursor:     hasDesign ? 'pointer' : 'default',
            }}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {hasDesign ? 'Designs' : 'No Design'}
          </button>
        </div>
      </motion.div>
    </>
  );
};

/* ── Main page ── */
export default function AdminOrdersPage() {
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('');
  const [updating, setUpdating] = useState('');

  // Confirmation state
  const [confirm, setConfirm] = useState(null); // { orderId, orderNumber, nextStatus }

  const load = (status = '') => {
    setLoading(true);
    orderAPI.getAll(status ? { status } : {})
      .then(r => setOrders(r.data.orders || []))
      .catch(() => toast.error('Failed to load orders.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(filter); }, [filter]);

  // Called when user picks new status from dropdown — shows confirmation first
  const requestStatusChange = (orderId, orderNumber, nextStatus) => {
    setConfirm({ orderId, orderNumber, nextStatus });
  };

  // Confirmed — execute update
  const executeStatusChange = async () => {
    if (!confirm) return;
    const { orderId, nextStatus } = confirm;
    setConfirm(null);
    setUpdating(orderId);
    try {
      const res = await orderAPI.updateStatus(orderId, { status: nextStatus });
      setOrders(prev => prev.map(o => o._id === orderId ? res.data.order : o));
      toast.success(`Order marked as ${nextStatus}. Customer notified.`);
    } catch {
      toast.error('Update failed.');
    } finally {
      setUpdating('');
    }
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {confirm && (
          <ConfirmModal
            orderId={confirm.orderId}
            orderNumber={confirm.orderNumber}
            nextStatus={confirm.nextStatus}
            onConfirm={executeStatusChange}
            onCancel={() => setConfirm(null)}
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <p className="text-xs tracking-widest uppercase text-ink-brown mb-1">Manage</p>
          <h1 className="font-display text-2xl font-bold text-white">Orders</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {['', ...STATUSES].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150"
              style={filter === s
                ? { background:'linear-gradient(135deg,#6B4226,#8B5A3C)', color:'#fff' }
                : { background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.45)', border:'1px solid rgba(255,255,255,0.1)' }
              }>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" className="text-ink-brown" /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 glass-card"><p className="text-white/30">No orders found.</p></div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <OrderCard
              key={order._id}
              order={order}
              onStatusChange={requestStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
