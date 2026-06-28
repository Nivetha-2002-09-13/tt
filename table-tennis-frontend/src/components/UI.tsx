import React from "react";

/* ── SkeletonCard ── */
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`skeleton-card ${className}`}>
    <div className="skeleton h-5 w-3/4 mb-3 rounded-lg" />
    <div className="skeleton h-4 w-full mb-2 rounded-lg" />
    <div className="skeleton h-4 w-2/3 mb-4 rounded-lg" />
    <div className="flex gap-2 mt-2">
      <div className="skeleton h-3 w-1/4 rounded-full" />
      <div className="skeleton h-3 w-1/4 rounded-full" />
    </div>
  </div>
);

/* ── SkeletonTable ── */
export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 6,
}) => (
  <div className="card overflow-hidden">
    <div className="flex gap-4 mb-4">
      <div className="skeleton h-6 w-48 rounded-lg" />
    </div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <div className="skeleton h-4 w-20 rounded-lg" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="border-t border-[#12679E]/20">
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} className="px-4 py-3">
                  <div
                    className="skeleton h-4 rounded-lg"
                    style={{ width: `${60 + Math.random() * 40}%` }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

/* ── SkeletonPlayerCards ── */
export const SkeletonPlayerCards: React.FC<{ count?: number }> = ({ count = 8 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="skeleton-card flex flex-col items-center p-6 gap-3">
        <div className="skeleton w-20 h-20 rounded-full" />
        <div className="skeleton h-5 w-32 rounded-lg" />
        <div className="skeleton h-4 w-24 rounded-lg" />
        <div className="skeleton h-6 w-20 rounded-full" />
      </div>
    ))}
  </div>
);

/* ── SkeletonTournamentCards ── */
export const SkeletonTournamentCards: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="skeleton-card p-6">
        <div className="flex justify-between mb-4">
          <div className="skeleton h-6 w-1/2 rounded-lg" />
          <div className="skeleton h-6 w-20 rounded-full" />
        </div>
        <div className="skeleton h-4 w-full mb-2 rounded-lg" />
        <div className="skeleton h-4 w-3/4 mb-6 rounded-lg" />
        <div className="flex gap-4">
          <div className="skeleton h-4 w-1/3 rounded-lg" />
          <div className="skeleton h-4 w-1/3 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

/* ── EmptyState ── */
interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => (
  <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
    <div className="w-24 h-24 rounded-3xl bg-[#12679E]/20 border border-[#12679E]/40
                    flex items-center justify-center text-5xl mb-6 animate-float">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-[#D8FBFF]/60 max-w-sm mb-6">{description}</p>
    {action && (
      <button onClick={action.onClick} className="btn-primary">
        {action.label}
      </button>
    )}
  </div>
);

/* ── PageHeader ── */
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  accent?: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  accent = "🏓",
  action,
}) => (
  <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
    <div>
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#12679E] to-[#4AEEFF]/30
                        flex items-center justify-center text-xl">
          {accent}
        </div>
        <div className="h-0.5 w-8 rounded-full bg-gradient-to-r from-[#4AEEFF] to-[#12679E]" />
      </div>
      <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">{title}</h1>
      {subtitle && (
        <p className="text-[#D8FBFF]/60 mt-1 text-sm">{subtitle}</p>
      )}
    </div>
    {action && <div>{action}</div>}
  </div>
);

/* ── StatusBadge ── */
export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    UPCOMING:  "badge-upcoming",
    ONGOING:   "badge-ongoing",
    COMPLETED: "badge-completed",
    CANCELLED: "badge-cancelled",
    SCHEDULED: "badge-upcoming",
  };
  return (
    <span className={map[status] ?? "badge-completed"}>
      {status}
    </span>
  );
};

/* ── WinRateBar ── */
export const WinRateBar: React.FC<{ wins: number; total: number }> = ({ wins, total }) => {
  const pct = total > 0 ? Math.round((wins / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-[#12679E]/30 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#4AEEFF] to-[#12679E]
                     transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-[#4AEEFF] font-semibold w-10 text-right">{pct}%</span>
    </div>
  );
};

/* ── Medal ── */
export const Medal: React.FC<{ rank: number }> = ({ rank }) => {
  if (rank === 0) return <span className="text-2xl drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]">🥇</span>;
  if (rank === 1) return <span className="text-2xl drop-shadow-[0_0_8px_rgba(180,180,180,0.8)]">🥈</span>;
  if (rank === 2) return <span className="text-2xl drop-shadow-[0_0_8px_rgba(180,120,60,0.8)]">🥉</span>;
  return (
    <span className="text-sm font-bold text-[#D8FBFF]/60 w-8 text-center">
      {rank + 1}
    </span>
  );
};

/* ── Avatar ── */
export const Avatar: React.FC<{
  name: string;
  size?: "sm" | "md" | "lg";
  imageUrl?: string;
}> = ({ name, size = "md", imageUrl }) => {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const sizeClass = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-xl",
  }[size];

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`${sizeClass} rounded-full object-cover border-2 border-[#4AEEFF]/30`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br from-[#12679E] to-[#4AEEFF]/40
                  flex items-center justify-center font-bold text-white border border-[#4AEEFF]/30`}
    >
      {initials}
    </div>
  );
};
