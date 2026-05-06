# 🎬 OceanTix v2

**OceanTix** adalah aplikasi web pemesanan tiket bioskop berbasis mobile-first yang dibangun dengan **Next.js**, **React**, dan **Supabase**. Pengguna dapat menelusuri film yang sedang tayang dan akan datang, memilih kota, melihat jadwal per bioskop, menonton trailer, dan memesan tiket — semua dari antarmuka bertema gelap yang elegan.

---

## ✨ Fitur yang Sudah Ada (Done)

| Fitur | Status |
|---|---|
| Home page dengan hero, Now Playing & Coming Soon | ✅ Selesai |
| Animated ocean-wave background (CSS pure) | ✅ Selesai |
| Auto-scrolling promo banner | ✅ Selesai |
| Background hero dari trailer YouTube | ✅ Selesai |
| Location picker modal (pilih kota) | ✅ Selesai |
| Movie detail page (hero, trailer, schedule, detail tab) | ✅ Selesai |
| Date picker & showtime selector di tab Jadwal | ✅ Selesai |
| Filter bioskop (brand, format, sort) | ✅ Selesai |
| Seat selection UI (SeatSelection component) | ✅ Selesai |
| Payment flow dengan QRIS & Card | ✅ Selesai |
| Ticket success screen (tampilan tiket setelah bayar) | ✅ Selesai |
| Halaman `/tickets` (Tiket Aktif & Daftar Transaksi) | ✅ Selesai |
| Halaman `/tickets/[id]` (detail tiket dengan QR) | ✅ Selesai |
| Halaman `/cinemas` (daftar bioskop per kota) | ✅ Selesai |
| Bottom navigation bar | ✅ Selesai |
| Supabase Auth (login, register, forgot password) | ✅ Selesai |
| Persistent session & `onAuthStateChange` | ✅ Selesai |
| LocalStorage persistence untuk tiket | ✅ Selesai |
| Responsive design (mobile-first) | ✅ Selesai |

---

## ❌ Halaman / Fitur yang Masih BELUM Ada

### 1. 🧑 Halaman Profile (`/profile`)
**Status:** Halaman ini **belum dibuat sama sekali**.

BottomNav sudah punya link ke `/profile` tapi halamannya tidak ada. Kalau pengguna klik **Profile** di bottom nav, mereka akan mendapat error 404.

**Yang harus ada di halaman profile:**
- Tampilkan info user yang sedang login (email, nama, foto profil)
- Tombol Logout
- Riwayat pemesanan singkat (bisa redirect ke `/tickets`)
- Edit profil (nama, nomor HP)
- Preferensi notifikasi

---

### 2. 🔔 Halaman Notifikasi (`/notifications`)
**Status:** Halaman ini **belum dibuat**.

Ada beberapa tombol bell (🔔) di navbar yang linknya mengarah ke `window.location.href = "/notifications"` tapi halamannya kosong / 404.

**Yang harus ada:**
- Daftar notifikasi (pengingat film, promo, konfirmasi pembayaran)
- Mark as read
- Filter: Semua / Belum Dibaca

---

### 3. 🏪 Halaman Detail Bioskop (`/cinemas/[id]`)
**Status:** Link sudah ada di halaman `/cinemas`, tapi halaman detailnya **belum dibuat**.

Di `cinemas/page.tsx` setiap bioskop sudah di-link ke `/cinemas/${theater.id}` tapi folder/file `app/cinemas/[id]/page.tsx` **tidak ada**. Pengguna akan 404 kalau klik bioskop manapun.

**Yang harus ada:**
- Info bioskop (nama, tipe, lokasi di peta, fasilitas)
- Daftar film yang sedang tayang di bioskop tersebut
- Jadwal per film
- Tombol "Beli Tiket" langsung dari halaman ini

---

### 4. 🔍 Fitur Search yang Berfungsi
**Status:** Ada search bar di homepage dan di `/cinemas`, tapi **tidak melakukan apa-apa**.

