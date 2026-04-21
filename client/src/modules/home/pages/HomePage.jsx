import { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useAuth } from '../../../shared/hooks/useAuthContext';
import { contentAPI } from '../../../shared/api/content.service';
import { statsAPI } from '../../../shared/api/footer.service';
import { reviewAPI } from '../../reviews/services/review.service';
import { designAPI } from '../../marketplace/services/design.service';
import DesignCard from '../../marketplace/components/DesignCard';
import ProductGrid from '../../products/components/ProductGrid';
import MidCTABanner from '../../products/components/MidCTABanner';
import StickyCTA from '../../products/components/StickyCTA';

const Stat = ({ value, label }) => (
  <div className="text-center">
    <p className="font-display text-2xl sm:text-3xl font-bold text-white">{value}</p>
    <p className="text-white/35 text-xs tracking-wide mt-0.5">{label}</p>
  </div>
);

const Trust = ({ icon, text }) => (
  <div className="flex items-center gap-2.5">
    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(107,66,38,0.18)', border: '1px solid rgba(107,66,38,0.25)' }}>{icon}</div>
    <span className="text-white/50 text-xs leading-tight">{text}</span>
  </div>
);

const Step = ({ n, title, desc, delay }) => (
  <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay, duration: 0.5 }} className="flex gap-5">
    <div className="flex-shrink-0 mt-0.5">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center font-display text-sm font-bold text-ink-brown-light" style={{ background: 'rgba(107,66,38,0.15)', border: '1px solid rgba(107,66,38,0.3)' }}>{n}</div>
    </div>
    <div>
      <h4 className="font-display text-base font-semibold text-white mb-1">{title}</h4>
      <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
    </div>
  </motion.div>
);

const STARS = [1,2,3,4,5];

