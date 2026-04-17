import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { contentAPI } from '../../../shared/api/content.service';
import { Spinner } from '../../../shared/components/Spinner';

export default function AdminPrivacyPage() {
  const [privacy,  setPrivacy]  = useState('');
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [preview,  setPreview]  = useState(false);

  useEffect(() => {
    contentAPI.get()
      .then(r => setPrivacy(r.data.content?.privacyPolicy || ''))
      .catch(() => toast.error('Failed to load content.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await contentAPI.update({ privacyPolicy: privacy });
      toast.success('Privacy policy saved.');
    } catch {
      toast.error('Save failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <Spinner size="lg" className="text-ink-brown" />
    </div>
  );

  // Simple markdown-ish renderer for preview
  const renderPreview = (text) => {
    if (!text) return '<p style="color:rgba(255,255,255,0.3)">Nothing to preview yet.</p>';
    return text
      .replace(/^## (.+)$/gm, '<h2 style="font-size:1.25rem;font-weight:700;color:#fff;margin:1.5rem 0 0.75rem">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 style="font-size:1rem;font-weight:600;color:rgba(255,255,255,0.85);margin:1.25rem 0 0.5rem">$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color:rgba(255,255,255,0.9)">$1</strong>')
      .replace(/^- (.+)$/gm, '<li style="color:rgba(255,255,255,0.5);margin:0.25rem 0 0.25rem 1.25rem;list-style:disc">$1</li>')
      .replace(/\n\n/g, '</p><p style="color:rgba(255,255,255,0.5);line-height:1.7;margin:0.75rem 0">')
      .replace(/^(.+)$(?!\n)/gm, (m) => m.startsWith('<') ? m : `<span style="color:rgba(255,255,255,0.5)">${m}</span>`);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs tracking-widest uppercase text-ink-brown mb-1">Content</p>
          <h1 className="font-display text-2xl font-bold text-white">Privacy Policy</h1>
          <p className="text-white/35 text-sm mt-1">Manage the privacy policy shown at <code className="text-ink-brown-light">/privacy</code></p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPreview(p => !p)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150"
            style={{
              background: preview ? 'rgba(107,66,38,0.2)' : 'rgba(255,255,255,0.06)',
              border: preview ? '1px solid rgba(107,66,38,0.35)' : '1px solid rgba(255,255,255,0.1)',
              color: preview ? '#fff' : 'rgba(255,255,255,0.5)',
            }}>
            {preview ? 'Edit' : 'Preview'}
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-150 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
            {saving ? <Spinner size="sm" className="text-white" /> : null}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {/* Toolbar */}
        {!preview && (
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.08] flex-wrap"
            style={{ background: 'rgba(255,255,255,0.02)' }}>
            {[
              { label: 'H2',    insert: '## ',          title: 'Heading 2' },
              { label: 'H3',    insert: '### ',         title: 'Heading 3' },
              { label: 'Bold',  insert: '**text**',     title: 'Bold' },
              { label: '— —',   insert: '\n\n---\n\n',  title: 'Divider' },
              { label: '• List',insert: '- ',           title: 'List item' },
            ].map(t => (
              <button key={t.label}
                onClick={() => setPrivacy(p => p + (p.endsWith('\n') ? '' : '\n') + t.insert)}
                title={t.title}
                className="px-2.5 py-1 rounded-lg text-xs font-mono text-white/45 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all duration-150">
                {t.label}
              </button>
            ))}
            <span className="ml-auto text-xs text-white/20">{privacy.length} chars</span>
          </div>
        )}

        {preview ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="p-8 min-h-[500px]"
            dangerouslySetInnerHTML={{ __html: renderPreview(privacy) }}
          />
        ) : (
          <textarea
            value={privacy}
            onChange={e => setPrivacy(e.target.value)}
            rows={28}
            placeholder={`## Privacy Policy\n\n**Last updated:** ${new Date().toLocaleDateString()}\n\n### 1. Information We Collect\n\nWrite your privacy policy here using Markdown-like formatting.\n\n- Use ## for section headings\n- Use ### for sub-headings\n- Use **text** for bold\n- Use - for bullet points\n- Separate paragraphs with a blank line`}
            className="w-full resize-none bg-transparent px-6 py-5 text-white/60 text-sm leading-relaxed font-mono focus:outline-none"
            style={{ minHeight: '500px' }}
          />
        )}
      </div>

      {/* Tips */}
      <div className="glass-card p-5">
        <p className="text-white/30 text-xs uppercase tracking-wide mb-3">Formatting guide</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { syntax: '## Heading',   desc: 'Large section heading' },
            { syntax: '### Sub',      desc: 'Smaller sub-heading'  },
            { syntax: '**bold**',     desc: 'Bold text'            },
            { syntax: '- item',       desc: 'Bullet list item'     },
          ].map(t => (
            <div key={t.syntax} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <code className="text-ink-brown-light text-xs block mb-1">{t.syntax}</code>
              <p className="text-white/30 text-xs">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
