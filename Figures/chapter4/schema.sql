CREATE TYPE user_role AS ENUM ('CUSTOMER', 'TAILOR', 'ADMIN');
CREATE TYPE order_status AS ENUM (
    'DRAFT','SUBMITTED','UNDER_REVIEW','NEEDS_CLARIFICATION',
    'ACCEPTED','DEPOSIT_PAID','IN_PRODUCTION',
    'READY','SHIPPED','DELIVERED','COMPLETED','REJECTED'
);
CREATE TYPE shipment_status AS ENUM ('PREPARING','IN_TRANSIT','DELIVERED','RETURNED');
CREATE TYPE article_status AS ENUM ('DRAFT','PUBLISHED','ARCHIVED');

CREATE TABLE users (
    user_id         UUID PRIMARY KEY,
    full_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    phone           VARCHAR(20),
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE measurement_profiles (
    profile_id      UUID PRIMARY KEY,
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

CREATE TABLE garment_designs (
    design_id       UUID PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    category        VARCHAR(80),
    gender_group    VARCHAR(20),
    base_price      DECIMAL(12,2) NOT NULL,
    active          BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE orders (
    order_id             UUID PRIMARY KEY,
    customer_id          UUID NOT NULL REFERENCES users(user_id),
    tailor_id            UUID REFERENCES users(user_id),
    order_number         VARCHAR(30) NOT NULL UNIQUE,
    status               VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    total_amount         DECIMAL(12,2) NOT NULL DEFAULT 0,
    delivery_fee         DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at           TIMESTAMP NOT NULL DEFAULT NOW(),
    expected_delivery_at TIMESTAMP
);

CREATE TABLE order_items (
    item_id         UUID PRIMARY KEY,
    order_id        UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    design_id       UUID NOT NULL REFERENCES garment_designs(design_id),
    quantity        INT NOT NULL DEFAULT 1,
    selected_color  VARCHAR(50),
    custom_note     TEXT,
    unit_price      DECIMAL(12,2) NOT NULL
);

CREATE TABLE measurement_snapshots (
    snapshot_id      UUID PRIMARY KEY,
    order_id         UUID NOT NULL UNIQUE REFERENCES orders(order_id),
    measurement_data TEXT NOT NULL,
    note             TEXT,
    frozen_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE reviews (
    review_id   UUID PRIMARY KEY,
    order_id    UUID NOT NULL UNIQUE REFERENCES orders(order_id),
    user_id     UUID NOT NULL REFERENCES users(user_id),
    rating      INT NOT NULL,
    comment     TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE shipments (
    shipment_id   UUID PRIMARY KEY,
    order_id      UUID NOT NULL UNIQUE REFERENCES orders(order_id),
    carrier_name  VARCHAR(100),
    tracking_code VARCHAR(100),
    status        VARCHAR(20) NOT NULL DEFAULT 'PREPARING',
    shipped_at    TIMESTAMP,
    delivered_at  TIMESTAMP
);

CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    channel         VARCHAR(20) NOT NULL DEFAULT 'IN_APP',
    title           VARCHAR(200) NOT NULL,
    content         TEXT NOT NULL,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at         TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE cultural_articles (
    article_id   UUID PRIMARY KEY,
    author_id    UUID NOT NULL REFERENCES users(user_id),
    title        VARCHAR(200) NOT NULL,
    slug         VARCHAR(200) NOT NULL UNIQUE,
    origin       VARCHAR(100),
    summary      TEXT,
    status       VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    published_at TIMESTAMP
);

CREATE TABLE symbol_meanings (
    symbol_id   UUID PRIMARY KEY,
    article_id  UUID NOT NULL REFERENCES cultural_articles(article_id) ON DELETE CASCADE,
    symbol_name VARCHAR(150) NOT NULL,
    meaning     TEXT,
    placement   VARCHAR(100),
    image_url   VARCHAR(300)
);

CREATE TABLE measurement_guides (
    guide_id         UUID PRIMARY KEY,
    title            VARCHAR(150) NOT NULL,
    body_part        VARCHAR(80),
    instruction_text TEXT,
    image_url        VARCHAR(300),
    step_order       INT NOT NULL DEFAULT 1
);
