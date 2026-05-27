-- order_status enum-д 'cancelled' утга нэмэх
-- Өмнөх schema-д байгаагүй тул шинэ migration хэрэгтэй болсон
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'cancelled';
