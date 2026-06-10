-- ============================================================
-- Crystal RCM — Migration v2
-- Run this in the Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1. TIME TRACKING
-- started_at: set when employee begins working on a task
-- time_spent_minutes: computed and stored on completion
-- ------------------------------------------------------------
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS time_spent_minutes INTEGER;

-- ------------------------------------------------------------
-- 2. APPEAL DEADLINE
-- Separate from due_date — payer-specific statutory deadline
-- Medicare: 120 days, Commercial: 90 days, Medicaid: 60 days, Vision: 90 days
-- ------------------------------------------------------------
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS appeal_deadline DATE;

-- ------------------------------------------------------------
-- 3. ERA STATUS FIELDS (payment_posting tasks only)
-- ------------------------------------------------------------
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS era_pulled BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS era_posted  BOOLEAN DEFAULT FALSE;

-- ------------------------------------------------------------
-- 4. CLIENT PAYERS
-- Specific payer names per client (e.g. Moore Optometry — EyeMed)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_payers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  name       TEXT NOT NULL,          -- e.g. "EyeMed", "Aetna", "BCBS"
  payer_type TEXT NOT NULL CHECK (payer_type IN ('Medicare', 'Medicaid', 'commercial', 'vision')),
  active     BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE client_payers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_payers_select" ON client_payers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "client_payers_insert" ON client_payers
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'manager');

CREATE POLICY "client_payers_update" ON client_payers
  FOR UPDATE TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'manager');

CREATE POLICY "client_payers_delete" ON client_payers
  FOR DELETE TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'manager');

-- Link tasks to a specific client payer
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS client_payer_id UUID REFERENCES client_payers(id) ON DELETE SET NULL;

-- Enable realtime for client_payers
ALTER PUBLICATION supabase_realtime ADD TABLE client_payers;
