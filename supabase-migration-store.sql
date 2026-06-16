-- ============================================================
-- Just Dogs — Store Schema Migration
-- ============================================================
-- Run this in the Supabase SQL Editor (project → SQL Editor → New query).
-- Safe to re-run (idempotent).

-- Shared trigger helper (safe to re-create)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 0. images storage bucket — ensure it exists and is public
-- ============================================================
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES (
  'images',
  'images',
  true,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  5242880
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow anyone to read files from the images bucket
DROP POLICY IF EXISTS "images_public_read" ON storage.objects;
CREATE POLICY "images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

-- Allow authenticated users to upload
DROP POLICY IF EXISTS "images_auth_insert" ON storage.objects;
CREATE POLICY "images_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

-- Allow users to delete their own uploads
DROP POLICY IF EXISTS "images_auth_delete" ON storage.objects;
CREATE POLICY "images_auth_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);


-- ============================================================
-- 1. uploaded_images
--    Stores metadata for any file uploaded to Supabase Storage.
-- ============================================================
CREATE TABLE IF NOT EXISTS uploaded_images (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  filename          TEXT        NOT NULL,
  original_filename TEXT        NOT NULL,
  file_path         TEXT        NOT NULL,
  file_url          TEXT        NOT NULL,
  file_size         BIGINT      NOT NULL,
  mime_type         TEXT        NOT NULL,
  width             INTEGER,
  height            INTEGER,
  alt_text          TEXT,
  uploaded_by       UUID        REFERENCES users(id) ON DELETE SET NULL,
  entity_type       TEXT,
  entity_id         TEXT,
  is_active         BOOLEAN     NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add any columns that may be missing if the table pre-existed
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='uploaded_images' AND column_name='original_filename') THEN
    ALTER TABLE uploaded_images ADD COLUMN original_filename TEXT;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='uploaded_images' AND column_name='file_size') THEN
    ALTER TABLE uploaded_images ADD COLUMN file_size BIGINT;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='uploaded_images' AND column_name='mime_type') THEN
    ALTER TABLE uploaded_images ADD COLUMN mime_type TEXT;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='uploaded_images' AND column_name='width') THEN
    ALTER TABLE uploaded_images ADD COLUMN width INTEGER;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='uploaded_images' AND column_name='height') THEN
    ALTER TABLE uploaded_images ADD COLUMN height INTEGER;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='uploaded_images' AND column_name='alt_text') THEN
    ALTER TABLE uploaded_images ADD COLUMN alt_text TEXT;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='uploaded_images' AND column_name='uploaded_by') THEN
    ALTER TABLE uploaded_images ADD COLUMN uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='uploaded_images' AND column_name='entity_type') THEN
    ALTER TABLE uploaded_images ADD COLUMN entity_type TEXT;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='uploaded_images' AND column_name='entity_id') THEN
    ALTER TABLE uploaded_images ADD COLUMN entity_id TEXT;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='uploaded_images' AND column_name='is_active') THEN
    ALTER TABLE uploaded_images ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_uploaded_images_uploaded_by ON uploaded_images(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_uploaded_images_entity      ON uploaded_images(entity_type, entity_id);

ALTER TABLE uploaded_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "uploaded_images_service_all" ON uploaded_images;
CREATE POLICY "uploaded_images_service_all" ON uploaded_images USING (true) WITH CHECK (true);


-- ============================================================
-- 2. store_items
-- ============================================================
CREATE TABLE IF NOT EXISTS store_items (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT          NOT NULL,
  description    TEXT,
  photo_url      TEXT,
  tags           TEXT[]        NOT NULL DEFAULT '{}',
  price          NUMERIC(10,2) NOT NULL,
  stock_quantity INTEGER       NOT NULL DEFAULT 0,
  is_active      BOOLEAN       NOT NULL DEFAULT true,
  created_by     UUID          REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Add image_id column if missing (table may have been created without it)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'store_items' AND column_name = 'image_id'
  ) THEN
    ALTER TABLE store_items
      ADD COLUMN image_id UUID REFERENCES uploaded_images(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_store_items_is_active ON store_items(is_active);
CREATE INDEX IF NOT EXISTS idx_store_items_image_id  ON store_items(image_id);

DROP TRIGGER IF EXISTS update_store_items_updated_at ON store_items;
CREATE TRIGGER update_store_items_updated_at
  BEFORE UPDATE ON store_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE store_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_items_service_all" ON store_items;
CREATE POLICY "store_items_service_all" ON store_items USING (true) WITH CHECK (true);


-- ============================================================
-- 3. shopping_cart
-- ============================================================
CREATE TABLE IF NOT EXISTS shopping_cart (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES users(id)        ON DELETE CASCADE,
  store_item_id UUID        NOT NULL REFERENCES store_items(id)  ON DELETE CASCADE,
  quantity      INTEGER     NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, store_item_id)
);

CREATE INDEX IF NOT EXISTS idx_shopping_cart_user ON shopping_cart(user_id);

ALTER TABLE shopping_cart ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shopping_cart_service_all" ON shopping_cart;
CREATE POLICY "shopping_cart_service_all" ON shopping_cart USING (true) WITH CHECK (true);


-- ============================================================
-- 4. store_orders
--    order_number is auto-generated (ORD-00001, ORD-00002 …)
--    so the API can omit it on insert and still get it back.
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS store_orders_number_seq;

CREATE TABLE IF NOT EXISTS store_orders (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number    TEXT          UNIQUE NOT NULL
                                DEFAULT 'ORD-' || LPAD(NEXTVAL('store_orders_number_seq')::TEXT, 5, '0'),
  user_id         UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_method  TEXT          NOT NULL,
  notes           TEXT,
  admin_notes     TEXT,
  collection_note TEXT,
  total_amount    NUMERIC(10,2) NOT NULL,
  status          TEXT          NOT NULL DEFAULT 'pending',
  approved_at     TIMESTAMPTZ,
  approved_by     UUID          REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Add any columns that may be missing from an earlier version
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='store_orders' AND column_name='admin_notes') THEN
    ALTER TABLE store_orders ADD COLUMN admin_notes TEXT;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='store_orders' AND column_name='collection_note') THEN
    ALTER TABLE store_orders ADD COLUMN collection_note TEXT;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='store_orders' AND column_name='approved_at') THEN
    ALTER TABLE store_orders ADD COLUMN approved_at TIMESTAMPTZ;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='store_orders' AND column_name='approved_by') THEN
    ALTER TABLE store_orders ADD COLUMN approved_by UUID REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_store_orders_user_id ON store_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_store_orders_status  ON store_orders(status);

DROP TRIGGER IF EXISTS update_store_orders_updated_at ON store_orders;
CREATE TRIGGER update_store_orders_updated_at
  BEFORE UPDATE ON store_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE store_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_orders_service_all" ON store_orders;
CREATE POLICY "store_orders_service_all" ON store_orders USING (true) WITH CHECK (true);


-- ============================================================
-- 5. store_order_items
-- ============================================================
CREATE TABLE IF NOT EXISTS store_order_items (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID          NOT NULL REFERENCES store_orders(id) ON DELETE CASCADE,
  store_item_id UUID          NOT NULL REFERENCES store_items(id)  ON DELETE RESTRICT,
  quantity      INTEGER       NOT NULL CHECK (quantity > 0),
  unit_price    NUMERIC(10,2) NOT NULL,
  total_price   NUMERIC(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_store_order_items_order ON store_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_store_order_items_item  ON store_order_items(store_item_id);

ALTER TABLE store_order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "store_order_items_service_all" ON store_order_items;
CREATE POLICY "store_order_items_service_all" ON store_order_items USING (true) WITH CHECK (true);
