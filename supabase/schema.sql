-- ============================================================
-- Crystal RCM — Schema (simplified)
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- Ensure uuid helper functions are available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE profiles (
  id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  role       TEXT NOT NULL CHECK (role IN ('manager', 'employee')),
  specialty  TEXT CHECK (specialty IN ('payment_poster', 'ar_specialist', 'claims_scrubber')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE clients (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                   TEXT NOT NULL,
  payer_mix_medicare     DECIMAL(5,2) DEFAULT 0,
  payer_mix_medicaid     DECIMAL(5,2) DEFAULT 0,
  payer_mix_commercial   DECIMAL(5,2) DEFAULT 0,
  payer_mix_vision       DECIMAL(5,2) DEFAULT 0,
  monthly_claim_volume   INTEGER DEFAULT 0,
  created_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tasks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT NOT NULL,
  task_type      TEXT NOT NULL CHECK (task_type IN (
                   'payment_posting',
                   'claims_scrubbing',
                   'era_pulling',
                   'eligibility_verification',
                   'ar_followup',
                   'denial_appeal'
                 )),
  client_id      UUID REFERENCES clients(id) ON DELETE SET NULL,
  assigned_to    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  priority       TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
                   'pending', 'in_progress', 'complete', 'flagged'
                 )),
  due_date       DATE,
  follow_up_date DATE,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  completed_at   TIMESTAMPTZ
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name, role, specialty)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee'),
    NEW.raw_user_meta_data->>'specialty'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Row Level Security
ALTER TABLE profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_all" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "clients_select" ON clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "clients_insert" ON clients FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'manager');
CREATE POLICY "clients_update" ON clients FOR UPDATE TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'manager');
CREATE POLICY "clients_delete" ON clients FOR DELETE TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'manager');

CREATE POLICY "tasks_manager_select" ON tasks FOR SELECT TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'manager');
CREATE POLICY "tasks_manager_insert" ON tasks FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'manager');
CREATE POLICY "tasks_manager_update" ON tasks FOR UPDATE TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'manager');
CREATE POLICY "tasks_manager_delete" ON tasks FOR DELETE TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'manager');
CREATE POLICY "tasks_employee_select" ON tasks FOR SELECT TO authenticated
  USING (assigned_to = auth.uid());
CREATE POLICY "tasks_employee_update" ON tasks FOR UPDATE TO authenticated
  USING (assigned_to = auth.uid());

-- Task activity log (comments)
CREATE TABLE task_comments (
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

-- Time tracking
CREATE TABLE time_entries (
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

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE task_comments;
