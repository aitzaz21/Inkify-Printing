import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { contentAPI } from '../../../shared/api/content.service';
import { statsAPI } from '../../../shared/api/footer.service';
import { Spinner } from '../../../shared/components/Spinner';

/* ── Default content (shown while loading / if no data) ──────── */
const DEFAULTS = {
  headline:    'Built with passion,\ndelivered with precision.',
  subheadline: 'We are a premium custom printing company dedicated to bringing your creative vision to life — from bold statement tees to intricate event merch.',
  story: "Inkify Printing started with a simple belief: everyone deserves access to high-quality custom apparel without compromise. Founded by a team of designers and technologists, we built a platform where creativity meets craftsmanship.\n\nOver the years we've fulfilled tens of thousands of orders for individuals, startups, universities, and Fortune 500 companies. Every shirt that leaves our facility carries our commitment to excellence.",
  mission:  'To democratise premium custom printing — making world-class quality accessible to every creator, business, and community.',
  vision:   'A world where your imagination is the only limit. We power the merch behind brands, events, and movements.',
  values: [
    { icon: '🎨', title: 'Craftsmanship',  text: 'Every print is reviewed by hand before it ships. No shortcuts, no compromises.' },
    { icon: '⚡', title: 'Speed',           text: 'Most orders are processed and dispatched within 72 hours of confirmation.' },
    { icon: '🔒', title: 'Reliability',    text: 'From payment to delivery, every step is tracked and transparent.' },
    { icon: '🌱', title: 'Sustainability', text: 'We source eco-friendly inks and partner with responsible suppliers.' },
    { icon: '💬', title: 'Community',      text: 'Our designer marketplace gives independent artists a platform and a share of every sale.' },
    { icon: '✅', title: 'Satisfaction',   text: '100% satisfaction guarantee — if it is not right, we make it right.' },
  ],
};

const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 28 },
  whileInView:{ opacity: 1, y: 0  },
  viewport:   { once: true },
  transition: { duration: 0.55, delay, ease: 'easeOut' },
});

const ValueCard = ({ icon, title, text, delay }) => (
  <motion.div {...fadeUp(delay)}
    className="glass-card p-6 flex flex-col gap-3 group hover:border-ink-brown/40 transition-all duration-300">
    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
      style={{ background: 'rgba(107,66,38,0.12)', border: '1px solid rgba(107,66,38,0.25)' }}>
      {icon}
    </div>
    <h3 className="font-display text-base font-semibold text-white">{title}</h3>
    <p className="text-white/45 text-sm leading-relaxed">{text}</p>
  </motion.div>
);

const StatPill = ({ value, label }) => (
  <div className="text-center">
    <p className="font-display text-3xl sm:text-4xl font-bold text-white">{value}</p>
    <p className="text-white/40 text-xs tracking-wide mt-1 uppercase">{label}</p>
  </div>
);

