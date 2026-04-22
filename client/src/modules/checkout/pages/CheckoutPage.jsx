import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useCart } from '../../../shared/context/CartContext';
import { useAuth } from '../../../shared/hooks/useAuthContext';
import { orderAPI } from '../../orders/services/order.service';
import { Spinner } from '../../../shared/components/Spinner';

// ── Helpers ──────────────────────────────────────────────────────
const luhn = (n) => {
  let s = 0, alt = false;
  for (let i = n.length - 1; i >= 0; i--) {
    let d = parseInt(n[i], 10);
    if (alt) { d *= 2; if (d > 9) d -= 9; }
    s += d; alt = !alt;
  }
  return s % 10 === 0;
};
const fmtCard = (v) => v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
const fmtExp  = (v) => { const d=v.replace(/\D/g,''); return d.length > 2 ? `${d.slice(0,2)}/${d.slice(2,4)}` : d; };

// ── Small UI primitives ──────────────────────────────────────────
const Field = ({ label, error, children, required }) => (
  <div>
    <label className="label">
      {label}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
    <AnimatePresence>
      {error && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="error-text mt-1"
        >
          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
);

const StepDot = ({ n, status }) => {
  const styles = {
    active:   'step-dot step-dot-active',
    done:     'step-dot step-dot-done',
    inactive: 'step-dot step-dot-inactive',
  };
  return (
    <div className={styles[status]}>
      {status === 'done'
        ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        : n
      }
    </div>
  );
};

const STEPS = [
  { n: 1, label: 'Shipping'  },
  { n: 2, label: 'Payment'   },
  { n: 3, label: 'Confirm'   },
];

const slideVariants = {
  enter:  (dir) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit:   (dir) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
};

// ── Main Component ───────────────────────────────────────────────
export default function CheckoutPage() {
  const navigate  = useNavigate();
  const { items, subtotal, shipping, total, clearCart } = useCart();
  const { user }  = useAuth();

  const [step,      setStep]    = useState(1);
  const [direction, setDir]     = useState(1);
  const [loading,   setLoading] = useState(false);
  const [errors,    setErrors]  = useState({});
  const [payMethod, setPayMethod] = useState('cod');

  const [form, setForm] = useState({
    firstName:  user?.firstName            || '',
    lastName:   user?.lastName             || '',
    street:     user?.address?.street      || '',
    city:       user?.address?.city        || '',
    state:      user?.address?.state       || '',
    postalCode: user?.address?.postalCode  || '',
    country:    user?.address?.country     || 'Pakistan',
    phone:      user?.phone                || '',
  });

  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' });

  const setF  = useCallback((k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => { const n={...e}; delete n[k]; return n; });
  }, []);
  const setC  = useCallback((k, v) => {
    setCard(c => ({ ...c, [k]: v }));
    setErrors(e => { const n={...e}; delete n[k]; return n; });
  }, []);

  // ── Validation per step ──────────────────────────────────────
  const validateStep1 = () => {
    const e = {};
    ['firstName','lastName','street','city','state','postalCode','country','phone'].forEach(k => {
      if (!form[k]?.trim()) e[k] = 'This field is required';
    });
    if (form.phone && !/^[+\d\s\-()]{7,20}$/.test(form.phone)) e.phone = 'Enter a valid phone number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    if (payMethod !== 'card') return true;
    const e = {};
    const raw = card.number.replace(/\s/g,'');
    if (!card.name.trim())             e.cardName   = 'Cardholder name required';
    if (raw.length < 16 || !luhn(raw)) e.cardNumber = 'Invalid card number';
    if (!/^\d{2}\/\d{2}$/.test(card.expiry)) e.cardExpiry = 'Use MM/YY format';
    if (!/^\d{3,4}$/.test(card.cvv))   e.cardCvv   = '3–4 digit CVV required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goTo = (n) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) { toast.error('Please complete all required fields.'); return; }
    if (step === 2 && !validateStep2()) { toast.error('Please check your payment details.'); return; }
    goTo(step + 1);
  };

  const handleSubmit = async () => {
    if (!items.length) { toast.error('Your cart is empty.'); return; }
    setLoading(true);
    try {
      const payload = {
        items: items.map(i => ({
          ...(i.productId && i.productId !== 'custom' ? { product: i.productId } : {}),
          productName:     i.productName,
          shirtType:       i.shirtType       || '',
          shirtTypeId:     i.shirtTypeId     || '',
          color:           i.color,
          colorHex:        i.colorHex        || '#FFFFFF',
          size:            i.size,
          quantity:        i.quantity,
          unitPrice:       i.unitPrice,
          designUrl:       i.designUrl       || null,
          designId:        i.designId        || null,
          designNote:      i.designNote      || '',
          designTransform: i.designTransform || null,
        })),
        shippingAddress: { ...form },
        paymentMethod: payMethod,
        ...(payMethod === 'card' && {
          cardDetails: {
            last4:         card.number.replace(/\s/g,'').slice(-4),
            transactionId: `TXN-${Date.now()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`,
            reference:     `REF-${Date.now()}`,
          },
        }),
      };
      const res     = await orderAPI.create(payload);
      const orderId = res.data.order._id;
      clearCart();
      navigate(`/orders/success/${orderId}`, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!items.length) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-white/50 mb-4">Your cart is empty.</p>
        <button onClick={() => navigate('/designs')} className="btn-primary w-auto px-8">Browse Shirts</button>
      </div>
    </div>
  );

  const shippingFree = shipping === 0;

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <Link to="/cart" className="inline-flex items-center gap-2 text-white/35 hover:text-white/70 text-sm transition-colors mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Cart
          </Link>
          <h1 className="font-display text-3xl font-bold text-white">Checkout</h1>
        </div>

        {/* ── Step indicator ───────────────────────────────────── */}
        <div className="flex items-center max-w-xs mb-10">
          {STEPS.map((s, i) => {
            const status = step > s.n ? 'done' : step === s.n ? 'active' : 'inactive';
            return (
              <div key={s.n} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? '1' : 'initial' }}>
                <button
                  onClick={() => step > s.n && goTo(s.n)}
                  className="flex flex-col items-center gap-1"
                  disabled={step <= s.n}
                >
                  <StepDot n={s.n} status={status} />
                  <span className="text-[10px] font-medium hidden sm:block"
                    style={{ color: status === 'active' ? '#C9967A' : status === 'done' ? '#4ade80' : 'rgba(255,255,255,0.25)' }}>
                    {s.label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-2 mb-4 timeline-line ${step > s.n ? 'timeline-line-done' : 'timeline-line-pending'}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">

          {/* ── LEFT: Step content ───────────────────────────── */}
          <div className="overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: 'easeInOut' }}
              >
                {/* ━━ STEP 1: SHIPPING ━━━━━━━━━━━━━━━━━━━━━━━━ */}
                {step === 1 && (
                  <div className="rounded-2xl p-6 sm:p-8"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(107,66,38,0.15)', border: '1px solid rgba(107,66,38,0.25)' }}>
                        <svg className="w-5 h-5 text-[#C9967A]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="font-display text-lg font-semibold text-white">Shipping Address</h2>
                        <p className="text-white/35 text-xs">Where should we deliver your order?</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Field label="First Name" error={errors.firstName} required>
                        <input className={`glass-input ${errors.firstName ? 'border-red-500/50' : ''}`}
                          value={form.firstName} onChange={e => setF('firstName', e.target.value)} placeholder="Ali" />
                      </Field>
                      <Field label="Last Name" error={errors.lastName} required>
                        <input className={`glass-input ${errors.lastName ? 'border-red-500/50' : ''}`}
                          value={form.lastName} onChange={e => setF('lastName', e.target.value)} placeholder="Khan" />
                      </Field>
                      <div className="col-span-2">
                        <Field label="Street Address" error={errors.street} required>
                          <input className={`glass-input ${errors.street ? 'border-red-500/50' : ''}`}
                            value={form.street} onChange={e => setF('street', e.target.value)} placeholder="House 5, Street 10, Block B" />
                        </Field>
                      </div>
                      <Field label="City" error={errors.city} required>
                        <input className={`glass-input ${errors.city ? 'border-red-500/50' : ''}`}
                          value={form.city} onChange={e => setF('city', e.target.value)} placeholder="Lahore" />
                      </Field>
                      <Field label="Province / State" error={errors.state} required>
                        <input className={`glass-input ${errors.state ? 'border-red-500/50' : ''}`}
                          value={form.state} onChange={e => setF('state', e.target.value)} placeholder="Punjab" />
                      </Field>
                      <Field label="Postal Code" error={errors.postalCode} required>
                        <input className={`glass-input ${errors.postalCode ? 'border-red-500/50' : ''}`}
                          value={form.postalCode} onChange={e => setF('postalCode', e.target.value)} placeholder="54000" />
                      </Field>
                      <Field label="Country" error={errors.country} required>
                        <input className={`glass-input ${errors.country ? 'border-red-500/50' : ''}`}
                          value={form.country} onChange={e => setF('country', e.target.value)} placeholder="Pakistan" />
                      </Field>
                      <div className="col-span-2">
                        <Field label="Phone Number" error={errors.phone} required>
                          <input className={`glass-input ${errors.phone ? 'border-red-500/50' : ''}`}
                            value={form.phone} onChange={e => setF('phone', e.target.value)} placeholder="+92 3XX XXXXXXX" inputMode="tel" />
                        </Field>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <button onClick={handleNext}
                        className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
                        style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', boxShadow: '0 4px 16px rgba(107,66,38,0.35)' }}>
                        Continue to Payment
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* ━━ STEP 2: PAYMENT ━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                {step === 2 && (
                  <div className="rounded-2xl p-6 sm:p-8 space-y-5"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(107,66,38,0.15)', border: '1px solid rgba(107,66,38,0.25)' }}>
                        <svg className="w-5 h-5 text-[#C9967A]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="font-display text-lg font-semibold text-white">Payment Method</h2>
                        <p className="text-white/35 text-xs">How would you like to pay?</p>
                      </div>
                    </div>

                    {/* Method selector */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { id: 'cod',  icon: '💵', label: 'Cash on Delivery', desc: 'Pay when your order arrives' },
                        { id: 'card', icon: '💳', label: 'Pay by Card',       desc: 'Visa, Mastercard — secure' },
                      ].map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPayMethod(m.id)}
                          className="w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 text-left"
                          style={{
                            border:     payMethod === m.id ? '1.5px solid rgba(107,66,38,0.7)' : '1.5px solid rgba(255,255,255,0.08)',
                            background: payMethod === m.id ? 'rgba(107,66,38,0.12)'            : 'rgba(255,255,255,0.03)',
                          }}
                        >
                          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                            style={{ background: 'rgba(255,255,255,0.06)' }}>
                            {m.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold">{m.label}</p>
                            <p className="text-white/35 text-xs mt-0.5">{m.desc}</p>
                          </div>
                          <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                            style={{ borderColor: payMethod === m.id ? '#8B5A3C' : 'rgba(255,255,255,0.2)' }}>
                            {payMethod === m.id && (
                              <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#8B5A3C' }} />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Card form */}
                    <AnimatePresence>
                      {payMethod === 'card' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-4 pt-2">
                            {/* Security notice */}
                            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs"
                              style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.18)' }}>
                              <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                              </svg>
                              <span className="text-white/55">Your card details are encrypted and never stored on our servers.</span>
                            </div>

                            <Field label="Cardholder Name" error={errors.cardName} required>
                              <input className={`glass-input ${errors.cardName ? 'border-red-500/50' : ''}`}
                                value={card.name} onChange={e => setC('name', e.target.value)} placeholder="Ali Khan" autoComplete="cc-name" />
                            </Field>
                            <Field label="Card Number" error={errors.cardNumber} required>
                              <div className="relative">
                                <input className={`glass-input font-mono tracking-widest pr-12 ${errors.cardNumber ? 'border-red-500/50' : ''}`}
                                  value={card.number} onChange={e => setC('number', fmtCard(e.target.value))}
                                  placeholder="0000 0000 0000 0000" maxLength={19} inputMode="numeric" autoComplete="cc-number" />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1 opacity-40">
                                  <span className="text-xs font-bold text-white">VISA</span>
                                </div>
                              </div>
                            </Field>
                            <div className="grid grid-cols-2 gap-4">
                              <Field label="Expiry (MM/YY)" error={errors.cardExpiry} required>
                                <input className={`glass-input font-mono ${errors.cardExpiry ? 'border-red-500/50' : ''}`}
                                  value={card.expiry} onChange={e => setC('expiry', fmtExp(e.target.value))}
                                  placeholder="MM/YY" maxLength={5} inputMode="numeric" autoComplete="cc-exp" />
                              </Field>
                              <Field label="CVV" error={errors.cardCvv} required>
                                <input className={`glass-input font-mono ${errors.cardCvv ? 'border-red-500/50' : ''}`}
                                  value={card.cvv} type="password" onChange={e => setC('cvv', e.target.value.replace(/\D/g,'').slice(0,4))}
                                  placeholder="•••" maxLength={4} inputMode="numeric" autoComplete="cc-csc" />
                              </Field>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex gap-3 pt-2">
                      <button onClick={() => goTo(1)}
                        className="px-6 py-3.5 rounded-xl text-sm font-medium text-white/50 hover:text-white transition-all"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.09)' }}>
                        ← Back
                      </button>
                      <button onClick={handleNext}
                        className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
                        style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', boxShadow: '0 4px 16px rgba(107,66,38,0.35)' }}>
                        Review Order
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* ━━ STEP 3: REVIEW & CONFIRM ━━━━━━━━━━━━━━━━ */}
                {step === 3 && (
                  <div className="space-y-4">
                    {/* Shipping summary */}
                    <div className="rounded-2xl p-5"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-display text-base font-semibold text-white">Shipping To</h3>
                        <button onClick={() => goTo(1)} className="text-xs text-[#C9967A] hover:text-white transition-colors">Edit</button>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: 'rgba(107,66,38,0.15)' }}>
                          <svg className="w-4 h-4 text-[#C9967A]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                          </svg>
                        </div>
                        <address className="not-italic text-white/60 text-sm leading-relaxed">
                          <span className="text-white font-medium">{form.firstName} {form.lastName}</span><br />
                          {form.street}<br />
                          {form.city}, {form.state} {form.postalCode}<br />
                          {form.country}
                          {form.phone && <><br /><span className="text-white/40">{form.phone}</span></>}
                        </address>
                      </div>
                    </div>

                    {/* Payment summary */}
                    <div className="rounded-2xl p-5"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-display text-base font-semibold text-white">Payment</h3>
                        <button onClick={() => goTo(2)} className="text-xs text-[#C9967A] hover:text-white transition-colors">Edit</button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{payMethod === 'cod' ? '💵' : '💳'}</span>
                        <div>
                          <p className="text-white text-sm font-medium">
                            {payMethod === 'cod' ? 'Cash on Delivery' : 'Card Payment'}
                          </p>
                          <p className="text-white/35 text-xs">
                            {payMethod === 'cod'
                              ? 'Pay when your order arrives'
                              : `•••• •••• •••• ${card.number.replace(/\s/g,'').slice(-4) || '****'}`
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Items review */}
                    <div className="rounded-2xl p-5"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <h3 className="font-display text-base font-semibold text-white mb-4">
                        Order Items ({items.length})
                      </h3>
                      <div className="space-y-3">
                        {items.map((item, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
                              style={{ background: item.colorHex ? `${item.colorHex}22` : 'rgba(107,66,38,0.15)', border: '1px solid rgba(255,255,255,0.07)' }}>
                              {item.image || item.designUrl
                                ? <img src={item.image || item.designUrl} alt="" className="w-full h-full object-contain p-1" />
                                : <span className="text-lg">👕</span>
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium truncate">{item.productName}</p>
                              <p className="text-white/40 text-xs">{item.color} · {item.size} · ×{item.quantity}</p>
                            </div>
                            <span className="text-white text-sm font-semibold flex-shrink-0">
                              PKR {Math.round(item.unitPrice * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Place order CTA */}
                    <div className="flex gap-3">
                      <button onClick={() => goTo(2)}
                        className="px-6 py-4 rounded-xl text-sm font-medium text-white/50 hover:text-white transition-all"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.09)' }}>
                        ← Back
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2.5 py-4 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                        style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', boxShadow: '0 4px 20px rgba(107,66,38,0.4)' }}
                      >
                        {loading
                          ? <><Spinner size="sm" className="text-white" />Processing…</>
                          : <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                              </svg>
                              {payMethod === 'card' ? 'Pay Now' : 'Place Order'}
                            </>
                        }
                      </button>
                    </div>
                    <p className="text-white/20 text-xs text-center">
                      By placing this order you agree to our{' '}
                      <Link to="/privacy" className="underline hover:text-white/50 transition-colors">terms & conditions</Link>.
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── RIGHT: Order summary (sticky) ───────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:sticky lg:top-28"
          >
            <div className="rounded-2xl p-5 space-y-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <h2 className="font-display text-base font-semibold text-white">Order Summary</h2>

              {/* Items list */}
              <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                {items.map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden"
                      style={{ background: item.colorHex ? `${item.colorHex}22` : 'rgba(107,66,38,0.15)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      {item.image || item.designUrl
                        ? <img src={item.image || item.designUrl} alt="" className="w-full h-full object-contain" />
                        : <span className="text-base">👕</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{item.productName}</p>
                      <p className="text-white/35 text-[11px]">{item.color} · {item.size} · ×{item.quantity}</p>
                    </div>
                    <span className="text-white text-xs font-semibold flex-shrink-0">
                      PKR {Math.round(item.unitPrice * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="h-px bg-white/[0.07]" />

              {/* Totals */}
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-white/45">Subtotal</span>
                  <span className="text-white">PKR {Math.round(subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/45">Shipping</span>
                  <span className={shippingFree ? 'text-emerald-400 font-medium text-xs' : 'text-white'}>
                    {shippingFree ? 'Free 🎉' : `PKR ${Math.round(shipping).toLocaleString()}`}
                  </span>
                </div>
              </div>
              <div className="h-px bg-white/[0.07]" />
              <div className="flex justify-between items-baseline">
                <span className="text-white font-semibold">Total</span>
                <span className="font-display text-2xl font-bold text-white">
                  PKR {Math.round(total).toLocaleString()}
                </span>
              </div>

              {/* Method reminder */}
              {step > 1 && (
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                  style={{ background: 'rgba(107,66,38,0.1)', border: '1px solid rgba(107,66,38,0.2)' }}>
                  <span>{payMethod === 'cod' ? '💵' : '💳'}</span>
                  <span className="text-white/60 text-xs font-medium">
                    {payMethod === 'cod' ? 'Cash on Delivery' : 'Card Payment'}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
