import { useEffect, useState, useRef } from "react";
import { localDb, Drug } from "@/lib/db";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Search, Plus, Minus, ShoppingCart, Loader2, Trash2, Pill, CreditCard, Banknote, 
  Smartphone, CheckCircle, AlertCircle, FileUp, ShieldAlert, Receipt, Share2, 
  Database, RefreshCw, UserCircle, QrCode, Info 
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ReceiptModal from "@/components/ReceiptModal";
import EntityIntelligenceModal, { IntelligenceType } from "@/components/EntityIntelligenceModal";
import ScannerHubModal from "@/components/ScannerHubModal";
import { supabase } from "@/lib/supabase";


interface CartItem {
  drug_id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  is_taxable: boolean;
  requires_prescription: boolean;
  is_expired: boolean;
  batch_number: string | null;
}

export default function NewSale() {
  const { user } = useAuth();
  // drugs are fetched via useQuery below
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("rx_active_cart");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load active cart:", e);
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("rx_active_cart", JSON.stringify(cart));
  }, [cart]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [discount, setDiscount] = useState(0);

  // Clinical flow
  const [prescriptionUploaded, setPrescriptionUploaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // M-Pesa STK state
  const [mpesaStep, setMpesaStep] = useState<"idle" | "input" | "waiting" | "confirmed">("idle");
  const [mpesaPhone, setMpesaPhone] = useState("");

  // Receipt state
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [scannerModalOpen, setScannerModalOpen] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [barcodeBuffer, setBarcodeBuffer] = useState("");
  const [lastCharTime, setLastCharTime] = useState(0);

  // Intelligence State
  const [intelOpen, setIntelOpen] = useState(false);
  const [intelData, setIntelData] = useState<any>(null);

  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) { console.error("Audio beep failed", e); }
  };

  // Realtime Scanner Bridge
  useEffect(() => {
    const channel = supabase.channel(`scanner-session:${sessionId}`);
    
    // Broadcast cart updates to the phone
    channel.send({
      type: "broadcast",
      event: "CART_UPDATE",
      payload: { 
        items: cart.map(i => ({ name: i.name, price: i.price, quantity: i.quantity })) 
      }
    });

    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [cart, sessionId]);

  const handleRemoteScan = (barcode: string) => {
    const drug = drugs.find(d => d.barcode === barcode || d.sku === barcode);
    if (drug) {
      addToCart(drug);
      playBeep();
      // Ack back to phone
      supabase.channel(`scanner-session:${sessionId}`).send({
        type: "broadcast",
        event: "SCAN_ACK",
        payload: { product: { name: drug.name, price: drug.price } }
      });
    } else {
      toast.error(`Drug with barcode ${barcode} not found`, { icon: <ShieldAlert className="h-4 w-4" /> });
    }
  };

  const playClick = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) { }
  };

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const queryClient = useQueryClient();

  const { data: drugs = [], isLoading, refetch } = useQuery({
    queryKey: ["drugs"],
    queryFn: () => localDb.drugs.getAll(),
    staleTime: 30000,
  });


  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        if (target.id !== "barcode-scan-input") return;
      }

      const now = Date.now();
      const diff = now - lastCharTime;

      if (diff > 50) {
        setBarcodeBuffer(e.key);
      } else {
        if (e.key === "Enter") {
          const barcode = barcodeBuffer;
          const drug = drugs.find(d => d.barcode === barcode);
          if (drug) {
            if (drug.stock <= 0) {
              toast.error(`${drug.name} is out of stock`);
            } else if (isExpired(drug.expiry_date) && user?.role !== "admin") {
              toast.error("Critical: Cannot sell expired medication. Admin override required.");
            } else {
              addToCart(drug);
              playBeep();
              toast.success(`Scanned: ${drug.name}`, { duration: 1000 });
            }
          }
          setBarcodeBuffer("");
        } else {
          if (e.key.length === 1) setBarcodeBuffer(prev => prev + e.key);
        }
      }
      setLastCharTime(now);
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [barcodeBuffer, lastCharTime, drugs, user]);

  const filteredDrugs = (drugs || []).filter(d =>
    d.is_active && (
      (d.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.generic_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.barcode || "").includes(search)
    )
  );


  const addToCart = (drug: Drug) => {
    const existing = cart.find(c => c.drug_id === drug.id);
    const expired = isExpired(drug.expiry_date);

    if (existing) {
      if (existing.quantity >= drug.stock) { toast.error("Maximum stock reached"); return; }
      setCart(cart.map(c => c.drug_id === drug.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, {
        drug_id: drug.id,
        name: drug.name,
        price: drug.price,
        quantity: 1,
        stock: drug.stock,
        is_taxable: drug.is_taxable,
        requires_prescription: drug.prescription_required,
        is_expired: expired,
        batch_number: drug.batch_number
      }]);
    }
    playClick();
    if (drug.prescription_required) {
      toast.warning(`${drug.name} requires an uploaded prescription`, { icon: <ShieldAlert className="h-4 w-4" /> });
    }
  };

  const updateQty = (drugId: string, delta: number) => {
    setCart(cart.map(c => {
      if (c.drug_id !== drugId) return c;
      const newQty = c.quantity + delta;
      if (newQty <= 0) return c;
      if (newQty > c.stock) { toast.error("Insufficient stock"); return c; }
      return { ...c, quantity: newQty };
    }));
  };

  const removeFromCart = (drugId: string) => {
    const newCart = cart.filter(c => c.drug_id !== drugId);
    setCart(newCart);
    if (!newCart.some(i => i.requires_prescription)) setPrescriptionUploaded(false);
  };

  // Professional Tax Logic (16% VAT)
  const taxableSubtotal = cart.filter(i => i.is_taxable).reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const taxAmount = taxableSubtotal * 0.16;
  const rawSubtotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const totalWithTax = rawSubtotal + taxAmount;
  const finalTotal = Math.max(0, totalWithTax - discount);

  const handleMpesaPayment = async () => {
    let cleanPhone = mpesaPhone.replace(/\s+/g, "");
    if (!cleanPhone.startsWith("254") && cleanPhone.startsWith("0")) { cleanPhone = "254" + cleanPhone.slice(1); }
    if (!cleanPhone.startsWith("254") || cleanPhone.length !== 12) {
      toast.error("Enter a valid Kenyan phone (254... or 07...)");
      return;
    }
    
    setMpesaStep("waiting");
    
    try {
      const response = await fetch("/api/mpesa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: cleanPhone,
          amount: Math.round(finalTotal)
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.info("Prompt sent! Please enter your PIN on your phone.");
        // We still let the user manually confirm for now, 
        // as Safaricom callbacks require a public URL.
      } else {
        throw new Error(data.error || "Failed to initiate M-Pesa payment");
      }
    } catch (error: any) {
      console.error("M-Pesa error:", error);
      toast.error(error.message || "Failed to initiate payment");
      setMpesaStep("input");
    }
  };


  const handleSubmit = async () => {
    if (cart.length === 0) { toast.error("Your cart is empty"); return; }
    if (!user) return;

    // Clinical Logic Check
    const needsPrescription = cart.some(i => i.requires_prescription);
    if (needsPrescription && !prescriptionUploaded) {
      toast.error("Prescription required for clinical items", {
        description: "Please upload the prescription document to proceed."
      });
      return;
    }

    if (paymentMethod === "mpesa" && mpesaStep !== "confirmed") {
      if (mpesaStep === "idle") setMpesaStep("input");
      toast.error("Please complete M-Pesa payment first");
      return;
    }

    setSaving(true);
    setSyncing(true);
    // Mandatory sync simulation for visual confirmation
    await new Promise(r => setTimeout(r, 1200));

    const { data: sale, error } = await localDb.sales.create({
      seller_id: user.id,
      total_amount: finalTotal,
      tax_amount: taxAmount,
      discount_total: discount,
      payment_method: paymentMethod,
      customer_name: customerName || null,
      customer_phone: customerPhone || (paymentMethod === "mpesa" ? mpesaPhone : null),
      notes: null,
      prescription_url: prescriptionUploaded ? "simulated-upload-path" : null,
      status: "completed",
      void_reason: null
    }, cart.map(c => ({
      drug_id: c.drug_id,
      quantity: c.quantity,
      unit_price: c.price,
      tax_amount: c.is_taxable ? (c.price * c.quantity * 0.16) : 0,
      total_price: c.price * c.quantity,
    })));

    if (error) {
      toast.error(error.message);
    } else {
      const now = new Date();
      setReceiptData({
        receiptNo: sale?.id?.toUpperCase().slice(0, 10) || "RX-GEN",
        date: now.toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" }),
        time: now.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" }),
        sellerName: user.full_name,
        customerName: customerName || "Walk-in Customer",
        customerPhone: customerPhone || (paymentMethod === "mpesa" ? mpesaPhone : ""),
        paymentMethod: paymentMethod,
        items: cart.map(c => ({
          name: c.name,
          quantity: c.quantity,
          unit_price: c.price,
          total_price: c.price * c.quantity,
          is_taxable: c.is_taxable,
          batch_number: c.batch_number
        })),
        taxAmount,
        discount,
        subtotal: rawSubtotal,
        total: finalTotal,
      });
      setReceiptOpen(true);
      setCart([]);
      localStorage.removeItem("rx_active_cart");
      setCustomerName("");
      setCustomerPhone("");
      setMpesaPhone("");
      setMpesaStep("idle");
      setPrescriptionUploaded(false);
      queryClient.invalidateQueries({ queryKey: ["drugs"] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    }

    setSaving(false);
    setSyncing(false);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <ShoppingCart className="h-4 w-4" /> Point of Sale
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white italic uppercase">
            Checkout
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">Process sales, track inventory, and generate receipts</p>
        </div>
        <div className="flex h-12 items-center gap-4 px-4 rounded-2xl bg-card dark:bg-white/5 border border-border dark:border-white/10">
           <Button 
            variant="ghost" 
            onClick={() => setScannerModalOpen(true)}
            className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest hover:bg-primary/10 rounded-xl"
           >
              <QrCode size={16} /> Link Scanner
           </Button>
           <div className="h-6 w-px bg-border dark:bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary glow-primary animate-pulse" />
            <span className="text-[10px] font-black text-foreground dark:text-white uppercase tracking-[0.2em]">{user?.role} Active</span>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="flex gap-4">
            <div className="relative group flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                placeholder="Find medicine (Name, Formula, Barcode)..."
                className="pl-12 h-14 rounded-2xl bg-card dark:bg-white/5 border-border dark:border-white/10 text-lg transition-all focus:bg-white/10"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-3 flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[400px]">
            {isLoading ? (
              <div className="text-center py-20 premium-card">
                <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground uppercase font-black text-[10px] tracking-widest">Loading Inventory...</p>
              </div>
            ) : filteredDrugs.length === 0 ? (
              <div className="text-center py-20 premium-card">
                <Pill className="h-12 w-12 text-muted-foreground/10 mx-auto mb-4" />
                <p className="text-muted-foreground">Inventory depletion or no matching results</p>
              </div>

            ) : filteredDrugs.map((drug, i) => {
              const expired = isExpired(drug.expiry_date);

              return (
                <div
                  key={drug.id}
                  onClick={() => {
                    setIntelData(drug);
                    setIntelOpen(true);
                  }}
                  className={cn(
                    "group flex items-center justify-between premium-card !p-5 transition-all text-left relative overflow-hidden active:scale-[0.98] hover-glow-intel cursor-pointer",
                    expired && "bg-red-500/[0.03] border-red-500/20 grayscale-[0.8] opacity-70",
                    drug.stock <= 0 && "opacity-60 grayscale",
                    !expired && drug.stock > 0 && "hover:border-primary/40"
                  )}
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="flex items-center gap-4 relative z-10 flex-1">
                    <div
                      className={cn(
                        "flex items-center gap-4 text-left flex-1"
                      )}
                    >
                      <div className={cn(
                        "flex h-14 w-14 items-center justify-center rounded-2xl border transition-transform group-hover:scale-110",
                        expired ? "bg-red-500/10 text-red-500 border-red-500/20" :
                          drug.stock <= 0 ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                            "bg-primary/10 text-primary border-primary/20"
                      )}>
                        {drug.prescription_required ? <ShieldAlert className="h-7 w-7" /> : <Pill className="h-7 w-7" />}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-lg text-foreground dark:text-white transition-colors tracking-tight">{drug.name}</p>
                          {expired ? (
                            <Badge className="bg-red-500 text-foreground dark:text-white text-[8px] h-4 font-black px-1.5">EXPIRED</Badge>
                          ) : drug.stock <= 0 ? (
                            <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 text-[8px] h-4 font-black px-1.5">FINISHED</Badge>
                          ) : drug.is_taxable && (
                            <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[9px] font-black px-1.5 h-4">TAX</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          <span className={cn((drug.stock <= (drug.reorder_level || 10) || expired) && "text-red-500")}>{drug.stock} {drug.unit} REMAINING</span>

                          <span className="opacity-20">•</span>
                          <span>{drug.category}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-6 relative z-10">
                    <div>
                      <p className="text-xl font-black text-foreground dark:text-white italic tracking-tighter tabular-nums px-2">KES {drug.price.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Dispense Unit</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!expired && drug.stock > 0) addToCart(drug);
                      }}
                      disabled={(expired || drug.stock <= 0) && user?.role !== "admin"}
                      className={cn(
                        "h-12 w-12 flex items-center justify-center rounded-2xl bg-primary/10 transition-all border border-primary/20 active:scale-95 text-primary hover:bg-primary hover:text-black",
                        expired && "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-foreground dark:text-white",
                        (expired || drug.stock <= 0) && user?.role !== "admin" && "cursor-not-allowed opacity-50 hover:bg-transparent"
                      )}
                      title="Add to Cart"
                    >
                      {expired && user?.role === "admin" ? <ShieldAlert className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
                    </button>
                  </div>
                  {expired && <div className="absolute top-0 right-0 p-2 bg-red-500/20 rounded-bl-xl text-[8px] font-black text-red-500 uppercase tracking-widest">PPB Warning</div>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="glass-panel rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden sticky top-8 border-border dark:border-white/5 shadow-2xl">
            <div className="p-4 md:p-8 bg-white/[0.04] border-b border-border dark:border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-primary/20 text-primary border border-primary/20">
                    <ShoppingCart className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground dark:text-white tracking-tight">Checkout Cart</h2>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-black opacity-50">{cart.length} SKUs Identified</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setCart([])} className="h-10 w-10 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl">
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="p-4 md:p-8 space-y-6">
              {cart.length === 0 ? (
                <div className="py-16 text-center space-y-4 opacity-30">
                  <div className="h-20 w-20 bg-card dark:bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto border border-border dark:border-white/10">
                    <ShoppingCart className="h-10 w-10" />
                  </div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-foreground dark:text-white">Cart Awaiting Scan</p>
                </div>
              ) : (
                <div className="space-y-4 flex-1 overflow-y-auto pr-3 custom-scrollbar min-h-[200px]">
                  {cart.map(item => (
                    <div key={item.drug_id} className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                      item.is_expired ? "bg-red-500/10 border-red-500/30" : "bg-white/[0.03] border-border dark:border-white/5 hover:border-white/20"
                    )}>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground dark:text-white truncate text-base">{item.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold mt-1">
                          <span className="text-primary">KES {item.price.toLocaleString()}</span>
                          <span className="opacity-20">|</span>
                          <span>Qty: {item.quantity}</span>
                          {item.requires_prescription && <ShieldAlert className="h-3 w-3 text-amber-500" />}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-black/50 border border-border dark:border-white/10">
                          <button onClick={() => updateQty(item.drug_id, -1)} className="p-1 hover:text-primary transition-colors"><Minus className="h-4 w-4" /></button>
                          <span className="w-6 text-center text-lg font-black text-foreground dark:text-white tabular-nums">{item.quantity}</span>
                          <button onClick={() => updateQty(item.drug_id, 1)} className="p-1 hover:text-primary transition-colors"><Plus className="h-4 w-4" /></button>
                        </div>
                        <button onClick={() => removeFromCart(item.drug_id)} className="p-2 text-muted-foreground hover:text-red-500 transition-colors"><Trash2 className="h-5 w-5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Prescription Upload Section */}
              {cart.some(i => i.requires_prescription) && (
                <div className={cn(
                  "p-5 rounded-3xl border-2 border-dashed transition-all space-y-4",
                  prescriptionUploaded ? "bg-green-500/5 border-green-500/30" : "bg-amber-500/5 border-amber-500/30 animate-pulse-slow"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileUp className={cn("h-6 w-6", prescriptionUploaded ? "text-green-500" : "text-amber-500")} />
                      <div>
                        <p className="text-sm font-bold text-foreground dark:text-white">Prescription Requirement</p>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{prescriptionUploaded ? "Verified & Attached" : "Action Required"}</p>
                      </div>
                    </div>
                    {!prescriptionUploaded && (
                      <Button
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-xl bg-amber-500 text-black font-black text-[10px] uppercase h-9 px-4"
                      >
                        Upload Prescription
                      </Button>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={() => { setPrescriptionUploaded(true); toast.success("Prescription captured and attached"); }}
                  />
                </div>
              )}

              <div className="space-y-4 pt-6 mt-6 border-t border-border dark:border-white/5">
                <div className="flex items-center justify-between px-1">
                   <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Customer Details</Label>
                   {(customerName || customerPhone) && (
                     <Button 
                       variant="ghost" 
                       onClick={() => {
                         setIntelData({ name: customerName, phone: customerPhone });
                         setIntelOpen(true);
                       }}
                       className="h-6 text-[8px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-400 hover:bg-indigo-500/10 gap-1.5"
                     >
                        <UserCircle className="h-3.5 w-3.5" /> View Customer History
                     </Button>
                   )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Input
                      placeholder="Customer Name"
                      className="h-11 rounded-xl bg-white/5 border-white/5 text-xs font-bold italic"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      placeholder="Phone / ID Number"
                      className="h-11 rounded-xl bg-white/5 border-white/5 text-xs font-bold italic"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Method of Settlement</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "cash", icon: Banknote, label: "Cash" },
                      { id: "mpesa", icon: Smartphone, label: "M-Pesa" },
                      { id: "card", icon: CreditCard, label: "Bank Card" }
                    ].map(method => (
                      <button
                        key={method.id}
                        onClick={() => { setPaymentMethod(method.id); if (method.id === "mpesa") setMpesaStep("input"); else setMpesaStep("idle"); }}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                          paymentMethod === method.id
                            ? "bg-primary/20 border-primary shadow-[0_0_20px_rgba(16,185,129,0.1)] text-primary"
                            : "bg-card dark:bg-white/5 border-border dark:border-white/10 text-muted-foreground hover:bg-white/10"
                        )}
                      >
                        <method.icon className="h-6 w-6" />
                        <span className="text-[9px] font-black uppercase tracking-widest">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {paymentMethod === "mpesa" && mpesaStep !== "idle" && (
                  <div className="p-5 rounded-[2rem] bg-green-500/5 border border-green-500/20 space-y-4 animate-fade-in shadow-inner">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-green-500">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-ping" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Safaricom STK Pipeline</p>
                      </div>
                      <Receipt className="h-4 w-4 text-green-600" />
                    </div>

                    {mpesaStep === "input" && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="07XX-XXX-XXX"
                          className="h-12 rounded-xl bg-card dark:bg-white/5 border-green-500/20 text-foreground dark:text-white font-mono text-center flex-1"
                          value={mpesaPhone}
                          onChange={e => setMpesaPhone(e.target.value)}
                        />
                        <Button
                          onClick={handleMpesaPayment}
                          className="h-12 px-6 rounded-xl bg-green-600 hover:bg-green-700 text-foreground dark:text-white font-black uppercase text-[10px] tracking-widest"
                        >
                          Request
                        </Button>
                      </div>
                    )}

                    {mpesaStep === "waiting" && (
                      <div className="flex flex-col items-center py-4 gap-4">
                        <div className="text-center space-y-2">
                          <p className="text-sm font-bold text-foreground dark:text-white italic">Confirm Prompt on Handset</p>
                          <p className="text-[10px] text-muted-foreground font-medium">STK Push dispatched to {mpesaPhone}</p>
                        </div>
                        <Button
                          onClick={() => setMpesaStep("confirmed")}
                          className="w-full h-11 rounded-xl bg-green-500 text-black font-black uppercase text-[10px] tracking-widest shadow-xl shadow-green-500/20"
                        >
                          I've Received Payment Confirmation
                        </Button>
                      </div>
                    )}

                    {mpesaStep === "confirmed" && (
                      <div className="flex items-center justify-center gap-3 py-2 text-green-500">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-xs font-black uppercase tracking-widest underline decoration-green-500/30 underline-offset-4">Verified Transaction</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-8 border-t border-border dark:border-white/10 space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-muted-foreground font-bold text-xs uppercase tracking-widest px-2">
                    <span>Retail Subtotal</span>
                    <span className="text-foreground dark:text-white">KES {rawSubtotal.toLocaleString()}</span>
                  </div>
                  {taxAmount > 0 && (
                    <div className="flex justify-between text-amber-500/80 font-bold text-xs uppercase tracking-widest px-2">
                      <span className="flex items-center gap-1.5"><Receipt className="h-3.5 w-3.5" /> VAT Compliance (16%)</span>
                      <span>+ KES {taxAmount.toLocaleString()}</span>
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="flex justify-between text-primary font-bold text-xs uppercase tracking-widest px-2">
                      <span>Professional Discount</span>
                      <span>- KES {discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center bg-white/[0.03] p-6 rounded-3xl border border-border dark:border-white/10 mt-4 shadow-inner">
                    <div>
                      <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-1">Total Amount</h3>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs font-bold text-muted-foreground">KES</span>
                        <span key={finalTotal} className="text-4xl font-black tracking-tighter text-foreground dark:text-white glow-primary animate-cart-pulse">{finalTotal.toLocaleString()}</span>
                      </div>
                    </div>
                    <Button
                      className="h-14 px-8 rounded-2xl bg-primary text-black font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.05] active:scale-[0.95] transition-all"
                      onClick={handleSubmit}
                      disabled={cart.length === 0 || saving || (paymentMethod === "mpesa" && mpesaStep !== "confirmed")}
                    >
                      {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="flex items-center gap-2"><CheckCircle className="h-5 w-5" /> Complete Sale</div>}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {syncing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#09090B]/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="premium-card max-w-sm w-full p-10 flex flex-col items-center text-center space-y-6">
            <div className="relative">
              <div className="h-20 w-20 rounded-[2rem] bg-primary/10 flex items-center justify-center border border-primary/20">
                <Database className="h-10 w-10 text-primary animate-pulse" />
              </div>
              <RefreshCw className="absolute -top-2 -right-2 h-8 w-8 text-accent animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-foreground dark:text-white italic">Processing Sale</h3>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Updating Inventory & Saving Transaction...</p>
            </div>
            <div className="w-full h-1.5 bg-card dark:bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-primary animate-sync-bar" />
            </div>
          </div>
        </div>
      )}

      <ReceiptModal
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        data={receiptData}
      />

      <EntityIntelligenceModal
        open={intelOpen}
        onClose={() => setIntelOpen(false)}
        type="drug"
        data={intelData}
      />
      <ScannerHubModal 
        open={scannerModalOpen} 
        onClose={() => setScannerModalOpen(false)} 
        onScan={handleRemoteScan}
        title="POS Checkout Scanner"
      />
    </div>
  );
}
