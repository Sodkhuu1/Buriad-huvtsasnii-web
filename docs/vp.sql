-- ================================
-- Буриад хувцасны веб — PostgreSQL DDL
-- Visual Paradigm-д import хийх
-- ================================

CREATE TYPE user_role AS ENUM ('CUSTOMER', 'TAILOR', 'ADMIN');
CREATE TYPE order_status AS ENUM (
    'DRAFT','SUBMITTED','UNDER_REVIEW','NEEDS_CLARIFICATION',
    'ACCEPTED','DEPOSIT_PAID','IN_PRODUCTION',
    'READY','SHIPPED','DELIVERED','COMPLETED','REJECTED'
);
CREATE TYPE payment_status AS ENUM ('PENDING','PAID','FAILED','REFUNDED');
CREATE TYPE shipment_status AS ENUM ('PREPARING','IN_TRANSIT','DELIVERED','RETURNED');
CREATE TYPE article_status AS ENUM ('DRAFT','PUBLISHED','ARCHIVED');

-- 1. Хэрэглэгч
CREATE TABLE users (
    user_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    phone           VARCHAR(20),
    password_hash   VARCHAR(255) NOT NULL,
    role            user_role NOT NULL DEFAULT 'CUSTOMER',
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. Хэмжилтийн профайл
CREATE TABLE measurement_profiles (
    profile_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    profile_name    VARCHAR(100),
    gender_category VARCHAR(20),
    height          DECIMAL(5,1),
    chest           DECIMAL(5,1),
    hip             DECIMAL(5,1),
    shoulder        DECIMAL(5,1),
    sleeve          DECIMAL(5,1),
    captured_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. Хувцасны загвар
CREATE TABLE garment_designs (
    design_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(150) NOT NULL,
    category        VARCHAR(80),
    gender_group    VARCHAR(20),
    base_price      DECIMAL(12,2) NOT NULL,
    active          BOOLEAN NOT NULL DEFAULT TRUE
);

-- 4. Захиалга
CREATE TABLE orders (
    order_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id         UUID NOT NULL REFERENCES users(user_id),
    tailor_id           UUID REFERENCES users(user_id),
    order_number        VARCHAR(30) NOT NULL UNIQUE,
    status              order_status NOT NULL DEFAULT 'DRAFT',
    total_amount        DECIMAL(12,2) NOT NULL DEFAULT 0,
    delivery_fee        DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    expected_delivery_at TIMESTAMP
);

-- 5. Захиалгын мөр
CREATE TABLE order_items (
    item_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    design_id       UUID NOT NULL REFERENCES garment_designs(design_id),
    quantity        INT NOT NULL DEFAULT 1,
    selected_color  VARCHAR(50),
    custom_note     TEXT,
    unit_price      DECIMAL(12,2) NOT NULL
);

-- 6. Хэмжилтийн snapshot
CREATE TABLE measurement_snapshots (
    snapshot_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID NOT NULL UNIQUE REFERENCES orders(order_id),
    measurement_data    JSON NOT NULL,
    note                TEXT,
    frozen_at           TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 7. Үнэлгээ
CREATE TABLE reviews (
    review_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL UNIQUE REFERENCES orders(order_id),
    user_id         UUID NOT NULL REFERENCES users(user_id),
    rating          INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 8. Хүргэлт
CREATE TABLE shipments (
    shipment_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL UNIQUE REFERENCES orders(order_id),
    carrier_name    VARCHAR(100),
    tracking_code   VARCHAR(100),
    status          shipment_status NOT NULL DEFAULT 'PREPARING',
    shipped_at      TIMESTAMP,
    delivered_at    TIMESTAMP
);

-- 9. Мэдэгдэл
CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    channel         VARCHAR(20) NOT NULL DEFAULT 'IN_APP',
    title           VARCHAR(200) NOT NULL,
    content         TEXT NOT NULL,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at         TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 10. Соёлын нийтлэл
CREATE TABLE cultural_articles (
    article_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id       UUID NOT NULL REFERENCES users(user_id),
    title           VARCHAR(200) NOT NULL,
    slug            VARCHAR(200) NOT NULL UNIQUE,
    origin          VARCHAR(100),
    summary         TEXT,
    status          article_status NOT NULL DEFAULT 'DRAFT',
    published_at    TIMESTAMP
);

-- 11. Тэмдэгт, хээний утга
CREATE TABLE symbol_meanings (
    symbol_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id      UUID NOT NULL REFERENCES cultural_articles(article_id) ON DELETE CASCADE,
    symbol_name     VARCHAR(150) NOT NULL,
    meaning         TEXT,
    placement       VARCHAR(100),
    image_url       VARCHAR(300)
);

-- 12. Хэмжилтийн заавар
CREATE TABLE measurement_guides (
    guide_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(150) NOT NULL,
    body_part       VARCHAR(80),
    instruction_text TEXT,
    image_url       VARCHAR(300),
    step_order      INT NOT NULL DEFAULT 1
);