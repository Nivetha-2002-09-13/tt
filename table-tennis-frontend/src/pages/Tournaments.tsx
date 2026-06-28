import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import { MagnifyingGlassIcon, PlusIcon, MapPinIcon, CalendarIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { SkeletonTournamentCards, EmptyState, PageHeader, StatusBadge } from "../components/UI";

interface Tournament {
  id: string;
  name: string;
  description: string;
  venue: string;
  startDate: string;
  endDate: string;
  status: string;
  _count: { registrations: number };
}

const FILTERS = ["ALL", "UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"] as const;
type Filter = (typeof FILTERS)[number];

const Tournaments: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [venueFilter, setVenueFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { fetchTournaments(); }, []);

  const fetchTournaments = async () => {
    try {
      const response = await api.get("/tournaments");
      setTournaments(response.data.data);
    } catch {
      toast.error("Failed to fetch tournaments");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let result = tournaments;
    if (filter !== "ALL") result = result.filter((t) => t.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.venue.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
      );
    }
    if (venueFilter.trim()) {
      const v = venueFilter.toLowerCase();
      result = result.filter((t) => t.venue.toLowerCase().includes(v));
    }
    if (dateFrom) {
      result = result.filter((t) => new Date(t.startDate) >= new Date(dateFrom));
    }
    if (dateTo) {
      result = result.filter((t) => new Date(t.startDate) <= new Date(dateTo));
    }
    return result;
  }, [tournaments, filter, search, venueFilter, dateFrom, dateTo]);

  const countByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tournaments) {
      counts[t.status] = (counts[t.status] ?? 0) + 1;
    }
    return counts;
  }, [tournaments]);

  const getDaysLeft = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return null;
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    return `${days}d left`;
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Tournaments"
        subtitle="Find and join table tennis tournaments"
        accent="🏆"
        action={
          user?.role === "ADMIN" ? (
            <Link to="/app/create-tournament" className="btn-primary flex items-center gap-2">
              <PlusIcon className="w-4 h-4" />
              Create Tournament
            </Link>
          ) : undefined
        }
      />

      {/* ── Search + Filter ── */}
      <div className="mb-8 space-y-4">
        {/* Search bar */}
        <div className="relative max-w-xl">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4AEEFF]/40" />
          <input
            type="text"
            placeholder="Search by name, venue, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-12 pr-4"
          />
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2 items-center">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={filter === f ? "filter-pill-active" : "filter-pill"}
            >
              {f === "ALL" ? `All (${tournaments.length})` : `${f} (${countByStatus[f] ?? 0})`}
            </button>
          ))}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
              ${showAdvanced ? "bg-[#4AEEFF]/20 text-[#4AEEFF] border border-[#4AEEFF]/40" : "bg-[#12679E]/20 text-[#D8FBFF]/50 border border-[#12679E]/30 hover:text-white"}`}
          >
            🔍 Advanced Filter
          </button>
        </div>

        {/* Advanced filters */}
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#061D23] border border-[#12679E]/30"
          >
            <div>
              <label className="text-xs text-[#D8FBFF]/40 font-bold uppercase tracking-wider block mb-1">Venue</label>
              <input
                type="text"
                placeholder="Filter by venue..."
                value={venueFilter}
                onChange={(e) => setVenueFilter(e.target.value)}
                className="input-field w-full text-sm py-2"
              />
            </div>
            <div>
              <label className="text-xs text-[#D8FBFF]/40 font-bold uppercase tracking-wider block mb-1">Start From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input-field w-full text-sm py-2"
              />
            </div>
            <div>
              <label className="text-xs text-[#D8FBFF]/40 font-bold uppercase tracking-wider block mb-1">Start To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="input-field w-full text-sm py-2"
              />
            </div>
            {(venueFilter || dateFrom || dateTo) && (
              <button
                onClick={() => { setVenueFilter(""); setDateFrom(""); setDateTo(""); }}
                className="text-xs text-[#e11d48] hover:underline self-end"
              >
                Clear filters ✕
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <SkeletonTournamentCards count={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🏆"
          title={search || filter !== "ALL" ? "No tournaments match your filter" : "No tournaments yet"}
          description={
            search || filter !== "ALL"
              ? "Try clearing filters or searching something else."
              : "No tournaments have been created yet."
          }
          action={
            user?.role === "ADMIN"
              ? { label: "Create First Tournament", onClick: () => navigate("/app/create-tournament") }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((tournament, i) => {
            const daysLeft = tournament.status === "UPCOMING" ? getDaysLeft(tournament.startDate) : null;
            return (
              <motion.div
                key={tournament.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
              >
                <Link to={`/tournaments/${tournament.id}`} className="block h-full">
                  <div
                    className="group h-full rounded-2xl border border-[#12679E]/30
                                bg-gradient-to-br from-[#123B4A]/80 to-[#061D23]
                                p-6 transition-all duration-300
                                hover:border-[#4AEEFF]/50
                                hover:shadow-[0_12px_40px_rgba(74,238,255,0.1)]
                                hover:-translate-y-1 cursor-pointer flex flex-col"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#12679E] to-[#4AEEFF]/20
                                      flex items-center justify-center text-2xl
                                      group-hover:scale-110 transition-transform duration-300">
                        🏆
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <StatusBadge status={tournament.status} />
                        {daysLeft && (
                          <span className="text-xs text-[#4AEEFF]/70 font-medium bg-[#4AEEFF]/10
                                           px-2 py-0.5 rounded-full border border-[#4AEEFF]/20">
                            {daysLeft}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 flex-shrink-0">
                      {tournament.name}
                    </h3>

                    {/* Description */}
                    <p className="text-[#D8FBFF]/50 text-sm mb-4 line-clamp-2 flex-1">
                      {tournament.description || "No description provided."}
                    </p>

                    {/* Meta */}
                    <div className="space-y-2 text-xs text-[#D8FBFF]/60 border-t border-[#12679E]/20 pt-4">
                      <div className="flex items-center gap-2">
                        <MapPinIcon className="w-3.5 h-3.5 text-[#4AEEFF]/60 flex-shrink-0" />
                        <span className="truncate">{tournament.venue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-3.5 h-3.5 text-[#4AEEFF]/60 flex-shrink-0" />
                        <span>{new Date(tournament.startDate).toLocaleDateString()} – {new Date(tournament.endDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserGroupIcon className="w-3.5 h-3.5 text-[#4AEEFF]/60 flex-shrink-0" />
                        <span>{tournament._count.registrations} participants</span>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#4AEEFF] group-hover:underline">
                        View Details →
                      </span>
                      {tournament.status === "UPCOMING" && (
                        <span className="text-xs bg-[#4AEEFF]/10 border border-[#4AEEFF]/30
                                          text-[#4AEEFF] px-2.5 py-1 rounded-full font-semibold">
                          Register Now
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Tournaments;
