import React, { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement);

interface PlayerStat {
  id: string;
  firstName: string;
  lastName: string;
  stats: {
    totalMatches: number;
    wins: number;
    losses: number;
    winRate: string;
    gamesStats: { won: number; lost: number; total: number };
    pointsStats: { scored: number; conceded: number; averagePerGame: string };
    recentMatches: Array<{
      id: string;
      tournamentName: string;
      opponent: string;
      result: string;
      score: string;
      date: string;
    }>;
  } | null;
}

interface Player {
  id: string;
  firstName: string;
  lastName: string;
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#D8FBFF80" } },
    y: { grid: { color: "rgba(255,255,255,0.05)" }, ticks: { color: "#D8FBFF80" }, beginAtZero: true },
  },
};

const PlayerStatsPage: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [player1, setPlayer1] = useState<PlayerStat | null>(null);
  const [player2, setPlayer2] = useState<PlayerStat | null>(null);
  const [selectedP1Id, setSelectedP1Id] = useState("");
  const [selectedP2Id, setSelectedP2Id] = useState("");
  const [loadingP1, setLoadingP1] = useState(false);
  const [loadingP2, setLoadingP2] = useState(false);

  useEffect(() => {
    api.get("/users/public/players").then((r) => setPlayers(r.data.data || []));
  }, []);

  const loadPlayer = async (userId: string, slot: 1 | 2) => {
    if (slot === 1) setLoadingP1(true);
    else setLoadingP2(true);
    try {
      const [profileRes, statsRes] = await Promise.all([
        api.get(`/users/public/${userId}`),
        api.get(`/matches/player-performance/${userId}`).catch(() => ({ data: { data: null } })),
      ]);
      const data: PlayerStat = {
        id: userId,
        firstName: profileRes.data.data.firstName,
        lastName: profileRes.data.data.lastName,
        stats: statsRes.data.data,
      };
      if (slot === 1) setPlayer1(data);
      else setPlayer2(data);
    } catch {}
    if (slot === 1) setLoadingP1(false);
    else setLoadingP2(false);
  };

  const handleSelectP1 = (id: string) => { setSelectedP1Id(id); if (id) loadPlayer(id, 1); else setPlayer1(null); };
  const handleSelectP2 = (id: string) => { setSelectedP2Id(id); if (id) loadPlayer(id, 2); else setPlayer2(null); };

  const winRateChartData = useMemo(() => {
    const labels: string[] = [];
    const data: number[] = [];
    const colors: string[] = [];
    if (player1?.stats) {
      labels.push(`${player1.firstName} ${player1.lastName}`);
      data.push(parseFloat(player1.stats.winRate));
      colors.push("rgba(74,238,255,0.8)");
    }
    if (player2?.stats) {
      labels.push(`${player2.firstName} ${player2.lastName}`);
      data.push(parseFloat(player2.stats.winRate));
      colors.push("rgba(225,29,72,0.8)");
    }
    return {
      labels,
      datasets: [{ data, backgroundColor: colors, borderRadius: 8, borderWidth: 0 }],
    };
  }, [player1, player2]);

  const StatRow = ({ label, v1, v2, better }: { label: string; v1: string | number; v2?: string | number; better?: "higher" | "lower" }) => {
    const p1Better = better === "higher" ? Number(v1) >= Number(v2) : Number(v1) <= Number(v2);
    return (
      <div className="grid grid-cols-3 items-center py-3 border-b border-[#12679E]/10 last:border-0">
        <div className={`text-right font-bold text-sm ${player2 && better ? (p1Better ? "text-[#4AEEFF]" : "text-[#D8FBFF]/50") : "text-white"}`}>{v1}</div>
        <div className="text-center text-xs text-[#D8FBFF]/40 uppercase tracking-wider px-2">{label}</div>
        <div className={`text-left font-bold text-sm ${player2 && better ? (!p1Better ? "text-[#e11d48]" : "text-[#D8FBFF]/50") : "text-white"}`}>{v2 ?? "—"}</div>
      </div>
    );
  };

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">📊 Player Statistics</h1>
        <p className="text-[#D8FBFF]/50 mt-1">Compare player stats, win rates, and head-to-head performance</p>
      </div>

      {/* Player Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Player 1 */}
        <div className="card border-[#4AEEFF]/30">
          <p className="text-xs font-bold text-[#4AEEFF] uppercase tracking-wider mb-3">Player 1</p>
          <select
            value={selectedP1Id}
            onChange={(e) => handleSelectP1(e.target.value)}
            className="input-field w-full mb-4"
          >
            <option value="">Select a player...</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
            ))}
          </select>
          {loadingP1 && <div className="text-[#4AEEFF] text-sm animate-pulse">Loading stats...</div>}
          {player1?.stats && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-2xl font-black text-[#4AEEFF]">{player1.stats.totalMatches}</div>
                  <div className="text-xs text-[#D8FBFF]/40">Matches</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-green-400">{player1.stats.wins}</div>
                  <div className="text-xs text-[#D8FBFF]/40">Wins</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-[#f3d360]">{player1.stats.winRate}</div>
                  <div className="text-xs text-[#D8FBFF]/40">Win Rate</div>
                </div>
              </div>
            </motion.div>
          )}
          {player1 && !player1.stats && !loadingP1 && (
            <p className="text-[#D8FBFF]/40 text-sm">No match stats yet</p>
          )}
        </div>

        {/* Player 2 */}
        <div className="card border-[#e11d48]/30">
          <p className="text-xs font-bold text-[#e11d48] uppercase tracking-wider mb-3">Player 2</p>
          <select
            value={selectedP2Id}
            onChange={(e) => handleSelectP2(e.target.value)}
            className="input-field w-full mb-4"
          >
            <option value="">Select a player to compare...</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
            ))}
          </select>
          {loadingP2 && <div className="text-[#e11d48] text-sm animate-pulse">Loading stats...</div>}
          {player2?.stats && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-2xl font-black text-[#e11d48]">{player2.stats.totalMatches}</div>
                  <div className="text-xs text-[#D8FBFF]/40">Matches</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-green-400">{player2.stats.wins}</div>
                  <div className="text-xs text-[#D8FBFF]/40">Wins</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-[#f3d360]">{player2.stats.winRate}</div>
                  <div className="text-xs text-[#D8FBFF]/40">Win Rate</div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Win Rate Chart */}
      {(player1?.stats || player2?.stats) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <h3 className="text-sm font-bold text-[#D8FBFF]/60 uppercase tracking-wider mb-4">Win Rate Comparison</h3>
            <div style={{ height: 200 }}>
              <Bar data={winRateChartData} options={chartOptions} />
            </div>
          </div>

          {/* Head to Head */}
          {player1?.stats && player2?.stats && (
            <div className="card">
              <h3 className="text-sm font-bold text-[#D8FBFF]/60 uppercase tracking-wider mb-4">Head-to-Head Comparison</h3>
              <StatRow label="Win Rate" v1={player1.stats.winRate} v2={player2.stats.winRate} better="higher" />
              <StatRow label="Matches" v1={player1.stats.totalMatches} v2={player2.stats.totalMatches} better="higher" />
              <StatRow label="Wins" v1={player1.stats.wins} v2={player2.stats.wins} better="higher" />
              <StatRow label="Pts Scored" v1={player1.stats.pointsStats.scored} v2={player2.stats.pointsStats.scored} better="higher" />
              <StatRow label="Avg Pts/Game" v1={player1.stats.pointsStats.averagePerGame} v2={player2.stats.pointsStats.averagePerGame} better="higher" />
            </div>
          )}
        </div>
      )}

      {/* Recent Matches for Player 1 */}
      {player1?.stats?.recentMatches && player1.stats.recentMatches.length > 0 && (
        <div className="card mb-6">
          <h3 className="text-sm font-bold text-[#4AEEFF] uppercase tracking-wider mb-4">
            {player1.firstName} {player1.lastName} — Recent Matches
          </h3>
          <div className="space-y-2">
            {player1.stats.recentMatches.slice(0, 5).map((m) => (
              <div key={m.id} className={`flex items-center gap-4 p-3 rounded-xl border ${m.result === "Win" ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}`}>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${m.result === "Win" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                  {m.result}
                </span>
                <span className="text-white text-sm font-semibold flex-1">vs {m.opponent}</span>
                <span className="text-[#D8FBFF]/40 text-xs">{m.score}</span>
                <span className="text-[#D8FBFF]/30 text-xs">{new Date(m.date).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!player1 && !player2 && (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-white font-bold text-xl">Select a player to view statistics</p>
          <p className="text-[#D8FBFF]/40 mt-2">Select two players to compare head-to-head</p>
        </div>
      )}
    </div>
  );
};

export default PlayerStatsPage;
