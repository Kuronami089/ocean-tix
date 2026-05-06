# 🌊 OceanTix V2 — Panduan Peningkatan Real-Time & Per-Akun

> Panduan ini menjelaskan langkah-langkah **konkret** untuk membuat kursi bioskop real-time, kartu debit tersimpan per akun, dan semua data tersinkron via Supabase.

---

## 📌 Daftar Masalah Sekarang

| Fitur | Status Sekarang | Yang Diinginkan |
|---|---|---|
| **Kursi** | Hardcoded dummy, tidak nyata | Real-time dari database |
| **Tiket** | Disimpan di `localStorage` browser lokal saja | Tersimpan di Supabase, bisa diakses dari device mana saja |
| **Kartu Debit** | Tidak disimpan sama sekali | Tersimpan per akun di Supabase |
| **Sinkronisasi** | Tidak ada — hanya data lokal | Real-time: jika user A beli kursi B5, user B langsung lihat B5 merah |

---

## 🗄️ LANGKAH 1: Buat Tabel di Supabase

Pergi ke **Supabase Dashboard → SQL Editor**, lalu jalankan SQL berikut satu per satu.

### 1A. Tabel `bookings` (kursi yang sudah dibeli)

```sql
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id TEXT NOT NULL,
  theater_name TEXT NOT NULL,
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
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 1B. Tabel `saved_cards` (kartu debit/kredit per akun)

```sql
CREATE TABLE saved_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  card_number_masked TEXT NOT NULL,
  valid_thru TEXT NOT NULL,
  card_type TEXT DEFAULT 'visa',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 1C. Aktifkan Row Level Security (RLS) — WAJIB

```sql
-- Aktifkan RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_cards ENABLE ROW LEVEL SECURITY;

-- Policy: User hanya bisa lihat/edit data dirinya sendiri
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Semua user bisa lihat kursi yang terisi (untuk real-time seat)
CREATE POLICY "Anyone can view seat occupancy" ON bookings
  FOR SELECT USING (true);

-- Policy: Kartu hanya milik sendiri
CREATE POLICY "Users manage own cards" ON saved_cards
  FOR ALL USING (auth.uid() = user_id);
```

> ⚠️ **PENTING**: Kalau policy "Anyone can view seat occupancy" dan "Users can view own bookings" konflik, hapus yang kedua dan pakai yang pertama saja. Yang penting semua orang bisa LIHAT kursi, tapi hanya pemilik yang bisa INSERT.

---

## 🔄 LANGKAH 2: Real-Time Kursi

### Cara Kerjanya

Ketika user buka halaman pilih kursi, app akan:
1. **Ambil semua kursi terisi** dari tabel `bookings` untuk film + bioskop + tanggal + jam yang sama
2. **Subscribe ke Supabase Realtime** — kalau ada user lain yang beli kursi, tampilan akan **otomatis update**

### 2A. Ubah `BookingSystem.tsx` — Hapus `dummyOccupiedSeats`

Sekarang di `BookingSystem.tsx` ada prop `dummyOccupiedSeats: string[]` yang hardcoded. Kita ganti dengan data real dari Supabase.

**File:** `components/BookingSystem.tsx`

**Cari** baris ini di interface `SeatSelectionProps`:
```tsx
dummyOccupiedSeats: string[];
```

**Ganti** dengan:
```tsx
occupiedSeats: string[]; // akan diisi dari Supabase
```

Lalu update semua referensi `dummyOccupiedSeats` → `occupiedSeats` di dalam komponen.

### 2B. Buat Hook `useRealtimeSeats`

