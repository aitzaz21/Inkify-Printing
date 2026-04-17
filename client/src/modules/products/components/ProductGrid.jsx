import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from './ProductCard';
import { useProducts } from '../services/useProducts';

const SkeletonCard = () => (
  <div className="glass-card overflow-hidden">
    <div className="relative w-full" style={{ paddingBottom: '62%' }}>
      <div className="absolute inset-0 animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
    </div>
    <div className="p-5 space-y-3">
      <div className="h-2.5 w-16 rounded-full bg-white/[0.08] animate-pulse" />
      <div className="h-4 w-3/4 rounded-lg bg-white/[0.08] animate-pulse" />
      <div className="h-3 w-full rounded bg-white/5 animate-pulse" />
      <div className="h-3 w-5/6 rounded bg-white/5 animate-pulse" />
      <div className="h-3 w-2/3 rounded bg-white/5 animate-pulse" />
    </div>
  </div>
);

export default function ProductGrid() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const filters = {
    ...(activeCategory !== 'All' && { category: activeCategory }),
    ...(search && { search }),
  };

  const { products, categories, loading, error } = useProducts(filters);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const clearAll = () => {
    setActiveCategory('All');
    setSearch('');
    setSearchInput('');
  };

  return (
    <section id="products" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section header */}
      <div className="text-center mb-14">
        <motion.p
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="text-xs font-medium tracking-widest uppercase text-ink-brown mb-3"
        >
          What We Print
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4"
        >
          Our <span className="italic text-gradient">Product Range</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          viewport={{ once: true }} transition={{ delay: 0.15 }}
          className="text-white/40 max-w-xl mx-auto text-sm leading-relaxed"
        >
          Every product is a canvas. Explore our catalogue and find the perfect medium for your message.
        </motion.p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-10 items-start sm:items-center justify-between">
        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setSearch(''); setSearchInput(''); }}
              className="px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-200"
              style={
                activeCategory === cat
                  ? { background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', color: '#fff', border: '1px solid transparent' }
                  : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.1)' }
              }
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
            </svg>
            <input
              type="text" value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products…"
              className="glass-input pl-9 py-2 text-sm rounded-xl"
            />
          </div>
          <button type="submit" className="px-4 py-2 rounded-xl text-xs font-medium text-white transition-all duration-200 flex-shrink-0" style={{ background: 'rgba(107,66,38,0.3)', border: '1px solid rgba(107,66,38,0.4)' }}>
            Search
          </button>
          {(search || searchInput || activeCategory !== 'All') && (
            <button type="button" onClick={clearAll} className="text-white/30 hover:text-white/60 text-xs transition-colors flex-shrink-0">
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="text-center py-16">
          <p className="text-red-400/80 text-sm">{error}</p>
        </div>
      )}

      {/* Grid */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </motion.div>
        ) : products.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(107,66,38,0.1)', border: '1px solid rgba(107,66,38,0.2)' }}>
              <svg className="w-6 h-6 text-ink-brown/50" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
              </svg>
            </div>
            <p className="text-white/40 text-sm">No products found.</p>
            <button onClick={clearAll} className="mt-4 text-xs text-ink-brown-light hover:text-white transition-colors">Clear filters</button>
          </motion.div>
        ) : (
          <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {products.map((product, i) => (
              <ProductCard key={product._id} product={product} index={i} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && products.length > 0 && (
        <p className="text-center text-xs text-white/20 mt-8">
          Showing {products.length} product{products.length !== 1 ? 's' : ''}
        </p>
      )}
    </section>
  );
}
