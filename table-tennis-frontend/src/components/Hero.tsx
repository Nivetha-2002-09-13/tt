import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

interface Stats {
  tournaments: number;
  players: number;
  matches: number;
}

const FloatingBall: React.FC<{
  size: number;
  x: string;
  y: string;
  delay: number;
  duration: number;
  opacity?: number;
}> = ({ size, x, y, delay, duration, opacity = 0.15 }) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={{
      width: size,
      height: size,
      left: x,
      top: y,
      background: "radial-gradient(circle at 35% 35%, #ffffff, #4AEEFF)",
      opacity,
    }}
    animate={{ y: [0, -20, 0], rotate: [0, 180, 360] }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

const Hero: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ tournaments: 0, players: 0, matches: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/tournaments");
        const tourns: any[] = res.data.data ?? [];
        setStats({
          tournaments: tourns.length,
          players: tourns.reduce((acc, t) => acc + (t._count?.registrations ?? 0), 0),
          matches: tourns.length * 10, // estimate
        });
      } catch {
        setStats({ tournaments: 50, players: 200, matches: 1000 });
      }
    };
    fetchStats();
  }, []);

  const statItems = [
    { value: `${stats.tournaments}+`, label: "Tournaments" },
    { value: `${stats.players}+`,     label: "Participants" },
    { value: `${stats.matches}+`,     label: "Matches" },
    { value: "98%",                   label: "Satisfaction" },
  ];

  return (
    <div className="relative overflow-hidden" style={{
      background: "linear-gradient(135deg, #061D23 0%, #0d2d38 40%, #12679E20 70%, #061D23 100%)",
      minHeight: "90vh",
      display: "flex",
      alignItems: "center",
    }}>
      {/* Floating decorative balls */}
      <FloatingBall size={80}  x="5%"  y="15%" delay={0}   duration={6}   opacity={0.08} />
      <FloatingBall size={50}  x="88%" y="20%" delay={1}   duration={5}   opacity={0.12} />
      <FloatingBall size={30}  x="15%" y="75%" delay={2}   duration={7}   opacity={0.1}  />
      <FloatingBall size={60}  x="80%" y="65%" delay={0.5} duration={8}   opacity={0.07} />
      <FloatingBall size={20}  x="50%" y="10%" delay={1.5} duration={4.5} opacity={0.15} />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-[0.06] blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #4AEEFF, transparent)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-[0.06] blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #12679E, transparent)" }} />

      {/* Table lines decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(#4AEEFF 1px, transparent 1px),
            linear-gradient(90deg, #4AEEFF 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
        <div className="text-center">

          {/* Status pill */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-[#12679E]/30 backdrop-blur-sm
                       rounded-full px-5 py-2 mb-8 border border-[#4AEEFF]/20"
          >
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-[#D8FBFF]/80 font-medium">
              Professional Tournament Management Platform
            </span>
          </motion.div>

          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-4"
          >
            <p className="font-brush text-4xl text-[#4AEEFF] tracking-wider italic shadow-sm">
              "where education Meets Opportunities"
            </p>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-bison text-6xl md:text-8xl lg:text-9xl text-white mb-6 leading-none tracking-tight uppercase"
          >
            Table
            <br />
            <span className="bg-gradient-to-r from-[#4AEEFF] via-[#CFF9FF] to-[#12679E]
                             bg-clip-text text-transparent">
              Tennis
            </span>
            <br />
            <span className="text-4xl md:text-5xl lg:text-6xl text-[#D8FBFF]/70 font-bold">
              Tournament System
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-xl text-[#D8FBFF]/60 max-w-2xl mx-auto mb-10"
          >
            Manage tournaments, track matches, celebrate champions — all in one
            comprehensive platform built for serious players.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-wrap gap-4 justify-center mb-20"
          >
            {!user ? (
              <>
                <Link
                  to="/register"
                  className="group relative px-8 py-3.5 rounded-xl font-bold text-[#061D23]
                             bg-gradient-to-r from-[#4AEEFF] to-[#CFF9FF]
                             hover:from-[#CFF9FF] hover:to-[#4AEEFF]
                             transition-all duration-300 transform hover:scale-105
                             shadow-[0_0_30px_rgba(74,238,255,0.4)]
                             hover:shadow-[0_0_50px_rgba(74,238,255,0.6)]"
                >
                  Get Started Free
                  <span className="ml-2">→</span>
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-3.5 rounded-xl font-bold text-[#4AEEFF]
                             border border-[#4AEEFF]/40 bg-[#4AEEFF]/10
                             hover:bg-[#4AEEFF]/20 hover:border-[#4AEEFF]/70
                             transition-all duration-300"
                >
                  Sign In
                </Link>
                <Link
                  to="/tournaments"
                  className="px-8 py-3.5 rounded-xl font-bold text-[#D8FBFF]/70
                             border border-[#12679E]/40
                             hover:border-[#12679E]/80 hover:text-white
                             transition-all duration-300"
                >
                  Browse Tournaments
                </Link>
              </>
            ) : (
              <>
                <Link to="/tournaments" className="btn-primary px-8 py-3.5 text-base">
                  Browse Tournaments →
                </Link>
                <Link to="/app/dashboard"
                  className="px-8 py-3.5 rounded-xl font-bold text-[#4AEEFF]
                             border border-[#4AEEFF]/40 bg-[#4AEEFF]/10
                             hover:bg-[#4AEEFF]/20 transition-all duration-300">
                  Go to Dashboard
                </Link>
              </>
            )}
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto"
          >
            {statItems.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + i * 0.1, duration: 0.4 }}
                className="text-center p-4 rounded-2xl bg-[#12679E]/10 border border-[#12679E]/20
                           backdrop-blur-sm hover:border-[#4AEEFF]/30 transition-colors"
              >
                <div className="text-3xl font-black text-[#4AEEFF]">{stat.value}</div>
                <div className="text-sm text-[#D8FBFF]/50 mt-1 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{ background: "linear-gradient(transparent, #061D23)" }} />
    </div>
  );
};

export default Hero;
