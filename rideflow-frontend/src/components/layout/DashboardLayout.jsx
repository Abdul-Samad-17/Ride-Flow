import { useState } from 'react';
import { Menu } from 'lucide-react';
import AmbientOrbs from './AmbientOrbs';
import Sidebar from './Sidebar';
import BottomTabBar from './BottomTabBar';

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-void)', position: 'relative' }}>
      <AmbientOrbs />
      
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#050508]/80 backdrop-blur-md border-b border-white/5 z-30 flex items-center px-6 justify-between">
        <div className="flex items-center gap-2">
          <span className="font-display text-amber-core font-bold tracking-wider">RIDEFLOW</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 -mr-2 text-amber-core"
        >
          <Menu size={24} />
        </button>
      </div>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 pb-20 lg:pb-0 pt-16 lg:pt-0" style={{ padding: '32px 40px', position: 'relative', zIndex: 1, overflowY: 'auto' }}>
        {children}
      </main>

      <BottomTabBar />
    </div>
  );
}
