import React from "react";
import { Link } from "react-router-dom";
import { ClipboardDocumentListIcon, StarIcon } from "@heroicons/react/24/outline";

export const RefereeDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="bg-[#12679E]/10 border border-[#12679E]/30 rounded-xl p-6">
        <h2 className="text-xl font-bison text-[#4AEEFF] tracking-wider mb-4">Referee Control Panel</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/app/tournaments" className="flex flex-col items-center p-4 bg-[#061D23] rounded-lg border border-[#12679E]/40 hover:border-[#4AEEFF] transition-all">
            <ClipboardDocumentListIcon className="w-8 h-8 text-[#4AEEFF] mb-2" />
            <span className="text-sm font-bold text-white">Input Match Scores</span>
          </Link>
          <div className="flex flex-col items-center p-4 bg-[#061D23] rounded-lg border border-[#12679E]/40 hover:border-[#4AEEFF] transition-all cursor-pointer">
            <StarIcon className="w-8 h-8 text-[#4AEEFF] mb-2" />
            <span className="text-sm font-bold text-white">Review Assignments</span>
          </div>
        </div>
      </div>
    </div>
  );
};
