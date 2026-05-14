import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, MapPin, Navigation, Clock, CreditCard, Star, Phone, 
  CheckCircle, ChevronRight, Wallet, Zap, Timer, Receipt, Search
} from 'lucide-react';
import { GlassCard, Badge, Button, Input, Spinner, RatingStars } from '../ui';
import * as rideService from '../../services/rideService';
import * as ratingService from '../../services/ratingService';
import useRideStore from '../../store/rideStore';
import toast from 'react-hot-toast';
import RideMap from '../maps/RideMap';

const STEPS = [
  { status: 'Requested', label: 'Finding your driver...', icon: Search },
  { status: 'Accepted', label: 'Driver is on the way', icon: Car },
  { status: 'Arrived at Pickup', label: 'Driver has arrived!', icon: MapPin },
  { status: 'In Progress', label: "You're on your way!", icon: Navigation },
  { status: 'Completed', label: "You've arrived!", icon: CheckCircle }
];

export default function ActiveRideTracker({ activeRide, onPaymentSuccess }) {
  const [promoCode, setPromoCode] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [timer, setTimer] = useState('00:00:00');
  const [rating, setRating] = useState({ score: 5, comment: '', submitted: false, loading: false });
  const { clearRide } = useRideStore();

  const currentStepIndex = STEPS.findIndex(s => s.status === activeRide.status || (activeRide.status === 'Driver En Route' && s.status === 'Accepted'));

  // Trip Timer Logic
  useEffect(() => {
    if (activeRide.status === 'In Progress' && activeRide.start_time) {
      const start = new Date(activeRide.start_time).getTime();
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const diff = now - start;
        const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
        const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
        const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
        setTimer(`${h}:${m}:${s}`);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeRide.status, activeRide.start_time]);

  const handleProcessPayment = async () => {
    setIsPaying(true);
    try {
      const res = await rideService.processRidePayment(activeRide.ride_id, { promo_code: promoCode });
      setReceipt(res.data.data);
      if (onPaymentSuccess) onPaymentSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setIsPaying(false);
    }
  };

  const handleSubmitRating = async () => {
    setRating(p => ({ ...p, loading: true }));
    try {
      await ratingService.submitRating({
        ride_id: activeRide.ride_id,
        score: rating.score,
        comment: rating.comment
      });
      setRating(p => ({ ...p, submitted: true }));
      toast.success("Thank you for your feedback!");
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.message?.includes('already rated')) {
        setRating(p => ({ ...p, submitted: true }));
      } else {
        toast.error("Failed to submit rating");
      }
    } finally {
      setRating(p => ({ ...p, loading: false }));
    }
  };

  if (receipt) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <GlassCard level={3} style={{ padding: '40px', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            transition={{ type: 'spring', damping: 12 }}
            style={{ width: '80px', height: '80px', background: '#22C55E', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'white' }}
          >
            <CheckCircle size={40} />
          </motion.div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Payment Successful</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Thank you for riding with RideFlow!</p>
          
          <div className="glass-1" style={{ padding: '24px', textAlign: 'left', marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Amount Paid</span>
              <span className="font-mono" style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--amber-core)' }}>PKR {parseFloat(receipt.final_amount_paid).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Transaction ID</span>
              <span style={{ color: 'var(--text-secondary)' }}>#TXN-{receipt.payment_id}</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!rating.submitted ? (
              <motion.div key="rating-form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="glass-1" style={{ padding: '24px', marginBottom: '32px', textAlign: 'center' }}>
                  <p style={{ marginBottom: '16px', fontSize: '14px', fontWeight: 600 }}>How was your ride with {activeRide.driver?.name}?</p>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                    <RatingStars mode="input" size="lg" value={rating.score} onChange={val => setRating(p => ({ ...p, score: val }))} />
                  </div>
                  <textarea 
                    placeholder="Optional: Share your experience..."
                    value={rating.comment}
                    onChange={e => setRating(p => ({ ...p, comment: e.target.value }))}
                    maxLength={200}
                    style={{ 
                      width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '12px', padding: '12px', color: 'white', fontSize: '14px', resize: 'none', height: '80px', marginBottom: '16px'
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Button block onClick={handleSubmitRating} disabled={rating.loading}>
                      {rating.loading ? <Spinner size={18} /> : 'Submit Rating'}
                    </Button>
                    <button onClick={() => setRating(p => ({ ...p, submitted: true }))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer' }}>Skip for now</button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="rating-thanks" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ marginBottom: '32px' }}>
                <div style={{ padding: '24px', background: 'var(--amber-ghost)', borderRadius: '16px', color: 'var(--amber-core)', fontWeight: 600 }}>
                  Thanks for your feedback! ⭐
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button block variant="secondary" onClick={() => clearRide()}>Done</Button>
        </GlassCard>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-[800px] mx-auto px-4 md:px-0">
      {/* Progress Bar - Scrollable on Mobile */}
      <div className="flex justify-between items-center mb-10 md:mb-16 relative overflow-x-auto pb-6 scrollbar-hide">
        <div className="absolute top-[15px] left-[40px] right-[40px] h-[2px] bg-white/5 z-0 min-w-[500px] md:min-w-0" />
        
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          return (
            <div key={step.status} className="relative z-[1] text-center min-w-[100px] flex-shrink-0">
              <motion.div 
                animate={isCurrent ? { scale: [1, 1.1, 1], boxShadow: ['0 0 0px var(--amber-ghost)', '0 0 20px var(--amber-ghost)', '0 0 0px var(--amber-ghost)'] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{ 
                  width: '32px', height: '32px', borderRadius: '50%', margin: '0 auto 12px',
                  background: isCompleted || isCurrent ? 'var(--amber-core)' : 'var(--bg-deep)',
                  border: isCompleted || isCurrent ? 'none' : '2px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: isCompleted || isCurrent ? '#050508' : 'var(--text-muted)'
                }}
              >
                {isCompleted ? <CheckCircle size={16} /> : <step.icon size={16} />}
              </motion.div>
              <p style={{ fontSize: '10px', fontWeight: 600, color: isCurrent ? 'var(--amber-core)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{step.status}</p>
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* Step-Specific Content */}
        {activeRide.status === 'Requested' && (
          <motion.div key="requested" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard level={2} className="p-8 md:p-12 text-center">
              <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 32px' }}>
                <motion.div 
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  style={{ position: 'absolute', inset: 0, background: 'var(--amber-ghost)', borderRadius: '50%' }}
                />
                <div style={{ position: 'relative', width: '100%', height: '100%', background: 'var(--amber-ghost)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--amber-core)', border: '1px solid var(--amber-ghost)' }}>
                  <Search size={40} className="animate-pulse" />
                </div>
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>Finding your driver...</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>We're matching you with the best captain nearby.</p>
              
              <Button variant="ghost" className="w-full sm:w-auto" onClick={async () => {
                try {
                  await rideService.cancelRide(activeRide.ride_id);
                  toast.success("Request cancelled.");
                  clearRide();
                } catch (e) {
                  toast.error(e.response?.data?.message || "Cancellation failed");
                }
              }} style={{ color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                Cancel Request
              </Button>
            </GlassCard>
          </motion.div>
        )}

        {(activeRide.status === 'Accepted' || activeRide.status === 'Driver En Route') && (
          <motion.div key="driver-en-route" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard level={2} className="border-amber-ghost p-6 md:p-10">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8">
                <div>
                  <h3 style={{ fontSize: '1.4rem', color: 'white', marginBottom: '4px' }}>{activeRide.driver?.name || 'Driver Found'}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', color: 'var(--amber-core)' }}>
                      {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < Math.floor(activeRide.driver?.rating || 5) ? "currentColor" : "none"} />)}
                    </div>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{activeRide.driver?.total_trips || '0'} trips</span>
                  </div>
                </div>
                <a href={`tel:${activeRide.driver?.phone}`} className="w-12 h-12 rounded-xl bg-[var(--amber-ghost)] text-[var(--amber-core)] flex items-center justify-center">
                  <Phone size={20} />
                </a>
              </div>

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0 0 24px' }} />

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: activeRide.vehicle?.color || 'white', border: '1px solid rgba(255,255,255,0.2)' }} />
                  <div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <Badge status="Warning" style={{ fontSize: '10px' }}>{activeRide.vehicle?.type}</Badge>
                      <span style={{ fontWeight: 600 }}>{activeRide.vehicle?.make} {activeRide.vehicle?.model}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-[#050508] px-4 py-2 rounded-lg border border-amber-ghost/50 font-mono text-[var(--amber-core)] font-bold">
                  {activeRide.vehicle?.plate}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <div className="flex-1 p-4 bg-amber-ghost/30 rounded-xl text-center border border-amber-ghost/20">
                  <p className="text-[var(--amber-core)] text-sm font-semibold">
                    Est. Fare: <span className="font-mono">PKR {parseFloat(activeRide.fare_estimated).toFixed(2)}</span>
                  </p>
                </div>
                <Button variant="ghost" className="w-full sm:w-auto text-[#EF4444] bg-red-500/5" onClick={async () => {
                  try {
                    await rideService.cancelRide(activeRide.ride_id);
                    toast.success("Ride cancelled.");
                    clearRide();
                  } catch (e) {
                    toast.error(e.response?.data?.message || "Cancellation failed");
                  }
                }}>
                  Cancel
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {activeRide.status === 'Arrived at Pickup' && (
          <motion.div key="arrived" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <GlassCard level={2} className="p-8 md:p-12 text-center border-2 border-[var(--amber-core)] animate-pulse-subtle">
              <div style={{ width: '64px', height: '64px', background: 'var(--amber-core)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#050508', margin: '0 auto 20px' }}>
                <Car size={32} />
              </div>
              <h3 style={{ fontSize: '1.6rem', marginBottom: '12px' }}>Your driver has arrived!</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Please proceed to the pickup point at:</p>
              <p style={{ color: 'var(--amber-core)', fontWeight: 600, fontSize: '1.1rem' }}>{activeRide.pickup_location}</p>
            </GlassCard>
          </motion.div>
        )}

        {activeRide.status === 'In Progress' && (
          <motion.div key="in-progress" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <GlassCard level={2} className="p-8 md:p-12 text-center">
              <div className="mb-10">
                <p className="label-caps mb-4">Trip Time</p>
                <h2 className="font-mono text-5xl md:text-6xl text-[var(--amber-core)]">{timer}</h2>
              </div>
              <div className="bg-white/5 p-6 rounded-2xl text-left border border-white/5">
                <div className="flex gap-4 items-center">
                  <Navigation size={18} color="var(--amber-core)" />
                  <div>
                    <p className="text-[10px] text-[var(--text-muted)] tracking-widest uppercase">DESTINATION</p>
                    <p className="text-sm font-semibold leading-relaxed">{activeRide.dropoff_location}</p>
                  </div>
                </div>
              </div>
              <p className="mt-8 text-[var(--text-muted)] text-sm">Enjoy your premium journey 🎵</p>
            </GlassCard>
          </motion.div>
        )}

        {activeRide.status === 'Cancelled' && (
          <motion.div key="cancelled" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <GlassCard level={2} className="p-10 md:p-16 text-center border border-red-500/20">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-[#EF4444] mx-auto mb-8">
                <Zap size={40} />
              </div>
              <h2 className="text-3xl mb-4">Ride Cancelled</h2>
              <p className="text-[var(--text-muted)] text-base mb-10 max-w-sm mx-auto">
                This ride has been cancelled. If you were charged a hold amount, it has been released back to your wallet.
              </p>
              <Button className="w-full" onClick={() => clearRide()}>
                Book Another Ride
              </Button>
            </GlassCard>
          </motion.div>
        )}

        {activeRide.status === 'Completed' && (
          <motion.div key="completed" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard level={2} className="p-8 md:p-12">
              <div className="text-center mb-10">
                <CheckCircle size={48} color="var(--amber-core)" className="mx-auto mb-6" />
                <h3 className="text-3xl">You've Arrived!</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="glass-1 p-5 rounded-xl border border-white/5">
                  <p className="label-caps text-[10px] mb-1">Distance</p>
                  <p className="text-lg font-bold">{activeRide.actual_distance_km} km</p>
                </div>
                <div className="glass-1 p-5 rounded-xl border border-white/5">
                  <p className="label-caps text-[10px] mb-1">Duration</p>
                  <p className="text-lg font-bold">{activeRide.actual_duration_minutes} min</p>
                </div>
              </div>

              <div className="mb-10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[var(--text-muted)]">Estimated Fare</span>
                  <span className="text-[var(--text-muted)] line-through">PKR {parseFloat(activeRide.fare_estimated).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Final Fare</span>
                  <span className="font-mono text-4xl text-[var(--amber-core)] font-black">PKR {parseFloat(activeRide.final_fare).toFixed(2)}</span>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex gap-3 mb-6">
                  <Input 
                    placeholder="Promo Code" 
                    value={promoCode} 
                    onChange={e => setPromoCode(e.target.value.toUpperCase())}
                    className="flex-1"
                  />
                </div>
                <Button className="w-full py-5 text-lg" onClick={handleProcessPayment} disabled={isPaying}>
                  {isPaying ? <Spinner size={20} /> : 'PAY NOW WITH WALLET'}
                </Button>
              </div>

              <div className="flex justify-center items-center gap-3 text-sm text-[var(--text-muted)]">
                <Wallet size={14} />
                <span>Payment Method: <strong>Wallet</strong></span>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shared Map - Responsive Height */}
      <div className="h-[300px] md:h-[400px] mt-10 rounded-[32px] overflow-hidden border border-white/5">
        <RideMap 
          pickup={{ lat: Number(activeRide.pickup_lat), lng: Number(activeRide.pickup_lng) }}
          dropoff={{ lat: Number(activeRide.dropoff_lat), lng: Number(activeRide.dropoff_lng) }}
        />
      </div>
    </div>
  );
}
