// src/pages/Landing.jsx
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Star, CheckCircle2, ChevronRight, User } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import HeroCarScene from '../components/landing/HeroCarScene';
import useAuthStore from '../store/authStore';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] },
});

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const handleBook = () => {
    if (isAuthenticated) {
      const routes = { Rider: '/dashboard/rider', Driver: '/dashboard/driver', Admin: '/dashboard/admin' };
      navigate(routes[user?.role] || '/');
    } else {
      navigate('/register');
    }
  };

  const handleJoinFleet = () => {
    if (isAuthenticated && user?.role === 'Driver') {
      navigate('/dashboard/driver');
    } else if (isAuthenticated) {
      navigate('/'); // Or show a message
    } else {
      navigate('/register?role=Driver');
    }
  };

  return (
    <div style={{ background: 'var(--bg-void)', minHeight: '100vh', color: 'var(--text-primary)', overflowX: 'hidden' }}>
      <Navbar />

      {/* ── HERO SECTION ────────────────────────────────────────── */}
      <section className="relative min-h-[100svh] md:h-screen flex items-center pt-32 md:pt-0 overflow-hidden">
        <div className="hidden md:block absolute inset-0">
          <HeroCarScene />
        </div>
        
        <div className="container relative z-[100] w-full">
          <div className="flex flex-col md:flex-row items-center">
            <div className="w-full md:w-[55%] text-left">
              <motion.div {...fadeUp(0.1)}>
                <p className="label-caps" style={{ color: 'var(--amber-core)', marginBottom: '24px', fontSize: '11px', letterSpacing: '0.6em', fontWeight: 700 }}>THE ZENITH OF URBAN MOBILITY</p>
                <h1 className="text-hero" style={{ lineHeight: '0.8', marginBottom: '48px', fontWeight: 900, letterSpacing: '-0.04em', textTransform: 'uppercase', color: '#F0EDE8' }}>
                  ARRIVE IN<br />YOUR<br /><span style={{ color: 'var(--amber-core)' }}>ELEMENT</span>
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '480px', lineHeight: '2.1', marginBottom: '64px' }}>
                  Experience the zenith of luxury mobility. Precision engineering meets uncompromising comfort for those who demand more than just a journey.
                </p>
                <div className="flex flex-col sm:flex-row gap-6 md:gap-8 w-full sm:w-auto">
                  <button className="btn-primary w-full sm:w-auto" style={{ padding: '20px 56px', fontSize: '13px' }} onClick={handleBook}>Book Your Experience</button>
                  <button className="btn-secondary w-full sm:w-auto" style={{ padding: '20px 56px', fontSize: '13px' }} onClick={handleJoinFleet}>Join Fleet</button>
                </div>
              </motion.div>
            </div>

            {/* Mobile Car Image */}
            <motion.div 
              {...fadeUp(0.3)}
              className="md:hidden w-full mt-16 relative"
            >
              <img 
                src="https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1200&q=80" 
                alt="Premium Car"
                className="w-full h-[45vw] object-cover rounded-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050508] to-transparent" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── THE RIDEFLOW METHOD ─────────────────────────────────── */}
      <section className="py-24 md:py-48" style={{ borderTop: '1px solid rgba(255,255,255,0.02)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h2 className="text-display" style={{ letterSpacing: '0.4em', marginBottom: '24px' }}>THE RIDEFLOW METHOD</h2>
            <div style={{ width: '80px', height: '2px', background: 'var(--amber-core)', margin: '0 auto' }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              { id: '01', title: 'DISCOVERY', desc: 'Select your preference from our curated fleet of ultra-premium electric and performance vehicles via our encrypted portal.' },
              { id: '02', title: 'PRECISION MATCH', desc: 'Our AI-driven logistics engine assigns a certified pilot and optimizes the route for zero-interruption transit.' },
              { id: '03', title: 'ARRIVAL', desc: 'Step into an environment tailored to your exact specifications—temperature, lighting, and acoustics preset.' }
            ].map((step, i) => (
              <motion.div 
                key={i} 
                {...fadeUp(0.2 + i * 0.1)} 
                className="p-10 md:p-14 bg-[#0A0A0F] border border-white/5 relative transition-all duration-300 hover:border-[var(--amber-core)]"
              >
                <div className="font-mono text-3xl md:text-4xl" style={{ color: 'var(--amber-core)', fontWeight: 600, marginBottom: '24px' }}>{step.id}</div>
                <h3 style={{ fontSize: '20px', marginBottom: '16px', color: 'var(--text-primary)' }}>{step.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.8' }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CURATED FLEET ───────────────────────────────────────── */}
      <section id="fleet" className="pb-24 md:pb-48">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16 md:mb-32">
            <div>
              <p className="label-caps" style={{ color: 'var(--amber-core)', marginBottom: '20px', fontSize: '11px', letterSpacing: '0.3em' }}>OUR EXCLUSIVE RANGE</p>
              <h2 className="text-display">CURATED FLEET</h2>
            </div>
            <button className="flex items-center gap-3 text-[11px] text-[var(--amber-core)] tracking-[0.3em] font-bold">
              SELECT CATEGORY <ChevronRight size={18} />
            </button>
          </div>
          
          <div className="relative">
            {/* Horizontal Scroll on Mobile, Grid on Tablet/Desktop */}
            <div className="
              flex overflow-x-auto snap-x snap-mandatory gap-6 pb-6
              md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-8 md:pb-0
              scrollbar-hide
            "
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
            >
              {[
                { title: 'Exotic Bike', tag: 'FULL ELECTRIC', img: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1200&q=80' },
                { title: 'Grand Tourer', tag: 'ULTRA LUXURY', img: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80' },
                { title: 'Urban Stealth', tag: 'ARMOURED OPTION', img: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1200&q=80' }
              ].map((car, i) => (
                <motion.div 
                  key={i} 
                  {...fadeUp(i * 0.1)} 
                  className={`
                    relative h-[500px] md:h-[650px] lg:h-[750px] overflow-hidden border border-white/5 snap-start flex-shrink-0 w-[85%] md:w-auto
                    ${i === 2 ? 'md:col-span-2 lg:col-span-1' : ''}
                  `}
                >
                  <img src={car.img} alt={car.title} className="w-full h-full object-cover opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-transparent to-transparent" />
                  <div className="absolute bottom-10 left-10 md:bottom-16 md:left-16">
                    <h4 className="text-2xl md:text-3xl mb-4">{car.title}</h4>
                    <div className="flex items-center gap-3 text-[10px] md:text-[11px] text-[var(--amber-core)] font-extrabold tracking-[0.2em]">
                      <div className="w-2 h-2 rounded-full bg-[var(--amber-core)]" />{car.tag}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Amber Dot Indicators (Mobile Only) */}
            <div className="flex justify-center gap-3 mt-8 md:hidden">
              {[0, 1, 2].map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full border border-[var(--amber-core)] ${i === 0 ? 'bg-[var(--amber-core)]' : 'bg-transparent'}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SAFETY & EXCLUSIVITY ────────────────────────────────── */}
      <section className="py-24 md:py-48 bg-white/[0.005]" style={{ borderTop: '1px solid rgba(255,255,255,0.02)' }}>
        <div className="container">
          {/* Section 1 */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-12 md:gap-32 items-center mb-32 md:mb-60">
            <motion.div {...fadeUp(0.3)} className="order-1 md:order-2 h-[400px] md:h-[600px] overflow-hidden border border-white/5">
              <img src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&q=80" alt="Safety" className="w-full h-full object-cover opacity-60" />
            </motion.div>
            <motion.div {...fadeUp(0.1)} className="order-2 md:order-1">
              <div style={{ width: '50px', height: '2px', background: 'var(--amber-core)', marginBottom: '32px' }} />
              <h2 className="text-display mb-8 md:mb-12 leading-tight">FORTRESS ON<br />WHEELS</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '17px', lineHeight: '2.1', marginBottom: '40px' }}>Every vehicle undergoes rigorous 110-point safety inspections. Our pilots are trained in advanced defensive driving.</p>
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-6 text-[16px] color-[var(--text-secondary)]"><Shield size={22} color="var(--amber-core)" /> Biometric monitoring</div>
                <div className="flex items-center gap-6 text-[16px] color-[var(--text-secondary)]"><Zap size={22} color="var(--amber-core)" /> End-to-end encryption</div>
              </div>
            </motion.div>
          </div>

          {/* Section 2 */}
          <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-12 md:gap-32 items-center">
            <motion.div {...fadeUp(0.1)} className="h-[400px] md:h-[600px] overflow-hidden border border-white/5">
              <img src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&q=80" alt="Exclusivity" className="w-full h-full object-cover opacity-80" />
            </motion.div>
            <motion.div {...fadeUp(0.3)}>
              <div style={{ width: '50px', height: '2px', background: 'var(--amber-core)', marginBottom: '32px' }} />
              <h2 className="text-display mb-8 md:mb-12 leading-tight">CABIN OF THE<br />FUTURE</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '17px', lineHeight: '2.1', marginBottom: '40px' }}>Personalized climate, curated sound profiles, and spatial audio system. Sanctuary in motion.</p>
              <div className="flex gap-4 md:gap-8">
                <div className="bg-[#0A0A0F] border border-white/5 p-8 md:p-12 flex-1 text-center">
                  <Zap size={28} color="var(--amber-core)" className="mx-auto mb-4" />
                  <div className="text-[10px] font-black tracking-widest">ULTRA-HD</div>
                </div>
                <div className="bg-[#0A0A0F] border border-white/5 p-8 md:p-12 flex-1 text-center">
                  <Star size={28} color="var(--amber-core)" className="mx-auto mb-4" />
                  <div className="text-[10px] font-black tracking-widest">HI-RES</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="pt-24 md:pt-40 pb-12 md:pb-20" style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-[2.5fr_1fr_1fr_1fr] gap-12 md:gap-32 mb-20 md:mb-40">
            <div className="text-center md:text-left">
              <h2 className="text-3xl md:text-4xl text-[#F0EDE8] font-extrabold mb-8 md:mb-10 tracking-widest">RIDEFLOW</h2>
              <p className="mx-auto md:mx-0 text-[var(--text-muted)] text-[16px] leading-[2.1] max-w-[400px]">Setting the gold standard for premium executive transport. Precision. Privacy. Performance.</p>
            </div>
            
            {/* Link Columns - Accordion on Mobile */}
            {[
              { title: 'EXPERIENCE', links: ['Our Fleet', 'Destinations', 'Requests'] },
              { title: 'MEMBERSHIP', links: ['Benefits', 'Corporate', 'Pricing'] },
              { title: 'SUPPORT', links: ['Help Center', 'Privacy', 'Contact'] }
            ].map((col, i) => (
              <div key={i} className="border-b border-white/5 md:border-none pb-6 md:pb-0">
                <h4 className="text-sm md:text-base mb-6 md:mb-10 tracking-[0.2em] font-bold text-[var(--text-primary)] cursor-pointer md:cursor-default flex justify-between items-center">
                  {col.title}
                  <span className="md:hidden"><ChevronRight size={16} /></span>
                </h4>
                <div className="flex flex-col gap-4 md:gap-6">
                  {col.links.map(l => (
                    <a key={l} href="#" className="text-[var(--text-muted)] text-[15px] no-underline hover:text-[var(--amber-core)] transition-colors">{l}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-12 md:pt-16 border-t border-white/5">
            <p className="text-[var(--text-muted)] text-[13px] text-center md:text-left order-2 md:order-1">
              © 2026 RIDEFLOW GLOBAL. ALL RIGHTS RESERVED.
            </p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-12 order-1 md:order-2">
              {['INSTAGRAM', 'TWITTER', 'LINKEDIN'].map(s => (
                <a key={s} href="#" className="text-[var(--text-muted)] text-[11px] md:text-[13px] no-underline tracking-[0.25em] font-extrabold hover:text-[var(--amber-core)] transition-colors">{s}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
