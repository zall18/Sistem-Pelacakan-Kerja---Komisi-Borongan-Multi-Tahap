import { getKanbanOrders, updateOrderItemStatus, resolveItemRedFlag } from "@/actions/order-actions";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import { 
  Kanban, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  MessageSquare,
  RefreshCw,
  Eye
} from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function KanbanPage() {
  const items = await getKanbanOrders();

  const columns = [
    { key: "RECEIVED", label: "Menunggu Pengerjaan", color: "bg-slate-100 text-slate-700 border-slate-300" },
    { key: "IN_PROGRESS", label: "Sedang Dikerjakan", color: "bg-blue-50 text-blue-700 border-blue-200" },
    { key: "QC_PENDING", label: "Pemeriksaan QC", color: "bg-amber-50 text-amber-700 border-amber-200" },
    { key: "READY_FOR_PICKUP", label: "Siap Diambil", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { key: "COMPLETED", label: "Selesai / Diambil", color: "bg-gray-100 text-gray-500 border-gray-200" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Kanban className="w-6 h-6 text-blue-600" />
            <span>Papan Pemantauan Operasional (Kanban Pipeline)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pantau pergerakan fisik seluruh barang secara real-time dari intake hingga verifikasi QC.
          </p>
        </div>

        <Link
          href="/cashier"
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
        >
          + Tambah Pesanan Baru
        </Link>
      </div>

      {/* Kanban Board Container */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const colItems = items.filter((i) => i.currentStatus === col.key);

          return (
            <div
              key={col.key}
              className="bg-slate-100/70 border border-slate-200 rounded-2xl p-3 flex flex-col min-w-[240px] max-h-[80vh]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  {col.label}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 shadow-2xs">
                  {colItems.length}
                </span>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {colItems.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 italic">
                    Kosong
                  </div>
                ) : (
                  colItems.map((item) => {
                    const totalStages = item.service.stages.length;
                    const completedStages = item.taskLogs.length;
                    const progressPercent = Math.min(100, Math.round((completedStages / totalStages) * 100));

                    // WhatsApp link for red flag issue notification
                    const waMessage = encodeURIComponent(
                      `Halo Kak ${item.order.customerName}, kami dari workshop menginfokan pesanan ${item.order.orderNumber} (${item.service.name}): "${item.redFlagNotes}". Mohon konfirmasinya ya Kak.`
                    );
                    const waLink = `https://wa.me/${item.order.customerPhone.replace(/^0/, "62")}?text=${waMessage}`;

                    return (
                      <div
                        key={item.id}
                        className={`bg-white p-3.5 rounded-xl border shadow-xs transition hover:shadow-md flex flex-col justify-between gap-2.5 ${
                          item.hasRedFlag ? "border-red-400 ring-2 ring-red-400/20" : "border-slate-200"
                        }`}
                      >
                        {/* Top: QR & Order */}
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                              {item.itemQrCode}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {item.order.orderNumber}
                            </span>
                          </div>

                          <div className="text-xs font-bold text-slate-900 mt-1.5">
                            {item.service.name}
                          </div>

                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Plg: <b className="text-slate-700">{item.order.customerName}</b>
                          </div>

                          {item.itemNotes && (
                            <div className="text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded-md mt-1.5 line-clamp-2">
                              {item.itemNotes}
                            </div>
                          )}
                        </div>

                        {/* Red Flag Alert Box */}
                        {item.hasRedFlag && (
                          <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-[10px] text-red-700 space-y-1">
                            <div className="flex items-center gap-1 font-bold text-red-800">
                              <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
                              <span>Kendala dari Teknisi:</span>
                            </div>
                            <p className="italic">"{item.redFlagNotes}"</p>
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2 py-1 rounded transition mt-1"
                            >
                              <MessageSquare className="w-3 h-3 text-emerald-600" />
                              <span>Kirim WA ke Pelanggan</span>
                            </a>
                          </div>
                        )}

                        {/* Stage Progress Bar */}
                        <div className="pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                            <span>Progress Tahap:</span>
                            <span className="font-bold text-slate-700">
                              {completedStages}/{totalStages} ({progressPercent}%)
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 transition-all duration-300"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Action buttons based on current column */}
                        <div className="flex items-center justify-between pt-1">
                          <Link
                            href={`/cashier/orders/${item.orderId}`}
                            className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Detail</span>
                          </Link>

                          {item.currentStatus === "QC_PENDING" && (
                            <form
                              action={async () => {
                                "use server";
                                await updateOrderItemStatus(item.id, "READY_FOR_PICKUP");
                              }}
                            >
                              <button
                                type="submit"
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-md transition"
                              >
                                Lulus QC ✓
                              </button>
                            </form>
                          )}

                          {item.currentStatus === "READY_FOR_PICKUP" && (
                            <form
                              action={async () => {
                                "use server";
                                await updateOrderItemStatus(item.id, "COMPLETED");
                              }}
                            >
                              <button
                                type="submit"
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[10px] rounded-md transition"
                              >
                                Diambil Pelanggan
                              </button>
                            </form>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

