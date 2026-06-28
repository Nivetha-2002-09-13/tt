import React, { useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Link } from "react-router-dom";

export interface PlayerStats {
  rating: number;
  speed: number;
  power: number;
  spin: number;
  defense: number;
}

interface PlayerCardProps {
  id: string;
  firstName: string;
  lastName: string;
  stats?: PlayerStats;
  avatarUrl?: string;
  club?: string;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  id,
  firstName,
  lastName,
  stats,
  avatarUrl,
  club = "PRO TT CLUB",
}) => {
  // Generate random stats if not provided (for visual demonstration)
  const playerStats = stats || {
    rating: Math.floor(Math.random() * 20) + 75,
    speed: Math.floor(Math.random() * 30) + 60,
    power: Math.floor(Math.random() * 30) + 60,
    spin: Math.floor(Math.random() * 30) + 60,
    defense: Math.floor(Math.random() * 30) + 60,
  };

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth out the mouse movement
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  // Map mouse position to rotation
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);

  // Holographic glare effect
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]);
  const glareOpacity = useTransform(
    mouseXSpring,
    [-0.5, 0, 0.5],
    [0.6, 0.1, 0.6]
  );

  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <Link to={`/profile/${id}`} className="block w-full max-w-[280px] mx-auto" style={{ perspective: "1000px" }}>
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="relative w-full aspect-[2/3] rounded-2xl cursor-pointer group transition-transform duration-200 ease-out"
      >
        {/* Card Background & Border */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#1c1c1c] via-[#2a2a2a] to-[#111] border-[3px] border-[#d4af37] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
          
          {/* Holographic Glare */}
          <motion.div
            className="absolute inset-0 pointer-events-none z-50 mix-blend-overlay"
            style={{
              opacity: isHovered ? glareOpacity : 0,
              background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 60%)`,
              transition: "opacity 0.2s",
            }}
          />

          {/* Rainbow shimmer (visible on hover) */}
          <motion.div
            className="absolute inset-0 pointer-events-none z-40 mix-blend-color-dodge opacity-0 group-hover:opacity-30 transition-opacity duration-300"
            style={{
              background: `linear-gradient(125deg, #ff0000 0%, #ff8000 15%, #ffff00 30%, #00ff00 45%, #00ffff 60%, #0000ff 75%, #8000ff 90%)`,
              backgroundSize: "200% 200%",
            }}
            animate={isHovered ? { backgroundPosition: ["0% 0%", "100% 100%"] } : {}}
            transition={{ duration: 2, ease: "linear", repeat: Infinity, repeatType: "mirror" }}
          />

          {/* Top Info (Rating & Position) */}
          <div className="absolute top-4 left-4 z-20 text-center" style={{ transform: "translateZ(30px)" }}>
            <div className="text-4xl font-black text-[#f3d360] drop-shadow-md">
              {playerStats.rating}
            </div>
            <div className="text-sm font-bold text-white/80 uppercase tracking-wider">
              PRO
            </div>
            {/* Country Flag (Placeholder) */}
            <div className="w-8 h-5 bg-blue-600 mt-1 mx-auto rounded-sm border border-white/20 flex items-center justify-center text-[10px] font-bold text-white">
              INT
            </div>
          </div>

          {/* Avatar Area */}
          <div className="absolute top-10 left-0 w-full h-[180px] flex justify-center items-end z-10" style={{ transform: "translateZ(40px)" }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={firstName} className="h-full object-cover object-bottom drop-shadow-2xl" />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-b from-gray-700 to-gray-900 border-4 border-[#d4af37] flex items-center justify-center text-5xl font-black text-[#d4af37] shadow-xl mb-4">
                {firstName[0]}{lastName[0]}
              </div>
            )}
          </div>

          {/* Bottom Info Section */}
          <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-black/90 to-transparent pt-12 pb-4 px-4 z-20" style={{ transform: "translateZ(20px)" }}>
            {/* Player Name */}
            <h3 className="text-2xl font-black text-center text-[#f3d360] uppercase tracking-widest border-b border-[#f3d360]/30 pb-2 mb-3 truncate px-2">
              {lastName}
            </h3>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm font-bold">
              <div className="flex justify-between items-center text-white">
                <span className="text-[#f3d360]">{playerStats.speed}</span>
                <span className="text-white/60 text-xs">SPD</span>
              </div>
              <div className="flex justify-between items-center text-white">
                <span className="text-[#f3d360]">{playerStats.spin}</span>
                <span className="text-white/60 text-xs">SPN</span>
              </div>
              <div className="flex justify-between items-center text-white">
                <span className="text-[#f3d360]">{playerStats.power}</span>
                <span className="text-white/60 text-xs">POW</span>
              </div>
              <div className="flex justify-between items-center text-white">
                <span className="text-[#f3d360]">{playerStats.defense}</span>
                <span className="text-white/60 text-xs">DEF</span>
              </div>
            </div>
            
            {/* Club Name */}
            <div className="text-center mt-3 border-t border-[#f3d360]/20 pt-2 text-[10px] text-white/50 tracking-[0.2em] uppercase">
              {club}
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default PlayerCard;
