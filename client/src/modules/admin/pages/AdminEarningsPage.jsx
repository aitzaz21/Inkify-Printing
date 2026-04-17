import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../../shared/api/axios';
import { Spinner } from '../../../shared/components/Spinner';
import { fmt } from '../../../shared/utils/currency';

/* ── Confirmation Modal ── */
const ConfirmPayModal = ({ designer, amount, earningIds, onConfirm, onCancel }) => (
  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background:'rgba(0,0,0,0.88)' }}>
    <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.9, opacity:0 }}
      className="glass-card p-6 max-w-sm w-full">
      <div className="text-center mb-5">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.2)' }}>
          <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="font-display text-lg font-bold text-white">Confirm Payment</h3>
        <p className="text-white/50 text-sm mt-2">
          Mark <span className="text-emerald-400 font-semibold">{fmt(amount)}</span> as paid to{' '}
          <span className="text-white font-medium">{designer}</span>?
        </p>
        <p className="text-white/30 text-xs mt-2">The designer will receive a payment confirmation email.</p>
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button onClick={onConfirm}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
          style={{ background:'linear-gradient(135deg,#22c55e,#16a34a)' }}>
          Confirm & Notify
        </button>
      </div>
    </motion.div>
  </motion.div>
);

/* ── Designer Earnings Card ── */
const DesignerCard = ({ summary, earnings, onMarkPaid }) => {
  const [expanded, setExpanded] = useState(false);
  const { designer, totalEarned, pendingAmount, paidAmount, totalSales } = summary;

  // Filter earnings for this designer
  const myEarnings = earnings.filter(e =>
    String(e.designer?._id) === String(designer._id)
  );
  const pendingEarnings = myEarnings.filter(e => e.status === 'pending');

  return (
    <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
      className="glass-card overflow-hidden">
      {/* Card header */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-display font-bold text-white text-base"
            style={{ background:'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
            {designer.firstName?.[0]}{designer.lastName?.[0]}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <p className="text-white font-semibold text-base">{designer.firstName} {designer.lastName}</p>
                <p className="text-white/45 text-xs">{designer.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${pendingAmount > 0 ? 'text-yellow-400' : 'text-emerald-400'}`}
                  style={{ background: pendingAmount > 0 ? 'rgba(234,179,8,0.1)' : 'rgba(34,197,94,0.1)', border: `1px solid ${pendingAmount > 0 ? 'rgba(234,179,8,0.2)' : 'rgba(34,197,94,0.2)'}` }}>
                  {pendingAmount > 0 ? 'Has Pending' : 'All Paid'}
                </span>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[
                { label:'Total Earned', value: fmt(totalEarned),   color:'#fff' },
                { label:'Pending',      value: fmt(pendingAmount),  color: pendingAmount > 0 ? '#fbbf24' : 'rgba(255,255,255,0.4)' },
                { label:'Paid',         value: fmt(paidAmount),     color:'#4ade80' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-lg p-2.5 text-center"
                  style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                  <p className="font-display font-bold text-sm" style={{ color }}>{value}</p>
                  <p className="text-white/30 text-xs mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4">
          <button onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.5)', border:'1px solid rgba(255,255,255,0.08)' }}>
            <svg className={`w-3.5 h-3.5 transition-transform ${expanded?'rotate-180':''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
            {expanded ? 'Hide' : 'View'} Details ({totalSales} sales)
          </button>

          {pendingAmount > 0 && pendingEarnings.length > 0 && (
            <button
              onClick={() => onMarkPaid(
                `${designer.firstName} ${designer.lastName}`,
                pendingAmount,
                pendingEarnings.map(e => e._id)
              )}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all hover:scale-105"
              style={{ background:'linear-gradient(135deg,#22c55e,#16a34a)', color:'#fff', boxShadow:'0 2px 8px rgba(34,197,94,0.3)' }}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Mark {fmt(pendingAmount)} Paid
            </button>
          )}
        </div>
      </div>

      {/* Expanded earnings detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height:0 }} animate={{ height:'auto' }} exit={{ height:0 }}
            className="overflow-hidden border-t border-white/[0.08]">
            <div className="p-4 space-y-2">
              <p className="text-white/30 text-xs tracking-widest uppercase mb-3">Individual Sales</p>
              {myEarnings.length === 0 ? (
                <p className="text-white/20 text-sm text-center py-4">No earnings recorded yet.</p>
              ) : myEarnings.map((e, i) => (
                <div key={e._id || i} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)' }}>
                  {/* Design thumbnail */}
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0"
                    style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)' }}>
                    {e.design?.imageUrl
                      ? <img src={e.design.imageUrl} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-white/20 text-lg">🎨</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-xs font-medium truncate">{e.design?.title || 'Design'}</p>
                    <p className="text-white/35 text-xs font-mono">{e.order?.orderNumber}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-white text-sm font-semibold">{fmt(e.amount)}</p>
                    <span className={`text-xs font-medium ${e.status==='paid'?'text-emerald-400':'text-yellow-400'}`}>
                      {e.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Account info section */}
            {summary.accountDetails?.length > 0 && (
              <div className="px-4 pb-4">
                <p className="text-white/30 text-xs tracking-widest uppercase mb-3">Payment Account</p>
                {summary.accountDetails.map((acc, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: acc.isPrimary ? 'rgba(107,66,38,0.1)' : 'rgba(255,255,255,0.02)', border:`1px solid ${acc.isPrimary ? 'rgba(107,66,38,0.25)' : 'rgba(255,255,255,0.06)'}` }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background:'rgba(107,66,38,0.15)', border:'1px solid rgba(107,66,38,0.2)' }}>
                      <span className="text-sm">💳</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white/80 text-xs font-medium">{acc.method}</p>
                        {acc.isPrimary && <span className="text-xs px-1.5 py-0.5 rounded-full text-ink-brown"
                          style={{ background:'rgba(107,66,38,0.2)', border:'1px solid rgba(107,66,38,0.3)' }}>Primary</span>}
                      </div>
                      <p className="text-white/55 text-xs">{acc.accountName}</p>
                      <p className="text-white/40 text-xs font-mono">{acc.accountNumber}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No account warning */}
            {(!summary.accountDetails || summary.accountDetails.length === 0) && (
              <div className="px-4 pb-4">
                <div className="flex items-center gap-2 p-3 rounded-xl text-xs"
                  style={{ background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.15)', color:'rgba(239,68,68,0.7)' }}>
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  Designer has not added payment account details yet.
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ── Top Designs Tab ── */
const TopDesignsTab = ({ designs }) => (
  <div className="space-y-3">
    {designs.length === 0 ? (
      <div className="glass-card p-10 text-center text-white/30">No data yet.</div>
    ) : designs.map((d, i) => (
      <motion.div key={i} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
        className="glass-card p-4 flex items-center gap-4">
        <span className="font-display font-bold text-2xl text-ink-brown/60 w-8 flex-shrink-0">#{i+1}</span>
        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
          style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)' }}>
          {d.design?.imageUrl
            ? <img src={d.design.imageUrl} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-xl">🎨</div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm truncate">{d.design?.title}</p>
          <p className="text-white/40 text-xs">{d.creator?.firstName} {d.creator?.lastName}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-white font-bold text-sm">{d.sales} <span className="text-white/35 font-normal text-xs">sales</span></p>
          <p className="text-emerald-400 text-sm font-semibold">{fmt(d.revenue)}</p>
        </div>
      </motion.div>
    ))}
  </div>
);

/* ── Main Page ── */
export default function AdminEarningsPage() {
  const [tab,        setTab]        = useState('designers');
  const [summaries,  setSummaries]  = useState([]);
  const [earnings,   setEarnings]   = useState([]);
  const [topDesigns, setTopDesigns] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [confirmPay, setConfirmPay] = useState(null); // { designer, amount, earningIds }
  const [marking,    setMarking]    = useState(false);

  // Fetch summaries including account details via aggregate
  const loadAll = async () => {
    setLoading(true);
    try {
      const [sumRes, earnRes] = await Promise.all([
        api.get('/designer-earnings/summaries-with-accounts'),
        api.get('/designer-earnings?limit=200'),
      ]);
      setSummaries(sumRes.data.summaries || []);
      setEarnings(earnRes.data.earnings || []);
    } catch {
      toast.error('Failed to load earnings.');
    } finally { setLoading(false); }
  };

  const loadAnalytics = () => {
    setLoading(true);
    api.get('/designer-earnings/top-designs?limit=10')
      .then(r => setTopDesigns(r.data.designs || []))
      .catch(() => toast.error('Failed to load analytics.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (tab === 'designers') loadAll();
    else loadAnalytics();
  }, [tab]);

  const handleMarkPaid = async () => {
    if (!confirmPay) return;
    setMarking(true);
    try {
      await api.patch('/designer-earnings/mark-paid', { earningIds: confirmPay.earningIds });
      toast.success('Earnings marked as paid. Designer notified by email!');
      setConfirmPay(null);
      loadAll();
    } catch {
      toast.error('Failed to mark as paid.');
    } finally { setMarking(false); }
  };

  const totalPending = summaries.reduce((s, d) => s + (d.pendingAmount || 0), 0);
  const totalPaid    = summaries.reduce((s, d) => s + (d.paidAmount    || 0), 0);
  const totalSales   = summaries.reduce((s, d) => s + (d.totalSales    || 0), 0);

  const TABS = [
    { id:'designers', label:'Designer Payouts' },
    { id:'analytics', label:'Top Designs'      },
  ];

  return (
    <div className="space-y-6">
      {/* Confirm payment modal */}
      <AnimatePresence>
        {confirmPay && (
          <ConfirmPayModal
            designer={confirmPay.designer}
            amount={confirmPay.amount}
            earningIds={confirmPay.earningIds}
            onConfirm={handleMarkPaid}
            onCancel={() => setConfirmPay(null)}
          />
        )}
      </AnimatePresence>

      <div>
        <p className="text-xs tracking-widest uppercase text-ink-brown mb-1">Finance</p>
        <h1 className="font-display text-2xl font-bold text-white">Designer Earnings</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label:'Pending Payouts',   value: fmt(totalPending), color:'#fbbf24', icon:'⏳' },
          { label:'Total Paid Out',    value: fmt(totalPaid),    color:'#4ade80', icon:'✅' },
          { label:'Total Design Sales',value: totalSales,        color:'#60a5fa', icon:'📈' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="glass-card p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background:`${color}15`, border:`1px solid ${color}25` }}>
              <span style={{ color }}>{icon}</span>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-white">{value}</p>
              <p className="text-white/40 text-xs mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit"
        style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150"
            style={tab === t.id
              ? { background:'linear-gradient(135deg,#6B4226,#8B5A3C)', color:'#fff' }
              : { color:'rgba(255,255,255,0.4)' }
            }>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" className="text-ink-brown" /></div>
      ) : tab === 'designers' ? (
        summaries.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <p className="text-white/30 text-lg mb-2">No designer earnings yet</p>
            <p className="text-white/20 text-sm">Earnings appear here when customers purchase marketplace designs.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {summaries.map((s, i) => (
              <DesignerCard
                key={String(s.designer._id)}
                summary={s}
                earnings={earnings}
                onMarkPaid={(designer, amount, earningIds) =>
                  setConfirmPay({ designer, amount, earningIds })}
              />
            ))}
          </div>
        )
      ) : (
        <TopDesignsTab designs={topDesigns} />
      )}
    </div>
  );
}
