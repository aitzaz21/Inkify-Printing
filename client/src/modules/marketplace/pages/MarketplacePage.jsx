import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { designAPI } from '../services/design.service';
import DesignCard from '../components/DesignCard';
import { Spinner } from '../../../shared/components/Spinner';
import { useAuth } from '../../../shared/hooks/useAuthContext';

const SkeletonCard = () => (
  <div className="glass-card overflow-hidden animate-pulse">
    <div className="w-full aspect-square bg-white/5" />
    <div className="p-4 space-y-2">
      <div className="h-3.5 w-3/4 rounded-lg bg-white/[0.08]" />
      <div className="h-2.5 w-1/2 rounded bg-white/5" />
    </div>
  </div>
);

export default function MarketplacePage() {
  const { user } = useAuth();
  const [designs,  setDesigns]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [query,    setQuery]    = useState('');
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const LIMIT = 24;

  const load = useCallback(() => {
    setLoading(true);
    designAPI.getApproved({ search: query, page, limit: LIMIT })
      .then(r => {
        setDesigns(r.data.designs || []);
        setTotal(r.data.total   || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [query, page]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = e => { e.preventDefault(); setPage(1); setQuery(search.trim()); };
  const clearSearch  = ()  => { setSearch(''); setQuery(''); setPage(1); };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative pt-28 pb-14 px-4 sm:px-6 text-center overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(107,66,38,0.18), transparent 70%)' }} />
        <div className="relative z-10 max-w-3xl mx-auto">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-xs font-medium tracking-widest uppercase text-ink-brown mb-3">
            Community
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.55 }}
            className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
            Design <span className="italic text-gradient">Marketplace</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
            className="text-white/40 text-sm sm:text-base max-w-xl mx-auto leading-relaxed mb-8">
            Browse community designs. Select one for your shirt or upload your own.
          </motion.p>

          {/* Search */}
          <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
              </svg>
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search designs…"
                className="glass-input pl-9 py-2.5"
              />
            </div>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
              Search
            </button>
            {query && (
              <button type="button" onClick={clearSearch} className="text-white/40 hover:text-white px-2 transition-colors text-sm">
                ✕
              </button>
            )}
          </motion.form>
        </div>
      </div>

      {/* Action bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 flex items-center justify-between">
        <p className="text-white/30 text-sm">
          {loading ? 'Loading…' : `${total} design${total !== 1 ? 's' : ''}`}
          {query && <span className="text-white/50"> for "{query}"</span>}
        </p>
        {user && (
          <Link to="/marketplace/upload"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Upload Design
          </Link>
        )}
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : designs.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl"
              style={{ background: 'rgba(107,66,38,0.1)', border: '1px solid rgba(107,66,38,0.2)' }}>🎨</div>
            <h3 className="font-display text-xl font-bold text-white mb-2">No designs yet</h3>
            <p className="text-white/40 text-sm mb-6">{query ? 'Try a different search.' : 'Be the first to upload a design!'}</p>
            {user && (
              <Link to="/marketplace/upload" className="btn-primary w-auto inline-flex px-8 items-center gap-2">
                Upload First Design
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {designs.map((d, i) => <DesignCard key={d._id} design={d} index={i} />)}
          </div>
        )}

        {/* Pagination */}
        {!loading && total > LIMIT && (
          <div className="flex items-center justify-center gap-3 mt-12">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 rounded-xl text-sm text-white/60 hover:text-white disabled:opacity-30 transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              ← Prev
            </button>
            <span className="text-white/40 text-sm">
              Page {page} of {Math.ceil(total / LIMIT)}
            </span>
            <button disabled={page >= Math.ceil(total / LIMIT)} onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-xl text-sm text-white/60 hover:text-white disabled:opacity-30 transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
