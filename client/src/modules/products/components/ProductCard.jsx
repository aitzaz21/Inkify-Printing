import { motion } from 'framer-motion';

export default function ProductCard({ product, index = 0 }) {
  const { name, description, category, image, badge, colors } = product;
  const previewColors = (colors || []).slice(0, 5);

  return (
    <motion.article
      initial={{ opacity:0, y:28 }}
      whileInView={{ opacity:1, y:0 }}
      viewport={{ once:true, margin:'-40px' }}
      transition={{ delay:(index % 4)*0.07, duration:0.45, ease:'easeOut' }}
      className="group relative flex flex-col glass-card overflow-hidden hover:border-ink-brown/30 transition-all duration-300"
    >
      {/* Image — display only, no interaction */}
      <div className="relative w-full flex-shrink-0" style={{ paddingBottom:'65%' }}>
        <div className="absolute inset-0" style={{ background:'rgba(107,66,38,0.07)' }}>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{ background:'radial-gradient(ellipse at 50% 90%, rgba(107,66,38,0.18), transparent 70%)' }} />
          {image
            ? <img src={image} alt={name} loading="lazy"
                className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105" />
            : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-14 h-14 text-ink-brown/20" fill="currentColor" viewBox="0 0 100 100">
                  <path d="M35 10 L20 25 L10 20 L15 45 L25 45 L25 90 L75 90 L75 45 L85 45 L90 20 L80 25 L65 10 C62 18 38 18 35 10Z" />
                </svg>
              </div>
            )
          }
        </div>
        {badge && (
          <span className="absolute top-3 left-3 z-10 text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ background:'rgba(107,66,38,0.35)', color:'#C48A5C', border:'1px solid rgba(107,66,38,0.4)', backdropFilter:'blur(8px)' }}>
            {badge}
          </span>
        )}
      </div>

      {/* Content — purely informational */}
      <div className="flex flex-col flex-1 p-5">
        <span className="text-xs tracking-widest uppercase text-white/25 font-medium mb-1.5 block">{category}</span>
        <h3 className="font-display text-base font-semibold text-white mb-2 leading-snug">{name}</h3>
        <p className="text-white/40 text-sm leading-relaxed flex-1"
          style={{ display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
          {description}
        </p>
        {/* Colour swatches — visual only */}
        {previewColors.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3">
            {previewColors.map((c, i) => (
              <div key={i} title={c.name} className="w-3.5 h-3.5 rounded-full border border-white/15"
                style={{ background: c.hex }} />
            ))}
            {(colors?.length || 0) > 5 && <span className="text-white/20 text-xs">+{colors.length - 5}</span>}
          </div>
        )}
      </div>
    </motion.article>
  );
}
