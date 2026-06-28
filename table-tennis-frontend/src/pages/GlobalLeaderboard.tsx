import React, { useEffect, useState } from "react";
import api from "../services/api";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { SkeletonTable, EmptyState, PageHeader, WinRateBar, Medal } from "../components/UI";

interface Player {
  playerId: string;
  playerName: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  points: number;
  gamesWon: number;
  gamesLost: number;
}

interface Category {
  id: string;
  name: string;
  type: string;
}

const GlobalLeaderboard: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [standings, setStandings] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => { fetchAllCategories(); }, []);
  useEffect(() => { if (selectedCategory) fetchGlobalStandings(); }, [selectedCategory]);

  const fetchAllCategories = async () => {
    try {
      const response = await api.get("/tournaments");
      const tournaments = response.data.data;
      const uniqueCategories = new Map();
      for (const tournament of tournaments) {
        for (const category of tournament.categories ?? []) {
          if (!uniqueCategories.has(category.name)) {
            uniqueCategories.set(category.name, category);
          }
        }
      }
      setCategories(Array.from(uniqueCategories.values()));
    } catch {
      console.error("Failed to fetch categories");
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchGlobalStandings = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/results/global/${encodeURIComponent(selectedCategory)}`);
      setStandings(response.data.data.standings);
    } catch {
      console.error("Failed to fetch global standings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Global Rankings"
        subtitle="Cross-tournament player rankings by category"
        accent="🌍"
      />

      {/* Category Selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mb-8"
      >
        <label className="block text-xs font-semibold text-[#4AEEFF]/70 mb-2 uppercase tracking-wider">
          Select Category
        </label>
        {loadingCategories ? (
          <div className="h-10 w-64 skeleton rounded-xl" />
        ) : (
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field max-w-md"
          >
            <option value="" style={{ background: "#0d2d38" }}>-- Select a category --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name} style={{ background: "#0d2d38" }}>
                {c.name} ({c.type})
              </option>
            ))}
          </select>
        )}
        <p className="text-xs text-[#D8FBFF]/40 mt-2">
          Rankings are accumulated across ALL tournaments for the selected category.
        </p>
      </motion.div>

      {/* Standings */}
      {selectedCategory && (
        loading ? (
          <SkeletonTable rows={8} cols={7} />
        ) : standings.length === 0 ? (
          <EmptyState
            icon="🌍"
            title="No rankings yet"
            description="No completed matches found for this category. Play and complete matches to see global rankings."
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {selectedCategory} — Overall Rankings
                </h2>
                <p className="text-sm text-[#D8FBFF]/50 mt-1">
                  {standings.length} players ranked globally
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#12679E]/30">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#0d2d38] border-b border-[#12679E]/30">
                    {["Rank", "Player", "Matches", "Wins", "Losses", "Points", "Games"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold
                                              text-[#4AEEFF]/60 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {standings.map((player, index) => (
                    <motion.tr
                      key={player.playerId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="border-b border-[#12679E]/15 hover:bg-[#12679E]/10 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Medal rank={index} />
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/profile/${player.playerId}`}
                          className="text-sm font-semibold text-[#4AEEFF] hover:text-[#CFF9FF]
                                     hover:underline transition-colors block"
                        >
                          {player.playerName}
                        </Link>
                        <WinRateBar wins={player.wins} total={player.matchesPlayed} />
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
                      <td className="px-4 py-3 text-center">
                        <span className={`font-black ${index === 0 ? "text-yellow-400 text-lg" : "text-[#4AEEFF] text-sm"}`}>
                          {player.points}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#D8FBFF]/60 text-center">
                        {player.gamesWon} – {player.gamesLost}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )
      )}
    </div>
  );
};

export default GlobalLeaderboard;
