import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../../../shared/hooks/useAuthContext';
import api from '../../../shared/api/axios';
import { orderAPI } from '../../orders/services/order.service';
import { reviewAPI } from '../../reviews/services/review.service';
import ReviewFormModal from '../../reviews/components/ReviewFormModal';
import { fmt } from '../../../shared/utils/currency';
import DesignerEarningsSection from '../components/DesignerEarningsSection';

const Section = ({ title, children }) => (
  <div className="glass-card p-6 sm:p-8">
    <h2 className="font-display text-lg font-semibold text-white mb-5 pb-4 border-b border-white/[0.08]">{title}</h2>
    {children}
  </div>
);

/* ─── Edit Profile Modal ──────────────────────────────────────────── */
const GENDER_OPTIONS = [
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  { value: 'male',              label: 'Male' },
  { value: 'female',            label: 'Female' },
  { value: 'other',             label: 'Other' },
];

function EditProfileModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    firstName: user.firstName || '',
    lastName:  user.lastName  || '',
    gender:    user.gender    || 'prefer_not_to_say',
    street:     user.address?.street     || '',
    city:       user.address?.city       || '',
    postalCode: user.address?.postalCode || '',
    state:      user.address?.state      || '',
    country:    user.address?.country    || '',
  });
  const [saving,  setSaving]  = useState(false);
  const [errors,  setErrors]  = useState({});

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName:  form.lastName.trim(),
        gender:    form.gender,
        address: {
          street:     form.street.trim(),
          city:       form.city.trim(),
          postalCode: form.postalCode.trim(),
          state:      form.state.trim(),
          country:    form.country.trim(),
        },
      };
      const res = await api.patch('/users/me/profile', payload);
      toast.success('Profile updated successfully!');
      onSaved(res.data.user);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  /* Shared input style */
  const inputCls = (key) =>
    `glass-input w-full ${errors[key] ? 'border-red-500/60 focus:border-red-500/80' : ''}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{   opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.2 }}
        className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-lg font-semibold text-white">Edit Profile</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-white/10"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">First Name <span style={{ color:'#C48A5C' }}>*</span></label>
              <input
                className={inputCls('firstName')}
                value={form.firstName}
                onChange={e => set('firstName', e.target.value)}
                placeholder="John"
              />
              {errors.firstName && (
                <p className="mt-1 text-xs" style={{ color: 'rgba(239,68,68,0.85)' }}>{errors.firstName}</p>
              )}
            </div>
            <div>
              <label className="label">Last Name</label>
              <input
                className="glass-input w-full"
                value={form.lastName}
                onChange={e => set('lastName', e.target.value)}
                placeholder="Doe"
              />
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="label">Gender</label>
            <select
              className="glass-input w-full"
              value={form.gender}
              onChange={e => set('gender', e.target.value)}
            >
              {GENDER_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Address section */}
          <div>
            <p className="text-xs tracking-widest uppercase text-white/30 mb-3">Address</p>
            <div className="space-y-3">
              <div>
                <label className="label">Street</label>
                <input
                  className="glass-input w-full"
                  value={form.street}
                  onChange={e => set('street', e.target.value)}
                  placeholder="123 Main Street"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">City</label>
                  <input
                    className="glass-input w-full"
                    value={form.city}
                    onChange={e => set('city', e.target.value)}
                    placeholder="Lahore"
                  />
                </div>
                <div>
                  <label className="label">Postal Code</label>
                  <input
                    className="glass-input w-full"
                    value={form.postalCode}
                    onChange={e => set('postalCode', e.target.value)}
                    placeholder="54000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Province / State</label>
                  <input
                    className="glass-input w-full"
                    value={form.state}
                    onChange={e => set('state', e.target.value)}
                    placeholder="Punjab"
                  />
                </div>
                <div>
                  <label className="label">Country</label>
                  <input
                    className="glass-input w-full"
                    value={form.country}
                    onChange={e => set('country', e.target.value)}
                    placeholder="Pakistan"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60 transition-opacity"
              style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', color: '#fff' }}
            >
              {saving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Saving…
                </>
              ) : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

const Field = ({ label, value }) => (
  <div>
    <p className="text-xs tracking-widest uppercase text-white/30 mb-1">{label}</p>
    <p className="text-white/80 text-sm">{value || <span className="text-white/25 italic">Not provided</span>}</p>
  </div>
);

const PAYMENT_METHODS = ['Bank Transfer', 'PayPal', 'Payoneer', 'Skrill', 'EasyPaisa', 'JazzCash', 'Other'];

export default function ProfilePage() {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();

  const [accounts,    setAccounts]    = useState([]);
  const [accLoading,  setAccLoading]  = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editAcc,     setEditAcc]     = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState('');
  const [orderStats,  setOrderStats]  = useState({ total: 0, delivered: 0, pending: 0, totalSpent: 0 });
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  // Reviews state
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [myReviews,       setMyReviews]       = useState([]);   // keyed by orderId
  const [reviewModal,     setReviewModal]     = useState(null); // { order, existing|null }

  const [accForm, setAccForm] = useState({ method:'Bank Transfer', accountName:'', accountNumber:'', isPrimary: false });

  const handleLogout = () => { logout(); toast.success('Logged out.'); navigate('/'); };

  // Load order stats + delivered orders
  useEffect(() => {
    if (!user) return;
    orderAPI.getMyOrders().then(r => {
      const orders = r.data.orders || [];
      setOrderStats({
        total: orders.length,
        delivered: orders.filter(o => o.status === 'delivered').length,
        pending: orders.filter(o => o.status === 'pending').length,
        totalSpent: orders.reduce((s, o) => s + (o.total || 0), 0),
      });
      setDeliveredOrders(orders.filter(o => o.status === 'delivered'));
    }).catch(() => {});
    // Load existing reviews
    reviewAPI.getMy().then(r => {
      const map = {};
      (r.data.reviews || []).forEach(rv => { map[rv.order?._id || rv.order] = rv; });
      setMyReviews(map);
    }).catch(() => {});
  }, [user]);

  const loadAccounts = () => {
    setAccLoading(true);
    api.get('/users/me/payment-accounts')
      .then(r => setAccounts(r.data.paymentAccounts || []))
      .catch(() => {})
      .finally(() => setAccLoading(false));
  };

  useEffect(() => { if (user) loadAccounts(); }, [user]);

  const resetForm = () => {
    setAccForm({ method:'Bank Transfer', accountName:'', accountNumber:'', isPrimary: false });
    setShowAddForm(false);
    setEditAcc(null);
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    if (!accForm.accountName.trim() || !accForm.accountNumber.trim()) {
      toast.error('Account name and number are required.'); return;
    }
    setSaving(true);
    try {
      if (editAcc) {
        await api.patch(`/users/me/payment-accounts/${editAcc._id}`, accForm);
        toast.success('Account updated.');
      } else {
        await api.post('/users/me/payment-accounts', accForm);
        toast.success('Payment account added.');
      }
      loadAccounts();
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async (id) => {
    if (!confirm('Delete this payment account?')) return;
    setDeleting(id);
    try {
      await api.delete(`/users/me/payment-accounts/${id}`);
      setAccounts(prev => prev.filter(a => a._id !== id));
      toast.success('Account removed.');
    } catch {
      toast.error('Failed to delete.');
    } finally {
      setDeleting('');
    }
  };

  const openEdit = (acc) => {
    setEditAcc(acc);
    setAccForm({ method: acc.method, accountName: acc.accountName, accountNumber: acc.accountNumber, isPrimary: acc.isPrimary });
    setShowAddForm(true);
  };

  if (!user) return null;

  const fullName   = `${user.firstName} ${user.lastName}`;
  const initials   = `${user.firstName?.[0]||''}${user.lastName?.[0]||''}`.toUpperCase();
  const genderMap  = { male:'Male', female:'Female', other:'Other', prefer_not_to_say:'Prefer not to say' };
  const roleColor  = user.role === 'admin' ? 'rgba(107,66,38,0.3)' : 'rgba(255,255,255,0.06)';
  const roleText   = user.role === 'admin' ? '#C48A5C' : 'rgba(255,255,255,0.4)';

  return (
    <div className="min-h-screen py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header card */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.45 }}
          className="glass-card p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex-shrink-0">
            {user.avatar
              ? <img src={user.avatar} alt={fullName} className="w-16 h-16 rounded-2xl object-cover" />
              : <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-display text-xl font-bold text-white"
                  style={{ background:'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>{initials}</div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="font-display text-xl font-bold text-white truncate">{fullName}</h1>
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full capitalize"
                style={{ background: roleColor, color: roleText, border:`1px solid ${roleColor}` }}>
                {user.role}
              </span>
              {user.isVerified && (
                <span className="flex items-center gap-1 text-xs text-emerald-400/80">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Verified
                </span>
              )}
            </div>
            <p className="text-white/40 text-sm truncate">{user.email}</p>
            <p className="text-white/25 text-xs mt-1">
              Member since {new Date(user.createdAt).toLocaleDateString('en-US',{ year:'numeric', month:'long' })}
            </p>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <button
              onClick={() => setEditProfileOpen(true)}
              className="text-center text-xs px-4 py-2 rounded-xl font-medium transition-all duration-150"
              style={{ background: 'linear-gradient(135deg,rgba(107,66,38,0.25),rgba(139,90,60,0.25))', color: '#C48A5C', border: '1px solid rgba(107,66,38,0.35)' }}
            >
              Edit Profile
            </button>
            {user.role === 'designer' && (
              <Link to="/marketplace/my"
                className="text-center text-xs px-4 py-2 rounded-xl font-medium transition-all duration-150"
                style={{ background:'rgba(107,66,38,0.18)', color:'#C48A5C', border:'1px solid rgba(107,66,38,0.25)' }}>
                My Designs
              </Link>
            )}
            <Link to="/orders"
              className="text-center text-xs px-4 py-2 rounded-xl font-medium transition-all duration-150"
              style={{ background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.6)', border:'1px solid rgba(255,255,255,0.1)' }}>
              My Orders
            </Link>
          </div>
        </motion.div>

        {/* Order stats dashboard */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.07 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label:'Total Orders', value: orderStats.total, color:'#6B4226' },
            { label:'Delivered',    value: orderStats.delivered, color:'#22c55e' },
            { label:'Pending',      value: orderStats.pending, color:'#ca8a04' },
            { label:'Total Spent',  value: fmt(orderStats.totalSpent), color:'#3b82f6' },
          ].map(s => (
            <div key={s.label} className="glass-card p-4 text-center">
              <p className="font-display font-bold text-2xl" style={{ color: s.color }}>{s.value}</p>
              <p className="text-white/30 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Personal details */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}>
          <Section title="Personal Details">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              <Field label="First Name"   value={user.firstName} />
              <Field label="Last Name"    value={user.lastName}  />
              <Field label="Gender"       value={genderMap[user.gender]} />
              <Field label="Street"       value={user.address?.street}     />
              <Field label="City"         value={user.address?.city}       />
              <Field label="Postal Code"  value={user.address?.postalCode} />
              <Field label="Province"     value={user.address?.state}      />
              <Field label="Country"      value={user.address?.country}    />
            </div>
          </Section>
        </motion.div>

        {/* Payment accounts — shown to all users (designers especially) */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}>
          <Section title="Payment Accounts">
            <p className="text-white/35 text-xs mb-4">
              Add your payment accounts so Inkify can pay your design earnings directly.
            </p>

            {accLoading ? (
              <div className="flex justify-center py-4"><span className="text-white/30 text-sm">Loading…</span></div>
            ) : (
              <div className="space-y-3 mb-4">
                {accounts.length === 0 ? (
                  <p className="text-white/25 text-sm text-center py-4">No payment accounts added yet.</p>
                ) : accounts.map(acc => (
                  <div key={acc._id} className="flex items-center justify-between p-4 rounded-xl"
                    style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${acc.isPrimary ? 'rgba(107,66,38,0.35)' : 'rgba(255,255,255,0.07)'}` }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                        style={{ background:'rgba(107,66,38,0.15)', border:'1px solid rgba(107,66,38,0.2)' }}>💳</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white text-sm font-medium">{acc.method}</p>
                          {acc.isPrimary && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full"
                              style={{ background:'rgba(107,66,38,0.2)', color:'#C48A5C', border:'1px solid rgba(107,66,38,0.3)' }}>
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="text-white/60 text-xs">{acc.accountName}</p>
                        <p className="text-white/35 text-xs font-mono">{acc.accountNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(acc)}
                        className="text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                        style={{ background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.5)', border:'1px solid rgba(255,255,255,0.08)' }}>
                        Edit
                      </button>
                      <button onClick={() => handleDeleteAccount(acc._id)} disabled={deleting === acc._id}
                        className="text-xs px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        style={{ background:'rgba(239,68,68,0.08)', color:'rgba(239,68,68,0.7)', border:'1px solid rgba(239,68,68,0.15)' }}>
                        {deleting === acc._id ? '…' : 'Remove'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add/Edit form */}
            <AnimatePresence>
              {showAddForm && (
                <motion.form onSubmit={handleSaveAccount}
                  initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 border-t border-white/[0.08] space-y-4">
                    <h3 className="text-white text-sm font-medium">{editAcc ? 'Edit Account' : 'Add Payment Account'}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Payment Method</label>
                        <select className="glass-input" value={accForm.method} onChange={e=>setAccForm(f=>({...f,method:e.target.value}))}>
                          {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="label">Account Name</label>
                        <input className="glass-input" value={accForm.accountName}
                          onChange={e=>setAccForm(f=>({...f,accountName:e.target.value}))}
                          placeholder="John Doe" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="label">Account Number / ID</label>
                        <input className="glass-input" value={accForm.accountNumber}
                          onChange={e=>setAccForm(f=>({...f,accountNumber:e.target.value}))}
                          placeholder="e.g. IBAN, PayPal email, phone number" />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <div onClick={() => setAccForm(f=>({...f,isPrimary:!f.isPrimary}))}
                        className="w-4 h-4 rounded border-2 flex items-center justify-center transition-all"
                        style={{ borderColor: accForm.isPrimary ? '#8B5A3C' : 'rgba(255,255,255,0.2)', background: accForm.isPrimary ? 'linear-gradient(135deg,#6B4226,#8B5A3C)' : 'transparent' }}>
                        {accForm.isPrimary && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                      </div>
                      <span className="text-white/60 text-sm">Set as primary account</span>
                    </label>
                    <div className="flex gap-3">
                      <button type="submit" disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium disabled:opacity-60"
                        style={{ background:'linear-gradient(135deg,#6B4226,#8B5A3C)', color:'#fff' }}>
                        {saving ? '…' : editAcc ? 'Update Account' : 'Save Account'}
                      </button>
                      <button type="button" onClick={resetForm}
                        className="px-5 py-2 rounded-xl text-sm font-medium"
                        style={{ background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.5)', border:'1px solid rgba(255,255,255,0.08)' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {!showAddForm && (
              <button onClick={() => { resetForm(); setShowAddForm(true); }}
                className="flex items-center gap-2 mt-2 text-sm font-medium transition-all duration-150"
                style={{ color:'#8B5A3C' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Payment Account
              </button>
            )}
          </Section>
        </motion.div>

        {/* Orders & Reviews */}
        {deliveredOrders.length > 0 && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.17 }}>
            <Section title="Orders & Reviews">
              <p className="text-white/30 text-xs mb-4">
                Leave a review for your delivered orders. Your feedback helps other customers.
              </p>
              <div className="space-y-3">
                {deliveredOrders.map(order => {
                  const existingReview = myReviews[order._id];
                  return (
                    <div key={order._id}
                      className="flex items-center justify-between gap-4 p-4 rounded-xl"
                      style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">#{order.orderNumber}</p>
                        <p className="text-white/35 text-xs mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString('en-US',{ year:'numeric', month:'short', day:'numeric' })}
                          {' · '}{fmt(order.total)}
                        </p>
                        {existingReview && (
                          <div className="flex items-center gap-1 mt-1.5">
                            {[1,2,3,4,5].map(s => (
                              <svg key={s} className={`w-3 h-3 ${s <= existingReview.rating ? 'text-amber-400' : 'text-white/15'}`} fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                            <span className="text-white/30 text-xs ml-1">Reviewed</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setReviewModal({ order, existing: existingReview || null })}
                        className="flex-shrink-0 text-xs px-3 py-2 rounded-xl font-medium transition-all duration-150"
                        style={existingReview
                          ? { background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.5)', border:'1px solid rgba(255,255,255,0.1)' }
                          : { background:'rgba(107,66,38,0.15)', color:'#C48A5C', border:'1px solid rgba(107,66,38,0.25)' }
                        }>
                        {existingReview ? 'Edit Review' : 'Write Review'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </Section>
          </motion.div>
        )}

        {/* Designer Earnings Section */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.18 }}>
          <DesignerEarningsSection paymentAccounts={accounts} />
        </motion.div>

        {/* Quick links */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
          className="glass-card p-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { to:'/orders',          label:'My Orders',       icon:'📦' },
            { to:'/marketplace/my',  label:'My Designs',      icon:'🎨' },
            { to:'/marketplace',     label:'Browse Designs',  icon:'🛍️' },
          ].map(({ to, label, icon }) => (
            <Link key={to} to={to}
              className="flex items-center gap-3 p-3 rounded-xl transition-all duration-150 hover:bg-white/5"
              style={{ border:'1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-lg">{icon}</span>
              <span className="text-white/60 text-sm">{label}</span>
            </Link>
          ))}
        </motion.div>

        {/* Danger zone */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }}
          className="glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-white text-sm font-medium mb-0.5">Sign Out</p>
            <p className="text-white/30 text-xs">End your current session on this device.</p>
          </div>
          <button onClick={handleLogout}
            className="flex-shrink-0 text-sm px-5 py-2 rounded-xl font-medium transition-all duration-150"
            style={{ background:'rgba(239,68,68,0.1)', color:'rgba(239,68,68,0.8)', border:'1px solid rgba(239,68,68,0.18)' }}>
            Log Out
          </button>
        </motion.div>
      </div>
   

    {/* Edit Profile Modal */}
    <AnimatePresence>
      {editProfileOpen && (
        <EditProfileModal
          user={user}
          onClose={() => setEditProfileOpen(false)}
          onSaved={(updatedUser) => setUser(updatedUser)}
        />
      )}
    </AnimatePresence>

    {/* Review modal */}
    {reviewModal && (
      <ReviewFormModal
        order={reviewModal.order}
        existing={reviewModal.existing}
        onClose={() => setReviewModal(null)}
        onSaved={(savedReview) => {
          setMyReviews(prev => {
            const next = { ...prev };
            const orderId = reviewModal.order._id;
            if (savedReview === null) {
              delete next[orderId];
            } else {
              next[orderId] = savedReview;
            }
            return next;
          });
        }}
      />
    )}
     </div>
  );
}
