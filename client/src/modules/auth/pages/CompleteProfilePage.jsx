import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import AuthLayout from '../components/AuthLayout';
import { authAPI } from '../services/auth.service';
import { useAuth } from '../../../shared/hooks/useAuthContext';
import { Spinner } from '../../../shared/components/Spinner';

const Field = ({ label, error, children }) => (
  <div>
    <label className="label">{label}</label>
    {children}
    {error && <p className="error-text"><span>⚠</span>{error}</p>}
  </div>
);

export default function CompleteProfilePage() {
  const navigate = useNavigate();
  const { token, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    gender: '',
    address: { street: '', city: '', state: '', postalCode: '', country: '' },
  });

  const setAddr = (key, val) => setForm((f) => ({ ...f, address: { ...f.address, [key]: val } }));
  const clearErr = (key) => setErrors((e) => { const n = { ...e }; delete n[key]; return n; });

  const validate = () => {
    const e = {};
    if (!form.gender) e.gender = 'Please select a gender';
    if (!form.address.street.trim()) e.street = 'Street is required';
    if (!form.address.city.trim()) e.city = 'City is required';
    if (!form.address.state.trim()) e.state = 'State is required';
    if (!form.address.postalCode.trim()) e.postalCode = 'Postal code is required';
    if (!form.address.country.trim()) e.country = 'Country is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authAPI.completeProfile(form);
      setUser(res.data.user);
      toast.success('Profile completed! Welcome to Inkify.');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile.');
    } finally {
      setLoading(false);
    }
  };

  const ic = (key) => `glass-input ${errors[key] ? 'border-red-500/50' : ''}`;

  return (
    <AuthLayout title="Complete Profile" subtitle="Just a few more details to get you started">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Gender" error={errors.gender}>
          <select
            className={`${ic('gender')} appearance-none`}
            value={form.gender}
            onChange={(e) => { setForm({ ...form, gender: e.target.value }); clearErr('gender'); }}
          >
            <option value="" disabled>Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </Field>

        <div>
          <p className="label mb-3">Delivery Address</p>
          <div className="space-y-3 p-4 rounded-xl border border-white/[0.08]" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <Field label="Street" error={errors.street}>
              <input className={ic('street')} placeholder="123 Main Street"
                value={form.address.street}
                onChange={(e) => { setAddr('street', e.target.value); clearErr('street'); }} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="City" error={errors.city}>
                <input className={ic('city')} placeholder="New York"
                  value={form.address.city}
                  onChange={(e) => { setAddr('city', e.target.value); clearErr('city'); }} />
              </Field>
              <Field label="State" error={errors.state}>
                <input className={ic('state')} placeholder="NY"
                  value={form.address.state}
                  onChange={(e) => { setAddr('state', e.target.value); clearErr('state'); }} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Postal Code" error={errors.postalCode}>
                <input className={ic('postalCode')} placeholder="10001"
                  value={form.address.postalCode}
                  onChange={(e) => { setAddr('postalCode', e.target.value); clearErr('postalCode'); }} />
              </Field>
              <Field label="Country" error={errors.country}>
                <input className={ic('country')} placeholder="United States"
                  value={form.address.country}
                  onChange={(e) => { setAddr('country', e.target.value); clearErr('country'); }} />
              </Field>
            </div>
          </div>
        </div>

        <motion.button
          type="submit" disabled={loading} whileTap={{ scale: 0.98 }}
          className="btn-primary flex items-center justify-center gap-2 mt-2"
        >
          {loading ? <><Spinner size="sm" />Saving…</> : 'Complete Profile'}
        </motion.button>
      </form>
    </AuthLayout>
  );
}
