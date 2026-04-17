import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../shared/hooks/useAuthContext';
import { useCart } from '../../../shared/context/CartContext';

const NavLink = ({ to, children, onClick }) => {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link to={to} onClick={onClick}
      className={`text-sm font-medium transition-colors duration-200 ${active ? 'text-white' : 'text-white/50 hover:text-white/80'}`}>
      {children}
    </Link>
  );
};

const DropItem = ({ to, icon, label, onClick }) => (
  <Link to={to} onClick={onClick}
    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-white/65 hover:text-white hover:bg-white/5 transition-all duration-150">
    <span className="text-white/30 w-4 h-4 flex items-center justify-center">{icon}</span>
    {label}
  </Link>
);

/* ── SVG Icons ──────────────────────────────────────────────── */
const ProfileIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);
const OrderIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
  </svg>
);
const DesignIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
  </svg>
);
const CartIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
  </svg>
);
const AdminIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
  </svg>
);

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const { user, logout }        = useAuth();
  const { count }               = useCart();
  const navigate                = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!dropOpen) return;
    const close = (e) => { if (!e.target.closest('[data-dropdown]')) setDropOpen(false); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [dropOpen]);

  const handleLogout = () => { logout(); setMenuOpen(false); setDropOpen(false); navigate('/'); };
  const close = () => { setMenuOpen(false); setDropOpen(false); };

  const initials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() : '';

  const publicLinks = [
    { to: '/',            label: 'Home'     },
    { to: '/designs',     label: 'Shirts'   },
    { to: '/marketplace', label: 'Designs'  },
    { to: '/reviews',     label: 'Reviews'  },
    { to: '/blog',        label: 'Blog'     },
    { to: '/faq',         label: 'FAQ'      },
    { to: '/about',       label: 'About'    },
    { to: '/contact',     label: 'Contact'  },
  ];

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        background:     scrolled ? 'rgba(11,11,11,0.88)' : 'transparent',
        borderBottom:   scrolled ? '1px solid rgba(255,255,255,0.07)' : 'none',
      }}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5 flex-shrink-0">
          <span className="font-display font-bold text-lg tracking-widest text-white">INKIFY</span>
          <span className="font-display font-light text-lg tracking-widest text-ink-brown">PRINTING</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden lg:flex items-center gap-6">
          {publicLinks.map(l => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}
        </div>

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {count > 0 && (
                <Link to="/cart" className="relative p-2 text-white/50 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
                  </svg>
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                    style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
                    {count > 9 ? '9+' : count}
                  </span>
                </Link>
              )}

              {/* User dropdown */}
              <div className="relative" data-dropdown onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => setDropOpen(!dropOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  {user.avatar
                    ? <img src={user.avatar} alt="" className="w-6 h-6 rounded-lg object-cover" />
                    : <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>{initials}</div>
                  }
                  <span className="text-sm text-white/70 max-w-[96px] truncate">{user.firstName}</span>
                  <svg className={`w-3.5 h-3.5 text-white/30 transition-transform duration-200 ${dropOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                <AnimatePresence>
                  {dropOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{   opacity: 0, y: 8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-52 rounded-2xl overflow-hidden"
                      style={{ background: 'rgba(13,10,8,0.98)', border: '1px solid rgba(107,66,38,0.2)', backdropFilter: 'blur(20px)', boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}
                    >
                      <div className="p-1.5">
                        <DropItem to="/profile"         onClick={close} label="My Profile"    icon={<ProfileIcon />} />
                        <DropItem to="/orders"          onClick={close} label="My Orders"     icon={<OrderIcon />}   />
                        <DropItem to="/marketplace/my"  onClick={close} label="My Designs"    icon={<DesignIcon />}  />
                        <DropItem to="/cart"            onClick={close} label={`Cart${count > 0 ? ` (${count})` : ''}`} icon={<CartIcon />} />
                        {user.role === 'admin' && (
                          <DropItem to="/admin" onClick={close} label="Admin Panel" icon={<AdminIcon />} />
                        )}
                        <div className="h-px mx-2 my-1" style={{ background: 'rgba(255,255,255,0.07)' }} />
                        <button onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-400/65 hover:text-red-400 hover:bg-red-500/5 transition-all duration-150">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                          </svg>
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              <Link to="/login"  className="text-sm text-white/55 hover:text-white transition-colors duration-200">Login</Link>
              <Link to="/signup" className="text-sm px-5 py-2 rounded-lg font-medium text-white transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile: cart + hamburger */}
        <div className="lg:hidden flex items-center gap-2">
          {user && count > 0 && (
            <Link to="/cart" className="relative p-2 text-white/50 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>
                {count > 9 ? '9+' : count}
              </span>
            </Link>
          )}
          <button onClick={() => setMenuOpen(!menuOpen)} className="flex flex-col gap-1.5 p-2 rounded-lg hover:bg-white/5 transition-colors" aria-label="Menu">
            <motion.span animate={menuOpen ? { rotate: 45,  y: 7 }  : { rotate: 0, y: 0 }} className="block w-5 h-0.5 bg-white origin-center" />
            <motion.span animate={menuOpen ? { opacity: 0 }         : { opacity: 1 }}       className="block w-5 h-0.5 bg-white" />
            <motion.span animate={menuOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }} className="block w-5 h-0.5 bg-white origin-center" />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{   opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden overflow-hidden"
            style={{ background: 'rgba(11,11,11,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="px-4 py-6 flex flex-col gap-4">
              {publicLinks.map(l => <NavLink key={l.to} to={l.to} onClick={close}>{l.label}</NavLink>)}

              <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 mb-1">
                      {user.avatar
                        ? <img src={user.avatar} alt="" className="w-9 h-9 rounded-xl object-cover" />
                        : <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg,#6B4226,#8B5A3C)' }}>{initials}</div>
                      }
                      <div>
                        <p className="text-sm text-white font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-white/30 truncate max-w-[200px]">{user.email}</p>
                      </div>
                    </div>
                    <Link to="/profile"        onClick={close} className="text-sm text-white/55 hover:text-white transition-colors py-0.5">My Profile</Link>
                    <Link to="/orders"         onClick={close} className="text-sm text-white/55 hover:text-white transition-colors py-0.5">My Orders</Link>
                    <Link to="/marketplace/my" onClick={close} className="text-sm text-white/55 hover:text-white transition-colors py-0.5">My Designs</Link>
                    <Link to="/cart"           onClick={close} className="text-sm text-white/55 hover:text-white transition-colors py-0.5">
                      Cart{count > 0 ? ` (${count})` : ''}
                    </Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" onClick={close} className="text-sm text-ink-brown-light hover:text-white transition-colors py-0.5">Admin Panel</Link>
                    )}
                    <button onClick={handleLogout} className="mt-1 text-sm text-red-400/60 hover:text-red-400 transition-colors text-left">Logout</button>
                  </>
                ) : (
                  <>
                    <Link to="/login"  onClick={close} className="btn-secondary text-center">Login</Link>
                    <Link to="/signup" onClick={close} className="btn-primary  text-center">Sign Up</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
