"use client";

import { useEffect, useState } from "react";
import { getWorkerHistory } from "@/actions/worker-actions";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { ArrowLeft, CheckCircle2, Calendar, FileText } from "lucide-react";
import Link from "next/link";

export default function WorkerHistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const activeWorkerId = localStorage.getItem("active_worker_id");
      if (activeWorkerId) {
        const logs = await getWorkerHistory(activeWorkerId);
        setHistory(logs);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href="/worker"
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Scanner</span>
        </Link>
        <span className="text-xs text-slate-500">50 Riwayat Terakhir</span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Riwayat Pengerjaan & Komisi</span>
        </h2>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500">Memuat riwayat...</div>
        ) : history.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Belum ada pengerjaan yang tercatat untuk profil ini.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {history.map((log) => (
              <div key={log.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white">
                    {log.serviceStage.stageName}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {log.orderItem.service.name} • {log.orderItem.itemQrCode}
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDateIndo(log.completedAt)}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-emerald-400 block">
                    +{formatRupiah(log.earnedRate)}
                  </span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    Terkunci
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

