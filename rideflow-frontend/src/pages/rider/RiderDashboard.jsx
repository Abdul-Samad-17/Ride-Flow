import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, MapPin, Navigation, Clock, CreditCard, History, Settings, LogOut, 
  Search, Shield, Star, Wallet, ArrowRight, Zap, Bell, CheckCircle, X, Receipt, User
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useRideStore from '../../store/rideStore';
import * as authService from '../../services/authService';
import * as rideService from '../../services/rideService';
import * as walletService from '../../services/walletService';
import { GlassCard, Badge, Spinner, Button, Input, EmptyState } from '../../components/ui';
import { useApi } from '../../hooks/useApi';
import toast from 'react-hot-toast';
import AddressAutocomplete from '../../components/maps/AddressAutocomplete';
import RideMap from '../../components/maps/RideMap';
import ActiveRideTracker from '../../components/rides/ActiveRideTracker';
import DashboardLayout from '../../components/layout/DashboardLayout';

export default function RiderDashboard() {
  const [activeTab, setActiveTab] = useState('book');
  const [balance, setBalance] = useState(0);
  const [rideHistory, setRideHistory] = useState([]);
  const { user, clearAuth } = useAuthStore();
  const { activeRide, setActiveRide, clearRide } = useRideStore();
  const { loading: statsLoading, execute: execStats } = useApi();
  const { loading: rideLoading, execute: execRide } = useApi();
  const { pathname } = useLocation();

  // Sync activeTab with URL
  useEffect(() => {
    const segments = pathname.split('/');
    const path = segments[segments.length - 1];
    if (['book', 'rides', 'wallet', 'profile'].includes(path)) {
      // Map URL paths to internal tab IDs
      const tabMap = { 'book': 'book', 'rides': 'history', 'wallet': 'wallet', 'profile': 'settings' };
      setActiveTab(tabMap[path] || 'book');
    } else if (pathname === '/dashboard/rider') {
      setActiveTab('book');
    }
  }, [pathname]);

  const fetchStats = useCallback(async () => {
    const res = await execStats(() => walletService.getBalance(), { showSuccessToast: false, showErrorToast: false });
    if (res) setBalance(res.data.balance);
  }, [execStats]);

  const fetchHistory = useCallback(async () => {
    const res = await execRide(() => rideService.getRideHistory(), { showSuccessToast: false });
    if (res) setRideHistory(res.data.rides || []);
  }, [execRide]);

  useEffect(() => {
    fetchStats();
    if (activeTab === 'history') fetchHistory();
  }, [activeTab, fetchStats, fetchHistory]);

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

  return (
    <DashboardLayout>
      <div className="w-full">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Hello, {user?.full_name?.split(' ')[0]}</h1>
            <p className="text-[var(--text-muted)] text-sm md:text-base">
              {activeRide ? 'Your journey is in progress' : 'Ready for your next premium journey?'}
            </p>
          </div>
          <div className="flex w-full sm:w-auto gap-4 items-center">
            <div className="glass-1 flex-1 sm:flex-initial px-6 py-3 rounded-2xl flex items-center gap-4 border border-white/5">
              <Wallet size={18} className="text-[var(--amber-core)]" />
              <span className="font-mono font-bold text-lg">PKR {Number(balance || 0).toFixed(2)}</span>
            </div>
            <button className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 text-[var(--text-primary)] flex items-center justify-center hover:bg-white/10 transition-colors">
              <Bell size={22} />
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'book' && <BookRideTab key="book" activeRide={activeRide} onBookingSuccess={fetchStats} />}
          {activeTab === 'history' && <RideHistoryTab key="history" history={rideHistory} loading={rideLoading} onRefresh={fetchHistory} />}
          {activeTab === 'wallet' && <WalletTab key="wallet" balance={balance} onRefresh={fetchStats} />}
          {activeTab === 'settings' && <AccountTab key="settings" user={user} />}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

function BookRideTab({ activeRide, onBookingSuccess }) {
  const [form, setForm] = useState({ 
    pickup: '', 
    pickupCoords: null,
    destination: '', 
    destinationCoords: null,
    vehicle_type: 'Standard' 
  });
  const [estimation, setEstimation] = useState(null);
  const { loading, execute } = useApi();
  const { setActiveRide } = useRideStore();
  const [selectingMapField, setSelectingMapField] = useState(null);

  const handleEstimate = async () => {
    if (!form.pickupCoords || !form.destinationCoords) return;
    
    const typeMapping = { 'Standard': 'Economy', 'Premium': 'Premium', 'Executive': 'Premium' };
    const payload = {
      pickup_location: form.pickup,
      dropoff_location: form.destination,
      vehicle_type: typeMapping[form.vehicle_type] || 'Economy'
    };

    const res = await execute(() => rideService.estimateFare(payload), { showSuccessToast: false });
    if (res) setEstimation(res.data);
  };

  useEffect(() => {
    if (form.pickupCoords && form.destinationCoords) {
      handleEstimate();
    }
  }, [form.pickupCoords, form.destinationCoords, form.vehicle_type]);

  const handleBook = async () => {
    if (!form.pickup || !form.destination) return toast.error('Enter pickup and destination');

    const typeMapping = { 'Standard': 'Economy', 'Premium': 'Premium', 'Executive': 'Premium' };
    const payload = {
      pickup_location: form.pickup,
      dropoff_location: form.destination,
      vehicle_type: typeMapping[form.vehicle_type] || 'Economy'
    };

    const res = await execute(() => rideService.requestRide(payload), { 
      successMessage: 'Searching for nearby drivers...',
      onSuccess: (data) => {
        setActiveRide(data.data);
        setForm({ 
          pickup: '', 
          pickupCoords: null,
          destination: '', 
          destinationCoords: null,
          vehicle_type: 'Standard' 
        });
        setEstimation(null);
        onBookingSuccess();
      }
    });
  };

  if (activeRide) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <ActiveRideTracker activeRide={activeRide} onPaymentSuccess={onBookingSuccess} />
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">
        <GlassCard level={2} className="p-6 md:p-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-amber-ghost flex items-center justify-center text-[var(--amber-core)]">
              <Navigation size={24} />
            </div>
            <h3 className="text-xl md:text-2xl font-semibold">Secure Your Ride</h3>
          </div>
          
          <div className="flex flex-col gap-8">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="label-caps">Pickup Location</label>
                  <button 
                    onClick={() => setSelectingMapField(selectingMapField === 'pickup' ? null : 'pickup')}
                    className={`text-[10px] font-bold transition-colors ${selectingMapField === 'pickup' ? 'text-[var(--amber-core)]' : 'text-[var(--text-muted)]'}`}
                  >
                    {selectingMapField === 'pickup' ? 'SELECTING ON MAP...' : 'SELECT ON MAP'}
                  </button>
                </div>
                <AddressAutocomplete 
                  placeholder="Where should we pick you up?"
                  value={form.pickup}
                  onSelect={(place) => setForm(p => ({ 
                    ...p, 
                    pickup: place.formattedAddress, 
                    pickupCoords: { lat: place.lat, lng: place.lng } 
                  }))}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="label-caps">Destination</label>
                  <button 
                    onClick={() => setSelectingMapField(selectingMapField === 'dropoff' ? null : 'dropoff')}
                    className={`text-[10px] font-bold transition-colors ${selectingMapField === 'dropoff' ? 'text-[var(--amber-core)]' : 'text-[var(--text-muted)]'}`}
                  >
                    {selectingMapField === 'dropoff' ? 'SELECTING ON MAP...' : 'SELECT ON MAP'}
                  </button>
                </div>
                <AddressAutocomplete 
                  placeholder="Where are you headed?"
                  value={form.destination}
                  onSelect={(place) => setForm(p => ({ 
                    ...p, 
                    destination: place.formattedAddress, 
                    destinationCoords: { lat: place.lat, lng: place.lng } 
                  }))}
                />
              </div>
            </div>
            
            <div>
              <label className="label-caps block mb-4">Select Experience</label>
              <div className="grid grid-cols-3 gap-3 md:gap-4">
                {['Standard', 'Premium', 'Executive'].map(type => (
                  <div 
                    key={type} 
                    onClick={() => setForm(p => ({ ...p, vehicle_type: type }))} 
                    className={`p-4 md:p-6 rounded-2xl text-center cursor-pointer transition-all border ${
                      form.vehicle_type === type 
                        ? 'border-[var(--amber-core)] bg-amber-ghost/30 shadow-[0_0_15px_rgba(245,166,35,0.1)]' 
                        : 'border-white/5 hover:border-white/10'
                    }`}
                  >
                    <Car size={24} className={`mx-auto mb-3 ${form.vehicle_type === type ? 'text-[var(--amber-core)]' : 'text-[var(--text-muted)]'}`} />
                    <div className={`text-xs md:text-sm font-bold ${form.vehicle_type === type ? 'text-[var(--amber-core)]' : 'text-[var(--text-primary)]'}`}>{type}</div>
                  </div>
                ))}
              </div>
            </div>

            {estimation && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass-1 p-5 rounded-2xl border border-[var(--amber-ghost)] bg-amber-ghost/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[var(--text-muted)] text-sm">Estimated Fare</span>
                  <span className="font-mono font-bold text-lg text-[var(--amber-core)]">
                    PKR {Number(estimation.estimated_fare).toFixed(2)}
                    {estimation.is_surge && <Zap size={14} className="inline ml-1" />}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] md:text-xs">
                  <span className="text-[var(--text-muted)]">Distance / Time</span>
                  <span className="font-medium">{estimation.distance_km} km / {estimation.duration_text}</span>
                </div>
              </motion.div>
            )}

            <Button className="w-full py-5 text-lg font-bold" onClick={handleBook} disabled={loading || !form.pickupCoords}>
              {loading ? <Spinner size={20} /> : <>Book Premium Ride <ArrowRight size={20} className="ml-2" /></>}
            </Button>
          </div>
        </GlassCard>

        <div className="h-[300px] lg:h-auto min-h-[400px] rounded-[32px] overflow-hidden border border-white/5 relative">
          {selectingMapField && (
            <div className="absolute top-4 left-4 right-4 z-10 bg-[var(--amber-core)] text-[#050508] px-4 py-2 rounded-xl text-xs font-bold text-center shadow-xl animate-bounce">
              Tap on map to set {selectingMapField}
            </div>
          )}
          <RideMap 
            pickup={form.pickupCoords}
            dropoff={form.destinationCoords}
            onMapClick={(latLng) => {
              if (selectingMapField === 'pickup') {
                setForm(p => ({ ...p, pickup: `${latLng.lat.toFixed(4)}, ${latLng.lng.toFixed(4)}`, pickupCoords: latLng }));
                setSelectingMapField(null);
              } else if (selectingMapField === 'dropoff') {
                setForm(p => ({ ...p, destination: `${latLng.lat.toFixed(4)}, ${latLng.lng.toFixed(4)}`, destinationCoords: latLng }));
                setSelectingMapField(null);
              }
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

function RideHistoryTab({ history, loading, onRefresh }) {
  const [selectedRide, setSelectedRide] = useState(null);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <GlassCard level={2} className="p-6 md:p-10">
        <h3 className="text-2xl font-bold mb-8">Recent Journeys</h3>
        {loading ? <div className="py-20 text-center"><Spinner /></div> : (
          <div className="flex flex-col gap-4">
            {history.map(ride => (
              <RideHistoryItem key={ride.ride_id} ride={ride} onRate={() => setSelectedRide(ride)} />
            ))}
            {history.length === 0 && (
              <EmptyState 
                icon={Car} 
                title="No rides yet" 
                subtitle="Your journey history is waiting to be written. Book your first ride today!" 
              />
            )}
          </div>
        )}
      </GlassCard>

      <AnimatePresence>
        {selectedRide && (
          <RatingModal 
            ride={selectedRide} 
            onClose={() => setSelectedRide(null)} 
            onSuccess={() => {
              setSelectedRide(null);
              onRefresh();
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function RideHistoryItem({ ride, onRate }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass-1 rounded-2xl overflow-hidden border border-white/5">
      <div 
        onClick={() => setExpanded(!expanded)}
        className="p-5 md:p-8 flex flex-col md:flex-row md:items-center justify-between cursor-pointer gap-6"
      >
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
            <Car size={22} className={ride.status === 'Completed' ? 'text-[var(--amber-core)]' : 'text-[var(--text-muted)]'} />
          </div>
          <div>
            <div className="text-base md:text-lg font-bold mb-1 truncate max-w-[200px] md:max-w-xs">
              {ride.pickup_location.split(',')[0]} → {ride.dropoff_location?.split(',')[0] || '...'}
            </div>
            <div className="text-xs md:text-sm text-[var(--text-muted)]">
              {new Date(ride.request_time).toLocaleDateString()} • {ride.vehicle_type}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between md:justify-end gap-8">
          <div className="text-right">
            <div className="font-mono font-bold text-lg mb-1">PKR {parseFloat(ride.fare || 0).toFixed(2)}</div>
            <Badge status={ride.status === 'Completed' ? 'Active' : 'Error'}>{ride.status}</Badge>
          </div>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} className="hidden md:block">
            <ArrowRight size={18} className="rotate-90 opacity-30" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5 bg-black/20"
          >
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="label-caps text-[10px] mb-4">Trip Timeline</p>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-[var(--text-muted)]">
                      <Clock size={14} /> <span>Requested: {new Date(ride.request_time).toLocaleTimeString()}</span>
                    </div>
                    {ride.start_time && (
                      <div className="flex items-center gap-3 text-[var(--text-muted)]">
                        <Navigation size={14} /> <span>Started: {new Date(ride.start_time).toLocaleTimeString()}</span>
                      </div>
                    )}
                    {ride.end_time && (
                      <div className="flex items-center gap-3 text-[var(--text-primary)] font-medium">
                        <CheckCircle size={14} /> <span>Ended: {new Date(ride.end_time).toLocaleTimeString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="label-caps text-[10px] mb-4">Rating & Feedback</p>
                  {ride.rider_has_rated ? (
                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-[10px] text-[var(--text-muted)] mb-2 uppercase tracking-widest">Your Rating</p>
                      <RatingStars value={ride.rider_rating_score || 5} size="sm" />
                      {ride.rider_rating_comment && <p className="text-sm mt-3 italic text-[var(--text-secondary)]">"{ride.rider_rating_comment}"</p>}
                    </div>
                  ) : (
                    ride.status === 'Completed' && ride.payment_status === 'Paid' ? (
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onRate(); }} className="w-full text-[var(--amber-core)] bg-amber-ghost">
                        Rate Your Experience
                      </Button>
                    ) : (
                      <p className="text-sm text-[var(--text-muted)]">Rating unavailable</p>
                    )
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
      toast.success("Rating submitted!");
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit rating");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6">
      <motion.div 
        initial={{ y: '100%' }} 
        animate={{ y: 0 }} 
        className="w-full max-w-lg bg-[var(--bg-deep)] rounded-t-[32px] sm:rounded-[32px] border-t sm:border border-white/10 p-8 md:p-12 relative"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-[var(--text-muted)]"><X size={24} /></button>
        
        <div className="w-16 h-16 rounded-2xl bg-amber-ghost flex items-center justify-center text-[var(--amber-core)] mx-auto mb-6">
          <Star size={32} />
        </div>
        
        <h3 className="text-2xl font-bold text-center mb-2">Rate Your Trip</h3>
        <p className="text-[var(--text-muted)] text-center text-sm mb-10">How was your ride to {ride.dropoff_location?.split(',')[0]}?</p>
        
        <div className="flex justify-center mb-8">
          <RatingStars mode="input" size="lg" value={score} onChange={setScore} />
        </div>
        
        <textarea 
          placeholder="Share your experience..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-sm h-32 resize-none mb-8 focus:border-[var(--amber-core)] outline-none transition-colors"
        />
        
        <Button className="w-full py-5 text-lg font-bold" onClick={handleSubmit} disabled={loading}>
          {loading ? <Spinner size={20} /> : 'Submit Review'}
        </Button>
      </motion.div>
    </div>
  );
}

function WalletTab({ balance, onRefresh }) {
  const [amount, setAmount] = useState('');
  const { loading, execute } = useApi();

  const handleTopUp = async () => {
    if (!amount || isNaN(amount)) return toast.error('Enter valid amount');
    await execute(() => walletService.topUp({ amount: parseFloat(amount) }), {
      successMessage: 'Wallet recharged successfully',
      onSuccess: () => {
        setAmount('');
        onRefresh();
      }
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-8">
        <GlassCard level={2} className="p-8 md:p-12">
          <h3 className="text-xl font-bold mb-8">Balance Details</h3>
          <div className="bg-amber-ghost/20 p-10 rounded-[32px] text-center mb-10 border border-amber-ghost/10">
            <p className="label-caps text-[var(--amber-core)] mb-4">Available Credit</p>
            <h2 className="text-5xl md:text-6xl font-black text-[var(--amber-core)]">PKR {Number(balance || 0).toFixed(2)}</h2>
          </div>
          <div className="space-y-4">
            <Input placeholder="Amount to Top Up" type="number" value={amount} onChange={e => setAmount(e.target.value)} className="text-center text-lg" />
            <Button className="w-full py-4 font-bold" onClick={handleTopUp} disabled={loading}>
              {loading ? <Spinner /> : 'Recharge Wallet'}
            </Button>
          </div>
        </GlassCard>

        <GlassCard level={2} className="p-8 md:p-12">
          <h3 className="text-xl font-bold mb-8">Transaction History</h3>
          <TransactionsList />
        </GlassCard>
      </div>
    </motion.div>
  );
}

function TransactionsList() {
  const [txns, setTxns] = useState([]);
  const { loading, execute } = useApi();

  useEffect(() => {
    execute(() => walletService.getTransactions(), { showSuccessToast: false })
      .then(res => res && setTxns(res.data || []));
  }, []);

  if (loading && txns.length === 0) return <div className="py-20 text-center"><Spinner /></div>;

  return (
    <div className="flex flex-col gap-4">
      {txns.map(t => (
        <div key={t.transaction_id} className="glass-1 p-5 rounded-2xl flex justify-between items-center border border-white/5">
          <div>
            <div className="text-sm font-bold mb-1">{t.transaction_type}</div>
            <div className="text-[10px] text-[var(--text-muted)]">{new Date(t.transaction_date).toLocaleString()}</div>
          </div>
          <div className="text-right">
            <div className={`font-mono font-bold text-lg ${t.transaction_type === 'Credit' ? 'text-green-500' : 'text-red-500'}`}>
              {t.transaction_type === 'Credit' ? '+' : '-'}PKR {parseFloat(t.amount).toFixed(2)}
            </div>
            <div className="text-[10px] text-[var(--text-muted)]">{t.payment_method || 'Wallet'}</div>
          </div>
        </div>
      ))}
      {txns.length === 0 && (
        <EmptyState 
          icon={Receipt} 
          title="No transactions yet" 
          subtitle="Your financial activity will appear here once you top up or take rides." 
        />
      )}
    </div>
  );
}

function AccountTab({ user }) {
  const [activeSubTab, setActiveSubTab] = useState('personal');
  const [profileForm, setProfileForm] = useState({ full_name: user?.full_name || '', phone: user?.phone || '' });
  const [passForm, setPassForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { loading, execute } = useApi();
  const { clearAuth } = useAuthStore();

  const isFormChanged = profileForm.full_name !== user?.full_name || profileForm.phone !== user?.phone;

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("File size must be less than 5MB");

    setUploading(true);
    try {
      const res = await uploadService.uploadProfilePhoto(file);
      useAuthStore.getState().setUser({ ...user, profile_photo: res.data.profile_photo });
      toast.success("Profile photo updated!");
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleUpdateProfile = async () => {
    await execute(() => authService.updateProfile(profileForm), {
      successMessage: "Profile updated!",
      onSuccess: (data) => {
        useAuthStore.getState().setUser({ ...user, ...data.data.user });
      }
    });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passForm.new_password !== passForm.confirm_password) return toast.error("Passwords do not match");

    await execute(() => authService.changePassword(passForm), {
      successMessage: "Password updated. Please log in again.",
      onSuccess: () => {
        setTimeout(() => {
          clearAuth();
          window.location.href = '/login';
        }, 2000);
      }
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
        <div className="flex md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0 scrollbar-hide">
          <button 
            onClick={() => setActiveSubTab('personal')} 
            className={`flex items-center gap-3 px-6 py-4 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeSubTab === 'personal' ? 'bg-amber-ghost text-[var(--amber-core)]' : 'text-[var(--text-muted)] hover:text-white'
            }`}
          >
            <User size={18} /> Personal Info
          </button>
          <button 
            onClick={() => setActiveSubTab('security')} 
            className={`flex items-center gap-3 px-6 py-4 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeSubTab === 'security' ? 'bg-amber-ghost text-[var(--amber-core)]' : 'text-[var(--text-muted)] hover:text-white'
            }`}
          >
            <Shield size={18} /> Security
          </button>
        </div>

        <GlassCard level={2} className="p-8 md:p-12">
          {activeSubTab === 'personal' ? (
            <div>
              <div className="flex flex-col sm:flex-row items-center gap-8 mb-12">
                <div className="relative w-28 h-28">
                  <div className="w-28 h-28 rounded-[32px] overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
                    {user?.profile_photo ? (
                      <img src={user.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-4xl font-black text-[var(--amber-core)]">{user?.full_name?.charAt(0)}</div>
                    )}
                  </div>
                  <label className="absolute inset-0 rounded-[32px] bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                    <Car size={24} className="text-white" />
                    <input type="file" hidden onChange={handlePhotoChange} accept="image/*" disabled={uploading} />
                  </label>
                  {uploading && (
                    <div className="absolute -bottom-4 left-0 right-0 h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div animate={{ width: `${progress}%` }} className="h-full bg-[var(--amber-core)]" />
                    </div>
                  )}
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-2xl font-bold mb-1">{user?.full_name}</h3>
                  <p className="text-[var(--text-muted)] text-sm">
                    Rider ID: #{user?.userId?.toString().slice(-6)} • Since {new Date(user?.registration_date).getFullYear()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                <Input label="Full Name" value={profileForm.full_name} onChange={e => setProfileForm(p => ({ ...p, full_name: e.target.value }))} />
                <Input label="Email Address" value={user?.email} disabled className="opacity-50" />
                <Input label="Phone Number" value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} />
                <div>
                  <label className="label-caps mb-2 block">Account Status</label>
                  <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/5">
                    <Badge status={user?.account_status === 'Active' ? 'Active' : 'Error'}>{user?.account_status}</Badge>
                  </div>
                </div>
              </div>

              <Button onClick={handleUpdateProfile} disabled={loading || !isFormChanged} className="w-full py-4">
                {loading ? <Spinner /> : 'Save Profile Changes'}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleChangePassword}>
              <h3 className="text-2xl font-bold mb-10">Update Security Credentials</h3>
              <div className="space-y-6 mb-10">
                <div className="relative">
                  <Input 
                    type={showPass ? 'text' : 'password'} 
                    label="Current Password" 
                    value={passForm.current_password} 
                    onChange={e => setPassForm(p => ({ ...p, current_password: e.target.value }))}
                    required 
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-10 text-[var(--text-muted)]">
                    <Zap size={18} />
                  </button>
                </div>

                <Input 
                  type="password" 
                  label="New Password" 
                  value={passForm.new_password} 
                  onChange={e => setPassForm(p => ({ ...p, new_password: e.target.value }))}
                  required 
                />
                
                <Input 
                  type="password" 
                  label="Confirm New Password" 
                  value={passForm.confirm_password} 
                  onChange={e => setPassForm(p => ({ ...p, confirm_password: e.target.value }))}
                  required 
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full py-4" variant="secondary">
                {loading ? <Spinner /> : 'Update Password & Re-login'}
              </Button>
            </form>
          )}
        </GlassCard>
      </div>
    </motion.div>
  );
}
