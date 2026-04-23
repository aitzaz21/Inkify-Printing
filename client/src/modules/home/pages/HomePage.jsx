import { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../shared/hooks/useAuthContext';
import { statsAPI } from '../../../shared/api/footer.service';
import { reviewAPI } from '../../reviews/services/review.service';
import { designAPI } from '../../marketplace/services/design.service';
import ProductGrid from '../../products/components/ProductGrid';
import StickyCTA from '../../products/components/StickyCTA';

// ── Reusable micro-components ────────────────────────────────────

const FadeIn = ({ children, delay = 0, y = 20, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.55, delay, ease: 'easeOut' }}
    className={className}
  >
    {children}
  </motion.div>
);

const Star = ({ filled = true }) => (
  <svg className={`w-3.5 h-3.5 ${filled ? 'text-amber-400' : 'text-white/15'}`} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

// ── Feature data ─────────────────────────────────────────────────

const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
      </svg>
    ),
    title: 'Realistic Design Preview',
    desc:  'See your design on a realistic shirt mockup before ordering. Position front & back prints exactly right.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: 'Same-Week Delivery',
    desc:  'Most orders are printed and dispatched within 48–72 hours. Same-week delivery available.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: 'Premium Quality',
    desc:  'DTF & screen printing on 100% cotton shirts. Every order is quality-checked before dispatch.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
      </svg>
    ),
    title: 'No Minimum Order',
    desc:  'Order a single shirt or a thousand. No minimum quantity requirements — ever.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
    title: 'COD Available',
    desc:  'Cash on delivery across Pakistan. Pay when your order arrives at your door.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    title: 'Design Marketplace',
    desc:  'Pick from thousands of community designs or upload your own. Designers earn royalties.',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Choose Your Shirt',
    desc:  'Pick from our range of styles — classic tee, polo, V-neck and more. Select your color and size.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
      </svg>
    ),
  },
  {
    step: '02',
    title: 'Add Your Design',
    desc:  'Upload your artwork or choose from our marketplace. Drag to position it on front or back — see it in real-time.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
      </svg>
    ),
  },
  {
    step: '03',
    title: 'We Print & Deliver',
    desc:  'Place your order and we handle the rest. Premium DTF printing and tracked delivery to your door.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
  },
];

// ── Main component ────────────────────────────────────────────────

