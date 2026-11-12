# Product Requirements Document (PRD)
## Sistem Pelacakan Kerja & Komisi Borongan Multi-Tahap (Piece-Rate Worker & Commission Tracker)

* **Versi:** 1.0.0-MVP
* **Status:** Siap Ditinjau (Ready for Engineering)
* **Target Segmen:** UMKM Jasa & Manufaktur Mikro Berbasis Borongan (Cuci Sepatu/Tas, Konveksi Rumahan, Servis Elektronik/Bengkel, Laundry Satuan)

---

## 1. Ringkasan Eksekutif & Latar Belakang

### 1.1 Konteks Industri
Banyak UMKM jasa dan manufaktur mikro di Indonesia menerapkan skema upah borongan (*piece-rate pay*) atau bagi hasil per item. Dalam operasional sehari-hari, satu item pesanan pelanggan tidak dikerjakan oleh satu orang dari awal hingga akhir, melainkan dikerjakan secara estafet (*multi-stage processing*). 

Contoh alur pengerjaan pada jasa cuci sepatu:
1. **Tahap 1:** *Deep Cleaning* (Tarif: Rp8.000) $\rightarrow$ Dikerjakan oleh Pekerja A
2. **Tahap 2:** *Unyellowing / Repaint* (Tarif: Rp25.000) $\rightarrow$ Dikerjakan oleh Pekerja B
3. **Tahap 3:** *Finishing, QC & Packing* (Tarif: Rp2.000) $\rightarrow$ Dikerjakan oleh Pekerja C

### 1.2 Masalah Nyata & Root Pain
* **Pencatatan Terfragmentasi:** Kasir hanya mencatat total transaksi uang pelanggan di nota/kasir. Siapa yang mencuci, siapa yang mengecat, dan siapa yang membungkus tidak tercatat di sistem terpusat.
* **Sengketa Akhir Pekan:** Pekerja mencatat sendiri daftar pekerjaan di buku saku pribadi. Saat hari gajian (biasanya Sabtu/Minggu), pemilik usaha harus mencocokkan nota kasir dengan catatan 5–15 pekerja secara manual. Sering terjadi selisih hitung, klaim ganda (*double claim*), atau kecurigaan manipulasi.
* **Hilangnya Akuntabilitas Kualitas (Zero Traceability):** Ketika pelanggan komplain bahwa sol sepatunya terlepas atau bahan kainnya robek, pemilik usaha tidak bisa menelusuri siapa teknisi yang bertanggung jawab pada tahapan tersebut.
* **Kasbon yang Tidak Terkoordinasi:** Pekerja sering meminta uang muka/kasbon harian secara lisan atau via chat WhatsApp, yang kerap lupa dipotong saat rekapitulasi gaji mingguan.

### 1.3 Visi Produk
Membangun web app operasional *mobile-first* yang menghubungkan kasir, pekerja lapangan, dan pemilik usaha melalui sistem tiket QR fisik. Setiap tahapan pekerjaan diklaim dan diselesaikan melalui pemindaian kamera HP secara instan, mengunci hak komisi secara *real-time*, dan mengotomatiskan rekapitulasi slip gaji borongan mingguan tanpa sengketa.

---

## 2. Target Persona & Peran Pengguna

| Peran (Role) | Karakteristik & Kebutuhan Utama | Akses Perangkat |
| :--- | :--- | :--- |
| **Owner (Pemilik Usaha)** | Ingin tahu margin bersih per layanan, total beban komisi berjalan, memotong kasbon secara akurat, dan menyelesaikan rekap gaji mingguan dalam < 10 menit. | Desktop / Laptop / Tablet |
| **Kasir / Front Desk** | Menerima barang pelanggan, mencatat kondisi awal (foto fisik), mencetak tiket nota ber-QR code, dan menerima pelunasan. | Desktop PC / Tablet / Smartphone |
| **Pekerja / Teknisi (Field Worker)** | Tidak mau ribet mengetik. Butuh antarmuka scan kamera yang cepat, tombol sentuh besar, serta transparansi saldo komisi yang diperoleh hari ini. | Smartphone Pribadi (PWA Mobile) |

