import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useCart } from '../../../shared/context/CartContext';
import { useAuth } from '../../../shared/hooks/useAuthContext';
import { orderAPI } from '../../orders/services/order.service';
import { uploadAPI } from '../../../shared/api/upload.service';
import { Spinner } from '../../../shared/components/Spinner';
import api from '../../../shared/api/axios';

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
  { n: 1, label: 'Shipping' },
  { n: 2, label: 'Payment'  },
  { n: 3, label: 'Confirm'  },
];

const slideVariants = {
  enter:  (dir) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit:   (dir) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
};

// ── Proof upload zone ─────────────────────────────────────────────
function ProofUploadZone({ url, pct, uploading, onFile, onClear }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    const ok = ['image/jpeg','image/jpg','image/png','image/webp'].includes(file.type);
    if (!ok) { toast.error('Upload a JPG, PNG, or WEBP image.'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('File must be under 5 MB.'); return; }
    onFile(file);
  };

  if (url) return (
    <div className="relative rounded-xl overflow-hidden group"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(34,197,94,0.25)', aspectRatio: '16/9' }}>
      <img src={url} alt="Payment proof" className="w-full h-full object-contain p-2" />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'rgba(0,0,0,0.55)' }}>
        <button onClick={onClear}
          className="px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: 'rgba(239,68,68,0.9)', color: '#fff' }}>
          Change Screenshot
        </button>
      </div>
      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold"
        style={{ background: 'rgba(34,197,94,0.85)', color: '#fff' }}>
        ✓ Uploaded
      </div>
    </div>
  );

  if (uploading) return (
    <div className="rounded-xl flex flex-col items-center justify-center gap-3 p-6"
      style={{ background: 'rgba(107,66,38,0.06)', border: '1px dashed rgba(107,66,38,0.35)', aspectRatio: '16/9' }}>
      <Spinner size="sm" className="text-[#C9967A]" />
      <div className="w-full px-4">
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#6B4226,#C9967A)' }} />
        </div>
        <p className="text-center text-xs mt-1" style={{ color: 'rgba(201,150,122,0.8)' }}>{pct}% uploading…</p>
      </div>
    </div>
  );

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
      className="rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all p-5 text-center"
      style={{
        background: drag ? 'rgba(107,66,38,0.12)' : 'rgba(255,255,255,0.02)',
        border: `1.5px dashed ${drag ? 'rgba(201,150,122,0.6)' : 'rgba(255,255,255,0.1)'}`,
        aspectRatio: '16/9',
      }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
        style={{ background: 'rgba(107,66,38,0.12)', color: '#C9967A' }}>
        📸
      </div>
      <p className="text-white/60 text-sm font-medium">Drop screenshot here</p>
      <p className="text-white/30 text-xs">or click to browse · JPG/PNG/WEBP · Max 5 MB</p>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={e => handleFile(e.target.files[0])} />
    </div>
  );
}

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

  // Manual payment state
  const [paymentMethods,    setPaymentMethods]    = useState([]);
  const [pmLoading,         setPmLoading]         = useState(true);
  const [selectedMethod,    setSelectedMethod]    = useState(null);
  const [proofUrl,          setProofUrl]          = useState('');
  const [proofUploading,    setProofUploading]    = useState(false);
  const [proofPct,          setProofPct]          = useState(0);
  const [paymentReference,  setPaymentReference]  = useState('');

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

  const setF = useCallback((k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => { const n={...e}; delete n[k]; return n; });
  }, []);

  // Fetch active payment methods
  useEffect(() => {
    api.get('/payment-methods')
      .then(r => {
        const methods = r.data.methods || [];
        setPaymentMethods(methods);
        if (methods.length > 0) setSelectedMethod(methods[0]);
      })
      .catch(() => {})
      .finally(() => setPmLoading(false));
  }, []);

  // Proof upload handler
  const handleProofFile = async (file) => {
    setProofUploading(true);
    setProofPct(0);
    try {
      const res = await uploadAPI.uploadPaymentProof(file, pct => setProofPct(pct));
      setProofUrl(res.data.url);
      toast.success('Screenshot uploaded.');
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally { setProofUploading(false); }
  };

  // ── Validation ───────────────────────────────────────────────
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
    if (payMethod === 'manual') {
      if (!selectedMethod) { toast.error('Select a payment account.'); return false; }
      if (!proofUrl)        { toast.error('Upload your payment screenshot before continuing.'); return false; }
    }
    return true;
  };

  const goTo = (n) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) { toast.error('Please complete all required fields.'); return; }
    if (step === 2 && !validateStep2()) return;
    goTo(step + 1);
  };

  const handleSubmit = async () => {
    if (!items.length) { toast.error('Your cart is empty.'); return; }
    if (payMethod === 'manual' && !proofUrl) { toast.error('Payment screenshot is required.'); return; }
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
          // Front/back design fields
          frontDesignUrl:       i.frontDesignUrl       || null,
          frontDesignId:        i.frontDesignId        || null,
          frontDesignTransform: i.frontDesignTransform || null,
          backDesignUrl:        i.backDesignUrl        || null,
          backDesignId:         i.backDesignId         || null,
          backDesignTransform:  i.backDesignTransform  || null,
        })),
        shippingAddress: { ...form },
        paymentMethod: payMethod,
        ...(payMethod === 'manual' && {
          manualPayment: {
            paymentMethodId: selectedMethod?._id,
            methodTitle:     `${selectedMethod?.bankName} — ${selectedMethod?.accountTitle}`,
            proofUrl,
            reference: paymentReference.trim(),
          },
        }),
      };
      const res     = await orderAPI.create(payload);
      const orderId = res.data.order._id;
      clearCart();
      navigate(`/orders/success/${orderId}`, { replace: true });
    } catch (e) {
      toast.error(e.response?.data?.message || 'Order failed. Please try again.');
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

  // ── Payment method display label for review step ──────────────
  const payLabel = payMethod === 'cod'
    ? 'Cash on Delivery'
    : payMethod === 'manual' && selectedMethod
      ? `${selectedMethod.bankName} — ${selectedMethod.accountTitle}`
      : 'Bank Transfer';

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
                <button onClick={() => step > s.n && goTo(s.n)} className="flex flex-col items-center gap-1" disabled={step <= s.n}>
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

                    {/* ── Method selector ── */}
                    <div className="space-y-3">

                      {/* Cash on Delivery */}
                      <button type="button" onClick={() => setPayMethod('cod')}
                        className="w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 text-left"
                        style={{
                          border:     payMethod === 'cod' ? '1.5px solid rgba(107,66,38,0.7)' : '1.5px solid rgba(255,255,255,0.08)',
                          background: payMethod === 'cod' ? 'rgba(107,66,38,0.12)'            : 'rgba(255,255,255,0.03)',
                        }}>
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                          style={{ background: 'rgba(255,255,255,0.06)' }}>💵</div>
                        <div className="flex-1">
                          <p className="text-white text-sm font-semibold">Cash on Delivery</p>
                          <p className="text-white/35 text-xs mt-0.5">Pay when your order arrives</p>
                        </div>
                        <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                          style={{ borderColor: payMethod === 'cod' ? '#8B5A3C' : 'rgba(255,255,255,0.2)' }}>
                          {payMethod === 'cod' && <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#8B5A3C' }} />}
                        </div>
                      </button>

                      {/* Bank Transfer (Manual) */}
                      {!pmLoading && paymentMethods.length > 0 && (
                        <button type="button" onClick={() => setPayMethod('manual')}
                          className="w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 text-left"
                          style={{
                            border:     payMethod === 'manual' ? '1.5px solid rgba(107,66,38,0.7)' : '1.5px solid rgba(255,255,255,0.08)',
                            background: payMethod === 'manual' ? 'rgba(107,66,38,0.12)'             : 'rgba(255,255,255,0.03)',
                          }}>
                          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                            style={{ background: 'rgba(255,255,255,0.06)' }}>🏦</div>
                          <div className="flex-1">
                            <p className="text-white text-sm font-semibold">Bank Transfer</p>
                            <p className="text-white/35 text-xs mt-0.5">Transfer & upload payment screenshot</p>
                          </div>
                          <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                            style={{ borderColor: payMethod === 'manual' ? '#8B5A3C' : 'rgba(255,255,255,0.2)' }}>
                            {payMethod === 'manual' && <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#8B5A3C' }} />}
                          </div>
                        </button>
                      )}

                      {/* Card — disabled (coming soon) */}
                      <div className="w-full flex items-center gap-4 p-4 rounded-xl relative overflow-hidden"
                        style={{ border: '1.5px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)', opacity: 0.55 }}>
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                          style={{ background: 'rgba(255,255,255,0.04)' }}>💳</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-white/60 text-sm font-semibold">Pay by Card</p>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                              style={{ background: 'rgba(239,68,68,0.12)', color: 'rgba(239,68,68,0.75)', border: '1px solid rgba(239,68,68,0.18)' }}>
                              Not available right now
                            </span>
                          </div>
                          <p className="text-white/25 text-xs mt-0.5">Online card payments coming soon. Please use bank transfer or cash on delivery.</p>
                        </div>
                        <svg className="w-5 h-5 flex-shrink-0 text-white/20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                      </div>
                    </div>

                    {/* ── Manual payment details ── */}
                    <AnimatePresence>
                      {payMethod === 'manual' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-5 pt-2">

                            {/* Select account */}
                            <div>
                              <p className="label text-xs mb-2">Select Payment Account <span className="text-red-400">*</span></p>
                              <div className="space-y-2">
                                {paymentMethods.map(m => (
                                  <button key={m._id} type="button"
                                    onClick={() => setSelectedMethod(m)}
                                    className="w-full flex items-start gap-3 p-4 rounded-xl text-left transition-all"
                                    style={{
                                      border: selectedMethod?._id === m._id ? '1.5px solid rgba(107,66,38,0.65)' : '1.5px solid rgba(255,255,255,0.07)',
                                      background: selectedMethod?._id === m._id ? 'rgba(107,66,38,0.10)' : 'rgba(255,255,255,0.02)',
                                    }}>
                                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                                      style={{ background: 'rgba(255,255,255,0.05)' }}>🏦</div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-white text-sm font-semibold">{m.bankName}</p>
                                      <p className="text-white/50 text-xs">{m.accountTitle}</p>
                                      <p className="text-white/80 text-sm font-mono mt-0.5">{m.accountNumber}</p>
                                      {m.iban && <p className="text-white/35 text-xs font-mono mt-0.5">IBAN: {m.iban}</p>}
                                      {m.instructions && (
                                        <p className="text-[#C9967A]/70 text-xs mt-1 italic">{m.instructions}</p>
                                      )}
                                    </div>
                                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5"
                                      style={{ borderColor: selectedMethod?._id === m._id ? '#8B5A3C' : 'rgba(255,255,255,0.2)' }}>
                                      {selectedMethod?._id === m._id && <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#8B5A3C' }} />}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* How to pay instructions */}
                            <div className="rounded-xl p-4 space-y-1"
                              style={{ background: 'rgba(107,66,38,0.08)', border: '1px solid rgba(107,66,38,0.2)' }}>
                              <p className="text-white/70 text-xs font-semibold">How to pay:</p>
                              <ol className="text-white/45 text-xs space-y-1 pl-3 list-decimal">
                                <li>Copy the account number above and transfer <strong className="text-white/70">PKR {Math.round(total).toLocaleString()}</strong> to that account.</li>
                                <li>Take a screenshot of your transaction confirmation.</li>
                                <li>Upload the screenshot below — it's required to place your order.</li>
                              </ol>
                            </div>

                            {/* Optional transaction reference */}
                            <div>
                              <label className="label text-xs">Transaction / Reference Number <span className="text-white/30">(optional)</span></label>
                              <input className="glass-input font-mono" value={paymentReference}
                                onChange={e => setPaymentReference(e.target.value)}
                                placeholder="e.g. TXN123456789" />
                              <p className="text-white/25 text-xs mt-1">Enter the transaction ID shown in your bank app if available.</p>
                            </div>

                            {/* Screenshot upload */}
                            <div>
                              <label className="label text-xs">Payment Screenshot <span className="text-red-400">*</span></label>
                              <ProofUploadZone
                                url={proofUrl}
                                pct={proofPct}
                                uploading={proofUploading}
                                onFile={handleProofFile}
                                onClear={() => setProofUrl('')}
                              />
                              {!proofUrl && !proofUploading && (
                                <p className="text-amber-400/60 text-xs mt-2 flex items-center gap-1.5">
                                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                  </svg>
                                  Screenshot is required to place your order. Your order will be confirmed after admin verifies your payment.
                                </p>
                              )}
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
                        disabled={payMethod === 'manual' && proofUploading}
                        className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:transform-none"
                        style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', boxShadow: '0 4px 16px rgba(107,66,38,0.35)' }}>
                        {proofUploading ? <><Spinner size="sm" className="text-white" /> Uploading…</> : <>
                          Review Order
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                          </svg>
                        </>}
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
                      <address className="not-italic text-white/60 text-sm leading-relaxed">
                        <span className="text-white font-medium">{form.firstName} {form.lastName}</span><br />
                        {form.street}<br />
                        {form.city}, {form.state} {form.postalCode}<br />
                        {form.country}
                        {form.phone && <><br /><span className="text-white/40">{form.phone}</span></>}
                      </address>
                    </div>

                    {/* Payment summary */}
                    <div className="rounded-2xl p-5"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-display text-base font-semibold text-white">Payment</h3>
                        <button onClick={() => goTo(2)} className="text-xs text-[#C9967A] hover:text-white transition-colors">Edit</button>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{payMethod === 'cod' ? '💵' : '🏦'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium">{payLabel}</p>
                          {payMethod === 'manual' && (
                            <>
                              <p className="text-white/35 text-xs mt-0.5">Payment pending admin verification</p>
                              {paymentReference && (
                                <p className="text-white/40 text-xs font-mono mt-0.5">Ref: {paymentReference}</p>
                              )}
                              {proofUrl && (
                                <div className="mt-2 w-24 h-16 rounded-lg overflow-hidden"
                                  style={{ border: '1px solid rgba(34,197,94,0.25)' }}>
                                  <img src={proofUrl} alt="proof" className="w-full h-full object-contain" />
                                </div>
                              )}
                            </>
                          )}
                          {payMethod === 'cod' && <p className="text-white/35 text-xs">Pay when your order arrives</p>}
                        </div>
                      </div>
                    </div>

                    {/* Manual payment warning */}
                    {payMethod === 'manual' && (
                      <div className="rounded-xl p-4 flex items-start gap-3"
                        style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                        <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                        <p className="text-amber-300/70 text-xs leading-relaxed">
                          Your order will be placed in <strong className="text-amber-300/90">pending</strong> status.
                          Once our team verifies your payment screenshot, your order will be confirmed and processing will begin.
                        </p>
                      </div>
                    )}

                    {/* Items */}
                    <div className="rounded-2xl p-5"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <h3 className="font-display text-base font-semibold text-white mb-4">Order Items ({items.length})</h3>
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

                    {/* Place order */}
                    <div className="flex gap-3">
                      <button onClick={() => goTo(2)}
                        className="px-6 py-4 rounded-xl text-sm font-medium text-white/50 hover:text-white transition-all"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.09)' }}>
                        ← Back
                      </button>
                      <button onClick={handleSubmit} disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2.5 py-4 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                        style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', boxShadow: '0 4px 20px rgba(107,66,38,0.4)' }}>
                        {loading
                          ? <><Spinner size="sm" className="text-white" />Processing…</>
                          : <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                              </svg>
                              Place Order
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

          {/* ── RIGHT: Order summary ─────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="lg:sticky lg:top-28">
            <div className="rounded-2xl p-5 space-y-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <h2 className="font-display text-base font-semibold text-white">Order Summary</h2>

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

              <div className="h-px bg-white/[0.07]" />

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

              {step > 1 && (
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                  style={{ background: 'rgba(107,66,38,0.1)', border: '1px solid rgba(107,66,38,0.2)' }}>
                  <span>{payMethod === 'cod' ? '💵' : '🏦'}</span>
                  <span className="text-white/60 text-xs font-medium truncate">{payLabel}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
