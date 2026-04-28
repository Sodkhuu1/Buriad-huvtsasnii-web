ALTER TABLE tailor_profiles
  ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS min_lead_days INTEGER DEFAULT 7,
  ADD COLUMN IF NOT EXISTS max_lead_days INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS introduction TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

UPDATE tailor_profiles
SET
  rating = COALESCE(rating, 0.00),
  verified = COALESCE(verified, FALSE),
  min_lead_days = COALESCE(min_lead_days, 7),
  max_lead_days = COALESCE(max_lead_days, 30);
