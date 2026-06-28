import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

const PublicLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navigation = [
    { name: "Home",           href: "/" },
    { name: "Tournaments",    href: "/tournaments" },
    { name: "Players",        href: "/players" },
    { name: "Leaderboard",   href: "/leaderboard" },
    { name: "Global Rankings",href: "/global-leaderboard" },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #061D23 0%, #0a2535 100%)" }}>

      {/* ── Navbar ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#061D23]/95 backdrop-blur-md border-b border-[#12679E]/30 shadow-[0_4px_30px_rgba(0,0,0,0.3)]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 bg-gradient-to-br from-[#12679E] to-[#4AEEFF]/60 rounded-xl
                              flex items-center justify-center transform transition-all duration-300
                              group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(74,238,255,0.4)]">
                <span className="text-white text-lg font-bold">🏓</span>
              </div>
              <span className="font-black text-xl font-heading text-white tracking-tight">
                TT<span className="text-[#4AEEFF]">MS</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? "text-[#4AEEFF] bg-[#4AEEFF]/10"
                      : "text-[#D8FBFF]/70 hover:bg-[#12679E]/20 hover:text-[#4AEEFF]"
                  }`}
                >
                  {item.name}
                  {isActive(item.href) && (
                    <motion.div
                      layoutId="publicActiveNav"
                      className="absolute inset-0 rounded-lg border border-[#4AEEFF]/30 bg-[#4AEEFF]/5"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                </Link>
              ))}
            </div>

            {/* Auth buttons */}
            <div className="flex items-center gap-3">
              {user ? (
                <Link to="/app/dashboard" className="btn-primary text-sm py-2">
                  Dashboard →
                </Link>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-[#D8FBFF]/70 hover:text-[#4AEEFF] transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link to="/register" className="btn-primary text-sm py-2">
                    Get Started
                  </Link>
                </div>
              )}

              {/* Mobile button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-[#D8FBFF]/70 hover:bg-[#12679E]/20"
              >
                {mobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-[#12679E]/30 bg-[#061D23]/98 backdrop-blur-md"
            >
              <div className="px-4 py-3 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "bg-[#4AEEFF]/10 text-[#4AEEFF] border border-[#4AEEFF]/30"
                        : "text-[#D8FBFF]/70 hover:bg-[#12679E]/20 hover:text-white"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
                {!user && (
                  <div className="border-t border-[#12679E]/30 pt-3 mt-3 flex flex-col gap-2">
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2.5 text-sm font-medium text-[#D8FBFF]/70
                                 hover:bg-[#12679E]/20 rounded-xl transition-colors text-center">
                      Sign In
                    </Link>
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)}
                      className="btn-primary text-center text-sm py-2">
                      Get Started
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main content */}
      <main>
        <div className="pt-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#12679E]/30 bg-[#061D23] mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-[#12679E] to-[#4AEEFF]/40 rounded-lg
                                flex items-center justify-center">
                  <span className="text-white text-lg">🏓</span>
                </div>
                <span className="font-black text-xl text-white">TT<span className="text-[#4AEEFF]">MS</span></span>
              </div>
              <p className="text-[#D8FBFF]/50 text-sm leading-relaxed">
                Professional Table Tennis Tournament Management System.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Quick Links</h4>
              <ul className="space-y-2 text-sm text-[#D8FBFF]/50">
                <li><Link to="/tournaments"      className="hover:text-[#4AEEFF] transition-colors">Tournaments</Link></li>
                <li><Link to="/leaderboard"      className="hover:text-[#4AEEFF] transition-colors">Leaderboard</Link></li>
                <li><Link to="/global-leaderboard" className="hover:text-[#4AEEFF] transition-colors">Global Rankings</Link></li>
                <li><Link to="/players"          className="hover:text-[#4AEEFF] transition-colors">Players</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Account</h4>
              <ul className="space-y-2 text-sm text-[#D8FBFF]/50">
                <li><Link to="/login"    className="hover:text-[#4AEEFF] transition-colors">Sign In</Link></li>
                <li><Link to="/register" className="hover:text-[#4AEEFF] transition-colors">Register</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Follow Us</h4>
              <div className="flex gap-3">
                {[{ label: "Twitter", icon: "𝕏" }, { label: "Facebook", icon: "f" }, { label: "Instagram", icon: "ig" }].map((s) => (
                  <a key={s.label} href="#" title={s.label}
                    className="w-10 h-10 rounded-full border border-[#12679E]/50 flex items-center
                               justify-center text-xs font-bold text-[#D8FBFF]/50
                               hover:border-[#4AEEFF] hover:text-[#4AEEFF] hover:bg-[#4AEEFF]/10 transition-all">
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-[#12679E]/20 mt-8 pt-8 text-center text-sm text-[#D8FBFF]/30">
            © {new Date().getFullYear()} Table Tennis Tournament Management System. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
