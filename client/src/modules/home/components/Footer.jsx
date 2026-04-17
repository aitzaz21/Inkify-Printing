import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { footerAPI } from '../../../shared/api/footer.service';

const FooterLink = ({ to, children }) => {
  const isExternal = to?.startsWith('http');
  return isExternal ? (
    <a href={to} target="_blank" rel="noopener noreferrer"
      className="text-white/40 hover:text-white/70 transition-colors duration-200 text-sm">{children}</a>
  ) : (
    <Link to={to || '/'} className="text-white/40 hover:text-white/70 transition-colors duration-200 text-sm">{children}</Link>
  );
};

const SOCIAL_ICONS = {
  twitter: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  instagram: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>,
  linkedin: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>,
  facebook: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  tiktok: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.44V13a8.16 8.16 0 005.58 2.18v-3.44a4.85 4.85 0 01-5.58-2.05z"/></svg>,
  youtube: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
};

const SocialIcon = ({ href, platform }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" aria-label={platform}
    className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-ink-brown/50 transition-all duration-200">
    {SOCIAL_ICONS[platform] || SOCIAL_ICONS.twitter}
  </a>
);

export default function Footer() {
  const [data, setData] = useState(null);

  useEffect(() => {
    footerAPI.get()
      .then(r => setData(r.data.footer))
      .catch(() => {});
  }, []);

  const sections    = data?.sections    || [];
  const socialLinks = data?.socialLinks || [];
  const brandText   = data?.brandText   || 'Premium print solutions crafted with precision and delivered with excellence.';
  const copyright   = (data?.copyright  || '© {year} Inkify Printing. All rights reserved.').replace('{year}', new Date().getFullYear());
  const bottomText  = data?.bottomText  || 'Crafted with precision & care.';

  const gridCols = Math.min(sections.length + 1, 4);

  return (
    <footer className="border-t border-white/[0.08] mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 gap-10 mb-12" style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}>
          {/* Brand */}
          <div>
            <div className="mb-4">
              <span className="font-display font-bold text-xl tracking-widest text-white">INKIFY</span>
              <span className="font-display font-light text-xl tracking-widest text-ink-brown"> PRINTING</span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed">{brandText}</p>
            {socialLinks.length > 0 && (
              <div className="flex gap-2 mt-5">
                {socialLinks.map((s, i) => (
                  <SocialIcon key={i} href={s.url} platform={s.platform} />
                ))}
              </div>
            )}
          </div>

          {/* Dynamic sections */}
          {sections.map((sec, i) => (
            <div key={i}>
              <h4 className="text-xs font-medium tracking-widest uppercase text-white/30 mb-5">{sec.title}</h4>
              <div className="flex flex-col gap-3">
                {sec.links?.map((link, j) => (
                  <FooterLink key={j} to={link.url}>{link.label}</FooterLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/[0.08] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/25 text-xs">{copyright}</p>
          <p className="text-white/20 text-xs">{bottomText}</p>
        </div>
      </div>
    </footer>
  );
}
