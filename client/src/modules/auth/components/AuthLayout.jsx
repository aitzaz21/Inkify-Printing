import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-ink-black" />
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(107,66,38,0.2) 0%, transparent 70%)',
      }} />
      <div className="absolute top-0 left-0 w-full h-full bg-noise opacity-40 pointer-events-none" />

      {/* Top bar */}
      <div className="relative z-10 px-4 sm:px-6 pt-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Inkify Printing — Home">
          <img
            src="/logo.jpg"
            alt="Inkify Printing"
            style={{
              height: 36,
              width: 36,
              borderRadius: 8,
              objectFit: 'cover',
              objectPosition: 'center',
              boxShadow: '0 2px 10px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,150,122,0.15)',
            }}
          />
          <div className="flex flex-col leading-none gap-px">
            <span className="font-display font-bold tracking-widest text-white" style={{ fontSize: 12, letterSpacing: '0.14em' }}>INKIFY</span>
            <span className="font-display font-light tracking-widest text-ink-brown" style={{ fontSize: 12, letterSpacing: '0.14em' }}>PRINTING</span>
          </div>
        </Link>
        <Link to="/" className="text-white/40 hover:text-white/70 text-sm transition-colors flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Home
        </Link>
      </div>

      {/* Main */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {/* Logo above form */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: 'easeOut', delay: 0.05 }}
            >
              <img
                src="/logo.jpg"
                alt="Inkify Printing"
                style={{
                  height: 88,
                  width: 88,
                  borderRadius: 20,
                  objectFit: 'cover',
                  objectPosition: 'center',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.75), 0 0 0 1.5px rgba(201,150,122,0.2)',
                  marginBottom: 16,
                }}
              />
            </motion.div>
            {title && (
              <h1 className="font-display text-3xl font-bold text-white mb-1.5 text-center">{title}</h1>
            )}
            {subtitle && (
              <p className="text-white/45 text-sm text-center">{subtitle}</p>
            )}
          </div>

          <div className="glass-card px-6 py-8 sm:px-8">
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
