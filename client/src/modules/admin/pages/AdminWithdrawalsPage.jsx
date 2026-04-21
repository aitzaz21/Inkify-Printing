import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../../shared/api/axios';
import { fmt } from '../../../shared/utils/currency';
import { Spinner } from '../../../shared/components/Spinner';

const STATUS_STYLES = {
  pending:  { bg: 'rgba(202,138,4,0.12)',  color: '#ca8a04',  border: 'rgba(202,138,4,0.25)',  label: 'Pending'  },
  approved: { bg: 'rgba(34,197,94,0.1)',   color: '#22c55e',  border: 'rgba(34,197,94,0.2)',   label: 'Approved' },
  rejected: { bg: 'rgba(239,68,68,0.1)',   color: '#ef4444',  border: 'rgba(239,68,68,0.15)',  label: 'Rejected' },
};

const Badge = ({ status }) => {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span className="text-xs font-medium px-2.5 py-1 rounded-full capitalize"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {s.label}
    </span>
  );
};

const Avatar = ({ user }) => (
  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
    style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
    {user?.firstName?.[0]}{user?.lastName?.[0]}
  </div>
);

export default function AdminWithdrawalsPage() {
  const [requests,   setRequests]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState('pending');
  const [actionModal, setActionModal] = useState(null); // { type: 'approve'|'reject', req }
  const [adminNote,  setAdminNote]  = useState('');
  const [saving,     setSaving]     = useState(false);
  const [stats,      setStats]      = useState({ pending: 0, approved: 0, rejected: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, pendingRes] = await Promise.all([
        api.get('/withdrawals/requests', { params: { status: filter || undefined, limit: 50 } }),
        api.get('/withdrawals/requests', { params: { limit: 1 } }),
      ]);
      setRequests(res.data.requests || []);
      // Get counts for all statuses
      const [p, a, r] = await Promise.all([
        api.get('/withdrawals/requests', { params: { status: 'pending', limit: 1 } }),
        api.get('/withdrawals/requests', { params: { status: 'approved', limit: 1 } }),
        api.get('/withdrawals/requests', { params: { status: 'rejected', limit: 1 } }),
      ]);
      setStats({ pending: p.data.total || 0, approved: a.data.total || 0, rejected: r.data.total || 0 });
    } catch { toast.error('Failed to load requests.'); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const openAction = (type, req) => {
    setActionModal({ type, req });
    setAdminNote('');
  };

  const handleAction = async () => {
    if (!actionModal) return;
    setSaving(true);
    const { type, req } = actionModal;
    try {
      await api.patch(`/withdrawals/requests/${req._id}/${type}`, { adminNote });
      toast.success(type === 'approve' ? 'Withdrawal approved & designer notified.' : 'Withdrawal rejected.');
      setActionModal(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Action failed.');
    } finally { setSaving(false); }
  };

  const totalPending = requests
    .filter(r => r.status === 'pending')
    .reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-6">
      {/* Action Modal */}
      <AnimatePresence>
        {actionModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.88)' }} onClick={() => setActionModal(null)}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: actionModal.type === 'approve' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)' }}>
                  {actionModal.type === 'approve'
                    ? <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    : <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  }
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-white">
                    {actionModal.type === 'approve' ? 'Approve Withdrawal' : 'Reject Withdrawal'}
                  </h3>
                  <p className="text-white/40 text-xs">
                    {fmt(actionModal.req.amount)} · {actionModal.req.designer?.firstName} {actionModal.req.designer?.lastName}
                  </p>
                </div>
              </div>

              {actionModal.type === 'approve' && (
                <div className="mb-4 p-4 rounded-xl" style={{ background: 'rgba(107,66,38,0.1)', border: '1px solid rgba(107,66,38,0.2)' }}>
                  <p className="text-white/60 text-xs mb-2 font-medium">Payment Account</p>
                  <p className="text-white text-sm">{actionModal.req.paymentAccount?.method}</p>
                  <p className="text-white/50 text-xs mt-0.5">{actionModal.req.paymentAccount?.accountName}</p>
                  <p className="text-ink-brown-light text-xs mt-0.5 font-medium">{actionModal.req.paymentAccount?.accountNumber}</p>
                </div>
              )}

              <div className="mb-5">
                <label className="label">{actionModal.type === 'approve' ? 'Note (optional)' : 'Rejection reason'}</label>
                <textarea rows={3} className="glass-input resize-none" value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  placeholder={actionModal.type === 'approve'
                    ? 'Payment sent via JazzCash, ref: xxxx…'
                    : 'Please provide a reason for rejection…'
                  } />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setActionModal(null)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleAction} disabled={saving || (actionModal.type === 'reject' && !adminNote.trim())}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
                  style={{ background: actionModal.type === 'approve' ? 'linear-gradient(135deg,#16a34a,#22c55e)' : 'rgba(239,68,68,0.2)', border: actionModal.type === 'reject' ? '1px solid rgba(239,68,68,0.3)' : 'none', color: actionModal.type === 'reject' ? '#ef4444' : '#fff' }}>
                  {saving && <Spinner size="sm" />}
                  {saving ? 'Processing…' : actionModal.type === 'approve' ? 'Confirm & Pay' : 'Reject Request'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs tracking-widest uppercase text-ink-brown mb-1">Finance</p>
          <h1 className="font-display text-2xl font-bold text-white">Withdrawal Requests</h1>
          <p className="text-white/35 text-xs mt-1">Approve or reject designer payout requests.</p>
        </div>
        {filter === 'pending' && requests.length > 0 && (
          <div className="text-right">
            <p className="text-xs text-white/40">Total pending</p>
            <p className="font-display text-xl font-bold text-ink-brown-light">{fmt(totalPending)}</p>
          </div>
        )}
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: '',         label: 'All',      count: stats.pending + stats.approved + stats.rejected },
          { key: 'pending',  label: 'Pending',  count: stats.pending  },
          { key: 'approved', label: 'Approved', count: stats.approved },
          { key: 'rejected', label: 'Rejected', count: stats.rejected },
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200"
            style={filter === tab.key
              ? { background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', color: '#fff', border: '1px solid transparent' }
              : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {tab.label}
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ background: filter === tab.key ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)' }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" className="text-ink-brown" /></div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20">
          <svg className="w-12 h-12 text-white/10 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z" />
          </svg>
          <p className="text-white/30 text-sm">No {filter} withdrawal requests.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req, i) => (
            <motion.div key={req._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="glass-card p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              style={{ borderColor: req.status === 'pending' ? 'rgba(202,138,4,0.2)' : undefined }}>

              {/* Left: Designer info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar user={req.designer} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white text-sm font-semibold">{req.designer?.firstName} {req.designer?.lastName}</span>
                    <Badge status={req.status} />
                  </div>
                  <p className="text-white/40 text-xs truncate">{req.designer?.email}</p>
                  <p className="text-white/25 text-xs mt-0.5">
                    Requested {new Date(req.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Middle: Amount + account */}
              <div className="sm:text-right flex sm:flex-col gap-4 sm:gap-1">
                <div>
                  <p className="font-display text-xl font-bold text-ink-brown-light">{fmt(req.amount)}</p>
                  <p className="text-white/30 text-xs">withdrawal amount</p>
                </div>
                <div className="sm:mt-2">
                  <p className="text-white/50 text-xs font-medium">{req.paymentAccount?.method}</p>
                  <p className="text-white/30 text-xs truncate max-w-[160px] sm:max-w-none">{req.paymentAccount?.accountName}</p>
                  <p className="text-ink-brown-light text-xs font-medium">{req.paymentAccount?.accountNumber}</p>
                </div>
              </div>

              {/* Right: Actions */}
              {req.status === 'pending' ? (
                <div className="flex gap-2 sm:flex-col sm:items-end flex-shrink-0">
                  <button onClick={() => openAction('approve', req)}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all"
                    style={{ background: 'linear-gradient(135deg,#16a34a,#22c55e)', minWidth: 90 }}>
                    Approve
                  </button>
                  <button onClick={() => openAction('reject', req)}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', minWidth: 90 }}>
                    Reject
                  </button>
                </div>
              ) : (
                <div className="text-right flex-shrink-0">
                  {req.processedAt && (
                    <p className="text-white/25 text-xs">
                      {req.status === 'approved' ? 'Approved' : 'Rejected'} {new Date(req.processedAt).toLocaleDateString()}
                    </p>
                  )}
                  {req.adminNote && (
                    <p className="text-white/40 text-xs mt-1 max-w-[200px] text-right">{req.adminNote}</p>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
