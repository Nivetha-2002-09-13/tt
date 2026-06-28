import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";
import toast from "react-hot-toast";
import { MapPinIcon, CalendarIcon } from "@heroicons/react/24/outline";
import { SkeletonCard, EmptyState, PageHeader } from "../components/UI";

interface Registration {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  registeredAt: string;
  tournament: {
    id: string;
    name: string;
    venue: string;
    startDate: string;
    status: string;
  };
  category: {
    id: string;
    name: string;
    type: string;
  };
}

const statusConfig: Record<string, { color: string; bg: string; border: string; icon: string }> = {
  APPROVED:  { color: "#34d399", bg: "#34d39915", border: "#34d39940", icon: "✅" },
  PENDING:   { color: "#fbbf24", bg: "#fbbf2415", border: "#fbbf2440", icon: "⏳" },
  REJECTED:  { color: "#f87171", bg: "#f8717115", border: "#f8717140", icon: "❌" },
  CANCELLED: { color: "#94a3b8", bg: "#94a3b815", border: "#94a3b840", icon: "🚫" },
};

const MyRegistrations: React.FC = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { fetchRegistrations(); }, []);

  const fetchRegistrations = async () => {
    try {
      const response = await api.get("/registrations/my-registrations");
      setRegistrations(response.data.data);
    } catch {
      toast.error("Failed to fetch registrations");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (registrationId: string) => {
    if (!window.confirm("Are you sure you want to cancel this registration?")) return;
    try {
      await api.delete(`/registrations/${registrationId}/cancel`);
      toast.success("Registration cancelled successfully");
      fetchRegistrations();
    } catch {
      // handled by interceptor
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="space-y-4">
          {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title="My Registrations"
        subtitle={`${registrations.length} tournament registration${registrations.length !== 1 ? "s" : ""}`}
        accent="📋"
        action={
          <Link to="/tournaments" className="btn-secondary text-sm py-2 px-4">
            Browse More
          </Link>
        }
      />

      {registrations.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No registrations yet"
          description="You haven't registered for any tournaments yet. Browse available tournaments and join one!"
          action={{ label: "Browse Tournaments", onClick: () => navigate("/tournaments") }}
        />
      ) : (
        <div className="space-y-4">
          {registrations.map((reg, i) => {
            const cfg = statusConfig[reg.status] ?? statusConfig.CANCELLED;
            return (
              <motion.div
                key={reg.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="card-hover p-6"
              >
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  {/* Left */}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/tournaments/${reg.tournament.id}`}
                      className="text-lg font-bold text-white hover:text-[#4AEEFF] transition-colors"
                    >
                      {reg.tournament.name}
                    </Link>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-[#D8FBFF]/40 uppercase tracking-wider mb-1">Category</p>
                        <p className="text-sm font-semibold text-white">
                          {reg.category?.name || "General"}
                          <span className="text-[#4AEEFF]/60 ml-1 text-xs">({reg.category?.type})</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#D8FBFF]/40 uppercase tracking-wider mb-1">Tournament Status</p>
                        <p className="text-sm font-semibold text-white">{reg.tournament.status}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 mt-3 text-xs text-[#D8FBFF]/50">
                      <div className="flex items-center gap-1.5">
                        <MapPinIcon className="w-3.5 h-3.5 text-[#4AEEFF]/60" />
                        {reg.tournament.venue}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5 text-[#4AEEFF]/60" />
                        Starts {new Date(reg.tournament.startDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#4AEEFF]/60">📅</span>
                        Registered {new Date(reg.registeredAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Right: Status + Action */}
                  <div className="flex flex-col items-end justify-between gap-3">
                    <span
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
                    >
                      {cfg.icon} {reg.status}
                    </span>

                    {reg.status === "PENDING" && (
                      <button
                        onClick={() => handleCancel(reg.id)}
                        className="text-xs font-medium text-red-400 hover:text-red-300
                                   px-3 py-1.5 rounded-lg border border-red-500/20
                                   hover:bg-red-500/10 transition-all"
                      >
                        Cancel Registration
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyRegistrations;
