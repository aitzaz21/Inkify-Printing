import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../../shared/context/CartContext';

const EmptyCart = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(107,66,38,0.1)', border: '1px solid rgba(107,66,38,0.2)' }}>
        <svg className="w-7 h-7 text-ink-brown/50" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
        </svg>
      </div>
      <h2 className="font-display text-2xl font-bold text-white mb-2">Your cart is empty</h2>
      <p className="text-white/40 text-sm mb-8">Browse our shirts and create something great.</p>
      <Link to="/designs" className="btn-primary inline-flex items-center gap-2 w-auto px-8">
        Browse Products
      </Link>
    </motion.div>
  </div>
);

export default function CartPage() {
  const { items, updateQty, removeItem, subtotal, shipping, total, count, lineKey } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) return (
    <div className="min-h-screen pt-24 px-4">
      <EmptyCart />
    </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-xs tracking-widest uppercase text-ink-brown mb-1">Review</p>
            <h1 className="font-display text-3xl font-bold text-white">Your Cart <span className="text-white/30 text-xl">({count})</span></h1>
          </div>
          <button onClick={() => navigate('/designs')} className="text-sm text-white/40 hover:text-white transition-colors">
            + Add more
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {items.map((item) => {
                const key = lineKey(item);
                return (
                  <motion.div
                    key={key}
                    layout
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="glass-card p-5 flex gap-4"
                  >
                    {/* Mockup / design thumbnail */}
                    <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden flex items-center justify-center" style={{ background: `${item.colorHex}22` }}>
                      {item.designUrl ? (
                        <img src={item.designUrl} alt="Design" className="w-full h-full object-contain p-1" />
                      ) : item.image ? (
                        <img src={item.image} alt={item.productName} className="w-full h-full object-contain p-1" />
                      ) : (
                        <svg className="w-8 h-8 text-ink-brown/30" fill="currentColor" viewBox="0 0 100 100">
                          <path d="M35 10 L20 25 L10 20 L15 45 L25 45 L25 90 L75 90 L75 45 L85 45 L90 20 L80 25 L65 10 C62 18 38 18 35 10Z" />
                        </svg>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-display text-base font-semibold text-white leading-snug">{item.productName}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="flex items-center gap-1.5 text-xs text-white/40">
                              <span className="w-3 h-3 rounded-full border border-white/20" style={{ background: item.colorHex }} />
                              {item.color}
                            </span>
                            <span className="text-white/20 text-xs">·</span>
                            <span className="text-xs text-white/40">Size {item.size}</span>
                            {item.designUrl && (
                              <>
                                <span className="text-white/20 text-xs">·</span>
                                <span className="text-xs text-emerald-400/70">Design uploaded</span>
                              </>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeItem(key)}
                          className="text-white/20 hover:text-red-400/70 transition-colors p-1 flex-shrink-0"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>

                      {/* Qty + price */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQty(key, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="w-7 h-7 rounded-lg text-white/50 hover:text-white disabled:opacity-30 flex items-center justify-center transition-colors"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                          >−</button>
                          <span className="text-white font-medium text-sm w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQty(key, item.quantity + 1)}
                            className="w-7 h-7 rounded-lg text-white/50 hover:text-white flex items-center justify-center transition-colors"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                          >+</button>
                        </div>
                        <div className="text-right">
                          <p className="text-white/30 text-xs">PKR {Math.round(item.unitPrice).toLocaleString()} each</p>
                          <p className="font-display text-base font-bold text-white">PKR {Math.round(item.unitPrice * item.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="glass-card p-6 sticky top-24">
              <h2 className="font-display text-lg font-semibold text-white mb-5">Order Summary</h2>
              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-white/45">Subtotal</span>
                  <span className="text-white">PKR {Math.round(subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/45">Shipping</span>
                  <span className={shipping === 0 ? 'text-emerald-400/80 text-xs font-medium' : 'text-white'}>
                    {shipping === 0 ? 'Free 🎉' : `PKR ${Math.round(shipping).toLocaleString()}`}
                  </span>
                </div>
                {subtotal < 50 && subtotal > 0 && (
                  <p className="text-white/25 text-xs">Add PKR {Math.round(5000 - subtotal).toLocaleString()} more for free shipping</p>
                )}
              </div>
              <div className="h-px bg-white/[0.08] mb-4" />
              <div className="flex justify-between mb-6">
                <span className="font-medium text-white">Total</span>
                <span className="font-display text-xl font-bold text-ink-brown-light">PKR {Math.round(total).toLocaleString()}</span>
              </div>
              <button onClick={() => navigate('/checkout')} className="btn-primary flex items-center justify-center gap-2">
                Proceed to Checkout
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
              <Link to="/designs" className="block text-center text-xs text-white/30 hover:text-white/60 transition-colors mt-4">
                Continue shopping
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
