# MyTime — Project Knowledge Base

> **Crystal TS — MyTime**: A full-stack timesheet & workforce management system.
> This document captures the complete project context for AI assistant onboarding.

---

## 1. Repositories & Local Paths

| Component | GitHub Repo | Local Path | Branch Strategy |
|-----------|-------------|------------|-----------------|
| **Frontend** | `rvhacks/mytime-fe` | `/Users/rvhacks/Documents/Crystal TS/My Time/Frontend` | `develop` → `main` |
| **Backend** | `rvhacks/mytime-be` | `/Users/rvhacks/Documents/Crystal TS/My Time/Backend` | `develop` → `main` |

Git workflow: develop on `develop`, push, then merge to `main`.

---

## 2. Tech Stack

### Frontend
- **Framework**: React 19 + TypeScript 6 + Vite 5
- **Styling**: TailwindCSS 3 with CSS custom properties for theming (dark/light mode)
- **State**: Zustand 5 (stores in `src/store/`)
- **Routing**: React Router DOM 6
- **UI Components**: Radix UI primitives + custom components
- **HTTP**: Axios (configured in `src/services/api.ts`)
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Charts**: Recharts
- **Toasts**: React Hot Toast
- **Forms**: React Hook Form + Zod validation

### Backend
- **Runtime**: Node.js + Express 5
- **Database**: PostgreSQL via Sequelize 6 ORM
- **Auth**: JWT (access + refresh tokens in httpOnly cookies)
- **File Storage**: AWS S3 (for avatars)
- **Validation**: Joi
- **Logging**: Winston + Morgan
- **Security**: Helmet, CORS, HPP, express-rate-limit
- **API Docs**: Swagger (swagger-jsdoc + swagger-ui-express)

---

## 3. Database Schema (Sequelize Models)

### Users (`users`)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | Auto-generated |
| employee_id | STRING | Unique, e.g. "CT26-0001" |
| first_name, last_name | STRING | |
| email | STRING | Unique |
| password | STRING | bcrypt hashed |
| mobile | STRING | |
| dob | DATEONLY | |
| role | ENUM('employee','admin') | |
| designation_id | UUID (FK) | → Designation |
| reporting_manager_id | UUID (FK) | Self-referencing → User |
| avatar_path | STRING | S3 key |
| status | ENUM('active','inactive') | Default: 'active' |
| joining_date | DATEONLY | |

### Designations (`designations`)
| Column | Type |
|--------|------|
| id | UUID (PK) |
| name | STRING |

### Projects (`projects`)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| project_code | STRING | Unique, e.g. "PROJ-001" |
| name | STRING | |
| description | TEXT | |
| color | STRING | Hex color for UI |
| partner_project_id | STRING | |
| start_date, end_date | DATEONLY | |
| status | ENUM('active','completed','on-hold') | |

### ProjectAssignments (`project_assignments`)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| user_id | UUID (FK) | → User |
| project_id | UUID (FK) | → Project |
| role | STRING | Dynamic role from Roles table |
| Unique constraint | | (user_id, project_id) |

### Roles (`roles`)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| label | STRING | Display name, e.g. "Developer" |

### Milestones (`milestones`)
- Role-based templates (NOT project-specific)
| Column | Type |
|--------|------|
| id | UUID (PK) |
| name | STRING |
| description | TEXT |
| role | STRING | Matches role label |

### Timesheets (`timesheets`)
- **Week container only** — status lives at entry level
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| user_id | UUID (FK) | → User |
| week_start_date | DATEONLY | Always a Monday |
| week_end_date | DATEONLY | Always the Sunday |
| Unique constraint | | (user_id, week_start_date) |

### TimesheetEntries (`timesheet_entries`)
- **Each entry has its own lifecycle** (submit/approve/reject independently)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| timesheet_id | UUID (FK) | → Timesheet |
| project_id | UUID (FK) | → Project |
| milestone_id | UUID (FK) | → Milestone |
| task_description | TEXT | |
| billable | BOOLEAN | Default: false |
| hours_mon...hours_sun | FLOAT | 7 columns, one per day |
| status | ENUM | draft/submitted/resubmitted/recalled/approved/rejected |
| submitted_at | DATE | |
| reviewed_by | UUID (FK) | → User (the reviewer) |
| reviewed_at | DATE | |
| review_comments | TEXT | |
| resubmission_count | INTEGER | Default: 0 |

