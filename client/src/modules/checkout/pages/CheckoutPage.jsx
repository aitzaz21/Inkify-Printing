import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useCart } from '../../../shared/context/CartContext';
import { useAuth } from '../../../shared/hooks/useAuthContext';
import { orderAPI } from '../../orders/services/order.service';
import { Spinner } from '../../../shared/components/Spinner';

const Field = ({ label, error, children }) => (
  <div>
    <label className="label">{label}</label>
    {children}
    {error && <p className="error-text">⚠ {error}</p>}
  </div>
);

const PayMethod = ({ label, desc, icon, selected, onClick }) => (
  <button type="button" onClick={onClick}
    className="w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200"
    style={{
      border:     selected ? '1.5px solid rgba(107,66,38,0.6)' : '1.5px solid rgba(255,255,255,0.08)',
      background: selected ? 'rgba(107,66,38,0.1)'            : 'rgba(255,255,255,0.03)',
    }}>
    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
      style={{ background: 'rgba(255,255,255,0.06)' }}>{icon}</div>
    <div className="text-left flex-1">
      <p className="text-white text-sm font-medium">{label}</p>
      <p className="text-white/35 text-xs">{desc}</p>
    </div>
    <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
      style={{ borderColor: selected ? '#6B4226' : 'rgba(255,255,255,0.2)' }}>
      {selected && <div className="w-2 h-2 rounded-full" style={{ background: '#6B4226' }} />}
    </div>
  </button>
);

// Luhn check for basic card validation
const luhn = (n) => {
  let s = 0; let alt = false;
  for (let i = n.length - 1; i >= 0; i--) {
    let d = parseInt(n[i], 10);
    if (alt) { d *= 2; if (d > 9) d -= 9; }
    s += d; alt = !alt;
  }
  return s % 10 === 0;
};

const formatCard = (v) => v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
const formatExp  = (v) => { const d = v.replace(/\D/g,''); return d.length > 2 ? `${d.slice(0,2)}/${d.slice(2,4)}` : d; };