---

## 3. Product Scope & Success Metrics

### 3.1 MVP In-Scope
* **Konfigurasi Alur Layanan:** Pembuatan master layanan dengan tahapan pengerjaan kustom beserta nominal komisi per tahap.
* **Intake Pesanan & Cetak QR Ticket:** Pembuatan tiket pesanan dengan QR Code unik per item barang (termasuk cetak via printer thermal Bluetooth atau printer thermal USB).
* **Worker Web Scanner:** Antarmuka web ramah ponsel untuk pekerja memindai QR, mengklaim pengerjaan tahapan, dan mengunggah foto bukti kerja (opsional).
* **Live Pipeline Board (Kanban):** Papan monitoring status item berjalan (Menunggu Pengerjaan $\rightarrow$ Tahap 1 $\rightarrow$ Tahap 2 $\rightarrow$ Selesai QC $\rightarrow$ Siap Diambil).
* **Buku Besar Komisi & Kasbon:** Pencatatan otomatis saldo komisi pekerja, pencatatan pinjaman/kasbon, dan pembuatan slip upah mingguan sekali klik.
* **Audit Trail & Traceability:** Riwayat lengkap siapa yang mengerjakan tahapan apa, jam berapa, dan durasi pengerjaannya.

### 3.2 Out-of-Scope (Fase Lanjutan)
* Integrasi otomatis ke rekening bank untuk *payroll batch disbursement* (misal: API BCA/Midtrans Iris).
* Perhitungan pajak penghasilan PPh 21 tenaga lepas otomatis.
* Fitur absensi berbasis GPS/geofencing.

### 3.3 Metrik Keberhasilan (KPI)
* **Efisiensi Waktu Payroll:** Waktu rekapitulasi gaji mingguan berkurang dari 3–5 jam menjadi kurang dari 15 menit.
* **Zero Double Claim:** 0% kasus klaim ganda atas satu pekerjaan yang sama antar pekerja.
* **Kecepatan Input Kerja:** Pekerja dapat menyelesaikan pelaporan satu tahapan pekerjaan dalam waktu $< 8$ detik menggunakan kamera smartphone.

---

## 4. Tech Stack & Arsitektur Sistem

```
+--------------------------------------------------------------------------+
|                               FRONTEND                                   |
|   Next.js 15 (App Router, React 19) + Tailwind CSS + Shadcn UI           |
|   PWA (Progressive Web App) + HTML5-QRCode Scanner + Web Bluetooth API   |
+--------------------------------------------------------------------------+
                                    |
                                    | HTTPS / REST / Server Actions
                                    v
+--------------------------------------------------------------------------+
|                                BACKEND                                   |
|   Next.js Server Actions & Route Handlers + Zod Validation               |
|   Role-Based Access Control (RBAC: Owner, Cashier, Worker)               |
+--------------------------------------------------------------------------+
                                    |
                 +------------------+------------------+
                 |                                     |
                 v                                     v
+----------------------------------+ +-------------------------------------+
|        DATABASE (PostgreSQL)     | |             STORAGE                 |
|   Supabase / Neon DB             | |   Cloudflare R2 / Supabase Storage  |
|   Prisma ORM                     | |   (Foto kondisi awal & hasil kerja) |
+----------------------------------+ +-------------------------------------+
```

* **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS, Lucide React, Shadcn/UI.
* **Mobile Scanner Engine:** `@zxing/library` atau `html5-qrcode` (berjalan langsung pada peramban mobile Safari/Chrome tanpa memerlukan instalasi native app store).
* **Integrasi Thermal Printer:** Web Bluetooth API & format ESC/POS mentah untuk mencetak tiket stiker/label langsung dari peramban mobile/desktop.
* **Backend:** Next.js Server Actions dengan validasi ketat menggunakan Zod.
* **Basis Data:** PostgreSQL (Supabase / Neon) diakses menggunakan Prisma ORM.
* **Otentikasi:** NextAuth.js (Auth.js) atau Supabase Auth dengan PIN 4-digit cepat untuk login pekerja di perangkat bersama.
* **Penyimpanan Berkas:** Cloudflare R2 / Supabase Storage (kompresi gambar otomatis di sisi klien sebelum diunggah).

