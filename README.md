# Crystal Task Optimizer

A React + TypeScript + Vite application for managing tasks, queues, and employee workflows with Supabase as the backend.

## Overview

This project provides a task optimization dashboard built with:

- React 19 + TypeScript
- Vite
- Tailwind CSS
- Supabase for authentication and database
- React Router for page navigation
- TanStack Query for data fetching
- Zod and React Hook Form for validation

## Features

- Employee queue view
- Manager dashboard and task board
- Task detail pages and edit/create workflows
- Supabase-powered state and real-time interactions
- Responsive UI components using shadcn-inspired design patterns

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create environment variables:

```bash
cp .env.local.example .env.local
```

3. Update `.env.local` with your Supabase credentials:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

4. Run the development server:

```bash
npm run dev
```

5. Open the app in your browser at the URL shown by Vite.

## Database Setup

Supabase SQL files are available in the `supabase/` folder:

- `supabase/schema.sql`
- `supabase/migration_v2.sql`

Use those files to initialize or migrate the database schema in your Supabase project.

## Available Scripts

- `npm run dev` - Start the Vite development server
- `npm run build` - Build the application for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview the production build locally

## Project Structure

- `src/` - Application source code
- `src/components/` - Reusable UI and layout components
- `src/hooks/` - Custom React hooks
- `src/lib/` - Helper utilities and Supabase client setup
- `src/pages/` - Page-level views and routes
- `supabase/` - SQL schema and migration files

## Notes

- Keep `.env.local` out of version control.
- Update Supabase credentials before running the app.
- If you want to extend the app, start by reviewing `src/pages` and the `useTasks`/`useClients` hooks.
