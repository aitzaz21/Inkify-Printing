import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../../shared/api/axios';
import { Spinner } from '../../../shared/components/Spinner';

export default function BlogDetailPage() {
  const { slug }  = useParams();
  const navigate  = useNavigate();
  const [blog,    setBlog]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/blog/${slug}`)
      .then(r => setBlog(r.data.blog))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" className="text-ink-brown" />
    </div>
  );

  if (error || !blog) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center glass-card p-10 max-w-sm">
        <p className="text-5xl mb-4">📄</p>
        <p className="text-white font-display text-xl font-bold mb-2">Post Not Found</p>
        <p className="text-white/40 text-sm mb-6">This blog post doesn't exist or has been removed.</p>
        <Link to="/blog" className="btn-primary w-auto px-8 inline-block">← Back to Blog</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Back */}
        <motion.div initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.3 }}>
          <Link to="/blog" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm mb-8">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Blog
          </Link>
        </motion.div>

        {/* Hero image */}
        {blog.image && (
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
            className="w-full rounded-2xl overflow-hidden mb-8" style={{ maxHeight:'420px' }}>
            <img src={blog.image} alt={blog.title} className="w-full h-full object-cover" />
          </motion.div>
        )}

        {/* Meta */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1, duration:0.45 }}>
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {blog.tags?.map(t => (
              <span key={t} className="text-xs px-2.5 py-1 rounded-full"
                style={{ background:'rgba(107,66,38,0.15)', color:'#C48A5C', border:'1px solid rgba(107,66,38,0.2)' }}>
                {t}
              </span>
            ))}
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">
            {blog.title}
          </h1>
          <div className="flex items-center gap-4 text-white/40 text-sm mb-8 pb-8 border-b border-white/[0.08]">
            <span>By {blog.author}</span>
            <span>·</span>
            <span>{new Date(blog.publishedAt || blog.createdAt).toLocaleDateString('en-PK',{ day:'numeric', month:'long', year:'numeric' })}</span>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2, duration:0.45 }}
          className="prose prose-invert prose-sm sm:prose-base max-w-none"
          style={{
            color: 'rgba(255,255,255,0.72)',
            lineHeight: '1.85',
          }}>
          {/* Render blog content — supports basic HTML or plain paragraphs */}
          <div
            dangerouslySetInnerHTML={{ __html: blog.content.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br/>') }}
            style={{
              '--tw-prose-body': 'rgba(255,255,255,0.72)',
              '--tw-prose-headings': '#fff',
              '--tw-prose-links': '#8B5A3C',
            }}
          />
        </motion.div>

        {/* Bottom CTA */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.4 }}
          className="mt-16 p-6 rounded-2xl text-center"
          style={{ background:'rgba(107,66,38,0.1)', border:'1px solid rgba(107,66,38,0.2)' }}>
          <p className="text-white/60 text-sm mb-3">Ready to create your custom shirt?</p>
          <Link to="/customize"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ background:'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
            Start Customising →
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
