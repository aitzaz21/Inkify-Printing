import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { footerAPI } from '../../../shared/api/footer.service';
import { Spinner } from '../../../shared/components/Spinner';

const PLATFORMS = ['twitter','instagram','linkedin','facebook','tiktok','youtube'];

export default function AdminFooterPage() {
  const [footer,  setFooter]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  const [brandText,  setBrandText]  = useState('');
  const [sections,   setSections]   = useState([]);
  const [socials,    setSocials]    = useState([]);
  const [copyright,  setCopyright]  = useState('');
  const [bottomText, setBottomText] = useState('');

  useEffect(() => {
    footerAPI.get()
      .then(r => {
        const f = r.data.footer;
        setFooter(f);
        setBrandText(f.brandText || '');
        setSections(f.sections || []);
        setSocials(f.socialLinks || []);
        setCopyright(f.copyright || '');
        setBottomText(f.bottomText || '');
      })
      .catch(() => toast.error('Failed to load footer.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await footerAPI.update({ brandText, sections, socialLinks: socials, copyright, bottomText });
      setFooter(r.data.footer);
      toast.success('Footer saved!');
    } catch { toast.error('Save failed.'); }
    finally { setSaving(false); }
  };

  // Section helpers
  const addSection = () => setSections(s => [...s, { title: 'New Section', links: [] }]);
  const removeSection = (idx) => setSections(s => s.filter((_, i) => i !== idx));
  const updateSectionTitle = (idx, title) => setSections(s => s.map((sec, i) => i === idx ? { ...sec, title } : sec));
  const addLink = (sIdx) => setSections(s => s.map((sec, i) => i === sIdx ? { ...sec, links: [...sec.links, { label: '', url: '/' }] } : sec));
  const removeLink = (sIdx, lIdx) => setSections(s => s.map((sec, i) => i === sIdx ? { ...sec, links: sec.links.filter((_, j) => j !== lIdx) } : sec));
  const updateLink = (sIdx, lIdx, field, value) => setSections(s => s.map((sec, i) =>
    i === sIdx ? { ...sec, links: sec.links.map((l, j) => j === lIdx ? { ...l, [field]: value } : l) } : sec
  ));

  // Social helpers
  const addSocial = () => setSocials(s => [...s, { platform: 'twitter', url: '#' }]);
  const removeSocial = (idx) => setSocials(s => s.filter((_, i) => i !== idx));
  const updateSocial = (idx, field, value) => setSocials(s => s.map((so, i) => i === idx ? { ...so, [field]: value } : so));

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" className="text-ink-brown" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-widest uppercase text-ink-brown mb-1">Site Management</p>
        <h1 className="font-display text-2xl font-bold text-white">Footer</h1>
      </div>

      {/* Brand Text */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="font-display text-base font-semibold text-white">Brand Description</h2>
        <textarea rows={2} className="glass-input resize-none" value={brandText}
          onChange={e => setBrandText(e.target.value)}
          placeholder="Premium print solutions crafted with precision..." />
      </div>

      {/* Sections */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-white">Footer Sections</h2>
          <button onClick={addSection}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
            style={{ background:'rgba(107,66,38,0.2)', color:'#C48A5C', border:'1px solid rgba(107,66,38,0.3)' }}>
            + Add Section
          </button>
        </div>

        {sections.map((sec, sIdx) => (
          <motion.div key={sIdx} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            className="rounded-xl p-4 space-y-3"
            style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-3">
              <input className="glass-input flex-1 py-2" value={sec.title}
                onChange={e => updateSectionTitle(sIdx, e.target.value)}
                placeholder="Section title" />
              <button onClick={() => removeSection(sIdx)}
                className="text-red-400/60 hover:text-red-400 text-xs px-2 py-1 transition-colors">Remove</button>
            </div>
            {sec.links.map((link, lIdx) => (
              <div key={lIdx} className="flex items-center gap-2 pl-4">
                <input className="glass-input flex-1 py-1.5 text-xs" value={link.label}
                  onChange={e => updateLink(sIdx, lIdx, 'label', e.target.value)}
                  placeholder="Link label" />
                <input className="glass-input flex-1 py-1.5 text-xs font-mono" value={link.url}
                  onChange={e => updateLink(sIdx, lIdx, 'url', e.target.value)}
                  placeholder="/path or https://..." />
                <button onClick={() => removeLink(sIdx, lIdx)}
                  className="text-white/20 hover:text-red-400 text-xs transition-colors">×</button>
              </div>
            ))}
            <button onClick={() => addLink(sIdx)}
              className="text-xs text-ink-brown-light hover:text-white transition-colors pl-4">
              + Add link
            </button>
          </motion.div>
        ))}
      </div>

      {/* Social Links */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-white">Social Links</h2>
          <button onClick={addSocial}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
            style={{ background:'rgba(107,66,38,0.2)', color:'#C48A5C', border:'1px solid rgba(107,66,38,0.3)' }}>
            + Add Social
          </button>
        </div>
        {socials.map((so, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <select className="glass-input w-36 py-1.5 text-xs" value={so.platform}
              onChange={e => updateSocial(idx, 'platform', e.target.value)}>
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <input className="glass-input flex-1 py-1.5 text-xs font-mono" value={so.url}
              onChange={e => updateSocial(idx, 'url', e.target.value)}
              placeholder="https://..." />
            <button onClick={() => removeSocial(idx)}
              className="text-white/20 hover:text-red-400 text-xs transition-colors">×</button>
          </div>
        ))}
      </div>

      {/* Copyright */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="font-display text-base font-semibold text-white">Copyright & Bottom Text</h2>
        <div className="space-y-3">
          <div>
            <label className="label">Copyright (use {'{year}'} for dynamic year)</label>
            <input className="glass-input" value={copyright}
              onChange={e => setCopyright(e.target.value)}
              placeholder="© {year} Inkify Printing. All rights reserved." />
          </div>
          <div>
            <label className="label">Bottom tagline</label>
            <input className="glass-input" value={bottomText}
              onChange={e => setBottomText(e.target.value)}
              placeholder="Crafted with precision & care." />
          </div>
        </div>
      </div>

      {/* Save */}
      <button onClick={handleSave} disabled={saving}
        className="btn-primary w-auto px-10 flex items-center gap-2 disabled:opacity-60">
        {saving && <Spinner size="sm" className="text-white" />}
        {saving ? 'Saving…' : 'Save Footer'}
      </button>
    </div>
  );
}
