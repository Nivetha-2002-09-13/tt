import React, { useEffect, useState } from "react";
import api from "../services/api";
import { motion } from "framer-motion";
import {
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
  TrophyIcon,
  EyeIcon,
  FunnelIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

type FilterType = "ALL" | "MATCH" | "REGISTRATION" | "RESULT" | "SYSTEM";

const getIcon = (type: string) => {
  if (type === "TOURNAMENT_CREATED") return <TrophyIcon className="w-5 h-5 text-yellow-400" />;
  if (type === "NEW_ADMIN_REQUEST") return <UserGroupIcon className="w-5 h-5 text-purple-400" />;
  if (type === "PROFILE_VIEW") return <EyeIcon className="w-5 h-5 text-blue-400" />;
  if (type.includes("APPROVED")) return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
  if (type.includes("REJECTED")) return <XCircleIcon className="w-5 h-5 text-red-400" />;
  return <BellIcon className="w-5 h-5 text-[#4AEEFF]" />;
};

const getCategory = (type: string): FilterType => {
  if (type.includes("MATCH") || type.includes("SCORE")) return "MATCH";
  if (type.includes("REGISTRATION") || type.includes("APPROVED") || type.includes("REJECTED")) return "REGISTRATION";
  if (type.includes("RESULT") || type.includes("WINNER")) return "RESULT";
  if (type === "TOURNAMENT_CREATED" || type === "NEW_ADMIN_REQUEST") return "SYSTEM";
  return "SYSTEM";
};

const FILTERS: { label: string; value: FilterType; emoji: string }[] = [
  { label: "All", value: "ALL", emoji: "🔔" },
  { label: "Matches", value: "MATCH", emoji: "🏓" },
  { label: "Registration", value: "REGISTRATION", emoji: "📝" },
  { label: "Results", value: "RESULT", emoji: "🏆" },
  { label: "System", value: "SYSTEM", emoji: "⚙️" },
];

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("ALL");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.data || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  const filtered = filter === "ALL" ? notifications : notifications.filter((n) => getCategory(n.type) === filter);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="page-container max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
            🔔 Notifications
            {unreadCount > 0 && (
              <span className="text-sm bg-[#e11d48] text-white px-2.5 py-1 rounded-full font-bold">
                {unreadCount} unread
              </span>
            )}
          </h1>
          <p className="text-[#D8FBFF]/50 mt-1">All your notifications in one place</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-[#4AEEFF]/10 border border-[#4AEEFF]/30 rounded-xl text-[#4AEEFF] text-sm font-semibold hover:bg-[#4AEEFF]/20 transition-colors"
          >
            <CheckIcon className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {FILTERS.map((f) => {
          const count = f.value === "ALL" ? notifications.length : notifications.filter((n) => getCategory(n.type) === f.value).length;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all
                ${filter === f.value
                  ? "bg-[#4AEEFF] text-black shadow-[0_0_15px_rgba(74,238,255,0.3)]"
                  : "bg-[#061D23] border border-[#12679E]/30 text-[#D8FBFF]/60 hover:border-[#4AEEFF]/40 hover:text-white"
                }
              `}
            >
              <span>{f.emoji}</span>
              <span>{f.label}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${filter === f.value ? "bg-black/20" : "bg-[#12679E]/30"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card h-20 animate-pulse bg-[#061D23]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <BellIcon className="w-16 h-16 text-[#D8FBFF]/20 mx-auto mb-4" />
          <p className="text-white font-semibold text-lg">No notifications</p>
          <p className="text-[#D8FBFF]/40 mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((notif, i) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => markAsRead(notif.id)}
              className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all group
                ${!notif.isRead
                  ? "bg-[#4AEEFF]/5 border-[#4AEEFF]/30 hover:bg-[#4AEEFF]/10"
                  : "bg-[#061D23] border-[#12679E]/20 hover:border-[#12679E]/50"
                }
              `}
            >
              {/* Icon */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${!notif.isRead ? "bg-[#4AEEFF]/10" : "bg-[#12679E]/10"}`}>
                {getIcon(notif.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${!notif.isRead ? "text-white" : "text-[#D8FBFF]/70"}`}>
                  {notif.title}
                </p>
                <p className="text-sm text-[#D8FBFF]/50 mt-0.5 leading-relaxed">{notif.message}</p>
                <p className="text-xs text-[#D8FBFF]/30 mt-2">
                  {format(new Date(notif.createdAt), "MMM d, yyyy · h:mm a")}
                </p>
              </div>

              {/* Unread dot */}
              {!notif.isRead && (
                <div className="w-2.5 h-2.5 bg-[#4AEEFF] rounded-full mt-1.5 shrink-0 animate-pulse" />
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
