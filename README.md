# Table Tennis Tournament Management System

Full-stack project with a React (Vite) frontend and a Node/Express + Prisma backend.

## Repository structure

- **`table-tennis-frontend/`** – React + TypeScript (Vite)
- **`table-tennis-tournament-backend/`** – Node/Express + TypeScript + Prisma

## Prerequisites

- Node.js (LTS)
- PostgreSQL database
- (Optional) SMTP credentials if email features are enabled

## Backend (table-tennis-tournament-backend)

### 1) Install dependencies

```bash
cd table-tennis-tournament-backend
npm install
```

### 2) Configure environment

Create a `.env` file in `table-tennis-tournament-backend/` based on the provided example:

- `table-tennis-tournament-backend/.env.example`

### 3) Run Prisma migrations

```bash
npm run prisma:migrate
```

*(If needed)* seed the database:

```bash
npm run db:seed
```

### 4) Start backend (dev)

```bash
npm run dev
```

## Frontend (table-tennis-frontend)

### 1) Install dependencies

```bash
cd table-tennis-frontend
npm install
```

### 2) Configure environment

Create a `.env` file in `table-tennis-frontend/` based on the provided example (if present).

### 3) Start frontend (dev)

```bash
npm run dev
```

## Production build

### Frontend

```bash
cd table-tennis-frontend
npm run build
```

### Backend

```bash
cd table-tennis-tournament-backend
npm run build
npm start
```

## Notes

- This repo includes admin tokens/scripts under the backend folder; keep secrets out of git.
- Ensure your backend `.env` and Prisma database connection are set before running the app.

