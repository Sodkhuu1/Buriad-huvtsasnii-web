ALTER TABLE users
  ADD COLUMN IF NOT EXISTS gender VARCHAR(30),
  ADD COLUMN IF NOT EXISTS age INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_age_range_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_age_range_check
      CHECK (age IS NULL OR (age >= 0 AND age <= 130));
  END IF;
END $$;
