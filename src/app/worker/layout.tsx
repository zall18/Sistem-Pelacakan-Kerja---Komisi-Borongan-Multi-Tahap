import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";

export default function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-black">
      {/* Top Bar for Worker */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition"
            title="Kembali ke Beranda"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Pemindai Teknisi</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </h1>
          </div>
        </div>

        <Link
          href="/worker/history"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-400 transition"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Riwayat Kerja</span>
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center px-4 py-4 max-w-md mx-auto w-full">
        {children}
      </main>

      {/* Bottom info */}
      <footer className="py-2 text-center text-[11px] text-slate-600 border-t border-slate-900">
        Sentuh tombol untuk menyelesaikan • Hak komisi terkunci otomatis
      </footer>
    </div>
  );
}

