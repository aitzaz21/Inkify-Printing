import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../../shared/context/CartContext';

const FREE_SHIPPING_THRESHOLD = 5000;

// ── Empty cart state ─────────────────────────────────────────────
const EmptyCart = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm px-4">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
        style={{ background: 'rgba(107,66,38,0.08)', border: '1px solid rgba(107,66,38,0.18)' }}>
        <svg className="w-9 h-9 text-ink-brown/40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
        </svg>
      </div>
      <h2 className="font-display text-2xl font-bold text-white mb-2">Your cart is empty</h2>
      <p className="text-white/40 text-sm mb-8 leading-relaxed">
        You haven't added any shirts yet. Browse our catalogue or jump into the design studio.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/designs" className="btn-primary inline-flex items-center justify-center gap-2 w-auto px-7">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
          </svg>
          Browse Products
        </Link>
        <Link to="/customize" className="btn-secondary inline-flex items-center justify-center gap-2 w-auto px-7">
          Design Studio
        </Link>
      </div>
    </motion.div>
  </div>
);

// ── Cart item card ────────────────────────────────────────────────
const CartItem = ({ item, onQtyChange, onRemove, lineKey }) => {
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    setTimeout(() => onRemove(lineKey), 200);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: removing ? 0 : 1, y: 0, x: removing ? -20 : 0 }}
      exit={{ opacity: 0, x: -24, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl p-4 sm:p-5"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div
          className="w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
          style={{ background: item.colorHex ? `${item.colorHex}22` : 'rgba(107,66,38,0.1)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {item.designUrl || item.image ? (
            <img
              src={item.designUrl || item.image}
              alt={item.productName}
              className="w-full h-full object-contain p-1.5"
            />
          ) : (
            <svg className="w-9 h-9 text-white/20" fill="currentColor" viewBox="0 0 100 100">
              <path d="M35 10 L20 25 L10 20 L15 45 L25 45 L25 90 L75 90 L75 45 L85 45 L90 20 L80 25 L65 10 C62 18 38 18 35 10Z" />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-sm sm:text-base font-semibold text-white leading-snug truncate">
                {item.productName}
              </h3>

              {/* Attributes */}
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1.5">
                <span className="flex items-center gap-1.5 text-xs text-white/40">
                  <span className="w-3 h-3 rounded-full border border-white/20 flex-shrink-0"
                    style={{ background: item.colorHex || '#fff' }} />
                  {item.color}
                </span>
                <span className="text-white/20 text-xs">·</span>
                <span className="text-xs text-white/40">Size {item.size}</span>
                {item.shirtType && item.shirtType !== item.productName && (
                  <>
                    <span className="text-white/20 text-xs">·</span>
                    <span className="text-xs text-white/35">{item.shirtType}</span>
                  </>
                )}
                {(item.designUrl || item.designTitle) && (
                  <>
                    <span className="text-white/20 text-xs">·</span>
                    <span className="badge badge-green py-0.5 px-1.5 text-[10px]">
                      {item.designTitle ? `"${item.designTitle}"` : 'Custom design'}
                    </span>
                  </>
                )}
              </div>

              {item.designNote && (
                <p className="text-white/25 text-xs mt-1.5 truncate">
                  <span className="text-white/35">Note:</span> {item.designNote}
                </p>
              )}
            </div>

            {/* Remove button */}
            <button
              onClick={handleRemove}
              className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/8 transition-all flex-shrink-0"
              title="Remove"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </div>

          {/* Qty + price row */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onQtyChange(lineKey, item.quantity - 1)}
                disabled={item.quantity <= 1}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/50 hover:text-white disabled:opacity-25 transition-colors text-base"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              >−</button>
              <span className="text-white font-semibold text-sm w-6 text-center">{item.quantity}</span>
              <button
                onClick={() => onQtyChange(lineKey, item.quantity + 1)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/50 hover:text-white transition-colors text-base"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              >+</button>
            </div>
            <div className="text-right">
              {item.quantity > 1 && (
                <p className="text-white/30 text-[11px]">
                  PKR {Math.round(item.unitPrice).toLocaleString()} each
                </p>
              )}
              <p className="font-display text-base font-bold text-white">
                PKR {Math.round(item.unitPrice * item.quantity).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ── Free shipping bar ─────────────────────────────────────────────
const ShippingBar = ({ subtotal }) => {
  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
  const pct       = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const achieved  = subtotal >= FREE_SHIPPING_THRESHOLD;

  return (
    <div className="rounded-xl p-4" style={{ background: achieved ? 'rgba(34,197,94,0.07)' : 'rgba(255,255,255,0.03)', border: `1px solid ${achieved ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.07)'}` }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{achieved ? '🎉' : '🚚'}</span>
        <p className="text-sm font-medium" style={{ color: achieved ? '#4ade80' : 'rgba(255,255,255,0.7)' }}>
          {achieved
            ? 'You qualify for free shipping!'
            : <>Add <span className="text-white font-semibold">PKR {Math.round(remaining).toLocaleString()}</span> more for free shipping</>
          }
        </p>
      </div>
      <div className="progress-bar-track">
        <motion.div
          className="progress-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      {!achieved && (
        <p className="text-white/25 text-xs mt-1.5">
          PKR {Math.round(subtotal).toLocaleString()} / PKR {FREE_SHIPPING_THRESHOLD.toLocaleString()}
        </p>
      )}
    </div>
  );
};

// ── Main CartPage ─────────────────────────────────────────────────
export default function CartPage() {
  const { items, updateQty, removeItem, subtotal, shipping, total, count, lineKey } = useCart();
  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  if (items.length === 0) return (
    <div className="min-h-screen pt-28 px-4">
      <EmptyCart />
    </div>
  );

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs tracking-widest uppercase text-ink-brown mb-1">Review</p>
            <h1 className="font-display text-3xl font-bold text-white">
              Your Cart
              <span className="text-white/25 text-xl font-normal ml-2">({count} {count === 1 ? 'item' : 'items'})</span>
            </h1>
          </div>
          <Link to="/designs"
            className="text-sm text-white/40 hover:text-white transition-colors flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add more
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

          {/* ── Items ─────────────────────────────────────────── */}
          <div className="space-y-3">
            <AnimatePresence>
              {items.map(item => (
                <CartItem
                  key={lineKey(item)}
                  item={item}
                  lineKey={lineKey(item)}
                  onQtyChange={updateQty}
                  onRemove={removeItem}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* ── Order Summary ──────────────────────────────────── */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="sticky top-28 space-y-3"
            >
              {/* Shipping bar */}
              <ShippingBar subtotal={subtotal} />

              {/* Summary card */}
              <div className="rounded-2xl p-5 space-y-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <h2 className="font-display text-lg font-semibold text-white">Order Summary</h2>

                {/* Item count summary */}
                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/45">Subtotal ({count} items)</span>
                    <span className="text-white font-medium">PKR {Math.round(subtotal).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/45">Shipping</span>
                    <span className={shipping === 0 ? 'text-emerald-400 text-xs font-semibold' : 'text-white'}>
                      {shipping === 0 ? '🎉 FREE' : `PKR ${Math.round(shipping).toLocaleString()}`}
                    </span>
                  </div>
                  {promoApplied && (
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-400/80">Promo: INKIFY10</span>
                      <span className="text-emerald-400">−PKR 0</span>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="h-px bg-white/[0.08]" />

                {/* Total */}
                <div className="flex justify-between items-baseline">
                  <span className="text-white font-semibold">Total</span>
                  <div className="text-right">
                    <span className="font-display text-2xl font-bold text-white">
                      PKR {Math.round(total).toLocaleString()}
                    </span>
                    <p className="text-white/30 text-xs">Incl. taxes where applicable</p>
                  </div>
                </div>

                {/* Promo code */}
                <div>
                  <div className="flex gap-2">
                    <input
                      value={promoCode}
                      onChange={e => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="Promo code"
                      className="flex-1 glass-input text-xs py-2.5"
                    />
                    <button
                      onClick={() => promoCode && setPromoApplied(true)}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white transition-all"
                      style={{ background: 'rgba(107,66,38,0.25)', border: '1px solid rgba(107,66,38,0.35)' }}
                    >
                      Apply
                    </button>
                  </div>
                </div>

                {/* Checkout CTA */}
                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full py-4 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', boxShadow: '0 4px 16px rgba(107,66,38,0.35)' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  Proceed to Checkout
                </button>

                <Link to="/designs" className="block text-center text-xs text-white/30 hover:text-white/60 transition-colors">
                  ← Continue shopping
                </Link>
              </div>

              {/* Trust signals */}
              <div className="rounded-xl p-4 space-y-2.5"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                {[
                  { icon: '🔒', text: 'Secure checkout — SSL encrypted' },
                  { icon: '✅', text: 'Quality guaranteed on every order' },
                  { icon: '💵', text: 'Cash on delivery available' },
                ].map((t, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className="text-base flex-shrink-0">{t.icon}</span>
                    <span className="text-white/35 text-xs">{t.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
