import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import AuthLayout from '../components/AuthLayout';
import GoogleButton from '../components/GoogleButton';
import PasswordStrength from '../components/PasswordStrength';
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

const EyeIcon = ({ open }) => open ? (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
) : (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

export default function SignupPage() {
  const navigate = useNavigate();
  const { saveAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', gender: '',
    address: { street: '', city: '', state: '', postalCode: '', country: '' },
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const setAddr = (key, val) => setForm((f) => ({ ...f, address: { ...f.address, [key]: val } }));
  const clearError = (key) => setErrors((e) => { const n = { ...e }; delete n[key]; return n; });

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required';
    if (!form.lastName.trim()) e.lastName = 'Last name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    if (!form.password) e.password = 'Password is required';
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
      await authAPI.signup(form);
      toast.success('Account created! Please verify your email.');
      navigate('/verify-email', { state: { email: form.email } });
    } catch (err) {
      const msg = err.response?.data?.message || 'Signup failed';
      toast.error(msg);
      if (err.response?.data?.errors) {
        setErrors({ server: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (accessToken) => {
    try {
      const res = await authAPI.googleAuth(accessToken);
      const { token, user, needsProfile } = res.data;
      saveAuth(token, user);
      if (needsProfile) {
        toast.success('Welcome! Please complete your profile.');
        navigate('/complete-profile');
      } else {
        toast.success(`Welcome back, ${user.firstName}!`);
        navigate('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google signup failed');
    }
  };

  const inputClass = (key) =>
    `glass-input ${errors[key] ? 'border-red-500/50 focus:border-red-500/50' : ''}`;

  return (
    <AuthLayout title="Create Account" subtitle="Join Inkify Printing today">
      <GoogleButton onSuccess={handleGoogle} onError={toast.error} label="Sign up with Google" />

      <div className="section-divider">
        <span className="text-xs text-white/25 tracking-wider">or sign up with email</span>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="First Name" error={errors.firstName}>
            <input className={inputClass('firstName')} placeholder="John" value={form.firstName}
              onChange={(e) => { set('firstName', e.target.value); clearError('firstName'); }} />
          </Field>
          <Field label="Last Name" error={errors.lastName}>
            <input className={inputClass('lastName')} placeholder="Doe" value={form.lastName}
              onChange={(e) => { set('lastName', e.target.value); clearError('lastName'); }} />
          </Field>
        </div>

        <Field label="Email Address" error={errors.email}>
          <input type="email" className={inputClass('email')} placeholder="john@example.com" value={form.email}
            onChange={(e) => { set('email', e.target.value); clearError('email'); }} />
        </Field>

        <Field label="Password" error={errors.password}>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} className={`${inputClass('password')} pr-10`}
              placeholder="Min 8 chars, uppercase, number…" value={form.password}
              onChange={(e) => { set('password', e.target.value); clearError('password'); }} />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
              <EyeIcon open={showPass} />
            </button>
          </div>
          <PasswordStrength password={form.password} />
        </Field>

        <Field label="Gender" error={errors.gender}>
          <select className={`${inputClass('gender')} appearance-none`} value={form.gender}
            onChange={(e) => { set('gender', e.target.value); clearError('gender'); }}>
            <option value="" disabled>Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </Field>

        {/* Address */}
        <div>
          <p className="label mb-3">Address</p>
          <div className="space-y-3 p-4 rounded-xl border border-white/[0.08]" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <Field label="Street" error={errors.street}>
              <input className={inputClass('street')} placeholder="123 Main Street" value={form.address.street}
                onChange={(e) => { setAddr('street', e.target.value); clearError('street'); }} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="City" error={errors.city}>
                <input className={inputClass('city')} placeholder="New York" value={form.address.city}
                  onChange={(e) => { setAddr('city', e.target.value); clearError('city'); }} />
              </Field>
              <Field label="State" error={errors.state}>
                <input className={inputClass('state')} placeholder="NY" value={form.address.state}
                  onChange={(e) => { setAddr('state', e.target.value); clearError('state'); }} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Postal Code" error={errors.postalCode}>
                <input className={inputClass('postalCode')} placeholder="10001" value={form.address.postalCode}
                  onChange={(e) => { setAddr('postalCode', e.target.value); clearError('postalCode'); }} />
              </Field>
              <Field label="Country" error={errors.country}>
                <input className={inputClass('country')} placeholder="United States" value={form.address.country}
                  onChange={(e) => { setAddr('country', e.target.value); clearError('country'); }} />
              </Field>
            </div>
          </div>
        </div>

        <motion.button
          type="submit" disabled={loading} whileTap={{ scale: 0.98 }}
          className="btn-primary flex items-center justify-center gap-2 mt-2"
        >
          {loading ? <><Spinner size="sm" />Creating Account…</> : 'Create Account'}
        </motion.button>
      </form>

      <p className="text-center text-xs text-white/30 mt-5">
        Already have an account?{' '}
        <Link to="/login" className="text-ink-brown-light hover:text-white transition-colors">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