---

## 5. Spesifikasi Rinci Modul & Fitur

### 5.1 Modul Master Layanan & Konfigurasi Tahapan (Service Stages)
* **Manajemen Kategori & Layanan:**
  * Admin dapat membuat master layanan (Contoh: "Deep Clean Sepatu Kanvas", "Repaint Midsole", "Jahit Kemeja Formal").
* **Multi-Stage Workflow Configuration:**
  * Setiap layanan dapat dipecah menjadi beberapa tahapan berurutan (*sequential*) atau independen.
  * Setiap tahapan memiliki atribut:
    * `Nama Tahap` (misal: Cuci Atas, Gosok Sol, Pewarnaan, QC).
    * `Tarif Komisi Standar` (Rupiah flat, misal: Rp10.000).
    * `Waktu Estimasi (SLA)` dalam jam/menit.
    * `Wajib Foto` (Boolean: Ya/Tidak).

### 5.2 Modul Order Intake & Tiket QR Fisik
* **Formulir Penerimaan Barang:**
  * Input Nama & WhatsApp Pelanggan.
  * Pilihan Layanan per item barang (mendukung multi-item dalam satu nota).
  * Catatan kondisi khusus (misal: "Kain robek 1 cm di sisi kanan").
  * Pengambilan foto fisik kondisi awal (maksimal 2 foto per item).
* **Penerbitan Tiket QR:**
  * Setiap unit barang mendapatkan satu `item_tracking_code` unik (misal: `TRX-2611-0042-1`).
  * Desain tiket label mini (ukuran kertas thermal 58mm atau 80mm):
    * Nama Bisnis & No. Nota
    * Nama Barang & Layanan
    * QR Code unik
    * Catatan kerusakan awal

### 5.3 Modul Antarmuka Pekerja (Worker Mobile Scanner)
* **Mode Scan Cepat (Fast Execution Mode):**
  * Pekerja membuka URL PWA di HP masing-masing, masuk menggunakan PIN 4-digit atau profil tersimpan.
  * Akses kamera terbuka langsung. Pekerja mengarahkan kamera ke label QR pada barang.
* **Logika Validasi Pengerjaan:**
  * Sistem menampilkan nama barang, layanan, dan tahapan yang tersedia.
  * **Pemeriksaan Ketergantungan (Dependency Check):** Jika Tahap 2 mensyaratkan Tahap 1 selesai, sistem menolak eksekusi dan memunculkan peringatan: *"Tahap Cuci belum diselesaikan oleh Teknisi A"*.
  * Jika valid, pekerja menekan tombol **"Klaim & Selesaikan Tahapan"**.
  * Sistem langsung mencatat waktu, ID pekerja, dan menambahkan saldo nominal komisi ke akun pekerja yang bersangkutan.
* **Widget Saldo Transparan:**
  * Pada bagian atas layar pekerja, terdapat ringkasan:
    * *Pendapatan Hari Ini:* Rp85.000 (dari 7 pengerjaan).
    * *Estimasi Komisi Minggu Ini:* Rp420.000.

### 5.4 Modul Kanban Pipeline & Pelacakan Kualitas (Traceability)
* **Papan Monitoring Operasional:**
  * Kolom status real-time: `Menunggu Pengerjaan` $\rightarrow$ `Sedang Dikerjakan` $\rightarrow$ `Tahap Tertentu Selesai` $\rightarrow$ `Pengecekan Kualitas (QC)` $\rightarrow$ `Selesai / Siap Diambil`.
* **Penanganan Masalah / Red Flag:**
  * Jika pekerja menemukan kecacatan bahan saat pengerjaan, mereka dapat menekan opsi *"Tandai Kendala"*, yang memunculkan notifikasi merah di dasbor kasir agar kasir segera menghubungi pelanggan via WhatsApp.
