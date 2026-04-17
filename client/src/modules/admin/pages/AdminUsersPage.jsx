import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../../shared/api/axios';
import { Spinner } from '../../../shared/components/Spinner';
import { fmt } from '../../../shared/utils/currency';

const ROLE_STYLES = {
  user:     { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' },
  admin:    { bg: 'rgba(107,66,38,0.2)',    color: '#8B5A3C' },
  designer: { bg: 'rgba(168,85,247,0.12)',  color: '#a855f7' },
};

const STATUS_COLORS = {
  pending:'#ca8a04', confirmed:'#3b82f6', processing:'#a855f7',
  dispatched:'#f97316', delivered:'#22c55e', cancelled:'#ef4444',
};

/* ── User Profile Modal ── */
const ProfileModal = ({ userId, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    api.get(`/users/${userId}/profile`)
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleResetPassword = async () => {
    if (!confirm('Send password reset OTP to this user\'s email?')) return;
    setResetting(true);
    try {
      const r = await api.post(`/users/${userId}/reset-password`);
      toast.success(r.data.message);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    finally { setResetting(false); }
  };

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
      style={{ background:'rgba(0,0,0,0.88)' }} onClick={onClose}>
      <motion.div initial={{ scale:0.93, y:20 }} animate={{ scale:1, y:0 }} exit={{ scale:0.93 }}
        className="glass-card p-6 w-full max-w-2xl my-8" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg font-bold text-white">User Profile</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" className="text-ink-brown" /></div>
        ) : !data ? (
          <p className="text-white/30 text-center py-8">User not found.</p>
        ) : (
          <div className="space-y-5">
            {/* User info */}
            <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white"
                style={{ background:'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
                {data.user?.firstName?.[0]}{data.user?.lastName?.[0]}
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">{data.user?.firstName} {data.user?.lastName}</p>
                <p className="text-white/40 text-xs">{data.user?.email}</p>
                {data.user?.phone && <p className="text-white/30 text-xs">{data.user.phone}</p>}
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                style={{ background: ROLE_STYLES[data.user?.role]?.bg, color: ROLE_STYLES[data.user?.role]?.color }}>
                {data.user?.role}
              </span>
            </div>

            {/* Order stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label:'Total Orders', value: data.orderStats?.total, color:'#6B4226' },
                { label:'Delivered',    value: data.orderStats?.delivered, color:'#22c55e' },
                { label:'Pending',      value: data.orderStats?.pending, color:'#ca8a04' },
                { label:'Total Spent',  value: fmt(data.orderStats?.totalSpent || 0), color:'#3b82f6' },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-3 text-center" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                  <p className="font-display font-bold text-lg" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-white/30 text-[10px]">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Recent orders */}
            {data.orders?.length > 0 && (
              <div>
                <p className="text-white/30 text-xs tracking-widest uppercase mb-2">Recent Orders ({data.orders.length})</p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {data.orders.slice(0, 10).map(o => (
                    <div key={o._id} className="flex items-center justify-between p-2 rounded-lg" style={{ background:'rgba(255,255,255,0.02)' }}>
                      <div>
                        <span className="text-white text-xs font-medium">{o.orderNumber}</span>
                        <span className="text-xs ml-2 px-1.5 py-0.5 rounded-full" style={{ background:`${STATUS_COLORS[o.status]}15`, color:STATUS_COLORS[o.status] }}>{o.status}</span>
                      </div>
                      <span className="text-white/50 text-xs">{fmt(o.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Designs */}
            {data.designs?.length > 0 && (
              <div>
                <p className="text-white/30 text-xs tracking-widest uppercase mb-2">Designs ({data.designs.length})</p>
                <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                  {data.designs.slice(0, 8).map(d => (
                    <div key={d._id} className="rounded-lg overflow-hidden" style={{ border:'1px solid rgba(255,255,255,0.07)' }}>
                      <img src={d.imageUrl} alt={d.title} className="w-full aspect-square object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-white/[0.08]">
              <button onClick={handleResetPassword} disabled={resetting}
                className="flex items-center gap-2 text-xs px-4 py-2 rounded-xl font-medium disabled:opacity-50"
                style={{ background:'rgba(59,130,246,0.1)', color:'#60a5fa', border:'1px solid rgba(59,130,246,0.2)' }}>
                {resetting ? <Spinner size="sm" className="text-blue-400" /> : null}
                {resetting ? 'Sending…' : 'Send Password Reset'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

/* ── Create User Modal ── */
const CreateUserModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ firstName:'', lastName:'', email:'', password:'', phone:'' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error('First name, email & password are required.'); return;
    }
    setSaving(true);
    try {
      await api.post('/users', form);
      toast.success('User created!');
      onCreated();
      onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:'rgba(0,0,0,0.88)' }} onClick={onClose}>
      <motion.div initial={{ scale:0.93 }} animate={{ scale:1 }} exit={{ scale:0.93 }}
        className="glass-card p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="font-display text-lg font-bold text-white mb-5">Create User</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">First Name *</label><input className="glass-input" value={form.firstName} onChange={e=>set('firstName',e.target.value)} /></div>
            <div><label className="label">Last Name</label><input className="glass-input" value={form.lastName} onChange={e=>set('lastName',e.target.value)} /></div>
          </div>
          <div><label className="label">Email *</label><input type="email" className="glass-input" value={form.email} onChange={e=>set('email',e.target.value)} /></div>
          <div><label className="label">Password *</label><input type="password" className="glass-input" value={form.password} onChange={e=>set('password',e.target.value)} /></div>
          <div><label className="label">Phone</label><input className="glass-input" value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="+92 3XX" /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">
              {saving ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

/* ── Main Page ── */
export default function AdminUsersPage() {
  const [users,    setUsers]   = useState([]);
  const [loading,  setLoading] = useState(true);
  const [search,   setSearch]  = useState('');
  const [query,    setQuery]   = useState('');
  const [deleting, setDeleting]= useState('');
  const [profileId, setProfileId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = (q = '') => {
    setLoading(true);
    api.get('/users', { params: { search: q, limit: 50 } })
      .then(r => setUsers(r.data.users || []))
      .catch(() => toast.error('Failed to load users.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(query); }, [query]);

  const handleSearch = e => { e.preventDefault(); setQuery(search.trim()); };

  const handleDelete = async (userId, name) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    setDeleting(userId);
    try {
      await api.delete(`/users/${userId}`);
      setUsers(prev => prev.filter(u => u._id !== userId));
      toast.success('User deleted.');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
    finally { setDeleting(''); }
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {profileId && <ProfileModal userId={profileId} onClose={() => setProfileId(null)} />}
        {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onCreated={() => load(query)} />}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <p className="text-xs tracking-widest uppercase text-ink-brown mb-1">People</p>
          <h1 className="font-display text-2xl font-bold text-white">Users</h1>
        </div>
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Name, email or phone…"
                className="glass-input pl-9 py-2 text-sm w-56" />
            </div>
            <button type="submit" className="px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{ background: 'rgba(107,66,38,0.3)', border: '1px solid rgba(107,66,38,0.4)' }}>
              Search
            </button>
          </form>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Create
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" className="text-ink-brown" /></div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 glass-card"><p className="text-white/30">No users found.</p></div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  {['User', 'Email', 'Phone', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-white/30 tracking-widest uppercase font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((user, i) => {
                  const rs = ROLE_STYLES[user.role] || ROLE_STYLES.user;
                  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
                  return (
                    <motion.tr key={user._id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {user.avatar
                            ? <img src={user.avatar} alt="" className="w-8 h-8 rounded-xl object-cover flex-shrink-0" />
                            : <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>{initials}</div>
                          }
                          <span className="text-white font-medium whitespace-nowrap">{user.firstName} {user.lastName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white/50 text-xs">{user.email}</td>
                      <td className="px-4 py-3 text-white/40 text-xs">{user.phone || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full capitalize"
                          style={{ background: rs.bg, color: rs.color }}>{user.role}</span>
                      </td>
                      <td className="px-4 py-3">
                        {user.isVerified
                          ? <span className="text-xs text-emerald-400/70">Verified</span>
                          : <span className="text-xs text-amber-400/60">Unverified</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-white/30 text-xs whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setProfileId(user._id)}
                            className="text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                            style={{ background:'rgba(107,66,38,0.12)', color:'#C48A5C', border:'1px solid rgba(107,66,38,0.2)' }}>
                            View
                          </button>
                          {user.role !== 'admin' && (
                            <button onClick={() => handleDelete(user._id, `${user.firstName} ${user.lastName}`)}
                              disabled={deleting === user._id}
                              className="text-xs px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                              style={{ background:'rgba(239,68,68,0.08)', color:'rgba(239,68,68,0.7)', border:'1px solid rgba(239,68,68,0.12)' }}>
                              {deleting === user._id ? '…' : 'Delete'}
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-white/[0.08]">
            <p className="text-white/20 text-xs">{users.length} user{users.length !== 1 ? 's' : ''} shown</p>
          </div>
        </div>
      )}
    </div>
  );
}
