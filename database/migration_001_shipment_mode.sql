-- migration_001_shipment_mode.sql
-- Hurgleltiin urgcald 'pickup' bolon 'courier' gej 2 gorim baig boltsoo
-- Ajilluulah: psql -U postgres -d buriad_huvtsas -f migration_001_shipment_mode.sql

ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS mode VARCHAR(20) NOT NULL DEFAULT 'courier',
  ADD COLUMN IF NOT EXISTS note TEXT;

-- Aldartai data baival default mode='courier' gej tavix
-- Pickup gorim: customer iree avne — note: avah ogno, tsag, harilcah utas
-- Courier gorim: 3-dgh huvgalt — carrier_name + tracking_code
