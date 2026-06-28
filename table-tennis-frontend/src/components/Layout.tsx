import React, { useState, useEffect, useRef } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import NotificationBell from "./NotificationBell";
import {
  HomeIcon,
  TrophyIcon,
  UserGroupIcon,
  ChartBarIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close avatar dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
    setAvatarOpen(false);
  };

  const navigation = [
    { name: "Dashboard",      href: "/app/dashboard",          icon: HomeIcon },
    { name: "Tournaments",    href: "/app/tournaments",         icon: TrophyIcon },
    { name: "Leaderboard",    href: "/app/leaderboard",        icon: ChartBarIcon },
    { name: "Global Rankings",href: "/app/global-leaderboard", icon: ChartBarIcon },
  ];

  if (user?.role === "ADMIN") {
    navigation.push({ name: "Admin Requests", href: "/app/admin-requests", icon: ShieldCheckIcon });
    navigation.push({ name: "Users",          href: "/app/users",          icon: UserGroupIcon });
  }

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "?";

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(href + "/");

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
            <Link to="/app/dashboard" className="flex items-center gap-2 group">
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
            {user && (
              <div className="hidden md:flex items-center gap-1">
                {navigation.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        active
                          ? "text-[#4AEEFF] bg-[#4AEEFF]/10"
                          : "text-[#D8FBFF]/70 hover:bg-[#12679E]/20 hover:text-[#4AEEFF]"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.name}
                      {active && (
                        <motion.div
                          layoutId="activeNavPill"
                          className="absolute inset-0 rounded-lg border border-[#4AEEFF]/40 bg-[#4AEEFF]/5"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Right section */}
            <div className="flex items-center gap-3">
              {user && (
                <>
                  {/* Theme Toggle */}
                  <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg border border-[#12679E]/30 text-[#D8FBFF]/60 hover:text-white hover:border-[#4AEEFF]/40 transition-all"
                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                  >
                    {theme === 'dark' ? '☀️' : '🌙'}
                  </button>

                  <NotificationBell />

                  {/* Avatar dropdown */}
                  <div className="hidden md:block relative" ref={avatarRef}>
                    <button
                      onClick={() => setAvatarOpen(!avatarOpen)}
                      className="flex items-center gap-2 p-1 rounded-xl hover:bg-[#12679E]/20
                                 transition-all duration-200 border border-transparent
                                 hover:border-[#4AEEFF]/20"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#12679E] to-[#4AEEFF]/40
                                      flex items-center justify-center text-xs font-bold text-white
                                      border border-[#4AEEFF]/30">
                        {initials}
                      </div>
                      <div className="text-left hidden lg:block">
                        <p className="text-sm font-semibold text-white leading-none">{user.firstName}</p>
                        <p className="text-xs text-[#4AEEFF]/70 mt-0.5">{user.role}</p>
                      </div>
                      <svg className={`w-4 h-4 text-[#4AEEFF]/60 transition-transform duration-200 ${avatarOpen ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    <AnimatePresence>
                      {avatarOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-[#12679E]/40
                                     bg-[#0d2d38] shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden z-50"
                        >
                          <div className="px-4 py-3 border-b border-[#12679E]/30">
                            <p className="text-sm font-semibold text-white">{user.firstName} {user.lastName}</p>
                            <p className="text-xs text-[#4AEEFF]/60 truncate">{user.email}</p>
                          </div>
                          <div className="py-1">
                            <Link
                              to="/app/profile"
                              onClick={() => setAvatarOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#D8FBFF]/80
                                         hover:bg-[#12679E]/20 hover:text-white transition-colors"
                            >
                              <UserCircleIcon className="w-4 h-4" />
                              My Profile
                            </Link>
                            {user.role === "PLAYER" && (
                              <>
                                <Link
                                  to="/app/my-matches"
                                  onClick={() => setAvatarOpen(false)}
                                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#D8FBFF]/80
                                             hover:bg-[#12679E]/20 hover:text-white transition-colors"
                                >
                                  <TrophyIcon className="w-4 h-4" />
                                  My Matches
                                </Link>
                                <Link
                                  to="/app/my-registrations"
                                  onClick={() => setAvatarOpen(false)}
                                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#D8FBFF]/80
                                             hover:bg-[#12679E]/20 hover:text-white transition-colors"
                                >
                                  <Cog6ToothIcon className="w-4 h-4" />
                                  My Registrations
                                </Link>
                              </>
                            )}
                          <Link
                            to="/app/notifications"
                            onClick={() => setAvatarOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#D8FBFF]/80
                                       hover:bg-[#12679E]/20 hover:text-white transition-colors"
                          >
                            <span className="w-4 h-4 text-center">🔔</span>
                            Notifications
                          </Link>
                          <Link
                            to="/app/calendar"
                            onClick={() => setAvatarOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#D8FBFF]/80
                                       hover:bg-[#12679E]/20 hover:text-white transition-colors"
                          >
                            <span className="w-4 h-4 text-center">📅</span>
                            Match Calendar
                          </Link>
                          <Link
                            to="/app/stats"
                            onClick={() => setAvatarOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#D8FBFF]/80
                                       hover:bg-[#12679E]/20 hover:text-white transition-colors"
                          >
                            <span className="w-4 h-4 text-center">📊</span>
                            Player Stats
                          </Link>
                          <Link
                            to="/app/downloads"
                            onClick={() => setAvatarOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#D8FBFF]/80
                                       hover:bg-[#12679E]/20 hover:text-white transition-colors"
                          >
                            <span className="w-4 h-4 text-center">📥</span>
                            Downloads
                          </Link>
                          <Link
                            to="/app/faq"
                            onClick={() => setAvatarOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#D8FBFF]/80
                                       hover:bg-[#12679E]/20 hover:text-white transition-colors"
                          >
                            <span className="w-4 h-4 text-center">❓</span>
                            Help & FAQ
                          </Link>
                        </div>
                          <div className="border-t border-[#12679E]/30 py-1">
                            <button
                              onClick={handleLogout}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400
                                         hover:bg-red-500/10 hover:text-red-300 transition-colors w-full text-left"
                            >
                              <ArrowRightOnRectangleIcon className="w-4 h-4" />
                              Sign Out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}

              {/* Mobile menu button */}
              {user && (
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg text-[#D8FBFF]/70 hover:bg-[#12679E]/20"
                >
                  {mobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && user && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-[#12679E]/30 bg-[#061D23]/98 backdrop-blur-md"
            >
              <div className="px-4 py-3 space-y-1">
                {/* User info in mobile */}
                <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-xl bg-[#12679E]/20 border border-[#12679E]/30">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#12679E] to-[#4AEEFF]/40
                                  flex items-center justify-center text-sm font-bold text-white">
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-[#4AEEFF]/70">{user.role}</p>
                  </div>
                </div>

                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "bg-[#4AEEFF]/10 text-[#4AEEFF] border border-[#4AEEFF]/30"
                        : "text-[#D8FBFF]/70 hover:bg-[#12679E]/20 hover:text-white"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                ))}

                {/* Extra mobile links */}
                <Link to="/app/profile" onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                             text-[#D8FBFF]/70 hover:bg-[#12679E]/20 hover:text-white transition-colors">
                  <UserCircleIcon className="w-5 h-5" />
                  My Profile
                </Link>
                {user.role === "PLAYER" && (
                  <>
                    <Link to="/app/my-matches" onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                                 text-[#D8FBFF]/70 hover:bg-[#12679E]/20 hover:text-white transition-colors">
                      <TrophyIcon className="w-5 h-5" />
                      My Matches
                    </Link>
                    <Link to="/app/my-registrations" onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                                 text-[#D8FBFF]/70 hover:bg-[#12679E]/20 hover:text-white transition-colors">
                      <Cog6ToothIcon className="w-5 h-5" />
                      My Registrations
                    </Link>
                  </>
                )}

                <div className="border-t border-[#12679E]/30 pt-3 mt-3">
                  <button
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-400
                               hover:bg-red-500/10 rounded-xl w-full text-left transition-colors"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    Sign Out
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── Main content with page transitions ── */}
      <main className="pt-16">
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
      </main>

      {/* ── Footer ── */}
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
                Professional Table Tennis Tournament Management System for clubs and organizations.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Quick Links</h4>
              <ul className="space-y-2 text-sm text-[#D8FBFF]/50">
                <li><Link to="/app/tournaments" className="hover:text-[#4AEEFF] transition-colors">Tournaments</Link></li>
                <li><Link to="/app/leaderboard" className="hover:text-[#4AEEFF] transition-colors">Leaderboard</Link></li>
                <li><Link to="/app/dashboard"   className="hover:text-[#4AEEFF] transition-colors">Dashboard</Link></li>
                <li><Link to="/players"         className="hover:text-[#4AEEFF] transition-colors">Players</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Support</h4>
              <ul className="space-y-2 text-sm text-[#D8FBFF]/50">
                <li><a href="#" className="hover:text-[#4AEEFF] transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-[#4AEEFF] transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-[#4AEEFF] transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Follow Us</h4>
              <div className="flex gap-3">
                {[
                  { label: "Twitter", icon: "𝕏" },
                  { label: "Facebook", icon: "f" },
                  { label: "Instagram", icon: "ig" },
                ].map((s) => (
                  <a
                    key={s.label}
                    href="#"
                    title={s.label}
                    className="w-10 h-10 rounded-full border border-[#12679E]/50 flex items-center
                               justify-center text-xs font-bold text-[#D8FBFF]/50
                               hover:border-[#4AEEFF] hover:text-[#4AEEFF] hover:bg-[#4AEEFF]/10
                               transition-all duration-200"
                  >
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

export default Layout;