export default function AboutPage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [vitals,  setVitals]  = useState(null);
  const [vitalsLoading, setVitalsLoading] = useState(true);

  useEffect(() => {
    contentAPI.get()
      .then(r => setData(r.data.content?.aboutPage || {}))
      .catch(() => {})
      .finally(() => setLoading(false));

    statsAPI.getHome()
      .then(r => { if (r.data.stats) setVitals(r.data.stats); })
      .catch(() => {})
      .finally(() => setVitalsLoading(false));
  }, []);

  const d = {
    headline:    data?.headline    || DEFAULTS.headline,
    subheadline: data?.subheadline || DEFAULTS.subheadline,
    story:       data?.story       || DEFAULTS.story,
    mission:     data?.mission     || DEFAULTS.mission,
    vision:      data?.vision      || DEFAULTS.vision,
    heroImage:   data?.heroImage   || '',
    values:      data?.values?.length ? data.values : DEFAULTS.values,
    teamMembers: data?.teamMembers || [],
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" className="text-ink-brown" />
    </div>
  );

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden pt-24 pb-16 px-4">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-ink-black" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] opacity-20 blur-3xl rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(107,66,38,0.6), transparent 70%)' }} />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.p {...fadeUp(0)} className="text-xs tracking-widest uppercase text-ink-brown mb-4">
            About Inkify
          </motion.p>

          <motion.h1 {...fadeUp(0.08)}
            className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
            style={{ whiteSpace: 'pre-line' }}>
            {d.headline}
          </motion.h1>

          <motion.p {...fadeUp(0.16)}
            className="text-white/50 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-10">
            {d.subheadline}
          </motion.p>

          <motion.div {...fadeUp(0.24)} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/designs"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
              Start Designing
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link to="/contact"
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl text-sm font-medium text-white/60 hover:text-white border border-white/12 hover:border-white/25 transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              Contact Us
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────── */}
      <section className="py-10 px-4 border-y border-white/[0.06]"
        style={{ background: 'rgba(255,255,255,0.015)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {vitalsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="text-center animate-pulse">
                  <div className="h-9 w-20 rounded-lg mx-auto mb-2" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <div className="h-3 w-24 rounded mx-auto" style={{ background: 'rgba(255,255,255,0.04)' }} />
                </div>
              ))
            ) : (
              <>
                <StatPill value={vitals?.ordersDelivered || '0+'} label="Orders Delivered" />
                <StatPill value={vitals?.avgRating        || '—'}  label="Average Rating"   />
                <StatPill value={vitals?.turnaround       || '72h'} label="Avg Turnaround"  />
                <StatPill value={vitals?.satisfaction     || '100%'} label="Satisfaction"   />
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── OUR STORY ─────────────────────────────────────────── */}
      {d.story && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {d.heroImage ? (
              <motion.div {...fadeUp(0)} className="rounded-2xl overflow-hidden">
                <img src={d.heroImage} alt="Our story" className="w-full h-full object-cover aspect-[4/3]" />
              </motion.div>
            ) : (
              <motion.div {...fadeUp(0)}
                className="rounded-2xl flex items-center justify-center aspect-[4/3]"
                style={{ background: 'rgba(107,66,38,0.07)', border: '1px solid rgba(107,66,38,0.15)' }}>
                <svg className="w-32 h-32 text-ink-brown/20" fill="currentColor" viewBox="0 0 100 100">
                  <path d="M35 10 L20 25 L10 20 L15 45 L25 45 L25 90 L75 90 L75 45 L85 45 L90 20 L80 25 L65 10 C62 18 38 18 35 10Z" />
                </svg>
              </motion.div>
            )}

            <div className="space-y-6">
              <motion.div {...fadeUp(0.1)}>
                <p className="text-xs tracking-widest uppercase text-ink-brown mb-3">Our Story</p>
                <h2 className="font-display text-3xl font-bold text-white mb-5">Where it all began</h2>
                <div className="space-y-4">
                  {d.story.split('\n\n').map((para, i) => (
                    <p key={i} className="text-white/50 text-sm leading-relaxed">{para}</p>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* ── MISSION & VISION ──────────────────────────────────── */}
      {(d.mission || d.vision) && (
        <section className="py-16 px-4 sm:px-6 lg:px-8"
          style={{ background: 'rgba(255,255,255,0.012)' }}>
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
            {d.mission && (
              <motion.div {...fadeUp(0)} className="glass-card p-8">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(107,66,38,0.15)', border: '1px solid rgba(107,66,38,0.25)' }}>
                  <svg className="w-6 h-6 text-ink-brown" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                </div>
                <h3 className="font-display text-xl font-bold text-white mb-3">Our Mission</h3>
                <p className="text-white/50 text-sm leading-relaxed">{d.mission}</p>
              </motion.div>
            )}
            {d.vision && (
              <motion.div {...fadeUp(0.1)} className="glass-card p-8">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="font-display text-xl font-bold text-white mb-3">Our Vision</h3>
                <p className="text-white/50 text-sm leading-relaxed">{d.vision}</p>
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* ── VALUES ────────────────────────────────────────────── */}
      {d.values.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <motion.p {...fadeUp(0)} className="text-xs tracking-widest uppercase text-ink-brown mb-3">What drives us</motion.p>
            <motion.h2 {...fadeUp(0.08)} className="font-display text-3xl sm:text-4xl font-bold text-white">
              Our <span className="italic text-gradient">core values</span>
            </motion.h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {d.values.map((v, i) => (
              <ValueCard key={i} icon={v.icon} title={v.title} text={v.text} delay={i * 0.07} />
            ))}
          </div>
        </section>
      )}

      {/* ── TEAM ──────────────────────────────────────────────── */}
      {d.teamMembers.length > 0 && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/[0.06]">
          <div className="text-center mb-12">
            <motion.p {...fadeUp(0)} className="text-xs tracking-widest uppercase text-ink-brown mb-3">The people behind the prints</motion.p>
            <motion.h2 {...fadeUp(0.08)} className="font-display text-3xl font-bold text-white">Meet our team</motion.h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {d.teamMembers.map((m, i) => (
              <motion.div key={i} {...fadeUp(i * 0.07)} className="text-center">
                <div className="w-20 h-20 rounded-2xl mx-auto mb-3 overflow-hidden"
                  style={{ background: 'rgba(107,66,38,0.12)', border: '1px solid rgba(107,66,38,0.2)' }}>
                  {m.avatar
                    ? <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-ink-brown">
                        {m.name?.[0] || '?'}
                      </div>
                  }
                </div>
                <p className="text-white text-sm font-semibold">{m.name}</p>
                <p className="text-white/35 text-xs mt-0.5">{m.role}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div {...fadeUp(0)} className="glass-card p-12 relative overflow-hidden">
            <div className="absolute inset-0 opacity-15 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at center, rgba(107,66,38,0.8), transparent 70%)' }} />
            <div className="relative z-10">
              <h2 className="font-display text-3xl font-bold text-white mb-4">
                Ready to create something <span className="italic text-gradient">amazing?</span>
              </h2>
              <p className="text-white/45 text-sm mb-8 max-w-md mx-auto leading-relaxed">
                Join thousands of creators who trust Inkify to bring their designs to life.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/designs"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
                  Start Designing →
                </Link>
                <Link to="/contact"
                  className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl text-sm font-medium text-white/60 hover:text-white border border-white/12 hover:border-white/25 transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  Talk to Us
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
