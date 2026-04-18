import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/lib/supabase";
import { 
  Camera, SwitchCamera, Maximize2, Minimize2,
  CheckCircle2, Volume2, VolumeX, Vibrate, VibrateOff,
  Settings2, Scan,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function RemoteScanner() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<any>(null);
  const [manualSessionId, setManualSessionId] = useState("");
  const [status, setStatus] = useState<"connecting" | "online" | "offline">("connecting");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrateEnabled, setVibrateEnabled] = useState(true);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [activeCameraIndex, setActiveCameraIndex] = useState(0);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [flash, setFlash] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastScanTime = useRef(0);

  const playBeep = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.setValueAtTime(1800, ctx.currentTime);
      o.frequency.setValueAtTime(2400, ctx.currentTime + 0.05);
      g.gain.setValueAtTime(0.25, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.12);
    } catch { }
  }, [soundEnabled]);

  const vibe = useCallback((p: number | number[]) => {
    if (vibrateEnabled && navigator.vibrate) navigator.vibrate(p);
  }, [vibrateEnabled]);

  const onScanFeedback = useCallback(() => {
    playBeep(); vibe([50, 30, 50]);
    setFlash(true); setTimeout(() => setFlash(false), 200);
    setScanCount(c => c + 1);
  }, [playBeep, vibe]);

  const toggleFs = useCallback(async () => {
    try {
      if (!document.fullscreenElement) { await containerRef.current?.requestFullscreen(); setIsFullscreen(true); }
      else { await document.exitFullscreen(); setIsFullscreen(false); }
    } catch { }
  }, []);

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  const getCameras = async () => {
    try {
      const d = await Html5Qrcode.getCameras();
      if (d?.length) setCameras(d.map(x => ({ id: x.id, label: x.label })));
    } catch { }
  };

  useEffect(() => {
    if (!sessionId) return;
    const ch = supabase.channel(`scanner-session:${sessionId}`);
    ch.on("broadcast", { event: "SCAN_ACK" }, (p) => {
        setLastScanned(p.payload.product);
        onScanFeedback();
        setTimeout(() => setLastScanned(null), 2500);
      })
      .subscribe((s) => {
        if (s === "SUBSCRIBED") {
          ch.send({ type: "broadcast", event: "PAIR_REQUEST", payload: { device: navigator.userAgent } });
          setStatus("online");
        } else if (s === "CLOSED") setStatus("offline");
      });
    return () => { stopScanner(); supabase.removeChannel(ch); };
  }, [sessionId, onScanFeedback]);

  const startScanner = async () => {
    if (!window.isSecureContext && location.hostname !== "localhost") { toast.error("Needs HTTPS"); return; }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true });
      s.getTracks().forEach(t => t.stop()); await getCameras();
    } catch (e: any) { toast.error("Camera blocked"); return; }

    try {
      const sc = new Html5Qrcode("scan-vp");
      scannerRef.current = sc;
      const camId = cameras[activeCameraIndex]?.id;
      const cfg = { fps: 25, qrbox: { width: 250, height: 150 } };
      if (camId) await sc.start({ deviceId: { exact: camId } }, cfg, handleScan, () => {});
      else {
        try { await sc.start({ facingMode: { exact: facingMode } }, cfg, handleScan, () => {}); }
        catch { await sc.start({ facingMode }, cfg, handleScan, () => {}); }
      }
      setIsScanning(true);
      if (!cameras.length) setTimeout(getCameras, 500);
    } catch { toast.error("Camera failed"); }
  };

  const stopScanner = async () => {
    if (scannerRef.current) { try { await scannerRef.current.stop(); } catch { } setIsScanning(false); }
  };

  const flipCam = async () => {
    if (cameras.length > 1) setActiveCameraIndex((activeCameraIndex + 1) % cameras.length);
    else setFacingMode(f => f === "environment" ? "user" : "environment");
    if (isScanning) { await stopScanner(); setTimeout(startScanner, 300); }
  };

  const handleScan = (barcode: string) => {
    if (Date.now() - lastScanTime.current < 1500) return;
    lastScanTime.current = Date.now();
    supabase.channel(`scanner-session:${sessionId}`).send({
      type: "broadcast", event: "SCAN_RESULT", payload: { barcode }
    });
    onScanFeedback();
  };

  // ─── PAIRING SCREEN ──────────────────────────────────────
  if (!sessionId) return (
    <div ref={containerRef} className="h-[100dvh] bg-black text-white flex flex-col items-center justify-center px-8">
      <div className="fixed inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      
      <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }}
        className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center mb-8 shadow-lg shadow-primary/30"
      >
        <Scan className="h-8 w-8 text-black" strokeWidth={2.5} />
      </motion.div>

      <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}
        className="text-2xl font-bold tracking-tight mb-2">Lumiaxy Bridge</motion.h1>
      <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
        className="text-sm text-white/30 mb-8 text-center">Connect to POS terminal</motion.p>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
        className="w-full max-w-xs space-y-3"
      >
        <input
          className="w-full h-13 bg-white/5 border border-white/10 rounded-xl px-4 font-mono text-center tracking-[0.15em] text-white outline-none focus:border-primary/50 transition-colors placeholder:text-white/10 text-base"
          placeholder="Session ID"
          value={manualSessionId}
          onChange={e => setManualSessionId(e.target.value)}
          onKeyDown={e => e.key === "Enter" && manualSessionId.length > 5 && navigate(`/remote-scanner/${manualSessionId}`)}
        />
        <button
          onClick={() => manualSessionId.length > 5 && navigate(`/remote-scanner/${manualSessionId}`)}
          className="w-full h-12 rounded-xl bg-primary text-black font-semibold text-sm active:scale-[0.97] transition-transform"
        >
          Connect
        </button>
      </motion.div>
    </div>
  );

  // ─── SCANNER ──────────────────────────────────────────────
  return (
    <div ref={containerRef} className={cn("h-[100dvh] bg-black text-white flex flex-col overflow-hidden select-none", isFullscreen && "fixed inset-0 z-[9999]")}>
      
      {/* Flash */}
      <AnimatePresence>
        {flash && <motion.div initial={{ opacity: 0.5 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 bg-emerald-400/20 z-[200] pointer-events-none" />}
      </AnimatePresence>

      {/* ─── STATUS BAR ──────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 h-11 flex-shrink-0 z-50 bg-black/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className={cn("h-1.5 w-1.5 rounded-full", status === "online" ? "bg-emerald-400" : status === "connecting" ? "bg-amber-400 animate-pulse" : "bg-red-500")} />
          <span className="text-[11px] text-white/40 font-medium">{sessionId?.slice(0, 8)}</span>
          {scanCount > 0 && <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-md">{scanCount}</span>}
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={toggleFs} className="p-2 text-white/25 active:text-white/60">
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button onClick={() => setSettingsOpen(!settingsOpen)} className={cn("p-2 rounded-lg", settingsOpen ? "text-primary" : "text-white/25")}>
            <Settings2 size={16} />
          </button>
        </div>
      </div>

      {/* ─── SETTINGS ────────────────────────────────────── */}
      <AnimatePresence>
        {settingsOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden z-40 px-4 pb-2 flex-shrink-0">
            <div className="flex gap-1.5">
              {[
                { on: soundEnabled, toggle: () => setSoundEnabled(!soundEnabled), icon: soundEnabled ? Volume2 : VolumeX, label: "Sound" },
                { on: vibrateEnabled, toggle: () => { setVibrateEnabled(!vibrateEnabled); if (!vibrateEnabled) vibe(60); }, icon: vibrateEnabled ? Vibrate : VibrateOff, label: "Haptic" },
              ].map((b, i) => (
                <button key={i} onClick={b.toggle} className={cn(
                  "flex-1 h-9 rounded-lg flex items-center justify-center gap-1.5 text-[10px] font-semibold transition-all",
                  b.on ? "bg-primary/10 text-primary border border-primary/20" : "bg-white/5 text-white/25 border border-transparent"
                )}>
                  <b.icon size={13} /> {b.label}
                </button>
              ))}
              <button onClick={flipCam} className="flex-1 h-9 rounded-lg flex items-center justify-center gap-1.5 text-[10px] font-semibold bg-white/5 text-white/30 active:bg-white/10">
                <SwitchCamera size={13} /> Flip
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── VIEWPORT ────────────────────────────────────── */}
      <div className="flex-1 relative min-h-0">
        <div id="scan-vp" className="absolute inset-0 w-full h-full [&>video]:object-cover [&>video]:w-full [&>video]:h-full bg-black" />

        {/* Idle */}
        {!isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px] z-20 gap-5">
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} whileTap={{ scale: 0.9 }}
              onClick={startScanner}
              className="h-20 w-20 rounded-full bg-white flex items-center justify-center shadow-2xl shadow-white/10"
            >
              <Camera className="h-8 w-8 text-black" strokeWidth={2} />
            </motion.button>
            <p className="text-[12px] text-white/30 font-medium">Tap to scan</p>
          </div>
        )}

        {/* Active overlay */}
        {isScanning && (
          <>
            {/* Vignette */}
            <div className="absolute inset-0 z-10 pointer-events-none">
              <div className="absolute top-0 inset-x-0 h-[22%] bg-gradient-to-b from-black/50 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 h-[22%] bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute inset-y-0 left-0 w-[12%] bg-gradient-to-r from-black/30 to-transparent" />
              <div className="absolute inset-y-0 right-0 w-[12%] bg-gradient-to-l from-black/30 to-transparent" />
            </div>

            {/* Scan frame */}
            <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
              <div className="relative w-[68%] max-w-[280px] aspect-[5/3]">
                <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-2 border-l-2 border-white/80 rounded-tl-md" />
                <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-2 border-r-2 border-white/80 rounded-tr-md" />
                <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-2 border-l-2 border-white/80 rounded-bl-md" />
                <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-2 border-r-2 border-white/80 rounded-br-md" />
                <motion.div
                  initial={{ top: "8%" }} animate={{ top: "92%" }}
                  transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.6, ease: "easeInOut" }}
                  className="absolute left-[8%] right-[8%] h-[2px] bg-primary rounded-full shadow-[0_0_10px_rgba(16,185,129,0.7)]"
                />
              </div>
            </div>

            {/* Bottom controls */}
            <div className="absolute bottom-5 inset-x-0 z-20 flex items-center justify-center gap-6">
              <button onClick={flipCam} className="h-11 w-11 rounded-full bg-black/40 backdrop-blur-lg border border-white/10 flex items-center justify-center text-white/70 active:bg-white/10">
                <SwitchCamera size={16} />
              </button>
              <motion.button whileTap={{ scale: 0.9 }} onClick={stopScanner}
                className="h-14 w-14 rounded-full bg-white/10 backdrop-blur-lg border border-white/15 flex items-center justify-center active:bg-red-500/30"
              >
                <div className="h-5 w-5 rounded bg-white" />
              </motion.button>
              <button onClick={toggleFs} className="h-11 w-11 rounded-full bg-black/40 backdrop-blur-lg border border-white/10 flex items-center justify-center text-white/70 active:bg-white/10">
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ─── SCAN RESULT TOAST ───────────────────────────── */}
      <AnimatePresence>
        {lastScanned && (
          <motion.div
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="absolute bottom-24 left-4 right-4 z-[100] bg-emerald-500 rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-xl shadow-emerald-500/25"
          >
            <CheckCircle2 className="h-5 w-5 text-white flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] font-semibold text-white/50 uppercase tracking-widest">Synced</p>
              <p className="text-sm font-bold text-white truncate">{lastScanned.name}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
