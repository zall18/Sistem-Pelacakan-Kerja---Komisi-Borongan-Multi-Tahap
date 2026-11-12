"use client";

import { useEffect, useState } from "react";
import { getCashAdvances, recordCashAdvance, deleteCashAdvance } from "@/actions/cash-advance-actions";
import { getWorkersList } from "@/actions/auth-actions";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { CreditCard, Plus, Trash2, CheckCircle2, Clock, User, AlertCircle } from "lucide-react";

export default function CashAdvancePage() {
  const [advances, setAdvances] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [amount, setAmount] = useState(50000);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [adv, wrk] = await Promise.all([getCashAdvances(), getWorkersList()]);
    setAdvances(adv);
    setWorkers(wrk);
    if (wrk.length > 0 && !selectedWorkerId) {
      setSelectedWorkerId(wrk[0].id);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkerId || amount <= 0) return;

    setIsSubmitting(true);
    try {
      await recordCashAdvance({
        workerId: selectedWorkerId,
        amount: Number(amount),
        notes: notes.trim() || undefined,
      });

      setShowModal(false);
      setNotes("");
      setAmount(50000);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Gagal mencatat kasbon.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus catatan kasbon ini?")) return;
    await deleteCashAdvance(id);
    await loadData();
  };

  const activeAdvances = advances.filter((a) => !a.isSettled);
  const settledAdvances = advances.filter((a) => a.isSettled);
  const totalActive = activeAdvances.reduce((acc, a) => acc + a.amount, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-amber-600" />
            <span>Buku Kasbon & Uang Muka Teknisi (Advance Ledger)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan pinjaman/kasbon harian yang otomatis dipotongkan pada rekapitulasi gaji akhir pekan.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Kasbon Baru</span>
        </button>
      </div>

      {/* Summary card */}
      <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
            Total Kasbon Belum Terpotong (Berjalan):
          </span>
          <div className="text-2xl font-black text-amber-900 mt-1">
            {formatRupiah(totalActive)}
          </div>
          <span className="text-xs text-amber-700 mt-0.5 block">
            {activeAdvances.length} transaksi kasbon menunggu pemotongan payroll
          </span>
        </div>
      </div>

      {/* Active Advances Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" />
          <span>Daftar Kasbon Aktif (Menunggu Periode Payroll)</span>
        </h2>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Memuat data...</div>
        ) : activeAdvances.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Tidak ada kasbon aktif. Seluruh kasbon telah lunas dipotong.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Tanggal</th>
                  <th className="py-3 px-3">Nama Teknisi</th>
                  <th className="py-3 px-3">Nominal Kasbon</th>
                  <th className="py-3 px-3">Keperluan / Catatan</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeAdvances.map((adv) => (
                  <tr key={adv.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3 text-slate-500 font-medium">
                      {formatDateIndo(adv.issueDate)}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {adv.worker.fullName}
                    </td>
                    <td className="py-3 px-3 font-bold text-rose-600">
                      -{formatRupiah(adv.amount)}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {adv.notes || "-"}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleDelete(adv.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* History Settled Advances Table */}
      {settledAdvances.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Riwayat Kasbon yang Sudah Dipotong di Payroll</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-500">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Teknisi</th>
                  <th className="py-2.5 px-3">Nominal</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {settledAdvances.map((adv) => (
                  <tr key={adv.id}>
                    <td className="py-2.5 px-3">{formatDateIndo(adv.issueDate)}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-700">{adv.worker.fullName}</td>
                    <td className="py-2.5 px-3 font-semibold">{formatRupiah(adv.amount)}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Lunas Terpotong
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add Cash Advance */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900">
                Catat Pengambilan Kasbon Baru
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700"
              >
                [✕]
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Teknisi / Pekerja:
                </label>
                <select
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-hidden"
                >
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nominal Kasbon (Rupiah):
                </label>
                <input
                  type="number"
                  required
                  min={10000}
                  step={5000}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-amber-700 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keperluan / Catatan:
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Misal: Uang bensin, beli perlengkapan pribadi"
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Kasbon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

