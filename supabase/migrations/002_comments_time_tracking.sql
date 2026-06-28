-- Migration 002: Comments, Time Tracking, Follow-up Date
-- Run this if you already applied the initial schema.sql

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS follow_up_date DATE;

CREATE TABLE IF NOT EXISTS task_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select_manager" ON task_comments FOR SELECT TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'manager');
CREATE POLICY "comments_select_assignee" ON task_comments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM tasks WHERE id = task_id AND assigned_to = auth.uid()));
CREATE POLICY "comments_insert" ON task_comments FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());
CREATE POLICY "comments_delete_own" ON task_comments FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'manager');

CREATE TABLE IF NOT EXISTS time_entries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id          UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  employee_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at         TIMESTAMPTZ,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  note             TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "time_select_manager" ON time_entries FOR SELECT TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'manager');
CREATE POLICY "time_select_own" ON time_entries FOR SELECT TO authenticated
  USING (employee_id = auth.uid());
CREATE POLICY "time_insert_own" ON time_entries FOR INSERT TO authenticated
  WITH CHECK (employee_id = auth.uid());
CREATE POLICY "time_update_own" ON time_entries FOR UPDATE TO authenticated
  USING (employee_id = auth.uid());
CREATE POLICY "time_delete_own" ON time_entries FOR DELETE TO authenticated
  USING (employee_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'manager');

ALTER PUBLICATION supabase_realtime ADD TABLE task_comments;
