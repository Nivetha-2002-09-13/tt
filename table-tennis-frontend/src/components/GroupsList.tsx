import React from "react";
import { motion } from "framer-motion";

export interface GroupItem {
  id: string;
  name: string;
  players: string[];
}

export interface GroupsListProps {
  categoryName: string;
  groups: GroupItem[];
}

export const GroupsList: React.FC<GroupsListProps> = ({ categoryName, groups }) => {
  if (!groups || groups.length === 0) return null;

  return (
    <div className="w-full max-w-6xl mx-auto mb-16">
      <h2 className="font-bison text-4xl text-center text-white uppercase tracking-widest mb-10">
        {categoryName}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {groups.map((group, index) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-lg overflow-hidden shadow-lg border-2 border-[#12679E]"
          >
            {/* Group Header */}
            <div className="bg-[#12679E] py-2">
              <h3 className="font-bison text-xl text-white text-center tracking-wider">
                {group.name}
              </h3>
            </div>
            
            {/* Players List */}
            <div className="p-4 bg-white min-h-[160px]">
              <ul className="space-y-3">
                {group.players.map((player, i) => (
                  <li key={i} className="font-ebrima font-bold text-sm text-gray-800 border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                    {i + 1}. {player}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
