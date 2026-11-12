import { getOrderById } from "@/actions/order-actions";
import { formatRupiah, formatDateIndo } from "@/lib/utils";
import ThermalPrintButton from "@/components/thermal/ThermalPrintButton";
import { ArrowLeft, User, Phone, CheckCircle2, Clock, Tag } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/cashier/kanban"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Papan Kanban</span>
      </Link>

      {/* Order Header Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
            {order.orderNumber}
          </span>
          <h1 className="text-xl font-black text-slate-900 mt-2">
            Pesanan #{order.orderNumber}
          </h1>
          <p className="text-xs text-slate-500">
            Diterima pada {formatDateIndo(order.createdAt)}
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-500 block">Total Transaksi:</span>
          <span className="text-2xl font-black text-slate-900">
            {formatRupiah(order.totalAmount)}
          </span>
          <span className="text-[11px] font-bold text-emerald-600 block uppercase">
            {order.paymentStatus}
          </span>
        </div>
      </div>

      {/* Customer Info Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-wrap gap-6 text-xs">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400" />
          <span>
            Nama: <b className="text-slate-800">{order.customerName}</b>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-slate-400" />
          <span>
            WhatsApp: <b className="text-slate-800">{order.customerPhone}</b>
          </span>
        </div>
      </div>

      {/* Items Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
          Fisik Item Barang ({order.items.length} unit):
        </h2>

        {order.items.map((item) => {
          const completedStageIds = new Set(item.taskLogs.map((l) => l.serviceStageId));

          return (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      {item.itemQrCode}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      Status: {item.currentStatus}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {item.service.name}
                  </h3>
                  {item.itemNotes && (
                    <p className="text-xs text-slate-500 mt-1 italic">
                      Catatan: "{item.itemNotes}"
                    </p>
                  )}
                </div>

                <ThermalPrintButton
                  payload={{
                    shopName: order.tenant.name,
                    orderNumber: order.orderNumber,
                    customerName: order.customerName,
                    serviceName: item.service.name,
                    itemQrCode: item.itemQrCode,
                    itemNotes: item.itemNotes,
                    dateStr: formatDateIndo(item.createdAt),
                  }}
                />
              </div>

              {/* Stages List */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Tahapan Pengerjaan:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {item.service.stages.map((stage) => {
                    const isCompleted = completedStageIds.has(stage.id);
                    const log = item.taskLogs.find((l) => l.serviceStageId === stage.id);

                    return (
                      <div
                        key={stage.id}
                        className={`p-3 rounded-xl border text-xs ${
                          isCompleted
                            ? "bg-emerald-50/70 border-emerald-200 text-slate-700"
                            : "bg-slate-50 border-slate-200 text-slate-400"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-black">Tahap {stage.stepOrder}</span>
                          {isCompleted ? (
                            <span className="font-bold text-emerald-700">✓ Selesai</span>
                          ) : (
                            <span>Belum</span>
                          )}
                        </div>
                        <div className="font-bold text-slate-900">{stage.stageName}</div>
                        <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                          Tarif: {formatRupiah(stage.pieceRateAmount)}
                        </div>
                        {isCompleted && log && (
                          <div className="text-[10px] text-slate-500 mt-1 pt-1 border-t border-emerald-100">
                            oleh {log.worker.fullName}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

