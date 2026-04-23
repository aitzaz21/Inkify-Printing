import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { orderAPI } from '../../orders/services/order.service';
import { Spinner } from '../../../shared/components/Spinner';
import { ShirtOrderPreview2D } from '../components/ShirtOrderPreview2D';

const STATUS_COLORS = {
  pending:    { bg:'rgba(234,179,8,0.12)',  text:'#ca8a04',  dot:'#ca8a04',  label:'Pending'    },
  confirmed:  { bg:'rgba(59,130,246,0.12)', text:'#3b82f6',  dot:'#3b82f6',  label:'Confirmed'  },
  processing: { bg:'rgba(168,85,247,0.12)', text:'#a855f7',  dot:'#a855f7',  label:'Processing' },
  dispatched: { bg:'rgba(249,115,22,0.12)', text:'#f97316',  dot:'#f97316',  label:'Dispatched' },
  delivered:  { bg:'rgba(34,197,94,0.12)',  text:'#22c55e',  dot:'#22c55e',  label:'Delivered'  },
  cancelled:  { bg:'rgba(239,68,68,0.12)',  text:'#ef4444',  dot:'#ef4444',  label:'Cancelled'  },
  reversed:   { bg:'rgba(239,68,68,0.15)',  text:'#f87171',  dot:'#f87171',  label:'Reversed'   },
};
const STATUSES = ['pending','confirmed','processing','dispatched','delivered','cancelled','reversed'];

// ─── Confirmation modal ───────────────────────────────────────────────────────
const ConfirmModal = ({ orderId, orderNumber, nextStatus, onConfirm, onCancel }) => (
  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background:'rgba(0,0,0,0.88)', backdropFilter:'blur(4px)' }}>
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
          <span style={{ color: STATUS_COLORS[nextStatus]?.text }} className="font-semibold capitalize">{nextStatus}</span>?
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

// ─── Reversal modal ───────────────────────────────────────────────────────────
const ReversalModal = ({ orderId, orderNumber, onConfirm, onCancel }) => {
  const [reason, setReason] = useState('');
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(0,0,0,0.90)', backdropFilter:'blur(4px)' }}>
      <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.9, opacity:0 }}
        className="glass-card p-6 max-w-sm w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.2)' }}>
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-display text-base font-bold">Reverse Order</h3>
            <p className="text-white/40 text-xs">{orderNumber} · This will cancel & refund</p>
          </div>
        </div>
        <p className="text-white/50 text-xs mb-3 leading-relaxed">
          This will mark the order as reversed, cancel pending designer earnings, and notify the customer. This action cannot be undone.
        </p>
        <div className="mb-4">
          <label className="label">Reversal Reason (required)</label>
          <textarea rows={2} className="glass-input resize-none" value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Customer requested refund, quality issue…" />
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => onConfirm(reason)} disabled={!reason.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 transition-all"
            style={{ background:'rgba(239,68,68,0.15)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.25)' }}>
            Reverse Order
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const sc = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
      style={{ background: sc.bg, color: sc.text }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sc.dot }} />
      {sc.label}
    </span>
  );
}

