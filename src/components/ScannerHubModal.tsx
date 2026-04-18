import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Smartphone, 
  Camera, 
  Keyboard as KeyboardIcon, 
  QrCode,
  CheckCircle2,
  Loader2,
  XCircle,
  Activity
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface ScannerHubModalProps {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
}

type ScanMode = "hardware" | "webcam" | "phone";

export default function ScannerHubModal({ open, onClose, onScan, title = "Scanner Hub" }: ScannerHubModalProps) {
  const [mode, setMode] = useState<ScanMode>("hardware");
  const [sessionId] = useState(() => crypto.randomUUID());
  const [isPaired, setIsPaired] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Realtime pairing listener
  useEffect(() => {
    if (!open || mode !== "phone") return;

    const channel = supabase.channel(`scanner-session:${sessionId}`);
    
    channel
      .on("broadcast", { event: "PAIR_REQUEST" }, (payload) => {
        console.log("Pairing request received:", payload);
        setIsPaired(true);
        toast.success("Phone Scanner Connected");
        // Automatically close the modal after pairing success to let user start scanning
        setTimeout(() => onClose(), 1500);
      })
      .on("broadcast", { event: "SCAN_RESULT" }, (payload) => {
        if (payload.payload.barcode) {
          onScan(payload.payload.barcode);
          toast.success(`Scanned: ${payload.payload.barcode}`, { duration: 1000 });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, mode, sessionId, onScan, onClose]);

  const productionUrl = "https://pharmacy-gamma-green.vercel.app";
  const scannerUrl = `${window.location.hostname === "localhost" ? productionUrl : window.location.origin}/remote-scanner/${sessionId}`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-[#09090b] border-white/5 rounded-[2.5rem] p-0 overflow-hidden shadow-[0_0_100px_rgba(var(--primary-rgb),0.05)] backdrop-blur-3xl">
        <DialogHeader className="p-8 border-b border-white/5 bg-white/[0.02]">
           <div className="flex items-center justify-between">
              <div className="space-y-1">
                 <DialogTitle className="text-2xl font-black italic tracking-tighter text-white uppercase">{title}</DialogTitle>
                 <DialogDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 flex items-center gap-2">
                    <Activity className="h-3 w-3" /> Select scanning bridge
                 </DialogDescription>
              </div>
              <div className="flex gap-1">
                 {(['hardware', 'webcam', 'phone'] as ScanMode[]).map((m) => (
                    <Button
                      key={m}
                      variant="ghost"
                      size="sm"
                      onClick={() => setMode(m)}
                      className={cn(
                        "h-10 px-4 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all",
                        mode === m ? "bg-primary text-black" : "text-muted-foreground hover:bg-white/5"
                      )}
                    >
                      {m}
                    </Button>
                 ))}
              </div>
           </div>
        </DialogHeader>

        <div className="p-10">
           {mode === "hardware" && (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
                 <div className="h-24 w-24 rounded-[2rem] bg-card border border-white/5 flex items-center justify-center text-primary shadow-2xl">
                    <KeyboardIcon size={40} />
                 </div>
                 <div className="space-y-2">
                    <h4 className="text-xl font-black text-white italic uppercase tracking-tight">Handheld Mode</h4>
                    <p className="text-xs text-muted-foreground max-w-[300px] leading-relaxed">
                       Connect your physical USB or Bluetooth scanner. The system will automatically capture inputs.
                    </p>
                 </div>
                 <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-500 tracking-widest uppercase">
                    <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                    Listening for Input
                 </div>
              </div>
           )}

           {mode === "webcam" && (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
                 <div className="h-24 w-24 rounded-[2rem] bg-card border border-white/5 flex items-center justify-center text-primary shadow-2xl">
                    <Camera size={40} />
                 </div>
                 <div className="space-y-2">
                    <h4 className="text-xl font-black text-white italic uppercase tracking-tight">Webcam Scanner</h4>
                    <p className="text-xs text-muted-foreground max-w-[300px] leading-relaxed">
                       Use this computer's camera to scan barcodes directly.
                    </p>
                 </div>
                 <Button className="h-14 px-10 rounded-2xl bg-primary text-black font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 hover:scale-105 transition-transform">
                    Activate Camera
                 </Button>
              </div>
           )}

           {mode === "phone" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                 <div className="flex justify-center p-6 bg-white rounded-[2rem] shadow-2xl scale-95 hover:scale-100 transition-transform cursor-pointer overflow-hidden border-[8px] border-primary/20">
                    {isPaired ? (
                       <div className="h-[200px] flex flex-col items-center justify-center text-black space-y-4">
                          <CheckCircle2 size={64} className="text-emerald-500" />
                          <p className="font-black uppercase tracking-widest text-xs">Phone Connected</p>
                       </div>
                    ) : (
                       <QRCodeSVG value={scannerUrl} size={200} level="H" includeMargin />
                    )}
                 </div>
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <h4 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Phone Bridge</h4>
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Smartphone Integration</p>
                    </div>
                    <ul className="space-y-4">
                       {[
                         { icon: Smartphone, text: "Scan QR with any phone" },
                         { icon: QrCode, text: "Wait for auto-pairing" },
                         { icon: CheckCircle2, text: "Point phone at drug barcode" }
                       ].map((step, i) => (
                          <li key={i} className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
                             <div className="h-8 w-8 rounded-xl bg-white/5 flex items-center justify-center text-primary">
                                <step.icon size={16} />
                             </div>
                             {step.text}
                          </li>
                       ))}
                    </ul>
                    {isConnecting && (
                       <div className="flex items-center gap-3 text-primary animate-pulse py-2">
                          <Loader2 size={16} className="animate-spin" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Awaiting Handshake...</span>
                       </div>
                    )}
                 </div>
              </div>
           )}
        </div>

        <div className="p-8 bg-white/[0.02] border-t border-white/5 flex justify-between items-center">
           <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">
              Lumiaxy Security • 256-Bit Bridge Encryption
           </p>
           <Button variant="ghost" onClick={onClose} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white transition-colors">
              Cancel Session
           </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
