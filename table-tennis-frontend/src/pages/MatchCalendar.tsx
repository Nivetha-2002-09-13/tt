import React, { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from "date-fns";

interface ScheduledMatch {
  id: string;
  round: string;
  status: string;
  scheduledTime: string | null;
  player1: { id: string; firstName: string; lastName: string } | null;
  player2: { id: string; firstName: string; lastName: string } | null;
  score: string | null;
  tournamentName?: string;
  categoryName?: string;
}

const MatchCalendar: React.FC = () => {
  const [matches, setMatches] = useState<ScheduledMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<ScheduledMatch | null>(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const res = await api.get("/matches/all-scheduled");
      setMatches(res.data.data || []);
    } catch {
      // If endpoint doesn't exist, show empty calendar
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const matchesByDay = useMemo(() => {
    const map: Record<string, ScheduledMatch[]> = {};
    matches.forEach((m) => {
      if (m.scheduledTime) {
        const key = format(new Date(m.scheduledTime), "yyyy-MM-dd");
        if (!map[key]) map[key] = [];
        map[key].push(m);
      }
    });
    return map;
  }, [matches]);

  const selectedDayMatches = useMemo(() => {
    if (!selectedDay) return [];
    const key = format(selectedDay, "yyyy-MM-dd");
    return matchesByDay[key] || [];
  }, [selectedDay, matchesByDay]);

  const startPadding = getDay(startOfMonth(currentMonth)); // 0 = Sunday

  const statusColor = (status: string) => {
    if (status === "COMPLETED") return "bg-green-500";
    if (status === "IN_PROGRESS") return "bg-yellow-400 animate-pulse";
    return "bg-[#4AEEFF]";
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight">📅 Match Schedule</h1>
        <p className="text-[#D8FBFF]/50 mt-1">All matches calendar view — click a day to see match details</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Panel */}
        <div className="lg:col-span-2">
          <div className="card p-0 overflow-hidden">
            {/* Month Navigation */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#12679E]/30 bg-gradient-to-r from-[#061D23] to-[#0A2535]">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 rounded-lg hover:bg-[#12679E]/30 text-[#4AEEFF] transition-colors"
              >
                ‹
              </button>
              <h2 className="text-xl font-bold text-white">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 rounded-lg hover:bg-[#12679E]/30 text-[#4AEEFF] transition-colors"
              >
                ›
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-[#12679E]/20">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="py-3 text-center text-xs font-bold text-[#D8FBFF]/40 uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            {loading ? (
              <div className="flex items-center justify-center h-64 text-[#D8FBFF]/40">Loading matches...</div>
            ) : (
              <div className="grid grid-cols-7">
                {/* Padding cells */}
                {Array.from({ length: startPadding }).map((_, i) => (
                  <div key={`pad-${i}`} className="h-20 border-b border-r border-[#12679E]/10" />
                ))}

                {daysInMonth.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  const dayMatches = matchesByDay[key] || [];
                  const isSelected = selectedDay && isSameDay(day, selectedDay);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <motion.div
                      key={key}
                      whileHover={{ backgroundColor: "rgba(74,238,255,0.05)" }}
                      onClick={() => setSelectedDay(day)}
                      className={`h-20 p-2 border-b border-r border-[#12679E]/10 cursor-pointer relative transition-colors
                        ${isSelected ? "bg-[#4AEEFF]/10 border-[#4AEEFF]/40" : ""}
                        ${dayMatches.length > 0 ? "hover:bg-[#4AEEFF]/10" : ""}
                      `}
                    >
                      <span className={`text-xs font-bold inline-flex items-center justify-center w-6 h-6 rounded-full
                        ${isToday ? "bg-[#e11d48] text-white" : isSelected ? "bg-[#4AEEFF] text-black" : "text-[#D8FBFF]/60"}
                      `}>
                        {format(day, "d")}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {dayMatches.slice(0, 2).map((m) => (
                          <div key={m.id} className={`h-1.5 rounded-full ${statusColor(m.status)}`} />
                        ))}
                        {dayMatches.length > 2 && (
                          <span className="text-[10px] text-[#4AEEFF] font-bold">+{dayMatches.length - 2}</span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Legend */}
            <div className="px-6 py-3 border-t border-[#12679E]/20 flex gap-4 text-xs text-[#D8FBFF]/50">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#4AEEFF]" /> Scheduled</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-yellow-400" /> In Progress</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500" /> Completed</div>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          {selectedDay ? (
            <div className="card">
              <h3 className="text-lg font-bold text-white mb-4">
                {format(selectedDay, "EEEE, MMM d")}
              </h3>
              {selectedDayMatches.length === 0 ? (
                <div className="text-center py-8 text-[#D8FBFF]/40">
                  <div className="text-4xl mb-2">🏓</div>
                  <p>No matches scheduled</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayMatches.map((m) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 rounded-xl bg-[#061D23] border border-[#12679E]/30 cursor-pointer hover:border-[#4AEEFF]/50 transition-all"
                      onClick={() => setSelectedMatch(m)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-[#4AEEFF] uppercase tracking-wider">
                          {m.round}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase
                          ${m.status === "COMPLETED" ? "bg-green-500/20 text-green-400" :
                            m.status === "IN_PROGRESS" ? "bg-yellow-400/20 text-yellow-400" :
                            "bg-[#4AEEFF]/10 text-[#4AEEFF]"}
                        `}>
                          {m.status}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-white truncate">
                        {m.player1 ? `${m.player1.firstName} ${m.player1.lastName}` : "TBD"}
                      </p>
                      <p className="text-xs text-[#D8FBFF]/40 my-1 text-center">vs</p>
                      <p className="text-sm font-semibold text-white truncate">
                        {m.player2 ? `${m.player2.firstName} ${m.player2.lastName}` : "TBD"}
                      </p>
                      {m.scheduledTime && (
                        <p className="text-xs text-[#4AEEFF] mt-2">
                          🕐 {format(new Date(m.scheduledTime), "h:mm a")}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="card text-center py-12">
              <div className="text-5xl mb-3">📅</div>
              <p className="text-white font-semibold">Select a day</p>
              <p className="text-[#D8FBFF]/40 text-sm mt-1">Click on a date to view matches</p>
            </div>
          )}

          {/* Upcoming matches summary */}
          <div className="card">
            <h3 className="text-sm font-bold text-[#D8FBFF]/60 uppercase tracking-wider mb-3">Upcoming Matches</h3>
            {matches
              .filter(m => m.scheduledTime && new Date(m.scheduledTime) > new Date() && m.status !== "COMPLETED")
              .sort((a, b) => new Date(a.scheduledTime!).getTime() - new Date(b.scheduledTime!).getTime())
              .slice(0, 5)
              .map((m) => (
                <div key={m.id} className="flex items-center gap-3 py-2 border-b border-[#12679E]/10 last:border-0">
                  <div className="text-[#4AEEFF] font-bold text-xs w-12 shrink-0">
                    {m.scheduledTime ? format(new Date(m.scheduledTime), "MMM d") : "TBD"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">
                      {m.player1 ? `${m.player1.firstName} ${m.player1.lastName}` : "TBD"} vs {m.player2 ? `${m.player2.firstName} ${m.player2.lastName}` : "TBD"}
                    </p>
                    <p className="text-xs text-[#D8FBFF]/40">{m.round}</p>
                  </div>
                </div>
              ))}
            {matches.filter(m => m.scheduledTime && new Date(m.scheduledTime) > new Date()).length === 0 && (
              <p className="text-[#D8FBFF]/40 text-sm text-center py-4">No upcoming matches</p>
            )}
          </div>
        </div>
      </div>

      {/* Match Detail Popup */}
      <AnimatePresence>
        {selectedMatch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedMatch(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0A2535] border border-[#12679E]/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-[#4AEEFF] uppercase tracking-wider">{selectedMatch.round}</span>
                <button onClick={() => setSelectedMatch(null)} className="text-[#D8FBFF]/40 hover:text-white">✕</button>
              </div>
              <div className="text-center mb-4">
                <div className="text-2xl font-black text-white">
                  {selectedMatch.player1 ? `${selectedMatch.player1.firstName} ${selectedMatch.player1.lastName}` : "TBD"}
                </div>
                <div className="text-[#D8FBFF]/40 my-2">vs</div>
                <div className="text-2xl font-black text-white">
                  {selectedMatch.player2 ? `${selectedMatch.player2.firstName} ${selectedMatch.player2.lastName}` : "TBD"}
                </div>
              </div>
              {selectedMatch.score && (
                <div className="text-center text-[#f3d360] font-bold text-lg mt-2">Score: {selectedMatch.score}</div>
              )}
              {selectedMatch.scheduledTime && (
                <div className="text-center text-[#4AEEFF] text-sm mt-2">
                  📅 {format(new Date(selectedMatch.scheduledTime), "PPPp")}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MatchCalendar;