Search bar di home (`Cari film atau bioskop`) tidak punya `onChange` handler — input hanya tampilan saja, tidak memfilter film sama sekali. Di cinemas page, search sudah terhubung tapi hanya memfilter nama bioskop, bukan genre atau rating.

**Yang harus diperbaiki:**
- Hubungkan search bar di homepage ke filter film (berdasarkan judul, genre)
- Tambah hasil pencarian real-time dengan dropdown/suggestive search
- Atau buat halaman `/search?q=...` yang menampilkan hasil

---

### 5. 🎟️ Halaman "Lihat Semua" Film
**Status:** Tombol **"Lihat semua"** di seksi Now Playing dan Coming Soon **tidak berfungsi** — tidak ada `onClick` handler, klik tidak melakukan apa-apa.

**Yang harus ditambah:**
- Rute `/movies/now-playing` dan `/movies/coming-soon`
- Atau sebuah modal/panel yang menampilkan semua film dengan scroll

---

### 6. 💳 Integrasi Payment Gateway Nyata
**Status:** Pembayaran saat ini adalah **simulasi** (tombol "Simulasikan Pembayaran Berhasil"). Tidak ada payment gateway sungguhan.

**Yang harus diintegrasikan:**
- Midtrans / Xendit / DOKU untuk pembayaran nyata
- Redirect ke halaman pembayaran eksternal untuk QRIS
- Webhook untuk konfirmasi pembayaran

---

### 7. 🔐 Google OAuth Belum Selesai
**Status:** Ada tombol "Lanjut Google" di modal login, tapi **handler-nya belum terhubung sempurna** ke Supabase Google OAuth.

---

### 8. 🗺️ Kota Terbatas (Hanya 4 Kota)
**Status:** Data bioskop (`DUMMY_THEATERS`) hanya mencakup **4 kota** saja: Tasikmalaya, Bekasi, Tangerang Selatan, Jakarta.

Location picker di homepage menampilkan 60+ kota Indonesia, tapi kalau memilih kota lain (misal Bandung, Surabaya), halaman cinemas akan **kosong** (tidak ada bioskop ditemukan).

**Yang harus diperbaiki:**
- Tambah data bioskop untuk lebih banyak kota
- Atau sambungkan ke database Supabase dengan data bioskop real

---

### 9. 📅 Jadwal Tayang Masih Dummy
**Status:** Jadwal showtime (12:00, 14:15, 16:30, 18:45, 21:00) adalah **data statis**, sama untuk semua bioskop dan semua tanggal.

**Yang harus ditambah:**
- Data jadwal per film per bioskop per tanggal dari Supabase
- Jadwal yang berbeda-beda tiap hari
- Studio/audi yang berbeda untuk tiap jam tayang

---

### 10. ⭐ Fitur Wishlist / Simpan Film
**Status:** **Belum ada** fitur untuk menyimpan / bookmark film yang ingin ditonton.

---

## 🐛 Bug yang Harus Diperbaiki

### Bug #1: Tiket Aktif Masih Menampilkan "Sudah Tayang" di Stamp
**File:** `app/tickets/[id]/page.tsx` — Baris 116

**Masalah:** Tiket yang masih **aktif** (belum tayang) tetap menampilkan stamp "Sudah Tayang" di bagian tengah tiket (section kuning). Stamp ini harusnya hanya muncul kalau tiket sudah expired / sudah ditonton.

**Yang harus diperbaiki:**
```tsx
// Tambahkan pengecekan apakah tiket masih aktif
const isActive = ticket.timestamp ? (ticket.timestamp + ONE_DAY_MS) > Date.now() : ticket.status === "active";

// Di dalam stamp:
{isActive ? "Belum Tayang" : "Sudah Tayang"}
```

---

### Bug #2: Tombol Salin (Copy) Order Number Tidak Berfungsi
**File:** `app/tickets/[id]/page.tsx` — Baris 138-140

**Masalah:** Tombol copy di sebelah nomor order tidak punya `onClick` handler — mengkliknya tidak menyalin apapun ke clipboard.

