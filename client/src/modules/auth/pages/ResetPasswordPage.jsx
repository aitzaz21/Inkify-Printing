import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import AuthLayout from '../components/AuthLayout';
import OTPInput from '../components/OTPInput';
import ResendOTP from '../components/ResendOTP';
import PasswordStrength from '../components/PasswordStrength';
import { authAPI } from '../services/auth.service';
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

export default function ResetPasswordPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const email = state?.email;

  useEffect(() => {
    if (!email) navigate('/forgot-password');
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { setError('Please enter the complete 6-digit code.'); return; }
    if (!newPassword) { setError('Please enter a new password.'); return; }
    setError('');
    setLoading(true);
    try {
      await authAPI.resetPassword({ email, otp, newPassword });
      toast.success('Password reset successfully! Please sign in.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const res = await authAPI.resendPasswordResetOTP(email);
      toast.success('New OTP sent to your email.');
      return res.data.nextCooldown || 60;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend OTP';
      toast.error(msg);
      throw new Error(msg);
    }
  };

  return (
    <AuthLayout title="Reset Password" subtitle={`Enter the code sent to ${email || 'your email'}`}>
      {error && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mb-4 px-4 py-3 rounded-xl text-sm text-red-400"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="label text-center block mb-4">Verification Code</label>
          <OTPInput length={6} value={otp} onChange={(val) => { setOtp(val); setError(''); }} />
        </div>

        <ResendOTP onResend={handleResend} cooldownSeconds={30} />

        <div>
          <label className="label">New Password</label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              className="glass-input pr-10"
              placeholder="New secure password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
            />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
              <EyeIcon open={showPass} />
            </button>
          </div>
          <PasswordStrength password={newPassword} />
        </div>

        <motion.button
          type="submit" disabled={loading || otp.length < 6 || !newPassword}
          whileTap={{ scale: 0.98 }}
          className="btn-primary flex items-center justify-center gap-2"
        >
          {loading ? <><Spinner size="sm" />Resetting…</> : 'Reset Password'}
        </motion.button>
      </form>

      <p className="text-center text-xs text-white/30 mt-5">
        <Link to="/login" className="text-ink-brown-light hover:text-white transition-colors">
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
}
