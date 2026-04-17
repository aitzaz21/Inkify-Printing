import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../../shared/hooks/useAuthContext';

export default function MidCTABanner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const handleBuyNow = () => navigate(user ? '/customize' : '/login');

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.55 }}
          className="relative rounded-3xl overflow-hidden p-10 sm:p-16"
          style={{
            background: 'linear-gradient(135deg,rgba(107,66,38,0.22) 0%,rgba(11,11,11,0.92) 60%,rgba(107,66,38,0.1) 100%)',
            border: '1px solid rgba(107,66,38,0.28)',
          }}
        >
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle,#6B4226,transparent)' }} />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full blur-3xl opacity-15 pointer-events-none" style={{ background: 'radial-gradient(circle,#8B5A3C,transparent)' }} />
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8 sm:gap-12">
            <div className="flex-1 text-center sm:text-left">
              <p className="text-xs font-medium tracking-widest uppercase text-ink-brown mb-3">Ready to print?</p>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight">
                Bring your idea<br className="hidden sm:block" />{' '}
                <span className="italic text-gradient">to life.</span>
              </h2>
              <p className="text-white/45 text-sm leading-relaxed max-w-sm mx-auto sm:mx-0">
                Turn your design into a premium shirt in minutes. No experience needed.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3 flex-shrink-0">
              <button onClick={handleBuyNow}
                className="flex items-center gap-3 px-8 py-4 rounded-xl font-medium text-sm text-white transition-all duration-200 hover:-translate-y-1 whitespace-nowrap"
                style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', boxShadow: '0 4px 24px rgba(107,66,38,0.35)' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 32px rgba(107,66,38,0.5)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 24px rgba(107,66,38,0.35)'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
                </svg>
                Buy Now
              </button>
              {!user && <p className="text-white/25 text-xs">Free account required</p>}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
