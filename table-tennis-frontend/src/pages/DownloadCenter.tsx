import React, { useEffect, useState } from "react";
import api from "../services/api";
import { motion } from "framer-motion";

interface DownloadItem {
  label: string;
  description: string;
  icon: string;
  action: () => void;
  color: string;
}

interface Tournament {
  id: string;
  name: string;
  status: string;
  startDate: string;
}

const DownloadCenter: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/tournaments").then((r) => setTournaments(r.data.data || []));
  }, []);

  const downloadCSV = async () => {
    if (!selectedTournament) {
      alert("Please select a tournament first");
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/matches/tournaments/${selectedTournament}`);
      const matches = res.data.data || [];
      const t = tournaments.find((t) => t.id === selectedTournament);
      const rows = [
        ["Round", "Player 1", "Player 2", "Score", "Status", "Winner"],
        ...matches.map((m: any) => [
          m.round,
          m.player1 ? `${m.player1.firstName} ${m.player1.lastName}` : "TBD",
          m.player2 ? `${m.player2.firstName} ${m.player2.lastName}` : "TBD",
          m.score || "-",
          m.status,
          m.winner ? `${m.winner.firstName} ${m.winner.lastName}` : "-",
        ]),
      ];
      const csv = rows.map((r) => r.map((v: string) => `"${v}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${t?.name || "tournament"}-results.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export results");
    } finally {
      setLoading(false);
    }
  };

  const downloadScheduleText = async () => {
    if (!selectedTournament) {
      alert("Please select a tournament first");
      return;
    }
    setLoading(true);
    try {
      const [tRes, mRes] = await Promise.all([
        api.get(`/tournaments/${selectedTournament}`),
        api.get(`/matches/tournaments/${selectedTournament}`),
      ]);
      const t = tRes.data.data;
      const matches = mRes.data.data || [];
      let text = `TOURNAMENT SCHEDULE\n`;
      text += `${"=".repeat(50)}\n`;
      text += `Tournament: ${t.name}\n`;
      text += `Venue: ${t.venue || "TBD"}\n`;
      text += `Date: ${new Date(t.startDate).toLocaleDateString()}\n\n`;
      const byRound: Record<string, any[]> = {};
      for (const m of matches) {
        if (!byRound[m.round]) byRound[m.round] = [];
        byRound[m.round].push(m);
      }
      for (const [round, roundMatches] of Object.entries(byRound)) {
        text += `\n${round.toUpperCase()}\n${"─".repeat(30)}\n`;
        for (const m of roundMatches) {
          const p1 = m.player1 ? `${m.player1.firstName} ${m.player1.lastName}` : "TBD";
          const p2 = m.player2 ? `${m.player2.firstName} ${m.player2.lastName}` : "TBD";
          const time = m.scheduledTime ? new Date(m.scheduledTime).toLocaleString() : "TBD";
          const score = m.score || "Not played";
          text += `  ${p1} vs ${p2}\n    Time: ${time}  |  Score: ${score}  |  Status: ${m.status}\n`;
        }
      }
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${t.name}-schedule.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download schedule");
    } finally {
      setLoading(false);
    }
  };

  const printBracket = () => {
    if (!selectedTournament) {
      alert("Please select a tournament first");
      return;
    }
    window.open(`/tournaments/${selectedTournament}/bracket`, "_blank");
  };

  const downloads: DownloadItem[] = [
    {
      label: "Match Results (CSV)",
      description: "Export all match results as a CSV spreadsheet. Opens in Excel, Google Sheets, etc.",
      icon: "📊",
      action: downloadCSV,
      color: "from-green-500/20 to-green-600/10 border-green-500/30",
    },
    {
      label: "Tournament Schedule (Text)",
      description: "Download the full match schedule in a readable text format.",
      icon: "📅",
      action: downloadScheduleText,
      color: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
    },
    {
      label: "Bracket (Print / Save PDF)",
      description: "Open the public bracket page in a new tab. Use Ctrl+P / Cmd+P to print or save as PDF.",
      icon: "🏆",
      action: printBracket,
      color: "from-yellow-500/20 to-yellow-600/10 border-yellow-500/30",
    },
  ];

  return (
    <div className="page-container max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">📥 Download Center</h1>
        <p className="text-[#D8FBFF]/50 mt-1">Export tournament data, schedules, and results</p>
      </div>

      {/* Tournament Selector */}
      <div className="card mb-8">
        <label className="text-sm font-bold text-[#D8FBFF]/60 uppercase tracking-wider block mb-3">
          Select Tournament
        </label>
        <select
          value={selectedTournament}
          onChange={(e) => setSelectedTournament(e.target.value)}
          className="input-field w-full"
        >
          <option value="">Choose a tournament...</option>
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.status})
            </option>
          ))}
        </select>
      </div>

      {/* Download Options */}
      <div className="space-y-4">
        {downloads.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`flex items-center gap-5 p-5 rounded-2xl bg-gradient-to-r border cursor-pointer hover:scale-[1.01] transition-all ${item.color}`}
            onClick={loading ? undefined : item.action}
          >
            <div className="text-4xl">{item.icon}</div>
            <div className="flex-1">
              <h3 className="font-bold text-white">{item.label}</h3>
              <p className="text-sm text-[#D8FBFF]/50 mt-0.5">{item.description}</p>
            </div>
            <button
              disabled={loading}
              className="px-5 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm font-semibold transition-colors whitespace-nowrap"
            >
              {loading ? "..." : "Download"}
            </button>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 card bg-[#4AEEFF]/5 border-[#4AEEFF]/20">
        <p className="text-[#4AEEFF] font-semibold mb-1 text-sm">💡 Tip</p>
        <p className="text-[#D8FBFF]/50 text-sm">
          CSV files can be opened in Microsoft Excel or Google Sheets. To save the bracket as PDF, open it in a new tab and use your browser's print function (Ctrl+P).
        </p>
      </div>
    </div>
  );
};

export default DownloadCenter;
