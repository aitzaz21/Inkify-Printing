import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../shared/hooks/useAuthContext';
import { useCart } from '../../../shared/context/CartContext';

// ── Icons ────────────────────────────────────────────────────────
const Icon = ({ d, className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);
const ICONS = {
  user:    'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
  orders:  'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z',
  designs: 'M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42',
  cart:    'M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z',
  admin:   'M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75',
  logout:  'M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75',
  chevron: 'M19.5 8.25l-7.5 7.5-7.5-7.5',
  close:   'M6 18L18 6M6 6l12 12',
};

const NAV_LINKS = [
  { to: '/designs',     label: 'Products'      },
  { to: '/marketplace', label: 'Marketplace'   },
];

const DropItem = ({ to, icon, label, badge, onClick }) => (
  <Link to={to} onClick={onClick}
    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group"
    style={{ color: 'rgba(255,255,255,0.78)' }}
    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#fff'; }}
    onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'rgba(255,255,255,0.78)'; }}
  >
    <span className="text-white/30 flex-shrink-0">{icon}</span>
    <span className="flex-1">{label}</span>
    {badge != null && badge > 0 && (
      <span className="ml-auto min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1"
        style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', color: '#fff' }}>
        {badge > 9 ? '9+' : badge}
      </span>
    )}
  </Link>
);

