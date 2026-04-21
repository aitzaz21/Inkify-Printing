import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../../shared/api/axios';
import { fmt } from '../../../shared/utils/currency';
import { Spinner } from '../../../shared/components/Spinner';

/* ─── Status badge ── */
const Badge = ({ children, color, bg }) => (
  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: bg, color }}>
    {children}
  </span>
);

const DESIGN_STATUS = {
  approved: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   label: 'Approved' },
  pending:  { color: '#ca8a04', bg: 'rgba(202,138,4,0.1)',   label: 'Pending'  },
  rejected: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   label: 'Rejected' },
};
const WITHDRAWAL_STATUS = {
  pending:  { color: '#ca8a04', bg: 'rgba(202,138,4,0.1)'  },
  approved: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)'  },
  rejected: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
};

/* ─── Designer Detail Drawer ── */
function DesignerDrawer({ userId, onClose, onWithdrawalAction }) {
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [actionModal, setActionModal] = useState(null); // { type: 'approve'|'reject', withdrawalId, amount }
  const [note,     setNote]     = useState('');
  const [acting,   setActing]   = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/withdrawals/admin/designers/${userId}`)
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load designer profile.'))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async () => {
    if (!actionModal) return;
    if (actionModal.type === 'reject' && !note.trim()) { toast.error('Please provide a reason.'); return; }
    setActing(true);
    try {
      const ep = actionModal.type === 'approve' ? 'approve' : 'reject';
      await api.patch(`/withdrawals/requests/${actionModal.withdrawalId}/${ep}`, { adminNote: note });
      toast.success(`Withdrawal ${actionModal.type === 'approve' ? 'approved' : 'rejected'}.`);
      setActionModal(null);
      setNote('');
      load();
      onWithdrawalAction?.();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Action failed.');
    } finally { setActing(false); }
  };

  const { user, designs = [], earnings = [], withdrawals = [], summary } = data || {};

  return (
    <>
      {/* Overlay */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />

      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.28 }}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-xl flex flex-col"
        style={{ background: 'rgba(12,10,9,0.98)', backdropFilter: 'blur(24px)', borderLeft: '1px solid rgba(107,66,38,0.2)' }}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            {user?.avatar
              ? <img src={user.avatar} alt="" className="w-9 h-9 rounded-xl object-cover" />
              : <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white"
                  style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
            }
            <div>
              <p className="text-white text-sm font-semibold leading-tight">{user?.firstName} {user?.lastName}</p>
              <p className="text-white/40 text-xs">{user?.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Spinner size="lg" className="text-ink-brown" />
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex-shrink-0 flex border-b border-white/[0.08] px-4">
              {[
                { key: 'overview',   label: 'Overview'    },
                { key: 'designs',    label: `Designs (${designs.length})`    },
                { key: 'earnings',   label: 'Earnings'    },
                { key: 'withdrawals',label: `Payouts (${withdrawals.length})`  },
              ].map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className="px-3 py-3 text-xs font-medium transition-all duration-150 whitespace-nowrap"
                  style={activeTab === t.key
                    ? { color: '#C48A5C', borderBottom: '2px solid #8B5A3C' }
                    : { color: 'rgba(255,255,255,0.35)' }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence mode="wait">
                {/* ── Overview ── */}
                {activeTab === 'overview' && (
                  <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {/* KPI grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {[
                        { label: 'Total Earned',   value: fmt(summary?.totalEarned   || 0), color: '#fff'     },
                        { label: 'Pending Payout', value: fmt(summary?.pendingAmount || 0), color: '#ca8a04'  },
                        { label: 'Total Paid Out', value: fmt(summary?.paidAmount    || 0), color: '#22c55e'  },
                        { label: 'Reversals',      value: `${summary?.reversedCount  || 0} orders`, color: '#ef4444' },
                      ].map(k => (
                        <div key={k.label} className="rounded-xl p-3 text-center"
                          style={{ background: 'rgba(107,66,38,0.07)', border: '1px solid rgba(107,66,38,0.12)' }}>
                          <p className="font-bold text-base font-display" style={{ color: k.color }}>{k.value}</p>
                          <p className="text-white/35 text-[10px] mt-0.5">{k.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Profile info */}
                    <div className="glass-card p-4 space-y-2 mb-4">
                      <p className="text-white/30 text-[10px] tracking-widest uppercase mb-2">Profile</p>
                      {[
                        { label: 'Email',   value: user?.email },
                        { label: 'Member',  value: user ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '—' },
                        { label: 'Designs', value: `${designs.length} total · ${designs.filter(d => d.status === 'approved').length} approved` },
                        { label: 'Total Sales', value: summary?.totalSales || 0 },
                      ].map(r => (
                        <div key={r.label} className="flex justify-between items-center py-1.5 border-b border-white/[0.05] last:border-0">
                          <span className="text-white/40 text-xs">{r.label}</span>
                          <span className="text-white/80 text-xs font-medium">{r.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Payment accounts */}
                    {user?.paymentAccounts?.length > 0 && (
                      <div>
                        <p className="text-white/30 text-[10px] tracking-widest uppercase mb-2">Payment Accounts</p>
                        <div className="space-y-2">
                          {user.paymentAccounts.map((acc, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                              style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${acc.isPrimary ? 'rgba(107,66,38,0.3)' : 'rgba(255,255,255,0.07)'}` }}>
                              <div className="text-base">💳</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-white text-xs font-medium">{acc.method}</p>
                                  {acc.isPrimary && <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                                    style={{ background: 'rgba(107,66,38,0.2)', color: '#C48A5C' }}>Primary</span>}
                                </div>
                                <p className="text-white/50 text-[10px]">{acc.accountName} · {acc.accountNumber}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── Designs ── */}
                {activeTab === 'designs' && (
                  <motion.div key="designs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {designs.length === 0 ? (
                      <p className="text-center text-white/30 text-sm py-12">No designs uploaded yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {designs.map(d => {
                          const s = DESIGN_STATUS[d.status] || DESIGN_STATUS.pending;
                          return (
                            <div key={d._id} className="flex items-center gap-3 p-3 rounded-xl"
                              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0"
                                style={{ background: 'rgba(107,66,38,0.1)' }}>
                                {d.imageUrl
                                  ? <img src={d.imageUrl} alt="" className="w-full h-full object-cover" />
                                  : <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">?</div>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-xs font-medium truncate">{d.title}</p>
                                <p className="text-white/35 text-[10px] mt-0.5">
                                  {new Date(d.createdAt).toLocaleDateString()} · {d.usageCount || 0} sales · {fmt(d.price)}
                                </p>
                              </div>
                              <Badge color={s.color} bg={s.bg}>{s.label}</Badge>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── Earnings ── */}
                {activeTab === 'earnings' && (
                  <motion.div key="earnings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {earnings.length === 0 ? (
                      <p className="text-center text-white/30 text-sm py-12">No earnings yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {earnings.map(e => {
                          const statusColor = e.status === 'paid' ? '#22c55e' : e.status === 'reversed' ? '#ef4444' : '#ca8a04';
                          return (
                            <div key={e._id} className="flex items-center gap-3 p-3 rounded-xl"
                              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                              <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0"
                                style={{ background: 'rgba(107,66,38,0.1)' }}>
                                {e.design?.imageUrl
                                  ? <img src={e.design.imageUrl} alt="" className="w-full h-full object-cover" />
                                  : <div className="w-full h-full" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-xs font-medium truncate">{e.design?.title || 'Design'}</p>
                                <p className="text-white/30 text-[10px]">
                                  Order {e.order?.orderNumber || '—'} · {new Date(e.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-white text-xs font-semibold">{fmt(e.amount)}</p>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full capitalize"
                                  style={{ background: `${statusColor}15`, color: statusColor }}>
                                  {e.status}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── Withdrawals ── */}
                {activeTab === 'withdrawals' && (
                  <motion.div key="withdrawals" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {withdrawals.length === 0 ? (
                      <p className="text-center text-white/30 text-sm py-12">No withdrawal requests yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {withdrawals.map(w => {
                          const ws = WITHDRAWAL_STATUS[w.status] || WITHDRAWAL_STATUS.pending;
                          return (
                            <div key={w._id} className="p-4 rounded-xl space-y-2"
                              style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${ws.bg}` }}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-white text-sm font-bold">{fmt(w.amount)}</span>
                                  <Badge color={ws.color} bg={ws.bg}>{w.status}</Badge>
                                </div>
                                <span className="text-white/30 text-xs">{new Date(w.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-white/40 text-xs">
                                via {w.paymentAccount?.method} · {w.paymentAccount?.accountNumber}
                              </p>
                              {w.adminNote && (
                                <p className="text-white/30 text-xs italic">"{w.adminNote}"</p>
                              )}
                              {w.status === 'pending' && (
                                <div className="flex gap-2 pt-1">
                                  <button
                                    onClick={() => { setActionModal({ type: 'approve', withdrawalId: w._id, amount: w.amount }); setNote(''); }}
                                    className="flex-1 py-1.5 rounded-lg text-xs font-medium"
                                    style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => { setActionModal({ type: 'reject', withdrawalId: w._id, amount: w.amount }); setNote(''); }}
                                    className="flex-1 py-1.5 rounded-lg text-xs font-medium"
                                    style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }}>
                                    Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </motion.div>

      {/* ── Action Modal (approve/reject) ── */}
      <AnimatePresence>
        {actionModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: actionModal.type === 'approve' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)' }}>
                  {actionModal.type === 'approve'
                    ? <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
                    : <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  }
                </div>
                <div>
                  <p className="text-white font-semibold text-sm capitalize">{actionModal.type} Withdrawal</p>
                  <p className="text-white/40 text-xs">{fmt(actionModal.amount)}</p>
                </div>
              </div>
              <div className="mb-4">
                <label className="label">{actionModal.type === 'reject' ? 'Rejection Reason (required)' : 'Admin Note (optional)'}</label>
                <textarea rows={3} className="glass-input resize-none" value={note} onChange={e => setNote(e.target.value)}
                  placeholder={actionModal.type === 'reject' ? 'Explain why this is being rejected…' : 'Payment reference, notes…'} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setActionModal(null)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleAction}
                  disabled={acting || (actionModal.type === 'reject' && !note.trim())}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style={{
                    background: actionModal.type === 'approve'
                      ? 'linear-gradient(135deg,#16a34a,#22c55e)'
                      : 'rgba(239,68,68,0.15)',
                    color: actionModal.type === 'approve' ? '#fff' : '#ef4444',
                    border: actionModal.type === 'reject' ? '1px solid rgba(239,68,68,0.25)' : 'none',
                  }}>
                  {acting && <Spinner size="sm" className="text-current" />}
                  {acting ? '…' : actionModal.type === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Main Page ── */
export default function AdminDesignersPage() {
  const [designers, setDesigners] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('all');
  const [selected,  setSelected]  = useState(null); // userId for drawer

  const load = useCallback(() => {
    setLoading(true);
    api.get('/withdrawals/admin/designers')
      .then(r => setDesigners(r.data.designers || []))
      .catch(() => toast.error('Failed to load designers.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = designers.filter(d => {
    const name = `${d.user.firstName} ${d.user.lastName} ${d.user.email}`.toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase());
    const matchFilter =
      filter === 'all'            ? true :
      filter === 'pending_payout' ? d.earnings.pendingAmount > 0 :
      filter === 'withdrawal'     ? d.withdrawals.count > 0 :
      filter === 'active'         ? d.designs.approved > 0 : true;
    return matchSearch && matchFilter;
  });

  /* Summary stats */
  const totalEarnings  = designers.reduce((s, d) => s + (d.earnings.totalEarned || 0), 0);
  const totalPending   = designers.reduce((s, d) => s + (d.earnings.pendingAmount || 0), 0);
  const totalDesigns   = designers.reduce((s, d) => s + (d.designs.total || 0), 0);
  const withPending    = designers.filter(d => d.withdrawals.count > 0).length;

  return (
    <div className="space-y-6">
      {/* Drawer */}
      <AnimatePresence>
        {selected && (
          <DesignerDrawer
            key={selected}
            userId={selected}
            onClose={() => setSelected(null)}
            onWithdrawalAction={load}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div>
        <p className="text-xs tracking-widest uppercase text-ink-brown mb-1">Creator Network</p>
        <h1 className="font-display text-2xl font-bold text-white">Designers</h1>
        <p className="text-white/30 text-xs mt-1">All users who have uploaded designs to the marketplace</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Designers',    value: designers.length, color: '#fff',     icon: '👥' },
          { label: 'Total Designs',      value: totalDesigns,     color: '#C48A5C',  icon: '🎨' },
          { label: 'Platform Earnings',  value: fmt(totalEarnings), color: '#22c55e', icon: '💰' },
          { label: 'Pending Withdrawals',value: withPending,      color: '#ca8a04',  icon: '⏳' },
        ].map(k => (
          <div key={k.label} className="glass-card p-4 flex items-center gap-3">
            <span className="text-2xl">{k.icon}</span>
            <div>
              <p className="font-display font-bold text-xl" style={{ color: k.color }}>{k.value}</p>
              <p className="text-white/30 text-xs">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all',            label: `All (${designers.length})` },
            { key: 'active',         label: 'Active' },
            { key: 'pending_payout', label: 'Has Earnings' },
            { key: 'withdrawal',     label: 'Pending Withdrawal' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={filter === f.key
                ? { background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', color: '#fff' }
                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.1)' }
              }>
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-shrink-0">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search designers…"
            className="glass-input pl-9 w-56 text-sm"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" className="text-ink-brown" /></div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-4xl mb-3">🎨</p>
          <p className="text-white/50 text-lg font-medium mb-1">No designers found</p>
          <p className="text-white/25 text-sm">Users who upload designs will appear here.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[1fr,auto,auto,auto,auto] gap-4 px-4 py-3 border-b border-white/[0.08]">
            {['Designer', 'Designs', 'Earnings', 'Pending', 'Actions'].map(h => (
              <p key={h} className="text-xs text-white/30 tracking-widest uppercase font-medium">{h}</p>
            ))}
          </div>
          <div className="divide-y divide-white/[0.05]">
            {filtered.map((d, i) => (
              <motion.div key={d._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="flex flex-col sm:grid sm:grid-cols-[1fr,auto,auto,auto,auto] gap-3 sm:gap-4 px-4 py-4 items-start sm:items-center hover:bg-white/[0.02] transition-colors">

                {/* Designer info */}
                <div className="flex items-center gap-3 min-w-0">
                  {d.user.avatar
                    ? <img src={d.user.avatar} alt="" className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
                    : <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
                        {d.user.firstName?.[0]}{d.user.lastName?.[0]}
                      </div>
                  }
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{d.user.firstName} {d.user.lastName}</p>
                    <p className="text-white/40 text-xs truncate">{d.user.email}</p>
                  </div>
                </div>

                {/* Designs */}
                <div className="flex gap-1.5 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
                    {d.designs.approved} approved
                  </span>
                  {d.designs.pending > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(202,138,4,0.1)', color: '#ca8a04' }}>
                      {d.designs.pending} pending
                    </span>
                  )}
                </div>

                {/* Total earned */}
                <p className="text-white text-sm font-semibold">{fmt(d.earnings.totalEarned)}</p>

                {/* Pending */}
                <div>
                  {d.earnings.pendingAmount > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"/>
                      <span className="text-yellow-500 text-xs font-medium">{fmt(d.earnings.pendingAmount)}</span>
                    </div>
                  ) : (
                    <span className="text-white/20 text-xs">—</span>
                  )}
                  {d.withdrawals.count > 0 && (
                    <p className="text-orange-400 text-[10px] mt-0.5">{d.withdrawals.count} req pending</p>
                  )}
                </div>

                {/* Actions */}
                <button
                  onClick={() => setSelected(d.user._id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ background: 'rgba(107,66,38,0.15)', color: '#C48A5C', border: '1px solid rgba(107,66,38,0.25)' }}>
                  View Profile
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
                  </svg>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
