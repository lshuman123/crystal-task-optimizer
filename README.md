# Crystal RCM Staffing System

A purpose-built task management and workforce visibility platform for the Crystal RCM billing team. Built by Stanford Building Tech as part of a broader RCM modernization engagement.

**Live app:** Deploy to Vercel (see instructions below)  
**Stack:** React 19 · TypeScript · Vite · Supabase · Tailwind CSS v4 · shadcn/ui  
**Last updated:** June 2026

---

## What This Platform Does

Crystal RCM processes insurance claims for 17+ optometry practices. Before this platform, task assignment and tracking happened through spreadsheets, Word documents, and memory. This system gives managers real-time visibility into who is working on what, and gives billers a clear daily queue to work from.

It is intentionally simple — this is one deliverable in a larger engagement. The goal is scheduling visibility, task accountability, and productivity tracking. Automation (RPA, eligibility verification, etc.) is a separate workstream.

---

## Features

### For Managers

**Dashboard**
- Live stat cards: Completed Today, Open, In Progress, Overdue
- Tasks by Employee table — open, in progress, overdue, and done-today counts per biller
- Daily Completion Summary — scrollable list of all tasks completed today with who did them and when
- Blocked Tasks panel — flagged tasks surfaced immediately with links to resolve
- Export CSV — downloads all tasks as a spreadsheet with one click

**Task Board**
- Full task list with sorting and filters: Status, Employee, Client, Task Type
- Create, edit, and delete tasks
- Color coding: overdue tasks highlighted red, blocked tasks highlighted orange
- Export current filtered view to CSV

**Task Detail**
- Full task metadata: client, assignee, due date, follow-up date, created date, completed date
- Accountability display: "Completed by [Name] at [time]" when a task is finished
- Inline status update (Pending → In Progress → Complete → Blocked)
- Notes field (editable)
- Activity Log: timestamped comment thread per task — billers log calls made, payer responses, blockers, submission notes
- Time Tracking: log minutes spent on a task with an optional note; shows total time accumulated

**Team Management** (`/team`)
- Lists all employees and managers with name, email, specialty, and join date
- Add new team members directly in the app — no Supabase dashboard access needed
- Sets role (manager or employee) and specialty (Payment Poster, AR Specialist, Claims Scrubber)

### For Employees

**My Queue** (`/queue`)
- Shows only tasks assigned to the logged-in employee
- Sorted by priority: Denial Appeals first, then by priority level, then by due date
- Filter by client
- Overdue tasks highlighted red, due-within-24h tasks highlighted orange with a "Due Soon" badge
- Mark Complete (with optional completion note) and Mark Blocked (requires reason) directly from queue
- Denial appeal tasks flagged with a ⚑ icon for immediate visibility

### Task Types Supported
- Payment Posting
- Claims Scrubbing
- ERA Pulling
- Eligibility Verification
- AR Follow-up
- Denial Appeal

### Real-Time Updates
All changes sync instantly across all open browser windows via Supabase Realtime. When an employee flags a task as blocked, the manager sees a notification badge in the header immediately — no refresh needed.

### Email Notifications (optional, requires setup)
A Supabase Edge Function (`supabase/functions/notify-manager/`) is included. When deployed, it sends an email to all managers when any employee flags a task as blocked. Requires a Resend API key. See "Email Notifications Setup" below.

---

## Database Schema

The schema lives in `supabase/schema.sql`. Key tables:

| Table | Purpose |
|---|---|
| `profiles` | One row per user. Linked to Supabase Auth. Stores name, email, role, specialty. Auto-created on signup via trigger. |
| `clients` | The optometry practices Crystal serves. |
| `tasks` | Core work items. Has task type, status, priority, due date, follow-up date, assigned employee, client, notes. |
| `task_comments` | Activity log entries per task. Each comment has an author and timestamp. |
| `time_entries` | Time logged per task. Stores duration in minutes and an optional note. |

Row Level Security (RLS) is enabled on all tables. Managers can see everything; employees can only see tasks assigned to them.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 19 + TypeScript |
| Build tool | Vite |
| Routing | React Router v7 |
| Data fetching | TanStack Query v5 |
| Backend / database | Supabase (Postgres + Auth + Realtime) |
| UI components | shadcn/ui (nova preset, Tailwind v4) |
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
    realtime/       RealtimeProvider (Supabase channel subscriptions)
    tasks/          CreateEditTaskModal, TaskBadges, TaskComments, TaskFilters, TimeTracker
    ui/             shadcn/ui primitives
  hooks/
    useAuth.ts          Current user session + profile
    useClients.ts       Client list queries
    useCreateUser.ts    In-app user creation (secondary Supabase client)
    useMetrics.ts       Dashboard aggregate metrics
    useNotificationCount.ts  Flagged task badge count
    useProfiles.ts      Employee/manager list queries
    useTaskComments.ts  Comment CRUD
    useTasks.ts         Task CRUD + flag/complete mutations
    useTimeTracking.ts  Time entry CRUD
  lib/
    exportCSV.ts    CSV download utility
    supabase.ts     Supabase client initialization
  pages/
    LoginPage.tsx
    ManagerDashboard.tsx
    ManagerTaskBoard.tsx
    EmployeeQueue.tsx
    TaskDetail.tsx
    TeamManagement.tsx
  types/
    database.ts     TypeScript types for all DB entities

