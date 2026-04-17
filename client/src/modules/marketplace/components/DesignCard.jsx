import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/hooks/useAuthContext';

export default function DesignCard({ design, index = 0, onSelect, selectable = false }) {
  const { _id, title, imageUrl, price, creator, usageCount } = design;
  const navigate = useNavigate();
  const { user }  = useAuth();

  const handleBuyNow = (e) => {
    e.stopPropagation();
    // Navigate to designs page to pick a shirt first, then carry this design
    navigate(user ? '/customize' : '/login', {
      state: { preSelectedDesign: design }
    });
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ delay: (index % 6) * 0.06, duration: 0.4 }}
      className={`group glass-card overflow-hidden transition-all duration-300 hover:border-ink-brown/40 ${selectable ? 'cursor-pointer' : ''}`}
      onClick={selectable && onSelect ? () => onSelect(design) : undefined}
    >
      {/* Image — display only */}
      <div className="relative w-full" style={{ paddingBottom: '100%' }}>
        <div className="absolute inset-0 bg-white/3">
          {imageUrl
            ? <img src={imageUrl} alt={title} loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            : <div className="w-full h-full flex items-center justify-center text-white/10 text-5xl">🎨</div>
          }
        </div>
        {/* Price overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3"
          style={{ background: 'linear-gradient(to top, rgba(11,11,11,0.85) 0%, transparent 50%)' }}>
          <span className="font-display font-bold text-white text-lg">
            {price === 0 ? 'Free' : `PKR ${Math.round(price).toLocaleString()}`}
          </span>
        </div>
        {usageCount > 0 && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ background:'rgba(11,11,11,0.7)', color:'rgba(255,255,255,0.5)', backdropFilter:'blur(8px)' }}>
            {usageCount} sold
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-display text-sm font-semibold text-white leading-snug truncate">
          {title}
        </h3>
        <p className="text-white/35 text-xs mt-0.5 truncate">
          by {creator?.firstName} {creator?.lastName}
        </p>
        <div className="flex items-center justify-between mt-3">
          <span className="font-display font-bold text-white text-sm">
            {price === 0
              ? <span className="text-emerald-400/80 text-xs font-medium">Free</span>
              : `PKR ${Math.round(price).toLocaleString()}`}
          </span>
          {selectable
            ? <span className="text-xs text-ink-brown-light font-medium">Select →</span>
            : (
              <button
                onClick={handleBuyNow}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all duration-150 hover:scale-105 active:scale-95"
                style={{ background:'linear-gradient(135deg,#6B4226,#8B5A3C)', color:'#fff' }}
              >
                Buy Now
              </button>
            )
          }
        </div>
      </div>
    </motion.article>
  );
}
