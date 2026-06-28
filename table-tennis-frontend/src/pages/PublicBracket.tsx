import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import KnockoutBracket from "../components/KnockoutBracket";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

interface Category {
  id: string;
  name: string;
  type: string;
}

interface Tournament {
  id: string;
  name: string;
  status: string;
  categories: Category[];
}

const PublicBracket: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournamentDetails();
  }, [id]);

  const fetchTournamentDetails = async () => {
    try {
      // We can fetch tournament details (public route)
      const response = await api.get(`/tournaments/${id}`);
      const data = response.data.data;
      setTournament(data);

      if (data.categories && data.categories.length > 0) {
        setSelectedCategory(data.categories[0].id);
      }
    } catch (error) {
      console.error("Failed to load tournament", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#061D23]">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="text-center py-20 text-white">
        Tournament not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#061D23] via-[#0A2535] to-[#061D23] text-white">
      {/* Header */}
      <header className="px-8 py-6 border-b border-[#12679E]/30 bg-[#061D23]/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to={`/tournaments/${id}`}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#12679E]/20 text-[#4AEEFF] hover:bg-[#12679E]/40 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[#4AEEFF] font-bold mb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Live Spectator View
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">
              {tournament.name}
            </h1>
          </div>
        </div>
      </header>

      <main className="p-8 max-w-[1600px] mx-auto">
        {/* Category Tabs */}
        {tournament.categories.length > 0 && (
          <div className="flex overflow-x-auto gap-2 mb-8 pb-2 custom-scrollbar">
            {tournament.categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-6 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                  selectedCategory === cat.id
                    ? "bg-[#4AEEFF] text-[#061D23] shadow-[0_0_15px_rgba(74,238,255,0.4)]"
                    : "bg-[#12679E]/20 text-[#D8FBFF] hover:bg-[#12679E]/40"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Bracket Display */}
        <div className="bg-white rounded-3xl p-6 shadow-2xl overflow-hidden">
          {selectedCategory ? (
            <KnockoutBracket
              tournamentId={id!}
              categoryId={selectedCategory}
            />
          ) : (
            <div className="text-center py-20 text-gray-500">
              No categories available for this tournament.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PublicBracket;