supabase/
  schema.sql                        Full database schema (run first)
  migrations/
    002_comments_time_tracking.sql  Adds task_comments, time_entries, follow_up_date
  functions/
    notify-manager/index.ts         Edge function for email alerts
```

---

## Taking Over the Project (CTO Handoff)

### What You're Receiving
- Full source code in this GitHub repository
- A running Supabase project with the database schema applied
- A working development environment (tested June 2026)

### Credentials and Access

**GitHub:** Request transfer of this repository to your GitHub org via Settings → Transfer Repository, or add your team as collaborators under Settings → Collaborators.

**Supabase:** The project is at `https://supabase.com` under the current owner's account. To take ownership: Supabase Dashboard → Project Settings → General → Transfer Project. You will need a Supabase account. After transfer, upgrade to the **Pro plan ($25/month)** — the free tier pauses inactive projects after 7 days, which will break a production app.

**Environment variables:** You need two values from Supabase → Project Settings → API:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Deploying to Production (Vercel)

1. Push the repository to your GitHub org
2. Go to [vercel.com](https://vercel.com) and click "Add New Project"
3. Import the GitHub repository — Vercel auto-detects Vite
4. Under Environment Variables, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
5. Click Deploy

You will get a URL like `crystal-rcm.vercel.app`. You can add a custom domain (e.g. `app.crystalrcm.com`) under the Vercel project's Domains settings.

Every push to `main` will automatically trigger a new deployment.

### Running Locally

```bash
# 1. Clone the repo
git clone <repo-url>
cd crystal-task-optimizer

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.local.example .env.local
# Edit .env.local and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# 4. Start development server
npm run dev
# App runs at http://localhost:5173
```

### Database Setup (for a fresh Supabase project)

Run these files in the Supabase SQL Editor in order:

1. `supabase/schema.sql` — creates all tables, RLS policies, and triggers
2. `supabase/migrations/002_comments_time_tracking.sql` — adds comments, time tracking, and follow-up date

### Adding Team Members

**Option 1 — In-app (recommended):** Log in as a manager → Team → Add Member. Fill in name, email, temporary password, role, and specialty.

> For immediate login without email confirmation: Supabase Dashboard → Authentication → Settings → disable "Enable email confirmations".

**Option 2 — Supabase dashboard:** Authentication → Users → Add User. The database trigger auto-creates the profile row.

### Making Code Changes

The codebase follows a consistent pattern:
- **New data features:** Add a hook in `src/hooks/`, model the type in `src/types/database.ts`, add the SQL migration in `supabase/migrations/`
- **New pages:** Add the page component in `src/pages/`, add the route in `src/App.tsx`, add the nav item in `src/components/layout/AppShell.tsx`
- **UI components:** Use shadcn/ui primitives from `src/components/ui/` — see [ui.shadcn.com](https://ui.shadcn.com) for docs

### Email Notifications Setup (optional)

To enable email alerts when employees flag blocked tasks:

1. Create a [Resend](https://resend.com) account and get an API key
2. Install the Supabase CLI: `npm install -g supabase`
3. Deploy the edge function:
   ```bash
   supabase functions deploy notify-manager
   supabase secrets set RESEND_API_KEY=re_your_key_here
   supabase secrets set FROM_EMAIL=noreply@yourdomain.com
   supabase secrets set APP_URL=https://your-vercel-url.vercel.app
   ```

The function (`supabase/functions/notify-manager/index.ts`) is already written. It fetches all manager emails from the database and sends each one a formatted email when a task is flagged.

---

## What's Not Yet Built

The following are known gaps identified during the site visit and are candidates for future development:

- **Eligibility verification integration** — identified as the top automation priority. Requires payer portal scraping or 271 API integration.
- **RPA for payment posting** — automate ERA pulling from clearinghouses (Trizetto/Apex). Crystal's API is in development and will expose billing data via a cloud API.
- **Client-facing reporting dashboard** — practices currently have no visibility into their billing status.
- **Audit log** — track who changed what and when (important for compliance).
- **Bulk task assignment** — assign multiple tasks at once.
- **Crystal PM API integration** — Alan (CTO) is building an MCP server to expose Crystal PM data. Once available, this platform can pull task data directly from the PM system rather than requiring manual entry.

---

## Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run preview   # Preview production build locally
npm run lint      # Run ESLint
```

---

## Built By

Stanford Building Tech — [lukeshuman@shumanco.com](mailto:lukeshuman@shumanco.com)

This platform was delivered as part of a revenue cycle management modernization engagement with Crystal RCM (June 2026).
