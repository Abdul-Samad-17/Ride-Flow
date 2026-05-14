import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../store/authStore';
import * as authService from '../../services/authService';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handle);
    return () => window.removeEventListener('scroll', handle);
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      clearAuth();
      setIsMenuOpen(false);
      navigate('/login');
    }
  };

  const getDashboardPath = () => {
    if (user?.role === 'Admin') return '/dashboard/admin';
    if (user?.role === 'Driver') return '/dashboard/driver';
    return '/dashboard/rider';
  };

  const navLinks = ['Experience', 'Fleet', 'Membership', 'Support'];

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      height: '80px',
      display: 'flex',
      alignItems: 'center',
      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      background: scrolled ? 'rgba(5, 5, 8, 0.9)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: 'none'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '1800px' }}>
        
        <Link to="/" style={{ textDecoration: 'none' }} onClick={() => setIsMenuOpen(false)}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: 800, color: '#F0EDE8', letterSpacing: '0.15em' }}>RIDEFLOW</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex" style={{ gap: '56px', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          {navLinks.map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '11px', fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'var(--amber-core)'} onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>
              {item}
            </a>
          ))}
        </div>

        {/* Desktop Buttons */}
        <div className="hidden lg:flex" style={{ alignItems: 'center', gap: '32px' }}>
          {!isAuthenticated ? (
            <>
              <Link to="/login" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em' }}>SIGN IN</Link>
              <button className="btn-primary" style={{ padding: '12px 36px', fontSize: '11px' }} onClick={() => navigate('/register')}>GET STARTED</button>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <button className="btn-secondary" style={{ padding: '10px 24px', fontSize: '11px' }} onClick={() => navigate(getDashboardPath())}>DASHBOARD</button>
              <button className="btn-primary" style={{ padding: '10px 24px', fontSize: '11px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)' }} onClick={handleLogout}>LOGOUT</button>
            </div>
          )}
        </div>

        {/* Hamburger Icon */}
        <button 
          className="lg:hidden" 
          onClick={() => setIsMenuOpen(true)}
          style={{ background: 'none', border: 'none', color: 'var(--amber-core)', cursor: 'pointer', padding: '10px' }}
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Overlay Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1001,
              background: 'rgba(5, 5, 8, 0.97)',
              backdropFilter: 'blur(20px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '32px'
            }}
          >
            {/* Close Button */}
            <button 
              onClick={() => setIsMenuOpen(false)}
              style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '10px' }}
            >
              <X size={32} />
            </button>

            {/* Logo in Overlay */}
            <Link to="/" style={{ textDecoration: 'none', marginBottom: '16px' }} onClick={() => setIsMenuOpen(false)}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: 800, color: '#F0EDE8', letterSpacing: '0.15em' }}>RIDEFLOW</span>
            </Link>

            {/* Vertical Links */}
            {navLinks.map(item => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`} 
                onClick={() => setIsMenuOpen(false)}
                style={{ color: 'var(--text-primary)', textDecoration: 'none', fontSize: '24px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}
              >
                {item}
              </a>
            ))}

            {/* Action Buttons in Overlay */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '280px', marginTop: '16px' }}>
              {!isAuthenticated ? (
                <>
                  <button className="btn-primary w-full" style={{ height: '54px' }} onClick={() => { setIsMenuOpen(false); navigate('/register'); }}>GET STARTED</button>
                  <button className="btn-secondary w-full" style={{ height: '54px' }} onClick={() => { setIsMenuOpen(false); navigate('/login'); }}>SIGN IN</button>
                </>
              ) : (
                <>
                  <button className="btn-primary w-full" style={{ height: '54px' }} onClick={() => { setIsMenuOpen(false); navigate(getDashboardPath()); }}>DASHBOARD</button>
                  <button className="btn-secondary w-full" style={{ height: '54px' }} onClick={handleLogout}>LOGOUT</button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