* **Riwayat Pengerjaan (Quality Audit Log):**
  * Jika pelanggan mengajukan komplain, kasir cukup memindai QR nota untuk melihat:
    * Tahap 1 dikerjakan oleh: Rudi (Pukul 10:14)
    * Tahap 2 dikerjakan oleh: Budi (Pukul 13:30)
    * QC disetujui oleh: Kasir Maya (Pukul 15:00)

### 5.5 Modul Rekapitulasi Gaji Borongan & Kasbon (Payroll Ledger)
* **Buku Kasbon (Advance Payment):**
  * Catatan pencairan pinjaman/kasbon pekerja yang disetujui Owner dengan tanggal dan nominal.
* **Penutupan Periode Penggajian (Payroll Cut-off):**
  * Owner memilih rentang tanggal penggajian (misal: Senin – Sabtu).
  * Sistem otomatis menghitung:
    $$\text{Total Gaji Bersih} = \sum (\text{Tarif Komisi per Item Terverifikasi}) - \sum (\text{Kasbon Periode Berjalan})$$
* **Ekspor & Pembagian Slip Gaji:**
  * Mengeluarkan slip gaji digital format PDF per pekerja.
  * Tombol **"Kirim Ringkasan via WhatsApp"** yang membuka pesan WhatsApp terformat berisi rincian item pekerjaan yang dikerjakan beserta total upah bersih yang diterima.

---

## 6. Desain UX/UI & Alur Pengguna

### 6.1 Alur Pengguna (User Flow)

```
[Konsumen Datang] 
       │
       ▼
[Kasir Intake] ──> Input Layanan & Kondisi ──> Cetak Stiker QR & Tempel pada Barang
                                                          │
       ┌──────────────────────────────────────────────────┘
       ▼
[Pekerja A (Tahap Cuci)] ──> Scan QR via HP ──> Klik Selesai ──> Saldo Komisi A Bertambah
                                                          │
       ┌──────────────────────────────────────────────────┘
       ▼
[Pekerja B (Tahap Cat)]  ──> Scan QR via HP ──> Klik Selesai ──> Saldo Komisi B Bertambah
                                                          │
       ┌──────────────────────────────────────────────────┘
       ▼
[Kasir / QC Check]       ──> Scan Verifikasi Akhir ──> Notifikasi WA Pelanggan: "Barang Siap"
       │
       ▼
[Hari Gajian Mingguan]   ──> Owner Buka Tab Payroll ──> Klik "Tutup Buku" ──> Cetak Slip & Transfer
```

### 6.2 Prinsip Desain UI
* **Zero Typing for Workers:** Pekerja di lapangan memiliki tangan yang mungkin basah, terkena sabun, atau debu. Seluruh antarmuka pekerja harus berbasis sentuhan tunggal (*one-tap action*), tombol berukuran besar (minimal tinggi $56\text{ px}$), dan palet warna kontras tinggi.
* **Audio Feedback:** Terdengar suara "Beep" sukses saat pemindaian QR berhasil, dan suara getaran/peringatan jika terjadi galat (misal: item sudah selesai atau mendahului tahapan).
* **Tampilan Kasir Cepat:** Formulir kasir dirancang dengan navigasi *keyboard-friendly* (Tab, Enter) agar penerimaan pesanan tidak menyebabkan antrean di meja kasir.

---

## 7. Skema Basis Data (Data Model & Schema)

### 7.1 Entity Relationship Diagram (ASCII Diagram)

