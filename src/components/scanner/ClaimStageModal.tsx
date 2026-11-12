"use client";

import { useState } from "react";
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  X, 
  Check, 
  AlertCircle, 
  Camera, 
  Flag,
  Sparkles
} from "lucide-react";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { claimStageTask } from "@/actions/worker-actions";
import { reportItemRedFlag } from "@/actions/order-actions";
import { sound } from "@/lib/sound";
import { triggerHaptic } from "@/lib/haptic";

interface Stage {
  id: string;
  stageName: string;
  stepOrder: number;
  pieceRateAmount: number;
  estimatedMinutes: number;
  isPhotoRequired: boolean;
}

interface TaskLog {
  id: string;
  serviceStageId: string;
  worker: { fullName: string };
  completedAt: Date;
  earnedRate: number;
}

interface OrderItemData {
  id: string;
  itemQrCode: string;
  itemNotes: string | null;
  currentStatus: string;
  hasRedFlag: boolean;
  redFlagNotes: string | null;
  order: {
    orderNumber: string;
    customerName: string;
    customerPhone: string;
  };
  service: {
    name: string;
    stages: Stage[];
  };
  taskLogs: TaskLog[];
}

interface ClaimStageModalProps {
  itemData: OrderItemData;
  workerId: string;
  workerName: string;
  onClose: () => void;
  onTaskClaimed: (result: {
    earnedRate: number;
    stageName: string;
    todayEarnings: number;
    weeklyEarnings: number;
  }) => void;
}

