import { useState } from 'react';
import { Menu } from 'lucide-react';
import AmbientOrbs from './AmbientOrbs';
import Sidebar from './Sidebar';
import BottomTabBar from './BottomTabBar';

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full" style={{ background: 'radial-gradient(circle at top right, rgba(245,166,35,0.03), transparent 40%), var(--bg-void)', position: 'relative' }}>
      <AmbientOrbs />

      {/* Mobile Header — only visible below lg */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 z-30 flex items-center px-5 justify-between"
        style={{ background: 'rgba(5,5,8,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--amber-core)', letterSpacing: '0.08em' }}>
          RIDEFLOW
        </span>
        <button
          onClick={() => setIsSidebarOpen(true)}
          style={{ color: 'var(--amber-core)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px' }}
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar — hidden on mobile (drawer), always visible on lg+ */}
      <div className="hidden lg:block lg:flex-shrink-0" style={{ width: '260px' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh' }}>
          <Sidebar isOpen={false} onClose={() => {}} />
        </div>
      </div>

      {/* Mobile drawer sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main content — min-w-0 prevents flex overflow */}
      <main
        className="flex-1 min-w-0 overflow-x-hidden"
        style={{ paddingTop: 0, position: 'relative', zIndex: 1 }}
      >
        {/* Inner padding — pt accounts for mobile header (h-16=64px), pb accounts for bottom tab bar (h-16=64px) */}
        <div className="px-4 md:px-8 lg:px-12 pt-20 lg:pt-10 pb-28 lg:pb-12">
          {children}
        </div>
      </main>

      <BottomTabBar />
    </div>
  );
}
