import { Link, useLocation } from 'react-router-dom';
import { Home, Car, Map, Wallet, User, BarChart3, Users, Shield, Settings, LayoutDashboard } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const TABS = {
  Rider: [
    { icon: Home,    label: 'Home',    path: '/dashboard/rider' },
    { icon: Car,     label: 'Book',    path: '/dashboard/rider/book' },
    { icon: Map,     label: 'Rides',   path: '/dashboard/rider/rides' },
    { icon: Wallet,  label: 'Wallet',  path: '/dashboard/rider/wallet' },
    { icon: User,    label: 'Profile', path: '/dashboard/rider/profile' },
  ],
  Driver: [
    { icon: Home,    label: 'Home',     path: '/dashboard/driver' },
    { icon: Car,     label: 'Ride',     path: '/dashboard/driver/active' },
    { icon: Map,     label: 'Trips',    path: '/dashboard/driver/trips' },
    { icon: Wallet,  label: 'Earnings', path: '/dashboard/driver/earnings' },
    { icon: User,    label: 'Profile',  path: '/dashboard/driver/profile' },
  ],
  Admin: [
    { icon: LayoutDashboard, label: 'Overview', path: '/dashboard/admin' },
    { icon: Users,           label: 'Users',    path: '/dashboard/admin/users' },
    { icon: Car,             label: 'Rides',    path: '/dashboard/admin/rides' },
    { icon: BarChart3,       label: 'Reports',  path: '/dashboard/admin/reports' },
    { icon: Shield,          label: 'More',     path: '/dashboard/admin/vehicles' }, // 'More' points to vehicles as a catch-all
  ],
};

export default function BottomTabBar() {
  const { role } = useAuthStore();
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
