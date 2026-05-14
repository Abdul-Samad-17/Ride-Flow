import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useWindowSize } from '../../hooks/useWindowSize';
import { GlassCard } from './index';

export default function ResponsiveModal({ isOpen, onClose, children, title }) {
  const { width } = useWindowSize();
  const isMobile = width < 768;

  const desktopVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 20 }
  };

  const mobileVariants = {
    hidden: { y: '100%' },
    visible: { y: 0 },
    exit: { y: '100%' }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />

          {/* Modal / Bottom Sheet */}
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={isMobile ? mobileVariants : desktopVariants}
            transition={isMobile ? { type: 'spring', stiffness: 300, damping: 30 } : { duration: 0.2 }}
            className={`
              fixed z-[101] outline-none
              ${isMobile 
                ? 'bottom-0 left-0 right-0 max-h-[90vh] bg-[#0A0A0F] rounded-t-[24px] border-t border-white/10 overflow-y-auto' 
                : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg'
              }
            `}
            style={!isMobile ? { left: '50%', top: '50%' } : {}}
          >
            {isMobile && (
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto my-3" />
            )}

            <div className={`${isMobile ? 'p-6 pt-2' : ''}`}>
              {!isMobile ? (
                <GlassCard level={3} className="p-8 relative border border-white/10 shadow-2xl">
                  <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-2"
                  >
                    <X size={20} />
                  </button>
                  {title && <h3 className="text-xl font-display mb-6">{title}</h3>}
                  {children}
                </GlassCard>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-6">
                    {title && <h3 className="text-xl font-display">{title}</h3>}
                    <button 
                      onClick={onClose}
                      className="text-white/40 hover:text-white transition-colors p-2"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  {children}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
