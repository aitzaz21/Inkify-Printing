import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../../shared/api/axios';
import { Spinner } from '../../../shared/components/Spinner';

const SkeletonCard = () => (
  <div className="glass-card overflow-hidden animate-pulse">
    <div className="w-full h-44 bg-white/[0.06]" />
    <div className="p-5 space-y-3">
      <div className="h-2 w-20 rounded-full bg-white/[0.06]" />
      <div className="h-5 w-3/4 rounded-lg bg-white/[0.08]" />
      <div className="h-3 w-full rounded bg-white/[0.05]" />
      <div className="h-3 w-5/6 rounded bg-white/[0.05]" />
    </div>
  </div>
);

export default function BlogPage() {
  const [blogs,   setBlogs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);

  useEffect(() => {
    setLoading(true);
    api.get(`/blog?page=${page}&limit=9`)
      .then(r => { setBlogs(r.data.blogs || []); setPages(r.data.pages || 1); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative pt-28 pb-14 px-4 sm:px-6 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(107,66,38,0.2) 0%, transparent 70%)' }} />
        <motion.div initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.55 }}
          className="relative z-10 max-w-2xl mx-auto">
          <p className="text-xs font-medium tracking-widest uppercase text-ink-brown mb-3">Inkify Blog</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
            Stories & <span className="italic text-gradient">Insights</span>
          </h1>
          <p className="text-white/40 text-sm sm:text-base leading-relaxed">
            Tips, inspiration, and behind-the-scenes from the Inkify team.
          </p>
        </motion.div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-white/40 text-lg font-medium">No blog posts yet.</p>
            <p className="text-white/25 text-sm mt-1">Check back soon!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((blog, i) => (
                <motion.div key={blog._id}
                  initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }}
                  viewport={{ once:true, margin:'-40px' }}
                  transition={{ delay:(i%3)*0.08, duration:0.45 }}>
                  <Link to={`/blog/${blog.slug}`} className="block group h-full">
                    <article className="glass-card overflow-hidden h-full flex flex-col hover:border-ink-brown/40 transition-all duration-300 hover:-translate-y-1">
                      {/* Image */}
                      <div className="w-full h-44 overflow-hidden flex-shrink-0"
                        style={{ background:'rgba(107,66,38,0.08)' }}>
                        {blog.image
                          ? <img src={blog.image} alt={blog.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-12 h-12 text-ink-brown/20" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                              </svg>
                            </div>
                          )
                        }
                      </div>
                      {/* Content */}
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          {blog.tags?.slice(0,2).map(t => (
                            <span key={t} className="text-xs px-2 py-0.5 rounded-full"
                              style={{ background:'rgba(107,66,38,0.15)', color:'#C48A5C', border:'1px solid rgba(107,66,38,0.2)' }}>
                              {t}
                            </span>
                          ))}
                        </div>
                        <h2 className="font-display text-base font-bold text-white leading-snug mb-2 group-hover:text-ink-brown-light transition-colors line-clamp-2">
                          {blog.title}
                        </h2>
                        <p className="text-white/40 text-sm leading-relaxed flex-1 line-clamp-3">
                          {blog.excerpt}
                        </p>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.08]">
                          <div>
                            <p className="text-white/50 text-xs">{blog.author}</p>
                            <p className="text-white/25 text-xs">
                              {new Date(blog.publishedAt || blog.createdAt).toLocaleDateString('en-PK',{ day:'numeric', month:'short', year:'numeric' })}
                            </p>
                          </div>
                          <span className="text-xs text-ink-brown-light font-medium group-hover:translate-x-1 transition-transform inline-block">
                            Read →
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                </motion.div>
              ))}
            </div>
            {/* Pagination */}
            {pages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className="w-9 h-9 rounded-xl text-sm font-medium transition-all"
                    style={p === page
                      ? { background:'linear-gradient(135deg,#6B4226,#8B5A3C)', color:'#fff' }
                      : { background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.45)', border:'1px solid rgba(255,255,255,0.1)' }
                    }>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
