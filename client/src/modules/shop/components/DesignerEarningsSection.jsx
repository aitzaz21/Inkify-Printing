import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../../shared/api/axios';
import { fmt } from '../../../shared/utils/currency';
import { Spinner } from '../../../shared/components/Spinner';

const STATUS_EARNING = {
  pending:  { color: '#ca8a04', label: 'Pending'  },
  paid:     { color: '#22c55e', label: 'Paid'      },
  reversed: { color: '#ef4444', label: 'Reversed'  },
};

const WithdrawalModal = ({ pendingAmount, paymentAccounts, onClose, onSubmit }) => {
  const [selected, setSelected] = useState(paymentAccounts?.find(a => a.isPrimary)?._id || paymentAccounts?.[0]?._id || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const account = paymentAccounts?.find(a => a._id === selected || String(a._id) === selected);
    if (!account) { toast.error('Please select a payment account.'); return; }
    setSubmitting(true);
    try {
      await onSubmit(account);
    } finally { setSubmitting(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.88)' }} onClick={onClose}>
      <motion.div initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.93, opacity: 0 }}
        className="glass-card p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display text-lg font-bold text-white">Request Withdrawal</h3>
            <p className="text-white/40 text-xs mt-0.5">Admin will review and send payment.</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-5 p-4 rounded-xl text-center" style={{ background: 'rgba(107,66,38,0.1)', border: '1px solid rgba(107,66,38,0.2)' }}>
          <p className="text-white/50 text-xs mb-1">Available to withdraw</p>
          <p className="font-display text-3xl font-bold text-ink-brown-light">{fmt(pendingAmount)}</p>
        </div>

        {paymentAccounts?.length > 0 ? (
          <div className="mb-5">
            <label className="label mb-2">Pay to account</label>
            <div className="space-y-2">
              {paymentAccounts.map(acc => (
                <label key={acc._id} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                  style={{
                    background: selected === acc._id || selected === String(acc._id) ? 'rgba(107,66,38,0.15)' : 'rgba(255,255,255,0.04)',
                    border: selected === acc._id || selected === String(acc._id) ? '1px solid rgba(107,66,38,0.35)' : '1px solid rgba(255,255,255,0.08)',
                  }}>
                  <input type="radio" name="account" value={acc._id}
                    checked={selected === acc._id || selected === String(acc._id)}
                    onChange={() => setSelected(acc._id)}
                    className="accent-amber-700" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{acc.method}</p>
                    <p className="text-white/50 text-xs truncate">{acc.accountName}</p>
                    <p className="text-ink-brown-light text-xs font-medium">{acc.accountNumber}</p>
                  </div>
                  {acc.isPrimary && <span className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(107,66,38,0.2)', color: '#C48A5C' }}>Primary</span>}
                </label>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-5 p-4 rounded-xl text-center" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <p className="text-red-400 text-sm">No payment account found. Please add one in the Payment Accounts section first.</p>
          </div>
        )}

        <p className="text-white/30 text-xs mb-4 leading-relaxed">
          Your withdrawal request will be reviewed by admin. Once approved, payment will be sent to your selected account within 3-5 business days.
        </p>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting || !paymentAccounts?.length || !selected}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
            {submitting && <Spinner size="sm" className="text-white" />}
            {submitting ? 'Submitting…' : 'Request Withdrawal'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function DesignerEarningsSection({ paymentAccounts }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showWithdrawal, setShowWithdrawal] = useState(false);
  const [expandedDesign, setExpandedDesign] = useState(null);

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
    <div className="glass-card p-8 flex justify-center">
      <Spinner size="md" className="text-ink-brown" />
    </div>
  );

  const { summary, byDesign = [], recentHistory = [], withdrawals = [] } = data || {};
  const hasPendingWithdrawal = withdrawals.some(w => w.status === 'pending');

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

      <div className="glass-card p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 pb-4 border-b border-white/[0.08]">
          <div>
            <h2 className="font-display text-lg font-semibold text-white">My Earnings</h2>
            <p className="text-white/35 text-xs mt-1">Track your design sales and request payouts.</p>
          </div>
          <button
            onClick={() => setShowWithdrawal(true)}
            disabled={!summary?.pendingAmount || hasPendingWithdrawal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-all duration-200"
            style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', boxShadow: '0 4px 16px rgba(107,66,38,0.3)' }}
            title={hasPendingWithdrawal ? 'You already have a pending withdrawal request' : ''}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" />
            </svg>
            {hasPendingWithdrawal ? 'Request Pending' : 'Withdraw'}
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Earned', value: fmt(summary?.totalEarned || 0), color: '#fff' },
            { label: 'Pending Payout', value: fmt(summary?.pendingAmount || 0), color: '#ca8a04' },
            { label: 'Total Paid Out', value: fmt(summary?.paidAmount || 0), color: '#22c55e' },
            { label: 'Reversals', value: summary?.reversedCount || 0, color: '#ef4444', sub: fmt(summary?.reversedAmount || 0) },
          ].map(k => (
            <div key={k.label} className="rounded-xl p-4 text-center"
              style={{ background: 'rgba(107,66,38,0.07)', border: '1px solid rgba(107,66,38,0.12)' }}>
              <p className="font-display text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
              {k.sub && <p className="text-white/30 text-[10px]">{k.sub} reversed</p>}
              <p className="text-white/40 text-xs mt-1">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Pending withdrawal banner */}
        {hasPendingWithdrawal && (
          <div className="mb-5 p-3 rounded-xl flex items-center gap-3"
            style={{ background: 'rgba(202,138,4,0.08)', border: '1px solid rgba(202,138,4,0.2)' }}>
            <svg className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-yellow-500/80 text-xs">
              You have a pending withdrawal request of <strong>{fmt(withdrawals.find(w => w.status === 'pending')?.amount || 0)}</strong>. Admin is reviewing it.
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/[0.08] mb-5">
          {[
            { key: 'overview',  label: 'By Design' },
            { key: 'history',   label: 'Transaction History' },
            { key: 'payouts',   label: 'Payout History' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="px-4 py-2.5 text-xs font-medium transition-all duration-200"
              style={activeTab === tab.key
                ? { color: '#C48A5C', borderBottom: '2px solid #8B5A3C' }
                : { color: 'rgba(255,255,255,0.35)' }}>
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* By Design tab */}
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {byDesign.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/30 text-sm">No design sales yet. Upload designs to the marketplace to start earning.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {byDesign.map((item, i) => (
                    <div key={item._id} className="rounded-xl overflow-hidden"
                      style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                      <button className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/[0.03] transition-colors"
                        onClick={() => setExpandedDesign(expandedDesign === item._id ? null : item._id)}>
                        <div className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden"
                          style={{ background: 'rgba(107,66,38,0.1)', border: '1px solid rgba(107,66,38,0.15)' }}>
                          {item.design?.imageUrl
                            ? <img src={item.design.imageUrl} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">?</div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{item.design?.title || 'Deleted Design'}</p>
                          <p className="text-white/40 text-xs mt-0.5">{item.salesCount} sale{item.salesCount !== 1 ? 's' : ''} · {item.reversedCount > 0 ? `${item.reversedCount} reversed` : 'no reversals'}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-white font-semibold text-sm">{fmt(item.totalEarned)}</p>
                          {item.pendingAmount > 0 && <p className="text-yellow-500/70 text-xs">{fmt(item.pendingAmount)} pending</p>}
                          {item.paidAmount > 0 && <p className="text-emerald-400/70 text-xs">{fmt(item.paidAmount)} paid</p>}
                        </div>
                        <svg className={`w-4 h-4 text-white/20 flex-shrink-0 transition-transform ${expandedDesign === item._id ? 'rotate-180' : ''}`}
                          fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>
                      <AnimatePresence>
                        {expandedDesign === item._id && (
                          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                            className="overflow-hidden border-t border-white/[0.06]">
                            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {[
                                { label: 'Total Earned', value: fmt(item.totalEarned), color: '#fff' },
                                { label: 'Pending', value: fmt(item.pendingAmount), color: '#ca8a04' },
                                { label: 'Paid', value: fmt(item.paidAmount), color: '#22c55e' },
                                { label: 'Reversed', value: fmt(item.reversedAmount), color: '#ef4444' },
                              ].map(k => (
                                <div key={k.label} className="text-center p-2 rounded-lg"
                                  style={{ background: 'rgba(255,255,255,0.03)' }}>
                                  <p className="font-semibold text-sm" style={{ color: k.color }}>{k.value}</p>
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

          {/* Transaction History tab */}
          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {recentHistory.length === 0 ? (
                <p className="text-center text-white/30 text-sm py-12">No transactions yet.</p>
              ) : (
                <div className="space-y-2">
                  {recentHistory.map((e, i) => {
                    const s = STATUS_EARNING[e.status] || STATUS_EARNING.pending;
                    return (
                      <div key={e._id} className="flex items-center gap-3 p-3 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="w-8 h-8 rounded-lg flex-shrink-0 overflow-hidden"
                          style={{ background: 'rgba(107,66,38,0.1)' }}>
                          {e.design?.imageUrl
                            ? <img src={e.design.imageUrl} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-medium truncate">{e.design?.title || 'Design'}</p>
                          <p className="text-white/30 text-[10px]">
                            Order {e.order?.orderNumber || '—'} · {new Date(e.createdAt).toLocaleDateString()}
                            {e.order?.isReversed && <span className="text-red-400 ml-1">(order reversed)</span>}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-white text-xs font-semibold">{fmt(e.amount)}</p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                            style={{ background: `${s.color}15`, color: s.color }}>
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

          {/* Payout History tab */}
          {activeTab === 'payouts' && (
            <motion.div key="payouts" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {withdrawals.length === 0 ? (
                <p className="text-center text-white/30 text-sm py-12">No withdrawal requests yet.</p>
              ) : (
                <div className="space-y-3">
                  {withdrawals.map(w => (
                    <div key={w._id} className="flex items-center gap-4 p-4 rounded-xl"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: `1px solid ${w.status === 'pending' ? 'rgba(202,138,4,0.2)' : w.status === 'approved' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)'}`,
                      }}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white text-sm font-semibold">{fmt(w.amount)}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                            style={{
                              background: w.status === 'pending' ? 'rgba(202,138,4,0.1)' : w.status === 'approved' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                              color: w.status === 'pending' ? '#ca8a04' : w.status === 'approved' ? '#22c55e' : '#ef4444',
                            }}>
                            {w.status}
                          </span>
                        </div>
                        <p className="text-white/30 text-xs mt-0.5">
                          via {w.paymentAccount?.method} · {w.paymentAccount?.accountNumber}
                        </p>
                        {w.adminNote && <p className="text-white/40 text-xs mt-1 italic">"{w.adminNote}"</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-white/30 text-xs">{new Date(w.createdAt).toLocaleDateString()}</p>
                        {w.processedAt && (
                          <p className="text-white/20 text-[10px]">
                            {w.status === 'approved' ? 'Paid' : 'Rejected'} {new Date(w.processedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
