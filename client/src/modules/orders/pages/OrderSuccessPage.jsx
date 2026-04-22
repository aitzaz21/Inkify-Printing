import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { orderAPI } from '../services/order.service';

// ── Animated checkmark SVG ────────────────────────────────────────
const AnimatedCheck = () => (
  <svg className="w-12 h-12 text-emerald-400" fill="none" viewBox="0 0 52 52">
    <motion.circle
      cx="26" cy="26" r="25"
      stroke="rgba(34,197,94,0.25)"
      strokeWidth="2"
      fill="rgba(34,197,94,0.08)"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    />
    <motion.path
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14 26 L22 34 L38 18"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
    />
  </svg>
);

// ── Timeline step ─────────────────────────────────────────────────
const NextStep = ({ icon, title, desc, delay }) => (
  <motion.div
    initial={{ opacity: 0, x: -16 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="flex items-start gap-4"
  >
    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 mt-0.5"
      style={{ background: 'rgba(107,66,38,0.15)', border: '1px solid rgba(107,66,38,0.25)' }}>
      {icon}
    </div>
    <div>
      <p className="text-white text-sm font-semibold">{title}</p>
      <p className="text-white/45 text-sm mt-0.5 leading-relaxed">{desc}</p>
    </div>
  </motion.div>
);

export default function OrderSuccessPage() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    orderAPI.getMyOrder(id)
      .then(r => setOrder(r.data.order))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  // Confetti-style floating dots
  const dots = Array.from({ length: 12 }, (_, i) => ({
    x:     `${10 + (i * 7.5) % 80}%`,
    delay: i * 0.1,
    size:  4 + (i % 3) * 3,
    color: i % 3 === 0 ? '#6B4226' : i % 3 === 1 ? '#C9967A' : '#4ade80',
  }));

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 flex items-center justify-center">

      {/* Background radial glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 70%)' }}
        />
        {/* Floating celebration dots */}
        {dots.map((dot, i) => (
          <motion.div
            key={i}
            initial={{ y: '110vh', opacity: 0 }}
            animate={{ y: '-10vh', opacity: [0, 1, 1, 0] }}
            transition={{ delay: dot.delay + 0.5, duration: 3 + i * 0.2, ease: 'easeOut' }}
            className="absolute rounded-full"
            style={{ left: dot.x, bottom: 0, width: dot.size, height: dot.size, background: dot.color }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-lg">

        {/* ── Success card ───────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="rounded-3xl p-8 sm:p-10 text-center"
          style={{ background: 'rgba(18,14,10,0.9)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}
        >
          {/* Pulsing ring + check */}
          <div className="relative flex items-center justify-center mx-auto mb-6 w-20 h-20">
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: 'rgba(34,197,94,0.12)' }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            />
            <AnimatedCheck />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <p className="text-emerald-400 text-xs font-semibold tracking-widest uppercase mb-2">Order Confirmed</p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">
              Thank you! 🎉
            </h1>
            <p className="text-white/50 text-sm leading-relaxed mb-6">
              Your order has been placed successfully. We've received your request and our team will start processing it shortly.
            </p>
          </motion.div>

          {/* Order number */}
          {!loading && order && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, duration: 0.35 }}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl mb-8"
              style={{ background: 'rgba(107,66,38,0.15)', border: '1px solid rgba(107,66,38,0.3)' }}
            >
              <svg className="w-4 h-4 text-[#C9967A]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
              <div className="text-left">
                <p className="text-white/40 text-[10px] tracking-wider uppercase">Order Number</p>
                <p className="text-white font-display font-bold text-lg leading-none mt-0.5">{order.orderNumber}</p>
              </div>
            </motion.div>
          )}

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.35 }}
            className="flex flex-col sm:flex-row gap-3 mb-8"
          >
            <Link
              to={`/orders/${id}`}
              className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', boxShadow: '0 4px 16px rgba(107,66,38,0.35)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
              Track My Order
            </Link>
            <Link
              to="/designs"
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-all border border-white/12 hover:border-white/25"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              Continue Shopping
            </Link>
          </motion.div>

          {/* What happens next */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.4 }}
            className="text-left rounded-2xl p-5 space-y-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p className="text-white/50 text-xs font-semibold tracking-widest uppercase">What happens next</p>
            <NextStep
              icon="✅"
              title="Order Confirmed"
              desc="We've received your order and will confirm it within a few hours."
              delay={1.1}
            />
            <NextStep
              icon="🎨"
              title="Print & Production"
              desc="Your shirt is printed using premium DTF technology. Quality-checked before packing."
              delay={1.2}
            />
            <NextStep
              icon="🚚"
              title="Dispatched"
              desc="Your order ships within 48–72 hours with full tracking information."
              delay={1.3}
            />
            <NextStep
              icon="📦"
              title="Delivered to You"
              desc="Estimated delivery in 3–5 business days after dispatch."
              delay={1.4}
            />
          </motion.div>
        </motion.div>

        {/* Quick links below card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="flex items-center justify-center gap-6 mt-6"
        >
          <Link to="/orders"     className="text-white/35 hover:text-white text-sm transition-colors">My Orders</Link>
          <span className="text-white/15">·</span>
          <Link to="/marketplace" className="text-white/35 hover:text-white text-sm transition-colors">Design Marketplace</Link>
          <span className="text-white/15">·</span>
          <Link to="/contact"    className="text-white/35 hover:text-white text-sm transition-colors">Need Help?</Link>
        </motion.div>
      </div>
    </div>
  );
}
