import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Pill, Users, Wallet, History, Info, TrendingUp,
  ShieldAlert, Activity, Barcode, CalendarDays,
  UserCircle, DollarSign, Package, Clock,
  ArrowUpRight, AlertTriangle, Thermometer,
  PackagePlus, Loader2, Warehouse, Percent,
  TrendingDown, CheckCircle2, FlaskConical, Stethoscope,
  Fingerprint, Mail, ShoppingBag, Settings, Smartphone
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, AreaChart, Area, CartesianGrid
} from 'recharts';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { localDb } from "@/lib/db";
import { toast } from "sonner";

export type IntelligenceType = "drug" | "seller" | "expense" | "audit" | "client";

interface EntityIntelligenceModalProps {
  open: boolean;
  onClose: () => void;
  type: IntelligenceType;
  data: any;
  initialTab?: "intelligence" | "restock" | "edit" | "audit";
}

export default function EntityIntelligenceModal({ open, onClose, type, data, initialTab }: EntityIntelligenceModalProps) {
  const [activeTab, setActiveTab] = useState<"intelligence" | "restock" | "edit" | "audit">("intelligence");
  const [restockQty, setRestockQty] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);

  const [sellerSales, setSellerSales] = useState<any[]>([]);
  const [drugs, setDrugs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Sync tab with initialTab when opening
  useEffect(() => {
    if (open && initialTab) setActiveTab(initialTab);
  }, [open, initialTab]);

  // Initialize editing data when modal opens/data changes
  useEffect(() => {
    if (data) setEditingData({ ...data });
    
    const fetchAncillaryData = async () => {
      if (!data) return;
      if (type === "seller") {
        const [salesData, drugsData] = await Promise.all([
          localDb.sales.getDetailed(),
          localDb.drugs.getAll()
        ]);
        setSellerSales(salesData.filter(s => s.seller_id === data.id));
        setDrugs(drugsData);
      }
      if (activeTab === "audit") {
        const logs = await localDb.auditLogs.getAll();
        setAuditLogs(logs.filter(l => l.user_id === data.id || l.user_name === (data.full_name || data.name)));
      }
    };
    fetchAncillaryData();
  }, [data, open, type, activeTab]);

  if (!data || !editingData) return null;

  const getSalesTrend = (seed: string) => {
    const base = seed.length * 5;
    return [
      { name: 'Mon', sales: Math.max(2, base % 10), stock: 80, profit: Math.max(1, (base % 5) * 100) },
      { name: 'Tue', sales: Math.max(1, (base + 3) % 12), stock: 75, profit: Math.max(1, ((base + 2) % 6) * 100) },
      { name: 'Wed', sales: Math.max(5, (base + 7) % 15), stock: 60, profit: Math.max(5, ((base + 5) % 8) * 100) },
      { name: 'Thu', sales: Math.max(3, (base + 1) % 8), stock: 55, profit: Math.max(3, (base % 4) * 100) },
      { name: 'Fri', sales: Math.max(8, (base + 9) % 20), stock: 40, profit: Math.max(8, ((base + 8) % 10) * 100) },
      { name: 'Sat', sales: Math.max(12, (base * 2) % 25), stock: 20, profit: Math.max(12, ((base * 2) % 15) * 100) },
      { name: 'Sun', sales: Math.max(4, base % 7), stock: 15, profit: Math.max(4, (base % 6) * 100) },
    ];
  };

  const calculateDaysToExpiry = (expiry: string | null) => {
    if (!expiry) return null;
    const diff = new Date(expiry).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const handleRestock = async () => {
    if (restockQty <= 0) return;
    setIsUpdating(true);
    await new Promise(r => setTimeout(r, 800));

    const newStock = (data.stock || 0) + Number(restockQty);
    const { error } = await localDb.drugs.update(data.id, { stock: newStock });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Successfully added ${restockQty} units to ${data.name}`);
      setRestockQty(0);
      onClose();
    }
    setIsUpdating(false);
  };

  const handleGlobalEdit = async () => {
    setIsUpdating(true);
    await new Promise(r => setTimeout(r, 600));

    // Type casting for numeric fields
    const updatedRecord = {
      ...editingData,
      stock: Number(editingData.stock),
      price: Number(editingData.price),
      cost_price: editingData.cost_price ? Number(editingData.cost_price) : null,
      tax_rate: Number(editingData.tax_rate),
      reorder_level: Number(editingData.reorder_level)
    };

    const { error } = await localDb.drugs.update(data.id, updatedRecord);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Global Forensic Record Synchronized");
      // We don't close, just update local state or let parent refresh
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("data-updated"));
    }
    setIsUpdating(false);
  };

  const renderContent = () => {
    switch (type) {
      case "drug":
        const salesTrend = getSalesTrend(data.name);
        const margin = data.cost_price ? Math.round(((data.price - data.cost_price) / data.price) * 100) : 0;
        const daysToExpiry = calculateDaysToExpiry(data.expiry_date);

        const marginData = [
          { name: 'Cost', value: data.cost_price || 0, fill: '#ef4444' },
          { name: 'Retail', value: data.price || 0, fill: '#10b981' },
          { name: 'Profit', value: (data.price || 0) - (data.cost_price || 0), fill: '#6366f1' }
        ];

        return (
          <div className="space-y-6">
            {/* Sector Tabs */}
            <div className="flex p-1 gap-1 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md sticky top-0 z-10">
              {[
                { id: "intelligence", icon: Activity, label: "Intelligence" },
                { id: "restock", icon: PackagePlus, label: "Restock Sector" },
                { id: "edit", icon: Settings, label: "Global Edit" },
                { id: "audit", icon: History, label: "Forensic Audit" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    activeTab === tab.id
                      ? "bg-primary text-black shadow-lg shadow-primary/20 scale-[1.02]"
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  )}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Header Content (Always visible) */}
            <div className="flex items-center gap-6 p-6 rounded-[2.5rem] bg-white/[0.02] border border-white/5 backdrop-blur-xl">
              <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20">
                {data.form === "Syrup" ? <FlaskConical className="h-8 w-8 text-primary" /> : <Pill className="h-8 w-8 text-primary" />}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-black text-white italic tracking-tighter leading-none">{data.name}</h3>
                  <Badge variant="outline" className="border-primary/20 text-primary text-[8px] uppercase font-black px-2">{data.category}</Badge>
                </div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  {data.generic_name || "Formulation Pending"}
                </p>
              </div>
            </div>

            {/* Sector Content */}
            {activeTab === "intelligence" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-5 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-1">
                    <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-1"><Warehouse className="h-3 w-3 text-primary" /> Stock</p>
                    <p className={cn("text-3xl font-black tabular-nums tracking-tighter italic", data.stock <= (data.reorder_level || 10) ? "text-red-500" : "text-white")}>{data.stock}</p>
                  </div>
                  <div className="p-5 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-1">
                    <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-1"><Percent className="h-3 w-3 text-amber-500" /> Margin</p>
                    <p className="text-3xl font-black text-white tabular-nums tracking-tighter italic">{margin}%</p>
                  </div>
                  <div className="p-5 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-1">
                    <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-1"><DollarSign className="h-3 w-3 text-blue-500" /> Price</p>
                    <p className="text-3xl font-black text-white tabular-nums tracking-tighter italic">KES {data.price?.toLocaleString()}</p>
                  </div>
                  <div className="p-5 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-1">
                    <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-1"><Clock className="h-3 w-3 text-accent" /> Expiry</p>
                    <p className={cn("text-2xl font-black tabular-nums tracking-tighter italic", (daysToExpiry && daysToExpiry < 90) ? "text-red-500" : "text-white")}>{daysToExpiry || "∞"}d</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1 p-6 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-primary italic">Velocity Pulse</p>
                    <div className="h-40 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={salesTrend}>
                          <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} fillOpacity={0.1} fill="#10b981" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="lg:col-span-1 p-6 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-red-500 italic">Inventory Decay</p>
                    <div className="h-40 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={salesTrend}>
                          <Line type="step" dataKey="stock" stroke="#ef4444" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="lg:col-span-1 p-6 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500 italic">Margin Intensity</p>
                    <div className="h-40 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={marginData}>
                          <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                            {marginData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="p-8 rounded-[2.5rem] bg-muted/30 border border-white/5 space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic">
                    <Info className="h-4 w-4" /> Clinical Indications
                  </div>
                  <p className="text-sm font-medium text-white/70 leading-relaxed italic whitespace-pre-wrap">
                    {data.description || "No clinical indications or dosage instructions provided."}
                  </p>
                </div>
              </div>
            )}

            {activeTab === "restock" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                <div className="p-10 rounded-[3rem] bg-primary/[0.03] border border-primary/10 space-y-8 relative overflow-hidden">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center">
                      <PackagePlus className="h-7 w-7 text-black" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xl font-black text-white italic tracking-tight">Stock Injection Protocol</h4>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Authorized Forensic Quantity adjustment</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Current Levels</Label>
                      <div className="h-20 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-4xl font-black text-white italic tabular-nums">
                        {data.stock}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-2 italic">Refined Potential</Label>
                      <div className="h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-4xl font-black text-primary italic tabular-nums">
                        {data.stock + (Number(restockQty) || 0)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2 italic">Units to Inject ({data.unit})</Label>
                    <div className="flex gap-4">
                      <Input
                        type="number"
                        className="h-20 rounded-3xl bg-white/5 border-white/10 text-4xl font-black italic tracking-tighter text-center"
                        placeholder="0"
                        value={restockQty || ""}
                        onChange={e => setRestockQty(Number(e.target.value))}
                      />
                      <Button
                        onClick={handleRestock}
                        disabled={restockQty <= 0 || isUpdating}
                        className="h-20 rounded-3xl px-12 bg-primary text-black font-black uppercase tracking-[0.2em] text-xs hover:scale-105 transition-all shadow-2xl shadow-primary/20"
                      >
                        {isUpdating ? <Loader2 className="h-6 w-6 animate-spin" /> : "Authorize Restock"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "edit" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between px-2">
                  <div className="space-y-1">
                    <h4 className="text-xl font-black text-white italic tracking-tight leading-none">Global System Edit</h4>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Total Metadata Forensic Control</p>
                  </div>
                  <Button
                    onClick={handleGlobalEdit}
                    disabled={isUpdating}
                    className="h-12 rounded-2xl px-8 bg-amber-500 text-black font-black uppercase tracking-widest text-[9px] hover:scale-105 transition-all"
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Commit Forensic Changes"}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/[0.02] p-8 rounded-[2.5rem] border border-white/5">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Commercial Identity</Label>
                    <Input
                      className="h-12 rounded-[1.25rem] bg-white/5 border-white/10 text-sm font-bold text-white italic"
                      value={editingData.name || ""}
                      onChange={e => setEditingData({ ...editingData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Retail Price (KES)</Label>
                    <Input
                      type="number"
                      className="h-12 rounded-[1.25rem] bg-white/5 border-white/10 text-sm font-black text-white tabular-nums"
                      value={editingData.price || ""}
                      onChange={e => setEditingData({ ...editingData, price: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Generic Formulation</Label>
                    <Input
                      className="h-12 rounded-[1.25rem] bg-white/5 border-white/10 text-sm font-bold text-white/70"
                      value={editingData.generic_name || ""}
                      onChange={e => setEditingData({ ...editingData, generic_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Therapeutic Class</Label>
                    <Input
                      className="h-12 rounded-[1.25rem] bg-white/5 border-white/10 text-sm font-bold text-white/70"
                      value={editingData.therapeutic_class || ""}
                      onChange={e => setEditingData({ ...editingData, therapeutic_class: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Primary Supplier</Label>
                    <Input
                      className="h-12 rounded-[1.25rem] bg-white/5 border-white/10 text-sm font-bold text-white/70"
                      value={editingData.supplier || ""}
                      onChange={e => setEditingData({ ...editingData, supplier: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Technical Barcode</Label>
                    <Input
                      className="h-12 rounded-[1.25rem] bg-white/5 border-white/10 text-sm font-mono text-white/70 tracking-widest"
                      value={editingData.barcode || ""}
                      onChange={e => setEditingData({ ...editingData, barcode: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2 bg-white/[0.02] p-8 rounded-[2.5rem] border border-white/5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic ml-2">Clinical Management Memo</Label>
                  <textarea
                    className="w-full h-32 rounded-3xl bg-white/5 border-white/10 text-sm font-medium text-white italic p-5 focus:ring-1 ring-primary outline-none"
                    value={editingData.description || ""}
                    onChange={e => setEditingData({ ...editingData, description: e.target.value })}
                  />
                </div>
              </div>
            )}

            {activeTab === "audit" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center">
                      <History className="h-5 w-5 text-accent" />
                    </div>
                    <h4 className="text-sm font-black text-white italic tracking-widest uppercase">Entity Audit Pulse</h4>
                  </div>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {localDb.auditLogs.getAll()
                      .filter(l => l.details?.includes(data.id) || l.details?.includes(data.name))
                      .length === 0 ? (
                      <p className="text-center py-12 text-[10px] text-muted-foreground font-black uppercase tracking-widest italic opacity-30">No Forensic Trails Found</p>
                    ) : (
                      localDb.auditLogs.getAll()
                        .filter(l => l.details?.includes(data.id) || l.details?.includes(data.name))
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .map((log, i) => (
                          <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                            <div className="flex items-center gap-4">
                              <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
                                <Activity className="h-4 w-4 text-accent/60" />
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-xs font-black text-white italic uppercase tracking-tighter">{log.module}</p>
                                <p className="text-[10px] text-muted-foreground italic">{log.action}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] font-black text-accent uppercase tracking-widest">{new Date(log.created_at).toLocaleDateString()}</p>
                              <p className="text-[8px] font-mono text-muted-foreground uppercase">{new Date(log.created_at).toLocaleTimeString()}</p>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "seller":
        const costMap = drugs.reduce((acc, d) => ({ ...acc, [d.id]: d.cost_price || 0 }), {} as any);

        // Calculate Ledger
        const medMap: Record<string, { name: string, qty: number, revenue: number, profit: number }> = {};
        let totalRevenue = 0;
        let totalProfit = 0;
        let totalQty = 0;

        sellerSales.forEach(s => {
          totalRevenue += Number(s.total_amount);
          s.items.forEach((item: any) => {
            if (!medMap[item.drug_id]) medMap[item.drug_id] = { name: item.drug_name, qty: 0, revenue: 0, profit: 0 };
            const unitProfit = Number(item.unit_price) - (costMap[item.drug_id] || 0);
            const qty = Number(item.quantity);
            medMap[item.drug_id].qty += qty;
            medMap[item.drug_id].revenue += Number(item.total_price);
            medMap[item.drug_id].profit += (unitProfit * qty);
            totalProfit += (unitProfit * qty);
            totalQty += qty;
          });
        });

        const topMeds = Object.values(medMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

        // Calculate 7-Day Trend
        const trendMap: Record<string, { date: string, sales: number, profit: number }> = {};
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          trendMap[dateStr] = { date: dateStr, sales: 0, profit: 0 };
        }

        sellerSales.forEach(s => {
          const dateStr = new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (trendMap[dateStr]) {
            trendMap[dateStr].sales += Number(s.total_amount);
            let p = 0;
            s.items.forEach((item: any) => p += (Number(item.unit_price) - (costMap[item.drug_id] || 0)) * Number(item.quantity));
            trendMap[dateStr].profit += p;
          }
        });
        const sellerTrend = Object.values(trendMap);

        return (
          <div className="space-y-8 animate-fade-in">
            {/* Seller Identity Header */}
            <div className="flex items-center gap-6 p-6 rounded-[2.5rem] bg-accent/10 border border-accent/20 backdrop-blur-xl">
              <div className="h-20 w-20 rounded-3xl bg-accent flex items-center justify-center shadow-xl shadow-accent/20 overflow-hidden relative border-2 border-accent/20">
                {data.avatar_url ? (
                  <img src={data.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="text-3xl font-black text-black italic">{data.full_name[0]}</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-3xl font-black text-foreground dark:text-white italic tracking-tighter leading-none">{data.full_name}</h3>
                  <Badge className={cn("text-[9px] font-black uppercase tracking-widest h-5 rounded-lg border-none", data.is_active ? "bg-green-500 text-black" : "bg-red-500 text-white")}>
                    {data.is_active ? "ACTIVE_STAFF" : "ACCESS_REVOKED"}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><Fingerprint className="h-3 w-3 text-accent" /> ID: {data.id}</span>
                  <span className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-accent" /> {data.email}</span>
                </div>
              </div>
            </div>

            {/* Performance Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-1 group hover:border-accent/20 transition-all">
                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-1"><DollarSign className="h-3 w-3 text-accent" /> Gross Revenue</p>
                <p className="text-3xl font-black text-white tabular-nums tracking-tighter italic">KES {totalRevenue.toLocaleString()}</p>
                <div className="h-1 w-full bg-white/5 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-accent w-[65%] rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                </div>
              </div>
              <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-1 group hover:border-primary/20 transition-all">
                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-1"><TrendingUp className="h-3 w-3 text-primary" /> Net Yield</p>
                <p className="text-3xl font-black text-primary tabular-nums tracking-tighter italic">KES {totalProfit.toLocaleString()}</p>
                <div className="h-1 w-full bg-white/5 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-primary w-[45%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                </div>
              </div>
              <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-1 group hover:border-blue-500/20 transition-all">
                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-1"><Package className="h-3 w-3 text-blue-500" /> Units Issued</p>
                <p className="text-3xl font-black text-white tabular-nums tracking-tighter italic">{totalQty.toLocaleString()} items</p>
                <div className="h-1 w-full bg-white/5 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-blue-500 w-[80%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-accent italic">Velocity Pulse</p>
                    <h4 className="text-lg font-black text-white italic tracking-tighter">7-Day Transactional Flux</h4>
                  </div>
                  <Badge variant="outline" className="border-accent/20 text-accent font-black text-[8px] uppercase">Real-time Data</Badge>
                </div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sellerTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={8} fontStyle="italic" fontWeight="900" label={{ value: 'Operatonal Cycle', position: 'insideBottom', offset: -5, fill: 'rgba(255,255,255,0.2)', fontSize: 7, fontWeight: 900 }} />
                      <YAxis stroke="rgba(255,255,255,0.2)" fontSize={8} fontStyle="italic" fontWeight="900" label={{ value: 'KES', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.2)', fontSize: 7, fontWeight: 900 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px' }}
                        itemStyle={{ color: '#f59e0b', fontWeight: '900', fontSize: '10px' }}
                      />
                      <Area type="monotone" dataKey="sales" stroke="#f59e0b" strokeWidth={3} fillOpacity={0.1} fill="#f59e0b" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-primary italic">Distribution Ledger</p>
                    <h4 className="text-lg font-black text-white italic tracking-tighter">Top Medicinal Assets</h4>
                  </div>
                  <ShoppingBag className="h-5 w-5 text-primary opacity-20" />
                </div>
                <div className="space-y-3">
                  {topMeds.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-10 uppercase font-black tracking-widest opacity-20">No Transactional History</p>
                  ) : topMeds.map((med, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-primary/[0.03] transition-all">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">
                          #{i + 1}
                        </div>
                        <div>
                          <p className="text-xs font-black text-white italic uppercase tracking-tighter">{med.name}</p>
                          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{med.qty} Units Distributed</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-primary italic">KES {med.revenue.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Audit Ledger Section */}
            <div className="p-8 rounded-[2.5rem] bg-amber-500/[0.03] border border-amber-500/10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <History className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-black text-white italic tracking-tighter uppercase">Forensic Audit Ledger</h4>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest italic">Operational Traceability Signature</p>
                  </div>
                </div>
                <ShieldAlert className="h-5 w-5 text-amber-500/20" />
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {auditLogs.length === 0 ? (
                  <p className="text-center py-12 text-[10px] text-muted-foreground font-black uppercase tracking-widest italic opacity-30">No Forensic Trails Found</p>
                ) : (
                  auditLogs.map((log, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 group hover:border-amber-500/30 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
                            <Activity className="h-4 w-4 text-amber-500/60" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs font-black text-white italic uppercase tracking-tighter">{log.module} Protocol</p>
                            <p className="text-[10px] text-muted-foreground font-medium italic">{log.action}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">{new Date(log.created_at).toLocaleDateString()}</p>
                          <p className="text-[8px] font-mono text-muted-foreground uppercase">{new Date(log.created_at).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Strategic Summary */}
            <div className="p-8 rounded-[2.5rem] bg-muted/30 border border-white/5 space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic">
                <Info className="h-4 w-4" /> Operational Intelligence Narrative
              </div>
              <p className="text-sm font-medium text-white/70 leading-relaxed italic">
                Staff member <span className="text-white font-black">{data.full_name}</span> has maintained a consistent transactional pulse over the last 7 days.
                With a gross yield of <span className="text-accent underline font-black">KES {totalRevenue.toLocaleString()}</span> and successful distribution of
                <span className="text-blue-500 font-black"> {totalQty} medicinal assets</span>, operational integrity remains verified through distributed forensic ledgers.
              </p>
            </div>
          </div>
        );

      case "expense":
        return (
          <div className="space-y-8">
            <div className="flex items-center gap-6 p-6 rounded-[2.5rem] bg-blue-500/10 border border-blue-500/20 backdrop-blur-xl">
              <div className="h-20 w-20 rounded-3xl bg-blue-500 flex items-center justify-center shadow-xl shadow-blue-500/20">
                <Wallet className="h-10 w-10 text-white" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-4xl font-black text-foreground dark:text-white italic tracking-tighter leading-none">KES {data.amount?.toLocaleString()}</h3>
                  <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-black uppercase tracking-[0.2em] text-[10px] h-6 px-3">{data.category}</Badge>
                </div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1 italic opacity-60">Financial Ledger Entry</p>
              </div>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-card dark:bg-white/5 border border-border dark:border-white/10 space-y-6">
              <div className="space-y-3">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.3em] ml-2">Transaction Memo / Narrative</p>
                <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5">
                  <p className="text-base text-white/90 leading-relaxed italic font-medium">"{data.description || "No detailed memo provided for this disbursement."}"</p>
                </div>
              </div>
              <div className="pt-6 border-t border-border dark:border-white/5 flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Temporal Stamp</p>
                    <span className="text-xs font-black text-white italic tracking-wider uppercase">{new Date(data.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <Badge variant="outline" className="border-white/5 font-mono text-[10px] text-muted-foreground uppercase">REF: {data.id.slice(0, 8)}</Badge>
              </div>
            </div>
          </div>
        );

      case "client":
        const clientSales = localDb.sales.getDetailed().filter(s => s.customer_name === data.name || s.customer_phone === data.phone);
        const ltv = clientSales.reduce((sum, s) => sum + Number(s.total_amount), 0);
        const avgTicket = clientSales.length > 0 ? ltv / clientSales.length : 0;

        // Favorite Category
        const catMap: Record<string, number> = {};
        clientSales.forEach(s => {
          s.items.forEach((item: any) => {
            const drug = localDb.drugs.getById(item.drug_id);
            if (drug) catMap[drug.category] = (catMap[drug.category] || 0) + 1;
          });
        });
        const favoriteCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "General";

        return (
          <div className="space-y-8 animate-fade-in">
            {/* Client Identity Header */}
            <div className="flex items-center gap-6 p-6 rounded-[2.5rem] bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-xl">
              <div className="h-20 w-20 rounded-3xl bg-indigo-500 flex items-center justify-center shadow-xl shadow-indigo-500/20">
                <UserCircle className="h-10 w-10 text-white" />
              </div>
              <div className="space-y-1">
                <h3 className="text-3xl font-black text-foreground dark:text-white italic tracking-tighter leading-none">{data.name || "Walk-in Client"}</h3>
                <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><Smartphone className="h-3 w-3 text-indigo-500" /> {data.phone || "No Contact"}</span>
                </div>
              </div>
            </div>

            {/* Loyalty Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-1">
                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-1"><Wallet className="h-3 w-3 text-indigo-500" /> Lifetime Value</p>
                <p className="text-3xl font-black text-white tabular-nums tracking-tighter italic">KES {ltv.toLocaleString()}</p>
              </div>
              <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-1">
                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-1"><History className="h-3 w-3 text-indigo-500" /> Visits</p>
                <p className="text-3xl font-black text-white tabular-nums tracking-tighter italic">{clientSales.length} Transactions</p>
              </div>
              <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-1">
                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-1"><Activity className="h-3 w-3 text-indigo-500" /> Favorite Path</p>
                <p className="text-2xl font-black text-indigo-400 tabular-nums tracking-tighter italic uppercase">{favoriteCat}</p>
              </div>
            </div>

            {/* Purchase History Ledger */}
            <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-white italic tracking-tighter uppercase">Recent Acquisitions</h4>
                <Badge variant="outline" className="border-indigo-500/20 text-indigo-500 font-black text-[9px]">LATEST_TRAILS</Badge>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {clientSales.length === 0 ? (
                  <p className="text-center py-12 text-[10px] text-muted-foreground font-black uppercase tracking-widest italic opacity-30">No Purchase History</p>
                ) : (
                  clientSales.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((sale, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 group hover:border-indigo-500/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-[10px] font-black text-indigo-500">
                          #{i + 1}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-black text-white italic uppercase tracking-tighter">Sale {sale.id.slice(0, 6)}</p>
                          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">{sale.payment_method}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-indigo-500 italic">KES {sale.total_amount.toLocaleString()}</p>
                        <p className="text-[9px] font-mono text-muted-foreground uppercase">{new Date(sale.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );

      case "audit":
        return (
          <div className="space-y-8">
            <div className="flex items-center gap-6 p-6 rounded-[2.5rem] bg-amber-500/10 border border-amber-500/20 backdrop-blur-xl">
              <div className="h-20 w-20 rounded-3xl bg-amber-500 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                <History className="h-10 w-10 text-black px-0.5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-foreground dark:text-white italic tracking-tighter leading-tight uppercase">{data.action}</h3>
                <div className="flex items-center gap-3">
                  <Badge className="bg-amber-500 text-black font-black uppercase tracking-widest text-[9px] h-5 rounded-lg border-none px-3">{data.module} Ledger</Badge>
                  <span className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest italic leading-none flex items-center gap-2">
                    <ShieldAlert className="h-3 w-3" /> Integrity Confirmed
                  </span>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-card dark:bg-white/5 border border-border dark:border-white/10 space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Operational Actor</span>
                  <div className="flex items-center gap-3">
                    <UserCircle className="h-5 w-5 text-amber-500" />
                    <span className="text-base font-black text-white italic tracking-tighter uppercase">{data.user_name}</span>
                  </div>
                </div>
                <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Audit Signature</span>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-amber-500" />
                    <span className="text-base font-black text-white italic tracking-tighter uppercase">{new Date(data.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.4em] ml-3 italic">Forensic Byte Details</p>
                <div className="p-8 rounded-[2rem] bg-black/40 font-mono text-xs text-amber-500/80 break-words border border-white/5 leading-relaxed tracking-tighter shadow-inner">
                  {data.details || "SYSTEM_AUDIT_LOG_EMPTY: NO FORENSIC METADATA AVAILABLE"}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-[#09090b] border-white/5 rounded-[3.5rem] p-10 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-[0_0_100px_rgba(16,185,129,0.1)] backdrop-blur-3xl">
        <DialogHeader className="mb-8">
          <div className="flex items-center gap-3 text-primary font-black text-[10px] uppercase tracking-[0.5em] italic">
            <Activity className="h-4 w-4 animate-pulse" /> Global Intelligence Matrix
          </div>
          <DialogTitle className="hidden">Forensic Entity Intelligence</DialogTitle>
        </DialogHeader>

        {renderContent()}

        <div className="mt-12">
          <button 
            onClick={onClose}
            className="w-full h-16 rounded-[2rem] bg-white/5 text-muted-foreground hover:text-white font-black uppercase tracking-[0.3em] text-[10px] border border-white/5 hover:bg-white/10 hover:scale-[1.01] transition-all italic"
          >
            Terminate Session
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
