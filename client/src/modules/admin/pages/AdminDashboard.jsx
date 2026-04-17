import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { orderAPI } from '../../orders/services/order.service';
import { Spinner } from '../../../shared/components/Spinner';
import { fmt } from '../../../shared/utils/currency';

const StatCard = ({ label, value, sub, color, icon, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
    className="glass-card p-5 flex items-start gap-4"
  >
    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
      <span style={{ color }}>{icon}</span>
    </div>
    <div>
      <p className="font-display text-2xl font-bold text-white">{value ?? '—'}</p>
      <p className="text-white/45 text-xs mt-0.5">{label}</p>
      {sub && <p className="text-white/20 text-xs">{sub}</p>}
    </div>
  </motion.div>
);

const STATUS_COLORS = {
  pending:    '#ca8a04',
  confirmed:  '#3b82f6',
  processing: '#a855f7',
  dispatched: '#f97316',
  delivered:  '#22c55e',
  cancelled:  '#ef4444',
};

const BarChart = ({ data, maxVal }) => {
  if (!data?.length) return <p className="text-white/20 text-sm text-center py-8">No data yet</p>;
  const max = maxVal || Math.max(...data.map(d => d.revenue), 1);
  return (
    <div className="flex items-end gap-1.5 h-40 px-2">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-t-md transition-all duration-500"
            style={{
              height: `${Math.max((d.revenue / max) * 100, 4)}%`,
              background: 'linear-gradient(to top, #6B4226, #8B5A3C)',
              minHeight: '4px',
            }} />
          <span className="text-[9px] text-white/25 truncate w-full text-center">{d._id?.slice(5)}</span>
        </div>
      ))}
    </div>
  );
};

const StatusBar = ({ stats }) => {
  const items = [
    { key: 'pendingOrders',    label: 'Pending',    color: STATUS_COLORS.pending },
    { key: 'confirmedOrders',  label: 'Confirmed',  color: STATUS_COLORS.confirmed },
    { key: 'processingOrders', label: 'Processing', color: STATUS_COLORS.processing },
    { key: 'dispatchedOrders', label: 'Dispatched', color: STATUS_COLORS.dispatched },
    { key: 'deliveredOrders',  label: 'Delivered',  color: STATUS_COLORS.delivered },
    { key: 'cancelledOrders',  label: 'Cancelled',  color: STATUS_COLORS.cancelled },
  ];
  const total = items.reduce((s, i) => s + (stats?.[i.key] || 0), 0) || 1;
  return (
    <div className="space-y-3">
      {/* Visual bar */}
      <div className="flex rounded-full h-3 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        {items.map(item => {
          const val = stats?.[item.key] || 0;
          if (val === 0) return null;
          return <div key={item.key} style={{ width: `${(val / total) * 100}%`, background: item.color }} />;
        })}
      </div>
      {/* Legend */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {items.map(item => (
          <div key={item.key} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
            <div>
              <p className="text-white font-bold text-sm">{stats?.[item.key] || 0}</p>
              <p className="text-white/30 text-[10px]">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderAPI.getStats()
      .then(r => setStats(r.data.stats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" className="text-ink-brown" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-widest uppercase text-ink-brown mb-1">Overview</p>
        <h1 className="font-display text-2xl font-bold text-white">Dashboard</h1>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Orders" value={stats?.totalOrders} color="#6B4226" delay={0}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>} />
        <StatCard label="Registered Users" value={stats?.totalUsers} color="#3b82f6" delay={0.05}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>} />
        <StatCard label="Revenue (paid)" value={stats?.revenue ? fmt(stats.revenue) : 'PKR 0'} color="#22c55e" delay={0.1}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard label="Live Designs" value={stats?.totalDesigns} color="#a855f7" delay={0.15}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg>} />
      </div>

      {/* Revenue & payouts row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Revenue from Orders — prominently shown */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
          className="glass-card p-5 flex items-start gap-4 sm:col-span-1"
          style={{ border:'1px solid rgba(34,197,94,0.2)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.25)' }}>
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          </div>
          <div>
            <p className="font-display text-2xl font-bold text-emerald-400">{fmt(stats?.revenue || 0)}</p>
            <p className="text-white/45 text-xs mt-0.5">Total Revenue (paid orders)</p>
            <p className="text-white/25 text-xs mt-1">{stats?.deliveredOrders || 0} delivered orders</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }}
          className="glass-card p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:'rgba(251,191,36,0.12)', border:'1px solid rgba(251,191,36,0.2)' }}>
            <span className="text-yellow-400">⏳</span>
          </div>
          <div>
            <p className="font-display text-2xl font-bold text-yellow-400">{fmt(stats?.designerPayouts?.totalPending || 0)}</p>
            <p className="text-white/45 text-xs mt-0.5">Pending Designer Payouts</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
          className="glass-card p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:'rgba(74,222,128,0.12)', border:'1px solid rgba(74,222,128,0.2)' }}>
            <span className="text-emerald-400">✅</span>
          </div>
          <div>
            <p className="font-display text-2xl font-bold text-emerald-400">{fmt(stats?.designerPayouts?.totalPaid || 0)}</p>
            <p className="text-white/45 text-xs mt-0.5">Total Paid to Designers</p>
          </div>
        </motion.div>
      </div>

      {/* Order status breakdown */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
        className="glass-card p-6">
        <h2 className="font-display text-base font-semibold text-white mb-4">Order Status Breakdown</h2>
        <StatusBar stats={stats} />
      </motion.div>

      {/* Monthly Revenue Chart */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}
        className="glass-card p-6">
        <h2 className="font-display text-base font-semibold text-white mb-4">Monthly Revenue</h2>
        <BarChart data={stats?.monthlyRevenue} />
      </motion.div>

      {/* Recent orders */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
          <h2 className="font-display text-base font-semibold text-white">Recent Orders</h2>
          <Link to="/admin/orders" className="text-xs text-ink-brown-light hover:text-white transition-colors">View all →</Link>
        </div>
        {stats?.recentOrders?.length ? (
          <div className="divide-y divide-white/5">
            {stats.recentOrders.map((order) => (
              <div key={order._id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-white text-sm font-medium">{order.orderNumber}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: `${STATUS_COLORS[order.status]}15`, color: STATUS_COLORS[order.status] }}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-white/35 text-xs truncate">{order.user?.firstName} {order.user?.lastName} · {order.user?.email}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-white font-medium text-sm">{fmt(order.total)}</p>
                  <p className="text-white/25 text-xs">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-white/30 py-10 text-sm">No orders yet.</p>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: '/admin/orders',   label: 'Manage Orders',   desc: 'Update status, view designs' },
          { to: '/admin/users',    label: 'Manage Users',    desc: 'Create, search, view history' },
          { to: '/admin/reviews',  label: 'Manage Reviews',  desc: 'Feature reviews on homepage' },
        ].map((item, i) => (
          <motion.div key={item.to} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 + i * 0.07 }}>
            <Link to={item.to} className="block glass-card p-5 hover:border-ink-brown/35 transition-all duration-200 group">
              <p className="text-white font-medium text-sm group-hover:text-ink-brown-light transition-colors">{item.label}</p>
              <p className="text-white/35 text-xs mt-1">{item.desc}</p>
              <svg className="w-4 h-4 text-white/20 group-hover:text-ink-brown mt-3 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
