"use client";

import { useEffect, useState } from "react";
import { getServicesWithStages } from "@/actions/service-actions";
import { createOrder } from "@/actions/order-actions";
import { formatRupiah } from "@/lib/utils";
import ThermalPrintButton from "@/components/thermal/ThermalPrintButton";
import { 
  Store, 
  Plus, 
  Trash2, 
  Printer, 
  CheckCircle, 
  Smartphone, 
  User, 
  Tag, 
  ArrowRight,
  ExternalLink
} from "lucide-react";
import Link from "next/link";

interface Service {
  id: string;
  name: string;
  basePrice: number;
  stages: { id: string; stageName: string; stepOrder: number; pieceRateAmount: number }[];
}

interface OrderItemRow {
  serviceId: string;
  itemNotes: string;
}

export default function CashierIntakePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [items, setItems] = useState<OrderItemRow[]>([
    { serviceId: "", itemNotes: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any | null>(null);

  useEffect(() => {
    async function load() {
      const data = await getServicesWithStages();
      setServices(data);
      if (data.length > 0) {
        setItems([{ serviceId: data[0].id, itemNotes: "" }]);
      }
    }
    load();
  }, []);

  const handleAddItemRow = () => {
    if (services.length > 0) {
      setItems([...items, { serviceId: services[0].id, itemNotes: "" }]);
    }
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const calculateTotal = () => {
    let sum = 0;
    for (const item of items) {
      const s = services.find((srv) => srv.id === item.serviceId);
      if (s) sum += s.basePrice;
    }
    return sum;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || items.length === 0) return;

    setIsSubmitting(true);
    try {
      const order = await createOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        items: items.map((i) => ({
          serviceId: i.serviceId,
          itemNotes: i.itemNotes.trim() || undefined,
        })),
      });

      setCreatedOrder(order);
      // Reset form
      setCustomerName("");
      setCustomerPhone("");
      if (services.length > 0) {
        setItems([{ serviceId: services[0].id, itemNotes: "" }]);
      }
    } catch (err) {
      console.error(err);
      alert("Gagal membuat pesanan. Silakan periksa koneksi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Store className="w-6 h-6 text-blue-600" />
            <span>Formulir Penerimaan Barang (Intake Kasir)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Input pelanggan, pilih layanan, dan cetak tiket label stiker ber-QR code untuk ditempel ke fisik barang.
          </p>
        </div>

        <Link
          href="/cashier/kanban"
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition"
        >
          <span>Buka Papan Kanban</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Success Notification & Print Tickets Modal/Card */}
      {createdOrder && (
        <div className="p-6 bg-emerald-50 border-2 border-emerald-300 rounded-3xl shadow-lg space-y-4 animate-in zoom-in-95">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Pesanan Berhasil Diterima! Nomor Nota: {createdOrder.orderNumber}
                </h3>
                <p className="text-xs text-slate-600">
                  Pelanggan: {createdOrder.customerName} ({createdOrder.customerPhone}) • Total: {formatRupiah(createdOrder.totalAmount)}
                </p>
              </div>
            </div>
            <button
              onClick={() => setCreatedOrder(null)}
              className="text-xs font-bold text-slate-400 hover:text-slate-700"
            >
              Tutup [✕]
            </button>
          </div>

          <div className="pt-2 border-t border-emerald-200">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block mb-3">
              Cetak Tiket QR untuk Ditempel pada Fisik Barang:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {createdOrder.items.map((item: any) => (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {item.itemQrCode}
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-600">
                        Siap Tempel
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-2">
                      {item.service?.name}
                    </div>
                    {item.itemNotes && (
                      <div className="text-xs text-slate-500 mt-1 italic">
                        "{item.itemNotes}"
                      </div>
                    )}
                  </div>

                  <ThermalPrintButton
                    payload={{
                      shopName: "Sneakers Care Pro",
                      orderNumber: createdOrder.orderNumber,
                      customerName: createdOrder.customerName,
                      serviceName: item.service?.name || "Layanan",
                      itemQrCode: item.itemQrCode,
                      itemNotes: item.itemNotes,
                      dateStr: new Date().toLocaleDateString("id-ID"),
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
        {/* Customer Information */}
        <div>
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <User className="w-4 h-4 text-blue-600" />
            <span>1. Data Pelanggan</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Lengkap Pelanggan:
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Misal: Rian Hidayat"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:bg-white focus:border-blue-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor WhatsApp (Untuk Notifikasi Pengambilan):
              </label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Misal: 081234567890"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:bg-white focus:border-blue-600 transition"
              />
            </div>
          </div>
        </div>

        {/* Item Rows & Service Selection */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-blue-600" />
              <span>2. Rincian Item Barang & Layanan</span>
            </h2>
            <button
              type="button"
              onClick={handleAddItemRow}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Item</span>
            </button>
          </div>

          <div className="space-y-3">
            {items.map((row, idx) => {
              const selectedService = services.find((s) => s.id === row.serviceId);

              return (
                <div
                  key={idx}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-3"
                >
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {idx + 1}
                  </span>

                  {/* Service selector */}
                  <div className="flex-1 w-full">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Pilihan Layanan:
                    </label>
                    <select
                      value={row.serviceId}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[idx].serviceId = e.target.value;
                        setItems(newItems);
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-blue-600"
                    >
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({formatRupiah(s.basePrice)}) - {s.stages.length} Tahap
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Condition notes */}
                  <div className="flex-1 w-full">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Catatan Fisik / Kerusakan Awal:
                    </label>
                    <input
                      type="text"
                      value={row.itemNotes}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[idx].itemNotes = e.target.value;
                        setItems(newItems);
                      }}
                      placeholder="Misal: Sol menganga 2cm, noda minyak di lidah sepatu"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-blue-600"
                    />
                  </div>

                  {/* Delete button */}
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItemRow(idx)}
                      className="self-end sm:self-center p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                      title="Hapus baris"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary & Submit */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-500 block">Total Biaya Layanan:</span>
            <span className="text-2xl font-black text-slate-900">
              {formatRupiah(calculateTotal())}
            </span>
            <span className="text-[11px] text-slate-400 block">
              {items.length} item barang fisik
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition transform active:scale-98 flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>
              {isSubmitting ? "Menyimpan Pesanan..." : "SIMPAN PESANAN & TERBITKAN QR"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}

