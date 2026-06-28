import React, { useEffect, useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { SkeletonTable, EmptyState, PageHeader, WinRateBar, Medal } from "../components/UI";

interface Tournament {
  id: string;
  name: string;
  status: string;
}

interface Standing {
  playerId: string;
  playerName: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  gamesWon: number;
  gamesLost: number;
  points: number;
}

interface CategoryStanding {
  categoryId: string;
  categoryName: string;
  totalPlayers: number;
  completedMatches: number;
  standings: Standing[];
}

const Podium: React.FC<{ top3: Standing[] }> = ({ top3 }) => {
  const order = [1, 0, 2]; // display order: 2nd, 1st, 3rd
  const heights = ["h-24", "h-32", "h-20"];
  const colors = [
    { bg: "from-gray-400/20 to-gray-500/10", border: "border-gray-400/40", text: "text-gray-300" },
    { bg: "from-yellow-400/20 to-yellow-500/10", border: "border-yellow-400/40", text: "text-yellow-300" },
    { bg: "from-orange-400/20 to-orange-500/10", border: "border-orange-400/40", text: "text-orange-300" },
  ];
  const labels = ["🥈 2nd", "🥇 1st", "🥉 3rd"];

  return (
    <div className="flex items-end justify-center gap-4 mb-8 px-4">
      {order.map((rankIdx, displayPos) => {
        const player = top3[rankIdx];
        if (!player) return <div key={displayPos} className="flex-1 max-w-[140px]" />;
        const c = colors[rankIdx];
        return (
          <motion.div
            key={player.playerId}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: displayPos * 0.15, duration: 0.5 }}
            className="flex-1 max-w-[160px] flex flex-col items-center"
          >
            <Link to={`/profile/${player.playerId}`}
              className="text-center mb-2 hover:opacity-80 transition-opacity">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#12679E] to-[#4AEEFF]/30
                              border-2 border-[#4AEEFF]/30 flex items-center justify-center
                              text-lg font-bold text-white mx-auto mb-2">
                {player.playerName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <p className="text-xs font-semibold text-white truncate px-1">{player.playerName}</p>
              <p className="text-[#4AEEFF] font-black text-lg">{player.points}pts</p>
            </Link>
            <div
              className={`w-full ${heights[displayPos]} rounded-t-xl border ${c.border}
                          bg-gradient-to-t ${c.bg} flex items-end justify-center pb-3`}
            >
              <span className="text-xl">{labels[displayPos].split(" ")[0]}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

const Leaderboard: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [standings, setStandings] = useState<CategoryStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStandings, setLoadingStandings] = useState(false);

  useEffect(() => { fetchTournaments(); }, []);
  useEffect(() => { if (selectedTournament) fetchStandings(); }, [selectedTournament]);

  const fetchTournaments = async () => {
    try {
      const response = await api.get("/tournaments");
      setTournaments(response.data.data);
      if (response.data.data.length > 0) {
        setSelectedTournament(response.data.data[0].id);
      }
    } catch {
      toast.error("Failed to fetch tournaments");
    } finally {
      setLoading(false);
    }
  };

  const fetchStandings = async () => {
    setLoadingStandings(true);
    try {
      const response = await api.get(`/results/tournaments/${selectedTournament}/standings`);
      setStandings(response.data.data);
    } catch {
      toast.error("Failed to fetch standings");
    } finally {
      setLoadingStandings(false);
    }
  };

  if (loading) return (
    <div className="page-container">
      <SkeletonTable rows={6} cols={7} />
    </div>
  );

  return (
    <div className="page-container">
      <PageHeader title="Tournament Leaderboard" subtitle="View standings for each tournament category" accent="🏅" />

      {/* Tournament Selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mb-8"
      >
        <label className="block text-xs font-semibold text-[#4AEEFF]/70 mb-2 uppercase tracking-wider">
          Select Tournament
        </label>
        <select
          value={selectedTournament}
          onChange={(e) => setSelectedTournament(e.target.value)}
          className="input-field max-w-md"
        >
          {tournaments.map((t) => (
            <option key={t.id} value={t.id} style={{ background: "#0d2d38" }}>
              {t.name} ({t.status})
            </option>
          ))}
        </select>
      </motion.div>

      {loadingStandings ? (
        <SkeletonTable rows={6} cols={7} />
      ) : standings.length === 0 ? (
        <EmptyState
          icon="🏅"
          title="No standings yet"
          description="Complete matches in this tournament to generate rankings."
        />
      ) : (
        <div className="space-y-8">
          {standings.map((category, ci) => (
            <motion.div
              key={category.categoryId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ci * 0.1 }}
              className="card"
            >
              {/* Category header */}
              <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
                <div>
                  <h2 className="text-xl font-bold text-white">{category.categoryName}</h2>
                  <p className="text-sm text-[#D8FBFF]/50 mt-1">
                    {category.totalPlayers} players · {category.completedMatches} matches completed
                  </p>
                </div>
              </div>

              {/* Podium for top 3 */}
              {category.standings.length >= 2 && (
                <Podium top3={category.standings.slice(0, 3)} />
              )}

              {/* Full table */}
              <div className="overflow-x-auto rounded-xl border border-[#12679E]/30">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#0d2d38] border-b border-[#12679E]/30">
                      {["Rank", "Player", "Played", "Wins", "Losses", "Games W/L", "Points"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#4AEEFF]/60 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {category.standings.map((player, index) => (
                      <motion.tr
                        key={player.playerId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.04 }}
                        className={`border-b border-[#12679E]/15 transition-colors duration-150
                          ${index < 3 ? "hover:bg-[#4AEEFF]/5" : "hover:bg-[#12679E]/10"}`}
                      >
                        <td className="px-4 py-3">
                          <Medal rank={index} />
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <Link
                              to={`/profile/${player.playerId}`}
                              className="text-sm font-semibold text-[#4AEEFF] hover:text-[#CFF9FF]
                                         hover:underline transition-colors"
                            >
                              {player.playerName}
                            </Link>
                            <WinRateBar wins={player.wins} total={player.matchesPlayed} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#D8FBFF]/70 text-center">
                          {player.matchesPlayed}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-semibold text-green-400">{player.wins}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-semibold text-red-400">{player.losses}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#D8FBFF]/60 text-center">
                          {player.gamesWon} / {player.gamesLost}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-sm font-black ${index === 0 ? "text-yellow-400 text-lg" : "text-[#4AEEFF]"}`}>
                            {player.points}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
