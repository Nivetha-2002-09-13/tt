import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LiveMatchTableProps {
  player1Name: string;
  player2Name: string;
  player1Score: number;
  player2Score: number;
  server?: 1 | 2;
  recentPointWinner?: 1 | 2 | null;
}

const LiveMatchTable: React.FC<LiveMatchTableProps> = ({
  player1Name,
  player2Name,
  player1Score,
  player2Score,
  server,
  recentPointWinner,
}) => {
  const [pointFlash, setPointFlash] = useState<1 | 2 | null>(null);

  // Trigger flash effect when recentPointWinner changes
  useEffect(() => {
    if (recentPointWinner) {
      setPointFlash(recentPointWinner);
      const timer = setTimeout(() => setPointFlash(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [recentPointWinner, player1Score, player2Score]);

  return (
    <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center bg-gradient-to-b from-[#0a1128] to-[#1a2b4c] rounded-2xl relative overflow-hidden perspective-[1200px]">
      
      {/* Scoreboard Overlay */}
      <div className="absolute top-6 left-0 right-0 flex justify-between px-10 z-20 pointer-events-none">
        <div className={`text-center transition-all ${server === 1 ? 'scale-110 drop-shadow-[0_0_15px_#4AEEFF]' : 'opacity-70'}`}>
          <div className="text-[#4AEEFF] font-black text-3xl uppercase tracking-widest">{player1Name}</div>
          <div className="text-white font-bold text-6xl drop-shadow-lg">{player1Score}</div>
          {server === 1 && <div className="text-xs text-[#4AEEFF] mt-1 animate-pulse">Serving</div>}
        </div>
        
        <div className="text-center font-black text-2xl text-white/30 pt-4">VS</div>

        <div className={`text-center transition-all ${server === 2 ? 'scale-110 drop-shadow-[0_0_15px_#e11d48]' : 'opacity-70'}`}>
          <div className="text-[#e11d48] font-black text-3xl uppercase tracking-widest">{player2Name}</div>
          <div className="text-white font-bold text-6xl drop-shadow-lg">{player2Score}</div>
          {server === 2 && <div className="text-xs text-[#e11d48] mt-1 animate-pulse">Serving</div>}
        </div>
      </div>

      {/* 3D Isometric Table Scene */}
      <div 
        className="relative w-[300px] h-[500px] mt-24"
        style={{
          transformStyle: "preserve-3d",
          transform: "rotateX(60deg) rotateZ(-35deg)",
          boxShadow: "-40px 40px 100px rgba(0,0,0,0.8)"
        }}
      >
        {/* The Table Base/Thickness */}
        <div className="absolute inset-0 bg-[#0c4a6e] translate-z-[-10px] rounded-sm" />
        
        {/* The Table Top */}
        <div className="absolute inset-0 bg-[#0284c7] border-2 border-white rounded-sm overflow-hidden flex flex-col">
          
          {/* Center Line (vertical in this orientation) */}
          <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-white/80 -translate-x-1/2" />

          {/* Player 1 Side (Top half) */}
          <motion.div 
            className="flex-1 border-b-4 border-white relative"
            animate={{
              backgroundColor: pointFlash === 1 ? "rgba(74, 238, 255, 0.4)" : "rgba(2, 132, 199, 1)"
            }}
            transition={{ duration: 0.5 }}
          >
            {pointFlash === 1 && (
              <motion.div 
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 bg-white"
              />
            )}
          </motion.div>

          {/* Player 2 Side (Bottom half) */}
          <motion.div 
            className="flex-1 relative"
            animate={{
              backgroundColor: pointFlash === 2 ? "rgba(225, 29, 72, 0.4)" : "rgba(2, 132, 199, 1)"
            }}
            transition={{ duration: 0.5 }}
          >
            {pointFlash === 2 && (
              <motion.div 
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 bg-white"
              />
            )}
          </motion.div>

        </div>

        {/* The Net (Perpendicular to the table) */}
        <div 
          className="absolute top-1/2 left-[-10px] right-[-10px] h-[30px] bg-white/30 backdrop-blur-sm border-t-4 border-white origin-bottom"
          style={{
            transform: "translateY(-50%) rotateX(-90deg)",
            backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px)",
            backgroundSize: "4px 4px"
          }}
        />

        {/* Floating Ball Animation on Score */}
        <AnimatePresence>
          {pointFlash === 1 && (
            <motion.div
              initial={{ x: 150, y: 300, z: 50, opacity: 0 }}
              animate={{ x: 150, y: 125, z: [50, 100, 10], opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, times: [0, 0.5, 1] }}
              className="absolute w-4 h-4 bg-orange-400 rounded-full shadow-[0_0_10px_#f97316]"
              style={{ transformStyle: "preserve-3d" }}
            />
          )}
          {pointFlash === 2 && (
            <motion.div
              initial={{ x: 150, y: 200, z: 50, opacity: 0 }}
              animate={{ x: 150, y: 375, z: [50, 100, 10], opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, times: [0, 0.5, 1] }}
              className="absolute w-4 h-4 bg-orange-400 rounded-full shadow-[0_0_10px_#f97316]"
              style={{ transformStyle: "preserve-3d" }}
            />
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default LiveMatchTable;
