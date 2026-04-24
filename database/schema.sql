-- schema.sql — PostgreSQL өгөгдлийн сангийн бүтэц
-- Энэ файлыг нэг удаа ажиллуулж бүх хүснэгтүүдийг үүсгэнэ
--
-- Ажиллуулах: psql -U postgres -d buriad_huvtsas -f schema.sql

-- UUID үүсгэгч идэвхжүүлэх (PostgreSQL-ийн суурь өргөтгөл)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- ENUM ТӨРЛҮҮД — зөвшөөрөгдсөн утгуудын жагсаалт
-- =============================================

CREATE TYPE user_role AS ENUM ('customer', 'tailor', 'admin');
CREATE TYPE account_status AS ENUM ('active', 'inactive', 'blocked');
CREATE TYPE order_status AS ENUM (
  'draft', 'submitted', 'under_review', 'needs_clarification',
  'accepted', 'rejected', 'deposit_paid', 'in_production',
  'ready', 'shipped', 'delivered', 'completed', 'cancelled'
);
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE shipment_status AS ENUM ('preparing', 'in_transit', 'delivered', 'returned');
CREATE TYPE article_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE notification_channel AS ENUM ('in_app', 'email', 'sms');
CREATE TYPE consultation_status AS ENUM ('open', 'answered', 'converted_to_order', 'closed');

-- =============================================
-- ХЭРЭГЛЭГЧИД — бүх төрлийн хэрэглэгчийн үндсэн хүснэгт
-- =============================================

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name       VARCHAR(100) NOT NULL,
  email           VARCHAR(150) UNIQUE NOT NULL,
  phone           VARCHAR(20),
  password_hash   TEXT NOT NULL,
  role            user_role NOT NULL DEFAULT 'customer',
  status          account_status NOT NULL DEFAULT 'active',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at   TIMESTAMPTZ
);

-- =============================================
-- ЗАХИАЛАГЧИЙН ПРОФАЙЛ
-- =============================================

CREATE TABLE customer_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  preferred_language  VARCHAR(20) DEFAULT 'mn'
);

-- =============================================
-- ОЁДОЛЧНИЙ ПРОФАЙЛ
-- =============================================

CREATE TABLE tailor_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  business_name   VARCHAR(150),
  specialization  TEXT,
  rating          NUMERIC(3,2) DEFAULT 0.00,
  verified        BOOLEAN DEFAULT FALSE,
  min_lead_days   INTEGER DEFAULT 7,
  max_lead_days   INTEGER DEFAULT 30,
  introduction    TEXT,
  avatar_url      TEXT
);

-- Оёдолчний портфолио зургууд
CREATE TABLE tailor_media (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tailor_id   UUID NOT NULL REFERENCES tailor_profiles(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  caption     VARCHAR(200),
  sort_order  INTEGER DEFAULT 0
);

-- =============================================
-- ХАЯГУУД
-- =============================================

CREATE TABLE addresses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  city        VARCHAR(100),
  district    VARCHAR(100),
  street      VARCHAR(200),
  detail      TEXT,
  is_default  BOOLEAN DEFAULT FALSE
);

-- =============================================
-- ХЭМЖЭЭС АВАХ ЗААВАР
-- =============================================

CREATE TABLE measurement_guides (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         VARCHAR(200) NOT NULL,
  target_group  VARCHAR(50),  -- жишээ нь: 'adult_female', 'adult_male', 'child'
  status        article_status NOT NULL DEFAULT 'draft',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE measurement_guide_steps (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id          UUID NOT NULL REFERENCES measurement_guides(id) ON DELETE CASCADE,
  body_part         VARCHAR(100) NOT NULL,  -- жишээ нь: 'chest', 'waist', 'hip'
  instruction_text  TEXT NOT NULL,
  illustration_url  TEXT,
  step_order        INTEGER NOT NULL
);

-- =============================================
-- ХЭМЖЭЭСИЙН ПРОФАЙЛ (захиалагчийн хадгалсан)
-- =============================================

CREATE TABLE measurement_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_name    VARCHAR(100) NOT NULL DEFAULT 'Default',
  gender_category VARCHAR(30),
  captured_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE measurement_values (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    UUID NOT NULL REFERENCES measurement_profiles(id) ON DELETE CASCADE,
  metric_code   VARCHAR(50) NOT NULL,  -- жишээ нь: 'chest', 'waist', 'sleeve'
  metric_value  NUMERIC(6,2) NOT NULL,
  unit          VARCHAR(10) DEFAULT 'cm'
);

-- =============================================
-- ХУВЦАСНЫ КАТАЛОГ
-- =============================================

CREATE TABLE garment_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  audience    VARCHAR(50),   -- жишээ нь: 'women', 'men', 'children'
  description TEXT
);