### RejectionHistory (`rejection_histories`)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | |
| entry_id | UUID (FK) | → TimesheetEntry |
| employee_id | UUID (FK) | → User |
| rejected_by | UUID (FK) | → User |
| project_id | UUID (FK) | → Project |
| milestone_id | UUID (FK) | → Milestone |
| task_description | TEXT | Snapshot at rejection time |
| hours_mon...hours_sun | FLOAT | Snapshot |
| billable | BOOLEAN | |
| comments | TEXT | Rejection reason |
| week_start_date | DATEONLY | |
| rejected_at | DATE | |

### Notifications (`notifications`)
| Column | Type |
|--------|------|
| id | UUID (PK) |
| user_id | UUID (FK) |
| title | STRING |
| message | TEXT |
| type | ENUM('info','success','warning','error') |
| category | STRING |
| read | BOOLEAN |

### OTPs (`otps`)
| Column | Type |
|--------|------|
| id | UUID (PK) |
| user_id | UUID (FK) |
| otp | STRING |
| expires_at | DATE |

---

## 4. Key Associations

```
User 1:N ProjectAssignment N:1 Project
User 1:N Timesheet 1:N TimesheetEntry N:1 Project
User (self-ref) → reportingManager / directReports
TimesheetEntry 1:N RejectionHistory
TimesheetEntry N:1 Milestone
TimesheetEntry N:1 User (reviewer)
Milestone → role-based (no direct project FK)
```

---

## 5. User Roles & Permissions

| Role | Capabilities |
|------|-------------|
| **employee** | Fill timesheets, submit/recall entries, view own reports, change password |
| **admin** | Full CRUD: employees, projects, assignments, designations, milestones, roles. View all reports. Password reset. Approval tracker. No approval action. |
| **manager** (dynamic) | Any employee with `directReports.length > 0` is a manager. Can approve/reject direct reports' timesheet entries. Sees approval sidebar count. |

> **Important**: "manager" is NOT a role in the `users` table. It's dynamically computed. An employee becomes a manager when another employee's `reporting_manager_id` points to them.

---

## 6. API Routes

### Auth (`/api/auth`)
- `POST /login` — Login with email/password, returns JWT cookies
- `POST /logout` — Clear cookies
- `POST /forgot-password` — Send OTP
- `POST /verify-otp` — Verify OTP
- `POST /reset-password` — Reset with OTP token
- `GET /me` — Current user info

### User (`/api/users`)
- `GET /profile` — Own profile
- `PUT /profile` — Update profile
- `POST /change-password` — Change own password
- `POST /avatar` — Upload avatar (multer → S3)
- `GET /team` — Direct reports list
- `GET /my-projects` — Assigned projects
- `GET /project/:id` — Project detail

### Timesheets (`/api/timesheets`)
- `GET /my` — All own timesheets
- `GET /week?startDate=` — Get specific week
- `GET /assigned-projects` — Projects assigned to current user
- `POST /save` — Save draft entries (upsert)
- `POST /submit` — Submit specific entry IDs
- `POST /recall` — Recall specific entry IDs
- `DELETE /entry/:entryId` — Delete draft entry
- `GET /milestones/role/:role` — Get milestones for a role
- `GET /approvals` — Manager: pending entries from direct reports
- `POST /approvals/action` — Manager: approve/reject entries
- `GET /employee/:employeeId/week` — View employee's week (RM/Admin)

### Admin (`/api/admin`)
- CRUD: `/designations`, `/employees`, `/projects`, `/assignments`, `/milestones`
- `/employees/:id/reset-password`, `/employees/:id/deactivate`, `/employees/:id/activate`
- `/approvals/managers` — Managers with pending counts
- `/approvals/manager/:managerId/entries` — Drill-down
- `/reports/timesheet-summary` — Employee summary report
- `/reports/past-timesheets` — Past submitted timesheets with filters
- Export endpoints: `/reports/timesheet-summary/export`, `/reports/past-timesheets/export`

