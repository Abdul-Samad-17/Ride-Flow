import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, MapPin, Navigation, Clock, CreditCard, History, Settings, LogOut, 
  Search, Shield, Star, Wallet, ArrowRight, Zap, Bell, CheckCircle,
  Power, TrendingUp, User, DollarSign, Calendar, X, ExternalLink, Banknote
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useRideStore from '../../store/rideStore';
import * as authService from '../../services/authService';
import * as driverService from '../../services/driverService';
import * as rideService from '../../services/rideService';
import * as vehicleService from '../../services/vehicleService';
import { GlassCard, Badge, Spinner, Button, Input, EmptyState, RatingStars } from '../../components/ui';
import { useApi } from '../../hooks/useApi';
import toast from 'react-hot-toast';
import RideMap from '../../components/maps/RideMap';
import ActiveRidePanel from '../../components/rides/ActiveRidePanel';
import * as walletService from '../../services/walletService';
import * as ratingService from '../../services/ratingService';
import * as uploadService from '../../services/uploadService';
import DashboardLayout from '../../components/layout/DashboardLayout';

export default function DriverDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isActive, setIsActive] = useState(false);
  const [stats, setStats] = useState({ today_earnings: 0, total_rides: 0, rating: 0 });
  const [vehicles, setVehicles] = useState([]);
  const { user, clearAuth } = useAuthStore();
  const { activeRide, setActiveRide, clearRide } = useRideStore();
  const { loading: statsLoading, execute: execStats } = useApi();
  const { loading: toggleLoading, execute: execToggle } = useApi();
  const { pathname } = useLocation();

  // Sync activeTab with URL
  useEffect(() => {
    const segments = pathname.split('/');
    const path = segments[segments.length - 1];
    if (['overview', 'rides', 'earnings', 'profile'].includes(path)) {
      setActiveTab(path);
    } else if (pathname === '/dashboard/driver') {
      setActiveTab('overview');
    }
  }, [pathname]);

  const fetchStats = useCallback(async () => {
    const res = await execStats(() => driverService.getStats(), { showSuccessToast: false, showErrorToast: false });
    if (res) setStats(res.data);
  }, [execStats]);

  const fetchVehicles = useCallback(async () => {
    const res = await vehicleService.getMyVehicles().catch(() => null);
    if (res) setVehicles(res.data);
  }, []);

  useEffect(() => {
    fetchStats();
    fetchVehicles();
    setIsActive(user?.account_status === 'Active' || user?.availability_status === 'Online');
  }, [fetchStats, fetchVehicles, user]);

  // Polling for active ride status
  useEffect(() => {
    const poll = async () => {
      const res = await rideService.getActiveRide().catch(() => null);
      if (res?.data) setActiveRide(res.data);
      else setActiveRide(null); 
    };
    
    poll();
    const interval = setInterval(poll, 8000);
    return () => clearInterval(interval);
  }, [setActiveRide]);

  // Driver Location Tracking
  useEffect(() => {
    if (!isActive) return;

    const updateDriverPos = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          driverService.updateLocation(coords).catch(console.error);
        },
        (err) => console.error("Geolocation error:", err),
        { enableHighAccuracy: true }
      );
    };

    updateDriverPos();
    const interval = setInterval(updateDriverPos, 15000);
    return () => clearInterval(interval);
  }, [isActive]);

  const handleToggleActive = async () => {
    const newStatus = !isActive;
    const payload = {
      status: newStatus ? 'Online' : 'Offline',
      city: user?.current_city || 'Islamabad'
    };
    
    await execToggle(() => driverService.toggleAvailability(payload), {
      successMessage: `You are now ${newStatus ? 'Online' : 'Offline'}`,
      onSuccess: () => setIsActive(newStatus)
    });
  };

  return (
    <DashboardLayout>
      <div className="w-full pb-24">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-20">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Driver Hub</h1>
            <p className="text-[var(--text-muted)] text-sm md:text-base">
              Welcome back, Capt. {user?.full_name?.split(' ')[0]}
            </p>
          </div>
          <div className="flex w-full sm:w-auto gap-4 items-center">
            <button 
              onClick={handleToggleActive} 
              disabled={toggleLoading}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-3 py-4 px-8 rounded-2xl font-bold transition-all ${
                isActive 
                  ? 'bg-green-500 text-black shadow-[0_0_25px_rgba(34,197,94,0.3)]' 
                  : 'bg-white/5 text-[var(--text-muted)] border border-white/5'
              }`}
            >
              <Power size={18} /> {isActive ? 'GO OFFLINE' : 'GO ONLINE'}
            </button>
            <button className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 text-[var(--text-primary)] flex items-center justify-center hover:bg-white/10 transition-colors">
              <Bell size={22} />
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && <OverviewTab key="overview" stats={stats} isActive={isActive} activeRide={activeRide} onNavigate={() => setActiveTab('rides')} />}
          {activeTab === 'rides' && <ActiveRideTab key="rides" activeRide={activeRide} />}
          {activeTab === 'earnings' && <EarningsTab key="earnings" />}
          {activeTab === 'profile' && <ProfileTab key="profile" user={user} vehicles={vehicles} onAddVehicle={fetchVehicles} />}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

function OverviewTab({ stats, isActive, activeRide, onNavigate }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <GlassCard level={1} className="p-8">
          <p className="label-caps text-[10px] mb-4">Today's Earnings</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-black font-mono">PKR {parseFloat(stats.today_earnings || 0).toFixed(2)}</span>
          </div>
        </GlassCard>
        <GlassCard level={1} className="p-8">
          <p className="label-caps text-[10px] mb-4">Total Rides</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-black font-mono">{stats.total_rides || 0}</span>
          </div>
        </GlassCard>
        <GlassCard level={1} className="p-8 sm:col-span-2 lg:col-span-1">
          <p className="label-caps text-[10px] mb-4">Rating</p>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl md:text-4xl font-black font-mono">{parseFloat(stats.rating || 5.0).toFixed(1)}</span>
            <Star size={24} className="text-[var(--amber-core)] fill-[var(--amber-core)]" />
          </div>
        </GlassCard>
      </div>

      <GlassCard level={2} className="p-10 md:p-16 min-h-[400px] flex flex-col justify-center items-center text-center relative overflow-hidden">
        {!isActive ? (
          <>
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-[var(--text-muted)] mb-8 border border-white/10">
              <Power size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-4">Go Online to Earn</h3>
            <p className="text-[var(--text-muted)] max-w-sm">Switch to online mode to start receiving premium trip requests in your area.</p>
          </>
        ) : activeRide ? (
          <>
            <div className="w-20 h-20 rounded-full bg-amber-ghost flex items-center justify-center text-[var(--amber-core)] mb-8">
              <Navigation size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-4">Active Trip In Progress</h3>
            <p className="text-[var(--text-secondary)] mb-8">Rider: {activeRide.rider_name}</p>
            <Button className="px-10 py-4 font-bold" onClick={onNavigate}>View Task Details</Button>
          </>
        ) : (
          <>
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} 
              transition={{ repeat: Infinity, duration: 2 }} 
              className="absolute w-64 h-64 rounded-full bg-green-500/10 pointer-events-none" 
            />
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mb-8 border border-green-500/20 z-10">
              <Search size={32} className="animate-pulse" />
            </div>
            <h3 className="text-2xl font-bold mb-4 z-10">Searching for Requests</h3>
            <p className="text-[var(--text-secondary)] z-10">System is looking for high-priority matches nearby...</p>
          </>
        )}
      </GlassCard>
    </motion.div>
  );
}

function ActiveRideTab({ activeRide }) {
  if (!activeRide) return (
    <div className="py-32 text-center flex flex-col items-center gap-6">
      <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-[var(--text-muted)]">
        <Navigation size={32} />
      </div>
      <div>
        <h3 className="text-xl font-bold mb-2">No active tasks</h3>
        <p className="text-[var(--text-muted)]">Go online from the overview tab to start receiving rides.</p>
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <ActiveRidePanel activeRide={activeRide} />
    </motion.div>
  );
}

function EarningsTab() {
  const [history, setHistory] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);
  const { loading, execute } = useApi();

  const fetchHistory = useCallback(async () => {
    const res = await execute(() => driverService.getEarningsHistory(), { showSuccessToast: false, showErrorToast: false });
    if (res) setHistory(res.data);
  }, [execute]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const totalEarnings = history.reduce((acc, curr) => acc + parseFloat(curr.driver_amount || 0), 0);
  const totalCommission = history.reduce((acc, curr) => acc + parseFloat(curr.commission || 0), 0);

  if (loading && history.length === 0) return <div className="py-32 text-center"><Spinner /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-10">
        <GlassCard level={2} className="p-6 md:p-12 min-h-[600px]">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
            <History size={20} className="text-[var(--amber-core)]" /> Ride Analysis
          </h3>
          <div className="flex flex-col gap-4">
            {history.map(ride => (
              <div key={ride.ride_id} className="glass-1 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border border-white/5">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge status={ride.payment_status === 'Paid' ? 'Active' : 'Warning'}>{ride.payment_status}</Badge>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">
                      #{ride.ride_id.toString().slice(-6)} • {new Date(ride.end_time).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-bold text-white">
                      {ride.pickup_location.split(',')[0]} → {ride.dropoff_location.split(',')[0]}
                    </p>
                    <div className="flex flex-wrap gap-4 mt-2">
                      <div className="bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                        <span className="text-[9px] text-[var(--text-muted)] block mb-1">Rider Rating</span>
                        <RatingStars value={ride.rider_rating_score || 0} size="sm" />
                      </div>
                      {!ride.driver_has_rated && (
                        <button onClick={() => setSelectedRide(ride)} className="text-[11px] font-bold text-[var(--amber-core)] hover:underline">
                          Rate Rider
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right w-full sm:w-auto">
                  <p className="text-xl font-black text-[var(--amber-core)] font-mono">+PKR {parseFloat(ride.driver_amount).toFixed(2)}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">Gross: PKR {parseFloat(ride.total_fare).toFixed(2)}</p>
                </div>
              </div>
            ))}
            {history.length === 0 && (
              <EmptyState 
                icon={Car} 
                title="No trips completed yet" 
                subtitle="Go online to start receiving rides and building your earnings history." 
              />
            )}
          </div>
        </GlassCard>

        <div className="flex flex-col gap-8">
          <GlassCard level={3} className="p-8 bg-gradient-to-br from-[rgba(245,166,35,0.1)] to-transparent border border-amber-ghost/10">
            <TrendingUp size={24} className="text-[var(--amber-core)] mb-6" />
            <p className="label-caps text-[10px] mb-2">Lifetime Earnings</p>
            <h2 className="text-4xl font-black font-mono">PKR {totalEarnings.toFixed(2)}</h2>
            <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
              <span className="text-xs text-[var(--text-muted)]">Total Commission</span>
              <span className="text-sm font-bold text-red-500">PKR {totalCommission.toFixed(2)}</span>
            </div>
          </GlassCard>

          <GlassCard level={2} className="p-8 flex-1">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-6">Payout Activity</h4>
            <PayoutsList />
          </GlassCard>
        </div>
      </div>

      <AnimatePresence>
        {selectedRide && (
          <RatingModal 
            ride={selectedRide} 
            onClose={() => setSelectedRide(null)} 
            onSuccess={() => {
              setSelectedRide(null);
              fetchHistory();
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PayoutsList() {
  const [payouts, setPayouts] = useState([]);
  const { loading, execute } = useApi();

  useEffect(() => {
    execute(() => walletService.getPayoutHistory(), { showSuccessToast: false, showErrorToast: false })
      .then(res => res && setPayouts(res.data || []));
  }, []);

  if (loading && payouts.length === 0) return <div className="py-10 text-center"><Spinner /></div>;

  return (
    <div className="flex flex-col gap-4">
      {payouts.map(p => (
        <div key={p.payout_id} className="glass-1 p-4 rounded-xl flex justify-between items-center border border-white/5">
          <div>
            <div className="text-sm font-bold">PKR {parseFloat(p.amount).toFixed(2)}</div>
            <div className="text-[10px] text-[var(--text-muted)]">{new Date(p.request_date).toLocaleDateString()}</div>
          </div>
          <Badge status={p.status === 'Completed' ? 'Active' : p.status === 'Pending' ? 'Warning' : 'Error'}>
            {p.status}
          </Badge>
        </div>
      ))}
      {payouts.length === 0 && (
        <EmptyState 
          icon={Banknote} 
          title="No payouts" 
          subtitle="Requests will appear here." 
        />
      )}
    </div>
  );
}

function ProfileTab({ user, vehicles, onAddVehicle }) {
  const [subTab, setSubTab] = useState('reputation');
  const [profileForm, setProfileForm] = useState({ full_name: user?.full_name || '', phone: user?.phone || '' });
  const [driverForm, setDriverForm] = useState({ current_city: user?.current_city || '' });
  const [passForm, setPassForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [uploading, setUploading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { loading, execute } = useApi();
  const { clearAuth } = useAuthStore();

  const [ratingsData, setRatingsData] = useState({ ratings: [], summary: null });

  useEffect(() => {
    if (subTab === 'reputation') {
      ratingService.getMyRatings().then(res => setRatingsData(res.data)).catch(console.error);
    }
  }, [subTab]);

  const handleUpdateProfile = async () => {
    await execute(() => authService.updateProfile(profileForm), {
      successMessage: "Personal info updated",
      onSuccess: (data) => useAuthStore.getState().setUser({ ...user, ...data.data.user })
    });
  };

  const handleUpdateDriver = async () => {
    await execute(() => driverService.updateDriverProfile(driverForm), {
      successMessage: "Operational settings updated",
      onSuccess: (data) => useAuthStore.getState().setUser({ ...user, ...data.data.driver })
    });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passForm.new_password !== passForm.confirm_password) return toast.error("Passwords do not match");
    await execute(() => authService.changePassword(passForm), {
      successMessage: "Security updated. Re-login required.",
      onSuccess: () => setTimeout(() => { clearAuth(); window.location.href = '/login'; }, 2000)
    });
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file || file.size > 5 * 1024 * 1024) return toast.error("Invalid file or size > 5MB");
    setUploading(true);
    try {
      const res = await uploadService.uploadProfilePhoto(file);
      useAuthStore.getState().setUser({ ...user, profile_photo: res.data.profile_photo });
      toast.success("Profile photo updated");
    } finally {
      setUploading(false);
    }
  };

  const summary = ratingsData.summary || { avg_rating: 0, total_ratings: 0 };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
        {[
          { id: 'reputation', label: 'Reputation', icon: Star },
          { id: 'vehicles', label: 'Vehicles', icon: Car },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map(t => (
          <button 
            key={t.id} 
            onClick={() => setSubTab(t.id)} 
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${
              subTab === t.id ? 'bg-amber-ghost text-[var(--amber-core)]' : 'text-[var(--text-muted)] hover:text-white'
            }`}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {subTab === 'reputation' && (
          <motion.div key="rep" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <GlassCard level={2} className="p-8 md:p-12">
                <h3 className="text-xl font-bold mb-10 flex items-center gap-3">
                  <Star size={20} className="text-[var(--amber-core)]" /> Reputational Analytics
                </h3>
                <div className="text-center mb-10">
                  <h2 className="text-6xl font-black text-[var(--amber-core)] mb-2 font-mono">{parseFloat(summary.avg_rating || 0).toFixed(1)}</h2>
                  <RatingStars value={summary.avg_rating || 0} size="md" />
                  <p className="text-[var(--text-muted)] text-xs mt-4 uppercase tracking-widest">{summary.total_ratings} verified reviews</p>
                </div>
                <div className="flex flex-col gap-4">
                  {['five_star', 'four_star', 'three_star', 'two_star', 'one_star'].map((key, i) => {
                    const percent = summary.total_ratings > 0 ? ((summary[key] || 0) / summary.total_ratings) * 100 : 0;
                    return (
                      <div key={key} className="flex items-center gap-4">
                        <span className="text-[10px] text-[var(--text-muted)] w-10 font-bold">{5 - i} STAR</span>
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} className="h-full bg-[var(--amber-core)] shadow-[0_0_10px_rgba(245,166,35,0.4)]" />
                        </div>
                        <span className="text-[10px] text-[var(--text-secondary)] w-8 text-right font-mono">{Math.round(percent)}%</span>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
              <GlassCard level={2} className="p-8 md:p-12">
                <h4 className="label-caps text-[10px] mb-8">Latest Passenger Feedback</h4>
                <div className="flex flex-col gap-4">
                  {ratingsData.ratings.slice(0, 4).map(r => (
                    <div key={r.rating_id} className="p-5 bg-white/5 rounded-2xl border border-white/5">
                      <div className="flex justify-between items-center mb-3">
                        <RatingStars value={r.score} size="sm" />
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">{new Date(r.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-[var(--text-secondary)] italic leading-relaxed">"{r.comment || 'No comment provided'}"</p>
                    </div>
                  ))}
                  {ratingsData.ratings.length === 0 && <EmptyState icon={Star} title="No feedback yet" subtitle="Complete trips to see what riders say about you." />}
                </div>
              </GlassCard>
            </div>
          </motion.div>
        )}

        {subTab === 'vehicles' && (
          <motion.div key="veh" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <VehicleTab vehicles={vehicles} onAdd={onAddVehicle} />
          </motion.div>
        )}

        {subTab === 'settings' && (
          <motion.div key="set" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">
              <GlassCard level={2} className="p-8 md:p-12">
                <div className="flex flex-col sm:flex-row items-center gap-8 mb-12">
                  <div className="relative group cursor-pointer">
                    <div className="w-24 h-24 rounded-3xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
                      {user?.profile_photo ? <img src={user.profile_photo} alt="Profile" className="w-full h-full object-cover" /> : <User size={32} className="text-[var(--amber-core)]" />}
                    </div>
                    <label className="absolute inset-0 rounded-3xl bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                      <Car size={20} className="text-white" />
                      <input type="file" hidden onChange={handlePhotoChange} accept="image/*" />
                    </label>
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-2xl font-bold">Personal Profile</h3>
                    <p className="text-[var(--text-muted)] text-sm">Update your identity and operational city.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                  <Input label="Full Name" value={profileForm.full_name} onChange={e => setProfileForm(p => ({ ...p, full_name: e.target.value }))} />
                  <Input label="Phone Number" value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} />
                  <div className="sm:col-span-2">
                    <Input label="Email Address" value={user?.email} disabled className="opacity-50" />
                  </div>
                </div>
                <Button className="w-full py-4 font-bold" onClick={handleUpdateProfile} disabled={loading}>Save Profile Changes</Button>

                <div className="h-px bg-white/5 my-12" />

                <h3 className="text-xl font-bold mb-6">Operational Settings</h3>
                <div className="mb-10">
                  <Input label="Current Operating City" value={driverForm.current_city} onChange={e => setDriverForm(p => ({ ...p, current_city: e.target.value }))} />
                  <p className="text-[10px] text-[var(--text-muted)] mt-2 italic uppercase tracking-wider font-bold">* Essential for matching nearby riders</p>
                </div>
                <Button variant="secondary" className="w-full py-4 font-bold" onClick={handleUpdateDriver} disabled={loading}>Update City</Button>
              </GlassCard>

              <div className="flex flex-col gap-8">
                <GlassCard level={3} className="p-8">
                  <h4 className="label-caps text-[10px] mb-6">Security Credentials</h4>
                  <div className="flex flex-col gap-5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[var(--text-muted)]">License Number</span>
                      <span className="font-mono text-sm font-bold">••••••{user?.license_number?.slice(-4)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[var(--text-muted)]">Verification</span>
                      <Badge status={user?.verification_status === 'Verified' ? 'Active' : 'Warning'}>{user?.verification_status}</Badge>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard level={2} className="p-8">
                  <h4 className="label-caps text-[10px] mb-8">Update Password</h4>
                  <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                    <Input type="password" placeholder="Current Password" value={passForm.current_password} onChange={e => setPassForm(p => ({ ...p, current_password: e.target.value }))} required />
                    <Input type="password" placeholder="New Password" value={passForm.new_password} onChange={e => setPassForm(p => ({ ...p, new_password: e.target.value }))} required />
                    <Input type="password" placeholder="Confirm New" value={passForm.confirm_password} onChange={e => setPassForm(p => ({ ...p, confirm_password: e.target.value }))} required />
                    <Button className="w-full py-4 font-bold bg-white/5 hover:bg-white/10" variant="ghost" disabled={loading} type="submit">Update Credentials</Button>
                  </form>
                </GlassCard>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function RatingModal({ ride, onClose, onSuccess }) {
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await ratingService.submitRating({
        ride_id: ride.ride_id,
        score,
        comment
      });
      toast.success("Feedback submitted!");
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit rating");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6">
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} className="w-full max-w-lg bg-[var(--bg-deep)] rounded-t-[32px] sm:rounded-[32px] border-t sm:border border-white/10 p-8 md:p-12 relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-[var(--text-muted)]"><X size={24} /></button>
        <div className="w-16 h-16 rounded-2xl bg-amber-ghost flex items-center justify-center text-[var(--amber-core)] mx-auto mb-6">
          <User size={32} />
        </div>
        <h3 className="text-2xl font-bold text-center mb-2">Rate Passenger</h3>
        <p className="text-[var(--text-muted)] text-center text-sm mb-10">How was your experience with the rider?</p>
        <div className="flex justify-center mb-10">
          <RatingStars mode="input" size="lg" value={score} onChange={setScore} />
        </div>
        <textarea 
          placeholder="Share your feedback..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-sm h-32 resize-none mb-10 focus:border-[var(--amber-core)] outline-none"
        />
        <Button className="w-full py-5 text-lg font-bold" onClick={handleSubmit} disabled={loading}>
          {loading ? <Spinner size={20} /> : 'Submit Review'}
        </Button>
      </motion.div>
    </div>
  );
}

function VehicleTab({ vehicles, onAdd }) {
  const [form, setForm] = useState({ 
    make: '', 
    model: '', 
    year: new Date().getFullYear(), 
    color: '', 
    license_plate: '', 
    vehicle_type: 'Economy' 
  });
  const { loading, execute } = useApi();

  const handleAdd = async (e) => {
    e.preventDefault();
    await execute(() => vehicleService.addVehicle(form), {
      successMessage: 'Vehicle added for verification',
      onSuccess: () => {
        setForm({ make: '', model: '', year: new Date().getFullYear(), color: '', license_plate: '', vehicle_type: 'Economy' });
        onAdd();
      }
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassCard level={2} className="p-8 md:p-12">
          <h3 className="text-xl font-bold mb-8">Registered Vehicles</h3>
          <div className="flex flex-col gap-4">
            {vehicles.map(v => (
              <div key={v.vehicle_id} className="glass-1 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-white/5">
                <div>
                  <h4 className="text-base font-bold text-white mb-1">
                    {v.make} {v.model} <span className="text-[var(--text-muted)] font-normal text-sm">({v.year})</span>
                  </h4>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-[var(--text-secondary)] font-medium">
                    <span className="flex items-center gap-2 tracking-widest font-mono"><CreditCard size={14} className="text-[var(--amber-core)]" /> {v.license_plate}</span>
                    <span className="opacity-20 hidden sm:block">|</span>
                    <span className="capitalize">{v.color}</span>
                    <span className="opacity-20 hidden sm:block">|</span>
                    <span className="text-[var(--amber-core)] font-bold">{v.vehicle_type}</span>
                  </div>
                </div>
                <Badge status={v.verification_status === 'Verified' ? 'Active' : 'Warning'}>
                  {v.verification_status}
                </Badge>
              </div>
            ))}
            {vehicles.length === 0 && <EmptyState icon={Car} title="No vehicles" subtitle="Register your first vehicle below." />}
          </div>
        </GlassCard>

        <GlassCard level={2} className="p-8 md:p-12">
          <h3 className="text-xl font-bold mb-8">Add New Vehicle</h3>
          <form onSubmit={handleAdd} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input label="Make (e.g. Toyota)" value={form.make} onChange={e => setForm(p => ({ ...p, make: e.target.value }))} required />
              <Input label="Model (e.g. Corolla)" value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input label="Year" type="number" value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} required />
              <Input label="Color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} required />
            </div>
            <Input label="License Plate Number" value={form.license_plate} onChange={e => setForm(p => ({ ...p, license_plate: e.target.value }))} required />
            <div className="flex flex-col gap-3">
              <label className="label-caps text-[10px]">Vehicle Category</label>
              <select 
                value={form.vehicle_type} 
                onChange={e => setForm(p => ({ ...p, vehicle_type: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 text-white p-4 rounded-xl outline-none focus:border-[var(--amber-core)] transition-colors"
              >
                <option value="Economy" className="bg-[#050508]">Economy</option>
                <option value="Premium" className="bg-[#050508]">Premium</option>
                <option value="Bike" className="bg-[#050508]">Bike</option>
              </select>
            </div>
            <Button className="w-full py-5 text-lg font-bold mt-4" type="submit" disabled={loading}>
              {loading ? <Spinner /> : 'Register for Verification'}
            </Button>
          </form>
        </GlassCard>
      </div>
    </motion.div>
  );
}
