import Link from "next/link";
import { QrCode, Store, BarChart3, CheckCircle2, ShieldCheck, Zap, ArrowRight } from "lucide-react";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const tenant = await prisma.tenant.findFirst({
    include: {
      services: true,
      users: true,
      orders: { include: { items: true } },
    },
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white flex flex-col justify-between p-4 sm:p-8">
      <div className="max-w-4xl mx-auto w-full pt-6 sm:pt-12">
        {/* Header Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-400 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span>Versi MVP 1.0 • Ready for Production & Pilot Testing</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-2xl mx-auto leading-tight">
            Pelacakan Kerja & Komisi Borongan Multi-Tahap
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            Sistem tiket QR fisik & scanner kamera mobile untuk UMKM cuci sepatu, konveksi, dan bengkel. Kunci hak komisi real-time, cegah klaim ganda, dan otomatiskan rekap gaji mingguan.
          </p>
        </div>

        {/* Business Tenant Info */}
        {tenant && (
          <div className="mt-8 p-4 bg-slate-800/60 border border-slate-700 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Workshop Aktif:</span>
              <span className="font-bold text-white text-sm">{tenant.name}</span>
            </div>
            <div className="flex gap-4 text-slate-300">
              <div>Layanan: <b className="text-white">{tenant.services.length}</b></div>
              <div>Pekerja: <b className="text-white">{tenant.users.filter(u => u.role === 'WORKER').length}</b></div>
              <div>Pesanan: <b className="text-white">{tenant.orders.length}</b></div>
            </div>
          </div>
        )}

        {/* 3 Main Role Portals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {/* 1. Worker Mobile Scanner */}
          <Link
            href="/worker"
            className="group relative p-6 bg-slate-800 hover:bg-slate-750 border-2 border-emerald-500/40 hover:border-emerald-500 rounded-2xl transition shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                <QrCode className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Pekerja Lapangan (PWA Mobile)
              </span>
              <h3 className="text-lg font-bold text-white mt-1">
                Kamera Pemindai & Saldo
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Akses kamera HP instan, tombol sentuh besar (minimal 56px), validasi alur urut, dan tampilan saldo komisi real-time.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition">
              <span>Buka Scanner Kamera</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* 2. Cashier Intake Desk */}
          <Link
            href="/cashier"
            className="group relative p-6 bg-slate-800 hover:bg-slate-750 border-2 border-blue-500/40 hover:border-blue-500 rounded-2xl transition shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                <Store className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Meja Kasir & Front Desk
              </span>
              <h3 className="text-lg font-bold text-white mt-1">
                Intake & Tiket Thermal QR
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Penerimaan barang cepat, catatan kerusakan awal, cetak stiker label QR Bluetooth (58mm/80mm), dan Kanban monitoring.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-blue-400 group-hover:translate-x-1 transition">
              <span>Buka Meja Kasir</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* 3. Owner Dashboard */}
          <Link
            href="/owner"
            className="group relative p-6 bg-slate-800 hover:bg-slate-750 border-2 border-purple-500/40 hover:border-purple-500 rounded-2xl transition shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                <BarChart3 className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                Pemilik Usaha (Owner)
              </span>
              <h3 className="text-lg font-bold text-white mt-1">
                Executive & Payroll Ledger
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Tutup buku mingguan sekali klik, pemotongan kasbon akurat, ekspor slip gaji PDF, dan kirim rincian via WhatsApp.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-purple-400 group-hover:translate-x-1 transition">
              <span>Buka Dasbor Owner</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>

        {/* Quick Demo Test Tokens */}
        <div className="mt-8 p-4 bg-slate-800/40 border border-slate-700/60 rounded-2xl text-xs text-slate-400">
          <div className="font-bold text-slate-200 mb-1 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Kode QR Contoh untuk Uji Coba Lapangan:</span>
          </div>
          <p className="mb-2">
            Anda dapat langsung mengetikkan kode token berikut di antarmuka teknisi atau mencetak tiketnya dari menu Kasir:
          </p>
          <div className="flex flex-wrap gap-2 font-mono font-bold text-emerald-400">
            <span className="bg-slate-900 px-2.5 py-1 rounded-md border border-slate-700">TRX-2611-0001-1</span>
            <span className="bg-slate-900 px-2.5 py-1 rounded-md border border-slate-700">TRX-2611-0001-2</span>
            <span className="bg-slate-900 px-2.5 py-1 rounded-md border border-slate-700">TRX-2611-0002-1</span>
          </div>
        </div>
      </div>

      <footer className="mt-8 pt-4 border-t border-slate-800 text-center text-xs text-slate-500">
        Sistem Pelacakan Kerja & Komisi Borongan Multi-Tahap • Dibuat sesuai spesifikasi PRD v1.0-MVP
      </footer>
    </main>
  );
}

