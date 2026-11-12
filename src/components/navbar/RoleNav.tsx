"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  QrCode, 
  Store, 
  BarChart3, 
  Sliders, 
  CreditCard, 
  Kanban,
  ClipboardCheck,
  RotateCcw
} from "lucide-react";

export default function RoleNav() {
  const pathname = usePathname();

  const isOwner = pathname.startsWith("/owner");
  const isCashier = pathname.startsWith("/cashier");
  const isWorker = pathname.startsWith("/worker");

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-md group-hover:bg-blue-700 transition">
                ⚡
              </div>
              <div>
                <span className="font-bold text-slate-900 text-base leading-tight block">
                  TrackBorongan
                </span>
                <span className="text-xs text-slate-500 font-medium block">
                  Multi-Tahap & Komisi
                </span>
              </div>
            </Link>
          </div>

          {/* Role Hub Switcher */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/worker"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                isWorker
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Teknisi (Scan)</span>
            </Link>

            <Link
              href="/cashier"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                isCashier
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Kasir (Intake)</span>
            </Link>

            <Link
              href="/owner"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                isOwner
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Owner</span>
            </Link>
          </nav>
        </div>

        {/* Sub-nav for Owner & Cashier */}
        {isOwner && (
          <div className="flex items-center gap-2 py-2 border-t border-slate-100 overflow-x-auto text-xs font-medium text-slate-600">
            <Link
              href="/owner"
              className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
                pathname === "/owner" ? "bg-slate-100 text-slate-900 font-bold" : "hover:text-slate-900"
              }`}
            >
              Ringkasan Eksekutif
            </Link>
            <Link
              href="/owner/payroll"
              className={`px-3 py-1.5 rounded-md whitespace-nowrap flex items-center gap-1 ${
                pathname === "/owner/payroll" ? "bg-slate-100 text-slate-900 font-bold" : "hover:text-slate-900"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Payroll & Slip Gaji
            </Link>
            <Link
              href="/owner/cash-advance"
              className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
                pathname === "/owner/cash-advance" ? "bg-slate-100 text-slate-900 font-bold" : "hover:text-slate-900"
              }`}
            >
              Buku Kasbon
            </Link>
            <Link
              href="/owner/services"
              className={`px-3 py-1.5 rounded-md whitespace-nowrap flex items-center gap-1 ${
                pathname === "/owner/services" ? "bg-slate-100 text-slate-900 font-bold" : "hover:text-slate-900"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Master Layanan & Tarif
            </Link>
          </div>
        )}

        {isCashier && (
          <div className="flex items-center gap-2 py-2 border-t border-slate-100 overflow-x-auto text-xs font-medium text-slate-600">
            <Link
              href="/cashier"
              className={`px-3 py-1.5 rounded-md whitespace-nowrap ${
                pathname === "/cashier" ? "bg-blue-50 text-blue-700 font-bold" : "hover:text-slate-900"
              }`}
            >
              Formulir Intake Baru
            </Link>
            <Link
              href="/cashier/kanban"
              className={`px-3 py-1.5 rounded-md whitespace-nowrap flex items-center gap-1 ${
                pathname === "/cashier/kanban" ? "bg-blue-50 text-blue-700 font-bold" : "hover:text-slate-900"
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              Kanban Pipeline
            </Link>
            <Link
              href="/cashier/qc"
              className={`px-3 py-1.5 rounded-md whitespace-nowrap flex items-center gap-1 ${
                pathname === "/cashier/qc" ? "bg-blue-50 text-blue-700 font-bold" : "hover:text-slate-900"
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              Meja QC & Pengambilan
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

