import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import PlayerRadarChart from "../components/PlayerRadarChart";
// ─── Types ────────────────────────────────────────────────────────────────────

interface PublicPlayerProfile {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  profileImage?: string;
  createdAt: string;
  playerProfile?: {
    skillLevel: string | null;
    clubAffiliation: string | null;
    dateOfBirth: string | null;
  };
}

interface PlayerStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: string;
  gamesStats: { won: number; lost: number; total: number };
  pointsStats: { scored: number; conceded: number; averagePerGame: string };
  recentMatches: Array<{
    id: string;
    tournamentName: string;
    categoryName: string;
    opponent: string;
    result: string;
    score: string;
    date: string;
  }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const calculateAge = (dob: string) => {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const getAgeCategory = (age: number) => {
  if (age < 9) return "Under 9";
  if (age < 11) return "Under 11";
  if (age < 13) return "Under 13";
  if (age < 15) return "Under 15";
  if (age < 17) return "Under 17";
  if (age < 19) return "Under 19";
  if (age < 40) return "Open";
  if (age < 50) return "Seniors 40+";
  if (age < 60) return "Masters 50+";
  return "Veterans 60+";
};

const getSkillColor = (level: string | null) => {
  switch (level?.toUpperCase()) {
    case "BEGINNER":
      return { bg: "#e0f2fe", text: "#0369a1", bar: "#38bdf8" };
    case "INTERMEDIATE":
      return { bg: "#fef3c7", text: "#92400e", bar: "#f59e0b" };
    case "ADVANCED":
      return { bg: "#dcfce7", text: "#14532d", bar: "#22c55e" };
    case "PROFESSIONAL":
      return { bg: "#ede9fe", text: "#4c1d95", bar: "#8b5cf6" };
    default:
      return { bg: "#f1f5f9", text: "#475569", bar: "#94a3b8" };
  }
};

const skillProgress = (level: string | null) => {
  switch (level?.toUpperCase()) {
    case "BEGINNER":
      return 25;
    case "INTERMEDIATE":
      return 50;
    case "ADVANCED":
      return 75;
    case "PROFESSIONAL":
      return 100;
    default:
      return 0;
  }
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({
  value,
  label,
  accent,
}: {
  value: string | number;
  label: string;
  accent: string;
}) => (
  <div
    style={{
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: 16,
      padding: "20px 16px",
      textAlign: "center",
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: accent,
        borderRadius: "16px 16px 0 0",
      }}
    />
    <div
      style={{
        fontSize: 32,
        fontWeight: 800,
        color: accent,
        lineHeight: 1,
        fontFamily: "'Bebas Neue', 'Impact', sans-serif",
        letterSpacing: 1,
      }}
    >
      {value}
    </div>
    <div
      style={{
        fontSize: 11,
        color: "#64748b",
        marginTop: 6,
        textTransform: "uppercase",
        letterSpacing: 1,
        fontWeight: 600,
      }}
    >
      {label}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const PublicProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<PublicPlayerProfile | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "matches">(
    "overview",
  );

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      // Use the new public endpoint — no auth required
      const res = await api.get(`/users/public/${userId}`);
      setProfile(res.data.data);

      // Fetch stats (match performance endpoint)
      try {
        const statsRes = await api.get(`/matches/player-performance/${userId}`);
        setStats(statsRes.data.data);
      } catch {
        // Stats are optional — continue without them
        setStats(null);
      }

      // Notify profile owner if a logged-in user is viewing
      if (user && user.id !== userId) {
        await api
          .post(`/users/${userId}/profile-view`, {
            viewerId: user.id,
            viewerName: `${user.firstName} ${user.lastName}`,
          })
          .catch(() => {}); // silent fail — not critical
      }
    } catch {
      toast.error("Player not found");
      navigate("/tournaments");
    } finally {
      setLoading(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            border: "3px solid #e2e8f0",
            borderTopColor: "#e11d48",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: "#94a3b8", fontSize: 14 }}>
          Loading player profile…
        </p>
      </div>
    );
  }

  if (!profile) return null;

  const age = profile.playerProfile?.dateOfBirth
    ? calculateAge(profile.playerProfile.dateOfBirth)
    : null;
  const ageCategory = age !== null ? getAgeCategory(age) : null;
  const skillColor = getSkillColor(profile.playerProfile?.skillLevel ?? null);
  const progress = skillProgress(profile.playerProfile?.skillLevel ?? null);
  const winRateNum = stats ? parseFloat(stats.winRate) : 0;

  const initials =
    `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();

  return (
    <div
      style={{
        maxWidth: 860,
        margin: "0 auto",
        padding: "24px 16px 64px",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* ── Breadcrumb ── */}
      <div style={{ marginBottom: 20, fontSize: 13, color: "#94a3b8" }}>
        <Link
          to="/tournaments"
          style={{ color: "#94a3b8", textDecoration: "none" }}
        >
          Tournaments
        </Link>
        <span style={{ margin: "0 6px" }}>›</span>
        <span style={{ color: "#1e293b" }}>
          {profile.firstName} {profile.lastName}
        </span>
      </div>

      {/* ── Hero Card ── */}
      <div
        style={{
          background: "#0f172a",
          borderRadius: 20,
          overflow: "hidden",
          marginBottom: 24,
          position: "relative",
        }}
      >
        {/* decorative ping pong ball pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.04,
            backgroundImage:
              "radial-gradient(circle, #fff 2px, transparent 2px)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* red accent bar on left */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 5,
            background: "linear-gradient(180deg, #e11d48, #f97316)",
          }}
        />

        <div
          style={{
            padding: "36px 36px 36px 48px",
            display: "flex",
            alignItems: "center",
            gap: 28,
            flexWrap: "wrap",
            position: "relative",
          }}
        >
          {/* Avatar */}
          {profile.profileImage ? (
            <img
              src={profile.profileImage}
              alt={profile.firstName}
              style={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                objectFit: "cover",
                border: "3px solid #e11d48",
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #e11d48, #f97316)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 36,
                fontWeight: 800,
                color: "#fff",
                flexShrink: 0,
                letterSpacing: -1,
              }}
            >
              {initials}
            </div>
          )}

          {/* Name & badges */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  background: "#e11d48",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: 20,
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                }}
              >
                Player
              </span>
              {ageCategory && (
                <span
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    color: "#94a3b8",
                    fontSize: 10,
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: 20,
                    textTransform: "uppercase",
                    letterSpacing: 1.2,
                  }}
                >
                  {ageCategory}
                </span>
              )}
            </div>

            <h1
              style={{
                fontSize: "clamp(24px, 5vw, 38px)",
                fontWeight: 900,
                color: "#fff",
                margin: 0,
                letterSpacing: -1,
                lineHeight: 1.05,
              }}
            >
              {profile.firstName}{" "}
              <span style={{ color: "#e11d48" }}>{profile.lastName}</span>
            </h1>

            <div
              style={{
                display: "flex",
                gap: 20,
                marginTop: 12,
                flexWrap: "wrap",
              }}
            >
              {profile.playerProfile?.clubAffiliation && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14 }}>🏓</span>
                  <span style={{ color: "#cbd5e1", fontSize: 13 }}>
                    {profile.playerProfile.clubAffiliation}
                  </span>
                </div>
              )}
              {age !== null && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14 }}>🎂</span>
                  <span style={{ color: "#cbd5e1", fontSize: 13 }}>
                    {age} years old
                  </span>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14 }}>📅</span>
                <span style={{ color: "#cbd5e1", fontSize: 13 }}>
                  Since {new Date(profile.createdAt).getFullYear()}
                </span>
              </div>
            </div>
          </div>

          {/* Win Rate Circle */}
          {stats && (
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <svg width="88" height="88" viewBox="0 0 88 88">
                <circle
                  cx="44"
                  cy="44"
                  r="36"
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="8"
                />
                <circle
                  cx="44"
                  cy="44"
                  r="36"
                  fill="none"
                  stroke="#e11d48"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(winRateNum / 100) * 226} 226`}
                  transform="rotate(-90 44 44)"
                />
                <text
                  x="44"
                  y="40"
                  textAnchor="middle"
                  fill="#fff"
                  fontSize="15"
                  fontWeight="800"
                >
                  {stats.winRate}
                </text>
                <text
                  x="44"
                  y="54"
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="9"
                >
                  WIN RATE
                </text>
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats Row ── */}
      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <StatCard
            value={stats.totalMatches}
            label="Matches"
            accent="#3b82f6"
          />
          <StatCard value={stats.wins} label="Wins" accent="#22c55e" />
          <StatCard value={stats.losses} label="Losses" accent="#ef4444" />
          <StatCard
            value={stats.gamesStats.total}
            label="Games Played"
            accent="#f59e0b"
          />
          <StatCard
            value={stats.pointsStats.scored}
            label="Points Scored"
            accent="#8b5cf6"
          />
        </div>
      )}

      {/* ── Tabs ── */}
      <div
        style={{
          display: "flex",
          borderBottom: "2px solid #e2e8f0",
          marginBottom: 24,
          gap: 4,
        }}
      >
        {(["overview", "matches"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "10px 24px",
              background: "none",
              border: "none",
              borderBottom:
                activeTab === tab
                  ? "2px solid #e11d48"
                  : "2px solid transparent",
              marginBottom: -2,
              color: activeTab === tab ? "#e11d48" : "#64748b",
              fontWeight: activeTab === tab ? 700 : 500,
              fontSize: 14,
              cursor: "pointer",
              textTransform: "capitalize",
              letterSpacing: 0.3,
              transition: "all 0.15s",
            }}
          >
            {tab === "overview"
              ? "Overview"
              : `Recent Matches ${stats ? `(${stats.recentMatches.length})` : ""}`}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === "overview" && (
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          {/* Skill Level */}
          {profile.playerProfile?.skillLevel && (
            <div
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: 24,
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                Skill Level
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    background: skillColor.bg,
                    color: skillColor.text,
                    padding: "6px 16px",
                    borderRadius: 20,
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  {profile.playerProfile.skillLevel}
                </span>
              </div>
              <div
                style={{
                  background: "#f1f5f9",
                  borderRadius: 8,
                  height: 8,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    background: skillColor.bar,
                    borderRadius: 8,
                    transition: "width 1s ease",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 6,
                  fontSize: 10,
                  color: "#94a3b8",
                }}
              >
                <span>Beginner</span>
                <span>Intermediate</span>
                <span>Advanced</span>
                <span>Pro</span>
              </div>
            </div>
          )}

          {/* Club */}
          {profile.playerProfile?.clubAffiliation && (
            <div
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: 24,
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                Club Affiliation
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    background: "#fef3c7",
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                  }}
                >
                  🏓
                </div>
                <div>
                  <p
                    style={{
                      fontWeight: 700,
                      color: "#1e293b",
                      fontSize: 16,
                      margin: 0,
                    }}
                  >
                    {profile.playerProfile.clubAffiliation}
                  </p>
                  <p style={{ color: "#94a3b8", fontSize: 12, margin: 0 }}>
                    Active Member
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Games breakdown */}
          {stats && (
            <div
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: 24,
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                  fontWeight: 700,
                  marginBottom: 16,
                }}
              >
                Games Breakdown
              </p>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div
                    style={{ fontSize: 28, fontWeight: 800, color: "#22c55e" }}
                  >
                    {stats.gamesStats.won}
                  </div>
                  <div
                    style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}
                  >
                    WON
                  </div>
                </div>
                <div style={{ width: 1, background: "#e2e8f0" }} />
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div
                    style={{ fontSize: 28, fontWeight: 800, color: "#ef4444" }}
                  >
                    {stats.gamesStats.lost}
                  </div>
                  <div
                    style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}
                  >
                    LOST
                  </div>
                </div>
                <div style={{ width: 1, background: "#e2e8f0" }} />
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div
                    style={{ fontSize: 28, fontWeight: 800, color: "#3b82f6" }}
                  >
                    {stats.gamesStats.total}
                  </div>
                  <div
                    style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}
                  >
                    TOTAL
                  </div>
                </div>
              </div>
              {/* stacked bar */}
              <div
                style={{
                  display: "flex",
                  borderRadius: 8,
                  overflow: "hidden",
                  height: 8,
                  marginTop: 16,
                  background: "#f1f5f9",
                }}
              >
                <div
                  style={{
                    width: `${stats.gamesStats.total ? (stats.gamesStats.won / stats.gamesStats.total) * 100 : 0}%`,
                    background: "#22c55e",
                    transition: "width 1s",
                  }}
                />
                <div
                  style={{
                    width: `${stats.gamesStats.total ? (stats.gamesStats.lost / stats.gamesStats.total) * 100 : 0}%`,
                    background: "#ef4444",
                    transition: "width 1s",
                  }}
                />
              </div>
            </div>
          )}

          {/* Points */}
          {stats && (
            <div
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: 24,
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                  fontWeight: 700,
                  marginBottom: 16,
                }}
              >
                Points Stats
              </p>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "#64748b", fontSize: 13 }}>
                    Points Scored
                  </span>
                  <span
                    style={{ fontWeight: 700, color: "#22c55e", fontSize: 16 }}
                  >
                    {stats.pointsStats.scored}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "#64748b", fontSize: 13 }}>
                    Points Conceded
                  </span>
                  <span
                    style={{ fontWeight: 700, color: "#ef4444", fontSize: 16 }}
                  >
                    {stats.pointsStats.conceded}
                  </span>
                </div>
                <div
                  style={{
                    borderTop: "1px solid #e2e8f0",
                    paddingTop: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "#64748b", fontSize: 13 }}>
                    Avg / Game
                  </span>
                  <span
                    style={{ fontWeight: 800, color: "#8b5cf6", fontSize: 18 }}
                  >
                    {stats.pointsStats.averagePerGame}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Skill Radar Chart */}
          <div
            style={{
              gridColumn: "1 / -1",
              background: "#061D23",
              border: "1px solid #12679E",
              borderRadius: 16,
              padding: 24,
              overflow: "hidden",
            }}
          >
            <p
              style={{
                fontSize: 14,
                color: "#4AEEFF",
                textTransform: "uppercase",
                letterSpacing: 1.5,
                fontWeight: 800,
                marginBottom: 16,
                textAlign: "center"
              }}
            >
              Player Skill Radar
            </p>
            <div style={{ width: "100%", height: 350 }}>
              <PlayerRadarChart playerName={profile.firstName} />
            </div>
          </div>

          {/* No stats fallback */}
          {!stats && (
            <div
              style={{
                gridColumn: "1 / -1",
                background: "#f8fafc",
                border: "1px dashed #cbd5e1",
                borderRadius: 16,
                padding: 40,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>🏓</div>
              <p style={{ color: "#94a3b8", fontSize: 14 }}>
                No match statistics yet.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Recent Matches Tab ── */}
      {activeTab === "matches" && (
        <div>
          {stats && stats.recentMatches.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {stats.recentMatches.map((match) => {
                const isWin = match.result === "Win";
                return (
                  <div
                    key={match.id}
                    style={{
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 14,
                      padding: "16px 20px",
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      borderLeft: `4px solid ${isWin ? "#22c55e" : "#ef4444"}`,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: isWin ? "#dcfce7" : "#fee2e2",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                        flexShrink: 0,
                      }}
                    >
                      {isWin ? "✓" : "✗"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontWeight: 700,
                          color: "#1e293b",
                          fontSize: 14,
                          margin: 0,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {match.tournamentName}
                      </p>
                      <p
                        style={{
                          color: "#64748b",
                          fontSize: 12,
                          margin: "2px 0 0",
                        }}
                      >
                        vs <strong>{match.opponent}</strong> ·{" "}
                        {match.categoryName}
                      </p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p
                        style={{
                          fontWeight: 800,
                          color: isWin ? "#16a34a" : "#dc2626",
                          fontSize: 15,
                          margin: 0,
                        }}
                      >
                        {match.score}
                      </p>
                      <p
                        style={{
                          color: "#94a3b8",
                          fontSize: 11,
                          margin: "2px 0 0",
                        }}
                      >
                        {new Date(match.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                background: "#f8fafc",
                border: "1px dashed #cbd5e1",
                borderRadius: 16,
                padding: 60,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>🏓</div>
              <p style={{ color: "#94a3b8", fontSize: 15 }}>
                No matches played yet.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PublicProfile;
