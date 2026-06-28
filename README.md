# Crystal RCM Staffing System

A task management and workforce visibility platform built for the Crystal RCM billing team. Gives managers real-time visibility into task assignment and workload, and gives billers a clear daily queue to work from.

**Stack:** React 19 · TypeScript · Vite · Supabase · Tailwind CSS v4 · shadcn/ui  
**Last updated:** June 2026

---

## Overview

The Crystal RCM team processes insurance claims across 17+ optometry practices. This platform replaces spreadsheets and Word documents with a centralized system for assigning tasks, tracking completion, and monitoring team productivity in real time.

It is intentionally focused — scheduling visibility, task accountability, and productivity tracking. The goal is to make it easy for managers to see who is working on what, and for billers to know exactly what to do each day.

---

## Features

### Manager Features

**Dashboard (`/dashboard`)**
- Live stat cards: Completed Today, Open, In Progress, Overdue
- Tasks by Employee table — open, in progress, overdue, and done-today counts per biller
- Daily Completion Summary — all tasks completed today, who did them, and at what time
- Blocked Tasks panel — flagged tasks surfaced immediately with links to resolve
- Export CSV — downloads all tasks as a spreadsheet

**Task Board (`/tasks`)**
- Full task list with filters: Status, Employee, Client, Task Type
- Create, edit, and delete tasks
- Color coding: overdue tasks highlighted red, blocked tasks highlighted orange
- Export current filtered view to CSV

**Task Detail (`/tasks/:id`)**
- Full task metadata: client, assignee, due date, follow-up date, created date
- Accountability: shows "Completed by [Name] at [time]" when a task is finished
- Inline status update (Pending → In Progress → Complete → Blocked)
- Notes field (editable by manager)
- **Activity Log** — timestamped comment thread per task. Billers log calls made, payer responses, submission notes, and blockers. Each entry shows the author's name and timestamp.
- **Time Tracking** — log minutes spent on a task with an optional note. Shows running total accumulated across all entries.

**Team Management (`/team`)**
- Lists all employees and managers with name, email, specialty, and join date
- Add new team members directly in the app — no Supabase dashboard access needed
- Set role (manager or employee) and specialty (Payment Poster, AR Specialist, Claims Scrubber)

### Employee Features

**My Queue (`/queue`)**
- Shows only tasks assigned to the logged-in employee
- Sorted by priority: Denial Appeals always first, then by priority level (High → Medium → Low), then by due date
- Filter by client
- Overdue tasks highlighted red, due-within-24h tasks show a "Due Soon" badge
- Mark Complete (with optional note) and Mark Blocked (requires reason) directly from queue
- Denial appeal tasks flagged with a ⚑ icon

### Task Types
- Payment Posting
- Claims Scrubbing
- ERA Pulling
- Eligibility Verification
- AR Follow-up
- Denial Appeal

### Real-Time Updates
All changes sync instantly across all open browser windows via Supabase Realtime. When an employee flags a task as blocked, managers see a notification badge in the header immediately.

### Email Notifications (optional)
A Supabase Edge Function is included that emails all managers when a task is flagged as blocked. Requires deployment and a Resend API key — see setup instructions below.

---

## Database Schema

All tables live in Supabase Postgres. Run `supabase/schema.sql` to initialize.

| Table | Purpose |
|---|---|
| `profiles` | One row per user. Linked to Supabase Auth. Stores name, email, role, specialty. Auto-created on signup via trigger. |
| `clients` | The optometry practices Crystal serves. |
| `tasks` | Core work items. Task type, status, priority, due date, follow-up date, assigned employee, client, notes, completed timestamp. |
| `task_comments` | Activity log entries per task. Author, body, timestamp. |
| `time_entries` | Time logged per task. Duration in minutes, optional note, employee. |

Row Level Security (RLS) is enabled on all tables. Managers see everything; employees only see tasks assigned to them.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript |
| Build tool | Vite |
| Routing | React Router v7 |
| Data fetching | TanStack Query v5 |
| Backend / database | Supabase (Postgres + Auth + Realtime) |
| UI components | shadcn/ui (Tailwind v4) |
| Forms + validation | react-hook-form + zod |
| Date utilities | date-fns v4 |
| Icons | lucide-react |

---

## Project Structure

