import { useState, useEffect } from 'react';
import { Spinner } from '../../../shared/components/Spinner';

export default function ResendOTP({ onResend, cooldownSeconds = 30 }) {
  const [seconds, setSeconds] = useState(cooldownSeconds);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [seconds]);

  const handleResend = async () => {
    setLoading(true);
    try {
      const nextCooldown = await onResend();
      setSeconds(nextCooldown || 60);
    } catch {
      setSeconds(30);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (s) => s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;

  return (
    <div className="text-center">
      {seconds > 0 ? (
        <p className="text-xs text-white/35">
          Resend OTP in{' '}
          <span className="text-ink-brown-light font-medium">{fmt(seconds)}</span>
        </p>
      ) : (
        <button
          type="button"
          onClick={handleResend}
          disabled={loading}
          className="text-xs text-ink-brown-light hover:text-white transition-colors disabled:opacity-50 flex items-center gap-1.5 mx-auto"
        >
          {loading && <Spinner size="sm" />}
          Didn't receive it? Resend OTP
        </button>
      )}
    </div>
  );
}
