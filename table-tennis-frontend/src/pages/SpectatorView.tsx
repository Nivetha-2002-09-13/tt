import React, { useEffect, useState } from "react";
import api from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, Link } from "react-router-dom";

interface LiveMatch {
  id: string;
  round: string;
  status: string;
  score: string | null;
  scheduledTime: string | null;
  player1: { id: string; firstName: string; lastName: string } | null;
  player2: { id: string; firstName: string; lastName: string } | null;
  winnerId?: string | null;
}

const SpectatorView: React.FC = () => {
  const { id: tournamentId } = useParams<{ id: string }>();
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [tournamentName, setTournamentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchData();
    // Auto-refresh every 15 seconds
    const interval = setInterval(() => {
      fetchData(false);
      setLastUpdated(new Date());
    }, 15000);
    return () => clearInterval(interval);
  }, [tournamentId]);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      if (tournamentId) {
        const [tRes, mRes] = await Promise.all([
          api.get(`/tournaments/${tournamentId}`),
          api.get(`/matches/tournaments/${tournamentId}`),
        ]);
        setTournamentName(tRes.data.data?.name || "Tournament");
        setMatches(mRes.data.data || []);
      }
    } catch {
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const liveMatches = matches.filter((m) => m.status === "IN_PROGRESS");
  const scheduledMatches = matches.filter((m) => m.status === "SCHEDULED" || m.status === "PENDING");
  const completedMatches = matches.filter((m) => m.status === "COMPLETED").slice(-5);

  const parseScore = (score: string | null, match: LiveMatch) => {
    if (!score) return { p1Games: 0, p2Games: 0 };
    const parts = score.split(",").map((s) => s.trim());
    let p1 = 0, p2 = 0;
    for (const part of parts) {
      const [a, b] = part.split("-").map(Number);
      if (!isNaN(a) && !isNaN(b)) {
        if (a > b) p1++;
        else if (b > a) p2++;
      }
    }
    return { p1Games: p1, p2Games: p2 };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#020d13] via-[#041525] to-[#020d13] text-white p-4 md:p-8">
      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-red-400 uppercase tracking-widest">LIVE</span>
            </div>
            <h1 className="text-3xl font-black text-white">{tournamentName}</h1>
            <p className="text-[#D8FBFF]/40 text-sm mt-1">
              Spectator View · Auto-refresh · Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
          <Link
            to={tournamentId ? `/tournaments/${tournamentId}/bracket` : "/tournaments"}
            className="px-4 py-2 bg-[#4AEEFF]/10 border border-[#4AEEFF]/30 rounded-xl text-[#4AEEFF] text-sm font-semibold hover:bg-[#4AEEFF]/20 transition-colors"
          >
            View Bracket →
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-[#D8FBFF]/40">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[#4AEEFF]/20 border-t-[#4AEEFF] rounded-full animate-spin mx-auto mb-4" />
              <p>Loading live matches...</p>
            </div>
          </div>
        ) : (
          <>
            {/* LIVE Matches */}
            {liveMatches.length > 0 && (
              <section className="mb-8">
                <h2 className="flex items-center gap-2 text-lg font-bold mb-4">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-400">LIVE MATCHES</span>
                  <span className="text-[#D8FBFF]/40 font-normal text-sm">({liveMatches.length})</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {liveMatches.map((m) => {
                    const { p1Games, p2Games } = parseScore(m.score, m);
                    return (
                      <motion.div
                        key={m.id}
                        className="relative rounded-2xl overflow-hidden border border-red-500/30 bg-gradient-to-br from-[#1a0010] to-[#0a1520]"
                        animate={{ boxShadow: ["0 0 10px rgba(239,68,68,0.1)", "0 0 30px rgba(239,68,68,0.3)", "0 0 10px rgba(239,68,68,0.1)"] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 via-orange-400 to-red-500 animate-pulse" />
                        <div className="p-5">
                          <div className="text-xs font-bold text-red-400 uppercase tracking-widest mb-4 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                            {m.round} · IN PROGRESS
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 text-right">
                              <p className="font-black text-xl text-white">
                                {m.player1 ? `${m.player1.firstName} ${m.player1.lastName}` : "TBD"}
                              </p>
                              <p className="text-5xl font-black text-[#f3d360] mt-1">{p1Games}</p>
                            </div>
                            <div className="text-center shrink-0">
                              <div className="text-[#D8FBFF]/30 font-bold text-lg">VS</div>
                              {m.score && (
                                <div className="text-xs text-[#D8FBFF]/40 mt-1 max-w-[80px] break-words text-center">
                                  {m.score}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-black text-xl text-white">
                                {m.player2 ? `${m.player2.firstName} ${m.player2.lastName}` : "TBD"}
                              </p>
                              <p className="text-5xl font-black text-[#4AEEFF] mt-1">{p2Games}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Scheduled Matches */}
            {scheduledMatches.length > 0 && (
              <section className="mb-8">
                <h2 className="text-lg font-bold text-[#D8FBFF]/60 mb-4 uppercase tracking-wider text-sm">
                  ⏳ Upcoming ({scheduledMatches.length})
                </h2>
                <div className="space-y-2">
                  {scheduledMatches.map((m) => (
                    <div key={m.id} className="flex items-center gap-4 p-4 rounded-xl bg-[#061D23] border border-[#12679E]/20">
                      <div className="w-2 h-2 bg-[#4AEEFF]/40 rounded-full" />
                      <span className="text-xs text-[#4AEEFF] w-24 shrink-0">{m.round}</span>
                      <span className="text-white font-semibold flex-1">
                        {m.player1 ? `${m.player1.firstName} ${m.player1.lastName}` : "TBD"}
                        <span className="text-[#D8FBFF]/30 mx-2">vs</span>
                        {m.player2 ? `${m.player2.firstName} ${m.player2.lastName}` : "TBD"}
                      </span>
                      {m.scheduledTime && (
                        <span className="text-xs text-[#D8FBFF]/40 shrink-0">
                          {new Date(m.scheduledTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Completed */}
            {completedMatches.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-[#D8FBFF]/40 mb-3 uppercase tracking-wider">
                  ✅ Recent Results
                </h2>
                <div className="space-y-2">
                  {completedMatches.reverse().map((m) => {
                    const { p1Games, p2Games } = parseScore(m.score, m);
                    const p1Won = m.winnerId === m.player1?.id;
                    return (
                      <div key={m.id} className="flex items-center gap-4 p-3 rounded-xl bg-[#061D23] border border-green-500/10">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <div className="flex-1 flex items-center gap-3">
                          <span className={`font-semibold text-sm ${p1Won ? "text-green-400" : "text-[#D8FBFF]/50 line-through"}`}>
                            {m.player1 ? `${m.player1.firstName} ${m.player1.lastName}` : "TBD"}
                          </span>
                          <span className="text-[#D8FBFF]/30 text-xs">{p1Games}-{p2Games}</span>
                          <span className={`font-semibold text-sm ${!p1Won ? "text-green-400" : "text-[#D8FBFF]/50 line-through"}`}>
                            {m.player2 ? `${m.player2.firstName} ${m.player2.lastName}` : "TBD"}
                          </span>
                        </div>
                        <span className="text-xs text-[#D8FBFF]/30">{m.round}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {liveMatches.length === 0 && scheduledMatches.length === 0 && completedMatches.length === 0 && (
              <div className="text-center py-24 text-[#D8FBFF]/30">
                <div className="text-6xl mb-4">🏓</div>
                <p className="text-xl font-bold">No matches available</p>
                <p className="mt-2 text-sm">Matches will appear here once they are scheduled</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SpectatorView;
