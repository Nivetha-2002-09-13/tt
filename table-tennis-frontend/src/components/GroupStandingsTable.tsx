import React, { useRef } from "react";
import { motion } from "framer-motion";
import { useReactToPrint } from "react-to-print";

export interface GroupPlayer {
  id: string;
  name: string;
  matchPoints: number;
  rank: number;
}

export interface GroupMatchResult {
  player1Id: string;
  player2Id: string;
  player1Score: number;
  player2Score: number;
}

export interface GroupStandingsTableProps {
  groupName: string;
  players: GroupPlayer[];
  matches: GroupMatchResult[];
}

export const GroupStandingsTable: React.FC<GroupStandingsTableProps> = ({ groupName, players, matches }) => {
  if (!players || players.length === 0) return null;

  // Helper to get score between two players
  const getMatchScore = (p1Id: string, p2Id: string) => {
    if (p1Id === p2Id) return "X";
    
    // Find match where p1 is player1 and p2 is player2
    let match = matches.find(m => m.player1Id === p1Id && m.player2Id === p2Id);
    if (match) {
      return `${match.player1Score}/${match.player2Score}`;
    }
    
    // Find match where p1 is player2 and p2 is player1
    match = matches.find(m => m.player1Id === p2Id && m.player2Id === p1Id);
    if (match) {
      return `${match.player2Score}/${match.player1Score}`;
    }

    return "-/-";
  };

  const componentRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `${groupName} Standings`,
  });

  return (
    <div className="w-full max-w-4xl mx-auto mb-12">
      <div className="flex justify-end mb-4">
        <button 
          onClick={() => handlePrint()}
          className="bg-[#12679E] text-white px-4 py-2 rounded font-bold text-sm tracking-wider hover:bg-[#4AEEFF] hover:text-[#061D23] transition-colors shadow-lg"
        >
          🖨️ PRINT STANDINGS
        </button>
      </div>

      <motion.div 
        ref={componentRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg overflow-hidden shadow-xl"
      >
        {/* Header */}
        <div className="bg-[#333333] py-3 border-b-4 border-[#12679E]">
          <h3 className="font-bison text-2xl text-white text-center uppercase tracking-widest">
            {groupName}
          </h3>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto p-4 md:p-8 bg-[#333333]">
          <table className="w-full border-collapse border border-[#333333] bg-[#ffe48c] text-[#333333]">
            <thead>
              <tr>
                {/* Top-left empty cell */}
                <th className="border border-[#333333] p-2 bg-[#ffe48c] w-48"></th>
                
                {/* Vertical Player Names */}
                {players.map((player) => (
                  <th key={`header-${player.id}`} className="border border-[#333333] bg-[#ffe48c] w-16 align-bottom">
                    <div className="writing-vertical-rl transform rotate-180 text-center font-bold font-ebrima text-sm py-4 mx-auto whitespace-nowrap"
                         style={{ writingMode: 'vertical-rl' }}>
                      {player.name}
                    </div>
                  </th>
                ))}
                
                {/* MP and R headers */}
                <th className="border border-[#333333] p-2 bg-[#ffe48c] font-bison text-xl w-16 text-center align-bottom pb-4">MP</th>
                <th className="border border-[#333333] p-2 bg-[#ffe48c] font-bison text-xl w-16 text-center align-bottom pb-4">R</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={`row-${player.id}`}>
                  {/* Left Player Name */}
                  <th className="border border-[#333333] p-3 text-left font-bold font-ebrima text-sm bg-[#ffe48c]">
                    {player.name}
                  </th>
                  
                  {/* Score Matrix */}
                  {players.map((opponent) => {
                    const score = getMatchScore(player.id, opponent.id);
                    const isSelf = player.id === opponent.id;
                    
                    return (
                      <td key={`cell-${player.id}-${opponent.id}`} 
                          className={`border border-[#333333] text-center font-bison text-lg
                                     ${isSelf ? 'bg-[#404040] text-white text-2xl' : 'bg-[#e2e8f0]'}`}>
                        {isSelf ? "✕" : score}
                      </td>
                    );
                  })}
                  
                  {/* MP & R */}
                  <td className="border border-[#333333] p-3 text-center font-bison text-xl bg-[#e2e8f0]">
                    {player.matchPoints}
                  </td>
                  <td className="border border-[#333333] p-3 text-center font-bison text-xl bg-[#e2e8f0]">
                    {player.rank}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};
