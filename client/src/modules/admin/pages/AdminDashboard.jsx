import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { orderAPI } from '../../orders/services/order.service';
import { Spinner } from '../../../shared/components/Spinner';
import { fmt } from '../../../shared/utils/currency';

const STATUS_COLORS = {
  pending:    '#ca8a04', confirmed: '#3b82f6', processing: '#a855f7',
  dispatched: '#f97316', delivered: '#22c55e', cancelled:  '#ef4444',
};

const KPI = ({ label, value, sub, color = '#6B4226', icon, trend, delay = 0, to }) => {
  const card = (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }}
      className="glass-card p-5 flex flex-col gap-3 group transition-all duration-200 hover:border-white/15"
    >
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18`, border: `1px solid ${color}28` }}>
          <span style={{ color }}>{icon}</span>
        </div>
        {trend !== undefined && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: trend >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: trend >= 0 ? '#22c55e' : '#ef4444' }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p className="font-display text-2xl font-bold text-white leading-none mb-1">{value ?? <span className="text-white/30">—</span>}</p>
        <p className="text-white/45 text-xs">{label}</p>
        {sub && <p className="text-white/20 text-[10px] mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
  return to ? <Link to={to}>{card}</Link> : card;
};

const MiniBar = ({ data }) => {
  if (!data?.length) return <p className="text-white/20 text-xs text-center py-8">No data yet</p>;
  const max = Math.max(...data.map(d => d.revenue), 1);
  return (
    <div className="flex items-end gap-0.5 h-32">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group cursor-default relative">
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 whitespace-nowrap">
            <div className="text-[10px] text-white px-2 py-1 rounded"
              style={{ background: 'rgba(11,11,11,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {fmt(d.revenue)}
            </div>
          </div>
          <div className="w-full rounded-sm transition-all duration-300 group-hover:opacity-80"
            style={{ height: `${Math.max((d.revenue / max) * 100, 4)}%`, background: `linear-gradient(to top, #6B4226, #8B5A3C)` }} />
          <span className="text-[8px] text-white/20 truncate w-full text-center">{d._id?.slice(-5)}</span>
        </div>
      ))}
    </div>
  );
};

