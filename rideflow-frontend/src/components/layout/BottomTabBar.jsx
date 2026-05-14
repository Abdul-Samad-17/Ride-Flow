import { Link, useLocation } from 'react-router-dom';
import { Home, Car, Map, Wallet, User, BarChart3, Users, Shield, Settings, LayoutDashboard, Navigation, CreditCard } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const TABS = {
  Rider: [
    { icon: Car,     label: 'Book',    path: '/dashboard/rider/book' },
    { icon: Map,     label: 'History', path: '/dashboard/rider/rides' },
    { icon: Wallet,  label: 'Wallet',  path: '/dashboard/rider/wallet' },
    { icon: User,    label: 'Profile', path: '/dashboard/rider/profile' },
  ],
  Driver: [
    { icon: Home,    label: 'Overview', path: '/dashboard/driver/overview' },
    { icon: Navigation, label: 'Ride',     path: '/dashboard/driver/rides' },
    { icon: Wallet,  label: 'Earnings', path: '/dashboard/driver/earnings' },
    { icon: User,    label: 'Profile',  path: '/dashboard/driver/profile' },
  ],
  Admin: [
    { icon: BarChart3, label: 'Analytics', path: '/dashboard/admin/analytics' },
    { icon: Users,     label: 'Users',     path: '/dashboard/admin/users' },
    { icon: Shield,    label: 'Verify',    path: '/dashboard/admin/verification' },
    { icon: CreditCard,label: 'Payouts',   path: '/dashboard/admin/payouts' },
    { icon: BarChart3, label: 'Reports',   path: '/dashboard/admin/reports' },
  ],
};

export default function BottomTabBar() {
  const user = useAuthStore(state => state.state?.user || state.user);
  const role = user?.role;
  const { pathname } = useLocation();
  const tabs = TABS[role] || [];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-[#0A0A0F]/95 backdrop-blur-md border-t border-white/10 z-40 flex justify-around items-center lg:hidden">
      {tabs.map(({ icon: Icon, label, path }) => {
        const isActive = pathname === path;
        return (
          <Link 
            key={path} 
            to={path}
            className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] gap-1 transition-colors"
          >
            <Icon 
              size={22} 
              className={isActive ? 'text-[var(--amber-core)]' : 'text-[var(--text-muted)]'} 
            />
            <span 
              className={`text-[10px] font-medium ${isActive ? 'text-[var(--amber-core)]' : 'text-[var(--text-muted)]'}`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
