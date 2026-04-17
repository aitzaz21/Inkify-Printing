import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { designAPI } from '../services/design.service';
import { Spinner } from '../../../shared/components/Spinner';

const STATUS = {
  pending:  { label: 'Under Review', color: '#ca8a04',  bg: 'rgba(234,179,8,0.12)'  },
  approved: { label: 'Live',          color: '#22c55e',  bg: 'rgba(34,197,94,0.12)'  },
  rejected: { label: 'Rejected',      color: '#ef4444',  bg: 'rgba(239,68,68,0.12)'  },
};

const StatusBadge = ({ status }) => {
  const s = STATUS[status] || STATUS.pending;
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
};

export default function MyDesignsPage() {
  const [designs,  setDesigns]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    designAPI.getMyDesigns()
      .then(r => setDesigns(r.data.designs || []))
      .catch(() => toast.error('Failed to load designs.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = designs.filter(d => {
    if (activeTab !== 'all' && d.status !== activeTab) return false;
    if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const tabCounts = {
    all: designs.length,
    approved: designs.filter(d => d.status === 'approved').length,
    pending: designs.filter(d => d.status === 'pending').length,
    rejected: designs.filter(d => d.status === 'rejected').length,
  };

  const TABS = [
    { id: 'all',      label: 'All' },
    { id: 'approved', label: 'Approved' },
    { id: 'pending',  label: 'Pending' },
    { id: 'rejected', label: 'Rejected' },
  ];

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this design permanently?')) return;
    setDeleting(id);
    try {
      await designAPI.delete(id);
      setDesigns(prev => prev.filter(d => d._id !== id));
      toast.success('Design deleted.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed.');
    } finally {
      setDeleting('');
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-xs tracking-widest uppercase text-ink-brown mb-1">Portfolio</p>
            <h1 className="font-display text-3xl font-bold text-white">My Designs</h1>
          </div>
          <Link to="/marketplace/upload"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Upload New
          </Link>
        </div>

        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between mb-6">
          <div className="flex gap-1 p-1 rounded-xl" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={activeTab === t.id
                  ? { background:'linear-gradient(135deg,#6B4226,#8B5A3C)', color:'#fff' }
                  : { color:'rgba(255,255,255,0.4)' }
                }>
                {t.label} ({tabCounts[t.id]})
              </button>
            ))}
          </div>
          <form onSubmit={e => { e.preventDefault(); setSearch(searchInput.trim()); }} className="flex gap-2">
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
              placeholder="Search designs…" className="glass-input py-1.5 text-sm w-44" />
            {search && <button type="button" onClick={() => { setSearch(''); setSearchInput(''); }} className="text-white/30 hover:text-white text-xs">Clear</button>}
          </form>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" className="text-ink-brown" /></div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-24 glass-card">
            <div className="text-5xl mb-4">🎨</div>
            <h3 className="font-display text-xl font-bold text-white mb-2">No designs yet</h3>
            <p className="text-white/40 text-sm mb-6">Upload your first design to the marketplace.</p>
            <Link to="/marketplace/upload" className="btn-primary w-auto inline-flex px-8 items-center gap-2">
              Upload First Design
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            <AnimatePresence>
              {filtered.map((d, i) => (
                <motion.div
                  key={d._id} layout
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05, duration: 0.35 }}
                  className="glass-card overflow-hidden group hover:border-ink-brown/40 transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative w-full" style={{ paddingBottom: '100%' }}>
                    <img src={d.imageUrl} alt={d.title}
                      className="absolute inset-0 w-full h-full object-contain p-3" />
                    {/* Hover actions */}
                    <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      style={{ background: 'rgba(11,11,11,0.6)', backdropFilter: 'blur(4px)' }}>
                      {deleting === d._id ? (
                        <Spinner size="sm" className="text-white" />
                      ) : (
                        <button onClick={() => handleDelete(d._id)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-red-400/80 hover:text-red-400 transition-colors"
                          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)' }}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3.5">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-display text-xs font-semibold text-white leading-snug truncate">{d.title}</h3>
                      <span className="font-bold text-white/80 text-xs flex-shrink-0">
                        {d.price === 0 ? 'Free' : `PKR ${Math.round(d.price).toLocaleString()}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <StatusBadge status={d.status} />
                      <span className="text-white/20 text-xs">
                        {new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    {/* Rejection note */}
                    {d.status === 'rejected' && d.adminNote && (
                      <p className="text-red-400/60 text-xs mt-2 leading-relaxed line-clamp-2">{d.adminNote}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
