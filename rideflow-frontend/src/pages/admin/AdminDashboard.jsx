import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Car, Shield, DollarSign, TrendingUp, AlertCircle, CheckCircle, 
  Settings, LogOut, Zap, Bell, Search, Filter, Activity, X, UserMinus, 
  UserCheck, MoreVertical, Edit3, Save, Info, Ban, Clock, FileText, Download,
  Navigation, CreditCard, ChevronRight
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

import useAuthStore from '../../store/authStore';
import * as authService from '../../services/authService';
import * as adminService from '../../services/adminService';
import * as vehicleService from '../../services/vehicleService';
import * as walletService from '../../services/walletService';
import { GlassCard, Badge, Spinner, Input, Button, RatingStars, EmptyState } from '../../components/ui';
import { useApi } from '../../hooks/useApi';
import { exportToCSV } from '../../utils/exportCSV';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('analytics');
  const [stats, setStats] = useState({});
  const [pendingVehicles, setPendingVehicles] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [fareConfigs, setFareConfigs] = useState([]);
  const { user, clearAuth } = useAuthStore();
  const { loading, execute } = useApi();
  const { pathname } = useLocation();

  // Sync activeTab with URL
  useEffect(() => {
    const segments = pathname.split('/');
    const path = segments[segments.length - 1];
    const tabMap = { 'analytics': 'analytics', 'verification': 'verification', 'users': 'users', 'fares': 'fares', 'payouts': 'payouts', 'reports': 'reports' };
    if (tabMap[path]) {
      setActiveTab(tabMap[path]);
    } else if (pathname === '/dashboard/admin') {
      setActiveTab('analytics');
    }
  }, [pathname]);

  const fetchOverview = useCallback(async () => {
    const res = await adminService.getOverviewStats().catch(() => null);
    if (res) setStats(res.data);
  }, []);

  const fetchPendingVehicles = useCallback(async () => {
    const res = await vehicleService.getPendingVehicles().catch(() => null);
    if (res) setPendingVehicles(res.data);
  }, []);

  const fetchUsers = useCallback(async (filters = {}) => {
    const res = await adminService.getUsers(filters).catch(() => null);
    if (res) setUsersList(res.data);
  }, []);

  const fetchFares = useCallback(async () => {
    const res = await adminService.getFareConfigs().catch(() => null);
    if (res) setFareConfigs(res.data);
  }, []);

  useEffect(() => {
    fetchOverview();
    if (activeTab === 'verification') fetchPendingVehicles();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'fares') fetchFares();
    
    const interval = setInterval(fetchOverview, 30000);
    return () => clearInterval(interval);
  }, [activeTab, fetchOverview, fetchPendingVehicles, fetchUsers, fetchFares]);

  return (
    <DashboardLayout>
      <div className="w-full pb-24">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-20">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">System Admin</h1>
            <p className="text-[var(--text-muted)] text-sm md:text-base">
              Live system oversight • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            {stats.pending_vehicles > 0 && <Badge status="Warning" pulse>{stats.pending_vehicles} Verifications</Badge>}
            {stats.pending_payouts > 0 && <Badge status="Error">{stats.pending_payouts} Payouts</Badge>}
            <button className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 text-[var(--text-primary)] flex items-center justify-center hover:bg-white/10 transition-colors">
              <Bell size={22} />
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'analytics' && <AnalyticsTab key="analytics" stats={stats} />}
          {activeTab === 'verification' && <VerificationTab key="verification" queue={pendingVehicles} onAction={fetchPendingVehicles} />}
          {activeTab === 'users' && <UsersTab key="users" users={usersList} onAction={fetchUsers} />}
          {activeTab === 'fares' && <FareTab key="fares" configs={fareConfigs} onAction={fetchFares} />}
          {activeTab === 'payouts' && <AdminPayoutsTab key="payouts" />}
          {activeTab === 'reports' && <ReportsTab key="reports" />}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