export default function CheckoutPage() {
  const navigate   = useNavigate();
  const { items, subtotal, shipping, total, clearCart } = useCart();
  const { user }   = useAuth();

  const [loading,   setLoading]   = useState(false);
  const [payMethod, setPayMethod] = useState('cod');
  const [errors,    setErrors]    = useState({});

  const [form, setForm] = useState({
    firstName:  user?.firstName  || '',
    lastName:   user?.lastName   || '',
    street:     user?.address?.street     || '',
    city:       user?.address?.city       || '',
    state:      user?.address?.state      || '',
    postalCode: user?.address?.postalCode || '',
    country:    user?.address?.country    || '',
    phone:      '',
  });

  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' });

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => { const n={...e}; delete n[k]; return n; }); };
  const setC = (k, v) => { setCard(c => ({ ...c, [k]: v })); setErrors(e => { const n={...e}; delete n[k]; return n; }); };

  const validate = () => {
    const e = {};
    ['firstName','lastName','street','city','state','postalCode','country','phone'].forEach(k => {
      if (!form[k].trim()) e[k] = 'Required';
    });
    if (payMethod === 'card') {
      const raw = card.number.replace(/\s/g,'');
      if (!card.name.trim())              e.cardName   = 'Required';
      if (raw.length < 16 || !luhn(raw)) e.cardNumber = 'Invalid card number';
      if (!/^\d{2}\/\d{2}$/.test(card.expiry)) e.cardExpiry = 'Format: MM/YY';
      if (!/^\d{3,4}$/.test(card.cvv))   e.cardCvv    = 'Invalid CVV';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { toast.error('Please fix the highlighted fields.'); return; }
    if (!items.length) { toast.error('Your cart is empty.'); return; }

    setLoading(true);
    try {
      const payload = {
        items: items.map(i => ({
          // Only pass product if it's a real MongoDB ObjectId, not 'custom'
          ...(i.productId && i.productId !== 'custom' ? { product: i.productId } : {}),
          productName: i.productName,
          shirtType:   i.shirtType   || '',
          color:       i.color,
          colorHex:    i.colorHex    || '#FFFFFF',
          size:        i.size,
          quantity:    i.quantity,
          unitPrice:   i.unitPrice,
          designUrl:   i.designUrl   || null,
          designId:    i.designId    || null,
          designNote:  i.designNote  || '',
        })),
        shippingAddress: { ...form },
        paymentMethod: payMethod,
        ...(payMethod === 'card' && {
          cardDetails: {
            // Only pass last 4 digits to backend — never the full card
            last4:         card.number.replace(/\s/g,'').slice(-4),
            transactionId: `TXN-${Date.now()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`,
            reference:     `REF-${Date.now()}`,
          },
        }),
      };

      const res     = await orderAPI.create(payload);
      const orderId = res.data.order._id;
      clearCart();
      toast.success('Order placed! Check your email for confirmation.');
      navigate(`/orders/${orderId}`, { state: { success: true } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!items.length) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-white/50 mb-4">Nothing to checkout.</p>
        <button onClick={() => navigate('/designs')} className="btn-primary w-auto px-8">Browse Shirts</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <p className="text-xs tracking-widest uppercase text-ink-brown mb-1">Almost there</p>
          <h1 className="font-display text-3xl font-bold text-white">Checkout</h1>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping */}
              <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} className="glass-card p-6 sm:p-8">
                <h2 className="font-display text-lg font-semibold text-white mb-5">Shipping Address</h2>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="First Name" error={errors.firstName}>
                    <input className="glass-input" value={form.firstName} onChange={e=>set('firstName',e.target.value)} placeholder="John" />
                  </Field>
                  <Field label="Last Name" error={errors.lastName}>
                    <input className="glass-input" value={form.lastName} onChange={e=>set('lastName',e.target.value)} placeholder="Doe" />
                  </Field>
                  <div className="col-span-2">
                    <Field label="Street Address" error={errors.street}>
                      <input className="glass-input" value={form.street} onChange={e=>set('street',e.target.value)} placeholder="123 Main St" />
                    </Field>
                  </div>
                  <Field label="City" error={errors.city}>
                    <input className="glass-input" value={form.city} onChange={e=>set('city',e.target.value)} placeholder="Cape Town" />
                  </Field>
                  <Field label="Province / State" error={errors.state}>
                    <input className="glass-input" value={form.state} onChange={e=>set('state',e.target.value)} placeholder="Western Cape" />
                  </Field>
                  <Field label="Postal Code" error={errors.postalCode}>
                    <input className="glass-input" value={form.postalCode} onChange={e=>set('postalCode',e.target.value)} placeholder="8001" />
                  </Field>
                  <Field label="Country" error={errors.country}>
                    <input className="glass-input" value={form.country} onChange={e=>set('country',e.target.value)} placeholder="South Africa" />
                  </Field>
                  <div className="col-span-2">
                    <Field label="Phone" error={errors.phone}>
                      <input className="glass-input" value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="+92 3XX XXXXXXX" />
                    </Field>
                  </div>
                </div>
              </motion.div>

              {/* Payment */}
              <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.07 }} className="glass-card p-6 sm:p-8">
                <h2 className="font-display text-lg font-semibold text-white mb-5">Payment Method</h2>
                <div className="space-y-3">
                  <PayMethod label="Cash on Delivery" desc="Pay when your order arrives" icon="💵"
                    selected={payMethod==='cod'} onClick={()=>setPayMethod('cod')} />
                  <PayMethod label="Pay by Card" desc="Visa, Mastercard — secure & instant" icon="💳"
                    selected={payMethod==='card'} onClick={()=>setPayMethod('card')} />
                </div>

                <AnimatePresence>
                  {payMethod === 'card' && (
                    <motion.div
                      initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
                      className="mt-5 space-y-4 overflow-hidden"
                    >
                      <div className="p-3 rounded-xl text-xs text-white/50 flex items-center gap-2"
                        style={{ background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.18)' }}>
                        <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                        <span>Your card details are encrypted and never stored on our servers.</span>
                      </div>

                      <Field label="Cardholder Name" error={errors.cardName}>
                        <input className="glass-input" value={card.name}
                          onChange={e=>setC('name',e.target.value)} placeholder="John Doe" />
                      </Field>
                      <Field label="Card Number" error={errors.cardNumber}>
                        <input className="glass-input font-mono tracking-widest" value={card.number}
                          onChange={e=>setC('number', formatCard(e.target.value))}
                          placeholder="0000 0000 0000 0000" maxLength={19} inputMode="numeric" />
                      </Field>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Expiry (MM/YY)" error={errors.cardExpiry}>
                          <input className="glass-input font-mono" value={card.expiry}
                            onChange={e=>setC('expiry', formatExp(e.target.value))}
                            placeholder="MM/YY" maxLength={5} inputMode="numeric" />
                        </Field>
                        <Field label="CVV" error={errors.cardCvv}>
                          <input className="glass-input font-mono" value={card.cvv} type="password"
                            onChange={e=>setC('cvv', e.target.value.replace(/\D/g,'').slice(0,4))}
                            placeholder="•••" maxLength={4} inputMode="numeric" />
                        </Field>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Right: summary */}
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.12 }} className="space-y-4">
              <div className="glass-card p-5 space-y-4">
                <h2 className="font-display text-base font-semibold text-white">Order Summary</h2>
                <div className="space-y-3 max-h-56 overflow-y-auto">
                  {items.map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center"
                        style={{ background: item.colorHex ? `${item.colorHex}30`:'rgba(107,66,38,0.15)', border:'1px solid rgba(255,255,255,0.08)' }}>
                        {item.image
                          ? <img src={item.image} alt="" className="w-full h-full object-contain rounded-lg" />
                          : <span className="text-lg">👕</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium truncate">{item.productName}</p>
                        <p className="text-white/35 text-xs">{item.color} · {item.size} · ×{item.quantity}</p>
                      </div>
                      <span className="text-white text-xs font-semibold flex-shrink-0">PKR {Math.round(item.unitPrice*item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="h-px bg-white/[0.08]" />
                {[
                  { k:'Subtotal', v:`PKR ${Math.round(subtotal).toLocaleString()}` },
                  { k:'Shipping', v: shipping===0 ? 'Free' : `PKR ${Math.round(shipping).toLocaleString()}` },
                ].map(({k,v}) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-white/40">{k}</span>
                    <span className="text-white">{v}</span>
                  </div>
                ))}
                <div className="flex justify-between">
                  <span className="text-white font-semibold">Total</span>
                  <span className="font-display text-xl font-bold text-white">PKR {Math.round(total).toLocaleString()}</span>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60">
                {loading && <Spinner size="sm" className="text-white" />}
                {loading ? 'Processing…' : payMethod==='card' ? '🔒 Pay Now' : 'Place Order'}
              </button>
              <p className="text-white/20 text-xs text-center">
                By placing an order you agree to our terms &amp; conditions.
              </p>
            </motion.div>
          </div>
        </form>
      </div>
    </div>
  );
}
