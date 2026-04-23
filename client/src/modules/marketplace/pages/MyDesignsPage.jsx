import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { designAPI } from '../services/design.service';
import { Spinner } from '../../../shared/components/Spinner';
import api from '../../../shared/api/axios';
import { fmt } from '../../../shared/utils/currency';
import { useAuth } from '../../../shared/hooks/useAuthContext';

// ── Status badge ──────────────────────────────────────────────────
const STATUS = {
  pending:  { label: 'Under Review', color: '#ca8a04', bg: 'rgba(234,179,8,0.12)'  },
  approved: { label: 'Live',          color: '#22c55e', bg: 'rgba(34,197,94,0.12)'  },
  rejected: { label: 'Rejected',      color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
};

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.pending;
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

// ── Earning status config ─────────────────────────────────────────
const STATUS_EARNING = {
  pending:  { color: '#ca8a04', label: 'Pending'  },
  paid:     { color: '#22c55e', label: 'Paid'      },
  reversed: { color: '#ef4444', label: 'Reversed'  },
};

// ── Withdrawal modal ──────────────────────────────────────────────
function WithdrawalModal({ pendingAmount, paymentAccounts, onClose, onSubmit }) {
  const [selected, setSelected]   = useState(
    paymentAccounts?.find(a => a.isPrimary)?._id || paymentAccounts?.[0]?._id || ''
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const account = paymentAccounts?.find(a => String(a._id) === String(selected));
    if (!account) { toast.error('Please select a payment account.'); return; }
    setSubmitting(true);
    try { await onSubmit(account); }
    finally { setSubmitting(false); }
  };

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(0,0,0,0.88)', backdropFilter:'blur(6px)' }}
      onClick={onClose}>
      <motion.div initial={{ scale:0.93, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.93, opacity:0 }}
        className="glass-card p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display text-lg font-bold text-white">Request Withdrawal</h3>
            <p className="text-white/40 text-xs mt-0.5">Admin will review and send payment.</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-5 p-4 rounded-xl text-center"
          style={{ background:'rgba(107,66,38,0.10)', border:'1px solid rgba(107,66,38,0.20)' }}>
          <p className="text-white/50 text-xs mb-1">Available to withdraw</p>
          <p className="font-display text-3xl font-bold" style={{ color:'#C9967A' }}>{fmt(pendingAmount)}</p>
        </div>

        {paymentAccounts?.length > 0 ? (
          <div className="mb-5 space-y-2">
            <label className="label">Pay to account</label>
            {paymentAccounts.map(acc => (
              <label key={String(acc._id)} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                style={{
                  background: String(selected) === String(acc._id) ? 'rgba(107,66,38,0.15)' : 'rgba(255,255,255,0.04)',
                  border:     String(selected) === String(acc._id) ? '1px solid rgba(107,66,38,0.35)' : '1px solid rgba(255,255,255,0.08)',
                }}>
                <input type="radio" name="account" value={String(acc._id)}
                  checked={String(selected) === String(acc._id)}
                  onChange={() => setSelected(acc._id)}
                  className="accent-amber-700" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{acc.method}</p>
                  <p className="text-white/50 text-xs truncate">{acc.accountName}</p>
                  <p className="text-[#C9967A] text-xs font-medium">{acc.accountNumber}</p>
                </div>
                {acc.isPrimary && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background:'rgba(107,66,38,0.20)', color:'#C48A5C' }}>Primary</span>
                )}
              </label>
            ))}
          </div>
        ) : (
          <div className="mb-5 p-4 rounded-xl text-center"
            style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.15)' }}>
            <p className="text-red-400 text-sm">No payment account found.</p>
            <Link to="/profile" className="text-[#C9967A] text-xs mt-1 block hover:text-white transition-colors">
              Add one in your Profile →
            </Link>
          </div>
        )}

        <p className="text-white/30 text-xs mb-4 leading-relaxed">
          Admin will review your request and send payment within 3–5 business days.
        </p>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSubmit}
            disabled={submitting || !paymentAccounts?.length || !selected}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
            style={{ background:'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
            {submitting && <Spinner size="sm" className="text-white" />}
            {submitting ? 'Submitting…' : 'Request Withdrawal'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Earnings section (inline, not imported from profile) ──────────
function EarningsSection({ paymentAccounts }) {
  const [data,            setData]            = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [activeTab,       setActiveTab]       = useState('overview');
  const [showWithdrawal,  setShowWithdrawal]  = useState(false);
  const [expandedDesign,  setExpandedDesign]  = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/withdrawals/my-earnings')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleWithdrawal = async (paymentAccount) => {
    try {
      await api.post('/withdrawals/withdraw', { paymentAccount });
      toast.success('Withdrawal request submitted! Admin will review it shortly.');
      setShowWithdrawal(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to submit request.');
    }
  };

  if (loading) return (
    <div className="flex justify-center py-16">
      <Spinner size="lg" className="text-ink-brown" />
    </div>
  );

  const { summary, byDesign = [], recentHistory = [], withdrawals = [] } = data || {};
  const hasPendingWithdrawal = withdrawals.some(w => w.status === 'pending');
  const totalSales = byDesign.reduce((s, d) => s + (d.salesCount || 0), 0);

  return (
    <>
      <AnimatePresence>
        {showWithdrawal && (
          <WithdrawalModal
            pendingAmount={summary?.pendingAmount || 0}
            paymentAccounts={paymentAccounts}
            onClose={() => setShowWithdrawal(false)}
            onSubmit={handleWithdrawal}
          />
        )}
      </AnimatePresence>

      {/* ── KPI Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Earned',   value: fmt(summary?.totalEarned  || 0), color: '#fff',      icon: '💰' },
          { label: 'Pending Payout', value: fmt(summary?.pendingAmount || 0), color: '#ca8a04',  icon: '⏳' },
          { label: 'Total Paid Out', value: fmt(summary?.paidAmount    || 0), color: '#22c55e',  icon: '✅' },
          { label: 'Total Sales',    value: totalSales,                        color: '#C9967A',  icon: '📦' },
        ].map(k => (
          <div key={k.label} className="rounded-2xl p-4 flex flex-col gap-2"
            style={{ background:'rgba(107,66,38,0.08)', border:'1px solid rgba(107,66,38,0.18)' }}>
            <span className="text-xl">{k.icon}</span>
            <p className="font-display text-xl sm:text-2xl font-bold truncate" style={{ color: k.color }}>
              {k.value}
            </p>
            <p className="text-white/45 text-xs">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Pending withdrawal banner */}
      {hasPendingWithdrawal && (
        <div className="mb-5 p-3.5 rounded-xl flex items-center gap-3"
          style={{ background:'rgba(202,138,4,0.08)', border:'1px solid rgba(202,138,4,0.2)' }}>
          <svg className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-yellow-500/80 text-xs flex-1">
            Pending withdrawal of <strong>{fmt(withdrawals.find(w => w.status === 'pending')?.amount || 0)}</strong> — admin is reviewing it.
          </p>
        </div>
      )}

      {/* ── Sub-tabs ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-0 border-b border-white/[0.07] w-full">
          {[
            { key: 'overview', label: 'By Design'           },
            { key: 'history',  label: 'Transaction History' },
            { key: 'payouts',  label: 'Payout History'      },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="px-4 py-2.5 text-xs font-semibold transition-all duration-150 whitespace-nowrap"
              style={activeTab === tab.key
                ? { color:'#C48A5C', borderBottom:'2px solid #8B5A3C', marginBottom: '-1px' }
                : { color:'rgba(255,255,255,0.35)' }
              }>
              {tab.label}
            </button>
          ))}
          {/* Withdraw button — right side */}
          <div className="flex-1 flex justify-end pb-1">
            <button
              onClick={() => setShowWithdrawal(true)}
              disabled={!summary?.pendingAmount || hasPendingWithdrawal}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold text-white disabled:opacity-40 transition-all"
              style={{ background:'linear-gradient(135deg,#6B4226,#8B5A3C)' }}
              title={hasPendingWithdrawal ? 'Withdrawal already pending' : ''}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" />
              </svg>
              {hasPendingWithdrawal ? 'Pending' : 'Withdraw'}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* By Design */}
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
            {byDesign.length === 0 ? (
              <div className="text-center py-12 rounded-2xl"
                style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-3xl mb-3">📊</p>
                <p className="text-white/40 text-sm">No design sales yet.</p>
                <p className="text-white/25 text-xs mt-1">When customers buy your designs, earnings will appear here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {byDesign.map(item => (
                  <div key={item._id} className="rounded-xl overflow-hidden"
                    style={{ border:'1px solid rgba(255,255,255,0.07)', background:'rgba(18,14,10,0.6)' }}>
                    <button className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/[0.025] transition-colors"
                      onClick={() => setExpandedDesign(expandedDesign === item._id ? null : item._id)}>
                      {/* Design thumbnail */}
                      <div className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden"
                        style={{ background:'rgba(107,66,38,0.12)', border:'1px solid rgba(107,66,38,0.18)' }}>
                        {item.design?.imageUrl
                          ? <img src={item.design.imageUrl} alt="" className="w-full h-full object-cover"/>
                          : <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">?</div>
                        }
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">
                          {item.design?.title || 'Deleted Design'}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-white/40 text-xs">{item.salesCount} sale{item.salesCount !== 1 ? 's' : ''}</span>
                          {item.reversedCount > 0 && (
                            <span className="text-red-400/60 text-xs">{item.reversedCount} reversed</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="text-white font-bold text-sm">{fmt(item.totalEarned)}</p>
                        {item.pendingAmount > 0 && (
                          <p className="text-yellow-400/70 text-xs whitespace-nowrap">{fmt(item.pendingAmount)} pending</p>
                        )}
                        {item.paidAmount > 0 && (
                          <p className="text-emerald-400/70 text-xs whitespace-nowrap">{fmt(item.paidAmount)} paid</p>
                        )}
                      </div>

                      <svg className={`w-4 h-4 text-white/20 flex-shrink-0 transition-transform ml-1 ${expandedDesign === item._id ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>

                    <AnimatePresence>
                      {expandedDesign === item._id && (
                        <motion.div initial={{ height:0 }} animate={{ height:'auto' }} exit={{ height:0 }}
                          className="overflow-hidden" style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                          <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                              { label:'Total Earned', value: fmt(item.totalEarned),   color:'#fff'      },
                              { label:'Pending',      value: fmt(item.pendingAmount), color:'#ca8a04'   },
                              { label:'Paid Out',     value: fmt(item.paidAmount),    color:'#22c55e'   },
                              { label:'Reversed',     value: fmt(item.reversedAmount),color:'#ef4444'   },
                            ].map(k => (
                              <div key={k.label} className="text-center p-2.5 rounded-xl"
                                style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                                <p className="font-bold text-sm" style={{ color:k.color }}>{k.value}</p>
                                <p className="text-white/30 text-[10px] mt-0.5">{k.label}</p>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Transaction History */}
        {activeTab === 'history' && (
          <motion.div key="history" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
            {recentHistory.length === 0 ? (
              <div className="text-center py-12 rounded-2xl"
                style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-3xl mb-3">📋</p>
                <p className="text-white/40 text-sm">No transactions yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentHistory.map(e => {
                  const s = STATUS_EARNING[e.status] || STATUS_EARNING.pending;
                  return (
                    <div key={e._id} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                      <div className="w-9 h-9 rounded-xl flex-shrink-0 overflow-hidden"
                        style={{ background:'rgba(107,66,38,0.12)', border:'1px solid rgba(107,66,38,0.15)' }}>
                        {e.design?.imageUrl
                          ? <img src={e.design.imageUrl} alt="" className="w-full h-full object-cover"/>
                          : <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">?</div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-semibold truncate">
                          {e.design?.title || 'Design'}
                        </p>
                        <p className="text-white/35 text-[10px] mt-0.5">
                          Order {e.order?.orderNumber || '—'} · {new Date(e.createdAt).toLocaleDateString()}
                          {e.order?.isReversed && <span className="text-red-400 ml-1">(reversed)</span>}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-white text-sm font-bold">{fmt(e.amount)}</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{ background:`${s.color}18`, color:s.color }}>
                          {s.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Payout History */}
        {activeTab === 'payouts' && (
          <motion.div key="payouts" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
            {withdrawals.length === 0 ? (
              <div className="text-center py-12 rounded-2xl"
                style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-3xl mb-3">💳</p>
                <p className="text-white/40 text-sm">No withdrawal requests yet.</p>
                {!!summary?.pendingAmount && (
                  <button onClick={() => setShowWithdrawal(true)}
                    className="mt-3 text-[#C9967A] text-xs hover:text-white transition-colors">
                    Request your first withdrawal →
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawals.map(w => {
                  const stColor = w.status === 'pending' ? '#ca8a04' : w.status === 'approved' ? '#22c55e' : '#ef4444';
                  return (
                    <div key={w._id} className="flex items-center gap-4 p-4 rounded-xl"
                      style={{
                        background:'rgba(255,255,255,0.03)',
                        border:`1px solid ${stColor}22`,
                      }}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-white font-bold">{fmt(w.amount)}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
                            style={{ background:`${stColor}15`, color:stColor }}>
                            {w.status}
                          </span>
                        </div>
                        <p className="text-white/35 text-xs">
                          via {w.paymentAccount?.method} · {w.paymentAccount?.accountNumber}
                        </p>
                        {w.adminNote && (
                          <p className="text-white/40 text-xs mt-1 italic">"{w.adminNote}"</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-white/35 text-xs">
                          {new Date(w.createdAt).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}
                        </p>
                        {w.processedAt && (
                          <p className="text-white/20 text-[10px] mt-0.5">
                            {w.status === 'approved' ? 'Paid' : 'Rejected'} {new Date(w.processedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────
const DESIGN_TABS = ['all', 'approved', 'pending', 'rejected'];

export default function MyDesignsPage() {
  const { user }                        = useAuth();
  const [designs,    setDesigns]        = useState([]);
  const [loading,    setLoading]        = useState(true);
  const [deleting,   setDeleting]       = useState('');
  const [statusTab,  setStatusTab]      = useState('all');
  const [searchInput, setSearchInput]   = useState('');
  const [search,     setSearch]         = useState('');
  const [pageTab,    setPageTab]        = useState('designs'); // 'designs' | 'earnings'
  const [paymentAccounts, setPaymentAccounts] = useState([]);

  const load = useCallback(() => {
    setLoading(true);
    designAPI.getMyDesigns()
      .then(r => setDesigns(r.data.designs || []))
      .catch(() => toast.error('Failed to load designs.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Fetch payment accounts for withdrawal modal
  useEffect(() => {
    api.get('/users/me')
      .then(r => setPaymentAccounts(r.data.user?.paymentAccounts || []))
      .catch(() => {});
  }, []);

  const filtered = designs.filter(d => {
    if (statusTab !== 'all' && d.status !== statusTab) return false;
    if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const tabCounts = {
    all:      designs.length,
    approved: designs.filter(d => d.status === 'approved').length,
    pending:  designs.filter(d => d.status === 'pending').length,
    rejected: designs.filter(d => d.status === 'rejected').length,
  };

  const totalSales = designs.reduce((s, d) => s + (d.usageCount || 0), 0);
  const liveCount  = tabCounts.approved;

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this design permanently?')) return;
    setDeleting(id);
    try {
      await designAPI.delete(id);
      setDesigns(prev => prev.filter(d => d._id !== id));
      toast.success('Design deleted.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed.');
    } finally {
      setDeleting('');
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">

        {/* ── Page header ─────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <p className="text-xs tracking-widest uppercase text-[#C9967A] mb-1 font-semibold">Portfolio</p>
            <h1 className="font-display text-3xl font-bold text-white">My Designs</h1>
          </div>
          <Link to="/marketplace/upload"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5 flex-shrink-0"
            style={{ background:'linear-gradient(135deg,#6B4226,#8B5A3C)', boxShadow:'0 4px 16px rgba(107,66,38,0.35)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Upload New
          </Link>
        </div>

        {/* ── Quick stats strip ────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label:'Total Designs', value: designs.length,         icon:'🎨', color:'text-white'      },
            { label:'Live Now',      value: liveCount,               icon:'✅', color:'text-emerald-400' },
            { label:'Total Sold',    value: totalSales,              icon:'📦', color:'text-[#C9967A]'  },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4 text-center"
              style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-xl">{s.icon}</span>
              <p className={`font-display text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              <p className="text-white/40 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Page-level tabs: Designs / Earnings ─────────────── */}
        <div className="flex gap-1 p-1 rounded-xl mb-6"
          style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
          {[
            { id:'designs',  label:'My Designs',  icon:'🎨' },
            { id:'earnings', label:'Earnings & Payouts', icon:'💰' },
          ].map(t => (
            <button key={t.id} onClick={() => setPageTab(t.id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150"
              style={pageTab === t.id
                ? { background:'linear-gradient(135deg,#6B4226,#8B5A3C)', color:'#fff' }
                : { color:'rgba(255,255,255,0.45)' }
              }>
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── DESIGNS tab ──────────────────────────────────────── */}
        {pageTab === 'designs' && (
          <>
            {/* Status filter + search */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between mb-5">
              <div className="flex gap-1 p-1 rounded-xl"
                style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                {DESIGN_TABS.map(t => (
                  <button key={t} onClick={() => setStatusTab(t)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize"
                    style={statusTab === t
                      ? { background:'linear-gradient(135deg,#6B4226,#8B5A3C)', color:'#fff' }
                      : { color:'rgba(255,255,255,0.42)' }
                    }>
                    {t} ({tabCounts[t]})
                  </button>
                ))}
              </div>
              <form onSubmit={e => { e.preventDefault(); setSearch(searchInput.trim()); }} className="flex gap-2">
                <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
                  placeholder="Search designs…" className="glass-input py-1.5 text-sm w-44" />
                {search && (
                  <button type="button" onClick={() => { setSearch(''); setSearchInput(''); }}
                    className="text-white/30 hover:text-white text-xs transition-colors">
                    Clear
                  </button>
                )}
              </form>
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><Spinner size="lg" className="text-ink-brown"/></div>
            ) : filtered.length === 0 ? (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                className="text-center py-20 rounded-3xl"
                style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-5xl mb-4">🎨</p>
                <h3 className="font-display text-xl font-bold text-white mb-2">
                  {search ? 'No designs match your search' : statusTab !== 'all' ? `No ${statusTab} designs` : 'No designs yet'}
                </h3>
                <p className="text-white/40 text-sm mb-6">
                  {statusTab === 'all' ? 'Upload your first design to the marketplace.' : ''}
                </p>
                {statusTab === 'all' && (
                  <Link to="/marketplace/upload" className="btn-primary w-auto inline-flex px-8 items-center gap-2">
                    Upload First Design
                  </Link>
                )}
              </motion.div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <AnimatePresence>
                  {filtered.map((d, i) => (
                    <motion.div key={d._id} layout
                      initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }}
                      exit={{ opacity:0, scale:0.9 }}
                      transition={{ delay: i * 0.04, duration:0.32 }}
                      className="rounded-2xl overflow-hidden group transition-all duration-300 hover:-translate-y-1"
                      style={{
                        background:'rgba(18,14,10,0.82)',
                        border:'1px solid rgba(107,66,38,0.22)',
                        boxShadow:'0 4px 16px rgba(0,0,0,0.4)',
                      }}>

                      {/* Image */}
                      <div className="relative w-full" style={{ paddingBottom:'100%' }}>
                        <img src={d.imageUrl} alt={d.title}
                          className="absolute inset-0 w-full h-full object-contain p-3"
                          style={{ background:'rgba(255,255,255,0.02)' }} />

                        {/* Sales badge */}
                        {d.usageCount > 0 && (
                          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full"
                            style={{ background:'rgba(107,66,38,0.85)', backdropFilter:'blur(4px)' }}>
                            <span className="text-[9px] font-bold text-white">{d.usageCount} sold</span>
                          </div>
                        )}

                        {/* Hover overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          style={{ background:'rgba(11,11,11,0.65)', backdropFilter:'blur(4px)' }}>
                          {deleting === d._id ? (
                            <Spinner size="sm" className="text-white"/>
                          ) : (
                            <button onClick={() => handleDelete(d._id)}
                              className="w-9 h-9 rounded-xl flex items-center justify-center text-red-400/80 hover:text-red-400 transition-colors"
                              style={{ background:'rgba(239,68,68,0.18)', border:'1px solid rgba(239,68,68,0.3)' }}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-3.5">
                        <div className="flex items-start justify-between gap-1.5 mb-1.5">
                          <h3 className="font-display text-xs font-semibold text-white leading-snug truncate">{d.title}</h3>
                          <span className="font-bold text-white/80 text-xs flex-shrink-0">
                            {d.price === 0 ? 'Free' : `PKR ${Math.round(d.price).toLocaleString()}`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <StatusBadge status={d.status}/>
                          <span className="text-white/25 text-[10px]">
                            {new Date(d.createdAt).toLocaleDateString('en-US', { month:'short', day:'numeric' })}
                          </span>
                        </div>
                        {/* Rejection note */}
                        {d.status === 'rejected' && d.adminNote && (
                          <p className="text-red-400/60 text-xs mt-2 leading-relaxed line-clamp-2">{d.adminNote}</p>
                        )}
                        {/* Sales count (visible when approved) */}
                        {d.status === 'approved' && (
                          <p className="text-white/30 text-[10px] mt-1.5">
                            {d.usageCount > 0
                              ? <span className="text-[#C9967A]">{d.usageCount} time{d.usageCount !== 1 ? 's' : ''} sold</span>
                              : 'Not sold yet'
                            }
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}

        {/* ── EARNINGS tab ─────────────────────────────────────── */}
        {pageTab === 'earnings' && (
          <motion.div key="earnings" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}>
            <EarningsSection paymentAccounts={paymentAccounts} />
          </motion.div>
        )}

      </div>
    </div>
  );
}
