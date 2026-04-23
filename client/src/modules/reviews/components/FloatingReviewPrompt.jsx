import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../../shared/hooks/useAuthContext';
import { orderAPI } from '../../orders/services/order.service';
import { reviewAPI } from '../services/review.service';
import ReviewFormModal from './ReviewFormModal';

// Pages where we should NOT show the prompt
const EXCLUDED_PATHS = ['/admin', '/login', '/signup', '/checkout', '/customize'];

export default function FloatingReviewPrompt() {
  const { user }       = useAuth();
  const { pathname }   = useLocation();

  const [pendingOrders, setPendingOrders] = useState([]);  // unreviewed delivered orders
  const [currentIdx,    setCurrentIdx]    = useState(0);
  const [open,          setOpen]          = useState(false);  // modal open
  const [expanded,      setExpanded]      = useState(false);  // card expanded
  const [dismissed,     setDismissed]     = useState(false);
  const [loaded,        setLoaded]        = useState(false);

  const isExcluded = EXCLUDED_PATHS.some(p => pathname.startsWith(p));

  const load = useCallback(() => {
    if (!user || isExcluded) return;
    Promise.all([
      orderAPI.getMyOrders(),
      reviewAPI.getMy().catch(() => ({ data: { reviews: [] } })),
    ]).then(([ordRes, revRes]) => {
      const reviewedOrderIds = new Set(
        (revRes.data.reviews || []).map(r => r.order?._id).filter(Boolean)
      );
      const unreviewed = (ordRes.data.orders || []).filter(
        o => o.status === 'delivered' && !reviewedOrderIds.has(o._id)
      );
      setPendingOrders(unreviewed);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, [user, isExcluded]);

  useEffect(() => {
    // Load after a short delay so it doesn't block page render
    const t = setTimeout(load, 2500);
    return () => clearTimeout(t);
  }, [load]);

  // Re-check when coming from checkout
  useEffect(() => {
    if (pathname === '/orders') {
      const t = setTimeout(load, 1200);
      return () => clearTimeout(t);
    }
  }, [pathname, load]);

  if (!user || isExcluded || !loaded || dismissed || pendingOrders.length === 0) {
    return null;
  }

  const currentOrder = pendingOrders[currentIdx];
  const count        = pendingOrders.length;

  const handleReviewSaved = (review) => {
    // Remove this order from the list
    const next = pendingOrders.filter((_, i) => i !== currentIdx);
    setPendingOrders(next);
    setCurrentIdx(0);
    setOpen(false);
    if (next.length === 0) setExpanded(false);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setExpanded(false);
  };

  return (
    <>
      {/* ── Review Modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {open && currentOrder && (
          <ReviewFormModal
            order={currentOrder}
            existing={null}
            onClose={() => setOpen(false)}
            onSaved={handleReviewSaved}
          />
        )}
      </AnimatePresence>

      {/* ── Floating prompt card ──────────────────────────────── */}
      <div
        className="fixed z-40"
        style={{ bottom: '90px', right: '16px', maxWidth: '280px' }}
      >
        <AnimatePresence>
          {expanded ? (
            /* Expanded card */
            <motion.div
              key="card"
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="rounded-2xl overflow-hidden shadow-2xl"
              style={{
                background: 'linear-gradient(135deg,#1a0f09,#110b07)',
                border: '1px solid rgba(107,66,38,0.40)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,150,122,0.08)',
              }}
            >
              {/* Card header */}
              <div className="flex items-center justify-between px-4 py-3"
                style={{ background: 'linear-gradient(135deg,rgba(107,66,38,0.35),rgba(107,66,38,0.15))', borderBottom: '1px solid rgba(107,66,38,0.25)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-base">⭐</span>
                  <p className="text-white text-xs font-bold">
                    {count === 1 ? 'Rate your order' : `${count} orders to rate`}
                  </p>
                </div>
                <button onClick={handleDismiss}
                  className="text-white/30 hover:text-white/70 transition-colors text-lg leading-none ml-2">
                  ×
                </button>
              </div>

              {/* Order info */}
              <div className="px-4 py-3">
                <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1 font-semibold">Order</p>
                <p className="text-white font-bold text-sm truncate">{currentOrder.orderNumber}</p>
                <p className="text-white/40 text-xs truncate mt-0.5">
                  {currentOrder.items?.map(i => i.productName).slice(0, 2).join(', ')}
                </p>

                {/* Quick star tap right in the card */}
                <div className="flex items-center gap-1.5 mt-3 mb-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      key={s}
                      onClick={() => {
                        // Open modal with this star pre-selected — we do it via opening modal
                        setOpen(true);
                      }}
                      className="transition-all hover:scale-110 active:scale-95"
                    >
                      <svg width="28" height="28" viewBox="0 0 24 24"
                        fill="none" stroke="rgba(251,191,36,0.35)" strokeWidth="1.5"
                        className="hover:fill-amber-400 hover:stroke-amber-400 transition-all">
                        <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                      </svg>
                    </button>
                  ))}
                </div>
                <p className="text-white/25 text-[10px]">Tap a star to rate</p>
              </div>

              {/* Action buttons */}
              <div className="px-4 pb-4 flex gap-2">
                <button
                  onClick={() => setOpen(true)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-97"
                  style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', color: '#fff' }}>
                  Write Review
                </button>
                {count > 1 && (
                  <button
                    onClick={() => setCurrentIdx((currentIdx + 1) % count)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    Next →
                  </button>
                )}
              </div>

              {/* Order progress (if multiple) */}
              {count > 1 && (
                <div className="flex gap-1 px-4 pb-3 justify-center">
                  {pendingOrders.map((_, i) => (
                    <button key={i} onClick={() => setCurrentIdx(i)}
                      className="h-1 rounded-full transition-all"
                      style={{
                        width: i === currentIdx ? 20 : 8,
                        background: i === currentIdx ? '#8B5A3C' : 'rgba(255,255,255,0.15)',
                      }} />
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            /* Collapsed FAB button */
            <motion.button
              key="fab"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.3 }}
              onClick={() => setExpanded(true)}
              className="flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl"
              style={{
                background: 'linear-gradient(135deg,#6B4226,#8B5A3C)',
                boxShadow: '0 8px 28px rgba(107,66,38,0.55)',
              }}
            >
              {/* Pulsing star */}
              <span className="relative flex-shrink-0">
                <span className="absolute inset-0 rounded-full bg-amber-400/30 animate-ping" style={{ animationDuration: '2s' }} />
                <span className="text-xl relative">⭐</span>
              </span>
              <div className="text-left">
                <p className="text-white text-xs font-bold leading-tight">Rate your order</p>
                <p className="text-white/60 text-[10px] leading-tight">
                  {count} order{count > 1 ? 's' : ''} waiting
                </p>
              </div>
              {count > 1 && (
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                  {count}
                </span>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
