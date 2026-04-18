import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/lib/supabase";
import { 
  Camera,
  SwitchCamera,
  X,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  CheckCircle2,
  ShoppingCart,
  Pill,
  Zap,
  ChevronUp,
  ChevronDown,
  Wifi,
  WifiOff,
  ShieldAlert,
  Settings2,
  Vibrate,
  VibrateOff,
  Scan,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ScannedProduct {
  name: string;
  price: number;
  quantity: number;
}

export default function RemoteScanner() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [isPaired, setIsPaired] = useState(false);
  const [lastScanned, setLastScanned] = useState<any>(null);
  const [cartPreview, setCartPreview] = useState<ScannedProduct[]>([]);
  const [manualSessionId, setManualSessionId] = useState("");
  const [status, setStatus] = useState<"connecting" | "online" | "offline">("connecting");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrateEnabled, setVibrateEnabled] = useState(true);
  
  const [cameras, setCameras] = useState<{ id: string, label: string }[]>([]);
  const [activeCameraIndex, setActiveCameraIndex] = useState(0);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [showFeedbackFlash, setShowFeedbackFlash] = useState(false);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastScanTime = useRef<number>(0);

  // ─── SOUND ENGINE ─────────────────────────────────────────
  const playBeep = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      osc.frequency.setValueAtTime(2400, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3");
      audio.volume = 0.4;
      audio.play().catch(() => {});
    }
  }, [soundEnabled]);

  // ─── VIBRATION ────────────────────────────────────────────
  const triggerVibration = useCallback((pattern: number | number[]) => {
    if (!vibrateEnabled || !window.navigator.vibrate) return;
    window.navigator.vibrate(pattern);
  }, [vibrateEnabled]);

  // ─── FEEDBACK ─────────────────────────────────────────────
  const triggerScanFeedback = useCallback(() => {
    playBeep();
    triggerVibration([60, 30, 60]);
    setShowFeedbackFlash(true);
    setTimeout(() => setShowFeedbackFlash(false), 250);
    setScanCount(prev => prev + 1);
  }, [playBeep, triggerVibration]);

  // ─── FULLSCREEN ───────────────────────────────────────────
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const refreshCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices?.length > 0) setCameras(devices.map(d => ({ id: d.id, label: d.label })));
    } catch (err) {}
  };

  // ─── SESSION CHANNEL ──────────────────────────────────────
  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase.channel(`scanner-session:${sessionId}`);
    
    channel
      .on("broadcast", { event: "CART_UPDATE" }, (payload) => {
        setCartPreview(payload.payload.items || []);
      })
      .on("broadcast", { event: "SCAN_ACK" }, (payload) => {
        setLastScanned(payload.payload.product);
        triggerScanFeedback();
        setTimeout(() => setLastScanned(null), 3000);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          channel.send({ type: "broadcast", event: "PAIR_REQUEST", payload: { device: navigator.userAgent } });
          setIsPaired(true);
          setStatus("online");
        } else if (status === "CLOSED") {
          setStatus("offline");
        }
      });

    return () => {
      stopScanner();
      supabase.removeChannel(channel);
    };
  }, [sessionId, triggerScanFeedback]);

  // ─── SCANNER CONTROLS ────────────────────────────────────
  const startScanner = async () => {
    if (!window.isSecureContext && window.location.hostname !== "localhost") {
      toast.error("Camera requires HTTPS.");
      return;
    }

    try {
      // Request permission first
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(t => t.stop());
      await refreshCameras();
    } catch (err: any) {
      toast.error(`Camera permission denied: ${err.name}`);
      return;
    }

    try {
      const scanner = new Html5Qrcode("scan-viewport");
      scannerRef.current = scanner;
      
      const cameraId = cameras[activeCameraIndex]?.id;
      const config = { fps: 25, qrbox: { width: 260, height: 160 } };
      
      if (cameraId) {
        await scanner.start({ deviceId: { exact: cameraId } }, config, handleScan, () => {});
      } else {
        const mode = facingMode === "environment" ? { facingMode: { exact: "environment" } } : { facingMode: "user" };
        try {
          await scanner.start(mode, config, handleScan, () => {});
        } catch (e) {
          await scanner.start({ facingMode }, config, handleScan, () => {});
        }
      }
      
      setIsScanning(true);
      if (cameras.length === 0) setTimeout(refreshCameras, 500);
    } catch (err: any) {
      toast.error("Camera initialization failed.");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch (e) {}
      setIsScanning(false);
    }
  };

  const toggleCamera = async () => {
    if (cameras.length > 1) {
      setActiveCameraIndex((activeCameraIndex + 1) % cameras.length);
    } else {
      setFacingMode(prev => prev === "environment" ? "user" : "environment");
    }
    if (isScanning) {
      await stopScanner();
      setTimeout(startScanner, 300);
    }
  };

  const handleScan = (barcode: string) => {
    const now = Date.now();
    if (now - lastScanTime.current < 1500) return;
    lastScanTime.current = now;

    supabase.channel(`scanner-session:${sessionId}`).send({
      type: "broadcast",
      event: "SCAN_RESULT",
      payload: { barcode }
    });
    
    triggerScanFeedback();
  };

  const handleManualJoin = () => {
    if (manualSessionId.length > 5) navigate(`/remote-scanner/${manualSessionId}`);
  };

  // ─── PAIRING SCREEN (no session) ─────────────────────────
  if (!sessionId) {
    return (
      <div ref={containerRef} className="min-h-[100dvh] bg-black text-white flex flex-col">
        {/* Subtle gradient background */}
        <div className="fixed inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/3 pointer-events-none" />
        
        <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="mb-10"
          >
            <div className="h-20 w-20 rounded-[1.5rem] bg-gradient-to-br from-primary via-emerald-400 to-primary flex items-center justify-center shadow-2xl shadow-primary/30">
              <Scan className="h-10 w-10 text-black" strokeWidth={2.5} />
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-center space-y-3 mb-10"
          >
            <h1 className="text-3xl font-black tracking-tight">Lumiaxy Bridge</h1>
            <p className="text-sm text-white/40 max-w-[240px] mx-auto leading-relaxed">
              Connect your phone to the POS terminal for barcode scanning.
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-sm space-y-4"
          >
            <input 
              className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 font-mono text-center tracking-[0.15em] text-white/90 text-lg outline-none focus:border-primary/60 focus:bg-white/[0.08] transition-all placeholder:text-white/15"
              placeholder="Enter Session ID"
              value={manualSessionId}
              onChange={e => setManualSessionId(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleManualJoin()}
            />
            <button 
              onClick={handleManualJoin}
              className="w-full h-14 rounded-2xl bg-primary text-black font-bold text-sm tracking-wide active:scale-[0.98] transition-transform shadow-xl shadow-primary/25"
            >
              Connect
            </button>
          </motion.div>
        </div>

        <div className="pb-8 text-center">
          <p className="text-[10px] text-white/15 font-medium tracking-widest uppercase">Lumiaxy Enterprise</p>
        </div>
      </div>
    );
  }

  // ─── SCANNER VIEW ─────────────────────────────────────────
  return (
    <div ref={containerRef} className={cn(
      "h-[100dvh] bg-black text-white flex flex-col overflow-hidden select-none",
      isFullscreen && "fixed inset-0 z-[9999]"
    )}>
      {/* Green Flash on Scan */}
      <AnimatePresence>
        {showFeedbackFlash && (
          <motion.div 
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-emerald-400/25 z-[200] pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* ─── TOP BAR ─────────────────────────────────────── */}
      <div className="relative z-50 flex items-center justify-between px-4 pt-3 pb-2 safe-area-top">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "h-2 w-2 rounded-full",
            status === "online" ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" : 
            status === "connecting" ? "bg-amber-400 animate-pulse" : "bg-red-500"
          )} />
          <span className="text-[11px] font-semibold text-white/50 tracking-wide">
            {status === "online" ? "Connected" : status === "connecting" ? "Connecting..." : "Offline"}
          </span>
          {scanCount > 0 && (
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
              {scanCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={toggleFullscreen}
            className="p-2 rounded-xl text-white/30 active:bg-white/10 transition-colors"
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          <button 
            onClick={() => setDrawerOpen(!drawerOpen)}
            className={cn("p-2 rounded-xl transition-colors", drawerOpen ? "bg-white/10 text-white" : "text-white/30 active:bg-white/10")}
          >
            <Settings2 size={18} />
          </button>
        </div>
      </div>

      {/* ─── SETTINGS DRAWER ─────────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden z-40 px-4 pb-3"
          >
            <div className="flex gap-2">
              <button
                onClick={() => { setSoundEnabled(!soundEnabled); if (!soundEnabled) playBeep(); }}
                className={cn(
                  "flex-1 h-11 rounded-xl flex items-center justify-center gap-2 text-[11px] font-semibold transition-all",
                  soundEnabled ? "bg-primary/15 text-primary border border-primary/25" : "bg-white/5 text-white/30 border border-white/5"
                )}
              >
                {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                Sound
              </button>
              <button
                onClick={() => { setVibrateEnabled(!vibrateEnabled); if (!vibrateEnabled) triggerVibration(80); }}
                className={cn(
                  "flex-1 h-11 rounded-xl flex items-center justify-center gap-2 text-[11px] font-semibold transition-all",
                  vibrateEnabled ? "bg-primary/15 text-primary border border-primary/25" : "bg-white/5 text-white/30 border border-white/5"
                )}
              >
                {vibrateEnabled ? <Vibrate size={14} /> : <VibrateOff size={14} />}
                Haptics
              </button>
              <button
                onClick={toggleCamera}
                className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2 text-[11px] font-semibold bg-white/5 text-white/50 border border-white/5 active:bg-white/10 transition-all"
              >
                <SwitchCamera size={14} />
                Flip
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── CAMERA VIEWPORT ─────────────────────────────── */}
      <div className="flex-1 relative min-h-0">
        {/* Camera Feed */}
        <div 
          id="scan-viewport" 
          className="absolute inset-0 w-full h-full [&>video]:object-cover [&>video]:w-full [&>video]:h-full bg-black" 
        />

        {/* HTTPS Warning */}
        {!window.isSecureContext && window.location.hostname !== "localhost" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30 p-8">
            <div className="text-center space-y-4">
              <ShieldAlert className="h-12 w-12 text-amber-400 mx-auto" />
              <p className="text-sm text-amber-200 font-medium leading-relaxed">
                Camera requires HTTPS.<br/>Deploy to Vercel or use localhost.
              </p>
            </div>
          </div>
        )}

        {/* Idle State — Start Button */}
        {!isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-20">
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileTap={{ scale: 0.92 }}
              onClick={startScanner}
              className="h-24 w-24 rounded-full bg-white flex items-center justify-center shadow-2xl shadow-white/10 active:shadow-none transition-shadow mb-6"
            >
              <Camera className="h-10 w-10 text-black" strokeWidth={2} />
            </motion.button>
            <p className="text-sm font-medium text-white/40">Tap to start scanning</p>
          </div>
        )}

        {/* Active Scanning Overlay */}
        {isScanning && (
          <>
            {/* Darkened edges */}
            <div className="absolute inset-0 z-10 pointer-events-none">
              {/* Top dark */}
              <div className="absolute top-0 left-0 right-0 h-[25%] bg-gradient-to-b from-black/60 to-transparent" />
              {/* Bottom dark */}
              <div className="absolute bottom-0 left-0 right-0 h-[25%] bg-gradient-to-t from-black/60 to-transparent" />
            </div>

            {/* Scan Frame */}
            <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
              <div className="relative w-[72%] max-w-[300px] aspect-[16/10]">
                {/* Corner brackets */}
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-[3px] border-l-[3px] border-white rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-[3px] border-r-[3px] border-white rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-[3px] border-l-[3px] border-white rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-[3px] border-r-[3px] border-white rounded-br-lg" />
                
                {/* Sweep line */}
                <motion.div 
                  initial={{ top: "5%" }}
                  animate={{ top: "95%" }}
                  transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.8, ease: "easeInOut" }}
                  className="absolute left-[5%] right-[5%] h-[2px] bg-primary rounded-full shadow-[0_0_12px_rgba(16,185,129,0.8)]"
                />
              </div>
            </div>

            {/* Stop Button (bottom center) */}
            <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center">
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                whileTap={{ scale: 0.92 }}
                onClick={stopScanner}
                className="h-16 w-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center active:bg-red-500/30 transition-colors"
              >
                <div className="h-6 w-6 rounded-sm bg-white" />
              </motion.button>
            </div>

            {/* Flip camera (bottom right) */}
            <div className="absolute bottom-7 right-6 z-20">
              <button 
                onClick={toggleCamera}
                className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white active:bg-white/20 transition-colors"
              >
                <SwitchCamera size={18} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* ─── SCAN SUCCESS TOAST ──────────────────────────── */}
      <AnimatePresence>
        {lastScanned && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute bottom-28 left-4 right-4 z-[100] bg-emerald-500 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xl shadow-emerald-500/30"
          >
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-white/60 uppercase tracking-widest">Synced</p>
              <p className="text-base font-bold text-white truncate">{lastScanned.name}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── BOTTOM SHEET (Cart Preview) ─────────────────── */}
      {!isFullscreen && (
        <div className="relative z-50 bg-[#0c0c0f] border-t border-white/[0.06] safe-area-bottom">
          {/* Handle */}
          <button 
            onClick={() => setDrawerOpen(false)}
            className="w-full flex justify-center pt-2 pb-1"
          >
            <div className="w-8 h-1 rounded-full bg-white/15" />
          </button>

          {/* Cart summary */}
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-white/20" />
                <span className="text-xs font-semibold text-white/40">Cart</span>
              </div>
              <span className="text-xs font-bold text-white/20">{cartPreview.length} items</span>
            </div>

            {cartPreview.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-[11px] text-white/15 font-medium">No items scanned yet</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto custom-scrollbar">
                {cartPreview.slice(-4).map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between py-2.5 px-3 bg-white/[0.03] rounded-xl"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                        <Pill size={14} className="text-white/20" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white/80 truncate">{item.name}</p>
                        <p className="text-[10px] text-white/25">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-white/50 flex-shrink-0 ml-2">
                      {item.price.toLocaleString()}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
