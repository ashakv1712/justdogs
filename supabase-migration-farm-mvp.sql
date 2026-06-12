-- ============================================================
-- Just Dogs — Farm MVP Schema Migration
-- ============================================================
-- Safe to run on an existing database (idempotent).
-- Run in the Supabase SQL Editor after all prior migrations.
--
-- Changes implemented:
--   1. farm_day_trainers — multiple trainers per farm day
--   2. bookings          — relax time/trainer constraints for farm bookings
--   3. daily_dog_feedback — link to farm_day
--   4. farm_photos       — link to farm_day, make booking_id optional
--   5. daily_dog_feedback — optional photo_id link
--   6. bookings          — booking_type_id FK + populate farm booking types
--   7. addon tables      — farm_booking_addon_types + booking_addon_selections
--   8. dogs              — farm_trial_completed flag
--   BONUS: dogs          — date_of_birth column
-- ============================================================

-- Shared helper (safe to re-create)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- PREREQUISITE: Ensure farm_days table exists
-- (may have been created manually; CREATE IF NOT EXISTS is safe)
-- ============================================================
CREATE TABLE IF NOT EXISTS farm_days (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  date         DATE        NOT NULL,
  max_capacity INTEGER     NOT NULL DEFAULT 30,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add unique constraint on date if not already present
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'farm_days_date_key' AND conrelid = 'farm_days'::regclass
  ) THEN
    ALTER TABLE farm_days ADD CONSTRAINT farm_days_date_key UNIQUE (date);
  END IF;
END $$;

-- Add updated_at column if it was created without it
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'farm_days' AND column_name = 'updated_at') THEN
    ALTER TABLE farm_days ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_farm_days_updated_at ON farm_days;
CREATE TRIGGER update_farm_days_updated_at
  BEFORE UPDATE ON farm_days
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE farm_days ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "farm_days_select" ON farm_days;
DROP POLICY IF EXISTS "farm_days_admin"  ON farm_days;
CREATE POLICY "farm_days_select" ON farm_days FOR SELECT USING (true);
CREATE POLICY "farm_days_admin"  ON farm_days FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);


-- ============================================================
-- CHANGE 1 — Multiple trainers per farm day
-- ============================================================

-- 1a. Junction table
CREATE TABLE IF NOT EXISTS farm_day_trainers (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_day_id UUID        NOT NULL REFERENCES farm_days(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (farm_day_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_farm_day_trainers_farm_day ON farm_day_trainers(farm_day_id);
CREATE INDEX IF NOT EXISTS idx_farm_day_trainers_user     ON farm_day_trainers(user_id);

ALTER TABLE farm_day_trainers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "farm_day_trainers_read"  ON farm_day_trainers;
DROP POLICY IF EXISTS "farm_day_trainers_admin" ON farm_day_trainers;
CREATE POLICY "farm_day_trainers_read" ON farm_day_trainers FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('trainer', 'admin'))
);
CREATE POLICY "farm_day_trainers_admin" ON farm_day_trainers FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- 1b. Migrate existing single trainer → junction table (no-op if column already dropped)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'farm_days' AND column_name = 'trainer_id') THEN
    INSERT INTO farm_day_trainers (farm_day_id, user_id)
    SELECT id, trainer_id FROM farm_days WHERE trainer_id IS NOT NULL
    ON CONFLICT (farm_day_id, user_id) DO NOTHING;
  END IF;
END $$;

-- 1c. Drop objects that depend on farm_days.trainer_id before dropping the column.
--     These were created manually (not in any migration file) so we must drop them
--     explicitly and recreate them below using farm_day_trainers.

-- Policy: "Trainers read their farm_days" — referenced trainer_id = auth.uid()
DROP POLICY IF EXISTS "Trainers read their farm_days" ON farm_days;

-- View: farm_day_summary — joined users via trainer_id
DROP VIEW IF EXISTS farm_day_summary;

-- 1d. Now safe to drop the column
ALTER TABLE farm_days DROP COLUMN IF EXISTS trainer_id;