**Yang harus diperbaiki:**
```tsx
<button
  onClick={() => navigator.clipboard.writeText(ticket.orderNumber)}
  className="text-amber-600 hover:text-amber-700 transition-colors"
>
  <Copy className="w-4 h-4" />
</button>
```

---

### Bug #3: Tombol Copy di PaymentFlow Juga Tidak Berfungsi
**File:** `components/BookingSystem.tsx` — Baris 679-681

**Masalah:** Sama seperti bug #2, tombol copy di layar sukses pembayaran tidak melakukan apa-apa.

---

### Bug #4: Notifikasi Bell Redirect ke `/notifications` yang 404
**File:** `app/tickets/page.tsx` baris 71, `app/cinemas/page.tsx` baris 51, `components/BookingSystem.tsx` baris 21

**Masalah:** Tombol bell (🔔) di semua navbar melakukan `window.location.href = "/notifications"` yang mengarah ke halaman 404 karena halaman tersebut belum dibuat.

**Solusi sementara:** Nonaktifkan klik atau tampilkan modal "Coming Soon" sampai halaman notifikasi dibuat.

---

### Bug #5: BottomNav Tidak Menunjukkan Halaman Aktif (Active State)
**File:** `components/BottomNav.tsx`

**Masalah:** Semua icon di bottom nav selalu berwarna putih, tidak ada indikator halaman mana yang sedang aktif. Pengguna tidak tahu sedang di halaman mana.

**Yang harus diperbaiki:**
```tsx
// Tambahkan usePathname() dari next/navigation
import { usePathname } from 'next/navigation';

const pathname = usePathname();
// Lalu bandingkan pathname dengan href setiap item
const isActive = pathname === href || pathname.startsWith(href + '/');
```

---

### Bug #6: Search Bar di Homepage Tidak Ada Fungsinya
**File:** `app/page.tsx` — Baris 540-543

**Masalah:** Search bar utama di hero homepage tidak memiliki `onChange` atau `value` prop — tidak terhubung ke state manapun, jadi input hilang begitu saja tanpa efek.

---

### Bug #7: Tombol "Promo" di Semua Navbar Tidak Berfungsi
**File:** Semua halaman yang punya navbar

**Masalah:** Teks "Promo" di navbar tidak punya `href` atau `onClick` handler yang valid — klik tidak melakukan apa-apa. Sama, halaman `/promo` juga belum ada.

---

### Bug #8: Location Modal di `/cinemas` Hanya Menampilkan 4 Kota
**File:** `app/cinemas/page.tsx` — Baris 145

**Masalah:** Location modal di halaman cinemas menggunakan array hardcoded 4 kota, sementara modal di homepage menggunakan `CITIES` dari `lib/data.ts` (yang juga hanya 4 kota) — inkonsisten dengan location picker di homepage yang menampilkan 60+ kota.

---

### Bug #9: Tiket di "Daftar Transaksi" Masih Statusnya "Berhasil" (Harusnya lebih informatif)
**File:** `app/tickets/page.tsx` — Baris 211

**Masalah:** Status di tiket past hanya "Berhasil" yang ambigu. Seharusnya ada status yang lebih jelas seperti "Sudah Ditonton" atau "Kedaluwarsa".

---

### Bug #10: `passKey` di Ticket Context Tidak Tersimpan dengan Benar
**File:** `components/BookingSystem.tsx` — Baris 342-344, `context/TicketContext.tsx`

**Masalah:** `passKey` di-generate ulang setiap kali `PaymentFlow` di-render. Karena menggunakan `useMemo`, ini seharusnya aman. Namun jika komponen di-unmount dan di-mount ulang (misal karena navigasi), `passKey` dan `orderId` akan berubah, meskipun tiket yang sama sudah tersimpan di localStorage.

---

### Bug #11: Halaman Tiket Tidak Ada Empty State untuk "Daftar Transaksi"
**File:** `app/tickets/page.tsx`

**Masalah:** Jika tidak ada tiket lama (past tickets), tab "Daftar Transaksi" menampilkan halaman **kosong** tanpa teks atau visual apapun. Harusnya ada empty state seperti di tab "Tiket Aktif".

