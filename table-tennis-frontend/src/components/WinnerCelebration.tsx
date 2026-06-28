import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";

interface WinnerCelebrationProps {
  winnerName: string;
  onClose: () => void;
}

const WinnerCelebration: React.FC<WinnerCelebrationProps> = ({ winnerName, onClose }) => {
  useEffect(() => {
    // Fire a grand confetti explosion when the component mounts
    const duration = 5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 7,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#d4af37", "#f3d360", "#ffffff", "#e11d48"]
      });
      confetti({
        particleCount: 7,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#d4af37", "#f3d360", "#ffffff", "#4AEEFF"]
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    // Center burst
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: ["#d4af37", "#f3d360", "#ffffff", "#e11d48", "#4AEEFF"]
    });
  }, []);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0, rotate: -10, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
            duration: 0.8
          }}
          className="relative max-w-lg w-full bg-gradient-to-br from-[#1c1c1c] via-[#2a2a2a] to-[#111] rounded-3xl border-[4px] border-[#d4af37] shadow-[0_0_80px_rgba(212,175,55,0.4)] p-10 text-center overflow-hidden"
        >
          {/* Shimmer Effect Background */}
          <motion.div
            className="absolute inset-0 z-0 opacity-20 mix-blend-color-dodge"
            style={{
              background: "linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.8) 50%, transparent 60%)",
              backgroundSize: "200% 200%"
            }}
            animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          />

          <div className="relative z-10">
            {/* Grand Trophy */}
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-9xl mb-6 drop-shadow-[0_20px_20px_rgba(0,0,0,0.8)]"
            >
              🏆
            </motion.div>

            <h2 className="text-[#f3d360] text-xl font-bold uppercase tracking-[0.3em] mb-2">
              Tournament Champion
            </h2>
            
            <h1 className="text-5xl font-black text-white mb-8 leading-tight drop-shadow-lg" style={{ fontFamily: "'Impact', sans-serif" }}>
              {winnerName}
            </h1>

            <button
              onClick={onClose}
              className="px-8 py-3 bg-gradient-to-r from-[#d4af37] to-[#f3d360] text-black font-black uppercase tracking-widest rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(212,175,55,0.6)]"
            >
              Celebrate
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WinnerCelebration;
