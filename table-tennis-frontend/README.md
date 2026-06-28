# Table Tennis Management System - Frontend

A modern web application for managing table tennis tournaments, players, matches, and statistics. Built with React, TypeScript, and Vite.

## Features

- **Tournament Management**: Create, view, and manage table tennis tournaments
- **Player Management**: Player profiles, statistics, and global leaderboards
- **Match Tracking**: Real-time match scores, scorecards, and scheduling
- **Live Updates**: WebSocket integration for live match updates and notifications
- **Multi-role Dashboards**: Admin, Player, and Referee dashboards
- **Public Views**: Spectator mode and public tournament brackets
- **Progressive Web App**: Installable PWA support for mobile access

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI, Heroicons
- **Routing**: React Router DOM
- **Forms**: React Hook Form with Zod validation
- **Charts**: Chart.js with react-chartjs-2
- **Real-time**: Socket.IO client
- **Animation**: Framer Motion, Canvas Confetti

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── context/             # React context providers (Auth, Theme)
├── pages/              # Page components and dashboards
├── services/           # API service layer
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
└── main.tsx            # Application entry point
```

## Key Pages

- **Home** - Landing page with featured tournaments
- **Tournaments** - Browse and register for tournaments
- **Dashboard** - Role-based dashboard (Admin/Player/Referee)
- **Players** - Player directory and stats
- **Leaderboard** - Global and tournament rankings
- **My Matches** - Player match schedule
- **Create Tournament** - Tournament creation form

## Backend Integration

Configure the API endpoint in `src/services/api.ts` to point to your backend server.