### Roles (`/api/roles`)
- `GET /` — List all roles

---

## 7. Frontend Architecture

### Stores (Zustand)
| Store | Purpose |
|-------|---------|
| `authStore` | Login/logout, current user, JWT refresh |
| `timesheetStore` | Timesheet CRUD, week navigation, entry submit/recall |
| `adminStore` | Admin dashboard stats, approvals sidebar count |
| `managementStore` | CRUD for employees, projects, assignments, designations, milestones |
| `themeStore` | Dark/light mode toggle |
| `notificationStore` | Bell notifications, mark read |

### Page Structure
| Page | Path | Role |
|------|------|------|
| `LoginPage` | `/login` | Public |
| `Dashboard` | `/` | All |
| `Timesheet` | `/timesheet` | Employee |
| `Approvals` | `/approvals` | Manager |
| `MyProjects` | `/my-projects` | Employee |
| `Profile` | `/profile` | All |
| `ChangePassword` | `/change-password` | All |
| `Reports` | `/reports` | Admin (Employee Summary + Past Timesheets tabs) |
| `EmployeeReports` | `/my-reports` | Employee |
| `MyTeam` | `/my-team` | Manager |
| **Admin Management** | `/management/*` | Admin only |
| `Employees` | `/management/employees` | Admin |
| `Projects` | `/management/projects` | Admin |
| `Assignments` | `/management/assignments` | Admin |
| `Designations` | `/management/designations` | Admin |
| `Milestones` | `/management/milestones` | Admin |
| `AdminApprovals` | `/management/approval-tracker` | Admin (view-only tracker) |

### Key Shared Components
- `SearchableDropdown` — Paginated async dropdown with search
- `Pagination` — Server-side pagination component
- `StatusBadge` — Colored status badges
- `RejectionHistoryModal` — Full rejection history with hours snapshot
- `Sidebar` — Role-aware navigation with dynamic approval badge count

---

## 8. Timesheet Business Logic

### Entry Status Lifecycle
```
draft → submitted → approved (terminal)
                  → rejected → (edit) → resubmitted → approved
                                                     → rejected (cycle)
submitted → recalled → (edit) → submitted/resubmitted
```

### Week Structure
- Week always starts **Monday**, ends **Sunday**
- `hours_mon` through `hours_sun` — 7 float columns per entry
- Each entry row = 1 project + 1 milestone + 7 day hours
- Multiple entries per week (different projects/tasks)
- Daily total per day capped at 24h (frontend validation)

### Save/Submit Flow
1. **Save (draft)**: Frontend sends all editable rows → Backend upserts (update existing by ID, create new with temp ID mapping)
2. **Submit**: Frontend sends entry IDs → Backend sets status='submitted'
3. Backend does NOT delete-and-recreate entries. It updates existing entries and creates new ones.

### Approval Flow (Manager)
- Manager sees pending entries from direct reports only
- Can approve/reject individual entries (not whole timesheets)
- Rejection creates a `RejectionHistory` snapshot (preserving hours at time of rejection)
- Approved entries are locked (cannot be edited)

### Reports — Employee Summary (Date Range Aware)
- `hoursSql` uses `CASE WHEN` per day column to only count hours for days within the selected date range
- JOIN uses **overlap logic**: `week_start <= endDate AND week_end >= startDate`
- This ensures selecting June 1-2 only shows hours for those 2 days, not the full week

---

## 9. Theming & Design System

- CSS custom properties defined in `index.css` for all colors
- Two themes: light (default) and dark
- Color tokens: `--bg-primary`, `--text-primary`, `--card-bg`, `--input-bg`, `--border-primary`, etc.
- Brand colors: `brand-500` through `brand-700` (indigo-based)
- Accent: green (`accent-500`), Warning: amber (`warning-500`), Danger: red (`danger-500`)
- Table padding convention: `px-2 py-3` for compact cells, `px-3 py-3` for task fields, `p-2` for hour input cells

---

## 10. API Communication Pattern