-- 1e. Recreate the policy using the new junction table
--     Trainers can see any farm day they are assigned to; admins see all.
DROP POLICY IF EXISTS "farm_days_trainer_read" ON farm_days;
CREATE POLICY "farm_days_trainer_read" ON farm_days FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM farm_day_trainers fdt
    WHERE  fdt.farm_day_id = farm_days.id
      AND  fdt.user_id     = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- 1f. Recreate farm_day_summary view using farm_day_trainers
CREATE OR REPLACE VIEW farm_day_summary AS
SELECT
  fd.id,
  fd.date,
  fd.max_capacity,
  fd.notes,
  fd.created_at,
  fd.updated_at,
  -- Aggregate trainer names as an array and as a comma-separated string
  array_agg(u.full_name ORDER BY u.full_name) FILTER (WHERE u.id IS NOT NULL) AS trainer_names,
  string_agg(u.full_name, ', ' ORDER BY u.full_name)
    FILTER (WHERE u.id IS NOT NULL)                                            AS trainers_display,
  COUNT(DISTINCT fdt.user_id)                                                  AS trainer_count,
  COUNT(DISTINCT b.id) FILTER (WHERE b.status NOT IN ('cancelled'))            AS booked_dogs,
  COUNT(DISTINCT b.id)                                                         AS total_bookings
FROM        farm_days          fd
LEFT JOIN   farm_day_trainers  fdt ON fdt.farm_day_id = fd.id
LEFT JOIN   users              u   ON u.id            = fdt.user_id
LEFT JOIN   bookings           b   ON b.farm_day_id   = fd.id
GROUP BY    fd.id, fd.date, fd.max_capacity, fd.notes, fd.created_at, fd.updated_at;

-- ⚠ IMPORTANT — API code that still references farm_days.trainer_id must be updated:
--   • src/app/api/farm-days/route.ts   — change .select('*, trainers:trainer_id(full_name)')
--                                         to query farm_day_trainers or use farm_day_summary
--   • src/app/api/bookings/route.ts    — remove trainer_id from the nested farm_day select
--   • src/components/AdminManagementPanel.tsx — update trainer display to use trainer_names array


-- ============================================================
-- CHANGE 2 — Farm bookings: relax time/trainer constraints
-- ============================================================

-- 2a. Add farm_day_id FK to bookings if not present
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'farm_day_id') THEN
    ALTER TABLE bookings ADD COLUMN farm_day_id UUID REFERENCES farm_days(id) ON DELETE SET NULL;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_bookings_farm_day_id ON bookings(farm_day_id);

-- 2b. Make trainer_id nullable — farm bookings carry no trainer on the booking row
ALTER TABLE bookings ALTER COLUMN trainer_id DROP NOT NULL;

-- 2c. Make start_time / end_time nullable — farm bookings are full-day
ALTER TABLE bookings ALTER COLUMN start_time DROP NOT NULL;
ALTER TABLE bookings ALTER COLUMN end_time   DROP NOT NULL;

-- 2d. Drop constraints that require non-NULL times
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS valid_booking_time;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS no_past_bookings;

-- 2e. Drop double-booking trigger (time-based; inapplicable to farm bookings)
DROP TRIGGER IF EXISTS prevent_double_booking ON bookings;


-- ============================================================
-- CHANGE 3 — Link daily feedback to a farm day
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_dog_feedback' AND column_name = 'farm_day_id') THEN
    ALTER TABLE daily_dog_feedback
      ADD COLUMN farm_day_id UUID REFERENCES farm_days(id) ON DELETE SET NULL;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_daily_dog_feedback_farm_day ON daily_dog_feedback(farm_day_id);


-- ============================================================
-- CHANGE 4 — Link photos to farm days directly
-- ============================================================

-- 4a. Add farm_day_id column
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'farm_photos' AND column_name = 'farm_day_id') THEN
    ALTER TABLE farm_photos
      ADD COLUMN farm_day_id UUID REFERENCES farm_days(id) ON DELETE SET NULL;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_farm_photos_farm_day_id ON farm_photos(farm_day_id);

