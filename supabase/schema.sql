-- ============================================================
-- Crystal RCM — Schema (simplified)
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

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
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  task_type   TEXT NOT NULL CHECK (task_type IN (
                'payment_posting',
                'claims_scrubbing',
                'era_pulling',
                'eligibility_verification',
                'ar_followup',
                'denial_appeal'
              )),
  client_id   UUID REFERENCES clients(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  priority    TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
                'pending', 'in_progress', 'complete', 'flagged'
              )),
  due_date    DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
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

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
