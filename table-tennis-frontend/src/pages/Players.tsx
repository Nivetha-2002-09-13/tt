import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { SkeletonPlayerCards, EmptyState, PageHeader } from "../components/UI";
import PlayerCard from "../components/PlayerCard";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  ranking?: number;
  profileImage?: string;
  createdAt: string;
  playerProfile?: {
    skillLevel: string | null;
    clubAffiliation: string | null;
    dateOfBirth: string | null;
  };
}

const SKILLS = ["ALL", "BEGINNER", "INTERMEDIATE", "ADVANCED", "PROFESSIONAL"] as const;
type Skill = (typeof SKILLS)[number];

const skillConfig: Record<string, { color: string; bg: string; border: string }> = {
  BEGINNER:     { color: "#60a5fa", bg: "#60a5fa15", border: "#60a5fa40" },
  INTERMEDIATE: { color: "#fbbf24", bg: "#fbbf2415", border: "#fbbf2440" },
  ADVANCED:     { color: "#34d399", bg: "#34d39915", border: "#34d39940" },
  PROFESSIONAL: { color: "#a78bfa", bg: "#a78bfa15", border: "#a78bfa40" },
};

const calculateAge = (dob: string) => {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const Players: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState<Skill>("ALL");

  useEffect(() => { fetchPlayers(); }, []);

  const fetchPlayers = async () => {
    try {
      const res = await api.get("/users/public/players");
      setPlayers(res.data.data);
    } catch {
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let result = players;
    if (skillFilter !== "ALL") {
      result = result.filter((p) => p.playerProfile?.skillLevel?.toUpperCase() === skillFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.firstName.toLowerCase().includes(q) ||
          p.lastName.toLowerCase().includes(q) ||
          p.playerProfile?.clubAffiliation?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [search, skillFilter, players]);

  const countBySkill = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of players) {
      const sk = p.playerProfile?.skillLevel?.toUpperCase() ?? "NONE";
      counts[sk] = (counts[sk] ?? 0) + 1;
    }
    return counts;
  }, [players]);

  const initials = (p: Player) =>
    `${p.firstName[0]}${p.lastName[0]}`.toUpperCase();

  return (
    <div className="page-container">
      <PageHeader
        title="Players"
        subtitle={`${players.length} registered players`}
        accent="🏓"
      />

      {/* ── Search + Filter ── */}
      <div className="mb-8 space-y-4">
        <div className="relative max-w-xl">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4AEEFF]/40" />
          <input
            type="text"
            placeholder="Search by name or club..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-12 pr-4"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {SKILLS.map((s) => (
            <button
              key={s}
              onClick={() => setSkillFilter(s)}
              className={skillFilter === s ? "filter-pill-active" : "filter-pill"}
            >
              {s === "ALL"
                ? `All (${players.length})`
                : `${s.charAt(0) + s.slice(1).toLowerCase()} (${countBySkill[s] ?? 0})`}
            </button>
          ))}
          {filtered.length !== players.length && (
            <span className="text-xs text-[#D8FBFF]/40 ml-2">
              Showing {filtered.length} results
            </span>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <SkeletonPlayerCards count={8} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🏓"
          title="No players found"
          description="Try adjusting your search or filter."
          action={{ label: "Clear Filters", onClick: () => { setSearch(""); setSkillFilter("ALL"); } }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map((player, i) => {
            const skill = player.playerProfile?.skillLevel?.toUpperCase();
            const skillCfg = skill ? skillConfig[skill] : null;
            const age = player.playerProfile?.dateOfBirth
              ? calculateAge(player.playerProfile.dateOfBirth)
              : null;

            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
              >
                <PlayerCard
                  id={player.id}
                  firstName={player.firstName}
                  lastName={player.lastName}
                  avatarUrl={player.profileImage}
                  club={player.playerProfile?.clubAffiliation || "PRO TT CLUB"}
                />
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Players;