-- 4b. Backfill: pull farm_day_id through the existing booking link
UPDATE farm_photos fp
SET    farm_day_id = b.farm_day_id
FROM   bookings b
WHERE  fp.booking_id   = b.id
  AND  b.farm_day_id   IS NOT NULL
  AND  fp.farm_day_id  IS NULL;

-- 4c. Make booking_id optional — a photo belongs to a day, not one specific booking
ALTER TABLE farm_photos ALTER COLUMN booking_id DROP NOT NULL;


-- ============================================================
-- CHANGE 5 — Optional photo link on feedback entries
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_dog_feedback' AND column_name = 'photo_id') THEN
    ALTER TABLE daily_dog_feedback
      ADD COLUMN photo_id UUID REFERENCES farm_photos(id) ON DELETE SET NULL;
  END IF;
END $$;


-- ============================================================
-- CHANGE 6a — booking_type_id FK on bookings
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'booking_type_id') THEN
    ALTER TABLE bookings
      ADD COLUMN booking_type_id UUID REFERENCES booking_types(id) ON DELETE SET NULL;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_bookings_booking_type_id ON bookings(booking_type_id);


-- ============================================================
-- CHANGE 6b — Populate booking_types with specific farm services
-- ============================================================

-- Remove the old generic 'Farm' row only when no bookings already reference it by FK
DELETE FROM booking_types
WHERE  name     = 'Farm'
  AND  category = 'farm'
  AND  NOT EXISTS (
    SELECT 1 FROM bookings WHERE booking_type_id = booking_types.id
  );

-- Insert the specific farm booking types (skip if name+category already exists)
INSERT INTO booking_types (name, category, duration_minutes, price_per_dog, is_active)
SELECT v.name, 'farm', 0, v.price, true
FROM (VALUES
  ('Trial Session',                250),
  ('Play-Care Full Day',           220),
  ('Play-Care Full Day (2nd dog)', 200),
  ('Cosy-Care Full Day',           220),
  ('Cosy-Care Full Day (2nd dog)', 200),
  ('Half Day Drop-In',             150),
  ('Half Day Drop-In (2nd dog)',   130)
) AS v(name, price)
WHERE NOT EXISTS (
  SELECT 1 FROM booking_types bt
  WHERE  bt.name = v.name AND bt.category = 'farm'
);


-- ============================================================
-- CHANGE 6c — Backfill booking_type_id on existing bookings
-- ============================================================

-- Generic 'farm' text → 'Play-Care Full Day' (safest default for existing data)
UPDATE bookings b
SET    booking_type_id = bt.id
FROM   booking_types bt
WHERE  bt.name          = 'Play-Care Full Day'
  AND  bt.category      = 'farm'
  AND  b.booking_type   = 'farm'
  AND  b.booking_type_id IS NULL;

-- Any other bookings: try exact case-insensitive name match
UPDATE bookings b
SET    booking_type_id = bt.id
FROM   booking_types bt
WHERE  lower(b.booking_type) = lower(bt.name)
  AND  b.booking_type_id      IS NULL;


-- ============================================================
-- CHANGE 7 — Farm booking add-ons
-- ============================================================