const StatusDonut = ({ stats }) => {
  const items = [
    { key: 'pendingOrders', label: 'Pending', color: STATUS_COLORS.pending },
    { key: 'confirmedOrders', label: 'Confirmed', color: STATUS_COLORS.confirmed },
    { key: 'processingOrders', label: 'Processing', color: STATUS_COLORS.processing },
    { key: 'dispatchedOrders', label: 'Dispatched', color: STATUS_COLORS.dispatched },
    { key: 'deliveredOrders', label: 'Delivered', color: STATUS_COLORS.delivered },
    { key: 'cancelledOrders', label: 'Cancelled', color: STATUS_COLORS.cancelled },
  ];
  const total = items.reduce((s, i) => s + (stats?.[i.key] || 0), 0) || 1;
  return (
    <div className="space-y-2.5">
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
        {items.map(item => {
          const val = stats?.[item.key] || 0;
          if (!val) return null;
          return <div key={item.key} title={`${item.label}: ${val}`} className="transition-all duration-700"
            style={{ width: `${(val / total) * 100}%`, background: item.color, borderRadius: '2px' }} />;
        })}
      </div>
      <div className="grid grid-cols-3 gap-y-2 gap-x-3">
        {items.map(item => (
          <div key={item.key} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
            <div>
              <p className="text-white text-xs font-semibold">{stats?.[item.key] || 0}</p>
              <p className="text-white/30 text-[10px]">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const WithdrawalRow = ({ req }) => (
  <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
      style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
      {req.designer?.firstName?.[0]}{req.designer?.lastName?.[0]}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-white text-xs font-medium truncate">{req.designer?.firstName} {req.designer?.lastName}</p>
      <p className="text-white/30 text-[10px] truncate">{req.designer?.email}</p>
    </div>
    <div className="text-right flex-shrink-0">
      <p className="text-ink-brown-light text-xs font-semibold">{fmt(req.amount)}</p>
      <p className="text-white/20 text-[10px]">{new Date(req.createdAt).toLocaleDateString()}</p>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderAPI.getStats()
      .then(r => setStats(r.data.stats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <Spinner size="lg" className="text-ink-brown" />
      <p className="text-white/30 text-sm">Loading dashboard…</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs tracking-widest uppercase text-ink-brown mb-1">Command Center</p>
          <h1 className="font-display text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-white/30 text-xs mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/orders" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>
            All Orders
          </Link>
          {stats?.pendingWithdrawals > 0 && (
            <Link to="/admin/withdrawals" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-colors"
              style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
              {stats.pendingWithdrawals} Withdrawal{stats.pendingWithdrawals > 1 ? 's' : ''} Pending
            </Link>
          )}
        </div>
      </div>

      {/* Primary KPIs Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI label="Total Revenue" value={fmt(stats?.revenue || 0)} sub="from paid orders"
          color="#22c55e" delay={0} to="/admin/orders"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />

        <KPI label="This Month" value={fmt(stats?.revenueThisMonth || 0)} sub="revenue in current month"
          color="#3b82f6" delay={0.05}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>} />

        <KPI label="Total Orders" value={stats?.totalOrders} sub={`${stats?.deliveredOrders || 0} delivered`}
          color="#6B4226" delay={0.1} to="/admin/orders"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>} />

        <KPI label="Registered Users" value={stats?.totalUsers} sub={`+${stats?.newUsersThisMonth || 0} this month`}
          color="#a855f7" delay={0.15} to="/admin/users"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>} />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI label="Pending Orders" value={stats?.pendingOrders} sub="awaiting confirmation"
          color="#ca8a04" delay={0.2} to="/admin/orders"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />

        <KPI label="Live Designs" value={stats?.totalDesigns} sub={`${stats?.pendingDesigns || 0} pending review`}
          color="#8b5cf6" delay={0.25} to="/admin/designs"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg>} />

        <KPI label="Pending Payouts" value={fmt(stats?.designerPayouts?.totalPending || 0)} sub="owed to designers"
          color="#f59e0b" delay={0.3} to="/admin/earnings"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>} />

        <KPI label="Withdrawal Requests" value={stats?.pendingWithdrawals || 0} sub="pending approval"
          color={stats?.pendingWithdrawals > 0 ? '#ef4444' : '#22c55e'} delay={0.35} to="/admin/withdrawals"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-sm font-semibold text-white">Monthly Revenue</h2>
              <p className="text-white/30 text-xs">Last 12 months · paid orders only</p>
            </div>
            <span className="text-xs text-ink-brown-light font-medium">{fmt(stats?.revenue || 0)} total</span>
          </div>
          <MiniBar data={stats?.monthlyRevenue} />
        </motion.div>

        {/* Order status */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="glass-card p-5">
          <div className="mb-4">
            <h2 className="font-display text-sm font-semibold text-white">Order Status</h2>
            <p className="text-white/30 text-xs">All time breakdown</p>
          </div>
          <StatusDonut stats={stats} />
          {stats?.reversedOrders > 0 && (
            <div className="mt-4 pt-3 border-t border-white/[0.06]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-white/40 text-xs">Reversed orders</span>
                </div>
                <span className="text-red-400 text-xs font-semibold">{stats.reversedOrders}</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent orders + Withdrawal requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent orders */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="glass-card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/[0.08]">
            <h2 className="font-display text-sm font-semibold text-white">Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs text-ink-brown hover:text-ink-brown-light transition-colors">View all →</Link>
          </div>
          {stats?.recentOrders?.length ? (
            <div className="divide-y divide-white/[0.05]">
              {stats.recentOrders.slice(0, 6).map(order => (
                <div key={order._id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[order.status] || '#888' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-xs font-medium">{order.orderNumber}</span>
                      {order.isReversed && <span className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>reversed</span>}
                    </div>
                    <p className="text-white/30 text-[10px] truncate">{order.user?.firstName} {order.user?.lastName}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-white text-xs font-medium">{fmt(order.total)}</p>
                    <p className="text-white/20 text-[10px]">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-white/20 py-10 text-sm">No orders yet.</p>
          )}
        </motion.div>

        {/* Pending withdrawals */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          className="glass-card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/[0.08]">
            <h2 className="font-display text-sm font-semibold text-white">
              Withdrawal Requests
              {stats?.pendingWithdrawals > 0 && (
                <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                  {stats.pendingWithdrawals} pending
                </span>
              )}
            </h2>
            <Link to="/admin/withdrawals" className="text-xs text-ink-brown hover:text-ink-brown-light transition-colors">Manage →</Link>
          </div>
          {stats?.recentWithdrawals?.length ? (
            <div className="divide-y divide-white/[0.05]">
              {stats.recentWithdrawals.map(req => <WithdrawalRow key={req._id} req={req} />)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <svg className="w-8 h-8 text-white/10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z" />
              </svg>
              <p className="text-white/20 text-sm">No pending withdrawals</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Payouts + Quick links row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="glass-card p-5 lg:col-span-1">
          <h2 className="font-display text-sm font-semibold text-white mb-4">Designer Payouts</h2>
          <div className="space-y-3">
            {[
              { label: 'Total Earned by Designers', value: fmt((stats?.designerPayouts?.totalPaid || 0) + (stats?.designerPayouts?.totalPending || 0)), color: '#fff' },
              { label: 'Paid Out', value: fmt(stats?.designerPayouts?.totalPaid || 0), color: '#22c55e' },
              { label: 'Pending', value: fmt(stats?.designerPayouts?.totalPending || 0), color: '#ca8a04' },
              { label: 'Reversed / Refunded', value: fmt(stats?.designerPayouts?.totalReversed || 0), color: '#ef4444' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0">
                <span className="text-white/40 text-xs">{item.label}</span>
                <span className="text-xs font-semibold" style={{ color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
          <Link to="/admin/earnings" className="block mt-4 text-center text-xs text-ink-brown hover:text-ink-brown-light transition-colors">
            Manage Earnings →
          </Link>
        </motion.div>

        {/* Quick actions */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
          className="lg:col-span-2 grid grid-cols-2 gap-3">
          {[
            { to: '/admin/orders',      label: 'Manage Orders',    desc: 'Update status & review designs', color: '#6B4226' },
            { to: '/admin/designs',     label: 'Review Designs',   desc: `${stats?.pendingDesigns || 0} pending approval`, color: '#8b5cf6' },
            { to: '/admin/withdrawals', label: 'Withdrawals',      desc: `${stats?.pendingWithdrawals || 0} requests pending`, color: '#ca8a04' },
            { to: '/admin/users',       label: 'Manage Users',     desc: `${stats?.totalUsers || 0} registered accounts`, color: '#3b82f6' },
            { to: '/admin/earnings',    label: 'Designer Payouts', desc: 'Track & pay designer earnings', color: '#22c55e' },
            { to: '/admin/products',    label: 'Products',         desc: 'Set prices, colors & stock', color: '#f59e0b' },
          ].map((item, i) => (
            <motion.div key={item.to} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 + i * 0.05 }}>
              <Link to={item.to} className="block glass-card p-4 hover:border-white/15 transition-all duration-200 group h-full">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center mb-2"
                  style={{ background: `${item.color}18`, border: `1px solid ${item.color}28` }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                </div>
                <p className="text-white text-xs font-semibold group-hover:text-ink-brown-light transition-colors">{item.label}</p>
                <p className="text-white/30 text-[10px] mt-0.5">{item.desc}</p>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
