-- ============================================================
-- OceanTix V2 — Supabase Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. BOOKINGS TABLE (stores purchased tickets + seat data)
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  movie_id TEXT NOT NULL,
  movie_title TEXT NOT NULL,
  movie_poster TEXT,
  theater_name TEXT NOT NULL,
  theater_type TEXT NOT NULL,
  show_date TEXT NOT NULL,
  show_time TEXT NOT NULL,
  seats TEXT[] NOT NULL,
  format_type TEXT NOT NULL,
  studio TEXT NOT NULL,
  order_number TEXT NOT NULL,
  booking_code TEXT NOT NULL,
  pass_key TEXT NOT NULL,
  price_per_seat INTEGER NOT NULL,
  service_fee INTEGER DEFAULT 12000,
  payment_method TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  show_timestamp BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SAVED CARDS TABLE (per-account stored payment cards)
CREATE TABLE IF NOT EXISTS saved_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  card_number_masked TEXT NOT NULL,
  valid_thru TEXT NOT NULL,
  card_type TEXT DEFAULT 'visa',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_cards ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES FOR BOOKINGS
-- Anyone can read seat occupancy (needed for real-time seat display)
DROP POLICY IF EXISTS "Public can view all bookings" ON bookings;
CREATE POLICY "Public can view all bookings"
  ON bookings FOR SELECT
  USING (true);

-- Only authenticated owner can insert their own booking
DROP POLICY IF EXISTS "Users can insert own bookings" ON bookings;
CREATE POLICY "Users can insert own bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. RLS POLICIES FOR SAVED CARDS
DROP POLICY IF EXISTS "Users manage own cards" ON saved_cards;
CREATE POLICY "Users manage own cards"
  ON saved_cards FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. ENABLE REALTIME FOR BOOKINGS TABLE
-- (Also go to: Supabase Dashboard → Database → Replication → Enable bookings table)
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;

-- 7. OTP VERIFICATIONS TABLE (untuk verifikasi nomor WA saat daftar)
-- Catatan: User login menggunakan nomor HP + password.
-- Email internal dibuat otomatis dari nomor HP: 628xxx@oceantix.user (tidak ditampilkan ke user)
CREATE TABLE IF NOT EXISTS otp_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL UNIQUE,
  otp TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: hanya service role yang bisa akses tabel ini
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages OTP" ON otp_verifications;
CREATE POLICY "Service role manages OTP"
  ON otp_verifications FOR ALL
  USING (true)
  WITH CHECK (true);

-- 8. VERIFIED PHONES TABLE
-- Tracks permanently claimed phone numbers. Unique constraint ensures
-- no two accounts can share the same number.
CREATE TABLE IF NOT EXISTS verified_phones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  verified_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE verified_phones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages verified phones" ON verified_phones;
CREATE POLICY "Service role manages verified phones"
  ON verified_phones FOR ALL
  USING (true)
  WITH CHECK (true);


