"use client";

import { useEffect, useState } from "react";
import { getServicesWithStages, createService, deleteService } from "@/actions/service-actions";
import { formatRupiah } from "@/lib/utils";
import { Sliders, Plus, Trash2, ArrowLeft, Check, Layers, Clock } from "lucide-react";
import Link from "next/link";

interface StageInput {
  stageName: string;
  stepOrder: number;
  pieceRateAmount: number;
  estimatedMinutes: number;
  isPhotoRequired: boolean;
}

export default function ServicesConfigPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState(35000);
  const [stages, setStages] = useState<StageInput[]>([
    { stageName: "Tahap 1 (Contoh: Cuci / Pola)", stepOrder: 1, pieceRateAmount: 8000, estimatedMinutes: 30, isPhotoRequired: false },
    { stageName: "Tahap 2 (Contoh: Repaint / Jahit)", stepOrder: 2, pieceRateAmount: 15000, estimatedMinutes: 45, isPhotoRequired: false },
    { stageName: "Tahap 3 (Finishing & QC)", stepOrder: 3, pieceRateAmount: 3000, estimatedMinutes: 15, isPhotoRequired: true },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const data = await getServicesWithStages();
    setServices(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddStage = () => {
    setStages([
      ...stages,
      {
        stageName: `Tahap ${stages.length + 1}`,
        stepOrder: stages.length + 1,
        pieceRateAmount: 5000,
        estimatedMinutes: 20,
        isPhotoRequired: false,
      },
    ]);
  };

  const handleRemoveStage = (index: number) => {
    if (stages.length <= 1) return;
    setStages(stages.filter((_, idx) => idx !== index));
  };

  const handleStageChange = (index: number, field: keyof StageInput, value: any) => {
    const updated = [...stages];
    updated[index] = { ...updated[index], [field]: value };
    setStages(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await createService({
        name: name.trim(),
        description: description.trim() || undefined,
        basePrice: Number(basePrice),
        stages: stages.map((s, idx) => ({
          ...s,
          stepOrder: idx + 1,
          pieceRateAmount: Number(s.pieceRateAmount),
          estimatedMinutes: Number(s.estimatedMinutes),
        })),
      });

      setShowModal(false);
      setName("");
      setDescription("");
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Gagal menambahkan layanan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Nonaktifkan layanan ini?")) return;
    await deleteService(id);
    await loadData();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Sliders className="w-6 h-6 text-purple-600" />
            <span>Konfigurasi Master Layanan & Tahapan Komisi</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tentukan alur kerja berantai (sequential workflow) dan nominal upah borongan per tahap untuk setiap layanan.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Layanan Baru</span>
        </button>
      </div>

      {/* Services List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => {
          const totalWorkerCost = service.stages.reduce(
            (acc: number, s: any) => acc + s.pieceRateAmount,
            0
          );
          const ownerMargin = service.basePrice - totalWorkerCost;

          return (
            <div
              key={service.id}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      {service.name}
                    </h3>
                    {service.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{service.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                    title="Nonaktifkan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-3 p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Harga Nota Pelanggan:
                    </span>
                    <span className="font-black text-slate-900 text-sm">
                      {formatRupiah(service.basePrice)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Total Upah Borongan:
                    </span>
                    <span className="font-bold text-emerald-600 text-sm">
                      {formatRupiah(totalWorkerCost)}
                    </span>
                  </div>
                </div>

                {/* Stages breakdown */}
                <div className="mt-4 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Tahapan Estafet Pengerjaan ({service.stages.length} tahap):
                  </span>
                  {service.stages.map((st: any) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between text-xs p-2.5 rounded-xl border border-slate-100 bg-white"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 font-bold text-[10px] flex items-center justify-center">
                          {st.stepOrder}
                        </span>
                        <span className="font-semibold text-slate-800">{st.stageName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">{st.estimatedMinutes}m</span>
                        <span className="font-bold text-emerald-600">
                          {formatRupiah(st.pieceRateAmount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Margin Laba Bersih Usaha:</span>
                <span className="font-black text-purple-700">
                  {formatRupiah(ownerMargin)} ({Math.round((ownerMargin / service.basePrice) * 100)}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add Service */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900">
                Tambah Master Layanan & Rantai Tahapan
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
                  Nama Layanan:
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Misal: Repaint Sol & Cuci Premium"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Harga Jual ke Pelanggan (Rupiah):
                </label>
                <input
                  type="number"
                  required
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-hidden"
                />
              </div>

              {/* Dynamic Stages List */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Rantai Tahapan Pengerjaan:
                  </label>
                  <button
                    type="button"
                    onClick={handleAddStage}
                    className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Tahap</span>
                  </button>
                </div>

                {stages.map((stage, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-xs"
                  >
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>

                    <input
                      type="text"
                      required
                      value={stage.stageName}
                      onChange={(e) => handleStageChange(idx, "stageName", e.target.value)}
                      placeholder="Nama Tahapan"
                      className="flex-2 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />

                    <input
                      type="number"
                      required
                      value={stage.pieceRateAmount}
                      onChange={(e) => handleStageChange(idx, "pieceRateAmount", e.target.value)}
                      placeholder="Tarif (Rp)"
                      className="w-24 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-emerald-600"
                    />

                    {stages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStage(idx)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
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
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Layanan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

