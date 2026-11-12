"use client";

import { useState } from "react";
import { Printer, Bluetooth, Check, AlertCircle, FileText } from "lucide-react";
import { buildThermalTicketBytes, printViaWebBluetooth, PrintTicketPayload } from "@/lib/escpos";

interface ThermalPrintButtonProps {
  payload: PrintTicketPayload;
  className?: string;
}

export default function ThermalPrintButton({ payload, className }: ThermalPrintButtonProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleBluetoothPrint = async () => {
    setIsPrinting(true);
    setStatusMessage("Menghubungkan ke Bluetooth Printer...");
    setIsSuccess(false);

    try {
      const bytes = buildThermalTicketBytes(payload, 32);
      await printViaWebBluetooth(bytes);
      setIsSuccess(true);
      setStatusMessage("Berhasil dicetak ke printer thermal!");
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: unknown) {
      console.warn("Bluetooth thermal print failed:", err);
      setStatusMessage("Bluetooth gagal atau dibatalkan. Menggunakan dialog cetak...");
      // Auto fallback to browser print dialog
      setTimeout(() => {
        handleBrowserPrint();
      }, 500);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleBrowserPrint = () => {
    const printWindow = window.open("", "_blank", "width=380,height=600");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tiket QR - ${payload.itemQrCode}</title>
          <style>
            @page { size: 58mm auto; margin: 2mm; }
            body { font-family: monospace; font-size: 11px; padding: 4px; text-align: center; color: #000; }
            .bold { font-weight: bold; }
            .title { font-size: 14px; margin-bottom: 2px; }
            .divider { border-top: 1px dashed #000; margin: 4px 0; }
            .left { text-align: left; }
            .qr-token { font-size: 14px; font-weight: bold; margin: 6px 0; letter-spacing: 1px; }
          </style>
        </head>
        <body>
          <div class="bold title">${payload.shopName}</div>
          <div class="divider"></div>
          <div class="left">
            <div><b>NOTA :</b> ${payload.orderNumber}</div>
            <div><b>ITEM :</b> ${payload.itemQrCode}</div>
            <div><b>PLG  :</b> ${payload.customerName}</div>
            <div><b>TGL  :</b> ${payload.dateStr}</div>
            <div><b>LAY  :</b> ${payload.serviceName}</div>
            ${payload.itemNotes ? `<div><b>KET  :</b> ${payload.itemNotes}</div>` : ""}
          </div>
          <div class="divider"></div>
          <div class="bold">KODE TIKET QR</div>
          <div class="qr-token">${payload.itemQrCode}</div>
          <div class="divider"></div>
          <div style="font-size: 9px;">* Tempelkan pada fisik barang *</div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleBluetoothPrint}
          disabled={isPrinting}
          className={
            className ||
            "flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition shadow-xs"
          }
        >
          <Bluetooth className="w-3.5 h-3.5 text-blue-400" />
          <span>{isPrinting ? "Mencetak..." : "Cetak Thermal BT"}</span>
        </button>

        <button
          type="button"
          onClick={handleBrowserPrint}
          title="Cetak via browser biasa"
          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition"
        >
          <Printer className="w-3.5 h-3.5" />
        </button>
      </div>

      {statusMessage && (
        <span
          className={`text-[11px] font-medium ${
            isSuccess ? "text-emerald-600" : "text-amber-600"
          }`}
        >
          {statusMessage}
        </span>
      )}
    </div>
  );
}