Buat file baru: **`hooks/useRealtimeSeats.ts`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useRealtimeSeats(
  movieId: string,
  theaterName: string,
  showDate: string,
  showTime: string
) {
  const [occupiedSeats, setOccupiedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!movieId || !theaterName || !showDate || !showTime) return;

    // 1. Ambil kursi yang sudah terisi pertama kali
    const fetchSeats = async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("seats")
        .eq("movie_id", movieId)
        .eq("theater_name", theaterName)
        .eq("show_date", showDate)
        .eq("show_time", showTime);

      if (!error && data) {
        const allSeats = data.flatMap((b) => b.seats);
        setOccupiedSeats(allSeats);
      }
      setLoading(false);
    };

    fetchSeats();

    // 2. Subscribe real-time — otomatis update kalau ada booking baru
    const channel = supabase
      .channel(`seats-${movieId}-${theaterName}-${showDate}-${showTime}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bookings",
          filter: `movie_id=eq.${movieId}`,
        },
        (payload) => {
          const newBooking = payload.new as { seats: string[]; theater_name: string; show_date: string; show_time: string };
          // Pastikan ini untuk film + jam yang sama
          if (
            newBooking.theater_name === theaterName &&
            newBooking.show_date === showDate &&
            newBooking.show_time === showTime
          ) {
            setOccupiedSeats((prev) => [...prev, ...newBooking.seats]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [movieId, theaterName, showDate, showTime]);

  return { occupiedSeats, loading };
}
```

### 2C. Aktifkan Realtime di Supabase Dashboard

Pergi ke **Supabase Dashboard → Database → Replication** dan aktifkan tabel `bookings` untuk Realtime.

---

## 💾 LANGKAH 3: Tiket Tersimpan Per Akun (Supabase, bukan localStorage)

### 3A. Ubah `TicketContext.tsx`

Ganti seluruh isi `context/TicketContext.tsx` dengan versi yang pakai Supabase:

```tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// Tipe Ticket (sesuaikan dengan kolom tabel bookings)
export interface Ticket {
  id: string;
  status: "active" | "past";
  movie: { title: string; poster_path: string };
  theater: any;
  date: string;
  time: string;
  seatCount: number;
  seats: string[];
  bookingCode: string;
  passKey: string;
  orderNumber: string;
  price: number;
  serviceFee: number;
  paymentMethod: string;
  format: string;
  audi: string;
  timestamp: number;
}

interface TicketContextType {
  tickets: Ticket[];
  addTicket: (ticket: Ticket) => Promise<void>;
  loading: boolean;
}

const TicketContext = createContext<TicketContextType | undefined>(undefined);

export function TicketProvider({ children }: { children: React.ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Dapatkan user saat ini
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load tiket dari Supabase kalau sudah login
  useEffect(() => {
    if (!userId) {
      setTickets([]);
      setLoading(false);
      return;
    }

    const fetchTickets = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        // Konversi dari format database ke format Ticket
        const mapped: Ticket[] = data.map((b) => ({
          id: b.id,
          status: b.status,
          movie: {
            title: b.movie_title,
            poster_path: b.movie_poster,
          },
          theater: {
            name: b.theater_name,
            type: b.theater_type,
            price2D: b.price_per_seat,
            price3D: b.price_per_seat,
          },
          date: b.show_date,
          time: b.show_time,
          seatCount: b.seats.length,
          seats: b.seats,
          bookingCode: b.booking_code,
          passKey: b.pass_key,
          orderNumber: b.order_number,
          price: b.price_per_seat,
          serviceFee: b.service_fee,
          paymentMethod: b.payment_method,
          format: b.format_type,
          audi: b.studio,
          timestamp: b.show_timestamp,
        }));
        setTickets(mapped);
      }
      setLoading(false);
    };

    fetchTickets();
  }, [userId]);

  const addTicket = async (ticket: Ticket) => {
    if (!userId) return;

    const { error } = await supabase.from("bookings").insert({
      user_id: userId,
      movie_id: ticket.movie.title, // kalau punya TMDB ID, pakai itu
      movie_title: ticket.movie.title,
      movie_poster: ticket.movie.poster_path,
      theater_name: ticket.theater.name,
      theater_type: ticket.theater.type,
      show_date: ticket.date,
      show_time: ticket.time,
      seats: ticket.seats,
      format_type: ticket.format,
      studio: ticket.audi,
      order_number: ticket.orderNumber,
      booking_code: ticket.bookingCode,
      pass_key: ticket.passKey,
      price_per_seat: ticket.price,
      service_fee: ticket.serviceFee,
      payment_method: ticket.paymentMethod,
      status: "active",
      show_timestamp: ticket.timestamp,
    });

    if (!error) {
      setTickets((prev) => [ticket, ...prev]);
    } else {
      console.error("Gagal simpan tiket:", error);
    }
  };

  return (
    <TicketContext.Provider value={{ tickets, addTicket, loading }}>
      {children}
    </TicketContext.Provider>
  );
}

export function useTickets() {
  const context = useContext(TicketContext);
  if (!context) throw new Error("useTickets must be used within TicketProvider");
  return context;
}
```

> ⚠️ **Perhatian**: Kamu perlu tambah kolom `movie_title`, `movie_poster`, `theater_type` ke tabel `bookings` di SQL. Tambahkan ini ke SQL tabel sebelumnya.

**Tambahan kolom SQL:**
```sql
ALTER TABLE bookings ADD COLUMN movie_title TEXT;
ALTER TABLE bookings ADD COLUMN movie_poster TEXT;
ALTER TABLE bookings ADD COLUMN theater_type TEXT;
```

---

## 💳 LANGKAH 4: Kartu Debit Tersimpan Per Akun

### 4A. Buat Hook `useSavedCards`

Buat file baru: **`hooks/useSavedCards.ts`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface SavedCard {
  id: string;
  card_number_masked: string; // contoh: "**** **** **** 4242"
  valid_thru: string;
  card_type: "visa" | "mastercard";
}

export function useSavedCards() {
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;

    supabase
      .from("saved_cards")
      .select("*")
      .eq("user_id", userId)
      .then(({ data }) => {
        if (data) setCards(data);
      });
  }, [userId]);

  const saveCard = async (cardNumber: string, validThru: string) => {
    if (!userId) return;

    // Masking nomor kartu: hanya tampilkan 4 digit terakhir
    const masked = `**** **** **** ${cardNumber.slice(-4)}`;
    const type = cardNumber.startsWith("4") ? "visa" : "mastercard";

    const { data, error } = await supabase
      .from("saved_cards")
      .insert({
        user_id: userId,
        card_number_masked: masked,
        valid_thru: validThru,
        card_type: type,
      })
      .select()
      .single();

    if (!error && data) {
      setCards((prev) => [...prev, data]);
    }
  };

  const deleteCard = async (cardId: string) => {
    await supabase.from("saved_cards").delete().eq("id", cardId);
    setCards((prev) => prev.filter((c) => c.id !== cardId));
  };

  return { cards, saveCard, deleteCard };
}
```

### 4B. Update `BookingSystem.tsx` — Tampilkan Kartu Tersimpan

Di bagian payment method "Cards", tambahkan dropdown kartu tersimpan milik user:

```tsx
// Di dalam PaymentFlow, tambahkan:
import { useSavedCards } from "@/hooks/useSavedCards";