```
src/
  components/
    auth/           AuthProvider, ProtectedRoute
    layout/         AppShell (sidebar + header)
    realtime/       RealtimeProvider (Supabase Realtime subscriptions)
    tasks/          CreateEditTaskModal, TaskBadges, TaskComments, TaskFilters, TimeTracker
    ui/             shadcn/ui component primitives
  hooks/
    useAuth.ts              Current user session + profile
    useClients.ts           Client list queries
    useCreateUser.ts        In-app user creation
    useMetrics.ts           Dashboard aggregate metrics
    useNotificationCount.ts Flagged task badge count
    useProfiles.ts          Employee/manager list queries
    useTaskComments.ts      Comment CRUD
    useTasks.ts             Task CRUD + flag/complete mutations
    useTimeTracking.ts      Time entry CRUD
  lib/
    exportCSV.ts    CSV download utility
    supabase.ts     Supabase client
  pages/
    LoginPage.tsx
    ManagerDashboard.tsx
    ManagerTaskBoard.tsx
    EmployeeQueue.tsx
    TaskDetail.tsx
    TeamManagement.tsx
  types/
    database.ts     TypeScript interfaces for all DB entities

supabase/
  schema.sql                        Full DB schema — run this first
  migrations/
    002_comments_time_tracking.sql  Adds task_comments, time_entries, follow_up_date
  functions/
    notify-manager/index.ts         Edge function for email alerts on blocked tasks
```

---

## Setup & Deployment

### Prerequisites
- Node.js 18+
- A Supabase project (free tier works for development; use Pro for production)

### Local Development

```bash
# 1. Clone the repo
git clone https://github.com/lshuman123/crystal-task-optimizer.git
cd crystal-task-optimizer

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.local.example .env.local
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
# (found in Supabase → Project Settings → API)

# 4. Start dev server
npm run dev
# Runs at http://localhost:5173
```

### Database Setup

Run these in the Supabase SQL Editor in order:

1. **`supabase/schema.sql`** — creates all tables, RLS policies, and auth trigger
2. **`supabase/migrations/002_comments_time_tracking.sql`** — adds comments, time tracking, and follow-up date column

### Deploying to Production (Vercel)

1. Push the repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → import the repo
3. Add environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. Deploy

Every push to `main` triggers a redeploy automatically. Add a custom domain under the Vercel project's Domains settings.

> **Important:** Upgrade your Supabase project to the **Pro plan ($25/month)** before going live. The free tier pauses projects after 7 days of inactivity.

---

## Adding Team Members

**In-app (recommended):** Log in as a manager → Team → Add Member. Fill in name, email, temporary password, role, and specialty.

> For immediate access without email confirmation: Supabase Dashboard → Authentication → Settings → disable "Enable email confirmations".

**Via Supabase dashboard:** Authentication → Users → Add User. The database trigger auto-creates the profile row on signup.

---

## Email Notifications Setup (optional)

When enabled, managers receive an email whenever an employee flags a task as blocked.

1. Create a [Resend](https://resend.com) account and get an API key
2. Install the Supabase CLI: `npm install -g supabase`
3. Deploy the function and set secrets:
   ```bash
   supabase functions deploy notify-manager
   supabase secrets set RESEND_API_KEY=re_your_key_here
   supabase secrets set FROM_EMAIL=noreply@yourdomain.com
   supabase secrets set APP_URL=https://your-app-url.vercel.app
   ```

The function is already written at `supabase/functions/notify-manager/index.ts`. It queries all manager emails from the database and sends each one a formatted alert.

---

## Extending the Platform

The codebase is structured to make additions straightforward:

- **New data features:** Add a hook in `src/hooks/`, define the type in `src/types/database.ts`, add an SQL migration in `supabase/migrations/`
- **New pages:** Add the component in `src/pages/`, register the route in `src/App.tsx`, add the nav link in `src/components/layout/AppShell.tsx`
- **UI components:** All UI primitives are in `src/components/ui/` — see [ui.shadcn.com](https://ui.shadcn.com)

---

## Known Gaps / Future Roadmap

These were identified as high-value next steps but are outside the current scope:

- **Eligibility verification** — the highest-priority automation opportunity. Requires 271 API or payer portal integration.
- **Crystal PM API integration** — once the Crystal PM cloud API is available, tasks can be pulled directly from the PM system rather than entered manually.
- **RPA for payment posting / ERA pulling** — automate the daily clearinghouse workflow currently done manually.
- **Client-facing reporting** — give practices visibility into their own billing status.
- **Audit log** — track all status changes and edits with full history (important for compliance).
- **Bulk task assignment** — assign multiple tasks to an employee at once.

---

## Available Scripts

```bash
npm run dev       # Development server (localhost:5173)
npm run build     # Production build
npm run preview   # Preview production build locally
npm run lint      # ESLint
```
