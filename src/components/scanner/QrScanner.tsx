"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Camera, Flashlight, AlertCircle, RefreshCw, Keyboard } from "lucide-react";
import { sound } from "@/lib/sound";
import { triggerHaptic } from "@/lib/haptic";

interface QrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  isScanning: boolean;
}

export default function QrScanner({ onScanSuccess, isScanning }: QrScannerProps) {
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    let mounted = true;

    async function startCamera() {
      if (!isScanning) return;

      try {
        setScannerError(null);
        const scanner = new Html5Qrcode("qr-reader-container", {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (mounted) {
              sound.playSuccess();
              triggerHaptic("success");
              onScanSuccess(decodedText);
            }
          },
          () => {
            // Frame scan failure (ignored for performance)
          }
        );

        if (mounted) setIsCameraActive(true);
      } catch (err: unknown) {
        console.warn("Camera start warning:", err);
        if (mounted) {
          setScannerError(
            "Kamera tidak dapat diakses atau sedang digunakan. Anda dapat memasukkan kode QR secara manual."
          );
          setIsCameraActive(false);
          setShowManualInput(true);
        }
      }
    }

    startCamera();

    return () => {
      mounted = false;
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [isScanning, onScanSuccess]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    sound.playSuccess();
    triggerHaptic("success");
    onScanSuccess(manualCode.trim());
    setManualCode("");
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Scanner Viewfinder Card */}
      <div className="relative bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-800 aspect-square flex flex-col items-center justify-center">
        {/* Container for html5-qrcode video */}
        <div id="qr-reader-container" className="w-full h-full" />

        {/* Viewfinder Overlay Reticle */}
        {isCameraActive && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-emerald-400/80 rounded-2xl relative shadow-[0_0_15px_rgba(52,211,153,0.3)]">
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
              
              {/* Animated scan line */}
              <div className="absolute left-2 right-2 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scan-line shadow-[0_0_8px_#34d399]" />
            </div>
          </div>
        )}

        {/* Fallback state when camera fails or is loading */}
        {!isCameraActive && !scannerError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-950">
            <Camera className="w-12 h-12 text-slate-600 animate-pulse mb-3" />
            <p className="text-sm font-medium">Mengaktifkan kamera pemindai...</p>
            <p className="text-xs text-slate-500 mt-1">Arahkan ke kode QR pada tiket barang</p>
          </div>
        )}

        {scannerError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-amber-300 bg-slate-950/95">
            <AlertCircle className="w-10 h-10 mb-2 text-amber-400" />
            <p className="text-xs leading-relaxed max-w-xs">{scannerError}</p>
          </div>
        )}
      </div>

      {/* Manual Input Toggle & Form */}
      <div className="mt-4">
        {!showManualInput ? (
          <button
            type="button"
            onClick={() => setShowManualInput(true)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          >
            <Keyboard className="w-4 h-4" />
            Ketik Kode QR Manual (Misal: TRX-2611-0001-1)
          </button>
        ) : (
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Contoh: TRX-2611-0001-1"
              className="flex-1 px-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-sm font-mono font-bold uppercase focus:outline-hidden focus:border-emerald-600"
              autoFocus
            />
            <button
              type="submit"
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition shadow-md whitespace-nowrap"
            >
              Cari Item
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