```
+-------------------+             +-----------------------+
|      tenants      |             |         users         |
+-------------------+             +-----------------------+
| id (PK)           |<-----+      | id (PK)               |
| name              |      |      | tenant_id (FK)        |
| phone             |      +----->| full_name             |
| address           |      |      | role (OWNER/CASH/WRK) |
+-------------------+      |      | pin_code_hash         |
                           |      +-----------------------+
                           |                  |
+-------------------+      |                  |
|     services      |      |                  |
+-------------------+      |                  |
| id (PK)           |      |                  |
| tenant_id (FK)    |<-----+                  |
| service_name      |                         |
| base_price        |                         |
+-------------------+                         |
          |                                   |
          v                                   |
+-----------------------+                     |
|    service_stages     |                     |
+-----------------------+                     |
| id (PK)               |                     |
| service_id (FK)       |                     |
| stage_name            |                     |
| step_order (1, 2..)   |                     |
| piece_rate_amount     |                     |
+-----------------------+                     |
          |                                   |
          |                                   |
          v                                   v
+-------------------+       +--------------------+       +------------------------+
|      orders       |       |    order_items     |       |       task_logs        |
+-------------------+       +--------------------+       +------------------------+
| id (PK)           |       | id (PK)            |       | id (PK)                |
| tenant_id (FK)    |       | order_id (FK)      |<------| order_item_id (FK)     |
| order_number (UQ) |<------| service_id (FK)    |       | service_stage_id (FK)  |
| customer_name     |       | item_qr_code (UQ)  |       | worker_id (FK) --------+
| customer_phone    |       | item_notes         |       | earned_rate            |
| payment_status    |       | current_status     |       | photo_proof_url        |
| created_at        |       +--------------------+       | completed_at           |
+-------------------+                                    +------------------------+
                                                                     |
                                                                     v
                                                         +------------------------+
                                                         |    cash_advances       |
                                                         +------------------------+
                                                         | id (PK)                |
                                                         | tenant_id (FK)         |
                                                         | worker_id (FK)         |
                                                         | amount                 |
                                                         | notes                  |
                                                         | deduction_status       |
                                                         +------------------------+
```

### 7.2 Definisi Tabel Utama (Data Dictionary)

#### A. Tabel `services` & `service_stages`
* `services`: Menyimpan katalog menu jasa (id, tenant_id, service_name, base_price, created_at).
* `service_stages`: Menyimpan tahapan kerja berantai per layanan.
  * `id`: UUID (Primary Key)
  * `service_id`: UUID (Foreign Key $\rightarrow$ `services.id`)
  * `stage_name`: VARCHAR(100) — misal: "Soling & Gluing"
  * `step_order`: INT — urutan tahapan (1, 2, 3...)
  * `piece_rate_amount`: DECIMAL(12, 2) — nominal upah borongan untuk tahap ini

#### B. Tabel `orders` & `order_items`
* `orders`: Induk transaksi pelanggan (id, tenant_id, order_number, customer_name, customer_phone, total_amount, payment_status, created_at).
* `order_items`: Entitas fisik per unit barang yang diberi stiker tiket QR.
  * `id`: UUID (Primary Key)
  * `order_id`: UUID (Foreign Key $\rightarrow$ `orders.id`)
  * `service_id`: UUID (Foreign Key $\rightarrow$ `services.id`)
  * `item_qr_code`: VARCHAR(50) (Unique) — token yang di-generate untuk QR code
  * `current_status`: ENUM (`RECEIVED`, `IN_PROGRESS`, `QC_PENDING`, `READY_FOR_PICKUP`, `COMPLETED`)

