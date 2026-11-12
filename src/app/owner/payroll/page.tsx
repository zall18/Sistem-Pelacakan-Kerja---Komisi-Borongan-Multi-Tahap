"use client";

import { useEffect, useState } from "react";
import { getActivePayrollSummary, closePayrollPeriod, getPayrollRuns } from "@/actions/payroll-actions";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { 
  CreditCard, 
  Calendar, 
  MessageSquare, 
  FileDown, 
  CheckCircle, 
  AlertCircle, 
  CheckCheck,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function PayrollPage() {
  const [summaries, setSummaries] = useState<any[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedWorkerId, setExpandedWorkerId] = useState<string | null>(null);

  // Date range (Default: Senin minggu ini s/d hari ini)
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
    return monday.toISOString().split("T")[0];
  });

  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [isClosing, setIsClosing] = useState(false);
  const [closeSuccess, setCloseSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59`);
    const [data, runs] = await Promise.all([
      getActivePayrollSummary(start, end),
      getPayrollRuns(),
    ]);
    setSummaries(data);
    setPayrollRuns(runs);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const totalGross = summaries.reduce((acc, s) => acc + s.grossAmount, 0);
  const totalAdvances = summaries.reduce((acc, s) => acc + s.advanceAmount, 0);
  const totalNet = summaries.reduce((acc, s) => acc + s.netAmount, 0);

  const handleClosePayroll = async () => {
    if (!confirm("Tutup buku periode payroll ini? Seluruh pekerjaan dan kasbon akan dikunci sebagai lunas.")) {
      return;
    }

    setIsClosing(true);
    setCloseSuccess(null);

    try {
      const start = new Date(`${startDate}T00:00:00`);
      const end = new Date(`${endDate}T23:59:59`);

      // Mock user ID for Owner
      const run = await closePayrollPeriod({
        periodStart: start,
        periodEnd: end,
        closedByUserId: "owner-system",
      });

      setCloseSuccess(`Periode berhasil ditutup! Total pencairan: ${formatRupiah(run.totalNetPayout)}`);
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal menutup buku payroll.");
    } finally {
      setIsClosing(false);
    }
  };

  const handleExportPdf = (summary: any) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(16);
    doc.text("SLIP GAJI KOMISI BORONGAN", 14, 20);
    doc.setFontSize(10);
    doc.text("Sneakers & Leather Care Pro", 14, 26);
    doc.text(`Periode: ${startDate} s/d ${endDate}`, 14, 32);

    // Worker Info
    doc.text(`Nama Teknisi: ${summary.workerName}`, 14, 42);
    doc.text(`Total Pengerjaan: ${summary.taskCount} item/tahap`, 14, 48);

    // Itemized table
    const tableData = summary.taskLogs.map((l: any, idx: number) => [
      idx + 1,
      l.orderNumber,
      l.itemQrCode,
      l.stageName,
      formatRupiah(l.earnedRate),
    ]);

    autoTable(doc, {
      startY: 54,
      head: [["#", "No. Nota", "Item QR", "Tahapan Selesai", "Upah Borongan"]],
      body: tableData,
    });

    // Summary Box
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Total Upah Kotor : ${formatRupiah(summary.grossAmount)}`, 14, finalY);
    doc.text(`Potongan Kasbon  : -${formatRupiah(summary.advanceAmount)}`, 14, finalY + 6);
    doc.setFontSize(12);
    doc.text(`TOTAL GAJI BERSIH: ${formatRupiah(summary.netAmount)}`, 14, finalY + 14);

    doc.save(`Slip_Gaji_${summary.workerName.replace(/\s+/g, "_")}.pdf`);
  };

  const generateWhatsAppLink = (summary: any) => {
    let text = `*SLIP GAJI BORONGAN MINGGUAN*\n`;
    text += `Workshop: Sneakers Care Pro\n`;
    text += `Pekerja: ${summary.workerName}\n`;
    text += `Periode: ${startDate} s/d ${endDate}\n`;
    text += `------------------------------------\n`;
    text += `Total Pekerjaan: ${summary.taskCount} tahapan\n`;
    text += `Total Upah Kotor: ${formatRupiah(summary.grossAmount)}\n`;
    if (summary.advanceAmount > 0) {
      text += `Potongan Kasbon: -${formatRupiah(summary.advanceAmount)}\n`;
    }
    text += `------------------------------------\n`;
    text += `*TOTAL GAJI DITERIMA: ${formatRupiah(summary.netAmount)}*\n\n`;
    text += `Terima kasih atas kerja keras dan kedisiplinannya minggu ini!`;

    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-600" />
            <span>Buku Besar Penggajian Mingguan (Payroll Ledger)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Rekonsiliasi otomatis hak komisi borongan dikurangi kasbon berjalan tanpa sengketa akhir pekan.
          </p>
        </div>

        <button
          onClick={handleClosePayroll}
          disabled={isClosing || summaries.every((s) => s.taskCount === 0 && s.advanceAmount === 0)}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-40 text-white font-extrabold text-xs rounded-xl shadow-md transition"
        >
          <CheckCheck className="w-4 h-4" />
          <span>{isClosing ? "Mengunci Buku..." : "TUTUP BUKU & KUNCI PERIODE"}</span>
        </button>
      </div>

      {closeSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in zoom-in-95">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{closeSuccess}</span>
        </div>
      )}

      {/* Date Filter & Aggregated Metrics */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Rentang Periode Penggajian:</span>
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
            />
            <span className="text-xs text-slate-400">s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
            />
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Status: <b className="text-emerald-700">Periode Aktif (Berjalan)</b>
          </span>
        </div>

        {/* 3 Summary Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 block">Total Hak Komisi Kotor</span>
            <div className="text-xl font-black text-slate-900 mt-1">
              {formatRupiah(totalGross)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
            <span className="text-xs font-semibold text-amber-700 block">Total Pemotongan Kasbon</span>
            <div className="text-xl font-black text-amber-900 mt-1">
              -{formatRupiah(totalAdvances)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300">
            <span className="text-xs font-semibold text-emerald-700 block">Total Pencairan Gaji Bersih</span>
            <div className="text-xl font-black text-emerald-900 mt-1">
              {formatRupiah(totalNet)}
            </div>
          </div>
        </div>
      </div>

      {/* Workers Payroll Breakdown */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          Daftar Rekapitulasi Gaji per Teknisi
        </h2>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Memuat kalkulasi...</div>
        ) : summaries.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Tidak ada teknisi aktif terdaftar.
          </div>
        ) : (
          <div className="space-y-3">
            {summaries.map((s) => {
              const isExpanded = expandedWorkerId === s.workerId;

              return (
                <div
                  key={s.workerId}
                  className="border border-slate-200 rounded-2xl overflow-hidden transition"
                >
                  {/* Summary Bar */}
                  <div className="p-4 bg-slate-50/70 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setExpandedWorkerId(isExpanded ? null : s.workerId)}
                        className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {s.workerName}
                        </h3>
                        <span className="text-xs text-slate-500">
                          {s.taskCount} tahapan kerja selesai
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Kotor</span>
                        <span className="font-semibold text-slate-700">{formatRupiah(s.grossAmount)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Kasbon</span>
                        <span className="font-semibold text-amber-600">-{formatRupiah(s.advanceAmount)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Gaji Bersih</span>
                        <span className="font-black text-emerald-700 text-sm">{formatRupiah(s.netAmount)}</span>
                      </div>

                      {/* Action buttons: WhatsApp & PDF */}
                      <div className="flex items-center gap-1.5 ml-2">
                        <a
                          href={generateWhatsAppLink(s)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg border border-emerald-200 transition"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Kirim WA</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => handleExportPdf(s)}
                          disabled={s.taskCount === 0}
                          className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs rounded-lg transition"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          <span>Slip PDF</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Itemized Detail */}
                  {isExpanded && (
                    <div className="p-4 bg-white border-t border-slate-200 space-y-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                        Rincian Pekerjaan yang Telah Diselesaikan:
                      </span>

                      {s.taskLogs.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Belum ada pengerjaan dalam rentang tanggal ini.</p>
                      ) : (
                        <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                          {s.taskLogs.map((log: any) => (
                            <div key={log.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                              <div>
                                <span className="font-bold text-slate-800">{log.stageName}</span>
                                <span className="text-slate-400 text-[11px] block">
                                  Nota: {log.orderNumber} ({log.itemQrCode}) • {formatDateIndo(log.completedAt)}
                                </span>
                              </div>
                              <span className="font-bold text-emerald-600">{formatRupiah(log.earnedRate)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {s.advances.length > 0 && (
                        <div className="pt-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 block mb-1">
                            Rincian Kasbon yang Dipotong:
                          </span>
                          <div className="divide-y divide-amber-100 bg-amber-50/50 border border-amber-200 rounded-xl overflow-hidden">
                            {s.advances.map((adv: any) => (
                              <div key={adv.id} className="p-2.5 flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-medium text-amber-900">{adv.notes || "Kasbon"}</span>
                                  <span className="text-[10px] text-amber-700 block">{formatDateIndo(adv.issueDate)}</span>
                                </div>
                                <span className="font-bold text-amber-900">-{formatRupiah(adv.amount)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Historical Closed Payroll Runs */}
      {payrollRuns.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            Riwayat Periode Payroll yang Telah Ditutup Buku
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Tanggal Tutup</th>
                  <th className="py-2.5 px-3">Rentang Periode</th>
                  <th className="py-2.5 px-3">Total Upah Kotor</th>
                  <th className="py-2.5 px-3">Total Kasbon</th>
                  <th className="py-2.5 px-3 text-right">Total Bersih Dicairkan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payrollRuns.map((run) => (
                  <tr key={run.id}>
                    <td className="py-2.5 px-3 text-slate-500 font-medium">
                      {formatDateIndo(run.createdAt)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {new Date(run.periodStart).toLocaleDateString("id-ID")} - {new Date(run.periodEnd).toLocaleDateString("id-ID")}
                    </td>
                    <td className="py-2.5 px-3">{formatRupiah(run.totalGross)}</td>
                    <td className="py-2.5 px-3 text-amber-600">-{formatRupiah(run.totalAdvances)}</td>
                    <td className="py-2.5 px-3 font-black text-emerald-700 text-right">
                      {formatRupiah(run.totalNetPayout)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

