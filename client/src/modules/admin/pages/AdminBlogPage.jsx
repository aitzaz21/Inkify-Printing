import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../../shared/api/axios';
import { uploadAPI } from '../../../shared/api/upload.service';
import { Spinner } from '../../../shared/components/Spinner';

/* ─── Rich Text Editor ───────────────────────────────────────── */

const ToolBtn = ({ title, onClick, disabled, active, children }) => (
  <button
    type="button"
    title={title}
    disabled={disabled}
    onMouseDown={e => { e.preventDefault(); onClick(); }}
    className="w-7 h-7 flex items-center justify-center rounded transition-all duration-100 text-xs select-none"
    style={{
      background: active ? 'rgba(107,66,38,0.3)' : 'transparent',
      color:      active ? '#C48A5C' : 'rgba(255,255,255,0.6)',
      border:     active ? '1px solid rgba(107,66,38,0.4)' : '1px solid transparent',
      opacity:    disabled ? 0.4 : 1,
    }}
  >
    {children}
  </button>
);

const Sep = () => (
  <div className="w-px self-stretch mx-0.5" style={{ background: 'rgba(255,255,255,0.1)' }} />
);

function RichTextEditor({ value, onChange, onImageUpload, resetKey }) {
  const editorRef   = useRef(null);
  const fileRef     = useRef(null);
  const savedSel    = useRef(null);
  const [showLink,  setShowLink]  = useState(false);
  const [linkUrl,   setLinkUrl]   = useState('');
  const [uploading, setUploading] = useState(false);

  /* Sync content when modal opens or switches post */
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value || '';
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) savedSel.current = sel.getRangeAt(0).cloneRange();
  };
  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedSel.current) { sel.removeAllRanges(); sel.addRange(savedSel.current); }
  };

  const exec = useCallback((cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    onChange(editorRef.current?.innerHTML || '');
  }, [onChange]);

  const handleInput = () => onChange(editorRef.current?.innerHTML || '');

  const handleFormatBlock = (e) => {
    const tag = e.target.value;
    editorRef.current?.focus();
    document.execCommand('formatBlock', false, tag);
    onChange(editorRef.current?.innerHTML || '');
    e.target.blur();
  };

  const openLink = () => {
    saveSelection();
    const sel = window.getSelection();
    let existing = '';
    try {
      const anchor = sel?.anchorNode?.parentElement?.closest('a');
      if (anchor) existing = anchor.href;
    } catch {}
    setLinkUrl(existing || '');
    setShowLink(true);
  };

  const confirmLink = () => {
    if (!linkUrl.trim()) { setShowLink(false); return; }
    restoreSelection();
    const url = /^https?:\/\//i.test(linkUrl) ? linkUrl : `https://${linkUrl}`;
    exec('createLink', url);
    setShowLink(false);
    setLinkUrl('');
  };

  const handleImageFile = async (file) => {
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)) {
      toast.error('Only JPG, PNG, WEBP, GIF allowed.'); return;
    }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB per image.'); return; }
    setUploading(true);
    try {
      const url = await onImageUpload(file);
      editorRef.current?.focus();
      document.execCommand(
        'insertHTML', false,
        `<img src="${url}" style="max-width:100%;height:auto;border-radius:8px;margin:12px 0;display:block;" alt="image" />`
      );
      onChange(editorRef.current?.innerHTML || '');
    } catch { toast.error('Image upload failed.'); }
    finally { setUploading(false); }
  };

  return (
    <div className="rounded-xl overflow-hidden flex flex-col"
      style={{ border: '1px solid rgba(107,66,38,0.3)', background: 'rgba(0,0,0,0.2)', minHeight: '380px' }}>

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b flex-shrink-0"
        style={{ borderColor: 'rgba(107,66,38,0.2)', background: 'rgba(107,66,38,0.07)' }}>

        {/* Block format */}
        <select
          onChange={handleFormatBlock}
          className="text-xs rounded-lg px-2 py-1 mr-1 cursor-pointer focus:outline-none"
          style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.1)', minWidth: '100px' }}
        >
          <option value="div">Normal</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
          <option value="blockquote">Blockquote</option>
          <option value="pre">Code Block</option>
        </select>

        <Sep />

        {/* Text style */}
        <ToolBtn title="Bold (Ctrl+B)"        onClick={() => exec('bold')}>         <strong>B</strong></ToolBtn>
        <ToolBtn title="Italic (Ctrl+I)"      onClick={() => exec('italic')}>       <em>I</em></ToolBtn>
        <ToolBtn title="Underline (Ctrl+U)"   onClick={() => exec('underline')}>    <u>U</u></ToolBtn>
        <ToolBtn title="Strikethrough"        onClick={() => exec('strikeThrough')}><s>S</s></ToolBtn>

        <Sep />

        {/* Alignment */}
        <ToolBtn title="Align Left" onClick={() => exec('justifyLeft')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <line x1="3" y1="6"  x2="21" y2="6"  strokeLinecap="round"/>
            <line x1="3" y1="12" x2="15" y2="12" strokeLinecap="round"/>
            <line x1="3" y1="18" x2="18" y2="18" strokeLinecap="round"/>
          </svg>
        </ToolBtn>
        <ToolBtn title="Align Center" onClick={() => exec('justifyCenter')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <line x1="3" y1="6"  x2="21" y2="6"  strokeLinecap="round"/>
            <line x1="6" y1="12" x2="18" y2="12" strokeLinecap="round"/>
            <line x1="4" y1="18" x2="20" y2="18" strokeLinecap="round"/>
          </svg>
        </ToolBtn>
        <ToolBtn title="Align Right" onClick={() => exec('justifyRight')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <line x1="3"  y1="6"  x2="21" y2="6"  strokeLinecap="round"/>
            <line x1="9"  y1="12" x2="21" y2="12" strokeLinecap="round"/>
            <line x1="6"  y1="18" x2="21" y2="18" strokeLinecap="round"/>
          </svg>
        </ToolBtn>
        <ToolBtn title="Justify" onClick={() => exec('justifyFull')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <line x1="3" y1="6"  x2="21" y2="6"  strokeLinecap="round"/>
            <line x1="3" y1="12" x2="21" y2="12" strokeLinecap="round"/>
            <line x1="3" y1="18" x2="21" y2="18" strokeLinecap="round"/>
          </svg>
        </ToolBtn>

        <Sep />

        {/* Lists */}
        <ToolBtn title="Bullet List" onClick={() => exec('insertUnorderedList')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <line x1="9" y1="6"  x2="20" y2="6"  strokeLinecap="round"/>
            <line x1="9" y1="12" x2="20" y2="12" strokeLinecap="round"/>
            <line x1="9" y1="18" x2="20" y2="18" strokeLinecap="round"/>
            <circle cx="4" cy="6"  r="1.5" fill="currentColor" stroke="none"/>
            <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/>
            <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/>
          </svg>
        </ToolBtn>
        <ToolBtn title="Numbered List" onClick={() => exec('insertOrderedList')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <line x1="10" y1="6"  x2="21" y2="6"  strokeLinecap="round"/>
            <line x1="10" y1="12" x2="21" y2="12" strokeLinecap="round"/>
            <line x1="10" y1="18" x2="21" y2="18" strokeLinecap="round"/>
            <path d="M4 6h.5M4 9h1.5M3 9h3M4 12v-3M4 15v3h2v-3H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"/>
          </svg>
        </ToolBtn>

        <Sep />

        {/* Indent / Outdent */}
        <ToolBtn title="Increase Indent" onClick={() => exec('indent')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <line x1="3" y1="6"  x2="21" y2="6"  strokeLinecap="round"/>
            <line x1="7" y1="12" x2="21" y2="12" strokeLinecap="round"/>
            <line x1="7" y1="18" x2="21" y2="18" strokeLinecap="round"/>
            <polyline points="3 15 6 12 3 9" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </ToolBtn>
        <ToolBtn title="Decrease Indent" onClick={() => exec('outdent')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <line x1="3"  y1="6"  x2="21" y2="6"  strokeLinecap="round"/>
            <line x1="11" y1="12" x2="21" y2="12" strokeLinecap="round"/>
            <line x1="11" y1="18" x2="21" y2="18" strokeLinecap="round"/>
            <polyline points="7 9 4 12 7 15" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </ToolBtn>

        <Sep />

        {/* Link */}
        <ToolBtn title="Insert / Edit Link" onClick={openLink}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <path strokeLinecap="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
          </svg>
        </ToolBtn>
        <ToolBtn title="Remove Link" onClick={() => exec('unlink')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <path strokeLinecap="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/>
          </svg>
        </ToolBtn>

        {/* Image */}
        <ToolBtn title="Insert Image" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? (
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
              <path fill="currentColor" d="M4 12a8 8 0 018-8v8z" className="opacity-75"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round"/>
              <circle cx="8.5" cy="8.5" r="1.5" strokeLinecap="round"/>
              <polyline points="21 15 16 10 5 21" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </ToolBtn>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
          onChange={e => { handleImageFile(e.target.files?.[0]); e.target.value = ''; }} />

        <Sep />

        {/* HR */}
        <ToolBtn title="Horizontal Rule" onClick={() => exec('insertHorizontalRule')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <line x1="3" y1="12" x2="21" y2="12" strokeLinecap="round"/>
          </svg>
        </ToolBtn>

        {/* Undo / Redo */}
        <Sep />
        <ToolBtn title="Undo (Ctrl+Z)" onClick={() => exec('undo')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"/>
          </svg>
        </ToolBtn>
        <ToolBtn title="Redo (Ctrl+Y)" onClick={() => exec('redo')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3"/>
          </svg>
        </ToolBtn>
      </div>

      {/* ── Link Input Bar ── */}
      <AnimatePresence>
        {showLink && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b flex-shrink-0"
            style={{ borderColor: 'rgba(107,66,38,0.2)', background: 'rgba(107,66,38,0.09)' }}>
            <div className="flex items-center gap-2 px-3 py-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-ink-brown flex-shrink-0">
                <path strokeLinecap="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
              </svg>
              <input
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') confirmLink(); if (e.key === 'Escape') setShowLink(false); }}
                placeholder="https://example.com"
                className="flex-1 text-sm bg-transparent outline-none placeholder-white/25"
                style={{ color: 'rgba(255,255,255,0.85)' }}
                autoFocus
              />
              <button type="button" onMouseDown={e => { e.preventDefault(); confirmLink(); }}
                className="text-xs px-3 py-1 rounded-lg font-medium"
                style={{ background: 'rgba(107,66,38,0.35)', color: '#C48A5C', border: '1px solid rgba(107,66,38,0.4)' }}>
                Apply
              </button>
              <button type="button" onClick={() => setShowLink(false)}
                className="text-white/40 hover:text-white p-1 rounded">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Editable Area ── */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        className="rich-editor flex-1 p-4 outline-none overflow-y-auto"
        style={{
          color: 'rgba(255,255,255,0.82)',
          fontSize: '14px',
          lineHeight: '1.8',
          minHeight: '280px',
        }}
      />

      {/* Scoped prose styles for the editor */}
      <style>{`
        .rich-editor h1 { font-size:1.75rem; font-weight:700; color:#fff; margin:1rem 0 0.5rem; line-height:1.3; }
        .rich-editor h2 { font-size:1.4rem;  font-weight:600; color:rgba(255,255,255,.92); margin:0.9rem 0 0.4rem; line-height:1.35; }
        .rich-editor h3 { font-size:1.15rem; font-weight:600; color:rgba(255,255,255,.88); margin:0.8rem 0 0.35rem; }
        .rich-editor h4 { font-size:1rem;    font-weight:600; color:rgba(255,255,255,.85); margin:0.7rem 0 0.3rem; }
        .rich-editor p  { margin:0.5rem 0; }
        .rich-editor a  { color:#C48A5C; text-decoration:underline; cursor:pointer; }
        .rich-editor blockquote { border-left:3px solid #8B5A3C; padding:0.5rem 0.75rem 0.5rem 1rem; margin:0.75rem 0; color:rgba(255,255,255,.55); font-style:italic; background:rgba(107,66,38,.07); border-radius:0 8px 8px 0; }
        .rich-editor ul { list-style:disc;    padding-left:1.5rem; margin:0.5rem 0; }
        .rich-editor ol { list-style:decimal; padding-left:1.5rem; margin:0.5rem 0; }
        .rich-editor li { margin:0.2rem 0; }
        .rich-editor img { max-width:100%; height:auto; border-radius:8px; margin:10px 0; display:block; }
        .rich-editor hr  { border:none; border-top:1px solid rgba(255,255,255,.12); margin:1rem 0; }
        .rich-editor pre { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); padding:0.75rem 1rem; border-radius:8px; font-family:monospace; font-size:13px; overflow-x:auto; margin:0.75rem 0; white-space:pre-wrap; }
        .rich-editor strong, .rich-editor b { font-weight:700; color:rgba(255,255,255,.95); }
        .rich-editor em, .rich-editor i { font-style:italic; }
        .rich-editor u { text-decoration:underline; }
        .rich-editor s { text-decoration:line-through; }
      `}</style>
    </div>
  );
}

/* ─── Blog Page ──────────────────────────────────────────────── */

const emptyForm = () => ({
  title: '', slug: '', content: '', excerpt: '', author: 'Inkify Team',
  tags: '', image: '', isPublished: false, metaTitle: '', metaDescription: '',
});

const Field = ({ label, children, error, hint }) => (
  <div>
    <label className="label">{label}</label>
    {children}
    {hint  && <p className="text-white/25 text-xs mt-1">{hint}</p>}
    {error && <p className="mt-1 text-xs" style={{ color: 'rgba(239,68,68,0.85)' }}>⚠ {error}</p>}
  </div>
);

export default function AdminBlogPage() {
  const [blogs,    setBlogs]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState('');
  const [modal,    setModal]    = useState(null);
  const [form,     setForm]     = useState(emptyForm());
  const [errors,   setErrors]   = useState({});
  const [coverUploading, setCoverUploading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/blog/admin/all')
      .then(r => setBlogs(r.data.blogs || []))
      .catch(() => toast.error('Failed to load blogs.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openCreate = () => {
    setForm(emptyForm());
    setErrors({});
    setPreviewMode(false);
    setModal('create');
  };
  const openEdit = (b) => {
    setForm({
      title: b.title || '', slug: b.slug || '', content: b.content || '',
      excerpt: b.excerpt || '', author: b.author || 'Inkify Team',
      tags: (b.tags || []).join(', '), image: b.image || '',
      isPublished: !!b.isPublished,
      metaTitle: b.metaTitle || '', metaDescription: b.metaDescription || '',
    });
    setErrors({});
    setPreviewMode(false);
    setModal(b);
  };
  const closeModal = () => { setModal(null); setErrors({}); setPreviewMode(false); };

  const validate = () => {
    const e = {};
    if (!form.title.trim())           e.title           = 'Title is required.';
    if (!form.content.trim())         e.content         = 'Content is required.';
    if (!form.metaDescription.trim()) e.metaDescription = 'Meta description is required for SEO.';
    setErrors(e);
    return !Object.keys(e).length;
  };

  /* Cover image upload */
  const handleCoverUpload = async (file) => {
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) { toast.error('Only JPG/PNG/WEBP.'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB.'); return; }
    setCoverUploading(true);
    try {
      const res = await uploadAPI.uploadProduct(file);
      set('image', res.data.url);
      toast.success('Cover image uploaded.');
    } catch { toast.error('Upload failed.'); }
    finally { setCoverUploading(false); }
  };

  /* Inline image upload (called by editor) — returns URL */
  const handleEditorImageUpload = async (file) => {
    const res = await uploadAPI.uploadProduct(file);
    return res.data.url;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        title:           form.title.trim(),
        slug:            form.slug.trim() || undefined,
        content:         form.content,
        excerpt:         form.excerpt.trim(),
        author:          form.author.trim() || 'Inkify Team',
        tags:            form.tags.split(',').map(t => t.trim()).filter(Boolean),
        image:           form.image || null,
        isPublished:     form.isPublished,
        metaTitle:       form.metaTitle.trim(),
        metaDescription: form.metaDescription.trim(),
      };
      if (modal === 'create') {
        await api.post('/blog', payload);
        toast.success('Blog post created!');
      } else {
        await api.put(`/blog/${modal._id}`, payload);
        toast.success('Blog post updated!');
      }
      load(); closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this blog post permanently?')) return;
    setDeleting(id);
    try {
      await api.delete(`/blog/${id}`);
      setBlogs(prev => prev.filter(b => b._id !== id));
      toast.success('Blog deleted.');
    } catch { toast.error('Delete failed.'); }
    finally { setDeleting(''); }
  };

  const handleTogglePublish = async (b) => {
    try {
      await api.put(`/blog/${b._id}`, { isPublished: !b.isPublished });
      load();
      toast.success(b.isPublished ? 'Unpublished.' : 'Published!');
    } catch { toast.error('Failed.'); }
  };

  /* Key used to reset the rich text editor on modal open */
  const editorKey = modal === 'create' ? 'new' : (modal?._id || 'edit');

  return (
    <div className="space-y-6">
      {/* ── Modal ── */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center p-3 overflow-y-auto"
            style={{ background: 'rgba(0,0,0,0.92)' }} onClick={closeModal}>
            <motion.div
              initial={{ scale: 0.93, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0 }}
              className="glass-card w-full max-w-4xl my-6"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-4">
                  <h3 className="font-display text-lg font-bold text-white">
                    {modal === 'create' ? 'New Blog Post' : 'Edit Blog Post'}
                  </h3>
                  {/* Preview toggle */}
                  <div className="flex items-center gap-1 p-0.5 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {[{ key: false, label: 'Edit' }, { key: true, label: 'Preview' }].map(({ key, label }) => (
                      <button key={String(key)} type="button" onClick={() => setPreviewMode(key)}
                        className="px-3 py-1 rounded-md text-xs font-medium transition-all"
                        style={previewMode === key
                          ? { background: 'rgba(107,66,38,0.35)', color: '#C48A5C' }
                          : { color: 'rgba(255,255,255,0.4)' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={closeModal} className="text-white/40 hover:text-white transition-colors p-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              {/* Preview Mode */}
              {previewMode ? (
                <div className="p-6 sm:p-8 max-h-[75vh] overflow-y-auto">
                  {form.image && (
                    <img src={form.image} alt="" className="w-full rounded-xl object-cover mb-6" style={{ maxHeight: '280px' }} />
                  )}
                  {form.tags && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {form.tags.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                        <span key={t} className="text-xs px-2.5 py-1 rounded-full"
                          style={{ background: 'rgba(107,66,38,0.15)', color: '#C48A5C' }}>{t}</span>
                      ))}
                    </div>
                  )}
                  <h1 className="font-display text-3xl font-bold text-white mb-2">{form.title || 'Untitled'}</h1>
                  <p className="text-white/40 text-sm mb-6 pb-6 border-b border-white/[0.08]">By {form.author}</p>
                  <div className="rich-editor"
                    style={{ color: 'rgba(255,255,255,0.78)', lineHeight: '1.8', fontSize: '15px' }}
                    dangerouslySetInnerHTML={{ __html: form.content || '<p style="color:rgba(255,255,255,0.25)">No content yet…</p>' }}
                  />
                  <style>{`
                    .rich-editor h1 { font-size:1.75rem; font-weight:700; color:#fff; margin:1rem 0 0.5rem; }
                    .rich-editor h2 { font-size:1.4rem;  font-weight:600; color:rgba(255,255,255,.92); margin:0.9rem 0 0.4rem; }
                    .rich-editor h3 { font-size:1.15rem; font-weight:600; color:rgba(255,255,255,.88); margin:0.8rem 0 0.35rem; }
                    .rich-editor p  { margin:0.5rem 0; }
                    .rich-editor a  { color:#C48A5C; text-decoration:underline; }
                    .rich-editor blockquote { border-left:3px solid #8B5A3C; padding:0.5rem 1rem; margin:0.75rem 0; color:rgba(255,255,255,.55); font-style:italic; background:rgba(107,66,38,.07); border-radius:0 8px 8px 0; }
                    .rich-editor ul { list-style:disc;    padding-left:1.5rem; margin:0.5rem 0; }
                    .rich-editor ol { list-style:decimal; padding-left:1.5rem; margin:0.5rem 0; }
                    .rich-editor img { max-width:100%; height:auto; border-radius:8px; margin:10px 0; display:block; }
                    .rich-editor hr  { border:none; border-top:1px solid rgba(255,255,255,.12); margin:1rem 0; }
                    .rich-editor pre { background:rgba(255,255,255,.05); padding:0.75rem 1rem; border-radius:8px; font-family:monospace; font-size:13px; overflow-x:auto; margin:0.75rem 0; }
                  `}</style>
                </div>
              ) : (
                /* Edit Mode */
                <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-5 max-h-[80vh] overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Title *" error={errors.title}>
                      <input className="glass-input" value={form.title}
                        onChange={e => { set('title', e.target.value); if (errors.title) setErrors(v => ({ ...v, title: '' })); }}
                        placeholder="How to Care for Your Custom Tee" />
                    </Field>
                    <Field label="SEO Slug" hint="Auto-generated if left blank">
                      <input className="glass-input font-mono text-sm" value={form.slug}
                        onChange={e => set('slug', e.target.value)}
                        placeholder="care-for-custom-tee" />
                    </Field>
                  </div>

                  {/* Cover Image */}
                  <Field label="Cover Image">
                    <label className="block cursor-pointer">
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                        onChange={e => handleCoverUpload(e.target.files?.[0])} />
                      <div className="rounded-xl overflow-hidden flex items-center justify-center transition-all hover:opacity-80"
                        style={{ border: '1.5px dashed rgba(107,66,38,0.4)', background: 'rgba(107,66,38,0.04)', minHeight: '90px' }}>
                        {coverUploading ? (
                          <Spinner size="md" className="text-ink-brown m-4" />
                        ) : form.image ? (
                          <div className="flex items-center gap-4 p-3 w-full">
                            <img src={form.image} alt="" className="w-20 h-14 object-cover rounded-lg flex-shrink-0" />
                            <div>
                              <p className="text-white/70 text-sm font-medium">Cover image set</p>
                              <p className="text-white/35 text-xs">Click to replace</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center p-4">
                            <svg className="w-6 h-6 text-ink-brown mx-auto mb-1" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M13.5 12h.008v.008H13.5V12zm4.5 1.5a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM2.25 3h19.5M2.25 3v18"/>
                            </svg>
                            <p className="text-white/35 text-xs">Click to upload cover image</p>
                          </div>
                        )}
                      </div>
                    </label>
                  </Field>

                  {/* Rich Text Editor */}
                  <Field label="Content *" error={errors.content}>
                    <RichTextEditor
                      key={editorKey}
                      resetKey={editorKey}
                      value={form.content}
                      onChange={v => { set('content', v); if (errors.content) setErrors(e => ({ ...e, content: '' })); }}
                      onImageUpload={handleEditorImageUpload}
                    />
                  </Field>

                  {/* Excerpt */}
                  <Field label="Excerpt" hint="Short preview shown on the blog listing (max 300 chars).">
                    <textarea rows={2} className="glass-input resize-none" value={form.excerpt}
                      onChange={e => set('excerpt', e.target.value)} maxLength={300}
                      placeholder="A short summary of this post shown in listings…" />
                  </Field>

                  {/* SEO */}
                  <div className="rounded-xl p-4 space-y-4"
                    style={{ background: 'rgba(107,66,38,0.05)', border: '1px solid rgba(107,66,38,0.15)' }}>
                    <p className="text-xs font-semibold tracking-widest uppercase text-ink-brown">SEO Settings</p>
                    <Field label="Meta Title" hint="Shown in Google results (max 100 chars). Defaults to post title.">
                      <input className="glass-input" value={form.metaTitle}
                        onChange={e => set('metaTitle', e.target.value)}
                        placeholder={form.title || 'Same as title'} maxLength={100} />
                    </Field>
                    <Field label="Meta Description *" error={errors.metaDescription} hint="Required for SEO (max 200 chars).">
                      <textarea rows={2} className="glass-input resize-none" value={form.metaDescription}
                        onChange={e => { set('metaDescription', e.target.value); if (errors.metaDescription) setErrors(v => ({ ...v, metaDescription: '' })); }}
                        maxLength={200} placeholder="Concise description for search engines…" />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Author">
                      <input className="glass-input" value={form.author}
                        onChange={e => set('author', e.target.value)} placeholder="Inkify Team" />
                    </Field>
                    <Field label="Tags" hint="Comma-separated">
                      <input className="glass-input" value={form.tags}
                        onChange={e => set('tags', e.target.value)} placeholder="printing, tips, fashion" />
                    </Field>
                  </div>

                  {/* Publish toggle */}
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl select-none"
                    style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.1)' }}>
                    <div onClick={() => set('isPublished', !form.isPublished)}
                      className="w-10 h-6 rounded-full flex items-center px-0.5 flex-shrink-0 transition-all"
                      style={{ background: form.isPublished ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'rgba(255,255,255,0.1)' }}>
                      <div className="w-5 h-5 rounded-full bg-white shadow transition-transform"
                        style={{ transform: form.isPublished ? 'translateX(16px)' : 'translateX(0)' }} />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{form.isPublished ? 'Published — Live on site' : 'Draft — Not visible to public'}</p>
                      <p className="text-white/30 text-xs">{form.isPublished ? 'Click to unpublish' : 'Click to publish immediately'}</p>
                    </div>
                  </label>

                  <div className="flex gap-3 pt-2 sticky bottom-0 pb-1"
                    style={{ background: 'linear-gradient(to top, rgba(15,12,10,0.95) 80%, transparent)' }}>
                    <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
                    <button type="submit" disabled={saving}
                      className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60">
                      {saving && <Spinner size="sm" className="text-white" />}
                      {saving ? 'Saving…' : modal === 'create' ? 'Publish Post' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs tracking-widest uppercase text-ink-brown mb-1">Content Management</p>
          <h1 className="font-display text-2xl font-bold text-white">Blog Posts</h1>
          <p className="text-white/30 text-xs mt-1">{blogs.length} post{blogs.length !== 1 ? 's' : ''} total</p>
        </div>
        <button onClick={openCreate} className="btn-primary w-auto px-5 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
          New Post
        </button>
      </div>

      {/* ── Blog List ── */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" className="text-ink-brown" /></div>
      ) : blogs.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-5xl mb-3">📝</p>
          <p className="text-white/50 text-lg font-medium mb-1">No blog posts yet</p>
          <p className="text-white/25 text-sm mb-6">Create your first post to boost SEO and engage customers.</p>
          <button onClick={openCreate} className="btn-primary w-auto px-8 mx-auto block">Write First Post</button>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.08]">
                {['Post','Author','Tags','Status','Date','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-white/30 tracking-widest uppercase font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {blogs.map((b, i) => (
                <motion.tr key={b._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 max-w-[250px]">
                    <div className="flex items-center gap-3">
                      {b.image
                        ? <img src={b.image} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        : <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-base"
                            style={{ background: 'rgba(107,66,38,0.12)', border: '1px solid rgba(107,66,38,0.2)' }}>📄</div>
                      }
                      <div>
                        <p className="text-white font-medium text-xs leading-snug line-clamp-2">{b.title}</p>
                        <p className="text-white/25 text-xs font-mono mt-0.5 truncate max-w-[160px]">{b.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white/50 text-xs">{b.author}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {b.tags?.slice(0, 2).map(t => (
                        <span key={t} className="text-xs px-1.5 py-0.5 rounded-full"
                          style={{ background: 'rgba(107,66,38,0.15)', color: '#C48A5C' }}>{t}</span>
                      ))}
                      {b.tags?.length > 2 && <span className="text-white/20 text-xs">+{b.tags.length - 2}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full`}
                      style={{
                        background: b.isPublished ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)',
                        color:      b.isPublished ? '#22c55e'              : '#ca8a04',
                      }}>
                      {b.isPublished ? '● Published' : '○ Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/30 text-xs whitespace-nowrap">
                    {new Date(b.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEdit(b)}
                        className="text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        Edit
                      </button>
                      <button onClick={() => handleTogglePublish(b)}
                        className="text-xs px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                        style={{
                          background: b.isPublished ? 'rgba(234,179,8,0.08)'  : 'rgba(34,197,94,0.08)',
                          color:      b.isPublished ? '#ca8a04'                : '#22c55e',
                          border:     `1px solid ${b.isPublished ? 'rgba(234,179,8,0.15)' : 'rgba(34,197,94,0.15)'}`,
                        }}>
                        {b.isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                      <button onClick={() => handleDelete(b._id)} disabled={deleting === b._id}
                        className="text-xs px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        style={{ background: 'rgba(239,68,68,0.08)', color: 'rgba(239,68,68,0.7)', border: '1px solid rgba(239,68,68,0.12)' }}>
                        {deleting === b._id ? '…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
