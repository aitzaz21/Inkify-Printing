import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function ProtectedPlaceholder({ icon, title, description, badge = 'Coming Soon' }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        {/* Icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(107,66,38,0.12)', border: '1px solid rgba(107,66,38,0.25)' }}
        >
          {icon}
        </div>

        {/* Badge */}
        <span
          className="inline-block text-xs font-medium px-3 py-1 rounded-full mb-4 tracking-widest uppercase"
          style={{ background: 'rgba(107,66,38,0.15)', color: '#8B5A3C', border: '1px solid rgba(107,66,38,0.25)' }}
        >
          {badge}
        </span>

        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-3">{title}</h1>
        <p className="text-white/40 text-sm leading-relaxed mb-8">{description}</p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Home
        </Link>
      </motion.div>
    </div>
  );
}
