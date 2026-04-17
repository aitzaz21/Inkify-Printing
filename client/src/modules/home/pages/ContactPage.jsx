import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { contentAPI, contactAPI } from '../../../shared/api/content.service';
import { Spinner } from '../../../shared/components/Spinner';

const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 24 },
  whileInView:{ opacity: 1, y: 0  },
  viewport:   { once: true },
  transition: { duration: 0.5, delay },
});

const InfoCard = ({ icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(107,66,38,0.12)', border: '1px solid rgba(107,66,38,0.25)' }}>
        <span className="text-ink-brown">{icon}</span>
      </div>
      <div>
        <p className="text-white/30 text-xs uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-white/70 text-sm leading-relaxed">{value}</p>
      </div>
    </div>
  );
};

const DEFAULTS = {
  headline:    'Get in touch',
  subheadline: "Have a question or want to place a bulk order? We'd love to hear from you.",
};

export default function ContactPage() {
  const [info,    setInfo]    = useState(null);
  const [loading, setLoading] = useState(true);

  /* form state */
  const [form,    setForm]    = useState({ name: '', email: '', subject: '', message: '' });
  const [errors,  setErrors]  = useState({});
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [serverErr, setServerErr] = useState('');

  useEffect(() => {
    contentAPI.get()
      .then(r => setInfo(r.data.content?.contactPage || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cp = {
    headline:    info?.headline    || DEFAULTS.headline,
    subheadline: info?.subheadline || DEFAULTS.subheadline,
    email:       info?.email   || '',
    phone:       info?.phone   || '',
    address:     info?.address || '',
    hours:       info?.hours   || 'Mon – Fri: 9am – 6pm',
  };

  /* validation */
  const validate = () => {
    const e = {};
    if (!form.name.trim())         e.name    = 'Name is required.';
    if (!form.email.trim())        e.email   = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                                   e.email   = 'Invalid email address.';
    if (!form.message.trim())      e.message = 'Message is required.';
    else if (form.message.trim().length < 10)
                                   e.message = 'Message must be at least 10 characters.';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSending(true); setServerErr('');
    try {
      await contactAPI.submit(form);
      setSent(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (ex) {
      setServerErr(ex.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const hasInfo = cp.email || cp.phone || cp.address;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" className="text-ink-brown" />
    </div>
  );

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-16 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-ink-black" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-15 blur-3xl rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(107,66,38,0.7), transparent 70%)' }} />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <motion.p {...fadeUp(0)} className="text-xs tracking-widest uppercase text-ink-brown mb-4">
            Contact Us
          </motion.p>
          <motion.h1 {...fadeUp(0.08)} className="font-display text-4xl sm:text-5xl font-bold text-white mb-5">
            {cp.headline}
          </motion.h1>
          <motion.p {...fadeUp(0.16)} className="text-white/50 text-base leading-relaxed">
            {cp.subheadline}
          </motion.p>
        </div>
      </section>

      {/* ── MAIN CONTENT ─────────────────────────────────────── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className={`grid gap-10 ${hasInfo ? 'grid-cols-1 lg:grid-cols-5' : 'grid-cols-1 max-w-2xl mx-auto'}`}>

          {/* Left: Contact Info */}
          {hasInfo && (
            <motion.div {...fadeUp(0)} className="lg:col-span-2 space-y-8">
              <div className="glass-card p-8 space-y-7">
                <h2 className="font-display text-lg font-semibold text-white">Contact information</h2>
                <div className="space-y-6">
                  <InfoCard
                    label="Email"
                    value={cp.email}
                    icon={
                      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    }
                  />
                  <InfoCard
                    label="Phone"
                    value={cp.phone}
                    icon={
                      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                    }
                  />
                  <InfoCard
                    label="Address"
                    value={cp.address}
                    icon={
                      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                    }
                  />
                  <InfoCard
                    label="Business Hours"
                    value={cp.hours}
                    icon={
                      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                  />
                </div>
              </div>

              {/* Quick links */}
              <div className="glass-card p-6">
                <p className="text-white/30 text-xs uppercase tracking-wide mb-4">Quick links</p>
                <div className="space-y-2">
                  {[
                    { label: 'Browse our designs',   href: '/marketplace' },
                    { label: 'Start customising',    href: '/designs'     },
                    { label: 'Read the FAQ',          href: '/faq'         },
                    { label: 'Our privacy policy',   href: '/privacy'     },
                  ].map(l => (
                    <a key={l.href} href={l.href}
                      className="flex items-center gap-2 text-sm text-white/45 hover:text-white transition-colors py-1 group">
                      <svg className="w-3.5 h-3.5 text-ink-brown/60 group-hover:text-ink-brown transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                      {l.label}
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Right: Contact Form */}
          <motion.div {...fadeUp(hasInfo ? 0.1 : 0)} className={hasInfo ? 'lg:col-span-3' : ''}>
            <div className="glass-card p-8">
              {sent ? (
                <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                    style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>
                    <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <h3 className="font-display text-xl font-bold text-white mb-3">Message sent!</h3>
                  <p className="text-white/50 text-sm mb-7 max-w-xs mx-auto leading-relaxed">
                    Thanks for reaching out. We typically respond within one business day.
                  </p>
                  <button onClick={() => setSent(false)}
                    className="text-sm text-ink-brown-light hover:text-white transition-colors">
                    ← Send another message
                  </button>
                </motion.div>
              ) : (
                <>
                  <h2 className="font-display text-xl font-semibold text-white mb-6">Send us a message</h2>

                  {serverErr && (
                    <div className="mb-5 p-3.5 rounded-xl text-sm text-red-400"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      {serverErr}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} noValidate className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Name */}
                      <div>
                        <label className="label">Name <span className="text-red-400">*</span></label>
                        <input name="name" value={form.name} onChange={handleChange} placeholder="Your name"
                          className={`glass-input ${errors.name ? 'border-red-500/50' : ''}`} />
                        {errors.name && <p className="text-red-400/80 text-xs mt-1.5">{errors.name}</p>}
                      </div>
                      {/* Email */}
                      <div>
                        <label className="label">Email <span className="text-red-400">*</span></label>
                        <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="your@email.com"
                          className={`glass-input ${errors.email ? 'border-red-500/50' : ''}`} />
                        {errors.email && <p className="text-red-400/80 text-xs mt-1.5">{errors.email}</p>}
                      </div>
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="label">Subject <span className="text-white/25">(optional)</span></label>
                      <input name="subject" value={form.subject} onChange={handleChange} placeholder="What's this about?"
                        className="glass-input" />
                    </div>

                    {/* Message */}
                    <div>
                      <label className="label">Message <span className="text-red-400">*</span></label>
                      <textarea name="message" rows={5} value={form.message} onChange={handleChange}
                        placeholder="Tell us how we can help…"
                        className={`glass-input resize-none ${errors.message ? 'border-red-500/50' : ''}`} />
                      <div className="flex items-center justify-between mt-1">
                        {errors.message
                          ? <p className="text-red-400/80 text-xs">{errors.message}</p>
                          : <span />
                        }
                        <span className="text-white/20 text-xs">{form.message.length}/2000</span>
                      </div>
                    </div>

                    <button type="submit" disabled={sending}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                      style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
                      {sending ? (
                        <><Spinner size="sm" className="text-white" /> Sending…</>
                      ) : (
                        <>
                          Send Message
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                          </svg>
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
