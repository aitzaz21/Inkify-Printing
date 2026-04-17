import { useState, useEffect } from 'react';
import { contentAPI } from '../../../shared/api/content.service';
import { Spinner } from '../../../shared/components/Spinner';

export default function PrivacyPage() {
  const [policy,  setPolicy]  = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contentAPI.get()
      .then(r => setPolicy(r.data.content?.privacyPolicy || ''))
      .finally(() => setLoading(false));
  }, []);

  // Simple markdown-to-html renderer
  const renderMarkdown = (text) => {
    return text
      .replace(/^### (.+)$/gm, '<h3 style="color:#fff;font-size:1.1rem;font-weight:600;margin:1.5rem 0 0.5rem">$1</h3>')
      .replace(/^## (.+)$/gm,  '<h2 style="color:#fff;font-size:1.3rem;font-weight:700;margin:2rem 0 0.75rem">$1</h2>')
      .replace(/^# (.+)$/gm,   '<h1 style="color:#fff;font-size:1.6rem;font-weight:800;margin:2.5rem 0 1rem">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#fff">$1</strong>')
      .replace(/\*(.+?)\*/g,    '<em>$1</em>')
      .replace(/^- (.+)$/gm,   '<li style="margin:0.25rem 0;padding-left:0.5rem">$1</li>')
      .replace(/\n\n/g,         '<br/><br/>');
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <p className="text-xs tracking-widest uppercase text-ink-brown mb-2">Legal</p>
          <h1 className="font-display text-4xl font-bold text-white">Privacy Policy</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" className="text-ink-brown" /></div>
        ) : (
          <div className="glass-card p-8 sm:p-10">
            {policy ? (
              <div className="text-white/60 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(policy) }} />
            ) : (
              <p className="text-white/30 text-sm">Privacy policy coming soon.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
