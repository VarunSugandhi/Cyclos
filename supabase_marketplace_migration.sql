-- ═══════════════════════════════════════════════════════════════
-- Cyclos Marketplace — Supabase Database Migration
-- Run this SQL in your Supabase project's SQL Editor
-- URL: https://supabase.com/dashboard/project/helfjeviqqeudqzyvlez/sql/new
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Products Table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT,
  item_name   TEXT,                          -- alias friendly column
  category    TEXT        NOT NULL DEFAULT 'plastic',
  description TEXT,
  price       TEXT,
  location    TEXT,
  quantity    TEXT,
  image_url   TEXT,
  seller_id   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  seller_name TEXT,
  status      TEXT        DEFAULT 'active',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. Buy Requests Table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS buy_requests (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id   UUID        REFERENCES products(id) ON DELETE SET NULL,
  buyer_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id    UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_name   TEXT,
  product_name TEXT,
  status       TEXT        DEFAULT 'pending',
  message      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. Enable Row Level Security ─────────────────────────────
ALTER TABLE products     ENABLE ROW LEVEL SECURITY;
ALTER TABLE buy_requests ENABLE ROW LEVEL SECURITY;

-- ─── 4. RLS Policies — Products ──────────────────────────────

-- Anyone authenticated can read all active products
CREATE POLICY IF NOT EXISTS "Products readable by authenticated users"
ON products FOR SELECT
USING (auth.role() = 'authenticated');

-- Sellers can insert their own products
CREATE POLICY IF NOT EXISTS "Sellers can insert products"
ON products FOR INSERT
WITH CHECK (auth.uid() = seller_id OR seller_id IS NULL);

-- Sellers can update their own products
CREATE POLICY IF NOT EXISTS "Sellers can update own products"
ON products FOR UPDATE
USING (auth.uid() = seller_id);

-- Sellers can delete their own products
CREATE POLICY IF NOT EXISTS "Sellers can delete own products"
ON products FOR DELETE
USING (auth.uid() = seller_id);

-- ─── 5. RLS Policies — Buy Requests ──────────────────────────

-- Buyers can create buy requests
CREATE POLICY IF NOT EXISTS "Buyers can create buy requests"
ON buy_requests FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

-- Sellers and buyers can view their own requests
CREATE POLICY IF NOT EXISTS "Users can view their buy requests"
ON buy_requests FOR SELECT
USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

-- ─── 6. Storage Bucket for Product Images ────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage: authenticated users can upload
CREATE POLICY IF NOT EXISTS "Authenticated users can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Storage: images are publicly viewable
CREATE POLICY IF NOT EXISTS "Product images are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- ─── 7. Enable Realtime ───────────────────────────────────────
-- Make sure realtime is enabled for these tables in your
-- Supabase dashboard → Database → Replication → Tables
-- or run:
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE buy_requests;

-- ─── Done! ────────────────────────────────────────────────────
SELECT 'Migration completed successfully!' AS status;
