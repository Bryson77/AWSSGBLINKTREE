"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  HiOutlineBolt,
  HiOutlineArrowsRightLeft,
  HiOutlineMagnifyingGlass,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineXCircle,
} from "react-icons/hi2";

interface CameraQRScannerProps {
  onScan: (decodedText: string) => Promise<void> | void;
  isProcessing?: boolean;
  roleLabel?: string;
  onManualSearch?: (query: string) => Promise<void> | void;
}

// ── Web Audio Feedback Synthesizer (Zero External Audio Assets) ──
function playSoundFeedback(type: "success" | "duplicate" | "banned") {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === "success") {
      // Crisp 880Hz ascending chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === "duplicate") {
      // Low dual buzzer
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else {
      // Harsh descending alarm
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch {
    // Ignore audio context errors on restricted browsers
  }
}

function triggerHaptic(type: "success" | "warning") {
  if (typeof window !== "undefined" && navigator.vibrate) {
    if (type === "success") {
      navigator.vibrate(40);
    } else {
      navigator.vibrate([100, 50, 100]);
    }
  }
}

export function CameraQRScanner({
  onScan,
  isProcessing = false,
  roleLabel = "SCANNER",
  onManualSearch,
}: CameraQRScannerProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [manualInput, setManualInput] = useState("");
  const [scannerError, setScannerError] = useState<string | null>(null);

  const scannerRef = useRef<any>(null);
  const lastScannedTokenRef = useRef<string>("");
  const lastScanTimestampRef = useRef<number>(0);

  const handleDecodedText = useCallback(
    async (decodedText: string) => {
      const now = Date.now();
      // Debounce identical scans within 2 seconds
      if (
        decodedText === lastScannedTokenRef.current &&
        now - lastScanTimestampRef.current < 2000
      ) {
        return;
      }

      lastScannedTokenRef.current = decodedText;
      lastScanTimestampRef.current = now;

      try {
        await onScan(decodedText);
      } catch (err) {
        console.error("Scan processing error:", err);
      }
    },
    [onScan]
  );

  useEffect(() => {
    let mounted = true;
    let html5QrCode: any = null;

    async function initScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!mounted) return;

        html5QrCode = new Html5Qrcode("qr-reader-viewport");
        scannerRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        await html5QrCode.start(
          { facingMode },
          config,
          (decodedText: string) => {
            handleDecodedText(decodedText);
          },
          () => {
            // Frame scanned without QR — silent ignore
          }
        );

        if (mounted) {
          setCameraActive(true);
          setScannerError(null);
        }
      } catch (err: any) {
        console.warn("Camera init warning:", err);
        if (mounted) {
          setCameraActive(false);
          setScannerError(
            err?.message?.includes("Permission")
              ? "Camera permission denied. Please allow camera access in your browser settings."
              : "Unable to start video camera. Use emergency search below."
          );
        }
      }
    }

    initScanner();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current?.clear())
          .catch(() => {});
      }
    };
  }, [facingMode, handleDecodedText]);

  async function toggleTorch() {
    try {
      if (scannerRef.current && cameraActive) {
        const track = scannerRef.current.getRunningTrackCameraCapabilities();
        if (track && track.torchFeature().isSupported()) {
          const newState = !torchOn;
          await track.torchFeature().apply(newState);
          setTorchOn(newState);
        }
      }
    } catch {
      // Torch not supported on device
    }
  }

  function toggleCameraFlip() {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualInput.trim()) return;
    if (onManualSearch) {
      onManualSearch(manualInput.trim());
    } else {
      handleDecodedText(manualInput.trim());
    }
    setManualInput("");
  }

  return (
    <div className="space-y-4">
      {/* Viewport Frame */}
      <div className="relative mx-auto w-full max-w-sm border-[3px] border-black bg-black p-1 shadow-[6px_6px_0px_#000000]">
        <div className="flex items-center justify-between border-b-2 border-black bg-zinc-900 px-3 py-1.5 text-white">
          <div className="flex items-center gap-1.5 font-mono text-[10px] font-black uppercase text-accent-purple">
            <span className="h-2 w-2 animate-ping bg-accent-purple" />
            <span>LIVE_{roleLabel}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTorch}
              className={`border border-black px-2 py-0.5 font-mono text-[10px] font-bold uppercase transition-all cursor-pointer ${
                torchOn ? "bg-amber-400 text-black" : "bg-zinc-800 text-zinc-300 hover:text-white"
              }`}
              title="Toggle Flashlight"
            >
              <HiOutlineBolt className="inline h-3 w-3" /> Flash
            </button>
            <button
              onClick={toggleCameraFlip}
              className="border border-black bg-zinc-800 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-zinc-300 hover:text-white transition-all cursor-pointer"
              title="Switch Camera"
            >
              <HiOutlineArrowsRightLeft className="inline h-3 w-3" /> Flip
            </button>
          </div>
        </div>

        {/* Video stream container */}
        <div className="relative min-h-[300px] w-full overflow-hidden bg-black">
          <div id="qr-reader-viewport" className="w-full" />

          {/* Neo-Brutalist HUD Targeting Brackets */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-48 w-48 border-2 border-dashed border-accent-purple/80">
              <div className="absolute -top-1 -left-1 h-4 w-4 border-t-3 border-l-3 border-accent-purple" />
              <div className="absolute -top-1 -right-1 h-4 w-4 border-t-3 border-r-3 border-accent-purple" />
              <div className="absolute -bottom-1 -left-1 h-4 w-4 border-b-3 border-l-3 border-accent-purple" />
              <div className="absolute -bottom-1 -right-1 h-4 w-4 border-b-3 border-r-3 border-accent-purple" />
            </div>
          </div>

          {/* Processing Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-xs">
              <div className="border-2 border-black bg-white px-4 py-2 font-mono text-xs font-black uppercase text-black shadow-[4px_4px_0px_#7C3AED]">
                VALIDATING CODE...
              </div>
            </div>
          )}
        </div>

        {/* Error / Fallback Banner */}
        {scannerError && (
          <div className="border-t-2 border-black bg-amber-400 p-2 text-center font-mono text-[11px] font-black text-black">
            <HiOutlineExclamationTriangle className="inline h-3.5 w-3.5 mr-1" />
            {scannerError}
          </div>
        )}
      </div>

      {/* Emergency Manual Search Bar */}
      <div className="mx-auto w-full max-w-sm border-[3px] border-black bg-white p-3 shadow-[4px_4px_0px_#000000]">
        <div className="mb-1 font-mono text-[9px] font-black uppercase tracking-wider text-zinc-500">
          // EMERGENCY_FALLBACK (CRACKED SCREEN / DEAD BATTERY)
        </div>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Enter Ticket Token or Student Name..."
              className="w-full border-2 border-black bg-zinc-50 px-2.5 py-1.5 font-mono text-xs text-black outline-none focus:bg-white focus:shadow-[2px_2px_0px_#7C3AED]"
            />
          </div>
          <button
            type="submit"
            disabled={!manualInput.trim()}
            className="flex items-center gap-1 border-2 border-black bg-black px-3 py-1.5 font-mono text-xs font-black uppercase text-white shadow-[2px_2px_0px_#7C3AED] hover:bg-accent-purple disabled:opacity-40 transition-all cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            <HiOutlineMagnifyingGlass className="h-3.5 w-3.5" />
            <span>Search</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export { playSoundFeedback, triggerHaptic };