export default function Navbar() {
  const [scrolled,   setScrolled]   = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [dropOpen,   setDropOpen]   = useState(false);
  const [announced,  setAnnounced]  = useState(true);
  const dropRef = useRef(null);

  const { user, logout } = useAuth();
  const { count }        = useCart();
  const navigate         = useNavigate();
  const { pathname }     = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropOpen) return;
    const close = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [dropOpen]);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); setDropOpen(false); }, [pathname]);

  const handleLogout = () => { logout(); navigate('/'); };
  const close = () => { setMenuOpen(false); setDropOpen(false); };

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : '';

  return (
    <>
      {/* ── Announcement bar ───────────────────────────────────── */}
      <AnimatePresence>
        {announced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed top-0 left-0 right-0 z-50 announcement-bar overflow-hidden"
          >
            <div className="flex items-center justify-center gap-3 relative">
              <span>🚚</span>
              <span>Free shipping on orders over <strong>PKR 5,000</strong> — Order now!</span>
              <Link to="/designs" className="underline opacity-70 hover:opacity-100 transition-opacity">
                Shop now
              </Link>
              <button
                onClick={() => setAnnounced(false)}
                className="absolute right-3 opacity-50 hover:opacity-100 transition-opacity"
                aria-label="Dismiss"
              >
                <Icon d={ICONS.close} className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main header ────────────────────────────────────────── */}
      <header
        className="fixed left-0 right-0 z-40 transition-all duration-300"
        style={{
          top:            announced ? 32 : 0,
          backdropFilter: scrolled ? 'blur(20px) saturate(1.5)' : 'none',
          background:     scrolled ? 'rgba(11,11,11,0.92)' : 'transparent',
          borderBottom:   scrolled ? '1px solid rgba(255,255,255,0.07)' : 'none',
        }}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-1.5 flex-shrink-0 group">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
              </svg>
            </div>
            <span className="font-display font-bold text-lg tracking-wider text-white group-hover:text-white transition-colors">
              INKIFY
            </span>
          </Link>

          {/* Center nav links */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(l => {
              const active = pathname === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'text-white bg-white/8'
                      : 'text-white/70 hover:text-white hover:bg-white/6'
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}

            {/* Design Studio — highlighted */}
            <Link
              to="/customize"
              className="ml-1 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background:  pathname === '/customize' ? 'rgba(107,66,38,0.35)' : 'rgba(107,66,38,0.18)',
                border:      '1px solid rgba(107,66,38,0.35)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(107,66,38,0.28)'}
              onMouseLeave={e => e.currentTarget.style.background = pathname === '/customize' ? 'rgba(107,66,38,0.35)' : 'rgba(107,66,38,0.18)'}
            >
              <svg className="w-3.5 h-3.5 text-[#C9967A]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
              </svg>
              Design Studio
            </Link>
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                {/* Cart icon — always visible when logged in */}
                <Link
                  to="/cart"
                  className="relative p-2.5 rounded-xl transition-all duration-200 text-white/50 hover:text-white hover:bg-white/5"
                >
                  <Icon d={ICONS.cart} className="w-5 h-5" />
                  {count > 0 && (
                    <motion.span
                      key={count}
                      initial={{ scale: 0.6 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1 text-white"
                      style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}
                    >
                      {count > 9 ? '9+' : count}
                    </motion.span>
                  )}
                </Link>

                {/* User dropdown */}
                <div className="relative" ref={dropRef}>
                  <button
                    onClick={() => setDropOpen(!dropOpen)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all duration-200"
                    style={{
                      background:   dropOpen ? 'rgba(107,66,38,0.15)' : 'rgba(255,255,255,0.04)',
                      borderColor:  dropOpen ? 'rgba(107,66,38,0.4)' : 'rgba(255,255,255,0.1)',
                    }}
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="w-6 h-6 rounded-lg object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
                        {initials}
                      </div>
                    )}
                    <span className="text-sm text-white/75 max-w-[96px] truncate">{user.firstName}</span>
                    <Icon d={ICONS.chevron}
                      className={`w-3.5 h-3.5 text-white/30 transition-transform duration-200 ${dropOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {dropOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{   opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 rounded-2xl overflow-hidden"
                        style={{
                          background:    'rgba(13,10,8,0.98)',
                          border:        '1px solid rgba(107,66,38,0.2)',
                          backdropFilter:'blur(20px)',
                          boxShadow:     '0 16px 48px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(107,66,38,0.1)',
                        }}
                      >
                        {/* User info header */}
                        <div className="px-4 py-3 border-b border-white/[0.07]">
                          <p className="text-white text-sm font-medium truncate">{user.firstName} {user.lastName}</p>
                          <p className="text-white/48 text-xs truncate mt-0.5">{user.email}</p>
                        </div>
                        <div className="p-1.5">
                          <DropItem to="/profile"        onClick={close} label="My Profile"    icon={<Icon d={ICONS.user}    />} />
                          <DropItem to="/orders"         onClick={close} label="My Orders"     icon={<Icon d={ICONS.orders}  />} />
                          <DropItem to="/marketplace/my" onClick={close} label="My Designs"    icon={<Icon d={ICONS.designs} />} />
                          <DropItem to="/cart"           onClick={close} label="My Cart"       icon={<Icon d={ICONS.cart}    />} badge={count} />
                          {user.role === 'admin' && (
                            <DropItem to="/admin"        onClick={close} label="Admin Panel"   icon={<Icon d={ICONS.admin}   />} />
                          )}
                          <div className="h-px mx-2 my-1.5" style={{ background: 'rgba(255,255,255,0.07)' }} />
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150"
                            style={{ color: 'rgba(248,113,113,0.7)' }}
                            onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.08)'; e.currentTarget.style.color='rgb(248,113,113)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background=''; e.currentTarget.style.color='rgba(248,113,113,0.7)'; }}
                          >
                            <Icon d={ICONS.logout} />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <Link to="/login"
                  className="px-4 py-2 rounded-lg text-sm text-white/55 hover:text-white transition-colors duration-200">
                  Log in
                </Link>
                <Link to="/signup"
                  className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)', boxShadow: '0 2px 12px rgba(107,66,38,0.3)' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow='0 6px 20px rgba(107,66,38,0.5)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow='0 2px 12px rgba(107,66,38,0.3)'}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile: cart + hamburger */}
          <div className="md:hidden flex items-center gap-1.5">
            {user && (
              <Link to="/cart" className="relative p-2.5 rounded-xl text-white/50 hover:text-white transition-colors">
                <Icon d={ICONS.cart} className="w-5 h-5" />
                {count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                    style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </Link>
            )}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2.5 rounded-xl hover:bg-white/5 transition-colors"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                <motion.span animate={menuOpen ? { rotate: 45, y: 7.5 } : { rotate: 0, y: 0 }} className="block w-full h-0.5 bg-white origin-center transition-all" />
                <motion.span animate={menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }} className="block w-full h-0.5 bg-white origin-center" />
                <motion.span animate={menuOpen ? { rotate: -45, y: -7.5 } : { rotate: 0, y: 0 }} className="block w-full h-0.5 bg-white origin-center transition-all" />
              </div>
            </button>
          </div>
        </nav>

        {/* ── Mobile drawer ─────────────────────────────────────── */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="md:hidden overflow-hidden"
              style={{ background: 'rgba(11,11,11,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="px-4 py-5 space-y-1">
                {NAV_LINKS.map(l => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={close}
                    className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      pathname === l.to ? 'text-white bg-white/8' : 'text-white/55 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {l.label}
                  </Link>
                ))}
                <Link
                  to="/customize"
                  onClick={close}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'rgba(107,66,38,0.18)', border: '1px solid rgba(107,66,38,0.3)' }}
                >
                  <svg className="w-4 h-4 text-[#C9967A]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                  </svg>
                  Design Studio
                </Link>

                <div className="pt-3 mt-2 border-t border-white/10">
                  {user ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-3 px-4 py-3 mb-1">
                        {user.avatar ? (
                          <img src={user.avatar} alt="" className="w-9 h-9 rounded-xl object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
                            {initials}
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-white font-medium">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-white/30 truncate max-w-[200px]">{user.email}</p>
                        </div>
                      </div>
                      {[
                        { to: '/profile',        label: 'My Profile'  },
                        { to: '/orders',         label: 'My Orders'   },
                        { to: '/marketplace/my', label: 'My Designs'  },
                        { to: '/cart',           label: `Cart${count > 0 ? ` (${count})` : ''}` },
                      ].map(item => (
                        <Link key={item.to} to={item.to} onClick={close}
                          className="flex items-center px-4 py-2.5 rounded-xl text-sm text-white/55 hover:text-white hover:bg-white/5 transition-all">
                          {item.label}
                        </Link>
                      ))}
                      {user.role === 'admin' && (
                        <Link to="/admin" onClick={close}
                          className="flex items-center px-4 py-2.5 rounded-xl text-sm text-[#C9967A] hover:text-white hover:bg-white/5 transition-all">
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={() => { handleLogout(); close(); }}
                        className="w-full flex items-center px-4 py-2.5 rounded-xl text-sm text-red-400/60 hover:text-red-400 hover:bg-red-500/5 transition-all">
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 px-1">
                      <Link to="/login"  onClick={close} className="btn-secondary text-center">Log in</Link>
                      <Link to="/signup" onClick={close} className="btn-primary  text-center">Get Started Free</Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
