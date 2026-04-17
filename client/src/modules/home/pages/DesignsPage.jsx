import { motion } from 'framer-motion';
import ProductGrid from '../../products/components/ProductGrid';
import MidCTABanner from '../../products/components/MidCTABanner';
import StickyCTA from '../../products/components/StickyCTA';

export default function DesignsPage() {
  return (
    <div className="min-h-screen">
      <div className="relative pt-28 pb-14 px-4 sm:px-6 text-center overflow-hidden">
        <div className="absolute inset-0" style={{ background:'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(107,66,38,0.18) 0%, transparent 70%)' }} />
        <div className="relative z-10 max-w-3xl mx-auto">
          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }}
            className="text-xs font-medium tracking-widest uppercase text-ink-brown mb-3">
            Inspiration
          </motion.p>
          <motion.h1 initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.08, duration:0.55 }}
            className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
            Our <span className="italic text-gradient">Products</span>
          </motion.h1>
          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.18 }}
            className="text-white/40 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Browse our range for inspiration, then use the Buy Now button to start customising your own shirt.
          </motion.p>
        </div>
      </div>
      <ProductGrid />
      <MidCTABanner />
      <StickyCTA />
    </div>
  );
}
