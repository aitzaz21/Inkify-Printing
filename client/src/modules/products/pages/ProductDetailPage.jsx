import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { productAPI } from '../services/product.service';
import { useCart } from '../../../shared/context/CartContext';
import { useAuth } from '../../../shared/hooks/useAuthContext';
import { fmt } from '../../../shared/utils/currency';
import { Spinner } from '../../../shared/components/Spinner';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    setLoading(true);
    productAPI.getById(id)
      .then(r => {
        const p = r.data.product;
        setProduct(p);
        if (p.colors?.length > 0) setSelectedColor(p.colors[0]);
        const availSizes = p.sizes?.length > 0 ? p.sizes : SIZES;
        setSelectedSize(availSizes.includes('M') ? 'M' : availSizes[0]);
      })
      .catch(() => setError('Product not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" className="text-ink-brown" />
    </div>
  );

  if (error || !product) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-white/50 text-sm">{error || 'Product not found.'}</p>
      <button onClick={() => navigate('/designs')} className="btn-primary w-auto px-6">
        Browse Products
      </button>
    </div>
  );

  const availableSizes = product.sizes?.length > 0 ? product.sizes : SIZES;
  const sizePricingMap = product.sizePricing instanceof Map
    ? Object.fromEntries(product.sizePricing)
    : (product.sizePricing || {});

  const sizeExtra = Number(sizePricingMap[selectedSize] || 0);
  const unitPrice = Number(product.basePrice || 0) + sizeExtra;
  const lineTotal = unitPrice * quantity;

  const currentImage = selectedColor?.image || product.image;

  const handleAddToCart = () => {
    if (!user) { navigate('/login'); return; }
    if (!selectedColor && product.colors?.length > 0) {
      toast.error('Please select a color.'); return;
    }
    setAddingToCart(true);
    setTimeout(() => {
      addItem({
        productId:   product._id,
        productName: product.name,
        shirtType:   product.name,
        color:       selectedColor?.name || 'Default',
        colorHex:    selectedColor?.hex  || '#000',
        size:        selectedSize,
        quantity,
        unitPrice,
        designUrl:   null,
        designId:    null,
        designNote:  null,
        designPrice: 0,
        image:       currentImage || null,
      });
      setAddingToCart(false);
    }, 400);
  };

  const handleCustomize = () => {
    if (!user) { navigate('/login'); return; }
    navigate('/customize', {
      state: {
        preSelectedProduct: {
          _id:      product._id,
          name:     product.name,
          image:    currentImage,
          basePrice: product.basePrice,
          sizePricing: sizePricingMap,
          colors:   product.colors,
          sizes:    availableSizes,
        },
        preSelectedColor: selectedColor,
        preSelectedSize:  selectedSize,
      },
    });
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-white/30 mb-10">
        <Link to="/" className="hover:text-white/60 transition-colors">Home</Link>
        <span>/</span>
        <Link to="/designs" className="hover:text-white/60 transition-colors">Products</Link>
        <span>/</span>
        <span className="text-white/60">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* ── LEFT: Image panel ── */}
        <div className="space-y-4">
          <motion.div
            key={currentImage}
            initial={{ opacity: 0.7, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="relative aspect-square rounded-2xl overflow-hidden"
            style={{ background: 'rgba(107,66,38,0.07)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {product.badge && (
              <span className="absolute top-4 left-4 z-10 text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(107,66,38,0.45)', color: '#C48A5C', border: '1px solid rgba(107,66,38,0.5)', backdropFilter: 'blur(8px)' }}>
                {product.badge}
              </span>
            )}
            {currentImage ? (
              <img src={currentImage} alt={product.name}
                className="w-full h-full object-cover object-center" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-24 h-24 text-ink-brown/15" fill="currentColor" viewBox="0 0 100 100">
                  <path d="M35 10 L20 25 L10 20 L15 45 L25 45 L25 90 L75 90 L75 45 L85 45 L90 20 L80 25 L65 10 C62 18 38 18 35 10Z" />
                </svg>
              </div>
            )}
          </motion.div>

          {/* Color image thumbnails */}
          {product.colors?.filter(c => c.image).length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.colors.filter(c => c.image).map((c, i) => (
                <button key={i} onClick={() => setSelectedColor(c)}
                  className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all duration-200"
                  style={{
                    border: selectedColor?.name === c.name
                      ? '2px solid #8B5A3C'
                      : '2px solid rgba(255,255,255,0.1)',
                  }}>
                  <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: Product info ── */}
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div>
            <span className="text-xs tracking-widest uppercase text-ink-brown font-medium">{product.category}</span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mt-1 mb-3 leading-tight">
              {product.name}
            </h1>
            {/* Price display */}
            <div className="flex items-baseline gap-3">
              <span className="font-display text-3xl font-bold text-white">{fmt(unitPrice)}</span>
              {sizeExtra > 0 && (
                <span className="text-xs text-ink-brown-light">
                  includes +{fmt(sizeExtra)} for {selectedSize}
                </span>
              )}
            </div>
            {Object.keys(sizePricingMap).length > 0 && (
              <p className="text-white/30 text-xs mt-1">
                Starting from {fmt(product.basePrice)} · Size premiums may apply
              </p>
            )}
          </div>

          {/* Color picker */}
          {product.colors?.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-white/70">Color</span>
                <span className="text-sm text-ink-brown-light">{selectedColor?.name || '—'}</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {product.colors.map((c, i) => (
                  <button key={i} title={c.name} onClick={() => setSelectedColor(c)}
                    className="relative w-9 h-9 rounded-full transition-all duration-200 focus:outline-none"
                    style={{
                      background: c.hex || '#888',
                      border: selectedColor?.name === c.name
                        ? '3px solid #8B5A3C'
                        : '2px solid rgba(255,255,255,0.15)',
                      transform: selectedColor?.name === c.name ? 'scale(1.15)' : 'scale(1)',
                      boxShadow: selectedColor?.name === c.name ? '0 0 0 2px rgba(107,66,38,0.4)' : 'none',
                    }}>
                    {selectedColor?.name === c.name && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-white drop-shadow" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size picker */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white/70">Size</span>
              <button className="text-xs text-ink-brown hover:text-ink-brown-light transition-colors">Size Guide</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map(size => {
                const extra = Number(sizePricingMap[size] || 0);
                const isSelected = selectedSize === size;
                return (
                  <button key={size} onClick={() => setSelectedSize(size)}
                    className="relative min-w-[3rem] px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                    style={isSelected ? {
                      background: 'linear-gradient(135deg,#6B4226,#8B5A3C)',
                      color: '#fff',
                      border: '1px solid transparent',
                    } : {
                      background: 'rgba(255,255,255,0.05)',
                      color: 'rgba(255,255,255,0.6)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}>
                    {size}
                    {extra > 0 && (
                      <span className="block text-[9px] mt-0.5 opacity-70">+{extra}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <span className="text-sm font-medium text-white/70 block mb-3">Quantity</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center rounded-xl overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}>
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.05] transition-all text-lg font-light">
                  −
                </button>
                <span className="w-10 text-center text-white text-sm font-medium">{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)}
                  className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.05] transition-all text-lg font-light">
                  +
                </button>
              </div>
              <span className="text-white/30 text-sm">
                {quantity > 1 ? `${fmt(lineTotal)} total` : ''}
              </span>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button onClick={handleAddToCart} disabled={addingToCart}
              className="flex-1 flex items-center justify-center gap-2.5 py-4 px-6 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', boxShadow: '0 4px 20px rgba(107,66,38,0.3)' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 32px rgba(107,66,38,0.5)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(107,66,38,0.3)'}>
              {addingToCart ? (
                <><Spinner size="sm" className="text-white" /> Adding…</>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                  </svg>
                  Add to Cart — {fmt(unitPrice)}
                </>
              )}
            </button>
            <button onClick={handleCustomize}
              className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl text-sm font-medium text-white/70 hover:text-white transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
              </svg>
              Add Your Design
            </button>
          </div>

          {/* Trust signals */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { icon: '🚚', label: 'Free shipping', sub: 'on orders over PKR 5,000' },
              { icon: '🖨️', label: 'Premium print', sub: 'DTF & screen printing' },
              { icon: '✅', label: 'Quality check', sub: 'every order inspected' },
            ].map((t, i) => (
              <div key={i} className="flex flex-col items-center text-center p-3 rounded-xl"
                style={{ background: 'rgba(107,66,38,0.07)', border: '1px solid rgba(107,66,38,0.12)' }}>
                <span className="text-xl mb-1">{t.icon}</span>
                <span className="text-white/70 text-xs font-medium">{t.label}</span>
                <span className="text-white/30 text-[10px] mt-0.5">{t.sub}</span>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="mt-2">
            <div className="flex gap-1 border-b border-white/[0.08] mb-4">
              {['details', 'sizes'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className="px-4 py-2.5 text-xs font-medium capitalize transition-all duration-200"
                  style={activeTab === tab
                    ? { color: '#C48A5C', borderBottom: '2px solid #8B5A3C' }
                    : { color: 'rgba(255,255,255,0.35)' }}>
                  {tab === 'details' ? 'Product Details' : 'Size Guide'}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'details' && (
                <motion.div key="details" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-white/45 text-sm leading-relaxed space-y-3">
                  <p>{product.description}</p>
                  {product.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {product.tags.map((tag, i) => (
                        <span key={i} className="text-xs px-2.5 py-1 rounded-full"
                          style={{ background: 'rgba(107,66,38,0.12)', color: 'rgba(196,138,92,0.8)', border: '1px solid rgba(107,66,38,0.2)' }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
              {activeTab === 'sizes' && (
                <motion.div key="sizes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="overflow-x-auto rounded-xl"
                    style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ background: 'rgba(107,66,38,0.1)' }}>
                          <th className="text-left p-3 text-white/50 font-medium">Size</th>
                          <th className="text-right p-3 text-white/50 font-medium">Price</th>
                          <th className="text-right p-3 text-white/50 font-medium">Premium</th>
                        </tr>
                      </thead>
                      <tbody>
                        {availableSizes.map((size, i) => {
                          const extra = Number(sizePricingMap[size] || 0);
                          return (
                            <tr key={size} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                              <td className="p-3 text-white/70 font-medium">{size}</td>
                              <td className="p-3 text-white/70 text-right">{fmt(Number(product.basePrice) + extra)}</td>
                              <td className="p-3 text-right">
                                {extra > 0
                                  ? <span className="text-ink-brown-light">+{fmt(extra)}</span>
                                  : <span className="text-white/25">—</span>
                                }
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
