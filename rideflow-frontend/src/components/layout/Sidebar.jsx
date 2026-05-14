// src/components/layout/Sidebar.jsx
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, Car, Map, Wallet, User, BarChart3, Users, Settings, 
  LogOut, Zap, Shield, X, History, Navigation, DollarSign, 
  CreditCard, FileText, TrendingUp 
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { api } from '../../services/api';

const NAV_ITEMS = {
  Rider: [
    { icon: Home,    label: 'Book a Ride', path: '/dashboard/rider/book' },
    { icon: Map,     label: 'Ride History', path: '/dashboard/rider/rides' },
    { icon: Wallet,  label: 'My Wallet',    path: '/dashboard/rider/wallet' },
    { icon: User,    label: 'Profile',      path: '/dashboard/rider/profile' },
  ],
  Driver: [
    { icon: Home,    label: 'Overview',     path: '/dashboard/driver/overview' },
    { icon: Car,     label: 'Active Ride',  path: '/dashboard/driver/rides' },
    { icon: Wallet,  label: 'Earnings',     path: '/dashboard/driver/earnings' },
    { icon: User,    label: 'My Profile',   path: '/dashboard/driver/profile' },
  ],
  Admin: [
    { icon: BarChart3, label: 'Analytics',    path: '/dashboard/admin/analytics' },
    { icon: Users,     label: 'Users',        path: '/dashboard/admin/users' },
    { icon: Car,       label: 'Verification', path: '/dashboard/admin/verification' },
    { icon: Shield,    label: 'Fares',        path: '/dashboard/admin/fares' },
    { icon: Wallet,    label: 'Payouts',      path: '/dashboard/admin/payouts' },
    { icon: BarChart3, label: 'Reports',      path: '/dashboard/admin/reports' },
  ],
};

export default function Sidebar({ isOpen, onClose }) {
  const { user, clearAuth } = useAuthStore();
  const role = user?.role;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const items = NAV_ITEMS[role] || [];

  const initials = user?.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch (_) {}
    clearAuth();
    if (onClose) onClose();
    navigate('/');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden" 
          onClick={onClose}
        />
      )}

      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-[260px] transform transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:inset-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          minHeight: '100vh', 
          flexShrink: 0,
          background: 'rgba(10, 10, 15, 1)', // Made solid to prevent overlapping artifacts
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', 
          flexDirection: 'column',
          padding: '24px 16px',
          height: '100vh', 
          overflowY: 'auto',
          zIndex: 100, // Explicitly high
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, padding: '0 8px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={onClose}>
            <Zap size={20} color="var(--amber-core)" fill="var(--amber-core)" />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--amber-core)', letterSpacing: '0.08em' }}>
              RIDEFLOW
            </span>
          </Link>
          <button className="lg:hidden text-white/40" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

      {/* User avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', marginBottom: 24, borderRadius: 12, background: 'rgba(255,255,255,0.04)' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--amber-core), var(--amber-bright))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#0A0A0F', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
        }}>{initials}</div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.full_name || 'User'}
          </div>
          <span className="badge badge-info" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>{role}</span>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map(({ icon: Icon, label, path }) => {
          const isActive = pathname === path || (path !== '/dashboard/admin' && path !== '/dashboard/rider' && path !== '/dashboard/driver' && pathname.startsWith(path));
          return (
            <motion.div key={path} whileHover={{ x: 2 }}>
              <Link to={path} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 14px', borderRadius: 12,
                color: isActive ? 'var(--amber-core)' : 'var(--text-secondary)',
                background: isActive ? 'rgba(245,166,35,0.08)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--amber-core)' : '2px solid transparent',
                fontWeight: isActive ? 600 : 400,
                fontSize: '0.9rem',
                transition: 'all 0.15s',
              }}>
                <Icon size={18} />
                {label}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Logout */}
      <button onClick={handleLogout} style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 14px', borderRadius: 12, border: 'none',
        background: 'rgba(239,68,68,0.06)', color: '#EF4444',
        fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', marginTop: 8,
        transition: 'background 0.2s',
      }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}>
        <LogOut size={18} />
        Logout
      </button>
      </aside>
    </>
  );
}