export default function HomePage() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const heroRef   = useRef(null);
  const [testimonials, setTestimonials] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [homeStats, setHomeStats] = useState({
    ordersDelivered: '50K+',
    avgRating: '4.9★',
    turnaround: '72h',
    satisfaction: '100%',
    totalOrders: null,
    totalDesigns: null,
    totalReviews: null,
  });
  const [homeDesigns, setHomeDesigns] = useState([]);

  useEffect(() => {
    // Load featured reviews — only show real admin-selected reviews
    reviewAPI.getFeatured()
      .then(r => {
        const reviews = r.data.reviews || [];
        setTestimonials(reviews.map(rv => ({
          name:   `${rv.user?.firstName || ''} ${rv.user?.lastName || ''}`.trim() || 'Customer',
          role:   rv.order?.orderNumber ? `Order ${rv.order.orderNumber}` : 'Verified Customer',
          text:   rv.comment,
          rating: rv.rating,
        })));
      })
      .catch(() => {})
      .finally(() => setReviewsLoading(false));

    // Load dynamic stats
    statsAPI.getHome().then(r => {
      if (r.data.stats) setHomeStats(r.data.stats);
    }).catch(() => {});

    // Load marketplace designs for homepage
    designAPI.getApproved({ limit: 6 }).then(r => {
      setHomeDesigns(r.data.designs || []);
    }).catch(() => {});
  }, []);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY       = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <>
      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <motion.div style={{ y: heroY }} className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-ink-black" />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 90% 65% at 50% -5%, rgba(107,66,38,0.22) 0%, transparent 70%)' }} />
          <div className="absolute top-1/3 left-1/4 w-80 h-80 rounded-full blur-3xl opacity-10" style={{ background: 'radial-gradient(circle, #6B4226, transparent)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-8" style={{ background: 'radial-gradient(circle, #8B5A3C, transparent)' }} />
          <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.15) 1px,transparent 1px)', backgroundSize: '64px 64px' }} />
        </motion.div>

        <motion.div style={{ opacity: heroOpacity }} className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center pt-28 pb-20">
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border border-ink-brown/30 text-xs font-medium text-ink-brown-light tracking-widest uppercase"
            style={{ background: 'rgba(107,66,38,0.08)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-ink-brown animate-pulse" />
            Premium Custom Printing
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.7 }}
            className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-tight mb-6">
            <span className="text-white">Your design.</span><br />
            <span className="text-gradient italic">Our precision.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25, duration: 0.6 }}
            className="text-white/50 text-lg sm:text-xl max-w-2xl mx-auto mb-12 leading-relaxed font-light">
            From custom shirts to large-format banners — Inkify delivers world-class print quality with same-week turnaround.
          </motion.p>

          {/* HERO CTA */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate(user ? '/customize' : '/signup')}
              className="flex items-center gap-3 px-8 py-4 rounded-xl text-sm font-medium text-white tracking-wide transition-all duration-200 hover:-translate-y-1"
              style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', boxShadow: '0 4px 20px rgba(107,66,38,0.3)' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 32px rgba(107,66,38,0.5)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(107,66,38,0.3)'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
              </svg>
              Start Creating Your Shirt
            </button>
            <a href="#products" className="flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-medium text-white/60 hover:text-white tracking-wide border border-white/12 hover:border-white/25 transition-all duration-200" style={{ background: 'rgba(255,255,255,0.04)' }}>
              Browse Products
              <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55, duration: 0.6 }}
            className="mt-16 pt-10 border-t border-white/[0.08] flex flex-wrap justify-center gap-10 sm:gap-16">
            <Stat value={homeStats.ordersDelivered} label="Orders Delivered" />
            <Stat value={homeStats.avgRating} label="Average Rating" />
            <Stat value={homeStats.turnaround}  label="Max Turnaround" />
            <Stat value={homeStats.satisfaction} label="Satisfaction Guaranteed" />
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-white/20 text-xs tracking-widest uppercase">Scroll</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.6 }} className="w-px h-8 bg-gradient-to-b from-white/20 to-transparent" />
        </motion.div>
      </section>

      {/* ── TRUST BAR ── */}
      <section className="border-y border-white/6 py-8 px-4 sm:px-6" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6">
          <Trust icon={<svg className="w-4 h-4 text-ink-brown" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>} text="Quality Guaranteed" />
          <Trust icon={<svg className="w-4 h-4 text-ink-brown" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>} text="Fast Turnaround" />
          <Trust icon={<svg className="w-4 h-4 text-ink-brown" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>} text="Tracked Delivery" />
          <Trust icon={<svg className="w-4 h-4 text-ink-brown" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" /></svg>} text="Expert Support" />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-xs font-medium tracking-widest uppercase text-ink-brown mb-3">Simple Process</motion.p>
            <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
              Three steps to <span className="italic text-gradient">perfection.</span>
            </motion.h2>
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-white/40 text-sm leading-relaxed mb-10 max-w-sm">
              We've stripped away the complexity. Go from idea to delivered print in days, not weeks.
            </motion.p>
            <div className="space-y-8">
              <Step n="01" title="Choose Your Product" desc="Browse our catalogue and pick the format that suits your message — apparel, cards, banners, and more." delay={0} />
              <Step n="02" title="Upload Your Design" desc="Drop your artwork or use our design tools. Our pre-press team checks every file before printing." delay={0.1} />
              <Step n="03" title="We Print & Deliver" desc="Your order is printed on premium materials and shipped with full tracking to your door." delay={0.2} />
            </div>
          </div>
          {/* Visual panel */}
          <motion.div initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="relative hidden lg:block">
            <div className="relative rounded-3xl glass-card p-10" style={{ minHeight: 380 }}>
              <div className="absolute inset-0 rounded-3xl opacity-30" style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(107,66,38,0.4), transparent 60%)' }} />
              {[
                { w: '70%', h: 52, top: '10%', left: '15%', label: 'Your Artwork', op: 0.9 },
                { w: '44%', h: 36, top: '40%', left: '8%',  label: 'Color Profile', op: 0.65 },
                { w: '40%', h: 36, top: '40%', left: '55%', label: 'Print Ready',   op: 0.75 },
                { w: '58%', h: 28, top: '68%', left: '21%', label: 'Processing…',   op: 0.4 },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: item.op, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.1 }}
                  className="absolute rounded-xl flex items-center px-4"
                  style={{ width: item.w, height: item.h, top: item.top, left: item.left, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
                  <span className="text-xs text-white/50">{item.label}</span>
                  <div className="ml-auto w-2 h-2 rounded-full bg-ink-brown/60 animate-pulse" />
                </motion.div>
              ))}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(107,66,38,0.15)', border: '1px solid rgba(107,66,38,0.25)' }}>
                  <svg className="w-4 h-4 text-ink-brown flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="text-white/60 text-xs">Pre-press check passed — ready to print</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── PRODUCT GRID (static showcase — no buy buttons inside) ── */}
      <ProductGrid />

      {/* ── MID CTA: "Ready to print your idea?" + Buy Now button ── */}
      <MidCTABanner />

      {/* ── COMMUNITY DESIGNS ── */}
      {homeDesigns.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="text-xs font-medium tracking-widest uppercase text-ink-brown mb-3">Community</motion.p>
            <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
              className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">
              Featured <span className="italic text-gradient">Designs</span>
            </motion.h2>
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="text-white/40 text-sm max-w-md mx-auto">
              Browse community-made designs. Select one and we'll print it on your shirt.
            </motion.p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {homeDesigns.map((d, i) => <DesignCard key={d._id} design={d} index={i} />)}
          </div>
          <div className="text-center mt-8">
            <Link to="/marketplace"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white/60 hover:text-white border border-white/12 hover:border-white/25 transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              Browse All Designs
              <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </Link>
          </div>
        </section>
      )}

      {/* ── TESTIMONIALS — only shown when admin has featured real reviews ── */}
      {!reviewsLoading && testimonials.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <motion.p initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}
              className="text-xs tracking-widest uppercase text-ink-brown mb-3">What customers say</motion.p>
            <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.06 }}
              className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">
              Loved by <span className="italic text-gradient">creators.</span>
            </motion.h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={t.name + i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}
                className="glass-card p-6 flex flex-col gap-4 hover:border-ink-brown/35 transition-all duration-300">
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating || 5 }).map((_, s) => <svg key={s} className="w-4 h-4 text-ink-brown" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
                </div>
                <p className="text-white/55 text-sm leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
                <div className="pt-3 border-t border-white/[0.08]">
                  <p className="text-white text-sm font-medium">{t.name}</p>
                  <p className="text-white/30 text-xs">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/reviews"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white/60 hover:text-white border border-white/12 hover:border-white/25 transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              View All Reviews
              <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </Link>
          </div>
        </section>
      )}

      {/* ── FINAL CTA ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="relative rounded-3xl overflow-hidden py-16 px-8"
            style={{ background: 'linear-gradient(135deg, rgba(107,66,38,0.2), rgba(11,11,11,0.9))', border: '1px solid rgba(107,66,38,0.25)' }}>
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(107,66,38,0.6), transparent 70%)' }} />
            <div className="relative z-10">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">Ready to <span className="italic text-gradient">start printing?</span></h2>
              <p className="text-white/45 mb-8 max-w-md mx-auto text-sm">Create your free account and place your first order in minutes.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <button onClick={() => navigate('/customize')} className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-medium text-white tracking-wide transition-all duration-200 hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>Open Design Studio →</button>
                ) : (
                  <>
                    <Link to="/signup" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-medium text-white tracking-wide transition-all duration-200 hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>Create Free Account</Link>
                    <Link to="/login" className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-sm font-medium text-white/60 hover:text-white tracking-wide border border-white/12 hover:border-white/25 transition-all duration-200" style={{ background: 'rgba(255,255,255,0.04)' }}>Sign In</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Sticky floating Buy Now — appears after 600px scroll */}
      <StickyCTA />
    </>
  );
}
