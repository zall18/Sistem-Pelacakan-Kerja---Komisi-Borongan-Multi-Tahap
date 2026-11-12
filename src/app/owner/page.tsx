import prisma from "@/lib/prisma";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { 
  BarChart3, 
  DollarSign, 
  Users, 
  Package, 
  TrendingUp, 
  CreditCard, 
  Sliders,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OwnerDashboardPage() {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) return <div>Tenant tidak ditemukan.</div>;

  // 1. Total Pendapatan Kotor Transaksi
  const orders = await prisma.order.findMany({
    where: { tenantId: tenant.id },
  });
  const totalRevenue = orders.reduce((acc, o) => acc + o.totalAmount, 0);

  // 2. Total Kewajiban Komisi Borongan (TaskLogs yang telah dikerjakan teknisi)
  const taskLogs = await prisma.taskLog.findMany({
    include: { worker: true },
  });
  const totalCommissions = taskLogs.reduce((acc, t) => acc + t.earnedRate, 0);

  // 3. Margin Kasar Workshop
  const grossMargin = totalRevenue - totalCommissions;
  const marginPercent = totalRevenue > 0 ? Math.round((grossMargin / totalRevenue) * 100) : 0;

  // 4. Kasbon Belum Terpotong
  const unsettledAdvances = await prisma.cashAdvance.findMany({
    where: { tenantId: tenant.id, isSettled: false },
  });
  const totalUnsettledAdvances = unsettledAdvances.reduce((acc, a) => acc + a.amount, 0);

  // 5. Item aktif di workshop
  const activeItemsCount = await prisma.orderItem.count({
    where: {
      order: { tenantId: tenant.id },
      currentStatus: { not: "COMPLETED" },
    },
  });

  // 6. Kinerja per Pekerja
  const workers = await prisma.user.findMany({
    where: { tenantId: tenant.id, role: "WORKER" },
    include: {
      taskLogs: true,
      cashAdvances: { where: { isSettled: false } },
    },
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            <span>Dasbor Eksekutif Pemilik Usaha (Owner)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ringkasan margin laba kotor, total beban komisi borongan teknisi, dan pemantauan kasbon berjalan.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/owner/payroll"
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Tutup Buku Payroll</span>
          </Link>
          <Link
            href="/owner/services"
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Kelola Layanan</span>
          </Link>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Omzet Nota</span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900">
              {formatRupiah(totalRevenue)}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              dari {orders.length} transaksi nota
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Beban Komisi Borongan</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-emerald-600">
              {formatRupiah(totalCommissions)}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              {taskLogs.length} tahapan tuntas dikerjakan
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Estimasi Margin Bersih</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-purple-700">
              {formatRupiah(grossMargin)}
            </div>
            <span className="text-[11px] font-bold text-purple-600 mt-0.5 block">
              {marginPercent}% margin operasional
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Kasbon Aktif</span>
            <CreditCard className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-amber-600">
              {formatRupiah(totalUnsettledAdvances)}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Akan dipotong saat payroll
            </span>
          </div>
        </div>
      </div>

      {/* Workers Performance Breakdown Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-black text-slate-900">
              Rekapitulasi Kinerja Teknisi Borongan
            </h2>
            <p className="text-xs text-slate-500">
              Akumulasi upah komisi yang telah dikunci secara otomatis via scan kamera.
            </p>
          </div>
          <Link
            href="/owner/payroll"
            className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
          >
            <span>Rincian Payroll</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Nama Teknisi</th>
                <th className="py-3 px-3">Total Pekerjaan</th>
                <th className="py-3 px-3">Total Hak Komisi</th>
                <th className="py-3 px-3">Kasbon Berjalan</th>
                <th className="py-3 px-3 text-right">Estimasi Gaji Bersih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {workers.map((w) => {
                const totalEarned = w.taskLogs.reduce((acc, t) => acc + t.earnedRate, 0);
                const totalAdvance = w.cashAdvances.reduce((acc, a) => acc + a.amount, 0);
                const netPay = Math.max(0, totalEarned - totalAdvance);

                return (
                  <tr key={w.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {w.fullName}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {w.taskLogs.length} tahapan
                    </td>
                    <td className="py-3 px-3 font-semibold text-emerald-600">
                      {formatRupiah(totalEarned)}
                    </td>
                    <td className="py-3 px-3 text-amber-600">
                      {totalAdvance > 0 ? `-${formatRupiah(totalAdvance)}` : "Rp0"}
                    </td>
                    <td className="py-3 px-3 font-black text-slate-900 text-right">
                      {formatRupiah(netPay)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