---

### Bug #12: Data Tiket Dari localStorage Tidak Dibersihkan
**File:** `context/TicketContext.tsx`

**Masalah:** Tiket lama terus menumpuk di localStorage tanpa ada mekanisme pembersihan. Kalau pengguna sering booking (testing), data di localStorage bisa sangat besar. Tidak ada fungsi `deleteTicket` atau pembatasan jumlah tiket yang disimpan.

---

## 🗂️ Struktur Proyek

```
oceantix-v2/
├── app/
│   ├── page.tsx           # Home page
│   ├── MovieDetail.tsx    # Movie detail component
│   ├── layout.tsx         # Root layout
│   ├── globals.css        # Global styles
│   ├── api/
│   │   └── movies/
│   │       ├── now-playing/   # TMDB proxy
│   │       └── upcoming/      # TMDB proxy
│   ├── auth/
│   │   └── callback/          # Supabase OAuth callback
│   ├── cinemas/
│   │   └── page.tsx           # ✅ Ada
│   │   └── [id]/              # ❌ BELUM ADA — harus dibuat!
│   ├── tickets/
│   │   ├── page.tsx           # ✅ Ada
│   │   └── [id]/page.tsx      # ✅ Ada
│   ├── profile/               # ❌ BELUM ADA — harus dibuat!
│   └── notifications/         # ❌ BELUM ADA — harus dibuat!
├── components/
│   ├── BookingSystem.tsx  # SeatSelection + PaymentFlow
│   └── BottomNav.tsx      # Bottom navigation
├── context/
│   ├── LocationContext.tsx
│   └── TicketContext.tsx
├── lib/
│   ├── data.ts            # Dummy theaters, tickets, types
│   ├── supabase.ts        # Supabase client
│   └── utils.ts
├── public/
├── .env.local
└── package.json
```

---

## ⚙️ Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js (App Router) |
| UI Library | React |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Backend / Auth | Supabase (Auth + DB) |
| Movie Data | TMDB API |
| Language | TypeScript |

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+
- Supabase project
- TMDB API key

### 2. Install
```bash
npm install
```

### 3. Environment Variables
Buat `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_TMDB_API_KEY=your-tmdb-api-key
```

### 4. Jalankan Dev Server
```bash
npm run dev
```

---

## 🛣️ Roadmap / Prioritas Pengerjaan

### 🔴 Prioritas Tinggi (Harus Segera Diperbaiki)
- [ ] **Bug #1** — Fix stamp "Sudah Tayang" di tiket aktif
- [ ] **Bug #2 & #3** — Tambahkan fungsi copy ke clipboard
- [ ] **Bug #4** — Buat halaman `/notifications` atau nonaktifkan link dulu
- [ ] **Bug #5** — Tambah active state di BottomNav
- [ ] **Bug #11** — Tambah empty state di tab "Daftar Transaksi"
- [ ] **Fitur #3** — Buat halaman `/cinemas/[id]` (detail bioskop)
- [ ] **Fitur #1** — Buat halaman `/profile`

### 🟡 Prioritas Sedang
- [ ] **Bug #6** — Hubungkan search bar ke filter film
- [ ] **Bug #7** — Tambahkan halaman atau aksi untuk "Promo"
- [ ] **Fitur #5** — Buat halaman "Lihat Semua Film"
- [ ] **Fitur #8** — Tambah lebih banyak kota di data bioskop
- [ ] **Fitur #9** — Data jadwal yang berbeda per bioskop

### 🟢 Prioritas Rendah / Future
- [ ] **Fitur #6** — Integrasi payment gateway nyata (Midtrans/Xendit)
- [ ] **Fitur #7** — Selesaikan Google OAuth
- [ ] **Fitur #10** — Fitur wishlist / simpan film
- [ ] **Bug #12** — Mekanisme pembersihan data localStorage
- [ ] Sambungkan data bioskop ke Supabase DB
- [ ] Push notifications untuk pengingat film

---

## 📄 Lisensi

Private project — all rights reserved.
