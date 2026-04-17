import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import AuthLayout from '../components/AuthLayout';
import GoogleButton from '../components/GoogleButton';
import { authAPI } from '../services/auth.service';
import { useAuth } from '../../../shared/hooks/useAuthContext';
import { Spinner } from '../../../shared/components/Spinner';

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

export default function LoginPage() {
  const navigate = useNavigate();
  const { saveAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const res = await authAPI.login(form);
      saveAuth(res.data.token, res.data.user);
      toast.success(`Welcome back, ${res.data.user.firstName}!`);
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      if (data?.needsVerification) {
        toast.error('Please verify your email first.');
        navigate('/verify-email', { state: { email: form.email } });
      } else {
        setError(data?.message || 'Login failed. Please try again.');
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
      toast.error(err.response?.data?.message || 'Google login failed');
    }
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to your Inkify account">
      <GoogleButton onSuccess={handleGoogle} onError={toast.error} label="Continue with Google" />

      <div className="section-divider">
        <span className="text-xs text-white/25 tracking-wider">or sign in with email</span>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 px-4 py-3 rounded-xl text-sm text-red-400 flex items-center gap-2"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label className="label">Email Address</label>
          <input
            type="email" className="glass-input" placeholder="john@example.com"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            autoComplete="email"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="label mb-0">Password</label>
            <Link to="/forgot-password" className="text-xs text-ink-brown-light hover:text-white transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'} className="glass-input pr-10"
              placeholder="Your password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="current-password"
            />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
              <EyeIcon open={showPass} />
            </button>
          </div>
        </div>

        <motion.button
          type="submit" disabled={loading} whileTap={{ scale: 0.98 }}
          className="btn-primary flex items-center justify-center gap-2 mt-2"
        >
          {loading ? <><Spinner size="sm" />Signing In…</> : 'Sign In'}
        </motion.button>
      </form>

      <p className="text-center text-xs text-white/30 mt-5">
        Don't have an account?{' '}
        <Link to="/signup" className="text-ink-brown-light hover:text-white transition-colors">Create one</Link>
      </p>
    </AuthLayout>
  );
}