- **Base URL**: Configured via `VITE_API_URL` env var
- **Auth**: JWT in httpOnly cookies (access_token + refresh_token)
- **Request interceptor**: Attaches token automatically
- **Response interceptor**: Auto-refresh on 401
- **Response format**: `{ status: 'success', data: { rows: [], pagination: {} } }`
- **Pagination helper**: Backend uses `buildPaginationQuery()` + `buildPaginationResponse()`

---

## 11. Backend Architecture Pattern

```
Route → Controller → Service → Repository → Sequelize Model
```

- **Controllers**: Parse request, call service, format response. Use `catchAsync` wrapper.
- **Services**: Business logic, complex queries (raw SQL for reports).
- **Repositories**: Sequelize CRUD operations, `findAll` with search/filter support.
- **Models**: Sequelize model definitions with associations in `models/index.js`.
- **Error handling**: `AppError` class + global `errorHandler` middleware.

### Sequelize Conventions
- All tables use `underscored: true` (snake_case columns)
- UUIDs for all primary keys
- `timestamps: true` (auto `created_at`, `updated_at`)
- Use `distinct: true` on `findAndCountAll` with includes to prevent count inflation
- Search uses `Op.iLike` for case-insensitive PostgreSQL search

---

## 12. Key Conventions & Patterns

### Frontend
- TypeScript strict mode
- All types in `src/types/index.ts`
- State managed via Zustand stores (not prop drilling)
- Server-side filtering/search (not client-side) for all admin tables
- `SearchableDropdown` for all entity selection dropdowns
- `formatHours()` converts decimal hours to "Xh Ym" display (e.g., 7.5 → "7h 30m")
- Task description uses `<textarea rows={2}>` for multi-line input
- `useMemo` for URL param initialization (not async useEffect) to avoid race conditions

### Backend
- Employee search supports: first_name, last_name, email, employee_id
- Assignment filtering: supports `userId`, `projectId`, and `search` params (server-side)
- Milestone filtering: supports `role` param (server-side)
- Clipboard copy uses fallback (`textarea` + `execCommand`) for non-HTTPS contexts

---

## 13. Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@crystalts.com | Password@123 |
| Employee/Manager | mike@crystalts.com | Password@123 |

---

## 14. Running Locally

```bash
# Frontend (Vite dev server)
cd "Frontend"
npm install
npm run dev          # → http://localhost:5173

# Backend (Express)
cd "Backend"
npm install
npm run dev          # → http://localhost:3000 (nodemon)

# Database
# PostgreSQL — config in Backend/src/config/database.js
npm run db:migrate   # Run migrations
npm run db:seed      # Seed initial data
```

---

## 15. File Reference Quick Index

### Frontend Key Files
| File | Purpose |
|------|---------|
| `src/App.tsx` | Root router, role-based route guards |
| `src/services/api.ts` | Axios instance, all API endpoint functions |
| `src/types/index.ts` | All TypeScript interfaces |
| `src/store/authStore.ts` | Auth state, login/logout |
| `src/store/timesheetStore.ts` | Timesheet CRUD state |
| `src/store/adminStore.ts` | Admin dashboard, approval counts |
| `src/store/managementStore.ts` | CRUD for admin entities |
| `src/pages/Timesheet.tsx` | Main timesheet page (~821 lines) |
| `src/pages/Reports.tsx` | Admin reports (summary + past timesheets) |
| `src/pages/Approvals.tsx` | Manager approval page |
| `src/components/shared/SearchableDropdown.tsx` | Reusable paginated search dropdown |
| `src/components/shared/RejectionHistoryModal.tsx` | Rejection history display |
| `src/components/layout/Sidebar.tsx` | Navigation with role-aware menu |

### Backend Key Files
| File | Purpose |
|------|---------|
| `src/server.js` | Entry point |
| `src/app.js` | Express app setup, middleware |
| `src/routes/` | All route definitions |
| `src/controllers/adminController.js` | Admin endpoints |
| `src/controllers/timesheetController.js` | Timesheet endpoints |
| `src/services/adminService.js` | Admin business logic (~817 lines) |
| `src/services/timesheetService.js` | Timesheet business logic |
| `src/infrastructure/models/index.js` | All models + associations |
| `src/repositories/` | Data access layer |
| `src/middlewares/auth.js` | JWT auth + role authorization |
