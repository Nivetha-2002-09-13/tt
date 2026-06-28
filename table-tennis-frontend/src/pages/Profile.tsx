import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import {
  TrophyIcon,
  ChartBarIcon,
  CalendarIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";

ChartJS.register(ArcElement, Tooltip, Legend);

interface PlayerStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: string;
  gamesStats: { won: number; lost: number; total: number };
  pointsStats: { scored: number; conceded: number; averagePerGame: string };
}

interface UserProfile {
  id: string; email: string; firstName: string; lastName: string;
  phone: string | null; role: string; profileImage?: string;
  playerProfile?: { skillLevel: string; clubAffiliation: string; dateOfBirth: string | null; gender?: string };
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ firstName: "", lastName: "", phone: "", playerProfile: { skillLevel: "", clubAffiliation: "" } });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);

  useEffect(() => { fetchProfile(); }, []);
  useEffect(() => { if (user?.role === "PLAYER") fetchPlayerStats(); }, [user]);

  const fetchProfile = async () => {
    try {
      const response = await api.get("/users/profile");
      const data = response.data.data;
      setProfile(data);
      setFormData({
        firstName: data.firstName, lastName: data.lastName, phone: data.phone || "",
        playerProfile: { skillLevel: data.playerProfile?.skillLevel || "Intermediate", clubAffiliation: data.playerProfile?.clubAffiliation || "" }
      });
    } catch { toast.error("Failed to fetch profile"); }
    finally { setLoading(false); }
  };

  const fetchPlayerStats = async () => {
    try {
      const response = await api.get("/matches/my-performance");
      setPlayerStats(response.data.data);
    } catch {}
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updateData: any = { firstName: formData.firstName, lastName: formData.lastName, phone: formData.phone };
      if (user?.role === "PLAYER") updateData.playerProfile = formData.playerProfile;
      await api.patch("/users/profile", updateData);
      toast.success("Profile updated successfully!");
      setEditing(false);
      fetchProfile();
    } catch { toast.error("Failed to update profile"); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return toast.error("Image must be <5MB");
      const fd = new FormData(); fd.append("profileImage", file);
      try {
        await api.post("/users/upload-profile-image", fd, { headers: { "Content-Type": "multipart/form-data" } });
        toast.success("Picture updated!");
        fetchProfile();
      } catch { toast.error("Upload failed"); }
    }
  };

  if (loading) return <div className="page-container"><div className="h-64 skeleton rounded-3xl" /></div>;
  if (!profile) return <div className="page-container text-center py-12 text-[#D8FBFF]/50">Profile not found</div>;

  const chartData = {
    labels: ['Wins', 'Losses'],
    datasets: [{
      data: playerStats ? [playerStats.wins, playerStats.losses] : [0, 0],
      backgroundColor: ['rgba(74, 238, 255, 0.8)', 'rgba(248, 113, 113, 0.8)'],
      borderColor: ['rgba(74, 238, 255, 1)', 'rgba(248, 113, 113, 1)'],
      borderWidth: 1,
    }],
  };

  return (
    <div className="page-container">
      {/* ── Banner & Profile Info ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card mb-8 p-0 overflow-hidden relative">
        <div className="h-32 bg-gradient-to-r from-[#123B4A] to-[#12679E] relative">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #4AEEFF 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        </div>
        <div className="px-8 pb-8 pt-4 relative">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end -mt-16 gap-6">
            <div className="flex items-end gap-6 relative z-10">
              <div className="relative group">
                <div className="w-28 h-28 rounded-full border-4 border-[#061D23] bg-[#0d2d38] overflow-hidden flex items-center justify-center">
                  {profile.profileImage ? (
                    <img src={profile.profileImage} className="w-full h-full object-cover" alt="Profile" />
                  ) : (
                    <span className="text-3xl font-bold text-white">{profile.firstName[0]}{profile.lastName[0]}</span>
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 cursor-pointer rounded-full transition-opacity">
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  <PencilIcon className="w-6 h-6" />
                </label>
              </div>
              <div className="pb-2">
                <h1 className="text-3xl font-black text-white">{profile.firstName} {profile.lastName}</h1>
                <p className="text-[#D8FBFF]/60 font-medium">{profile.email} • {profile.role}</p>
              </div>
            </div>
            {!editing && (
              <button onClick={() => setEditing(true)} className="btn-secondary text-sm flex items-center gap-2">
                <PencilIcon className="w-4 h-4" /> Edit Profile
              </button>
            )}
          </div>

          {editing ? (
            <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} onSubmit={handleUpdate} className="mt-8 pt-8 border-t border-[#12679E]/30 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div><label className="block text-xs font-bold text-[#D8FBFF]/70 uppercase tracking-widest mb-2">First Name</label><input type="text" className="input-field" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} required /></div>
              <div><label className="block text-xs font-bold text-[#D8FBFF]/70 uppercase tracking-widest mb-2">Last Name</label><input type="text" className="input-field" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} required /></div>
              <div><label className="block text-xs font-bold text-[#D8FBFF]/70 uppercase tracking-widest mb-2">Phone</label><input type="tel" className="input-field" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} /></div>
              {profile.role === "PLAYER" && (
                <>
                  <div><label className="block text-xs font-bold text-[#D8FBFF]/70 uppercase tracking-widest mb-2">Club Affiliation</label><input type="text" className="input-field" value={formData.playerProfile.clubAffiliation} onChange={(e) => setFormData({...formData, playerProfile: {...formData.playerProfile, clubAffiliation: e.target.value}})} /></div>
                  <div><label className="block text-xs font-bold text-[#D8FBFF]/70 uppercase tracking-widest mb-2">Skill Level</label>
                    <select className="input-field" value={formData.playerProfile.skillLevel} onChange={(e) => setFormData({...formData, playerProfile: {...formData.playerProfile, skillLevel: e.target.value}})}>
                      <option value="Beginner" style={{ background: "#0d2d38" }}>Beginner</option>
                      <option value="Intermediate" style={{ background: "#0d2d38" }}>Intermediate</option>
                      <option value="Advanced" style={{ background: "#0d2d38" }}>Advanced</option>
                      <option value="Professional" style={{ background: "#0d2d38" }}>Professional</option>
                    </select>
                  </div>
                </>
              )}
              <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setEditing(false)} className="btn-secondary flex items-center gap-2"><XMarkIcon className="w-4 h-4"/> Cancel</button>
                <button type="submit" className="btn-primary flex items-center gap-2"><CheckIcon className="w-4 h-4"/> Save Changes</button>
              </div>
            </motion.form>
          ) : (
            <div className="mt-8 pt-8 border-t border-[#12679E]/30 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div><p className="text-xs text-[#D8FBFF]/50 uppercase tracking-widest mb-1">Phone</p><p className="text-sm font-semibold text-white">{profile.phone || "—"}</p></div>
              {profile.role === "PLAYER" && (
                <>
                  <div><p className="text-xs text-[#D8FBFF]/50 uppercase tracking-widest mb-1">Skill Level</p><p className="text-sm font-semibold text-[#4AEEFF]">{profile.playerProfile?.skillLevel || "—"}</p></div>
                  <div><p className="text-xs text-[#D8FBFF]/50 uppercase tracking-widest mb-1">Club</p><p className="text-sm font-semibold text-white">{profile.playerProfile?.clubAffiliation || "—"}</p></div>
                  <div><p className="text-xs text-[#D8FBFF]/50 uppercase tracking-widest mb-1">Gender</p><p className="text-sm font-semibold text-white">{profile.playerProfile?.gender || "—"}</p></div>
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Player Stats ── */}
      {profile.role === "PLAYER" && playerStats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <h3 className="text-xl font-bold text-white flex items-center gap-2"><TrophyIcon className="w-6 h-6 text-[#4AEEFF]"/> Performance Overview</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="card text-center p-4"><p className="text-[#D8FBFF]/50 text-xs uppercase mb-1">Matches</p><p className="text-2xl font-black text-white">{playerStats.totalMatches}</p></div>
              <div className="card text-center p-4"><p className="text-[#D8FBFF]/50 text-xs uppercase mb-1">Win Rate</p><p className="text-2xl font-black text-[#4AEEFF]">{playerStats.winRate}%</p></div>
              <div className="card text-center p-4 border-t-2 border-[#34d399]"><p className="text-[#D8FBFF]/50 text-xs uppercase mb-1">Wins</p><p className="text-2xl font-black text-[#34d399]">{playerStats.wins}</p></div>
              <div className="card text-center p-4 border-t-2 border-[#f87171]"><p className="text-[#D8FBFF]/50 text-xs uppercase mb-1">Losses</p><p className="text-2xl font-black text-[#f87171]">{playerStats.losses}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="card p-5"><h4 className="text-sm font-bold text-[#D8FBFF]/70 uppercase tracking-widest mb-3">Games</h4>
                <div className="flex justify-between items-center mb-2"><span className="text-white text-sm">Won</span><span className="text-[#4AEEFF] font-bold">{playerStats.gamesStats.won}</span></div>
                <div className="flex justify-between items-center"><span className="text-white text-sm">Lost</span><span className="text-[#f87171] font-bold">{playerStats.gamesStats.lost}</span></div>
              </div>
              <div className="card p-5"><h4 className="text-sm font-bold text-[#D8FBFF]/70 uppercase tracking-widest mb-3">Points</h4>
                <div className="flex justify-between items-center mb-2"><span className="text-white text-sm">Avg / Game</span><span className="text-[#4AEEFF] font-bold">{playerStats.pointsStats.averagePerGame}</span></div>
                <div className="flex justify-between items-center"><span className="text-white text-sm">Total Scored</span><span className="text-white font-bold">{playerStats.pointsStats.scored}</span></div>
              </div>
            </div>
          </div>
          <div className="card flex flex-col items-center justify-center py-8">
            <h3 className="text-sm font-bold text-[#D8FBFF]/70 uppercase tracking-widest mb-6">Win / Loss Ratio</h3>
            <div className="w-48 h-48">
              <Doughnut data={chartData} options={{ cutout: '75%', plugins: { legend: { position: 'bottom', labels: { color: '#D8FBFF' } } } }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
