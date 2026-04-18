import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/lib/supabase";
import { 
  Smartphone, 
  Settings as SettingsIcon, 
  History, 
  ShoppingCart, 
  CheckCircle2, 
  AlertCircle,
  Pill,
  Zap,
  Loader2,
  RefreshCw,
  Volume2,
  VolumeX,
  Vibrate,
  VibrateOff,
  Maximize2,
  Minimize2,
  X,
  ShieldAlert,
  Camera,
  SwitchCamera,
  FlashlightOff,
  Flashlight,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  
  // Customization state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrateEnabled, setVibrateEnabled] = useState(true);
  
  const [cameras, setCameras] = useState<{ id: string, label: string }[]>([]);
  const [activeCameraIndex, setActiveCameraIndex] = useState(0);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  
  const [debugLog, setDebugLog] = useState<string>("");
  const [showFeedbackFlash, setShowFeedbackFlash] = useState(false);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastScanTime = useRef<number>(0);

  const log = (msg: string) => {
    console.log("[Scanner] " + msg);
    setDebugLog(prev => `${new Date().toLocaleTimeString()} - ${msg}\n${prev}`.slice(0, 2000));
  };

  // ─── SOUND ENGINE ─────────────────────────────────────────
  const playBeep = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      // Short "bip-bip" scanner sound
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      osc.frequency.setValueAtTime(2200, ctx.currentTime + 0.06);
      osc.frequency.setValueAtTime(1800, ctx.currentTime + 0.12);
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
      
      log("🔊 Beep played");
    } catch (e) {
      // Fallback to audio file
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3");
      audio.volume = 0.5;
      audio.play().catch(() => {});
    }
  }, [soundEnabled]);

  // ─── VIBRATION ENGINE ─────────────────────────────────────
  const triggerVibration = useCallback((pattern: number | number[]) => {
    if (!vibrateEnabled) return;
    if (window.navigator.vibrate) {
      window.navigator.vibrate(pattern);
      log("📳 Vibration triggered");
    } else {
      log("⚠️ Vibration API not available");
    }
  }, [vibrateEnabled]);

  // ─── SCAN FEEDBACK (visual + haptic + audio) ──────────────
  const triggerScanFeedback = useCallback(() => {
    playBeep();
    triggerVibration([80, 50, 80]);
    setShowFeedbackFlash(true);
    setTimeout(() => setShowFeedbackFlash(false), 300);
    setScanCount(prev => prev + 1);
  }, [playBeep, triggerVibration]);

  // ─── FULLSCREEN TOGGLE ────────────────────────────────────
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
        log("Entered fullscreen mode");
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
        log("Exited fullscreen mode");
      }
    } catch (e) {
      log("Fullscreen not supported on this device");
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const triggerPermissionRequest = async () => {
    log("Manually requesting camera stream...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      log("Stream acquired. Permissions granted.");
      stream.getTracks().forEach(track => track.stop());
      refreshCameras();
      toast.success("Camera ready.");
    } catch (err: any) {
      log(`Permission Error: ${err.message}`);
      toast.error(`Permission denied: ${err.name}`);
    }
  };

  const refreshCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        log(`Lenses found: ${devices.length}`);
        setCameras(devices.map(d => ({ id: d.id, label: d.label })));
      }
    } catch (err) {
      log("Enumeration blocked by browser security.");
    }
  };

  // NOTE: Do NOT call refreshCameras() on mount.
  // Camera enumeration happens after user taps "Initialize Lens"

  useEffect(() => {
    if (!sessionId) return;
    
    log(`Connecting to session: ${sessionId}`);
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
          channel.send({
            type: "broadcast",
            event: "PAIR_REQUEST",
            payload: { device: navigator.userAgent }
          });
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

  const startScanner = async () => {
    if (!window.isSecureContext && window.location.hostname !== "localhost") {
      log("Error: Insecure Context (No HTTPS)");
      toast.error("Camera requires HTTPS connection.");
      return;
    }

    log("Initializing Scanner Module...");
    try {
      const scanner = new Html5Qrcode("mobile-scanner-region");
      scannerRef.current = scanner;
      
      const cameraId = cameras[activeCameraIndex]?.id;
      // Responsive scan box: larger on desktop, mobile-friendly default
      const qrboxSize = window.innerWidth > 768 
        ? { width: 400, height: 260 } 
        : { width: 280, height: 180 };
      const config = { fps: 25, qrbox: qrboxSize };
      
      if (cameraId) {
        log(`Starting with lens: ${cameraId}`);
        await scanner.start({ deviceId: { exact: cameraId } }, config, handleScan, () => {});
      } else {
        log(`Starting with facingMode: ${facingMode}`);
        const mode = facingMode === "environment" ? { facingMode: { exact: "environment" } } : { facingMode: "user" };
        try {
          await scanner.start(mode, config, handleScan, () => {});
        } catch (e) {
          log("Exact mode failed, falling back...");
          await scanner.start({ facingMode }, config, handleScan, () => {});
        }
      }
      
      setIsScanning(true);
      log("✅ Active Scanning Initiated.");
      
      if (cameras.length === 0) {
        setTimeout(refreshCameras, 500);
      }
    } catch (err: any) {
      log(`❌ Scanner Failed: ${err.message || err}`);
      toast.error("Lens Initialization Error. See Diagnostics.");
    }
  };

  const toggleFacingMode = async () => {
    const newMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newMode);
    if (isScanning) {
      await stopScanner();
      setTimeout(startScanner, 300);
    }
  };

  const cycleCamera = async () => {
    if (cameras.length < 2) return toggleFacingMode();
    const nextIndex = (activeCameraIndex + 1) % cameras.length;
    setActiveCameraIndex(nextIndex);
    if (isScanning) {
      await stopScanner();
      setTimeout(startScanner, 300);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      log("Shutting down camera stream...");
      try { await scannerRef.current.stop(); } catch (e) {}
      setIsScanning(false);
    }
  };

  const handleScan = (barcode: string) => {
    // Debounce: prevent duplicate scans within 1.5 seconds
    const now = Date.now();
    if (now - lastScanTime.current < 1500) return;
    lastScanTime.current = now;

    const channel = supabase.channel(`scanner-session:${sessionId}`);
    channel.send({
      type: "broadcast",
      event: "SCAN_RESULT",
      payload: { barcode }
    });
    
    triggerScanFeedback();
    log(`📦 Scanned: ${barcode}`);
  };

  const handleManualJoin = () => {
    if (manualSessionId.length > 5) {
      navigate(`/remote-scanner/${manualSessionId}`);
    }
  };

  return (
    <div ref={containerRef} className={cn(
      "min-h-screen bg-[#07070a] text-white flex flex-col font-sans overflow-hidden",
      isFullscreen && "fixed inset-0 z-[9999]"
    )}>
      {/* Scan Feedback Flash */}
      <AnimatePresence>
        {showFeedbackFlash && (
          <motion.div 
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-primary/20 z-[100] pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-primary/10 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className={cn(
        "p-4 md:p-6 bg-black/40 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between sticky top-0 z-50",
        isFullscreen && "py-2"
      )}>
        <div className="flex items-center gap-3">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-gradient-to-tr from-primary to-orange-600 flex items-center justify-center text-black shadow-lg shadow-primary/20"
          >
            <Smartphone size={18} />
          </motion.div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-tighter italic leading-none">Lumiaxy <span className="text-primary not-italic">Bridge</span></h1>
            <p className="text-[9px] font-black uppercase tracking-widest text-primary/60 mt-0.5">
              {sessionId ? `Session: ${sessionId.slice(0, 8)}` : "Inactive"}
              {scanCount > 0 && <span className="ml-2 text-emerald-500">• {scanCount} scans</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
           {/* Fullscreen Toggle */}
           {sessionId && (
             <button 
               onClick={toggleFullscreen}
               className="p-2 md:p-2.5 rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:text-white transition-all"
               title={isFullscreen ? "Exit Fullscreen" : "Go Fullscreen"}
             >
               {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
             </button>
           )}
           <button 
            onClick={() => setSettingsOpen(!settingsOpen)}
            className={cn("p-2 md:p-2.5 rounded-xl border transition-all", settingsOpen ? "bg-primary border-primary text-black" : "bg-white/5 border-white/10 text-muted-foreground")}
           >
              <SettingsIcon size={16} />
           </button>
           <div className={cn(
            "px-2.5 py-1.5 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest border transition-all",
            status === "online" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : 
            status === "connecting" ? "bg-primary/10 text-primary animate-pulse border-primary/20" :
            "bg-red-500/20 text-red-500 border-red-500/30"
          )}>
            {status}
          </div>
        </div>
      </header>

      <main className={cn(
        "flex-1 p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto custom-scrollbar",
        isFullscreen ? "pb-4" : "pb-32"
      )}>
        {/* Settings Panel */}
        <AnimatePresence>
          {settingsOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-white/[0.03] border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-6 overflow-hidden grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
            >
               <button 
                onClick={() => { setSoundEnabled(!soundEnabled); if (!soundEnabled) playBeep(); }}
                className={cn("h-14 rounded-2xl flex flex-col items-center justify-center gap-1.5 border transition-all", soundEnabled ? "bg-primary/10 border-primary/40 text-primary" : "bg-white/5 border-white/5 text-muted-foreground")}
               >
                  {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  <span className="text-[8px] font-black uppercase tracking-widest">Sound {soundEnabled ? "ON" : "OFF"}</span>
               </button>
               <button 
                onClick={() => { setVibrateEnabled(!vibrateEnabled); if (!vibrateEnabled) triggerVibration(100); }}
                className={cn("h-14 rounded-2xl flex flex-col items-center justify-center gap-1.5 border transition-all", vibrateEnabled ? "bg-primary/10 border-primary/40 text-primary" : "bg-white/5 border-white/5 text-muted-foreground")}
               >
                  {vibrateEnabled ? <Vibrate size={16} /> : <VibrateOff size={16} />}
                  <span className="text-[8px] font-black uppercase tracking-widest">Haptics {vibrateEnabled ? "ON" : "OFF"}</span>
               </button>
               {/* Test Sound */}
               <button 
                onClick={() => { playBeep(); toast.success("🔊 Sound test!"); }}
                className="h-14 rounded-2xl flex flex-col items-center justify-center gap-1.5 border border-white/5 bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10 transition-all"
               >
                  <Activity size={16} />
                  <span className="text-[8px] font-black uppercase tracking-widest">Test Sound</span>
               </button>
               {/* Test Vibration */}
               <button 
                onClick={() => { triggerVibration([100, 50, 100, 50, 200]); toast.success("📳 Vibration test!"); }}
                className="h-14 rounded-2xl flex flex-col items-center justify-center gap-1.5 border border-white/5 bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10 transition-all"
               >
                  <Vibrate size={16} />
                  <span className="text-[8px] font-black uppercase tracking-widest">Test Vibrate</span>
               </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Connection Screen */}
        {!sessionId && (
           <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white/5 border border-white/10 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 space-y-6 text-center max-w-md mx-auto"
           >
              <div className="h-20 w-20 rounded-[2rem] bg-card border border-white/5 flex items-center justify-center text-primary mx-auto shadow-2xl">
                <Camera size={32} />
              </div>
              <div className="space-y-2">
                 <h2 className="text-xl font-black italic tracking-tighter uppercase">Connect Bridge</h2>
                 <p className="text-xs text-muted-foreground max-w-[200px] mx-auto leading-relaxed">Enter the platform session ID to begin synchronization.</p>
              </div>
              <div className="space-y-4 pt-4">
                 <input 
                  className="w-full h-14 bg-black/50 border border-white/10 rounded-2xl px-6 font-mono text-center tracking-[0.2em] text-white outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/20"
                  placeholder="SESSION ID"
                  value={manualSessionId}
                  onChange={e => setManualSessionId(e.target.value)}
                 />
                 <Button 
                  onClick={handleManualJoin}
                  className="w-full h-14 rounded-[1.5rem] bg-primary text-black font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20"
                 >
                    Establish Handshake
                 </Button>
              </div>
           </motion.div>
        )}

        {/* Scanner Area */}
        {sessionId && (
          <div className={cn(
            "space-y-4 md:space-y-6",
            isFullscreen && "flex flex-col h-full"
          )}>
            {/* HTTPS Warning */}
            {!window.isSecureContext && window.location.hostname !== "localhost" && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-br from-amber-500/20 to-red-500/10 border border-amber-500/30 space-y-4 md:space-y-6 shadow-2xl"
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="h-16 w-16 md:h-20 md:w-20 rounded-[1.5rem] md:rounded-[2rem] bg-amber-500 text-black flex items-center justify-center shadow-xl shadow-amber-500/20">
                    <ShieldAlert size={32} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg md:text-xl font-black uppercase tracking-tighter italic">Browser Security Block</h3>
                    <p className="text-[10px] md:text-[11px] text-amber-200/80 leading-relaxed font-bold uppercase tracking-widest">
                      Camera requires HTTPS. Deploy to Vercel or use ngrok.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Scanner Viewport — Responsive: takes full space in fullscreen */}
            <motion.div 
              layout
              className={cn(
                "relative rounded-[2rem] md:rounded-[2.5rem] bg-black border border-white/10 overflow-hidden shadow-2xl",
                isFullscreen 
                  ? "flex-1 min-h-0" 
                  : "aspect-[4/3] md:aspect-video lg:aspect-[21/9]"
              )}
            >
              <div id="mobile-scanner-region" className="w-full h-full [&>video]:object-cover [&>video]:w-full [&>video]:h-full" />
              
              {/* Idle State */}
              {!isScanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md space-y-4 md:space-y-6">
                   <motion.div 
                    animate={{ scale: [1, 1.1, 1] }} 
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/20"
                   >
                      <Zap size={32} className="fill-current md:w-10 md:h-10" />
                   </motion.div>
                   <div className="flex flex-col items-center gap-4 md:gap-6">
                     <Button 
                      onClick={startScanner}
                      className="h-14 md:h-16 px-8 md:px-12 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] md:text-xs hover:bg-primary transition-colors"
                     >
                       <Camera className="h-4 w-4 mr-2" />
                       Initialize Lens
                     </Button>
                     
                     <div className="flex items-center gap-4 md:gap-6">
                       {cameras.length > 1 ? (
                         <button 
                          onClick={cycleCamera}
                          className="text-[9px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors flex items-center gap-2"
                         >
                           <SwitchCamera size={14} /> Cycle Lens ({activeCameraIndex + 1}/{cameras.length})
                         </button>
                       ) : (
                         <button 
                          onClick={toggleFacingMode}
                          className="text-[9px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors flex items-center gap-2"
                         >
                           <SwitchCamera size={14} /> Flip to {facingMode === "environment" ? "Front" : "Back"}
                         </button>
                       )}
                     </div>
                   </div>
                </div>
              )}

              {/* Active Scanning Overlay */}
              {isScanning && (
                <>
                  {/* Scan Line Animation */}
                  <motion.div 
                    initial={{ top: "10%" }}
                    animate={{ top: "90%" }}
                    transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.5, ease: "easeInOut" }}
                    className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent z-10 shadow-[0_0_20px_rgba(var(--primary-rgb),0.8)]"
                  />
                  
                  {/* Corner Markers + Controls */}
                  <div className="absolute inset-0 p-4 md:p-8 flex flex-col justify-between">
                     <div className="flex justify-between items-start">
                        <div className="h-8 w-8 md:h-10 md:w-10 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
                        <div className="flex items-center gap-2">
                          {/* Camera Switch while scanning */}
                          <button 
                            onClick={cameras.length > 1 ? cycleCamera : toggleFacingMode}
                            className="px-3 py-2 bg-black/60 backdrop-blur-md text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-white/20 transition-colors pointer-events-auto"
                          >
                            <SwitchCamera size={12} /> Flip
                          </button>
                          <button 
                            onClick={toggleFullscreen}
                            className="px-3 py-2 bg-black/60 backdrop-blur-md text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-white/20 transition-colors pointer-events-auto"
                          >
                            {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                          </button>
                          <button 
                            onClick={stopScanner}
                            className="px-3 py-2 bg-red-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-2xl pointer-events-auto hover:bg-red-600 transition-colors"
                          >
                            <X size={12} /> Stop
                          </button>
                        </div>
                        <div className="h-8 w-8 md:h-10 md:w-10 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
                     </div>
                     
                     {/* Center instruction */}
                     <div className="flex justify-center">
                        <div className="px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-white/50">
                           Align Barcode Within Frame
                        </div>
                     </div>
                     
                     {/* Bottom corners + scan counter */}
                     <div className="flex justify-between items-end">
                        <div className="h-8 w-8 md:h-10 md:w-10 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
                        {scanCount > 0 && (
                          <div className="px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[9px] font-black text-emerald-400 tracking-widest">
                            {scanCount} SCANS
                          </div>
                        )}
                        <div className="h-8 w-8 md:h-10 md:w-10 border-b-4 border-r-4 border-primary rounded-br-2xl" />
                     </div>
                  </div>
                </>
              )}
            </motion.div>

            {/* Scan Success Feedback — shown below scanner */}
            <AnimatePresence>
              {lastScanned && (
                 <motion.div 
                  initial={{ y: 30, opacity: 0, scale: 0.95 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: -20, opacity: 0, scale: 0.9 }}
                  className="bg-emerald-500 border border-emerald-400 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-2xl shadow-emerald-500/20"
                 >
                    <div className="flex items-center gap-4 md:gap-5">
                       <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-white/20 flex items-center justify-center text-white">
                          <CheckCircle2 size={24} />
                       </div>
                       <div>
                          <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-emerald-100/60 leading-none mb-1">Successfully Synced</p>
                          <h3 className="text-lg md:text-xl font-black italic tracking-tighter uppercase leading-tight">{lastScanned.name}</h3>
                       </div>
                    </div>
                 </motion.div>
              )}
            </AnimatePresence>

            {/* Cart Preview — Hidden in fullscreen to maximize scan area */}
            {!isFullscreen && (
              <div className="space-y-3 md:space-y-4">
                 <div className="flex items-center justify-between px-2">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                       <ShoppingCart size={14} className="text-primary" /> Active Cart
                    </h4>
                    <Badge className="bg-white/5 text-[9px] font-mono border-white/5 rounded-lg px-2 h-6">{cartPreview.length} items</Badge>
                 </div>
                 
                 <div className="space-y-2">
                    {cartPreview.length === 0 ? (
                       <div className="py-12 md:py-16 bg-white/[0.02] border border-dashed border-white/5 rounded-[2rem] md:rounded-[2.5rem] flex flex-col items-center justify-center text-muted-foreground/30 space-y-3">
                          <History size={28} strokeWidth={1} />
                          <p className="text-[9px] font-black uppercase tracking-widest italic">Awaiting Terminal Activity</p>
                       </div>
                    ) : (
                       cartPreview.map((item, i) => (
                          <motion.div 
                            key={i} 
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white/[0.03] border border-white/5 rounded-xl md:rounded-2xl p-3 md:p-4 flex items-center justify-between"
                          >
                             <div className="flex items-center gap-3 md:gap-4">
                                <div className="h-9 w-9 md:h-11 md:w-11 rounded-lg md:rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground border border-white/5">
                                   <Pill size={18} />
                                </div>
                                <div>
                                   <p className="text-sm font-black italic uppercase tracking-tighter leading-none">{item.name}</p>
                                   <p className="text-[9px] font-bold text-primary mt-1 font-mono">Qty: {item.quantity}</p>
                                </div>
                             </div>
                             <p className="font-black text-sm italic leading-none">KES {item.price.toLocaleString()}</p>
                          </motion.div>
                       ))
                    )}
                 </div>
              </div>
            )}

            {/* Diagnostic Terminal — Hidden in fullscreen */}
            {!isFullscreen && (
              <div className="pt-8 md:pt-12 border-t border-white/5 space-y-4 md:space-y-6">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2 text-primary opacity-50">
                        <Activity size={14} />
                        <h4 className="text-[9px] font-black uppercase tracking-[0.3em]">Diagnostics</h4>
                     </div>
                     <Button 
                      onClick={triggerPermissionRequest}
                      variant="link" 
                      className="text-[9px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors"
                     >
                       Force Permission Prompt
                     </Button>
                  </div>
                  
                  <div className="bg-black rounded-xl md:rounded-2xl p-4 md:p-6 border border-white/5 font-mono text-[10px] space-y-1.5 max-h-[180px] overflow-y-auto custom-scrollbar">
                     {debugLog ? debugLog.split('\n').map((line, i) => (
                       <p key={i} className="text-primary/60 leading-relaxed">
                          <span className="text-white/20 select-none mr-3">[{i+1}]</span>
                          {line}
                       </p>
                     )) : (
                       <p className="text-white/10 italic">Awaiting scanner activity...</p>
                     )}
                  </div>

                  <div className="p-4 md:p-6 rounded-xl md:rounded-2xl bg-white/[0.02] border border-white/5 space-y-3 md:space-y-4">
                     <div className="flex items-center gap-2 text-amber-500">
                        <AlertCircle size={14} />
                        <p className="text-[9px] font-black uppercase tracking-widest">Still not prompting?</p>
                     </div>
                     <p className="text-[10px] text-muted-foreground leading-relaxed">
                       Click the **Lock Icon 🔒** in your browser's address bar and ensure "Camera" is set to "Allow".
                     </p>
                  </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer — Hidden in fullscreen */}
      {!isFullscreen && (
        <footer className="p-6 md:p-8 text-center bg-transparent mt-auto sticky bottom-0 pointer-events-none">
           <div className="inline-flex items-center gap-6 opacity-20 transition-opacity hover:opacity-50">
              <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-white" />
              <p className="text-[9px] font-black uppercase tracking-[0.5em] italic">Lumiaxy Enterprise</p>
              <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-white" />
           </div>
        </footer>
      )}
    </div>
  );
}
