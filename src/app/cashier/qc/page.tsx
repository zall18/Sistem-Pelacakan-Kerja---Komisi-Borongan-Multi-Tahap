import { getKanbanOrders, updateOrderItemStatus } from "@/actions/order-actions";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { ClipboardCheck, CheckCircle, MessageSquare, Clock, User, ArrowRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function QualityControlPage() {
  const allItems = await getKanbanOrders();
  const qcPendingItems = allItems.filter((i) => i.currentStatus === "QC_PENDING");
  const readyItems = allItems.filter((i) => i.currentStatus === "READY_FOR_PICKUP");

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <ClipboardCheck className="w-6 h-6 text-emerald-600" />
          <span>Meja QC & Verifikasi Pengambilan Barang</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Periksa riwayat estafet pekerjaan sebelum barang diserahkan ke pelanggan dan kirim notifikasi WhatsApp otomatis.
        </p>
      </div>

      {/* QC Pending Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span>Menunggu Verifikasi Kualitas ({qcPendingItems.length} item)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Seluruh tahapan kerja fisik telah diselesaikan oleh teknisi. Kasir memverifikasi kerapian.
            </p>
          </div>
        </div>

        {qcPendingItems.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Tidak ada item yang sedang menunggu verifikasi QC saat ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {qcPendingItems.map((item) => (
              <div
                key={item.id}
                className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-200">
                      {item.itemQrCode}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Nota: {item.order.orderNumber}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-2">
                    {item.service.name}
                  </h3>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Pelanggan: <b className="text-slate-800">{item.order.customerName}</b>
                  </div>

                  {/* Audit Trail: who did what */}
                  <div className="mt-3 pt-2 border-t border-slate-200 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Audit Trail Pengerjaan:
                    </span>
                    {item.taskLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between text-xs text-slate-600 bg-white px-2.5 py-1.5 rounded-lg border border-slate-100"
                      >
                        <div>
                          <span className="font-semibold text-slate-800 block">
                            {log.serviceStage.stageName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            oleh {log.worker.fullName} ({formatDateIndo(log.completedAt)})
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-600">
                          {formatRupiah(log.earnedRate)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500">Siap lulus QC?</span>
                  <form
                    action={async () => {
                      "use server";
                      await updateOrderItemStatus(item.id, "READY_FOR_PICKUP");
                    }}
                  >
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                    >
                      Lulus QC & Siap Diambil ✓
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ready for Pickup Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Siap Diambil oleh Pelanggan ({readyItems.length} item)</span>
            </h2>
            <p className="text-xs text-slate-500">
              Kirim notifikasi WhatsApp ke nomor pelanggan untuk mengabarkan barang siap diambil.
            </p>
          </div>
        </div>

        {readyItems.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Tidak ada item berstatus siap diambil saat ini.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {readyItems.map((item) => {
              const waText = encodeURIComponent(
                `Halo Kak ${item.order.customerName},\nBarang pesanan Anda di Sneakers Care Pro (Nota: ${item.order.orderNumber}, Item: ${item.service.name}) telah selesai diproses dan siap diambil di toko kami.\n\nTerima kasih!`
              );
              const waLink = `https://wa.me/${item.order.customerPhone.replace(/^0/, "62")}?text=${waText}`;

              return (
                <div key={item.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {item.itemQrCode}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {item.service.name}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Pelanggan: <b className="text-slate-800">{item.order.customerName}</b> ({item.order.customerPhone})
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs rounded-xl border border-emerald-200 transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Kirim Notifikasi WA</span>
                    </a>

                    <form
                      action={async () => {
                        "use server";
                        await updateOrderItemStatus(item.id, "COMPLETED");
                      }}
                    >
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
                      >
                        Selesai Diambil ✓
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

