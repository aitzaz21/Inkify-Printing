import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { contentAPI } from '../../../shared/api/content.service';
import { uploadAPI } from '../../../shared/api/upload.service';
import { Spinner } from '../../../shared/components/Spinner';

const Field = ({ label, hint, children }) => (
  <div>
    <label className="label">{label}</label>
    {hint && <p className="text-white/25 text-xs mb-2">{hint}</p>}
    {children}
  </div>
);

export default function AdminAboutPage() {
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [tab,      setTab]      = useState('text');

  // Text content
  const [headline,    setHeadline]    = useState('');
  const [subheadline, setSubheadline] = useState('');
  const [story,       setStory]       = useState('');
  const [mission,     setMission]     = useState('');
  const [vision,      setVision]      = useState('');
  const [heroImage,   setHeroImage]   = useState('');
  const [uploading,   setUploading]   = useState(false);

  // Values
  const [values, setValues] = useState([]);

  // Team
  const [team, setTeam] = useState([]);

  useEffect(() => {
    contentAPI.get()
      .then(r => {
        const ap = r.data.content?.aboutPage || {};
        setHeadline(ap.headline    || '');
        setSubheadline(ap.subheadline || '');
        setStory(ap.story   || '');
        setMission(ap.mission || '');
        setVision(ap.vision  || '');
        setHeroImage(ap.heroImage || '');
        setValues(ap.values?.length ? ap.values : [
          { icon: '🎨', title: 'Craftsmanship', text: 'Every print reviewed by hand before it ships.' },
          { icon: '⚡', title: 'Speed',          text: 'Most orders dispatched within 72 hours.' },
          { icon: '🔒', title: 'Reliability',   text: 'Every step tracked and transparent.' },
        ]);
        setTeam(ap.teamMembers || []);
      })
      .catch(() => toast.error('Failed to load content.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await contentAPI.update({
        aboutPage: { headline, subheadline, story, mission, vision, heroImage, values, teamMembers: team },
      });
      toast.success('About page saved.');
    } catch {
      toast.error('Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleHeroUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadAPI.uploadHero(file);
      setHeroImage(res.data.url);
      toast.success('Image uploaded.');
    } catch {
      toast.error('Upload failed.');
    } finally {
      setUploading(false); e.target.value = '';
    }
  };

  const addValue   = () => setValues(v => [...v, { icon: '✓', title: '', text: '' }]);
  const removeValue = (i) => setValues(v => v.filter((_, j) => j !== i));
  const updateValue = (i, key, val) => setValues(v => v.map((x, j) => j === i ? { ...x, [key]: val } : x));

  const addMember   = () => setTeam(t => [...t, { name: '', role: '', avatar: '' }]);
  const removeMember = (i) => setTeam(t => t.filter((_, j) => j !== i));
  const updateMember = (i, key, val) => setTeam(t => t.map((x, j) => j === i ? { ...x, [key]: val } : x));

  const TABS = ['text', 'values', 'team'];
  const TAB_LABELS = { text: 'Text Content', values: 'Core Values', team: 'Team Members' };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" className="text-ink-brown" /></div>;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs tracking-widest uppercase text-ink-brown mb-1">Content</p>
          <h1 className="font-display text-2xl font-bold text-white">About Us Page</h1>
          <p className="text-white/35 text-sm mt-1">Manage content shown at <code className="text-ink-brown-light">/about</code></p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
          {saving && <Spinner size="sm" className="text-white" />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-150"
            style={tab === t
              ? { background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', color: '#fff' }
              : { color: 'rgba(255,255,255,0.45)' }
            }>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* ── Text Content Tab ── */}
      {tab === 'text' && (
        <motion.div key="text" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 space-y-5">
          <Field label="Page Headline" hint="Main hero heading (use \n for line break)">
            <textarea rows={2} value={headline} onChange={e => setHeadline(e.target.value)} className="glass-input resize-none" placeholder="Built with passion,\ndelivered with precision." />
          </Field>

          <Field label="Subheadline">
            <textarea rows={2} value={subheadline} onChange={e => setSubheadline(e.target.value)} className="glass-input resize-none" placeholder="A brief description of your company…" />
          </Field>

          <Field label="Our Story" hint="Separate paragraphs with a blank line">
            <textarea rows={6} value={story} onChange={e => setStory(e.target.value)} className="glass-input resize-none" placeholder="Tell your company's founding story…" />
          </Field>

          <Field label="Hero Image (for story section)">
            <div className="flex items-center gap-4">
              {heroImage && (
                <img src={heroImage} alt="Hero" className="w-20 h-16 object-cover rounded-lg flex-shrink-0" />
              )}
              <div>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleHeroUpload} className="hidden" />
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white/60 hover:text-white border border-white/12 hover:border-white/25 transition-all duration-200"
                    style={{ background: 'rgba(255,255,255,0.04)' }}>
                    {uploading ? <Spinner size="sm" className="text-white" /> : null}
                    {uploading ? 'Uploading…' : '📷 Upload Image'}
                  </span>
                </label>
                {heroImage && (
                  <button onClick={() => setHeroImage('')} className="block text-xs text-red-400/60 hover:text-red-400 mt-2 transition-colors">
                    Remove image
                  </button>
                )}
              </div>
            </div>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Mission Statement">
              <textarea rows={3} value={mission} onChange={e => setMission(e.target.value)} className="glass-input resize-none" placeholder="Our mission is to…" />
            </Field>
            <Field label="Vision Statement">
              <textarea rows={3} value={vision} onChange={e => setVision(e.target.value)} className="glass-input resize-none" placeholder="We envision a world where…" />
            </Field>
          </div>
        </motion.div>
      )}

      {/* ── Values Tab ── */}
      {tab === 'values' && (
        <motion.div key="values" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {values.map((v, i) => (
            <div key={i} className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-white/50 text-sm font-medium">Value #{i + 1}</p>
                <button onClick={() => removeValue(i)} className="text-red-400/50 hover:text-red-400 text-xs transition-colors">Remove</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label">Icon (emoji)</label>
                  <input value={v.icon} onChange={e => updateValue(i, 'icon', e.target.value)} className="glass-input text-center text-xl" placeholder="🎨" maxLength={4} />
                </div>
                <div>
                  <label className="label">Title</label>
                  <input value={v.title} onChange={e => updateValue(i, 'title', e.target.value)} className="glass-input" placeholder="Craftsmanship" />
                </div>
                <div>
                  <label className="label">Description</label>
                  <input value={v.text} onChange={e => updateValue(i, 'text', e.target.value)} className="glass-input" placeholder="Brief description…" />
                </div>
              </div>
            </div>
          ))}
          <button onClick={addValue}
            className="w-full py-3 rounded-xl text-sm font-medium text-white/40 hover:text-white border border-dashed border-white/15 hover:border-white/30 transition-all duration-200">
            + Add Value
          </button>
        </motion.div>
      )}

      {/* ── Team Tab ── */}
      {tab === 'team' && (
        <motion.div key="team" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {team.length === 0 && (
            <p className="text-white/25 text-sm text-center py-8">No team members added yet. Click below to add some.</p>
          )}
          {team.map((m, i) => (
            <div key={i} className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-white/50 text-sm font-medium">Team Member #{i + 1}</p>
                <button onClick={() => removeMember(i)} className="text-red-400/50 hover:text-red-400 text-xs transition-colors">Remove</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label">Name</label>
                  <input value={m.name} onChange={e => updateMember(i, 'name', e.target.value)} className="glass-input" placeholder="Jane Doe" />
                </div>
                <div>
                  <label className="label">Role / Title</label>
                  <input value={m.role} onChange={e => updateMember(i, 'role', e.target.value)} className="glass-input" placeholder="Head of Design" />
                </div>
                <div>
                  <label className="label">Avatar URL</label>
                  <input value={m.avatar} onChange={e => updateMember(i, 'avatar', e.target.value)} className="glass-input" placeholder="https://…" />
                </div>
              </div>
            </div>
          ))}
          <button onClick={addMember}
            className="w-full py-3 rounded-xl text-sm font-medium text-white/40 hover:text-white border border-dashed border-white/15 hover:border-white/30 transition-all duration-200">
            + Add Team Member
          </button>
        </motion.div>
      )}
    </div>
  );
}
