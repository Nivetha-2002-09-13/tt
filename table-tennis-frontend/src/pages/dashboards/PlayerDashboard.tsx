import React from "react";
import { Link } from "react-router-dom";
import { CalendarIcon, TrophyIcon, ChartBarIcon } from "@heroicons/react/24/outline";

export const PlayerDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="bg-[#12679E]/10 border border-[#12679E]/30 rounded-xl p-6">
        <h2 className="text-xl font-bison text-[#4AEEFF] tracking-wider mb-4">My Player Portal</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/app/my-matches" className="flex flex-col items-center p-4 bg-[#061D23] rounded-lg border border-[#12679E]/40 hover:border-[#4AEEFF] transition-all">
            <CalendarIcon className="w-8 h-8 text-[#4AEEFF] mb-2" />
            <span className="text-sm font-bold text-white">Upcoming Matches</span>
          </Link>
          <Link to="/app/my-registrations" className="flex flex-col items-center p-4 bg-[#061D23] rounded-lg border border-[#12679E]/40 hover:border-[#4AEEFF] transition-all">
            <TrophyIcon className="w-8 h-8 text-[#4AEEFF] mb-2" />
            <span className="text-sm font-bold text-white">My Tournaments</span>
          </Link>
          <Link to="/app/leaderboard" className="flex flex-col items-center p-4 bg-[#061D23] rounded-lg border border-[#12679E]/40 hover:border-[#4AEEFF] transition-all">
            <ChartBarIcon className="w-8 h-8 text-[#4AEEFF] mb-2" />
            <span className="text-sm font-bold text-white">Global Ranking</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