// ─── Order card ───────────────────────────────────────────────────────────────
const OrderCard = ({ order, onStatusChange, onReverse }) => {
  const [expanded,    setExpanded]    = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

  const sc          = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
  const customItems = order.items.filter(i => i.shirtTypeId || i.frontDesignUrl || i.designUrl || i.backDesignUrl);
  const hasCustom   = customItems.length > 0;

  return (
    <>
      <AnimatePresence>
        {previewItem && (
          <ShirtOrderPreview2D
            order={order}
            item={previewItem}
            onClose={() => setPreviewItem(null)}
          />
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
        className="glass-card p-5 space-y-4 hover:border-white/10 transition-all duration-200"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}>

        {/* ── Header row ─────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-display font-bold text-white text-base">{order.orderNumber}</span>
              <StatusBadge status={order.isReversed ? 'reversed' : order.status} />
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                order.paymentStatus === 'paid'
                  ? 'text-emerald-400 bg-emerald-400/10'
                  : 'text-yellow-400/80 bg-yellow-400/8'
              }`}>
                {order.paymentStatus}
              </span>
            </div>
            <p className="text-white/30 text-xs">{new Date(order.createdAt).toLocaleString()}</p>
            {order.isReversed && order.reversalReason && (
              <p className="text-red-400/55 text-xs mt-1 italic">"{order.reversalReason}"</p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-display font-bold text-white text-lg">PKR {Math.round(order.total).toLocaleString()}</p>
            <p className="text-white/30 text-xs capitalize">{order.paymentMethod}</p>
          </div>
        </div>

        {/* ── Customer + Address ──────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl p-3 space-y-1"
            style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-white/25 text-[10px] tracking-widest uppercase font-semibold">Customer</p>
            <p className="text-white text-sm font-semibold">{order.user?.firstName} {order.user?.lastName}</p>
            <p className="text-white/45 text-xs">{order.user?.email}</p>
          </div>
          <div className="rounded-xl p-3 space-y-1"
            style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-white/25 text-[10px] tracking-widest uppercase font-semibold">Delivery</p>
            {order.shippingAddress ? (
              <>
                <p className="text-white/65 text-xs leading-relaxed">
                  {order.shippingAddress.street}<br />
                  {order.shippingAddress.city}, {order.shippingAddress.state}<br />
                  {order.shippingAddress.country}
                </p>
                {order.shippingAddress.phone && (
                  <p className="text-white/40 text-xs">{order.shippingAddress.phone}</p>
                )}
              </>
            ) : <p className="text-white/25 text-xs italic">Not provided</p>}
          </div>
        </div>

        {/* ── Card payment info ───────────────────────────────────── */}
        {order.paymentMethod === 'card' && (
          <div className="rounded-xl p-3"
            style={{ background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.15)' }}>
            <p className="text-blue-400/55 text-[10px] tracking-widest uppercase font-semibold mb-1">Card Payment</p>
            <p className="text-white/65 text-xs flex items-center gap-1 flex-wrap">
              <span>Transaction:</span>
              <span className="font-mono text-white/85 break-all">{order.transactionId || '—'}</span>
            </p>
            {order.paymentReference && (
              <p className="text-white/45 text-xs mt-0.5 truncate">
                Ref: <span className="font-mono">{order.paymentReference}</span>
              </p>
            )}
          </div>
        )}

        {/* ── Items (expandable) ──────────────────────────────────── */}
        <div>
          <button onClick={() => setExpanded(v => !v)}
            className="flex items-center justify-between w-full text-left py-2 px-3 rounded-xl transition-colors hover:bg-white/3"
            style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2">
              <span className="text-white/50 text-xs font-medium">{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
              {hasCustom && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full text-[#C48A5C] font-semibold"
                  style={{ background:'rgba(107,66,38,0.18)' }}>
                  Custom design
                </span>
              )}
            </div>
            <svg className={`w-4 h-4 text-white/25 transition-transform ${expanded?'rotate-180':''}`}
              fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
                className="overflow-hidden">
                <div className="pt-2 space-y-2">
                  {order.items.map((item, i) => {
                    const hasFront = !!(item.frontDesignUrl || item.designUrl);
                    const hasBack  = !!item.backDesignUrl;
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                        style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)' }}>
                        <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
                          style={{ background: item.colorHex ? `${item.colorHex}20` : 'rgba(107,66,38,0.15)', border:'1px solid rgba(255,255,255,0.07)' }}>
                          {item.colorHex
                            ? <div className="w-4 h-4 rounded-full" style={{ background: item.colorHex }} />
                            : <span className="text-xs">👕</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-semibold truncate">{item.productName || item.shirtType}</p>
                          <p className="text-white/40 text-xs">{item.color} · {item.size} · ×{item.quantity}</p>
                          {(hasFront || hasBack) && (
                            <div className="flex gap-1.5 mt-1">
                              {hasFront && <span className="text-[9px] text-emerald-400/70 font-medium">Front ✓</span>}
                              {hasBack  && <span className="text-[9px] text-emerald-400/70 font-medium">Back ✓</span>}
                            </div>
                          )}
                          {item.designNote && <p className="text-white/20 text-[10px] italic truncate mt-0.5">"{item.designNote}"</p>}
                        </div>
                        <span className="text-white text-xs font-semibold flex-shrink-0">
                          PKR {Math.round(item.unitPrice * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Actions row ─────────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-white/[0.06]">

          {/* Status selector */}
          <select
            value={order.isReversed ? 'reversed' : order.status}
            onChange={e => onStatusChange(order._id, order.orderNumber, e.target.value)}
            disabled={order.isReversed}
            className="flex-1 text-xs rounded-xl px-3 py-2 focus:outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background:'rgba(255,255,255,0.05)',
              border:'1px solid rgba(255,255,255,0.10)',
              color:'rgba(255,255,255,0.75)',
              minWidth:'140px',
            }}>
            {STATUSES.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>

          {/* Reverse order */}
          {!order.isReversed && (
            <button onClick={() => onReverse(order._id, order.orderNumber)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:bg-red-500/10"
              style={{ background:'rgba(239,68,68,0.07)', color:'rgba(239,68,68,0.7)', border:'1px solid rgba(239,68,68,0.15)' }}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
              </svg>
              Reverse
            </button>
          )}

          {/* Design preview button(s) */}
          {hasCustom ? (
            customItems.length === 1 ? (
              <button
                onClick={() => setPreviewItem(customItems[0])}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{ background:'rgba(107,66,38,0.18)', color:'#C48A5C', border:'1px solid rgba(107,66,38,0.3)' }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                View Design
              </button>
            ) : (
              <div className="flex gap-1">
                {customItems.map((item, i) => (
                  <button key={i} onClick={() => setPreviewItem(item)}
                    className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{ background:'rgba(107,66,38,0.18)', color:'#C48A5C', border:'1px solid rgba(107,66,38,0.3)' }}
                    title={`View design — ${item.productName || item.shirtType} ${item.size}`}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    #{i + 1}
                  </button>
                ))}
              </div>
            )
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs"
              style={{ background:'rgba(255,255,255,0.03)', color:'rgba(255,255,255,0.18)', border:'1px solid rgba(255,255,255,0.06)' }}>
              No Custom Design
            </span>
          )}
        </div>
      </motion.div>
    </>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminOrdersPage() {
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('');
  const [updating, setUpdating] = useState('');
  const [confirm,  setConfirm]  = useState(null);
  const [reversal, setReversal] = useState(null);

  const load = (status = '') => {
    setLoading(true);
    orderAPI.getAll(status ? { status } : {})
      .then(r => setOrders(r.data.orders || []))
      .catch(() => toast.error('Failed to load orders.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(filter); }, [filter]);

  const requestStatusChange = (orderId, orderNumber, nextStatus) => {
    if (nextStatus === 'reversed') {
      setReversal({ orderId, orderNumber });
    } else {
      setConfirm({ orderId, orderNumber, nextStatus });
    }
  };

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

  const executeReversal = async (reason) => {
    if (!reversal) return;
    const { orderId } = reversal;
    setReversal(null);
    setUpdating(orderId);
    try {
      const res = await orderAPI.reverseOrder(orderId, { reason });
      setOrders(prev => prev.map(o => o._id === orderId ? res.data.order : o));
      toast.success('Order reversed. Designer earnings cancelled. Customer notified.');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Reversal failed.');
    } finally {
      setUpdating('');
    }
  };

  // Stats
  const stats = {
    total:     orders.length,
    pending:   orders.filter(o => o.status === 'pending').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    revenue:   orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0),
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
        {reversal && (
          <ReversalModal
            orderId={reversal.orderId}
            orderNumber={reversal.orderNumber}
            onConfirm={executeReversal}
            onCancel={() => setReversal(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
        <div>
          <p className="text-xs tracking-widest uppercase text-ink-brown mb-1">Manage</p>
          <h1 className="font-display text-2xl font-bold text-white">Orders</h1>
        </div>
        <button onClick={() => load(filter)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all self-start sm:self-auto"
          style={{ background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.55)', border:'1px solid rgba(255,255,255,0.1)' }}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Refresh
        </button>
      </div>

      {/* ── Stats bar ───────────────────────────────────────────────── */}
      {!loading && orders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Orders',   value: stats.total,                     color: 'text-white'       },
            { label: 'Pending',         value: stats.pending,                   color: 'text-yellow-400'  },
            { label: 'Delivered',       value: stats.delivered,                 color: 'text-emerald-400' },
            { label: 'Paid Revenue',    value: stats.revenue >= 1000000 ? `PKR ${(stats.revenue/1000000).toFixed(1)}M` : stats.revenue >= 1000 ? `PKR ${(stats.revenue/1000).toFixed(0)}K` : `PKR ${Math.round(stats.revenue)}`, color: 'text-[#C9967A]' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4"
              style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-white/30 text-xs mb-1 truncate">{s.label}</p>
              <p className={`font-display text-xl font-bold truncate ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Status filter ───────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {['', ...STATUSES].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150"
            style={filter === s
              ? { background:'linear-gradient(135deg,#6B4226,#8B5A3C)', color:'#fff', boxShadow:'0 2px 10px rgba(107,66,38,0.35)' }
              : { background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.45)', border:'1px solid rgba(255,255,255,0.09)' }
            }>
            {s ? (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLORS[s]?.dot }} />
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </span>
            ) : 'All Orders'}
          </button>
        ))}
      </div>

      {/* ── Orders list ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" className="text-ink-brown" /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 glass-card">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background:'rgba(107,66,38,0.12)', border:'1px solid rgba(107,66,38,0.2)' }}>
            <svg className="w-7 h-7 text-ink-brown/50" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
            </svg>
          </div>
          <p className="text-white/30 text-sm">
            {filter ? `No ${filter} orders found.` : 'No orders yet.'}
          </p>
          {filter && (
            <button onClick={() => setFilter('')}
              className="text-[#C9967A] text-xs mt-2 hover:text-white transition-colors">
              View all orders
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <OrderCard
              key={order._id}
              order={order}
              onStatusChange={requestStatusChange}
              onReverse={(id, num) => setReversal({ orderId: id, orderNumber: num })}
            />
          ))}
          <p className="text-white/20 text-xs text-center pt-2">
            {orders.length} order{orders.length !== 1 ? 's' : ''} shown
          </p>
        </div>
      )}
    </div>
  );
}
