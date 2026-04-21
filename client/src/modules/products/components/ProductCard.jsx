import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fmt } from '../../../shared/utils/currency';

export default function ProductCard({ product, index = 0 }) {
  const { _id, name, description, category, image, badge, colors, basePrice, sizePricing } = product;
  const previewColors = (colors || []).slice(0, 5);

  const sizePricingMap = sizePricing instanceof Map
    ? Object.fromEntries(sizePricing)
    : (sizePricing || {});
  const hasSizePremium = Object.keys(sizePricingMap).length > 0;
  const displayPrice   = Number(basePrice || 0);

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: (index % 4) * 0.07, duration: 0.45, ease: 'easeOut' }}
      className="group relative flex flex-col glass-card overflow-hidden hover:border-ink-brown/35 transition-all duration-300 hover:-translate-y-1"
      style={{ cursor: 'pointer' }}
    >
      <Link to={`/products/${_id}`} className="flex flex-col flex-1">
        {/* Image */}
        <div className="relative w-full flex-shrink-0" style={{ paddingBottom: '65%' }}>
          <div className="absolute inset-0" style={{ background: 'rgba(107,66,38,0.07)' }}>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 50% 90%, rgba(107,66,38,0.22), transparent 70%)' }} />
            {image ? (
              <img src={image} alt={name} loading="lazy"
                className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-14 h-14 text-ink-brown/20" fill="currentColor" viewBox="0 0 100 100">
                  <path d="M35 10 L20 25 L10 20 L15 45 L25 45 L25 90 L75 90 L75 45 L85 45 L90 20 L80 25 L65 10 C62 18 38 18 35 10Z" />
                </svg>
              </div>
            )}
          </div>

          {badge && (
            <span className="absolute top-3 left-3 z-10 text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(107,66,38,0.35)', color: '#C48A5C', border: '1px solid rgba(107,66,38,0.4)', backdropFilter: 'blur(8px)' }}>
              {badge}
            </span>
          )}

          {/* Hover overlay CTA */}
          <div className="absolute inset-0 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
            <span className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-white"
              style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', boxShadow: '0 4px 16px rgba(107,66,38,0.5)' }}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              Buy Now
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-5">
          <span className="text-xs tracking-widest uppercase text-white/25 font-medium mb-1.5 block">{category}</span>
          <h3 className="font-display text-base font-semibold text-white mb-2 leading-snug group-hover:text-ink-brown-light transition-colors duration-200">{name}</h3>
          <p className="text-white/40 text-sm leading-relaxed flex-1"
            style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {description}
          </p>

          {/* Price + color swatches row */}
          <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <span className="font-display text-base font-bold text-white">{fmt(displayPrice)}</span>
              {hasSizePremium && (
                <span className="text-white/25 text-[10px] ml-1">/ from</span>
              )}
            </div>
            {previewColors.length > 0 && (
              <div className="flex items-center gap-1.5">
                {previewColors.map((c, i) => (
                  <div key={i} title={c.name} className="w-3.5 h-3.5 rounded-full border border-white/15 flex-shrink-0"
                    style={{ background: c.hex }} />
                ))}
                {(colors?.length || 0) > 5 && (
                  <span className="text-white/20 text-[10px]">+{colors.length - 5}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
