import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../shared/api/axios';
import { Spinner } from '../../../shared/components/Spinner';

const AccordionItem = ({ faq, index }) => {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity:0, y:12 }}
      whileInView={{ opacity:1, y:0 }}
      viewport={{ once:true, margin:'-20px' }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 p-5 text-left rounded-2xl transition-all duration-200 group"
        style={{
          background: open ? 'rgba(107,66,38,0.12)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${open ? 'rgba(107,66,38,0.35)' : 'rgba(255,255,255,0.08)'}`,
        }}
        aria-expanded={open}
      >
        <span className="text-white text-sm font-medium leading-snug group-hover:text-white/90 transition-colors pr-2">
          {faq.question}
        </span>
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
          style={{
            background: open ? 'linear-gradient(135deg,#6B4226,#8B5A3C)' : 'rgba(255,255,255,0.08)',
          }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pt-3 pb-5">
              <p className="text-white/55 text-sm leading-relaxed">{faq.answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function FAQPage() {
  const [faqs,      setFaqs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [categories, setCategories] = useState(['All']);

  useEffect(() => {
    api.get('/faq')
      .then(r => {
        const data = r.data.faqs || [];
        setFaqs(data);
        const cats = ['All', ...new Set(data.map(f => f.category).filter(Boolean))];
        setCategories(cats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeTab === 'All'
    ? faqs
    : faqs.filter(f => f.category === activeTab);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative pt-28 pb-14 px-4 sm:px-6 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background:'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(107,66,38,0.18) 0%, transparent 70%)' }} />
        <motion.div initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
          className="relative z-10 max-w-2xl mx-auto">
          <p className="text-xs font-medium tracking-widest uppercase text-ink-brown mb-3">Support</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
            Frequently Asked <span className="italic text-gradient">Questions</span>
          </h1>
          <p className="text-white/40 text-sm sm:text-base leading-relaxed">
            Everything you need to know about Inkify Printing.
          </p>
        </motion.div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" className="text-ink-brown" /></div>
        ) : faqs.length === 0 ? (
          <div className="text-center py-16 glass-card">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-white/40">No FAQs available yet.</p>
          </div>
        ) : (
          <>
            {/* Category tabs */}
            {categories.length > 2 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {categories.map(cat => (
                  <button key={cat} onClick={() => setActiveTab(cat)}
                    className="px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-150"
                    style={activeTab === cat
                      ? { background:'linear-gradient(135deg,#6B4226,#8B5A3C)', color:'#fff' }
                      : { background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.45)', border:'1px solid rgba(255,255,255,0.1)' }
                    }>
                    {cat}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-3">
              {filtered.map((faq, i) => (
                <AccordionItem key={faq._id} faq={faq} index={i} />
              ))}
            </div>

            {/* Bottom contact CTA */}
            <motion.div initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }}
              className="mt-16 p-8 rounded-2xl text-center"
              style={{ background:'rgba(107,66,38,0.08)', border:'1px solid rgba(107,66,38,0.18)' }}>
              <p className="text-white font-display text-xl font-bold mb-2">Still have questions?</p>
              <p className="text-white/40 text-sm mb-5">Our team is happy to help.</p>
              <a href="mailto:support@inkifyprinting.com"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:scale-105"
                style={{ background:'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                Contact Support
              </a>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