export default function HomePage() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const heroRef   = useRef(null);

  const [testimonials,    setTestimonials]    = useState([]);
  const [reviewsLoading,  setReviewsLoading]  = useState(true);
  const [homeDesigns,     setHomeDesigns]     = useState([]);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [homeStats, setHomeStats] = useState({
    ordersDelivered: '50K+',
    avgRating: '4.9',
    turnaround: '72h',
    satisfaction: '100%',
  });

  useEffect(() => {
    reviewAPI.getFeatured()
      .then(r => {
        const reviews = r.data.reviews || [];
        setTestimonials(reviews.map(rv => ({
          name:   `${rv.user?.firstName || ''} ${rv.user?.lastName || ''}`.trim() || 'Customer',
          role:   rv.order?.orderNumber ? `Order ${rv.order.orderNumber}` : 'Verified Customer',
          text:   rv.comment,
          rating: rv.rating || 5,
        })));
      })
      .catch(() => {})
      .finally(() => setReviewsLoading(false));

    statsAPI.getHome().then(r => {
      if (r.data.stats) setHomeStats(r.data.stats);
    }).catch(() => {});

    designAPI.getApproved({ limit: 6 }).then(r => {
      setHomeDesigns(r.data.designs || []);
    }).catch(() => {});
  }, []);

  // Auto-cycle testimonials
  useEffect(() => {
    if (testimonials.length < 2) return;
    const t = setInterval(() => setActiveTestimonial(i => (i + 1) % testimonials.length), 5000);
    return () => clearInterval(t);
  }, [testimonials.length]);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY       = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  return (
    <>
      {/* ─────────────────────────────────────────────────────────
          HERO — split layout: text left, visual right
      ───────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">

        {/* Background layers */}
        <motion.div style={{ y: heroY }} className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-ink-black" />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 120% 80% at 60% 0%, rgba(107,66,38,0.18) 0%, transparent 65%)' }} />
          <div className="absolute top-0 right-0 w-[50vw] h-full opacity-5"
            style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(201,150,122,0.5), transparent 60%)' }} />
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.2) 1px,transparent 1px)', backgroundSize: '72px 72px' }} />
        </motion.div>

        <motion.div style={{ opacity: heroOpacity }} className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 lg:pt-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left: Copy */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
                style={{ background: 'rgba(107,66,38,0.12)', border: '1px solid rgba(107,66,38,0.3)', color: '#C9967A' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#C9967A] animate-pulse" />
                Premium Custom Printing · Pakistan
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.7 }}
                className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.08] mb-6"
              >
                <span className="text-white">Design it.</span><br />
                <span className="text-gradient italic">Print it.</span><br />
                <span className="text-white">Wear it.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25, duration: 0.6 }}
                className="text-white/62 text-lg max-w-md mb-4 leading-relaxed"
              >
                Create custom printed shirts with a realistic live preview. Upload your design for front &amp; back, position it perfectly, and we'll deliver it to your door.
              </motion.p>

              {/* USP bullets */}
              <motion.ul
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="space-y-2 mb-10"
              >
                {[
                  'No minimum order — single shirts welcome',
                  'Same-week dispatch · Tracked delivery',
                  'Cash on delivery available',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-white/60">
                    <CheckIcon />
                    {item}
                  </li>
                ))}
              </motion.ul>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.5 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <button
                  onClick={() => navigate(user ? '/customize' : '/signup')}
                  className="flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl"
                  style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', boxShadow: '0 4px 20px rgba(107,66,38,0.4)' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                  </svg>
                  Start Designing Free
                </button>
                <Link
                  to="/designs"
                  className="btn-ghost"
                >
                  Browse Products
                  <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </motion.div>
            </div>

            {/* Right: Visual mockup panel */}
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="hidden lg:block relative"
            >
              {/* Main card */}
              <div className="relative rounded-3xl p-8 overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', minHeight: 440 }}>

                {/* Subtle radial glow */}
                <div className="absolute inset-0 opacity-40 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at 40% 30%, rgba(107,66,38,0.3), transparent 60%)' }} />

                {/* Shirt silhouette in center */}
                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                  <svg viewBox="0 0 200 220" fill="rgba(201,150,122,1)" className="w-64 h-64">
                    <path d="M75 22 L44 52 L16 42 L27 100 L50 100 L50 198 L150 198 L150 100 L173 100 L184 42 L156 52 L125 22 C118 38 82 38 75 22Z" />
                  </svg>
                </div>

                {/* Floating UI elements */}
                {[
                  { label: 'Design uploaded ✓',   sub: 'inkify-logo.png · 2.4 MB',       top: '8%',  left: '5%',  w: '58%', delay: 0.5  },
                  { label: 'Print area: Chest',    sub: 'Position: Center · Scale: 1.2×', top: '28%', left: '38%', w: '57%', delay: 0.65 },
                  { label: 'Color selected',        sub: 'Navy Blue · #1e3a5f',            top: '50%', left: '8%',  w: '44%', delay: 0.8  },
                  { label: 'Size: L · Qty: 2',     sub: 'PKR 3,998 total',                top: '65%', left: '42%', w: '53%', delay: 0.95 },
                  { label: '🚚 Dispatches in 48h', sub: 'Tracked delivery included',       top: '80%', left: '12%', w: '62%', delay: 1.1  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: item.delay, duration: 0.4 }}
                    className="absolute rounded-xl px-4 py-3"
                    style={{
                      top: item.top, left: item.left, width: item.w,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <p className="text-white/80 text-xs font-medium">{item.label}</p>
                    <p className="text-white/35 text-[10px] mt-0.5">{item.sub}</p>
                  </motion.div>
                ))}
              </div>

              {/* Floating badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.4, type: 'spring' }}
                className="absolute -top-4 -right-4 px-4 py-2.5 rounded-2xl"
                style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', boxShadow: '0 8px 24px rgba(107,66,38,0.5)' }}
              >
                <p className="text-white text-xs font-bold">4.9★ Rated</p>
              </motion.div>
            </motion.div>
          </div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-16 pt-8 border-t border-white/[0.07] grid grid-cols-3 gap-6"
          >
            {[
              { value: `${homeStats.avgRating || '4.9'}★`, label: 'Average Rating' },
              { value: homeStats.turnaround   || '72h',    label: 'Max Turnaround' },
              { value: homeStats.satisfaction || '100%',   label: 'Satisfaction'   },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="font-display text-2xl sm:text-3xl font-bold text-white">{s.value}</p>
                <p className="text-white/48 text-xs tracking-wide mt-1">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

      </section>

      {/* ─────────────────────────────────────────────────────────
          FEATURES GRID
      ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <FadeIn><p className="section-eyebrow">Why Inkify</p></FadeIn>
          <FadeIn delay={0.05}>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">
              Everything you need to <span className="italic text-gradient">print with confidence.</span>
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="text-white/40 text-sm max-w-lg mx-auto">
              From upload to doorstep — we've built a seamless experience that professionals and first-timers both love.
            </p>
          </FadeIn>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <FadeIn key={f.title} delay={i * 0.07}>
              <div className="feature-card h-full">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-[#C9967A]"
                  style={{ background: 'rgba(107,66,38,0.15)', border: '1px solid rgba(107,66,38,0.25)' }}>
                  {f.icon}
                </div>
                <h3 className="font-display text-base font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          HOW IT WORKS
      ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <FadeIn><p className="section-eyebrow">How it works</p></FadeIn>
            <FadeIn delay={0.05}>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">
                Three steps to <span className="italic text-gradient">your perfect shirt.</span>
              </h2>
            </FadeIn>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-10 left-[16.66%] right-[16.66%] h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(107,66,38,0.4), rgba(107,66,38,0.4), transparent)' }} />

            {HOW_IT_WORKS.map((step, i) => (
              <FadeIn key={step.step} delay={i * 0.12}>
                <div className="relative flex flex-col items-center text-center gap-5 p-6">
                  <div className="relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center text-[#C9967A]"
                    style={{ background: 'rgba(107,66,38,0.12)', border: '1px solid rgba(107,66,38,0.25)' }}>
                    {step.icon}
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
                      {i + 1}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-white mb-2">{step.title}</h3>
                    <p className="text-white/40 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.4} className="text-center mt-10">
            <button
              onClick={() => navigate('/customize')}
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-1"
              style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', boxShadow: '0 4px 20px rgba(107,66,38,0.35)' }}
            >
              Try the Design Studio
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </FadeIn>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          PRODUCT SHOWCASE
      ───────────────────────────────────────────────────────── */}
      <section id="products" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <FadeIn><p className="section-eyebrow">Our Products</p></FadeIn>
          <FadeIn delay={0.05}>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">
              Premium shirts, your <span className="italic text-gradient">custom design.</span>
            </h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="text-white/58 text-sm max-w-md mx-auto">
              Choose your canvas — we'll take care of the rest.
            </p>
          </FadeIn>
        </div>
        <ProductGrid />
      </section>

      {/* ─────────────────────────────────────────────────────────
          COMMUNITY DESIGNS — only if designs loaded
      ───────────────────────────────────────────────────────── */}
      {homeDesigns.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8"
          style={{ background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <FadeIn><p className="section-eyebrow">Marketplace</p></FadeIn>
                <FadeIn delay={0.05}>
                  <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
                    Community <span className="italic text-gradient">designs.</span>
                  </h2>
                </FadeIn>
                <FadeIn delay={0.1}>
                  <p className="text-white/58 text-sm mt-2 max-w-sm">
                    Browse creator designs — select one and place your order instantly.
                  </p>
                </FadeIn>
              </div>
              <FadeIn>
                <Link to="/marketplace" className="btn-ghost flex-shrink-0">
                  View All Designs
                  <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </FadeIn>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {homeDesigns.map((d, i) => (
                <FadeIn key={d._id} delay={i * 0.06}>
                  <Link
                    to={`/marketplace/${d._id}`}
                    className="group block rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <div className="aspect-square overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <img
                        src={d.imageUrl}
                        alt={d.title}
                        className="w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-2.5">
                      <p className="text-white text-xs font-semibold truncate">{d.title}</p>
                      <p className="text-[#C9967A] text-[11px] mt-0.5">
                        {d.price === 0 ? 'Free' : `PKR ${Math.round(d.price).toLocaleString()}`}
                      </p>
                    </div>
                  </Link>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────
          TESTIMONIALS
      ───────────────────────────────────────────────────────── */}
      {!reviewsLoading && testimonials.length > 0 && (
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <FadeIn><p className="section-eyebrow">Customer Reviews</p></FadeIn>
            <FadeIn delay={0.05}>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-2">
                Loved by <span className="italic text-gradient">thousands.</span>
              </h2>
            </FadeIn>
            <FadeIn delay={0.1} className="flex items-center justify-center gap-2 mt-3">
              <div className="flex">
                {[1,2,3,4,5].map(s => <Star key={s} />)}
              </div>
              <span className="text-white/50 text-sm">4.9 · {testimonials.length}+ verified reviews</span>
            </FadeIn>
          </div>

          {/* Testimonial cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div className="h-full flex flex-col gap-4 p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: 'rgba(18,14,10,0.85)',
                    border: '1px solid rgba(107,66,38,0.28)',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
                  }}>
                  {/* Stars */}
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => <Star key={s} filled={s <= (t.rating || 5)} />)}
                  </div>
                  <p className="text-white/78 text-sm leading-relaxed flex-1 line-clamp-4">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 pt-3"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
                      {t.name?.[0] || 'C'}
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold leading-tight">{t.name}</p>
                      <p className="text-white/38 text-xs mt-0.5">{t.role}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1 flex-shrink-0"
                      style={{ background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.18)', borderRadius:999, padding:'3px 7px' }}>
                      <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <span className="text-emerald-400 text-[9px] font-bold">Verified</span>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.3} className="text-center mt-10">
            <Link to="/reviews" className="btn-ghost inline-flex">
              View all reviews
              <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </FadeIn>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────
          TRUST STRIP
      ───────────────────────────────────────────────────────── */}
      <section className="py-10 px-4 sm:px-6 border-y border-white/[0.06]"
        style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { icon: '🛡', text: '100% Quality Guarantee' },
            { icon: '⚡', text: '48–72h Fast Dispatch'   },
            { icon: '🚚', text: 'Tracked Nationwide Delivery' },
            { icon: '💬', text: 'Dedicated Support'      },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: 'rgba(107,66,38,0.15)', border: '1px solid rgba(107,66,38,0.2)' }}>
                {t.icon}
              </div>
              <span className="text-white/72 text-xs leading-tight font-semibold">{t.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          FINAL CTA
      ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="relative rounded-3xl overflow-hidden text-center py-20 px-8"
              style={{ background: 'linear-gradient(135deg, rgba(107,66,38,0.22), rgba(11,11,11,0.92))', border: '1px solid rgba(107,66,38,0.28)' }}>
              <div className="absolute inset-0 pointer-events-none opacity-25"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(201,150,122,0.4), transparent 65%)' }} />
              <div className="relative z-10">
                <p className="section-eyebrow">Get started today</p>
                <h2 className="font-display text-3xl sm:text-5xl font-bold text-white mb-4 mt-2">
                  Your design.<br /><span className="italic text-gradient">Your shirt.</span>
                </h2>
                <p className="text-white/62 mb-10 max-w-md mx-auto text-sm leading-relaxed">
                  Create your free account and place your first custom shirt order in under 3 minutes.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {user ? (
                    <button onClick={() => navigate('/customize')}
                      className="inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-1"
                      style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', boxShadow: '0 4px 24px rgba(107,66,38,0.45)' }}>
                      Open Design Studio →
                    </button>
                  ) : (
                    <>
                      <Link to="/signup"
                        className="inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-1"
                        style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', boxShadow: '0 4px 24px rgba(107,66,38,0.45)' }}>
                        Create Free Account
                      </Link>
                      <Link to="/login" className="btn-ghost">
                        Sign In
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <StickyCTA />
    </>
  );
}
