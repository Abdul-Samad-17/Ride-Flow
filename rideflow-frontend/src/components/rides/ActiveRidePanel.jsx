import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, MapPin, Navigation, Clock, User, Phone, 
  CheckCircle, DollarSign, Timer, Search, X, AlertTriangle
} from 'lucide-react';
import * as rideService from '../../services/rideService';
import * as ratingService from '../../services/ratingService';
import useRideStore from '../../store/rideStore';
import toast from 'react-hot-toast';
import RideMap from '../maps/RideMap';
import { GlassCard, Badge, Button, Spinner, RatingStars } from '../ui';

export default function ActiveRidePanel({ activeRide }) {
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState('00:00:00');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [rating, setRating] = useState({ score: 5, comment: '', submitted: false, loading: false });
  const { clearRide } = useRideStore();

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

  const handleSubmitRating = async () => {
    setRating(p => ({ ...p, loading: true }));
    try {
      await ratingService.submitRating({
        ride_id: activeRide.ride_id,
        score: rating.score,
        comment: rating.comment
      });
      setRating(p => ({ ...p, submitted: true }));
      toast.success("Feedback saved!");
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

  const handleAction = async (action) => {
    setLoading(true);
        try {
      if (action === 'arrive') {
        await rideService.confirmArrival(activeRide.ride_id);
        toast.success("Arrival confirmed! Waiting for rider.");
      } else if (action === 'start') {
        await rideService.startRide(activeRide.ride_id);
        toast.success("Trip started. Drive safe!");
      } else if (action === 'destination') {
        await rideService.confirmDestination(activeRide.ride_id);
        setShowConfirmModal(false);
        toast.success("Destination reached! Calculating final fare.");
      } else if (action === 'cancel') {
        await rideService.cancelRide(activeRide.ride_id);
        toast.success("Ride cancelled.");
        clearRide();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[800px] mx-auto px-4 md:px-0">
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-[#050508]/85 backdrop-blur-xl flex items-end sm:items-center justify-center p-0 sm:p-6"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full max-w-md bg-[var(--bg-deep)] rounded-t-[32px] sm:rounded-[32px] border-t sm:border border-white/10"
            >
              <GlassCard 
                level={3} 
                className="p-8 md:p-12 text-center border-none"
              >
                <div className="w-16 h-16 rounded-2xl bg-amber-ghost flex items-center justify-center text-[var(--amber-core)] mx-auto mb-6">
                  <Navigation size={32} />
                </div>
                
                <h3 className="text-2xl font-bold mb-3 text-white">REACHED DESTINATION?</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-10">
                  Please confirm you have arrived at <br/>
                  <span className="text-white font-semibold">{activeRide.dropoff_location}</span>.
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant="secondary" 
                    onClick={() => setShowConfirmModal(false)}
                    className="bg-white/5"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => handleAction('destination')} 
                    disabled={loading}
                    className="font-bold"
                  >
                    {loading ? <Spinner size={18} /> : "Confirm"}
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <GlassCard 
        level={2} 
        className={`p-6 md:p-10 ${activeRide.status === 'Arrived at Pickup' ? 'border-2 border-[var(--amber-core)] animate-pulse-subtle' : 'border-white/5'}`}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
          <div className="flex gap-5 items-center">
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-[var(--amber-core)] border border-white/10">
              <User size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">{activeRide.rider?.name}</h3>
              <Badge status={activeRide.status === 'Completed' ? 'Warning' : 'Active'}>
                {activeRide.status === 'Completed' ? 'WAITING FOR PAYMENT' : activeRide.status.toUpperCase()}
              </Badge>
            </div>
          </div>
          <div className="w-full sm:w-auto">
            <a href={`tel:${activeRide.rider?.phone}`} className="flex items-center justify-center sm:justify-end gap-3 text-[var(--amber-core)] font-bold bg-amber-ghost/30 py-3 px-6 rounded-xl border border-amber-ghost/20">
              <Phone size={18} /> {activeRide.rider?.phone}
            </a>
          </div>
        </div>

        {/* Status Specific Info */}
        <AnimatePresence mode="wait">
          {activeRide.status === 'Completed' ? (
            <motion.div key="completed-view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-amber-ghost/20 p-8 rounded-2xl text-center mb-10 border border-amber-ghost/10">
                <Clock size={32} color="var(--amber-core)" className="animate-spin-slow mx-auto mb-4" />
                <h4 className="text-lg font-bold mb-2">Waiting for Rider Payment</h4>
                <p className="text-sm text-[var(--text-secondary)]">
                  Est. Earnings: <strong className="text-[var(--amber-core)]">PKR {((activeRide.final_fare || 0) * 0.8).toFixed(2)}</strong>
                </p>
                {activeRide.payment_status === 'Paid' && (
                  <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="mt-6 text-green-500 font-black text-lg flex items-center justify-center gap-2">
                    <CheckCircle size={20} />
                    PAYMENT RECEIVED!
                  </motion.div>
                )}
              </div>

              {activeRide.payment_status === 'Paid' && !rating.submitted && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-1 p-8 rounded-2xl mb-10 text-center border border-white/5">
                  <p className="mb-6 text-sm font-bold">How was {activeRide.rider?.name} as a passenger?</p>
                  <div className="flex justify-center mb-8">
                    <RatingStars mode="input" size="lg" value={rating.score} onChange={val => setRating(p => ({ ...p, score: val }))} />
                  </div>
                  <textarea 
                    placeholder="Optional: Note about this rider..."
                    value={rating.comment}
                    onChange={e => setRating(p => ({ ...p, comment: e.target.value }))}
                    maxLength={200}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm h-24 resize-none mb-8 focus:border-[var(--amber-core)] outline-none"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="secondary" onClick={() => setRating(p => ({ ...p, submitted: true }))} className="w-full">Skip</Button>
                    <Button onClick={handleSubmitRating} disabled={rating.loading} className="w-full">
                      {rating.loading ? <Spinner size={18} /> : 'Submit'}
                    </Button>
                  </div>
                </motion.div>
              )}

              {activeRide.payment_status === 'Paid' && rating.submitted && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-6 bg-amber-ghost/20 rounded-2xl mb-10 text-[var(--amber-core)] font-bold">
                  Feedback shared! ⭐
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div key="active-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                <div className="glass-1 p-6 rounded-2xl border border-white/5">
                  <p className="label-caps text-[10px] mb-3">{activeRide.status === 'In Progress' ? 'Time Elapsed' : 'Pickup Address'}</p>
                  {activeRide.status === 'In Progress' ? (
                    <h2 className="font-mono text-3xl text-[var(--amber-core)] font-black">{timer}</h2>
                  ) : (
                    <p className="text-sm font-semibold leading-relaxed">{activeRide.pickup_location}</p>
                  )}
                </div>
                <div className="glass-1 p-6 rounded-2xl border border-white/5">
                  <p className="label-caps text-[10px] mb-3">Target Destination</p>
                  <p className="text-sm font-semibold leading-relaxed">{activeRide.dropoff_location}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4">
          {(activeRide.status === 'Accepted' || activeRide.status === 'Driver En Route') && (
            <Button className="w-full py-5 text-lg font-bold" onClick={() => handleAction('arrive')} disabled={loading}>
              {loading ? <Spinner size={20} /> : "I'VE ARRIVED AT PICKUP"}
            </Button>
          )}

          {activeRide.status === 'Arrived at Pickup' && (
            <Button className="w-full py-5 text-lg font-bold" onClick={() => handleAction('start')} disabled={loading}>
              {loading ? <Spinner size={20} /> : "PASSENGER IS IN — START RIDE"}
            </Button>
          )}

          {activeRide.status === 'In Progress' && (
            <Button className="w-full py-5 text-lg font-bold" onClick={() => setShowConfirmModal(true)}>
              I'VE REACHED DESTINATION
            </Button>
          )}

          {activeRide.payment_status === 'Paid' && (
            <Button className="w-full py-5 text-lg font-bold" onClick={() => { clearRide(); window.location.reload(); }}>
              BACK TO DASHBOARD
            </Button>
          )}

          {(!['In Progress', 'Completed'].includes(activeRide.status)) && (
            <Button variant="ghost" className="w-full text-red-500 font-bold mt-2" onClick={() => handleAction('cancel')} disabled={loading}>
              Cancel Ride
            </Button>
          )}
        </div>
      </GlassCard>

      <div className="h-[300px] md:h-[400px] mt-10 rounded-[32px] overflow-hidden border border-white/5">
        <RideMap 
          pickup={{ lat: Number(activeRide.pickup_lat), lng: Number(activeRide.pickup_lng) }}
          dropoff={{ lat: Number(activeRide.dropoff_lat), lng: Number(activeRide.dropoff_lng) }}
        />
      </div>
    </div>
  );
}
