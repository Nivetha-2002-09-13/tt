import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  TrophyIcon,
  CalendarIcon,
  ChartBarIcon,
  UserGroupIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { SkeletonCard } from "../components/UI";
import { AdminDashboard } from "./dashboards/AdminDashboard";
import { PlayerDashboard } from "./dashboards/PlayerDashboard";
import { RefereeDashboard } from "./dashboards/RefereeDashboard";

interface Tournament {
  id: string;
  name: string;
  venue: string;
  startDate: string;
  registrationDeadline: string;
  status: string;
}

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  delay?: number;
}> = ({ icon, label, value, sub, color = "#4AEEFF", delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="card-hover flex items-center gap-4 p-5"
  >
    <div
      className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
      style={{ background: `${color}18`, border: `1px solid ${color}30` }}
    >
      <div style={{ color }}>{icon}</div>
    </div>
    <div className="min-w-0">
      <p className="text-[#D8FBFF]/60 text-xs font-medium uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-black text-white mt-0.5">{value}</p>
      {sub && <p className="text-xs text-[#D8FBFF]/40 mt-0.5">{sub}</p>}
    </div>
  </motion.div>
);

const QuickAction: React.FC<{
  href: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
  delay?: number;
}> = ({ href, icon, label, description, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
  >
    <Link
      to={href}
      className="group flex items-center gap-4 p-4 rounded-2xl border border-[#12679E]/30
                 bg-gradient-to-r from-[#123B4A]/60 to-[#061D23]/60
                 hover:border-[#4AEEFF]/40 hover:from-[#12679E]/20 hover:to-[#123B4A]/60
                 transition-all duration-300"
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
                   transition-transform duration-300 group-hover:scale-110"
        style={{ background: `${color}20`, border: `1px solid ${color}40` }}
      >
        <div style={{ color }}>{icon}</div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-xs text-[#D8FBFF]/50 truncate">{description}</p>
      </div>
      <ArrowRightIcon
        className="w-4 h-4 text-[#D8FBFF]/30 group-hover:text-[#4AEEFF]
                   group-hover:translate-x-1 transition-all duration-200 flex-shrink-0"
      />
    </Link>
  </motion.div>
);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [newTournaments, setNewTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const isPlayer = user?.role === "PLAYER";
  const isAdmin  = user?.role === "ADMIN";

  useEffect(() => {
    fetchNewTournaments();
  }, []);

  const fetchNewTournaments = async () => {
    try {
      const response = await api.get("/tournaments");
      const all = response.data.data as Tournament[];
      const upcoming = all.filter((t) => t.status === "UPCOMING");
      setNewTournaments(upcoming.slice(0, 3));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const greetingHour = new Date().getHours();
  const greeting =
    greetingHour < 12 ? "Good morning" : greetingHour < 18 ? "Good afternoon" : "Good evening";

  const quickActions = [
    {
      href: "/app/tournaments",
      icon: <TrophyIcon className="w-5 h-5" />,
      label: "Browse Tournaments",
      description: "View and join available tournaments",
      color: "#4AEEFF",
    },
    ...(isPlayer
      ? [
          {
            href: "/app/my-matches",
            icon: <CalendarIcon className="w-5 h-5" />,
            label: "My Matches",
            description: "Check your upcoming matches",
            color: "#a78bfa",
          },
          {
            href: "/app/my-registrations",
            icon: <UserGroupIcon className="w-5 h-5" />,
            label: "My Registrations",
            description: "Tournaments you've registered for",
            color: "#34d399",
          },
        ]
      : []),
    {
      href: "/app/leaderboard",
      icon: <ChartBarIcon className="w-5 h-5" />,
      label: "Leaderboard",
      description: "See tournament standings",
      color: "#fbbf24",
    },
    {
      href: "/app/global-leaderboard",
      icon: <ChartBarIcon className="w-5 h-5" />,
      label: "Global Rankings",
      description: "Cross-tournament rankings",
      color: "#f472b6",
    },
  ];

  const renderRoleDashboard = () => {
    if (user?.role === "ADMIN") return <AdminDashboard />;
    if (user?.role === "REFEREE") return <RefereeDashboard />;
    if (user?.role === "PLAYER") return <PlayerDashboard />;
    return null;
  };

  return (
    <div className="page-container">
      {/* ── Welcome Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-3xl border border-[#12679E]/40 overflow-hidden mb-8 relative"
        style={{
          background: "linear-gradient(135deg, #12679E22 0%, #061D23 50%, #4AEEFF08 100%)",
        }}
      >
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, #4AEEFF, transparent)", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-20 w-32 h-32 rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, #12679E, transparent)" }} />

        <div className="relative px-8 py-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-[#4AEEFF]/80 text-sm font-medium mb-1 uppercase tracking-widest">
              {greeting} 👋
            </p>
            <h1 className="text-4xl font-black text-white mb-2">
              {user?.firstName} <span className="text-[#4AEEFF]">{user?.lastName}</span>
            </h1>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#4AEEFF]/15
                               border border-[#4AEEFF]/30 text-[#4AEEFF]">
                {user?.role}
              </span>
              <span className="text-[#D8FBFF]/40 text-xs">{user?.email}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/app/profile" className="btn-secondary text-sm py-2 px-4">
              Edit Profile
            </Link>
            <Link to="/app/tournaments" className="btn-primary text-sm py-2 px-4">
              Browse Tournaments →
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<TrophyIcon className="w-6 h-6" />}
          label="Tournaments"
          value={newTournaments.length > 0 ? `${newTournaments.length}+` : "0"}
          sub="Available now"
          color="#4AEEFF"
          delay={0.1}
        />
        <StatCard
          icon={<CalendarIcon className="w-6 h-6" />}
          label="Upcoming"
          value={newTournaments.length}
          sub="Open for registration"
          color="#a78bfa"
          delay={0.15}
        />
        <StatCard
          icon={<UserGroupIcon className="w-6 h-6" />}
          label="Your Role"
          value={user?.role ?? "—"}
          sub="Account type"
          color="#34d399"
          delay={0.2}
        />
        <StatCard
          icon={<ChartBarIcon className="w-6 h-6" />}
          label="Status"
          value="Active"
          sub="Account standing"
          color="#fbbf24"
          delay={0.25}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ── Role Specific Controls ── */}
        <div className="lg:col-span-3 mb-4">
          {renderRoleDashboard()}
        </div>

        {/* ── Upcoming Tournaments ── */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <TrophyIcon className="w-5 h-5 text-[#4AEEFF]" />
              <h2 className="text-lg font-bold text-white">Upcoming Tournaments</h2>
            </div>
            <Link to="/app/tournaments"
              className="text-xs text-[#4AEEFF] hover:text-[#CFF9FF] font-medium transition-colors flex items-center gap-1">
              View all <ArrowRightIcon className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : newTournaments.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-4xl mb-3">🏆</p>
              <p className="text-[#D8FBFF]/60">No upcoming tournaments right now.</p>
              {isAdmin && (
                <Link to="/app/create-tournament" className="btn-primary mt-4 inline-flex">
                  Create Tournament
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {newTournaments.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <Link
                    to={`/tournaments/${t.id}`}
                    className="group flex items-center gap-4 p-4 rounded-2xl border border-[#12679E]/30
                               bg-gradient-to-r from-[#123B4A]/60 to-[#061D23]/60
                               hover:border-[#4AEEFF]/50 hover:from-[#12679E]/20
                               transition-all duration-300"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#12679E] to-[#4AEEFF]/30
                                    flex items-center justify-center text-xl flex-shrink-0
                                    group-hover:scale-110 transition-transform duration-300">
                      🏆
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{t.name}</p>
                      <p className="text-xs text-[#D8FBFF]/50 mt-0.5">📍 {t.venue}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-[#4AEEFF]/80 font-medium">Register by</p>
                      <p className="text-xs text-[#D8FBFF]/60">
                        {new Date(t.registrationDeadline).toLocaleDateString()}
                      </p>
                    </div>
                    <ArrowRightIcon className="w-4 h-4 text-[#4AEEFF]/50 group-hover:text-[#4AEEFF]
                                               group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* ── Quick Actions ── */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#4AEEFF] to-[#12679E]" />
            <h2 className="text-lg font-bold text-white">Quick Actions</h2>
          </div>
          <div className="space-y-3">
            {quickActions.map((action, i) => (
              <QuickAction key={action.href} {...action} delay={0.3 + i * 0.07} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

// Inline shield icon fallback
const ShieldIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02
         12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

export default Dashboard;
