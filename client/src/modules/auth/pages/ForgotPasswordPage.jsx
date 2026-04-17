import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import AuthLayout from '../components/AuthLayout';
import { authAPI } from '../services/auth.service';
import { Spinner } from '../../../shared/components/Spinner';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email address.'); return; }
    setError('');
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
      toast.success('Password reset OTP sent!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout title="OTP Sent!" subtitle="Check your email inbox">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
            style={{ background: 'rgba(107,66,38,0.15)', border: '1px solid rgba(107,66,38,0.3)' }}>
            <svg className="w-7 h-7 text-ink-brown" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <p className="text-white/50 text-sm">We sent a reset code to <span className="text-white">{email}</span></p>
          <button
            onClick={() => navigate('/reset-password', { state: { email } })}
            className="btn-primary"
          >
            Enter Reset Code
          </button>
          <Link to="/login" className="block text-xs text-white/30 hover:text-white/60 transition-colors">
            Back to login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot Password" subtitle="Enter your email and we'll send a reset code">
      {error && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mb-4 px-4 py-3 rounded-xl text-sm text-red-400"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email Address</label>
          <input
            type="email" className="glass-input" placeholder="john@example.com"
            value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }}
          />
        </div>

        <motion.button
          type="submit" disabled={loading} whileTap={{ scale: 0.98 }}
          className="btn-primary flex items-center justify-center gap-2"
        >
          {loading ? <><Spinner size="sm" />Sending…</> : 'Send Reset Code'}
        </motion.button>
      </form>

      <p className="text-center text-xs text-white/30 mt-5">
        Remembered it?{' '}
        <Link to="/login" className="text-ink-brown-light hover:text-white transition-colors">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
