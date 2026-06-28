import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Layout from "./components/Layout";
import PublicLayout from "./components/PublicLayout";
import Home from "./pages/Home";
import Tournaments from "./pages/Tournaments";
import TournamentDetails from "./pages/TournamentDetails";
import CreateTournament from "./pages/CreateTournament";
import MyRegistrations from "./pages/MyRegistrations";
import MyMatches from "./pages/MyMatches";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import Users from "./pages/Users";
import ResetPassword from "./pages/ResetPassword";
import AdminRequests from "./pages/AdminRequests";
import PublicProfile from "./pages/PublicProfile";
import GlobalLeaderboard from "./pages/GlobalLeaderboard";
import Players from "./pages/Players";
import PublicBracket from "./pages/PublicBracket";
import NotificationsPage from "./pages/NotificationsPage";
import MatchCalendar from "./pages/MatchCalendar";
import PlayerStatsPage from "./pages/PlayerStatsPage";
import SpectatorView from "./pages/SpectatorView";
import MatchScorecard from "./pages/MatchScorecard";
import DownloadCenter from "./pages/DownloadCenter";
import FAQPage from "./pages/FAQPage";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes - no login required */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="tournaments" element={<Tournaments />} />
        <Route path="tournaments/:id" element={<TournamentDetails />} />
        <Route path="tournaments/:id/bracket" element={<PublicBracket />} />
        <Route path="tournaments/:id/spectator" element={<SpectatorView />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="global-leaderboard" element={<GlobalLeaderboard />} />
        <Route path="profile/:userId" element={<PublicProfile />} />
        <Route path="players" element={<Players />} />
        <Route path="faq" element={<FAQPage />} />
        <Route path="matches/:matchId/scorecard" element={<MatchScorecard />} />
      </Route>

      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected routes - require login */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tournaments" element={<Tournaments />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="global-leaderboard" element={<GlobalLeaderboard />} />
        <Route path="create-tournament" element={<CreateTournament />} />
        <Route path="my-registrations" element={<MyRegistrations />} />
        <Route path="my-matches" element={<MyMatches />} />
        <Route path="profile" element={<Profile />} />
        <Route path="users" element={<Users />} />
        <Route path="admin-requests" element={<AdminRequests />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="calendar" element={<MatchCalendar />} />
        <Route path="stats" element={<PlayerStatsPage />} />
        <Route path="downloads" element={<DownloadCenter />} />
        <Route path="faq" element={<FAQPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#363636",
                color: "#fff",
                borderRadius: "12px",
              },
              success: {
                icon: "🏆",
                style: {
                  background: "#10b981",
                },
              },
              error: {
                icon: "❌",
                style: {
                  background: "#ef4444",
                },
              },
            }}
          />
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
