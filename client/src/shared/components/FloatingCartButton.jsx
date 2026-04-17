import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/useAuthContext';

export default function FloatingCartButton() {
  const { count } = useCart();
  const { user }  = useAuth();

  if (!user || count === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1,   y: 0  }}
        exit={{   opacity: 0, scale: 0.8,  y: 20 }}
        className="fixed bottom-20 sm:bottom-6 right-6 z-40"
      >
        <Link
          to="/cart"
          className="flex items-center gap-2.5 px-4 py-3 rounded-2xl font-medium text-sm text-white shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg,#6B4226,#8B5A3C)',
            boxShadow: '0 8px 32px rgba(107,66,38,0.45), 0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
          </svg>
          Cart
          <span
            className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: 'rgba(255,255,255,0.25)' }}
          >
            {count > 9 ? '9+' : count}
          </span>
        </Link>
      </motion.div>
    </AnimatePresence>
  );
}
