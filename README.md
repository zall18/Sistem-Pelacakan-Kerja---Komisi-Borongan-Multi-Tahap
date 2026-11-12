# Sistem Pelacakan Kerja & Komisi Borongan Multi-Tahap (v1.0-MVP)

Aplikasi operasional *mobile-first* untuk UMKM jasa dan manufaktur mikro berbasis upah borongan (*piece-rate pay*), seperti cuci sepatu/tas, konveksi rumahan, servis elektronik/bengkel, dan laundry satuan.

Sistem ini menghubungkan kasir front-desk, teknisi lapangan, dan pemilik usaha (owner) melalui tiket stiker QR fisik berantai, mengunci hak komisi secara real-time via kamera HP, dan mengotomatiskan rekapitulasi slip gaji mingguan tanpa sengketa.

---

## 🚀 Fitur Unggulan

1. **Antarmuka Pemindai Teknisi (Worker Scanner PWA):**
   * Akses kamera instan tanpa install aplikasi toko native (berjalan langsung di Safari iOS & Chrome Android).
   * **Zero-Typing UI:** Tombol sentuh raksasa ($\ge 56\text{ px}$) untuk teknisi bertangan basah/sabun.
   * **Audio & Haptic Feedback:** Suara sintetis Web Audio API (*success beep* 880Hz & *error buzz* 220Hz) dan getaran haptik tanpa ketergantungan berkas audio eksternal.
   * **Widget Saldo Transparan:** Menampilkan pendapatan hari ini dan estimasi minggu ini secara real-time.
   * **Mesin Validasi Alur Kritis:** Pencegahan loncat tahapan (*sequential dependency*) dan penolakan klaim ganda (*anti-double claim*).

2. **Meja Kasir & Intake Pesanan (Cashier Intake Desk):**
   * Navigasi input cepat (*keyboard-friendly*).
   * Cetak tiket stiker label QR fisik langsung via **Web Bluetooth API** (printer thermal 58mm & 80mm ESC/POS) atau dialog cetak browser biasa.
   * Papan monitoring fisik real-time (**Live Kanban Pipeline Board**).
   * Indikator peringatan kendala (**Red Flag Alert**) dengan tombol pintas WhatsApp ke pelanggan.

3. **Dasbor Pemilik Usaha & Payroll (Owner Ledger):**
   * **Buku Kasbon (Advance Ledger):** Pencatatan pinjaman uang muka teknisi.
   * **Tutup Buku Payroll Mingguan Sekali Klik:** Mengotomatiskan perhitungan $\text{Gaji Bersih} = \sum \text{Komisi} - \sum \text{Kasbon}$.
   * **Ekspor Slip Gaji Digital PDF:** Pembuatan berkas PDF rincian kerja via `jspdf`.
   * **Kirim Rincian via WhatsApp:** Deep link terformat rapi berisi rincian pekerjaan dan nominal gaji bersih.
   * **Konfigurasi Master Layanan & Tahapan:** Bebas menambah alur tahapan berantai dan nominal komisi per tahap.

---

## 🛠️ Tech Stack

* **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS v4, Lucide React
* **Kamera & QR:** `html5-qrcode`
* **Thermal Printer:** Web Bluetooth API + Binary ESC/POS Encoder (58mm/80mm)
* **Basis Data:** SQLite (Default zero-config untuk dev & testing lokal) / PostgreSQL (Supabase / Neon) via Prisma ORM
* **Audio & Feedback:** Web Audio API Synth & Vibration API

---

## 🏁 Panduan Menjalankan Aplikasi

### 1. Jalankan Server Development
```bash
pnpm dev
```
Buka peramban pada [http://localhost:3000](http://localhost:3000).

### 2. Akun Demo & Profil Pengujian (Telah Di-seed)

* **Owner Dashboard:** Akses menu `/owner`
  * Email: `owner@demo.com` | PIN: `1234` | Password: `password123`
* **Kasir Desk:** Akses menu `/cashier`
  * Email: `cashier@demo.com` | PIN: `2222` | Password: `password123`
* **Teknisi Lapangan:** Akses menu `/worker`
  * Profil 1: **Agus Cuci** (PIN: `1111`)
  * Profil 2: **Bambang Repaint** (PIN: `3333`)
  * Profil 3: **Doni Finishing & QC** (PIN: `4444`)

### 3. Contoh Kode QR Siap Uji Coba Lapangan
Anda dapat mengarahkan kamera HP atau mengetikkan kode token berikut pada antarmuka pemindai teknisi:
* `TRX-2611-0001-1` (Sepatu Nike - Layanan Deep Clean, sedang tahap Unyellowing)
* `TRX-2611-0001-2` (Sepatu Adidas - Layanan Repaint, baru diterima di kasir)
* `TRX-2611-0002-1` (Sepatu Vans - Semua tahap selesai, sedang di meja QC)

---

## 🔄 Migrasi ke Supabase / PostgreSQL (Tahap Akhir)

Untuk menghubungkan ke database cloud Supabase di akhir pengujian:
1. Ganti `provider = "postgresql"` pada [prisma/schema.prisma](file:///d:/Sistem%20Pelacakan%20Kerja%20&%20Komisi%20Borongan%20Multi-Tahap/prisma/schema.prisma).
2. Perbarui `DATABASE_URL` di [.env](file:///d:/Sistem%20Pelacakan%20Kerja%20&%20Komisi%20Borongan%20Multi-Tahap/.env):
   ```env
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?sslmode=require"
   ```
3. Jalankan sinkronisasi skema:
   ```bash
   pnpm exec prisma db push
   pnpm exec tsx prisma/seed.ts
   ```

