import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { contentAPI, contactAPI } from '../../../shared/api/content.service';
import { Spinner } from '../../../shared/components/Spinner';

const Field = ({ label, children }) => (
  <div><label className="label">{label}</label>{children}</div>
);

const MessageModal = ({ msg, onClose, onMarkRead, onDelete }) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
    onClick={onClose}>
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
      className="w-full max-w-lg rounded-2xl p-6 space-y-5"
      style={{ background: 'rgba(13,10,8,0.98)', border: '1px solid rgba(107,66,38,0.25)' }}
      onClick={e => e.stopPropagation()}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display text-lg font-bold text-white">{msg.name}</h3>
          <p className="text-white/40 text-xs mt-0.5">{msg.email}</p>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {msg.subject && (
        <div className="px-3 py-2 rounded-lg text-sm text-white/60"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="text-white/30 text-xs">Subject: </span>{msg.subject}
        </div>
      )}
      <div className="px-3 py-3 rounded-xl text-sm text-white/60 leading-relaxed"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {msg.message}
      </div>
      <p className="text-white/20 text-xs">{new Date(msg.createdAt).toLocaleString()}</p>
      <div className="flex gap-3">
        {!msg.isRead && (
          <button onClick={onMarkRead}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white border border-white/12 hover:border-white/25 transition-all"
            style={{ background: 'rgba(255,255,255,0.04)' }}>
            ✓ Mark as Read
          </button>
        )}
        <button onClick={onDelete}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium text-red-400/70 hover:text-red-400 transition-all"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
          Delete
        </button>
      </div>
    </motion.div>
  </motion.div>
);

