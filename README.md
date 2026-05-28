# My Time — Frontend

> Crystal TS · Timesheet & Workforce Management System

A modern React-based frontend for the My Time timesheet management system.

## Prerequisites

- **Node.js** v20 or higher
- **npm** v10 or higher
- **Backend API** running (see Backend README)

## Setup (Step by Step)

### 1. Clone the repository

```bash
git clone <your-frontend-repo-url>
cd Frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and set the backend API URL:

```env
# Point this to your running backend server
VITE_API_URL=http://localhost:5001/api
```

> **Note:** If both frontend and backend run on the same machine with default ports, you can skip this step — the app defaults to `http://localhost:5001/api`.

### 4. Start the development server

```bash
npm run dev
```

The app will be available at: **http://localhost:5173**

### 5. Build for production

```bash
npm run build
```

The production-ready files will be generated in the `dist/` directory. These are static files that can be served by any web server (Nginx, Apache, etc.).

### 6. Preview production build

```bash
npm run preview
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Language | TypeScript |
| Build Tool | Vite 5 |
| Routing | React Router v6 |
| State Management | Zustand |
| HTTP Client | Axios |
| UI Components | Radix UI |
| Styling | Tailwind CSS + Custom CSS |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Animations | Framer Motion |
| Icons | Lucide React |
| Notifications | React Hot Toast |

## Project Structure

```
src/
├── components/
│   ├── layout/       # Sidebar, Topbar
│   ├── shared/       # Reusable components (Pagination, SearchableDropdown)
│   └── ui/           # Base UI components (Button, Input, Card, etc.)
├── pages/
│   ├── auth/         # Login, Forgot Password, Reset Password
│   ├── management/   # Admin pages (Employees, Projects, etc.)
│   ├── Dashboard.tsx
│   ├── Timesheet.tsx
│   ├── Reports.tsx
│   ├── Profile.tsx
│   └── ...
├── services/
│   └── api.ts        # All API endpoint definitions
├── store/
│   ├── authStore.ts       # Authentication state
│   ├── timesheetStore.ts  # Timesheet state
│   ├── adminStore.ts      # Admin panel state
│   └── ...
├── types/
│   └── index.ts      # TypeScript type definitions
├── constants/        # Role definitions, enums
├── App.tsx           # Root component with routing
└── main.tsx          # Entry point
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production (TypeScript check + Vite build) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

## User Roles

The application supports three user roles:

| Role | Access |
|------|--------|
| **Admin** | Full access — manage employees, projects, assignments, designations, milestones, view all reports |
| **Manager** | Approve/reject team timesheets, view team reports, own timesheet |
| **Employee** | Submit/recall timesheets, view own reports, view assigned projects |

## Key Features

- **Timesheet Management** — Weekly timesheet entry with auto-save, submit, recall
- **Approval Workflow** — Manager approves/rejects individual timesheet entries
- **Reports** — Filterable reports with date range, employee, project filters + Excel export
- **Dashboard** — Role-based dashboard with key metrics and alerts
- **Project Management** — Admin manages projects, assignments, and team members
- **Profile** — Avatar upload with crop, personal info management

## Deployment Notes

- This is a **standalone** React SPA. It can be deployed independently on any static hosting.
- Set the `VITE_API_URL` environment variable to point to your backend server's API URL.
- The `dist/` folder after `npm run build` contains all static files needed for deployment.
- For Nginx deployment, ensure all routes redirect to `index.html` for SPA routing:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `VITE_API_URL` | No | Backend API URL | `http://localhost:5001/api` |
