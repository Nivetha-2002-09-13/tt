import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";
import toast from "react-hot-toast";
import { MapPinIcon, ClockIcon } from "@heroicons/react/24/outline";
import { SkeletonTable, EmptyState, PageHeader, StatusBadge } from "../components/UI";

interface Match {
  id: string;
  round: string;
  matchNumber: number;
  scheduledTime: string;
  status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  score: string | null;
  winnerId: string | null;
  player1: { id: string; firstName: string; lastName: string } | null;
  player2: { id: string; firstName: string; lastName: string } | null;
  tournament: { id: string; name: string; venue: string };
  category: { name: string; type: string };
}

type Filter = "all" | "upcoming" | "completed";

const MyMatches: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => { fetchMatches(); }, []);

  const fetchMatches = async () => {
    try {
      const response = await api.get("/matches/my-matches");
      setMatches(response.data.data);
    } catch {
      toast.error("Failed to fetch matches");
    } finally {
      setLoading(false);
    }
  };

  const filteredMatches = matches.filter((m) => {
    if (filter === "upcoming") return m.status === "SCHEDULED";
    if (filter === "completed") return m.status === "COMPLETED";
    return true;
  });

  const completedMatches = matches.filter((m) => m.status === "COMPLETED").length;

  const filterTabs: { key: Filter; label: string; count: number }[] = [
    { key: "all",       label: "All Matches",  count: matches.length },
    { key: "upcoming",  label: "Upcoming",     count: matches.filter((m) => m.status === "SCHEDULED").length },
    { key: "completed", label: "Completed",    count: completedMatches },
  ];

  if (loading) {
    return (
      <div className="page-container">
        <SkeletonTable rows={5} cols={4} />
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title="My Matches"
        subtitle={`${matches.length} total matches`}
        accent="🏓"
      />

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={filter === tab.key ? "filter-pill-active" : "filter-pill"}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {filteredMatches.length === 0 ? (
        <EmptyState
          icon="🏓"
          title="No matches found"
          description={
            filter !== "all"
              ? "No matches in this category. Try viewing all matches."
              : "You haven't played any matches yet."
          }
          action={filter !== "all" ? { label: "View All Matches", onClick: () => setFilter("all") } : undefined}
        />
      ) : (
        <div className="space-y-4">
          {filteredMatches.map((match, i) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="card-hover p-6"
            >
              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <StatusBadge status={match.status} />
                  <span className="text-xs text-[#D8FBFF]/50 bg-[#12679E]/20
                                   px-2.5 py-1 rounded-full border border-[#12679E]/30">
                    {match.category.name} · {match.round}
                  </span>
                </div>
                <Link
                  to={`/tournaments/${match.tournament.id}`}
                  className="text-sm font-semibold text-[#4AEEFF] hover:text-[#CFF9FF]
                             hover:underline transition-colors"
                >
                  {match.tournament.name} →
                </Link>
              </div>

              {/* Players vs */}
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="flex-1 text-right">
                  <div className="inline-flex flex-col items-end">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#12679E] to-[#4AEEFF]/30
                                    border border-[#4AEEFF]/30 flex items-center justify-center
                                    text-sm font-bold text-white mb-2">
                      {match.player1
                        ? `${match.player1.firstName[0]}${match.player1.lastName[0]}`
                        : "?"}
                    </div>
                    <p className="text-sm font-semibold text-white">
                      {match.player1
                        ? `${match.player1.firstName} ${match.player1.lastName}`
                        : "TBD"}
                    </p>
                  </div>
                </div>

                <div className="flex-shrink-0 flex flex-col items-center">
                  {match.score ? (
                    <div className="px-4 py-2 rounded-xl bg-[#12679E]/30 border border-[#4AEEFF]/30">
                      <p className="text-lg font-black text-[#4AEEFF] text-center">{match.score}</p>
                    </div>
                  ) : (
                    <div className="text-2xl font-black text-[#D8FBFF]/30">VS</div>
                  )}
                </div>

                <div className="flex-1 text-left">
                  <div className="inline-flex flex-col items-start">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#123B4A] to-[#12679E]/40
                                    border border-[#12679E]/30 flex items-center justify-center
                                    text-sm font-bold text-white mb-2">
                      {match.player2
                        ? `${match.player2.firstName[0]}${match.player2.lastName[0]}`
                        : "?"}
                    </div>
                    <p className="text-sm font-semibold text-white">
                      {match.player2
                        ? `${match.player2.firstName} ${match.player2.lastName}`
                        : "TBD"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#D8FBFF]/50 pt-4
                              border-t border-[#12679E]/20">
                <div className="flex items-center gap-1.5">
                  <MapPinIcon className="w-3.5 h-3.5 text-[#4AEEFF]/60" />
                  {match.tournament.venue}
                </div>
                <div className="flex items-center gap-1.5">
                  <ClockIcon className="w-3.5 h-3.5 text-[#4AEEFF]/60" />
                  {new Date(match.scheduledTime).toLocaleString()}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyMatches;