// Di dalam komponen:
const { cards, saveCard } = useSavedCards();

// Di JSX, sebelum form input kartu baru:
{cards.length > 0 && (
  <div className="mb-4">
    <p className="text-xs text-slate-400 mb-2">Kartu tersimpan:</p>
    {cards.map((card) => (
      <button
        key={card.id}
        className="w-full flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl mb-2 hover:border-cyan-500 transition-all"
        onClick={() => {/* Set kartu ini sebagai pilihan */}}
      >
        <span className="text-xs font-mono text-cyan-400">{card.card_number_masked}</span>
        <span className="text-xs text-slate-500">{card.valid_thru}</span>
        <span className="ml-auto text-xs font-bold text-white">{card.card_type.toUpperCase()}</span>
      </button>
    ))}
  </div>
)}
```

Lalu saat user toggle "Simpan kartu" dan klik Bayar, panggil `saveCard(cardNumber, validThru)`.

---

## 🔔 LANGKAH 5: Real-Time Notifikasi

### 5A. Update halaman Notifikasi

Di `app/notifications/page.tsx`, subscribe ke tabel `bookings` user:

```tsx
useEffect(() => {
  if (!userId) return;

  const channel = supabase
    .channel("user-bookings-notif")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "bookings",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        // Tambahkan notifikasi baru ke state
        setNotifications((prev) => [
          {
            id: payload.new.id,
            type: "booking_success",
            message: `Tiket ${payload.new.movie_title} berhasil dipesan!`,
            time: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [userId]);
```

---

## ✅ LANGKAH 6: Aktifkan Realtime di Supabase

Ini **WAJIB** dilakukan agar subscription real-time berfungsi:

1. Buka **Supabase Dashboard**
2. Klik **Database** → **Replication**
3. Di bagian **"supabase_realtime"**, klik tabel **`bookings`** dan aktifkan toggle
4. Klik **Save**

---

## 🧹 LANGKAH 7: Bersihkan localStorage Lama

Setelah semua Supabase selesai, hapus kode localStorage dari `TicketContext.tsx` (sudah diganti di langkah 3).

Juga hapus `DUMMY_TICKETS` dari `lib/data.ts` karena tidak dipakai lagi.

---

## 📋 Urutan Pengerjaan yang Disarankan

```
1. ✅ Buat tabel di Supabase SQL Editor (Langkah 1)
2. ✅ Aktifkan RLS policies (Langkah 1C)
3. ✅ Aktifkan Realtime untuk tabel bookings (Langkah 6)
4. ✅ Buat hook useRealtimeSeats (Langkah 2B)
5. ✅ Update TicketContext ke Supabase (Langkah 3)
6. ✅ Buat hook useSavedCards (Langkah 4A)
7. ✅ Update BookingSystem.tsx untuk pakai hooks baru (Langkah 2A + 4B)
8. ✅ Update Notifikasi (Langkah 5)
9. ✅ Bersihkan localStorage & dummy data (Langkah 7)
```

---

## 🧪 Cara Test Real-Time

1. Buka OceanTix di **2 tab browser berbeda** (atau 2 device)
2. Login dengan **2 akun berbeda**
3. Keduanya buka **film yang sama, jam yang sama, bioskop yang sama**
4. User A pilih kursi **B5**
5. Di tab User B, kursi **B5 harus langsung berubah jadi merah** tanpa refresh

---

## ⚠️ Catatan Penting

- **JANGAN simpan nomor kartu penuh** ke database — hanya simpan yang sudah di-mask (`**** **** **** 4242`). Untuk pembayaran nyata, gunakan Midtrans atau Stripe.
- **Supabase anon key** di `.env.local` aman untuk diexpose ke frontend karena dilindungi RLS.
- Kalau pakai `NEXT_PUBLIC_SUPABASE_ANON_KEY` yang baru, pastikan update `.env.local`.
- Setiap perubahan pada tabel (ADD COLUMN, dll) perlu di-**refresh** Next.js dev server.

---

*Dibuat untuk OceanTix V2 — Last updated: May 2026*