CREATE TABLE garment_designs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tailor_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id     UUID REFERENCES garment_categories(id) ON DELETE SET NULL,
  name            VARCHAR(150) NOT NULL,
  ceremonial_use  VARCHAR(200),
  silhouette      VARCHAR(100),
  base_price      NUMERIC(10,2) NOT NULL DEFAULT 0,
  image_url       TEXT,
  -- huvtsasiig tegshlej taviad avsan zurag, try-on deer heregtei
  flat_image_url  TEXT,
  active          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE material_options (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id       UUID NOT NULL REFERENCES garment_designs(id) ON DELETE CASCADE,
  material_name   VARCHAR(100) NOT NULL,
  color           VARCHAR(100),
  extra_cost      NUMERIC(10,2) DEFAULT 0,
  available       BOOLEAN DEFAULT TRUE
);

-- =============================================
-- СОЁЛЫН НИЙТЛЭЛҮҮД
-- =============================================

CREATE TABLE cultural_articles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  title           VARCHAR(200) NOT NULL,
  slug            VARCHAR(200) UNIQUE NOT NULL,
  origin_region   VARCHAR(100),
  era             VARCHAR(100),
  summary         TEXT,
  status          article_status NOT NULL DEFAULT 'draft',
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE article_sections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id    UUID NOT NULL REFERENCES cultural_articles(id) ON DELETE CASCADE,
  heading       VARCHAR(200),
  body_content  TEXT NOT NULL,
  section_order INTEGER NOT NULL
);

CREATE TABLE symbol_meanings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id    UUID REFERENCES cultural_articles(id) ON DELETE SET NULL,
  symbol_name   VARCHAR(150) NOT NULL,
  interpretation TEXT,
  placement     VARCHAR(150)
);

-- =============================================
-- ЗАХИАЛГУУД
-- =============================================

CREATE TABLE orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number          VARCHAR(20) UNIQUE NOT NULL,
  customer_id           UUID NOT NULL REFERENCES users(id),
  tailor_id             UUID REFERENCES users(id),
  address_id            UUID REFERENCES addresses(id),
  status                order_status NOT NULL DEFAULT 'draft',
  subtotal              NUMERIC(10,2) DEFAULT 0,
  delivery_fee          NUMERIC(10,2) DEFAULT 0,
  total_amount          NUMERIC(10,2) DEFAULT 0,
  expected_delivery_at  TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  design_id         UUID NOT NULL REFERENCES garment_designs(id),
  material_option_id UUID REFERENCES material_options(id),
  quantity          INTEGER NOT NULL DEFAULT 1,
  selected_color    VARCHAR(100),
  custom_note       TEXT,
  unit_price        NUMERIC(10,2) NOT NULL
);

-- Захиалга үүсгэх үеийн хэмжээсийн хуулбар (царцаасан, хэзээ ч өөрчлөгдөхгүй)
CREATE TABLE measurement_snapshots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  frozen_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note        TEXT
);

CREATE TABLE snapshot_measurements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id   UUID NOT NULL REFERENCES measurement_snapshots(id) ON DELETE CASCADE,
  metric_code   VARCHAR(50) NOT NULL,
  metric_value  NUMERIC(6,2) NOT NULL,
  unit          VARCHAR(10) DEFAULT 'cm'
);

-- Захиалгын төлөв өөрчлөгдсөн түүх
CREATE TABLE order_status_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status     order_status,
  to_status       order_status NOT NULL,
  changed_by_id   UUID REFERENCES users(id),
  note            TEXT,
  changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- ТӨЛБӨРҮҮД
-- =============================================

CREATE TABLE payments (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                UUID NOT NULL REFERENCES orders(id),
  amount                  NUMERIC(10,2) NOT NULL,
  method                  VARCHAR(50),   -- жишээ нь: 'card', 'qpay', 'bank_transfer'
  status                  payment_status NOT NULL DEFAULT 'pending',
  transaction_reference   VARCHAR(200),
  paid_at                 TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- ХҮРГЭЛТҮҮД
-- =============================================

CREATE TABLE shipments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL UNIQUE REFERENCES orders(id),
  carrier_name        VARCHAR(100),
  tracking_code       VARCHAR(200),
  status              shipment_status NOT NULL DEFAULT 'preparing',
  shipped_at          TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- СЭТГЭГДЛҮҮД
-- =============================================

CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL UNIQUE REFERENCES orders(id),
  customer_id UUID NOT NULL REFERENCES users(id),
  tailor_id   UUID NOT NULL REFERENCES users(id),
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  approved    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- МЭДЭГДЛҮҮД
-- =============================================

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id    UUID REFERENCES orders(id) ON DELETE SET NULL,
  channel     notification_channel NOT NULL DEFAULT 'in_app',
  title       VARCHAR(200) NOT NULL,
  content     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- ЗӨВЛӨГӨӨНИЙ ХАРИЛЦАА
-- =============================================

CREATE TABLE consultation_threads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES users(id),
  tailor_id   UUID NOT NULL REFERENCES users(id),
  order_id    UUID REFERENCES orders(id) ON DELETE SET NULL,
  status      consultation_status NOT NULL DEFAULT 'open',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE consultation_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id       UUID NOT NULL REFERENCES consultation_threads(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES users(id),
  sender_role     user_role NOT NULL,
  message_body    TEXT NOT NULL,
  attachment_url  TEXT,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- ИНДЕКСҮҮД — түгээмэл query-г хурдасгах
-- =============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_tailor ON orders(tailor_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE is_read = FALSE;