export default function AdminContactPage() {
  const [tab,      setTab]      = useState('settings');
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  // Settings
  const [headline,    setHeadline]    = useState('');
  const [subheadline, setSubheadline] = useState('');
  const [email,       setEmail]       = useState('');
  const [phone,       setPhone]       = useState('');
  const [address,     setAddress]     = useState('');
  const [hours,       setHours]       = useState('');

  // Messages
  const [messages,    setMessages]    = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [msgLoading,  setMsgLoading]  = useState(false);
  const [selected,    setSelected]    = useState(null);
  const [page,        setPage]        = useState(1);
  const [pages,       setPages]       = useState(1);

  useEffect(() => {
    contentAPI.get()
      .then(r => {
        const cp = r.data.content?.contactPage || {};
        setHeadline(cp.headline    || '');
        setSubheadline(cp.subheadline || '');
        setEmail(cp.email   || '');
        setPhone(cp.phone   || '');
        setAddress(cp.address || '');
        setHours(cp.hours   || 'Mon – Fri: 9am – 6pm');
      })
      .catch(() => toast.error('Failed to load settings.'))
      .finally(() => setLoading(false));
  }, []);

  const loadMessages = useCallback(async (p = 1) => {
    setMsgLoading(true);
    try {
      const r = await contactAPI.getAll({ page: p, limit: 20 });
      setMessages(r.data.messages);
      setUnreadCount(r.data.unreadCount);
      setPages(r.data.pages);
      setPage(p);
    } catch {
      toast.error('Failed to load messages.');
    } finally {
      setMsgLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'messages') loadMessages(1);
  }, [tab, loadMessages]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await contentAPI.update({ contactPage: { headline, subheadline, email, phone, address, hours } });
      toast.success('Contact page settings saved.');
    } catch {
      toast.error('Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await contactAPI.markRead(id);
      setMessages(ms => ms.map(m => m._id === id ? { ...m, isRead: true } : m));
      setUnreadCount(c => Math.max(0, c - 1));
      if (selected?._id === id) setSelected(m => ({ ...m, isRead: true }));
      toast.success('Marked as read.');
    } catch {
      toast.error('Failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this message?')) return;
    try {
      await contactAPI.remove(id);
      setMessages(ms => ms.filter(m => m._id !== id));
      setSelected(null);
      toast.success('Message deleted.');
    } catch {
      toast.error('Failed.');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" className="text-ink-brown" /></div>;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs tracking-widest uppercase text-ink-brown mb-1">Content</p>
          <h1 className="font-display text-2xl font-bold text-white">Contact Page</h1>
          <p className="text-white/35 text-sm mt-1">Settings for <code className="text-ink-brown-light">/contact</code> and incoming messages</p>
        </div>
        {tab === 'settings' && (
          <button onClick={handleSaveSettings} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
            {saving && <Spinner size="sm" className="text-white" />}
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {['settings', 'messages'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-150 relative"
            style={tab === t
              ? { background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', color: '#fff' }
              : { color: 'rgba(255,255,255,0.45)' }
            }>
            {t === 'messages' ? 'Inbox' : 'Page Settings'}
            {t === 'messages' && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                style={{ background: '#ef4444', minWidth: '18px', height: '18px' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Settings Tab */}
      {tab === 'settings' && (
        <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 space-y-5">
          <Field label="Page Headline">
            <input value={headline} onChange={e => setHeadline(e.target.value)} className="glass-input" placeholder="Get in touch" />
          </Field>
          <Field label="Subheadline">
            <input value={subheadline} onChange={e => setSubheadline(e.target.value)} className="glass-input" placeholder="Have a question? We'd love to hear from you." />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Contact Email">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="glass-input" placeholder="hello@inkify.com" />
            </Field>
            <Field label="Phone Number">
              <input value={phone} onChange={e => setPhone(e.target.value)} className="glass-input" placeholder="+27 11 123 4567" />
            </Field>
          </div>
          <Field label="Physical Address">
            <textarea rows={2} value={address} onChange={e => setAddress(e.target.value)} className="glass-input resize-none" placeholder="123 Design Street, Cape Town" />
          </Field>
          <Field label="Business Hours">
            <input value={hours} onChange={e => setHours(e.target.value)} className="glass-input" placeholder="Mon – Fri: 9am – 6pm" />
          </Field>
          <p className="text-white/20 text-xs">Leave any field blank to hide it from the Contact page.</p>
        </motion.div>
      )}

      {/* Messages / Inbox Tab */}
      {tab === 'messages' && (
        <motion.div key="messages" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {msgLoading ? (
            <div className="flex justify-center py-12"><Spinner size="lg" className="text-ink-brown" /></div>
          ) : messages.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <p className="text-4xl mb-4">📭</p>
              <p className="text-white/40 text-sm">No messages yet.</p>
            </div>
          ) : (
            <>
              {messages.map(msg => (
                <button key={msg._id} onClick={() => setSelected(msg)}
                  className="w-full glass-card p-4 text-left hover:border-ink-brown/40 transition-all duration-200 flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                    style={{ background: msg.isRead ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
                    {msg.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-white text-sm font-medium">{msg.name}</span>
                      {!msg.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-ink-brown flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-white/40 text-xs truncate">{msg.subject || msg.message}</p>
                  </div>
                  <p className="text-white/20 text-xs flex-shrink-0">
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </p>
                </button>
              ))}

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button disabled={page <= 1} onClick={() => loadMessages(page - 1)}
                    className="px-4 py-2 rounded-lg text-xs text-white/50 hover:text-white disabled:opacity-30 border border-white/10 hover:border-white/25 transition-all">
                    ← Prev
                  </button>
                  <span className="text-white/30 text-xs">{page} / {pages}</span>
                  <button disabled={page >= pages} onClick={() => loadMessages(page + 1)}
                    className="px-4 py-2 rounded-lg text-xs text-white/50 hover:text-white disabled:opacity-30 border border-white/10 hover:border-white/25 transition-all">
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>
      )}

      {/* Message detail modal */}
      <AnimatePresence>
        {selected && (
          <MessageModal
            msg={selected}
            onClose={() => setSelected(null)}
            onMarkRead={() => handleMarkRead(selected._id)}
            onDelete={() => handleDelete(selected._id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