#### C. Tabel `task_logs` (Jantung Perhitungan Borongan)
Setiap kali ada pekerja yang memindai QR dan menyelesaikan tahapan, satu baris data dicatat di tabel ini:
* `id`: UUID (Primary Key)
* `order_item_id`: UUID (Foreign Key $\rightarrow$ `order_items.id`)
* `service_stage_id`: UUID (Foreign Key $\rightarrow$ `service_stages.id`)
* `worker_id`: UUID (Foreign Key $\rightarrow$ `users.id`)
* `earned_rate`: DECIMAL(12, 2) — dicatat snapshot nominalnya saat itu agar kebal terhadap perubahan harga master
* `photo_proof_url`: VARCHAR(255) (Nullable)
* `completed_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

#### D. Tabel `cash_advances` (Buku Kasbon)
* `id`: UUID (Primary Key)
* `tenant_id`: UUID (Foreign Key $\rightarrow$ `tenants.id`)
* `worker_id`: UUID (Foreign Key $\rightarrow$ `users.id`)
* `amount`: DECIMAL(12, 2)
* `issue_date`: DATE
* `is_settled`: BOOLEAN DEFAULT FALSE
* `payroll_run_id`: UUID (Nullable, diisi saat kasbon telah dipotongkan pada gaji periode tertentu)

---

## 8. Logika Bisnis & Edge Cases Kritis

| Skenario Edge Case | Potensi Masalah | Solusi Sistem (Business Logic) |
| :--- | :--- | :--- |
| **Pekerja memindai QR yang sama dua kali** | Pengerjaan tercatat ganda, saldo upah terhitung dua kali. | Diterapkan **Unique Constraint** kombinasi pada `(order_item_id, service_stage_id)`. Sistem mengembalikan galat HTTP 409: *"Tahapan ini sudah selesai dikerjakan sebelumnya"*. |
| **Pekerja melompati urutan tahapan** | Pengecatan dilakukan sebelum pencucian selesai. | Sistem memvalidasi tabel `task_logs`. Jika `step_order` saat ini adalah $N$, maka `step_order` $N-1$ harus sudah tercatat di sistem untuk item tersebut. |
| **Koneksi internet workshop tidak stabil** | Pekerja gagal scan saat berada di area pencucian berair. | PWA mengimplementasikan antrean offline (*Background Sync*) dengan *IndexedDB*. Log scan tersimpan lokal di peramban dan otomatis di-push saat koneksi pulih. |
| **Perubahan tarif komisi di tengah jalan** | Tarif master diubah saat barang sedang berada di lini produksi. | Nilai upah yang tersimpan di `task_logs.earned_rate` mengunci nominal (*immutable snapshot*) pada detik pengerjaan diselesaikan. Perubahan harga master hanya berlaku untuk pengerjaan baru. |

---

## 9. Rencana Implementasi & Roadmap

```
Minggu 1-2: Setup Fondasi & Master Service Workflow
Minggu 3-4: Modul Intake Kasir & Print Tiket QR
Minggu 5-6: Antarmuka PWA Mobile Scanner Teknisi
Minggu 7-8: Modul Payroll, Kasbon & Uji Lapangan Pilot
```

### Fase 1: Fondasi & Manajemen Alur Kerja (Minggu 1–2)
* Setup monorepo/proyek Next.js 15, konfigurasi Prisma ORM dan PostgreSQL.
* Implementasi sistem autentikasi multi-tenant dan manajemen peran (Owner, Cashier, Worker).
* Pembuatan modul CRUD Master Layanan & pengaturan dinamis tahapan komisi (*Service Stages*).

### Fase 2: Intake Kasir & Generator Tiket QR (Minggu 3–4)
* Pembuatan formulir intake kasir dengan upload foto kerusakan awal.
* Integrasi pencetakan tiket via Web Bluetooth/ESC-POS untuk printer thermal mini.
* Pembuatan halaman detail pesanan pelanggan.

### Fase 3: Worker Scanner PWA & Pipeline Monitoring (Minggu 5–6)
* Pembuatan antarmuka pemindai kamera responsif menggunakan PWA mobile.
* Implementasi mesin validasi alur kerja (pencegahan loncat tahap dan klaim ganda).
* Pembuatan Kanban Board real-time untuk memantau status fisik seluruh barang.

### Fase 4: Penggajian Mingguan, Kasbon & Uji Lapangan (Minggu 7–8)
* Pembuatan modul pencatatan kasbon dan rekonsiliasi otomatis saat penutupan buku mingguan.
* Fitur ekspor slip gaji digital PDF dan pengiriman ringkasan ke nomor WhatsApp pekerja.
* Uji coba lapangan (*pilot testing*) pada 2 mitra UMKM (1 workshop cuci sepatu dan 1 konveksi sablon).
* Perbaikan bug, peningkatan kecepatan scanning kamera, dan rilis versi v1.0-MVP.