import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { designAPI } from '../services/design.service';
import { useAuth } from '../../../shared/hooks/useAuthContext';
import { Spinner } from '../../../shared/components/Spinner';

export default function DesignDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [design,  setDesign]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    designAPI.getById(id)
      .then(r => setDesign(r.data.design))
      .catch(() => { toast.error('Design not found.'); navigate('/marketplace'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleUseDesign = () => {
    if (!user) { navigate('/signup'); return; }
    // Navigate to products page so user can pick a shirt, carrying design info
    navigate('/designs', { state: { selectedDesign: design } });
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" className="text-ink-brown" />
    </div>
  );
  if (!design) return null;

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/marketplace" className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors mb-8">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Marketplace
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          {/* Image */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45 }}>
            <div className="glass-card overflow-hidden rounded-2xl">
              <div className="relative w-full" style={{ paddingBottom: '100%' }}>
                <img
                  src={design.imageUrl}
                  alt={design.title}
                  className="absolute inset-0 w-full h-full object-contain p-6"
                />
              </div>
            </div>
          </motion.div>

          {/* Info */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45 }}
            className="space-y-6">
            <div>
              <p className="text-xs tracking-widest uppercase text-ink-brown mb-2">Marketplace Design</p>
              <h1 className="font-display text-3xl font-bold text-white mb-3">{design.title}</h1>
              {design.description && (
                <p className="text-white/50 text-sm leading-relaxed">{design.description}</p>
              )}
            </div>

            {/* Creator */}
            <div className="flex items-center gap-3 p-4 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-white text-sm"
                style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
                {design.creator?.firstName?.[0]}{design.creator?.lastName?.[0]}
              </div>
              <div>
                <p className="text-white text-sm font-medium">
                  {design.creator?.firstName} {design.creator?.lastName}
                </p>
                <p className="text-white/30 text-xs">Designer</p>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center gap-4">
              <div>
                <p className="text-white/40 text-xs mb-1">Design Price</p>
                <p className="font-display text-3xl font-bold text-white">
                  {design.price === 0
                    ? <span className="text-emerald-400">Free</span>
                    : `PKR ${Math.round(design.price).toLocaleString()}`
                  }
                </p>
                <p className="text-white/25 text-xs mt-1">Added to shirt price at checkout</p>
              </div>
            </div>

            {/* Tags */}
            {design.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {design.tags.map(tag => (
                  <span key={tag} className="text-xs px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(107,66,38,0.12)', color: 'rgba(107,66,38,0.9)', border: '1px solid rgba(107,66,38,0.2)' }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* CTA */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleUseDesign}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                </svg>
                Use This Design on a Shirt
              </button>
              {!user && (
                <p className="text-white/25 text-xs text-center">
                  <Link to="/signup" className="text-ink-brown-light hover:text-white transition-colors">Create an account</Link> to use this design
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
