import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/lib/supabase";
import { 
  Smartphone, 
  Settings, 
  History, 
  ShoppingCart, 
  CheckCircle2, 
  AlertCircle,
  Pill,
  Zap,
  Loader2,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ScannedProduct {
  name: string;
  price: number;
  quantity: number;
}

export default function RemoteScanner() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [isScanning, setIsScanning] = useState(false);
  const [isPaired, setIsPaired] = useState(false);
  const [lastScanned, setLastScanned] = useState<any>(null);
  const [cartPreview, setCartPreview] = useState<ScannedProduct[]>([]);
  const [manualSessionId, setManualSessionId] = useState("");
  const [status, setStatus] = useState<"connecting" | "online" | "offline">("connecting");
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase.channel(`scanner-session:${sessionId}`);
    
    channel
      .on("broadcast", { event: "CART_UPDATE" }, (payload) => {
        setCartPreview(payload.payload.items || []);
      })
      .on("broadcast", { event: "SCAN_ACK" }, (payload) => {
        // Desktop acknowledged the scan, show info popup
        setLastScanned(payload.payload.product);
        // Haptic feedback
        if (window.navigator.vibrate) window.navigator.vibrate(100);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // Handshake
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
  }, [sessionId]);

  const startScanner = async () => {
    try {
      const scanner = new Html5Qrcode("mobile-scanner-region");
      scannerRef.current = scanner;
      
      await scanner.start(
        { facingMode: "environment" },
        { fps: 15, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
          handleScan(decodedText);
        },
        () => {}
      );
      setIsScanning(true);
    } catch (err) {
      toast.error("Camera access failed. Check permissions.");
      console.error(err);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop();
      setIsScanning(false);
    }
  };

  const handleScan = (barcode: string) => {
    const channel = supabase.channel(`scanner-session:${sessionId}`);
    channel.send({
      type: "broadcast",
      event: "SCAN_RESULT",
      payload: { barcode }
    });
    // Visual feedback
    if (window.navigator.vibrate) window.navigator.vibrate([50, 50, 50]);
  };

  const handleManualJoin = () => {
    if (manualSessionId.length > 5) {
      window.location.href = `/remote-scanner/${manualSessionId}`;
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col font-sans">
      {/* Header */}
      <div className="p-6 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Smartphone size={20} />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-tighter italic">Scanner <span className="text-primary">Bridge</span></h1>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Branch Session: {sessionId?.slice(0, 8)}</p>
          </div>
        </div>
        <div className={cn(
          "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
          status === "online" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : 
          status === "connecting" ? "bg-primary/10 text-primary animate-pulse border border-primary/20" :
          "bg-red-500/10 text-red-500 border border-red-500/20"
        )}>
          {status.toUpperCase()}
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {!sessionId && (
           <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 space-y-6 animate-fade-in mt-10">
              <div className="space-y-2">
                 <h2 className="text-xl font-black italic tracking-tighter uppercase">Join Manual Session</h2>
                 <p className="text-xs text-muted-foreground">Enter the ID shown on your desktop to begin scanning.</p>
              </div>
              <div className="space-y-4">
                 <input 
                  className="w-full h-14 bg-black/50 border border-white/10 rounded-2xl px-6 font-mono text-center tracking-widest text-white outline-none focus:border-primary/50 transition-colors"
                  placeholder="Paste Session ID..."
                  value={manualSessionId}
                  onChange={e => setManualSessionId(e.target.value)}
                 />
                 <Button 
                  onClick={handleManualJoin}
                  className="w-full h-14 rounded-2xl bg-primary text-black font-black uppercase tracking-widest text-xs"
                 >
                    Join Bridge
                 </Button>
              </div>
           </div>
        )}
        {/* Scanner Viewport */}
        <div className="relative aspect-[4/3] rounded-[2rem] bg-card border border-white/5 overflow-hidden shadow-2xl">
          <div id="mobile-scanner-region" className="w-full h-full" />
          
          {!isScanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm space-y-4">
               <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-primary animate-pulse">
                  <Zap size={32} />
               </div>
               <Button 
                onClick={startScanner}
                className="h-14 px-8 rounded-2xl bg-primary text-black font-black uppercase tracking-widest text-xs"
               >
                 Activate Lens
               </Button>
            </div>
          )}

          {isScanning && (
            <div className="absolute inset-0 pointer-events-none">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-40 border-2 border-primary/50 rounded-2xl">
                  <div className="absolute inset-0 border-[40px] border-[#09090b]/40" />
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
               </div>
            </div>
          )}
        </div>

        {/* Scan Confirmation / Info */}
        {lastScanned && (
           <div className="bg-white/5 border border-primary/20 rounded-[2rem] p-6 animate-in slide-in-from-bottom duration-500">
              <div className="flex items-center gap-4">
                 <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <CheckCircle2 size={24} />
                 </div>
                 <div>
                    <h3 className="text-lg font-black italic tracking-tighter uppercase leading-none">{lastScanned.name}</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mt-1">Confirmed & Added</p>
                 </div>
              </div>
           </div>
        )}

        {/* Live Cart Preview */}
        <div className="space-y-4">
           <div className="flex items-center justify-between px-2">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                 <ShoppingCart size={12} className="text-primary" /> Session Cart
              </h4>
              <Badge variant="outline" className="border-white/5 font-mono text-[9px]">{cartPreview.length} Items</Badge>
           </div>
           
           <div className="space-y-3">
              {cartPreview.length === 0 ? (
                 <div className="py-12 bg-white/[0.02] border border-dashed border-white/5 rounded-[2rem] flex flex-col items-center justify-center text-muted-foreground space-y-2">
                    <History size={24} className="opacity-20" />
                    <p className="text-[9px] font-black uppercase tracking-widest">Awaiting First Scan</p>
                 </div>
              ) : (
                 cartPreview.map((item, i) => (
                    <div key={i} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center justify-between group">
                       <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground border border-white/5 group-hover:border-primary/20 transition-all">
                             <Pill size={18} />
                          </div>
                          <div>
                             <p className="text-xs font-black italic uppercase tracking-tighter">{item.name}</p>
                             <p className="text-[9px] font-bold text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                       </div>
                       <p className="font-black text-sm italic">KES {item.price}</p>
                    </div>
                 ))
              )}
           </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="p-8 text-center bg-transparent">
         <div className="inline-flex items-center gap-4 opacity-30 grayscale contrast-200">
            <span className="h-[1px] w-8 bg-white/50" />
            <p className="text-[9px] font-black uppercase tracking-[0.4em] italic">Lumiaxy Enterprise</p>
            <span className="h-[1px] w-8 bg-white/50" />
         </div>
      </div>

      {/* Sticky Scan Feedback Overlay (Optional) */}
    </div>
  );
}
