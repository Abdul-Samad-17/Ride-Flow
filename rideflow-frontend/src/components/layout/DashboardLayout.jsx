import { useState } from 'react';
import { Menu } from 'lucide-react';
import AmbientOrbs from './AmbientOrbs';
import Sidebar from './Sidebar';
import BottomTabBar from './BottomTabBar';

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100%',
        background: 'var(--bg-void)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <AmbientOrbs />

      {/* ── SIDEBAR ─────────────────────────────────────────────── */}
      {/* On mobile: off-canvas drawer (controlled by isSidebarOpen)  */}
      {/* On desktop (lg+): always in-flow via lg:static inside Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* ── RIGHT PANEL ─────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 1,
          overflowX: 'hidden',
        }}
      >
        {/* Mobile-only top header bar */}
        <div
          className="lg:hidden"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            background: 'rgba(5,5,8,0.95)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              color: 'var(--amber-core)',
              fontSize: '1rem',
              letterSpacing: '0.08em',
            }}
          >
            RIDEFLOW
          </span>
          <button
            onClick={() => setIsSidebarOpen(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--amber-core)',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Menu size={22} />
          </button>
        </div>

        {/* Main scrollable content */}
        <main
          style={{
            flex: 1,
            padding: '32px 32px 100px 32px',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
          className="lg:p-10 lg:pb-12"
        >
          {children}
        </main>

        <BottomTabBar />
      </div>
    </div>
  );
}
