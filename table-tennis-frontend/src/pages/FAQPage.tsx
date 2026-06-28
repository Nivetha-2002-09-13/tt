import React from "react";
import { motion } from "framer-motion";

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  {
    category: "Registration",
    question: "How do I register for a tournament?",
    answer: "Go to the Tournaments page, click on a tournament you want to join, and click 'Register'. If the tournament requires age verification, make sure your date of birth is set in your profile. Your registration will be reviewed by the admin.",
  },
  {
    category: "Registration",
    question: "Can I register as a guest?",
    answer: "Yes! Some tournaments allow guest registration. Click 'Register as Guest' on the tournament page. You'll need to provide your name and contact details. Guest registrations are also subject to admin approval.",
  },
  {
    category: "Scoring",
    question: "How does the scoring system work?",
    answer: "Table Tennis matches use a Best-of-5 games format. Each game is played to 11 points (with a 2-point lead required to win). A player must win 3 games to win the match. Scores are recorded by the assigned referee/umpire.",
  },
  {
    category: "Scoring",
    question: "What is the group stage?",
    answer: "In the group stage, players in the same group play against each other. Points are awarded: 2 for a win, 1 for a loss in a match played, 0 for a forfeit. Top players from each group advance to the knockout stage.",
  },
  {
    category: "Tournament",
    question: "What is the knockout stage?",
    answer: "After the group stage, top-ranked players compete in a single-elimination bracket. Lose one match and you're eliminated. The bracket includes Quarter-finals, Semi-finals, a 3rd Place playoff, and the Final.",
  },
  {
    category: "Tournament",
    question: "How can I view the bracket?",
    answer: "Go to the Tournament Details page and scroll to the Knockout Bracket section. The bracket is also publicly shareable — anyone can view it at /tournaments/[id]/bracket without needing to log in.",
  },
  {
    category: "Tournament",
    question: "What categories are available?",
    answer: "Categories are based on age groups: Under 9, Under 11, Under 13, Under 15, Under 17, Under 19, Open, Seniors 40+, Masters 50+, Veterans 60+. Doubles categories may also be available depending on the tournament.",
  },
  {
    category: "Account",
    question: "How do I update my profile?",
    answer: "Go to Profile (click your avatar in the top-right corner). You can update your name, date of birth, club affiliation, skill level, and profile picture. Make sure your date of birth is accurate for age-category tournaments.",
  },
  {
    category: "Account",
    question: "How do I request admin access?",
    answer: "If you are an organizer or referee, click 'Request Admin Access' from the dashboard or your profile. An admin will review and approve your request. Once approved, you'll have access to manage tournaments and record scores.",
  },
  {
    category: "Technical",
    question: "How do I share a tournament bracket with spectators?",
    answer: "Each tournament has a public shareable bracket link: /tournaments/[tournament-id]/bracket. Spectators can view live scores on this page without needing to create an account. You can also share the Spectator Live View page.",
  },
  {
    category: "Technical",
    question: "How often do live scores update?",
    answer: "Scores on the public Spectator View and Bracket pages auto-refresh every 15 seconds. When a referee records a score, it is immediately visible to all viewers.",
  },
];

const categories = Array.from(new Set(faqs.map((f) => f.category)));

const FAQPage: React.FC = () => {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);
  const [activeCategory, setActiveCategory] = React.useState<string>("All");

  const filtered = activeCategory === "All" ? faqs : faqs.filter((f) => f.category === activeCategory);

  return (
    <div className="page-container max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="text-5xl mb-3">❓</div>
        <h1 className="text-3xl font-black text-white">Help & FAQ</h1>
        <p className="text-[#D8FBFF]/50 mt-2">Everything you need to know about using the Table Tennis Management System</p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {["All", ...categories].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all
              ${activeCategory === cat
                ? "bg-[#4AEEFF] text-black shadow-[0_0_15px_rgba(74,238,255,0.3)]"
                : "bg-[#061D23] border border-[#12679E]/30 text-[#D8FBFF]/60 hover:border-[#4AEEFF]/40"
              }
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* FAQ Accordion */}
      <div className="space-y-3">
        {filtered.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <motion.div
              key={i}
              layout
              className={`rounded-2xl border overflow-hidden cursor-pointer transition-all
                ${isOpen ? "border-[#4AEEFF]/40 bg-[#4AEEFF]/5" : "border-[#12679E]/30 bg-[#061D23] hover:border-[#12679E]/60"}
              `}
              onClick={() => setOpenIndex(isOpen ? null : i)}
            >
              <div className="flex items-center justify-between p-5">
                <div className="flex items-start gap-3 flex-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 shrink-0
                    ${faq.category === "Registration" ? "bg-blue-500/20 text-blue-400" :
                      faq.category === "Scoring" ? "bg-green-500/20 text-green-400" :
                      faq.category === "Tournament" ? "bg-yellow-500/20 text-yellow-400" :
                      faq.category === "Account" ? "bg-purple-500/20 text-purple-400" :
                      "bg-[#4AEEFF]/10 text-[#4AEEFF]"}
                  `}>
                    {faq.category}
                  </span>
                  <h3 className={`font-semibold text-sm leading-relaxed ${isOpen ? "text-white" : "text-[#D8FBFF]/80"}`}>
                    {faq.question}
                  </h3>
                </div>
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-[#4AEEFF] ml-4 shrink-0 text-lg"
                >
                  ↓
                </motion.span>
              </div>
              <motion.div
                initial={false}
                animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <p className="px-5 pb-5 text-sm text-[#D8FBFF]/60 leading-relaxed">
                  {faq.answer}
                </p>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Contact Section */}
      <div className="mt-10 card text-center">
        <div className="text-3xl mb-3">📧</div>
        <h3 className="text-white font-bold text-lg mb-2">Still have questions?</h3>
        <p className="text-[#D8FBFF]/50 text-sm">
          Contact the tournament organizer or ask at the venue desk. You can also reach out via the admin panel.
        </p>
      </div>
    </div>
  );
};

export default FAQPage;