export default function ClaimStageModal({
  itemData,
  workerId,
  workerName,
  onClose,
  onTaskClaimed,
}: ClaimStageModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [showRedFlagInput, setShowRedFlagInput] = useState(false);
  const [redFlagNote, setRedFlagNote] = useState("");

  const completedStageIds = new Set(itemData.taskLogs.map((l) => l.serviceStageId));

  const handleClaim = async (stage: Stage) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await claimStageTask({
        itemQrCode: itemData.itemQrCode,
        serviceStageId: stage.id,
        workerId: workerId,
      });

      if (!res.success) {
        sound.playError();
        triggerHaptic("error");
        setErrorMessage(res.message);
        setIsSubmitting(false);
        return;
      }

      sound.playSuccess();
      triggerHaptic("success");
      setSuccessInfo(`Hebat! ${stage.stageName} selesai. +${formatRupiah(stage.pieceRateAmount)}`);

      if (res.workerStats && res.earnedRate) {
        onTaskClaimed({
          earnedRate: res.earnedRate,
          stageName: stage.stageName,
          todayEarnings: res.workerStats.todayEarnings,
          weeklyEarnings: res.workerStats.weeklyEarnings,
        });
      }

      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (e: unknown) {
      sound.playError();
      triggerHaptic("error");
      setErrorMessage(e instanceof Error ? e.message : "Terjadi kesalahan.");
      setIsSubmitting(false);
    }
  };

  const handleReportRedFlag = async () => {
    if (!redFlagNote.trim()) return;
    setIsSubmitting(true);
    await reportItemRedFlag(itemData.id, redFlagNote.trim());
    sound.playSuccess();
    triggerHaptic("success");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        {/* Header Drawer */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {itemData.itemQrCode}
              </span>
              <span className="text-xs text-slate-400">
                Nota: {itemData.order.orderNumber}
              </span>
            </div>
            <h2 className="text-base font-bold text-white mt-1">
              {itemData.service.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Notes or Red Flag Banner */}
          {itemData.hasRedFlag && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Peringatan Kendala:</span>
                {itemData.redFlagNotes}
              </div>
            </div>
          )}

          {itemData.itemNotes && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
              <span className="font-bold block text-amber-700 mb-0.5">Catatan Fisik Barang:</span>
              {itemData.itemNotes}
            </div>
          )}

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-2 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {successInfo && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-800 animate-in zoom-in-95">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>{successInfo}</div>
            </div>
          )}

          {/* Stage Sequence Claim Buttons */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Tahapan Pengerjaan Borongan:
              </span>
              <span className="text-xs text-slate-400">
                Pekerja: <b className="text-slate-800">{workerName}</b>
              </span>
            </div>

            <div className="space-y-2.5">
              {itemData.service.stages.map((stage) => {
                const isCompleted = completedStageIds.has(stage.id);
                const taskLog = itemData.taskLogs.find((l) => l.serviceStageId === stage.id);

                // Periksa apakah tahap sebelumnya sudah tuntas
                const isPreviousCompleted =
                  stage.stepOrder === 1 ||
                  itemData.service.stages
                    .filter((s) => s.stepOrder < stage.stepOrder)
                    .every((s) => completedStageIds.has(s.id));

                const canClaim = !isCompleted && isPreviousCompleted;

                return (
                  <div
                    key={stage.id}
                    className={`p-3.5 rounded-2xl border-2 transition-all ${
                      isCompleted
                        ? "bg-emerald-50/70 border-emerald-200 text-slate-600"
                        : canClaim
                        ? "bg-white border-blue-500 shadow-md ring-2 ring-blue-500/20"
                        : "bg-slate-50 border-slate-200 opacity-60 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                            isCompleted
                              ? "bg-emerald-500 text-white"
                              : canClaim
                              ? "bg-blue-600 text-white"
                              : "bg-slate-200 text-slate-500"
                          }`}
                        >
                          {isCompleted ? <Check className="w-4 h-4" /> : stage.stepOrder}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 leading-snug">
                            {stage.stageName}
                          </div>
                          <div className="text-xs font-semibold text-emerald-600">
                            Upah: {formatRupiah(stage.pieceRateAmount)}
                          </div>
                        </div>
                      </div>

                      {/* Log / Status details */}
                      {isCompleted && taskLog && (
                        <div className="text-right text-[11px] text-slate-500">
                          <span className="text-emerald-700 font-bold block">✓ Selesai</span>
                          <span>oleh {taskLog.worker.fullName}</span>
                        </div>
                      )}
                    </div>

                    {/* Action button if ready for claim */}
                    {canClaim && (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => handleClaim(stage)}
                          disabled={isSubmitting}
                          className="w-full btn-touch-worker bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-extrabold text-sm sm:text-base rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition transform active:scale-98"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          <span>
                            {isSubmitting
                              ? "Menyimpan Klaim..."
                              : `KLAIM & SELESAIKAN (${formatRupiah(stage.pieceRateAmount)})`}
                          </span>
                        </button>
                      </div>
                    )}

                    {/* Warning if previous stage not completed */}
                    {!isCompleted && !isPreviousCompleted && (
                      <div className="mt-2 text-[11px] text-amber-600 flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Menunggu tahap sebelumnya selesai</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Red flag reporting option */}
          <div className="pt-2 border-t border-slate-100">
            {!showRedFlagInput ? (
              <button
                type="button"
                onClick={() => setShowRedFlagInput(true)}
                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1.5 transition"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Ada kendala pada bahan barang? Laporkan ke Kasir</span>
              </button>
            ) : (
              <div className="space-y-2 bg-red-50/70 p-3 rounded-xl border border-red-200">
                <label className="text-xs font-bold text-red-800 block">
                  Deskripsi Kendala (Misal: Sol getas, cat luntur):
                </label>
                <textarea
                  value={redFlagNote}
                  onChange={(e) => setRedFlagNote(e.target.value)}
                  placeholder="Tulis kendala yang ditemukan saat pengerjaan..."
                  rows={2}
                  className="w-full p-2 bg-white border border-red-300 rounded-lg text-xs text-slate-800 focus:outline-hidden"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowRedFlagInput(false)}
                    className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-md"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleReportRedFlag}
                    disabled={isSubmitting || !redFlagNote.trim()}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-md"
                  >
                    Kirim Kendala
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

