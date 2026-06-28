import React from "react";
import { Link } from "react-router-dom";
import { PlusIcon, UserGroupIcon, ShieldCheckIcon, CogIcon } from "@heroicons/react/24/outline";

export const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="bg-[#12679E]/10 border border-[#12679E]/30 rounded-xl p-6">
        <h2 className="text-xl font-bison text-[#4AEEFF] tracking-wider mb-4">Admin Controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/app/create-tournament" className="flex flex-col items-center p-4 bg-[#061D23] rounded-lg border border-[#12679E]/40 hover:border-[#4AEEFF] transition-all">
            <PlusIcon className="w-8 h-8 text-[#4AEEFF] mb-2" />
            <span className="text-sm font-bold text-white">Create Tournament</span>
          </Link>
          <Link to="/app/admin-requests" className="flex flex-col items-center p-4 bg-[#061D23] rounded-lg border border-[#12679E]/40 hover:border-[#4AEEFF] transition-all">
            <ShieldCheckIcon className="w-8 h-8 text-[#4AEEFF] mb-2" />
            <span className="text-sm font-bold text-white">Pending Approvals</span>
          </Link>
          <Link to="/app/tournaments" className="flex flex-col items-center p-4 bg-[#061D23] rounded-lg border border-[#12679E]/40 hover:border-[#4AEEFF] transition-all">
            <CogIcon className="w-8 h-8 text-[#4AEEFF] mb-2" />
            <span className="text-sm font-bold text-white">Generate Draws</span>
          </Link>
          <Link to="/app/users" className="flex flex-col items-center p-4 bg-[#061D23] rounded-lg border border-[#12679E]/40 hover:border-[#4AEEFF] transition-all">
            <UserGroupIcon className="w-8 h-8 text-[#4AEEFF] mb-2" />
            <span className="text-sm font-bold text-white">Manage Users</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