function AnalyticsTab({ stats }) {
  const kpis = [
    { label: 'Revenue (Today)', value: `PKR ${parseFloat(stats.revenue_today || 0).toLocaleString()}`, icon: DollarSign, color: 'var(--amber-core)' },
    { label: 'Rides (Today)', value: stats.rides_today || 0, icon: Car, color: 'var(--text-primary)' },
    { label: 'Captains Online', value: stats.online_drivers || 0, icon: Zap, color: '#22C55E' },
    { label: 'Low Ratings', value: stats.low_rated_drivers || 0, icon: AlertCircle, color: '#EF4444' }
  ];

  const subKpis = [
    { label: 'Total Riders', value: stats.total_riders || 0, icon: Users },
    { label: 'Total Drivers', value: stats.total_drivers || 0, icon: Shield },
    { label: 'Restricted Users', value: stats.restricted_users || 0, icon: UserMinus },
    { label: 'Pending Payouts', value: stats.pending_payouts || 0, icon: DollarSign }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {kpis.map((kpi, i) => (
          <GlassCard key={i} level={1} className="p-8 border-l-4" style={{ borderLeftColor: kpi.color }}>
            <div className="flex justify-between items-center mb-6">
              <p className="label-caps text-[10px] tracking-widest">{kpi.label}</p>
              <kpi.icon size={18} color={kpi.color} />
            </div>
            <div className="text-3xl font-black font-mono">{kpi.value}</div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-10">
        <GlassCard level={2} className="p-10 min-h-[500px]">
          <h3 className="text-xl font-bold mb-8">Network Activity</h3>
          <div className="flex-1 min-h-[300px] flex items-center justify-center bg-white/5 rounded-3xl border border-dashed border-white/10">
            <p className="text-[var(--text-muted)] text-sm">Heatmap Visualization Stream Active</p>
          </div>
        </GlassCard>

        <GlassCard level={2} className="p-8">
          <h4 className="label-caps text-[10px] mb-8">System Health</h4>
          <div className="flex flex-col gap-6">
            {subKpis.map((kpi, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                    <kpi.icon size={16} className="text-[var(--text-muted)]" />
                  </div>
                  <span className="text-sm font-medium text-[var(--text-secondary)]">{kpi.label}</span>
                </div>
                <span className="text-base font-black font-mono">{kpi.value}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </motion.div>
  );
}

function ReportsTab() {
  const [activeReport, setActiveReport] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dates, setDates] = useState({ 
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const reports = [
    { id: 'revenue-day', title: 'Daily Revenue', desc: 'Performance over time', icon: TrendingUp, type: 'line', service: adminService.getRevenueByDay },
    { id: 'revenue-city', title: 'By City', desc: 'Market analysis', icon: Navigation, type: 'bar', service: adminService.getRevenueByCity },
    { id: 'revenue-method', title: 'Payments', desc: 'Payment distribution', icon: CreditCard, type: 'pie', service: adminService.getRevenueByMethod },
    { id: 'driver-earnings', title: 'Earnings', desc: 'Top captains', icon: DollarSign, type: 'bar', service: adminService.getDriverEarnings },
    { id: 'trip-counts', title: 'Density', desc: 'Rides per driver', icon: Car, type: 'bar', service: adminService.getTripCounts },
    { id: 'promo-usage', title: 'Promos', desc: 'Effectiveness', icon: Zap, type: 'bar', service: adminService.getPromoUsage },
    { id: 'low-rated', title: 'Quality', desc: 'Audit drivers', icon: AlertCircle, type: 'table', service: adminService.getLowRatedDrivers },
    { id: 'full-trips', title: 'Trips', desc: 'Lifecycle audit', icon: Info, type: 'table', service: adminService.getFullTripReport },
  ];

  const handleRunReport = async (report) => {
    setActiveReport(report);
    setLoading(true);
    try {
      const res = await report.service(dates);
      setData(res.data);
    } catch (e) {
      toast.error("Failed to fetch report data");
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#FFBF00', '#D49F00', '#FFD700', '#B8860B', '#E6B800'];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex flex-col sm:flex-row gap-4 mb-10">
        <Input type="date" label="From Date" value={dates.from} onChange={e => setDates(p => ({ ...p, from: e.target.value }))} className="flex-1" />
        <Input type="date" label="To Date" value={dates.to} onChange={e => setDates(p => ({ ...p, to: e.target.value }))} className="flex-1" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {reports.map(r => (
          <GlassCard 
            key={r.id} 
            level={2} 
            onClick={() => handleRunReport(r)} 
            className={`p-6 cursor-pointer border transition-all duration-300 ${
              activeReport?.id === r.id ? 'border-[var(--amber-core)] bg-amber-ghost/20' : 'border-white/5 hover:border-white/10'
            }`}
          >
            <r.icon size={20} className={`mb-4 ${activeReport?.id === r.id ? 'text-[var(--amber-core)]' : 'text-[var(--text-muted)]'}`} />
            <h4 className="text-sm font-bold mb-1">{r.title}</h4>
            <p className="text-[10px] text-[var(--text-muted)] leading-tight">{r.desc}</p>
          </GlassCard>
        ))}
      </div>

      {loading && <div className="py-20 text-center"><Spinner size={40} /></div>}

      {!data && !loading && (
        <EmptyState 
          icon={TrendingUp} 
          title="Intelligence Ready" 
          subtitle="Select a module above to generate real-time system analytics." 
        />
      )}

      {data && !loading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard level={3} className="p-8 md:p-12 mb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
              <h3 className="text-2xl font-bold">{activeReport.title} Analysis</h3>
              <Button variant="ghost" onClick={() => exportToCSV(data, activeReport.id)} className="bg-white/5">
                <Download size={16} className="mr-2" /> Export Dataset
              </Button>
            </div>

            <div className="h-[400px] mb-12 bg-black/20 rounded-3xl p-6 border border-white/5">
              <ResponsiveContainer width="100%" height="100%">
                {activeReport.type === 'line' ? (
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} />
                    <YAxis stroke="var(--text-muted)" fontSize={10} />
                    <Tooltip contentStyle={{ background: 'var(--bg-deep)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="var(--amber-core)" strokeWidth={4} dot={{ r: 5, fill: 'var(--amber-core)', strokeWidth: 0 }} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="discounts" stroke="#EF4444" strokeWidth={2} dot={false} />
                  </LineChart>
                ) : activeReport.type === 'bar' ? (
                  <BarChart data={data} layout={activeReport.id === 'revenue-city' ? 'vertical' : 'horizontal'}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    {activeReport.id === 'revenue-city' ? (
                      <>
                        <XAxis type="number" stroke="var(--text-muted)" fontSize={10} />
                        <YAxis type="category" dataKey="city" stroke="var(--text-muted)" fontSize={10} width={80} />
                      </>
                    ) : (
                      <>
                        <XAxis dataKey={activeReport.id === 'promo-usage' ? 'promo_code' : 'full_name'} stroke="var(--text-muted)" fontSize={10} />
                        <YAxis stroke="var(--text-muted)" fontSize={10} />
                      </>
                    )}
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ background: 'var(--bg-deep)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                    <Bar dataKey={activeReport.id === 'trip-counts' ? 'trip_count' : activeReport.id === 'promo-usage' ? 'usage_count' : 'revenue' || 'earnings'} fill="var(--amber-core)" radius={activeReport.id === 'revenue-city' ? [0, 6, 6, 0] : [6, 6, 0, 0]} />
                  </BarChart>
                ) : activeReport.type === 'pie' ? (
                  <PieChart>
                    <Pie data={data} innerRadius="60%" outerRadius="80%" paddingAngle={5} dataKey="revenue" nameKey="payment_method" label>
                      {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-deep)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] gap-4 opacity-30">
                    <FileText size={64} />
                    <p className="font-bold uppercase tracking-widest text-xs">Tabular Audit Active</p>
                  </div>
                )}
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/5">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="text-left bg-white/5 border-b border-white/5">
                    {Object.keys(data[0]).map(k => (
                      <th key={k} className="p-5 text-[var(--text-muted)] uppercase tracking-widest font-bold whitespace-nowrap">
                        {k.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.slice(0, 100).map((row, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      {Object.values(row).map((v, j) => (
                        <td key={j} className="p-5 whitespace-nowrap">
                          {v === null ? '—' : String(v)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.length > 100 && (
                <div className="p-4 text-center text-[var(--text-muted)] border-t border-white/5">
                  Showing top 100 results. Export for full dataset.
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>
      )}
    </motion.div>
  );
}

function UsersTab({ users, onAction }) {
  const [filters, setFilters] = useState({ role: 'All', status: 'All', search: '' });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalMode, setModalMode] = useState(null);
  const [reason, setReason] = useState('');
  const { loading, execute } = useApi();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search), 400);
    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    onAction({ ...filters, search: debouncedSearch });
  }, [debouncedSearch, filters.role, filters.status, onAction]);

  const handleUpdateStatus = async (newStatus) => {
    if (!reason && newStatus !== 'Active') return toast.error("Reason is required");
    await execute(() => adminService.updateUserStatus(selectedUser.user_id, newStatus, reason), {
      successMessage: "User status updated",
      onSuccess: () => {
        setSelectedUser(null);
        setModalMode(null);
        setReason('');
        onAction(filters);
      }
    });
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <div className="flex flex-col lg:flex-row gap-4 mb-10">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input 
            type="text" placeholder="Search identity..." 
            className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-xl text-white outline-none focus:border-[var(--amber-core)] transition-colors"
            value={filters.search} onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
          />
        </div>
        <div className="flex gap-4">
          <select 
            className="bg-white/5 border border-white/10 px-6 py-4 rounded-xl text-white outline-none"
            value={filters.role} onChange={e => setFilters(p => ({ ...p, role: e.target.value }))}
          >
            <option value="All">All Roles</option>
            <option value="Rider" className="bg-[#050508]">Riders</option>
            <option value="Driver" className="bg-[#050508]">Drivers</option>
            <option value="Admin" className="bg-[#050508]">Admins</option>
          </select>
          <select 
            className="bg-white/5 border border-white/10 px-6 py-4 rounded-xl text-white outline-none"
            value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}
          >
            <option value="All">All Status</option>
            <option value="Active" className="bg-[#050508]">Active</option>
            <option value="Suspended" className="bg-[#050508]">Suspended</option>
            <option value="Banned" className="bg-[#050508]">Banned</option>
          </select>
        </div>
      </div>

      <div className="hidden lg:block">
        <GlassCard level={2} className="overflow-hidden min-h-[600px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="p-6 text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest">User Identity</th>
                <th className="p-6 text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest">Access Level</th>
                <th className="p-6 text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest">Account State</th>
                <th className="p-6 text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest">Performance</th>
                <th className="p-6 text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map(u => (
                <tr key={u.user_id} className="hover:bg-white/[0.01]">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-black ${
                        u.role === 'Admin' ? 'bg-red-500' : u.role === 'Driver' ? 'bg-[var(--amber-core)]' : 'bg-blue-500'
                      }`}>
                        {u.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold">{u.full_name}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <Badge status={u.role === 'Admin' ? 'Error' : u.role === 'Driver' ? 'Active' : 'Info'}>{u.role}</Badge>
                  </td>
                  <td className="p-6">
                    <Badge status={u.account_status === 'Active' ? 'Active' : u.account_status === 'Suspended' ? 'Warning' : 'Error'}>{u.account_status}</Badge>
                  </td>
                  <td className="p-6">
                    {u.role === 'Driver' ? (
                      <div className="flex flex-col gap-1">
                        <RatingStars value={u.driver_rating || 5} size="sm" />
                        <span className="text-[10px] text-[var(--text-muted)]">{u.total_trips || 0} trips completed</span>
                      </div>
                    ) : '—'}
                  </td>
                  <td className="p-6">
                    {u.role !== 'Admin' && (
                      <div className="flex gap-4">
                        {u.account_status !== 'Active' && (
                          <button onClick={() => { setSelectedUser(u); handleUpdateStatus('Active'); }} className="text-green-500 hover:scale-110 transition-transform"><UserCheck size={18} /></button>
                        )}
                        {u.account_status === 'Active' && (
                          <button onClick={() => { setSelectedUser(u); setModalMode('suspend'); }} className="text-[var(--amber-core)] hover:scale-110 transition-transform"><UserMinus size={18} /></button>
                        )}
                        <button onClick={() => { setSelectedUser(u); setModalMode('ban'); }} className="text-red-500 hover:scale-110 transition-transform"><Ban size={18} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      </div>

      {/* Mobile Card List */}
      <div className="lg:hidden flex flex-col gap-4">
        {users.map(u => (
          <GlassCard key={u.user_id} level={2} className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-black ${
                  u.role === 'Admin' ? 'bg-red-500' : u.role === 'Driver' ? 'bg-[var(--amber-core)]' : 'bg-blue-500'
                }`}>
                  {u.full_name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold">{u.full_name}</h4>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono">{u.email}</p>
                </div>
              </div>
              <Badge status={u.account_status === 'Active' ? 'Active' : 'Error'}>{u.account_status}</Badge>
            </div>
            <div className="flex justify-between items-center py-4 border-y border-white/5 mb-6">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-[var(--text-muted)] uppercase font-bold tracking-widest">Role</span>
                <span className="text-sm font-bold">{u.role}</span>
              </div>
              {u.role === 'Driver' && (
                <div className="text-right flex flex-col gap-1">
                  <span className="text-[9px] text-[var(--text-muted)] uppercase font-bold tracking-widest">Performance</span>
                  <RatingStars value={u.driver_rating || 5} size="sm" />
                </div>
              )}
            </div>
            {u.role !== 'Admin' && (
              <div className="grid grid-cols-3 gap-2">
                {u.account_status !== 'Active' ? (
                  <Button size="sm" className="col-span-3 font-bold" onClick={() => { setSelectedUser(u); handleUpdateStatus('Active'); }}>Activate</Button>
                ) : (
                  <>
                    <Button size="sm" variant="secondary" className="col-span-2 font-bold" onClick={() => { setSelectedUser(u); setModalMode('suspend'); }}>Suspend</Button>
                    <Button size="sm" variant="ghost" className="text-red-500 bg-red-500/10 font-bold" onClick={() => { setSelectedUser(u); setModalMode('ban'); }}>Ban</Button>
                  </>
                )}
              </div>
            )}
          </GlassCard>
        ))}
      </div>

      <AnimatePresence>
        {(modalMode === 'suspend' || modalMode === 'ban') && (
          <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} className="w-full max-w-md bg-[var(--bg-deep)] rounded-t-[32px] sm:rounded-[32px] border-t sm:border border-white/10 p-8 md:p-12">
              <h3 className={`text-2xl font-bold mb-2 ${modalMode === 'ban' ? 'text-red-500' : 'text-white'}`}>
                {modalMode === 'ban' ? 'System Ban' : 'Account Suspension'}
              </h3>
              <p className="text-[var(--text-muted)] text-sm mb-10">Target: <span className="text-white font-bold">{selectedUser?.full_name}</span></p>
              
              <textarea 
                placeholder="Detailed reason for this directive..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-sm h-32 resize-none mb-10 focus:border-[var(--amber-core)] outline-none"
                value={reason} onChange={e => setReason(e.target.value)}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <Button variant="ghost" className="bg-white/5" onClick={() => { setModalMode(null); setReason(''); }}>Cancel</Button>
                <Button variant={modalMode === 'ban' ? 'error' : 'primary'} onClick={() => handleUpdateStatus(modalMode === 'ban' ? 'Banned' : 'Suspended')}>
                  Confirm
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FareTab({ configs, onAction }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const { loading, execute } = useApi();

  const handleEdit = (conf) => {
    setEditing(conf.vehicle_type);
    setForm(conf);
  };

  const handleSave = async () => {
    await execute(() => adminService.updateFareConfig(editing, form), {
      successMessage: "Rates updated",
      onSuccess: () => {
        setEditing(null);
        onAction();
      }
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {configs.map(conf => {
          const isEditing = editing === conf.vehicle_type;
          const current = isEditing ? form : conf;
          const sampleDist = 10;
          const sampleTime = 20;
          const samplePrice = parseFloat(current.base_rate) + (sampleDist * parseFloat(current.per_km_rate)) + (sampleTime * parseFloat(current.per_min_rate));

          return (
            <GlassCard key={conf.vehicle_type} level={2} className="p-8 border border-white/5">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-white">{conf.vehicle_type}</h3>
                <div className="w-12 h-12 rounded-2xl bg-amber-ghost flex items-center justify-center text-[var(--amber-core)]">
                  {conf.vehicle_type === 'Bike' ? <Zap size={24} /> : <Car size={24} />}
                </div>
              </div>

              <div className="flex flex-col gap-5 mb-10">
                <RateField label="Base Connection" value={current.base_rate} editing={isEditing} onChange={v => setForm(p => ({ ...p, base_rate: v }))} />
                <RateField label="Per KM Kinetic" value={current.per_km_rate} editing={isEditing} onChange={v => setForm(p => ({ ...p, per_km_rate: v }))} />
                <RateField label="Per Min Temporal" value={current.per_min_rate} editing={isEditing} onChange={v => setForm(p => ({ ...p, per_min_rate: v }))} />
                <RateField label="Surge Multiplier" value={current.surge_multiplier} editing={isEditing} onChange={v => setForm(p => ({ ...p, surge_multiplier: v }))} suffix="x" />
                <RateField label="System Comm." value={(current.commission_rate * 100).toFixed(0)} editing={isEditing} onChange={v => setForm(p => ({ ...p, commission_rate: v / 100 }))} suffix="%" />
              </div>

              <div className="p-6 bg-white/[0.02] rounded-2xl border border-white/5 mb-10">
                <p className="label-caps text-[9px] mb-2 tracking-widest">Sample Simulation</p>
                <div className="text-[11px] text-[var(--text-muted)] mb-1">10km / 20min journey</div>
                <div className="text-2xl font-black text-[var(--amber-core)] font-mono">PKR {samplePrice.toFixed(2)}</div>
              </div>

              {isEditing ? (
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="ghost" className="bg-white/5" onClick={() => setEditing(null)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={loading}>{loading ? <Spinner size={18} /> : 'Publish'}</Button>
                </div>
              ) : (
                <Button variant="secondary" className="w-full py-4 font-bold" onClick={() => handleEdit(conf)}>
                  <Edit3 size={16} className="mr-2" /> Adjust Algorithm
                </Button>
              )}
            </GlassCard>
          );
        })}
      </div>
    </motion.div>
  );
}

function RateField({ label, value, editing, onChange, suffix = 'PKR' }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/5">
      <span className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wider">{label}</span>
      {editing ? (
        <div className="flex items-center gap-2">
          <input 
            type="number" step="0.01" value={value} onChange={e => onChange(e.target.value)}
            className="w-20 bg-white/10 border border-white/20 rounded-lg text-white p-2 text-sm text-right outline-none focus:border-[var(--amber-core)]"
          />
          <span className="text-[10px] text-[var(--text-muted)] font-bold">{suffix}</span>
        </div>
      ) : (
        <span className="font-mono font-bold text-sm">{value} <span className="text-[10px] font-normal text-[var(--text-muted)]">{suffix}</span></span>
      )}
    </div>
  );
}

function VerificationTab({ queue, onAction }) {
  const { loading, execute } = useApi();

  const handleVerify = async (id, status) => {
    await execute(() => vehicleService.adminVerifyVehicle(id, { status }), {
      successMessage: `Vehicle ${status}`,
      onSuccess: onAction
    });
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <GlassCard level={2} className="p-8 md:p-12 min-h-[600px]">
        <h3 className="text-2xl font-bold mb-10">Vehicle Verification Queue</h3>
        <div className="flex flex-col gap-4">
          {queue.map(v => (
            <div key={v.vehicle_id} className="glass-1 p-6 md:p-8 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-white/5">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-amber-ghost flex items-center justify-center text-[var(--amber-core)]">
                  <Car size={28} />
                </div>
                <div>
                  <div className="text-lg font-bold text-white mb-1">{v.make} {v.model} <span className="text-[var(--text-muted)] font-mono text-sm">({v.license_plate})</span></div>
                  <div className="text-xs text-[var(--text-muted)]">Captain ID: <span className="text-white font-mono">#{v.driver_id}</span> • Tier: <span className="text-[var(--amber-core)] font-bold">{v.vehicle_type}</span></div>
                </div>
              </div>
              <div className="flex gap-4 w-full sm:w-auto">
                <Button variant="ghost" className="flex-1 sm:flex-initial text-red-500 bg-red-500/10 font-bold px-8" onClick={() => handleVerify(v.vehicle_id, 'Rejected')} disabled={loading}>Reject</Button>
                <Button className="flex-1 sm:flex-initial font-bold px-8" onClick={() => handleVerify(v.vehicle_id, 'Verified')} disabled={loading}>Approve</Button>
              </div>
            </div>
          ))}
          {queue.length === 0 && (
            <EmptyState 
              icon={CheckCircle} 
              title="Verification Complete" 
              subtitle="The inspection queue is currently empty. All registered vehicles are processed." 
            />
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}

function AdminPayoutsTab() {
  const [payouts, setPayouts] = useState([]);
  const { loading, execute } = useApi();

  const fetchPayouts = useCallback(async () => {
    const res = await walletService.getAdminPayouts().catch(() => null);
    if (res) setPayouts(res.data);
  }, []);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const handleApprove = async (id) => {
    await execute(() => walletService.updatePayoutStatus(id, { status: 'Completed' }), {
      successMessage: "Payout completed",
      onSuccess: fetchPayouts
    });
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <GlassCard level={2} className="p-8 md:p-12">
        <h3 className="text-2xl font-bold mb-10">Pending Payout Requests</h3>
        <div className="flex flex-col gap-4">
          {payouts.map(p => (
            <div key={p.payout_id} className="glass-1 p-6 md:p-8 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-white/5">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-amber-ghost flex items-center justify-center text-[var(--amber-core)]">
                  <DollarSign size={28} />
                </div>
                <div>
                  <div className="text-2xl font-black font-mono text-white mb-1">PKR {parseFloat(p.amount).toLocaleString()}</div>
                  <div className="text-xs text-[var(--text-muted)]">Captain ID: <span className="text-white font-mono">#{p.user_id}</span> • Requested: <span className="text-white">{new Date(p.request_date).toLocaleDateString()}</span></div>
                </div>
              </div>
              <div className="flex gap-4 w-full sm:w-auto">
                <Button variant="ghost" className="flex-1 sm:flex-initial text-red-500 bg-red-500/10 font-bold px-8" onClick={() => execute(() => walletService.updatePayoutStatus(p.payout_id, { status: 'Rejected' }), { onSuccess: fetchPayouts })}>Reject</Button>
                <Button className="flex-1 sm:flex-initial font-bold px-8" onClick={() => handleApprove(p.payout_id)}>Authorize Transfer</Button>
              </div>
            </div>
          ))}
          {payouts.length === 0 && (
            <EmptyState 
              icon={CreditCard} 
              title="Treasury Settled" 
              subtitle="All payout requests have been processed. Systems are balanced." 
            />
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}
