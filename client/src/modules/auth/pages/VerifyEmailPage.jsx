import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import AuthLayout from '../components/AuthLayout';
import OTPInput from '../components/OTPInput';
import ResendOTP from '../components/ResendOTP';
import { authAPI } from '../services/auth.service';
import { useAuth } from '../../../shared/hooks/useAuthContext';
import { Spinner } from '../../../shared/components/Spinner';

export default function VerifyEmailPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { saveAuth } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const email = state?.email;

  useEffect(() => {
    if (!email) navigate('/signup');
  }, [email, navigate]);

  const handleVerify = async () => {
    if (otp.length !== 6) { setError('Please enter the complete 6-digit code.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.verifyEmail({ email, otp });
      saveAuth(res.data.token, res.data.user);
      toast.success('Email verified! Welcome to Inkify.');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const res = await authAPI.resendVerificationOTP(email);
      toast.success('New OTP sent to your email.');
      return res.data.nextCooldown || 60;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend OTP';
      toast.error(msg);
      throw new Error(msg);
    }
  };

  return (
    <AuthLayout
      title="Verify Email"
      subtitle={`We sent a 6-digit code to ${email || 'your email'}`}
    >
      <div className="space-y-6">
        <OTPInput length={6} value={otp} onChange={(val) => { setOtp(val); setError(''); }} />

        {error && (
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center text-sm text-red-400"
          >
            {error}
          </motion.p>
        )}

        <motion.button
          onClick={handleVerify} disabled={loading || otp.length < 6}
          whileTap={{ scale: 0.98 }}
          className="btn-primary flex items-center justify-center gap-2"
        >
          {loading ? <><Spinner size="sm" />Verifying…</> : 'Verify Email'}
        </motion.button>

        <ResendOTP onResend={handleResend} cooldownSeconds={30} />

        <div className="text-center">
          <p className="text-xs text-white/30">
            Check your spam folder if you don't see it.
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
