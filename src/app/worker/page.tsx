"use client";

import { useState, useEffect, useCallback } from "react";
import QrScanner from "@/components/scanner/QrScanner";
import ClaimStageModal from "@/components/scanner/ClaimStageModal";
import { getWorkersList } from "@/actions/auth-actions";
import { getWorkerStats } from "@/actions/worker-actions";
import { getOrderItemByQr } from "@/actions/order-actions";
import { formatRupiah } from "@/lib/utils";
import { sound } from "@/lib/sound";
import { triggerHaptic } from "@/lib/haptic";
import { UserCheck, Sparkles, AlertCircle, RefreshCw } from "lucide-react";

interface Worker {
  id: string;
  fullName: string;
  role: string;
}

export default function WorkerScannerPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [activeWorker, setActiveWorker] = useState<Worker | null>(null);
  const [stats, setStats] = useState({
    todayEarnings: 0,
    weeklyEarnings: 0,
    todayTasksCount: 0,
  });
  const [scannedItemData, setScannedItemData] = useState<any | null>(null);
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Load list of workers
  useEffect(() => {
    async function loadInitial() {
      const list = await getWorkersList();
      setWorkers(list);
      if (list.length > 0) {
        // Default to first worker (Agus) or stored in localStorage
        const savedId = localStorage.getItem("active_worker_id");
        const found = list.find((w) => w.id === savedId) || list[0];
        setActiveWorker(found);
      }
    }
    loadInitial();
  }, []);

  // Load stats whenever active worker changes
  const refreshStats = useCallback(async () => {
    if (!activeWorker) return;
    const s = await getWorkerStats(activeWorker.id);
    setStats(s);
  }, [activeWorker]);

  useEffect(() => {
    if (activeWorker) {
      localStorage.setItem("active_worker_id", activeWorker.id);
      refreshStats();
    }
  }, [activeWorker, refreshStats]);

  const handleWorkerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = workers.find((w) => w.id === e.target.value);
    if (selected) {
      setActiveWorker(selected);
      sound.playSuccess();
      triggerHaptic("tap");
    }
  };

  const handleScanSuccess = async (qrToken: string) => {
    if (isProcessingScan || scannedItemData) return;
    setIsProcessingScan(true);
    setErrorBanner(null);

    try {
      const item = await getOrderItemByQr(qrToken);
      if (!item) {
        sound.playError();
        triggerHaptic("error");
        setErrorBanner(`Kode QR "${qrToken}" tidak terdaftar dalam sistem.`);
        setIsProcessingScan(false);
        return;
      }

      setScannedItemData(item);
    } catch (err: unknown) {
      sound.playError();
      triggerHaptic("error");
      setErrorBanner("Gagal memuat detail item barang.");
    } finally {
      setIsProcessingScan(false);
    }
  };

  const handleTaskClaimed = (result: {
    earnedRate: number;
    stageName: string;
    todayEarnings: number;
    weeklyEarnings: number;
  }) => {
    setStats((prev) => ({
      todayEarnings: result.todayEarnings,
      weeklyEarnings: result.weeklyEarnings,
      todayTasksCount: prev.todayTasksCount + 1,
    }));
    setFeedbackBanner(`+${formatRupiah(result.earnedRate)} (${result.stageName})`);
    setTimeout(() => setFeedbackBanner(null), 4000);
  };

  return (
    <div className="space-y-4">
      {/* Worker Selector Bar */}
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Pekerja Aktif:
            </span>
            <span className="text-xs font-bold text-white">
              {activeWorker?.fullName || "Memuat..."}
            </span>
          </div>
        </div>

        <select
          value={activeWorker?.id || ""}
          onChange={handleWorkerChange}
          className="bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-hidden"
        >
          {workers.map((w) => (
            <option key={w.id} value={w.id}>
              {w.fullName}
            </option>
          ))}
        </select>
      </div>

      {/* Transparent Earnings Widget (PRD Section 5.3) */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-gradient-to-br from-emerald-950/70 to-slate-900 border border-emerald-500/30 p-3.5 rounded-2xl relative overflow-hidden">
          <span className="text-[11px] font-semibold text-emerald-400 block">
            Pendapatan Hari Ini
          </span>
          <div className="text-xl font-black text-white mt-0.5 tracking-tight">
            {formatRupiah(stats.todayEarnings)}
          </div>
          <span className="text-[10px] text-emerald-300/80 font-medium mt-1 block">
            {stats.todayTasksCount} pengerjaan selesai
          </span>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
          <span className="text-[11px] font-semibold text-slate-400 block">
            Estimasi Minggu Ini
          </span>
          <div className="text-xl font-black text-white mt-0.5 tracking-tight">
            {formatRupiah(stats.weeklyEarnings)}
          </div>
          <span className="text-[10px] text-slate-500 font-medium mt-1 block">
            Sebelum potongan kasbon
          </span>
        </div>
      </div>

      {/* Feedback Alert Banners */}
      {feedbackBanner && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center justify-between animate-in zoom-in-95">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Klaim sukses: {feedbackBanner}</span>
          </div>
          <span className="text-[10px] uppercase bg-emerald-500 text-black px-1.5 py-0.5 rounded font-black">
            Terkunci
          </span>
        </div>
      )}

      {errorBanner && (
        <div className="p-3 bg-rose-500/20 border border-rose-400/40 rounded-xl text-rose-300 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorBanner}</span>
        </div>
      )}

      {/* Camera Viewfinder */}
      <QrScanner
        onScanSuccess={handleScanSuccess}
        isScanning={!scannedItemData}
      />

      {/* Action Drawer Modal */}
      {scannedItemData && activeWorker && (
        <ClaimStageModal
          itemData={scannedItemData}
          workerId={activeWorker.id}
          workerName={activeWorker.fullName}
          onClose={() => setScannedItemData(null)}
          onTaskClaimed={handleTaskClaimed}
        />
      )}
    </div>
  );
}

