import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { designAPI } from '../../marketplace/services/design.service';
import { Spinner } from '../../../shared/components/Spinner';

const STATUS_STYLES = {
  pending:  { bg: 'rgba(234,179,8,0.12)',  color: '#ca8a04', label: 'Pending'  },
  approved: { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e', label: 'Approved' },
  rejected: { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444', label: 'Rejected' },
};

const FILTERS = ['all', 'pending', 'approved', 'rejected'];

export default function AdminDesignsPage() {
  const [designs,   setDesigns]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('pending');
  const [acting,    setActing]    = useState('');
  const [rejectModal, setRejectModal] = useState(null); // design object
  const [rejectReason, setRejectReason] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (filter !== 'all') params.status = filter;
    if (search) params.search = search;
    designAPI.getAll(params)
      .then(r => setDesigns(r.data.designs || []))
      .catch(() => toast.error('Failed to load designs.'))
      .finally(() => setLoading(false));
  }, [filter, search]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id) => {
    setActing(id);
    try {
      const r = await designAPI.approve(id);
      setDesigns(prev => prev.map(d => d._id === id ? r.data.design : d));
      toast.success('Design approved — creator notified.');
    } catch { toast.error('Failed.'); }
    finally { setActing(''); }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActing(rejectModal._id);
    try {
      const r = await designAPI.reject(rejectModal._id, rejectReason);
      setDesigns(prev => prev.map(d => d._id === rejectModal._id ? r.data.design : d));
      toast.success('Design rejected — creator notified.');
    } catch { toast.error('Failed.'); }
    finally { setActing(''); setRejectModal(null); setRejectReason(''); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this design and remove from Cloudinary?')) return;
    setActing(id);
    try {
      await designAPI.adminDelete(id);
      setDesigns(prev => prev.filter(d => d._id !== id));
      toast.success('Design deleted from Cloudinary.');
    } catch { toast.error('Failed.'); }
    finally { setActing(''); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <p className="text-xs tracking-widest uppercase text-ink-brown mb-1">Moderation</p>
          <h1 className="font-display text-2xl font-bold text-white">Designs</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={e => { e.preventDefault(); setSearch(searchInput.trim()); }} className="flex gap-2">
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
              placeholder="Search by name or tag…"
              className="glass-input py-1.5 text-sm w-44" />
            <button type="submit" className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
              style={{ background:'rgba(107,66,38,0.3)', border:'1px solid rgba(107,66,38,0.4)' }}>Search</button>
            {search && <button type="button" onClick={() => { setSearch(''); setSearchInput(''); }} className="text-white/30 hover:text-white text-xs">Clear</button>}
          </form>
          <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all duration-150"
              style={filter === f
                ? { background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', color: '#fff' }
                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.1)' }
              }>
              {f}
            </button>
          ))}
        </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" className="text-ink-brown" /></div>
      ) : designs.length === 0 ? (
        <div className="text-center py-16 glass-card">
          <p className="text-white/30">No designs found for "{filter}".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {designs.map((d, i) => {
            const s = STATUS_STYLES[d.status] || STATUS_STYLES.pending;
            return (
              <motion.div key={d._id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.35 }}
                className="glass-card overflow-hidden hover:border-ink-brown/30 transition-all duration-200">
                {/* Image */}
                <div className="relative w-full" style={{ paddingBottom: '80%' }}>
                  <img src={d.imageUrl} alt={d.title}
                    className="absolute inset-0 w-full h-full object-contain p-4"
                    style={{ background: 'rgba(255,255,255,0.02)' }} />
                  <div className="absolute top-2 left-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ background: s.bg, color: s.color }}>
                      {s.label}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4">
                  <h3 className="font-display text-sm font-semibold text-white truncate mb-0.5">{d.title}</h3>
                  <p className="text-white/35 text-xs truncate mb-1">
                    by {d.creator?.firstName} {d.creator?.lastName} · {d.creator?.email}
                  </p>
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="text-white/30">{new Date(d.createdAt).toLocaleDateString()}</span>
                    <span className="font-bold text-white">{d.price === 0 ? 'Free' : `PKR ${Math.round(d.price).toLocaleString()}`}</span>
                  </div>

                  {/* Admin note */}
                  {d.adminNote && (
                    <p className="text-white/30 text-xs mb-3 italic truncate">Note: {d.adminNote}</p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {acting === d._id ? (
                      <div className="flex-1 flex justify-center py-2"><Spinner size="sm" className="text-ink-brown" /></div>
                    ) : (
                      <>
                        {d.status !== 'approved' && (
                          <button onClick={() => handleApprove(d._id)}
                            className="flex-1 text-xs py-2 rounded-lg font-medium text-emerald-400 transition-colors hover:text-emerald-300"
                            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                            ✓ Approve
                          </button>
                        )}
                        {d.status !== 'rejected' && (
                          <button onClick={() => { setRejectModal(d); setRejectReason(''); }}
                            className="flex-1 text-xs py-2 rounded-lg font-medium text-amber-400 transition-colors hover:text-amber-300"
                            style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)' }}>
                            ✕ Reject
                          </button>
                        )}
                        <button onClick={() => handleDelete(d._id)}
                          className="text-xs py-2 px-3 rounded-lg text-red-400/60 hover:text-red-400 transition-colors"
                          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Reject modal */}
      <AnimatePresence>
        {rejectModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setRejectModal(null)}
              className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-x-4 top-1/4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-50"
            >
              <div className="glass-card p-6">
                <h3 className="font-display text-lg font-semibold text-white mb-1">Reject Design</h3>
                <p className="text-white/40 text-sm mb-4">
                  Rejecting <strong className="text-white">"{rejectModal.title}"</strong>. The creator will be notified.
                </p>
                <label className="label">Reason (optional but recommended)</label>
                <textarea
                  rows={3}
                  className="glass-input resize-none mb-4"
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="e.g. Copyrighted content detected, image quality too low, inappropriate content…"
                />
                <div className="flex gap-3">
                  <button onClick={() => setRejectModal(null)} className="btn-secondary">Cancel</button>
                  <button
                    onClick={handleReject}
                    disabled={acting === rejectModal._id}
                    className="btn-primary flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)' }}
                  >
                    {acting === rejectModal._id ? <><Spinner size="sm" />Rejecting…</> : 'Confirm Reject'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
