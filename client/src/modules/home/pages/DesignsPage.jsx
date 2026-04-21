import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProductGrid from '../../products/components/ProductGrid';
import MidCTABanner from '../../products/components/MidCTABanner';
import StickyCTA from '../../products/components/StickyCTA';

export default function DesignsPage() {
  return (
    <div className="min-h-screen">
      {/* Page hero */}
      <div className="relative pt-28 pb-14 px-4 sm:px-6 text-center overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(107,66,38,0.18) 0%, transparent 70%)' }} />
        <div className="relative z-10 max-w-3xl mx-auto">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-xs font-medium tracking-widest uppercase text-ink-brown mb-3">
            Our Catalogue
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.55 }}
            className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
            Shop Our <span className="italic text-gradient">Products</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
            className="text-white/40 text-sm sm:text-base max-w-xl mx-auto leading-relaxed mb-8">
            Browse our catalogue — click any product to see pricing, choose your color & size, and add to cart.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
            className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/customize"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', boxShadow: '0 4px 20px rgba(107,66,38,0.3)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
              </svg>
              Customize Your Shirt
            </Link>
            <Link to="/marketplace"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white/60 hover:text-white border border-white/12 hover:border-white/25 transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              Browse Designs
              <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* How it works — quick 3-step inline */}
      <div className="max-w-3xl mx-auto px-4 pb-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { n: '1', title: 'Pick a product', sub: 'Choose color & size' },
            { n: '2', title: 'Add to cart', sub: 'Plain or with your design' },
            { n: '3', title: 'We ship it', sub: 'Fast, tracked delivery' },
          ].map((step) => (
            <div key={step.n} className="flex flex-col items-center gap-1">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-ink-brown-light mb-1"
                style={{ background: 'rgba(107,66,38,0.15)', border: '1px solid rgba(107,66,38,0.25)' }}>
                {step.n}
              </div>
              <p className="text-white/60 text-xs font-medium">{step.title}</p>
              <p className="text-white/25 text-[11px]">{step.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <ProductGrid />
      <MidCTABanner />
      <StickyCTA />
    </div>
  );
}