CREATE TABLE IF NOT EXISTS farm_booking_addon_types (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT         NOT NULL UNIQUE,
  price      NUMERIC(10,2) NOT NULL,
  is_active  BOOLEAN      NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO farm_booking_addon_types (name, price, is_active)
VALUES
  ('K9 Gym',             100.00, true),
  ('Nail Trim',           80.00, true),
  ('Basic Shampoo Bath',  80.00, true)
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS booking_addon_selections (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    UUID        NOT NULL REFERENCES bookings(id)                  ON DELETE CASCADE,
  addon_type_id UUID        NOT NULL REFERENCES farm_booking_addon_types(id)  ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (booking_id, addon_type_id)
);

CREATE INDEX IF NOT EXISTS idx_booking_addon_selections_booking ON booking_addon_selections(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_addon_selections_addon   ON booking_addon_selections(addon_type_id);

ALTER TABLE farm_booking_addon_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_addon_selections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "addon_types_read"  ON farm_booking_addon_types;
DROP POLICY IF EXISTS "addon_types_admin" ON farm_booking_addon_types;
CREATE POLICY "addon_types_read"  ON farm_booking_addon_types FOR SELECT USING (
  is_active = true
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "addon_types_admin" ON farm_booking_addon_types FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "addon_selections_read"   ON booking_addon_selections;
DROP POLICY IF EXISTS "addon_selections_manage" ON booking_addon_selections;
-- Parents see their own bookings' add-ons; trainers/admins see all
CREATE POLICY "addon_selections_read" ON booking_addon_selections FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bookings b JOIN dogs d ON b.dog_id = d.id
    WHERE  b.id = booking_addon_selections.booking_id AND d.owner_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('trainer', 'admin'))
);
CREATE POLICY "addon_selections_manage" ON booking_addon_selections FOR ALL USING (
  EXISTS (
    SELECT 1 FROM bookings b JOIN dogs d ON b.dog_id = d.id
    WHERE  b.id = booking_addon_selections.booking_id AND d.owner_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);


-- ============================================================
-- CHANGE 8 — farm_trial_completed on dogs
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'dogs' AND column_name = 'farm_trial_completed') THEN
    ALTER TABLE dogs ADD COLUMN farm_trial_completed BOOLEAN NOT NULL DEFAULT false;
    COMMENT ON COLUMN dogs.farm_trial_completed IS
      'true = dog has completed its Trial Session; hide the Trial Session booking type when true';
  END IF;
END $$;

-- Auto-set for dogs that already have a completed Trial Session booking
UPDATE dogs d
SET    farm_trial_completed = true
WHERE  farm_trial_completed = false
  AND  EXISTS (
    SELECT 1 FROM bookings b
    JOIN   booking_types bt ON b.booking_type_id = bt.id
    WHERE  b.dog_id = d.id
      AND  bt.name  = 'Trial Session'
      AND  b.status = 'completed'
  );

-- ── ADMIN ONE-TIME SCRIPT ─────────────────────────────────────
-- Run this in the SQL Editor before go-live to mark existing
-- farm dogs as trial-complete (adjust the WHERE clause as needed):
--
--   UPDATE dogs SET farm_trial_completed = true
--   WHERE id IN (
--     -- paste specific dog UUIDs, or omit WHERE to update ALL dogs
--   );
-- ─────────────────────────────────────────────────────────────


-- ============================================================
-- BONUS — date_of_birth on dogs (replaces the stale age integer)
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'dogs' AND column_name = 'date_of_birth') THEN
    ALTER TABLE dogs ADD COLUMN date_of_birth DATE;
    COMMENT ON COLUMN dogs.date_of_birth IS
      'Preferred over the age column. Compute current age with: EXTRACT(YEAR FROM AGE(date_of_birth))';
  END IF;
END $$;


-- ============================================================
-- VERIFICATION QUERY
-- Run this after applying the migration to confirm per-day counts:
-- ============================================================
--
-- SELECT
--   fd.date,
--   fd.max_capacity,
--   COUNT(b.id) FILTER (WHERE b.status NOT IN ('cancelled')) AS booked_dogs,
--   COUNT(b.id)                                               AS total_bookings
-- FROM   farm_days fd
-- LEFT   JOIN bookings b ON b.farm_day_id = fd.id
-- GROUP  BY fd.id, fd.date, fd.max_capacity
-- ORDER  BY fd.date;
--
-- Also check trainer assignments:
--
-- SELECT fd.date, u.full_name AS trainer
-- FROM   farm_days fd
-- JOIN   farm_day_trainers fdt ON fdt.farm_day_id = fd.id
-- JOIN   users u               ON u.id = fdt.user_id
-- ORDER  BY fd.date;
