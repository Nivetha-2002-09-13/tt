import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface GameScore {
  player1Points: number;
  player2Points: number;
  gameNumber: number;
}

interface MatchScorecardData {
  id: string;
  round: string;
  status: string;
  score: string | null;
  scheduledTime: string | null;
  bestOf: number;
  player1: { id: string; firstName: string; lastName: string } | null;
  player2: { id: string; firstName: string; lastName: string } | null;
  winnerId: string | null;
  referee?: { firstName: string; lastName: string } | null;
  tournamentName?: string;
  categoryName?: string;
}

const parseGames = (score: string | null): GameScore[] => {
  if (!score) return [];
  return score.split(",").map((part, i) => {
    const [a, b] = part.trim().split("-").map(Number);
    return { gameNumber: i + 1, player1Points: isNaN(a) ? 0 : a, player2Points: isNaN(b) ? 0 : b };
  });
};

const MatchScorecard: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const [match, setMatch] = useState<MatchScorecardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (matchId) fetchMatch();
  }, [matchId]);

  const fetchMatch = async () => {
    try {
      const res = await api.get(`/matches/${matchId}`);
      setMatch(res.data.data);
    } catch {
      setMatch(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-[#4AEEFF]/20 border-t-[#4AEEFF] rounded-full animate-spin" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="page-container text-center py-24">
        <div className="text-6xl mb-4">🏓</div>
        <p className="text-white font-bold text-xl">Match not found</p>
        <Link to="/tournaments" className="text-[#4AEEFF] mt-4 inline-block hover:underline">← Back to Tournaments</Link>
      </div>
    );
  }

  const games = parseGames(match.score);
  const p1Name = match.player1 ? `${match.player1.firstName} ${match.player1.lastName}` : "TBD";
  const p2Name = match.player2 ? `${match.player2.firstName} ${match.player2.lastName}` : "TBD";
  const p1Wins = games.filter((g) => g.player1Points > g.player2Points).length;
  const p2Wins = games.filter((g) => g.player2Points > g.player1Points).length;
  const p1Won = match.winnerId === match.player1?.id;
  const p2Won = match.winnerId === match.player2?.id;

  return (
    <div className="page-container max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#D8FBFF]/40 mb-6">
        <Link to="/tournaments" className="hover:text-[#4AEEFF] transition-colors">Tournaments</Link>
        <span>›</span>
        <span className="text-[#D8FBFF]/70">Match Scorecard</span>
      </div>

      {/* Match Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mb-6 text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#e11d48] via-[#4AEEFF] to-[#e11d48]" />
        
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider
            ${match.status === "COMPLETED" ? "bg-green-500/20 text-green-400" :
              match.status === "IN_PROGRESS" ? "bg-yellow-400/20 text-yellow-400" :
              "bg-[#4AEEFF]/10 text-[#4AEEFF]"}
          `}>
            {match.status}
          </span>
          <span className="text-xs text-[#D8FBFF]/40">{match.round}</span>
        </div>

        {match.tournamentName && (
          <p className="text-[#D8FBFF]/50 text-sm mb-4">{match.tournamentName} · {match.categoryName}</p>
        )}

        <div className="grid grid-cols-3 gap-4 items-center mt-4">
          {/* Player 1 */}
          <div className={`text-center ${p1Won ? "opacity-100" : match.status === "COMPLETED" ? "opacity-50" : "opacity-100"}`}>
            <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-[#12679E] to-[#4AEEFF]/30 border-2 flex items-center justify-center text-2xl font-black text-white mx-auto mb-2
              ${p1Won ? "border-[#f3d360] shadow-[0_0_20px_rgba(243,211,96,0.4)]" : "border-[#12679E]/50"}
            `}>
              {match.player1 ? `${match.player1.firstName[0]}${match.player1.lastName[0]}` : "?"}
            </div>
            <p className="font-bold text-white text-sm">{p1Name}</p>
            {p1Won && <div className="text-xs text-[#f3d360] font-bold mt-1">🏆 WINNER</div>}
          </div>

          {/* Score */}
          <div className="text-center">
            {match.status === "COMPLETED" || games.length > 0 ? (
              <div className="flex items-center justify-center gap-3">
                <span className={`text-5xl font-black ${p1Won ? "text-[#f3d360]" : "text-white"}`}>{p1Wins}</span>
                <span className="text-[#D8FBFF]/30 text-2xl">-</span>
                <span className={`text-5xl font-black ${p2Won ? "text-[#f3d360]" : "text-white"}`}>{p2Wins}</span>
              </div>
            ) : (
              <div className="text-3xl text-[#D8FBFF]/30">VS</div>
            )}
            {match.scheduledTime && (
              <p className="text-xs text-[#D8FBFF]/40 mt-2">
                📅 {format(new Date(match.scheduledTime), "MMM d, h:mm a")}
              </p>
            )}
          </div>

          {/* Player 2 */}
          <div className={`text-center ${p2Won ? "opacity-100" : match.status === "COMPLETED" ? "opacity-50" : "opacity-100"}`}>
            <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-[#e11d48]/30 to-[#e11d48]/60 border-2 flex items-center justify-center text-2xl font-black text-white mx-auto mb-2
              ${p2Won ? "border-[#f3d360] shadow-[0_0_20px_rgba(243,211,96,0.4)]" : "border-[#e11d48]/30"}
            `}>
              {match.player2 ? `${match.player2.firstName[0]}${match.player2.lastName[0]}` : "?"}
            </div>
            <p className="font-bold text-white text-sm">{p2Name}</p>
            {p2Won && <div className="text-xs text-[#f3d360] font-bold mt-1">🏆 WINNER</div>}
          </div>
        </div>
      </motion.div>

      {/* Set-by-Set Scorecard */}
      {games.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card mb-6"
        >
          <h2 className="text-lg font-bold text-white mb-4">Set-by-Set Scores</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#12679E]/30">
                  <th className="text-left py-2 text-[#D8FBFF]/50 font-semibold">Player</th>
                  {games.map((g) => (
                    <th key={g.gameNumber} className="text-center py-2 text-[#D8FBFF]/50 font-semibold w-12">
                      S{g.gameNumber}
                    </th>
                  ))}
                  <th className="text-center py-2 text-[#D8FBFF]/50 font-semibold w-16">Sets</th>
                </tr>
              </thead>
              <tbody>
                {/* Player 1 Row */}
                <tr className="border-b border-[#12679E]/10">
                  <td className="py-3 text-white font-semibold truncate max-w-[120px]">{p1Name}</td>
                  {games.map((g) => {
                    const won = g.player1Points > g.player2Points;
                    return (
                      <td key={g.gameNumber} className={`text-center py-3 font-bold text-xl ${won ? "text-[#4AEEFF]" : "text-[#D8FBFF]/50"}`}>
                        {g.player1Points}
                      </td>
                    );
                  })}
                  <td className={`text-center py-3 font-black text-2xl ${p1Won ? "text-[#f3d360]" : "text-white"}`}>{p1Wins}</td>
                </tr>
                {/* Player 2 Row */}
                <tr>
                  <td className="py-3 text-white font-semibold truncate max-w-[120px]">{p2Name}</td>
                  {games.map((g) => {
                    const won = g.player2Points > g.player1Points;
                    return (
                      <td key={g.gameNumber} className={`text-center py-3 font-bold text-xl ${won ? "text-[#4AEEFF]" : "text-[#D8FBFF]/50"}`}>
                        {g.player2Points}
                      </td>
                    );
                  })}
                  <td className={`text-center py-3 font-black text-2xl ${p2Won ? "text-[#f3d360]" : "text-white"}`}>{p2Wins}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Match Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <h2 className="text-lg font-bold text-white mb-4">Match Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-[#D8FBFF]/40 uppercase tracking-wider mb-1">Round</p>
            <p className="text-white font-semibold">{match.round}</p>
          </div>
          <div>
            <p className="text-xs text-[#D8FBFF]/40 uppercase tracking-wider mb-1">Format</p>
            <p className="text-white font-semibold">Best of {match.bestOf || 5}</p>
          </div>
          {match.scheduledTime && (
            <div>
              <p className="text-xs text-[#D8FBFF]/40 uppercase tracking-wider mb-1">Scheduled</p>
              <p className="text-white font-semibold">{format(new Date(match.scheduledTime), "PPPp")}</p>
            </div>
          )}
          {match.referee && (
            <div>
              <p className="text-xs text-[#D8FBFF]/40 uppercase tracking-wider mb-1">Referee</p>
              <p className="text-white font-semibold">{match.referee.firstName} {match.referee.lastName}</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default MatchScorecard;
