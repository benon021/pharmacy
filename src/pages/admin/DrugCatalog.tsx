import { useEffect, useState } from "react";
import { localDb, Drug } from "@/lib/db";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { 
  ShieldCheck, FileUp, Activity, Plus, Search, Filter, 
  Pill, AlertTriangle, AlertCircle, PackagePlus, Edit, 
  Loader2, Barcode, Hash, CalendarDays, Package, QrCode, 
  ShieldAlert, CheckCircle2, ChevronRight, ArrowRight, Zap
} from "lucide-react";
import EntityIntelligenceModal from "@/components/EntityIntelligenceModal";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ScannerHubModal from "@/components/ScannerHubModal";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

const emptyDrug = {
  name: "", 
  generic_name: "", 
  brand_name: "",
  sku: "",
  barcode: "", 
  category: "OTC", 
  therapeutic_class: "",
  form: "Tablet", 
  strength: "",
  active_ingredients: "",
  stock: 0, 
  reorder_level: 10,
  unit: "pcs",
  manufacturer: "", 
  supplier: "",
  description: "", 
  cost_price: 0, 
  price: 0,
  tax_rate: 16,
  is_taxable: false, 
  prescription_required: false,
  batch_number: "",
  expiry_date: "",
  is_active: true
};

const categoryColors: Record<string, string> = {
  OTC: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  Prescription: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Supplement: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  Controlled: "bg-rose-500/10 text-rose-500 border-rose-500/20",
};

const DOSAGE_FORMS = [
  "Tablet", "Capsule", "Powder", "Granule", "Syrup", "Solution", "Suspension", 
  "Emulsion", "Drop", "Cream", "Ointment", "Gel", "Paste", "Suppository", 
  "Inhaler", "Nebulizer solution", "Transdermal patch", "Lozenge", "Implant"
];

const GENERIC_NAMES = [
  "Paracetamol", "Amoxicillin", "Metformin", "Ibuprofen", "Ciprofloxacin", 
  "Omeprazole", "Salbutamol", "Diclofenac", "Fluconazole", "Aspirin", "Other"
];

const THERAPEUTIC_CLASSES = [
  "Analgesics (pain relievers)", "Antipyretics (fever reducers)", 
  "Antibiotics (antibacterial agents)", "Antifungals", "Antivirals", "Antimalarials", 
  "Antihypertensives (blood pressure control)", "Antidiabetics", "Antidepressants", 
  "Antipsychotics", "Anticonvulsants (antiepileptics)", 
  "Anti-inflammatory agents (NSAIDs, corticosteroids)", "Antihistamines (allergy treatment)", 
  "Bronchodilators (asthma/COPD)", "Cardiovascular agents (antiarrhythmics, statins, anticoagulants)", 
  "Gastrointestinal agents (antacids, proton pump inhibitors, laxatives)", 
  "Hormones (thyroid drugs, insulin, contraceptives)", "Vitamins & Minerals", 
  "Immunosuppressants", "Oncology drugs (chemotherapy agents)", "Other"
];

const STRENGTH_UNITS = [
  "mg", "g", "mcg", "IU", "mEq", "%", "mg/ml", "mg/5ml", "units/ml", "ml", "L"
];

export default function DrugCatalog() {
  const queryClient = useQueryClient();

  const { data: drugs = [], isLoading, refetch } = useQuery({
    queryKey: ["drugs"],
    queryFn: () => localDb.drugs.getAll(),
    staleTime: 30000,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDrug, setEditingDrug] = useState<Drug | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyDrug);
  const [intelOpen, setIntelOpen] = useState(false);
  const [intelData, setIntelData] = useState<any>(null);
  const [intelTab, setIntelTab] = useState<any>("intelligence");
  const [scannerModalOpen, setScannerModalOpen] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [lastRemoteBarcode, setLastRemoteBarcode] = useState<string | null>(null);

  const handleRestockClick = (e: React.MouseEvent, drug: Drug) => {
    e.stopPropagation();
    setIntelData(drug);
    setIntelTab("restock");
    setIntelOpen(true);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);

        let importedCount = 0;
        let updatedCount = 0;
        const currentDrugs = await localDb.drugs.getAll();

        for (const row of (data as any[])) {
          const drugData: any = {
            name: row.Name || row.name,
            generic_name: row["Generic Name"] || row.generic_name || null,
            brand_name: row["Brand Name"] || row.brand_name || null,
            sku: row.SKU || row.sku || null,
            category: row.Category || row.category || "OTC",
            therapeutic_class: row["Therapeutic Class"] || row.therapeutic_class || null,
            price: Number(row.Price || row.price || 0),
            cost_price: Number(row["Cost Price"] || row.cost_price || 0),
            stock: Number(row.Stock || row.stock || 0),
            reorder_level: Number(row["Reorder Level"] || row.reorder_level || 10),
            unit: row.Unit || row.unit || "pcs",
            manufacturer: row.Manufacturer || row.manufacturer || null,
            supplier: row.Supplier || row.supplier || null,
            expiry_date: row["Expiry Date"] || row.expiry_date || null,
            prescription_required: row["Rx Required"] === "Yes" || row.prescription_required === true,
            is_active: true,
            is_taxable: row.Taxable === "Yes" || row.is_taxable === true,
            batch_number: row["Batch No"] || row.batch_number || null,
            form: row.Form || row.form || "Tablet",
            barcode: row.Barcode || row.barcode || null,
            strength: row.Strength || row.strength || null,
            active_ingredients: row.Composition || row.active_ingredients || null,
            description: row.Description || row.description || null,
          };

          if (!drugData.name) continue;

          const existing = currentDrugs.find(d => d.name.toLowerCase() === drugData.name.toLowerCase());
          if (existing) {
            await localDb.drugs.update(existing.id, drugData);
            updatedCount++;
          } else {
            await localDb.drugs.insert(drugData);
            importedCount++;
          }
        }

        toast.success(`Import complete: ${importedCount} new items, ${updatedCount} updated.`);
        queryClient.invalidateQueries({ queryKey: ["drugs"] });
      } catch (err) {
        toast.error("Failed to parse Excel file.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const filtered = (drugs || []).filter(d => {
    const matchesSearch =
      (d?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (d?.generic_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (d?.barcode || "").includes(search);
    const matchesCategory = categoryFilter === "all" || d?.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const openCreate = () => {
    setEditingDrug(null);
    setForm(emptyDrug);
    setDialogOpen(true);
  };

  const openEdit = (e: React.MouseEvent, drug: Drug) => {
    e.stopPropagation();
    setEditingDrug(drug);
    setForm({
      name: drug.name,
      generic_name: drug.generic_name ?? "",
      brand_name: drug.brand_name ?? "",
      sku: drug.sku ?? "",
      category: drug.category,
      therapeutic_class: drug.therapeutic_class ?? "",
      stock: drug.stock,
      price: drug.price,
      prescription_required: drug.prescription_required,
      reorder_level: drug.reorder_level ?? 10,
      unit: drug.unit,
      manufacturer: drug.manufacturer ?? "",
      supplier: drug.supplier ?? "",
      description: drug.description ?? "",
      cost_price: drug.cost_price ?? 0,
      expiry_date: drug.expiry_date ?? "",
      form: drug.form ?? "Tablet",
      barcode: drug.barcode ?? "",
      is_taxable: drug.is_taxable ?? false,
      batch_number: drug.batch_number ?? "",
      strength: drug.strength ?? "",
      active_ingredients: drug.active_ingredients ?? "",
      tax_rate: drug.tax_rate ?? 16,
      is_active: drug.is_active ?? true
    });
    setDialogOpen(true);
  };

  const generateBarcode = () => {
    const code = "600" + Math.floor(100000000 + Math.random() * 900000000).toString();
    setForm({ ...form, barcode: code });
    toast.primary("Identity Generated: " + code);
  };

  const handleRemoteScan = (barcode: string) => {
    setForm(prev => ({ ...prev, barcode }));
    setLastRemoteBarcode(barcode);
    toast.success("Identity Captured", { 
      description: `Synced: ${barcode}`,
      duration: 3000,
      icon: <CheckCircle2 className="text-primary animate-pulse" />
    });
    
    setTimeout(() => setLastRemoteBarcode(null), 2000);

    supabase.channel(`scanner-session:${sessionId}`).send({
      type: "broadcast",
      event: "SCAN_ACK",
      payload: { product: { name: barcode, price: "Verified Link" } }
    });
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast.error("Brand/Commercial Name and Price are mandatory");
      return;
    }
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));

    const payload: Omit<Drug, "id" | "created_at"> = {
      ...form,
      stock: Number(form.stock),
      price: Number(form.price),
      reorder_level: Number(form.reorder_level),
      cost_price: form.cost_price ? Number(form.cost_price) : null,
      tax_rate: Number(form.tax_rate),
    };

    if (editingDrug) {
      const { error } = await localDb.drugs.update(editingDrug.id, payload);
      if (error) toast.error(error.message);
      else toast.success("Record updated successfully");
    } else {
      const { error } = await localDb.drugs.insert(payload);
      if (error) toast.error(error.message);
      else toast.success("Product registered successfully");
    }

    setSaving(false);
    setDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["drugs"] });
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Cinematic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl md:text-5xl font-black italic tracking-tighter text-foreground uppercase"
          >
            Inventory <span className="aurora-text">Ledger</span>
          </motion.h1>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">
             <ShieldCheck className="h-4 w-4 text-primary" /> Pharmaceutical Grid Analytics
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4">
           <input type="file" id="excel-import" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleImport} />
           <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="outline"
                onClick={() => document.getElementById('excel-import')?.click()}
                className="h-14 px-8 rounded-2xl border-white/5 bg-white/[0.02] text-white/40 font-black uppercase tracking-widest text-[10px] hover:bg-white/5 transition-all"
              >
                <FileUp size={16} className="mr-2" /> Import Assets
              </Button>
           </motion.div>
           <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={openCreate} 
                className="h-14 px-10 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center gap-3 border border-primary/50"
              >
                <Plus size={16} /> Register Medicine
              </Button>
           </motion.div>
        </div>
      </div>

      {/* Global Stock Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
         <StatsCard 
           title="Active Catalog"
           value={drugs.length}
           icon={Package}
           trend={{ value: "Syncing", positive: true }}
           color="primary"
         />
         <StatsCard 
           title="Depleting Stock"
           value={drugs.filter(d => d.stock <= (d.reorder_level || 10)).length}
           icon={AlertTriangle}
           trend={{ value: "Critical", positive: false }}
           color="accent"
         />
         <StatsCard 
           title="Platform Revenue"
           value={`UGX ${(drugs.reduce((acc, d) => acc + (d.price * d.stock), 0)).toLocaleString()}`}
           icon={DollarSign}
           trend={{ value: "Asset Val.", positive: true }}
           color="primary"
         />
         <StatsCard 
           title="System Pulse"
           value="99.9%"
           icon={Activity}
           trend={{ value: "Verified", positive: true }}
           color="accent"
         />
      </div>

      {/* Control Layer */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search by Brand, Formulation, Barcode..."
            className="pl-16 h-16 rounded-2xl bg-white/[0.01] border-white/5 text-base font-bold italic tracking-tight focus:border-primary/50 focus:bg-white/[0.03] transition-all shadow-inner"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 min-w-[240px]">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full h-16 rounded-2xl bg-white/[0.01] border-white/5 font-black uppercase text-[10px] tracking-[0.2em] text-white/40 focus:border-primary/50">
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-primary" />
                <SelectValue placeholder="All Categories" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#0a0a0c] border-white/10 rounded-2xl p-2 backdrop-blur-3xl">
              <SelectItem value="all" className="p-3 rounded-xl font-black text-[10px] uppercase">All Clusters</SelectItem>
              <SelectItem value="OTC" className="p-3 rounded-xl font-black text-[10px] uppercase">OTC Retail</SelectItem>
              <SelectItem value="Prescription" className="p-3 rounded-xl font-black text-[10px] uppercase">Prescription Only</SelectItem>
              <SelectItem value="Supplement" className="p-3 rounded-xl font-black text-[10px] uppercase">Nutraceuticals</SelectItem>
              <SelectItem value="Controlled" className="p-3 rounded-xl font-black text-[10px] uppercase">Controlled DDA</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Grid */}
      <div className="premium-card p-0 bg-white/[0.01] overflow-hidden border-white/5 shadow-3xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="py-6 px-10 text-[9px] font-black uppercase tracking-widest text-white/20">Product Specification</TableHead>
                <TableHead className="text-[9px] font-black uppercase tracking-widest text-white/20">Metric Tier</TableHead>
                <TableHead className="text-right text-[9px] font-black uppercase tracking-widest text-white/20">Valuation</TableHead>
                <TableHead className="text-right text-[9px] font-black uppercase tracking-widest text-white/20">Inventory</TableHead>
                <TableHead className="text-right px-10 text-[9px] font-black uppercase tracking-widest text-white/20">Protocols</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-40 text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto opacity-20" />
                    <p className="mt-6 text-[10px] font-black uppercase tracking-[0.5em] text-white/10">Scanning Global Ledger...</p>
                  </TableCell>
                </TableRow>
              ) : filtered.map((drug, i) => {
                const isExpired = drug.expiry_date && new Date(drug.expiry_date) < new Date();
                const isFinished = drug.stock <= 0;
                const isLow = !isFinished && drug.stock <= (drug.reorder_level || 10);

                return (
                  <motion.tr
                    key={drug.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => {
                      setIntelData(drug);
                      setIntelTab("intelligence");
                      setIntelOpen(true);
                    }}
                    className={cn(
                      "border-white/5 hover:bg-white/[0.03] transition-all cursor-pointer group",
                      isExpired && "bg-rose-500/[0.02]"
                    )}
                  >
                    <TableCell className="py-6 px-10">
                      <div className="flex items-center gap-5">
                        <div className={cn(
                          "h-14 w-14 rounded-2xl border flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-lg",
                          isExpired ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                          isFinished ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                          "bg-primary/5 text-primary border-primary/20"
                        )}>
                          {drug.form === "Syrup" ? <Zap size={20} /> : <Pill size={20} />}
                        </div>
                        <div>
                           <div className="flex items-center gap-3">
                              <p className="font-black text-white text-lg tracking-tighter italic uppercase group-hover:text-primary transition-colors">{drug.name}</p>
                              <Badge className="bg-white/5 text-[8px] font-mono border-white/5 text-white/20 opacity-40 uppercase">SKU_{drug.sku || "NULL"}</Badge>
                           </div>
                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">{drug.generic_name || "Unformulated Asset"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {isExpired ? (
                          <Badge className="bg-rose-500 text-black font-black uppercase tracking-widest text-[9px] animate-pulse rounded-lg px-3 italic">EXPIRED</Badge>
                        ) : (
                          <Badge className={cn("px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest italic", categoryColors[drug.category])}>
                            {drug.category}
                          </Badge>
                        )}
                        {isLow && !isExpired && (
                          <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 text-[8px] font-black px-2 h-5 flex items-center gap-1 rounded-lg">
                            <AlertCircle size={10} /> Depleting
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                       <p className="font-black text-white text-2xl tracking-tighter italic">UGX {Number(drug.price).toLocaleString()}</p>
                       <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest opacity-40 mt-1">{drug.is_taxable ? "VAT_INC" : "VAT_EXEMPT"}</p>
                    </TableCell>
                    <TableCell className="text-right">
                       <div className="flex flex-col items-end">
                          <span className={cn(
                            "text-3xl font-black italic tracking-tighter",
                            isLow || isFinished ? "text-rose-500" : "text-white"
                          )}>{drug.stock}</span>
                          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-30">{drug.unit} Global</span>
                       </div>
                    </TableCell>
                    <TableCell className="px-10">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                         <Button
                          variant="ghost"
                          onClick={(e) => handleRestockClick(e, drug)}
                          className="h-10 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-black font-black uppercase text-[9px] tracking-widest border border-emerald-500/10"
                        >
                          <PackagePlus size={14} className="mr-2" /> Restock
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => openEdit(e, drug)}
                          className="h-10 w-10 rounded-xl bg-white/5 hover:bg-primary text-white/40 hover:text-black border border-white/5"
                        >
                          <Edit size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Main Registry Dialog - Aniq UI Reconstruct */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl w-[95vw] bg-[#0a0a0c] border border-white/5 rounded-[3rem] p-0 overflow-hidden backdrop-blur-3xl shadow-3xl">
           <div className="absolute top-0 right-0 p-20 bg-primary/10 blur-[140px] rounded-full -z-10 animate-pulse" />
           
           <DialogHeader className="p-12 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center justify-between">
                 <div className="space-y-1">
                    <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase">{editingDrug ? "Update" : "Register"} <span className="aurora-text">Asset</span></h2>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-primary">
                       <ShieldCheck size={14} /> Pharmaceutical Node Ledger
                    </div>
                 </div>
              </div>
           </DialogHeader>

           <div className="p-12 space-y-12 max-h-[65vh] overflow-y-auto custom-scrollbar">
              {/* Layer 1: Global Identity */}
              <div className="space-y-8">
                 <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">01 Identification Core</span>
                    <div className="h-px flex-1 bg-white/5" />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-3">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Commercial Label *</Label>
                       <Input 
                         className="h-16 rounded-2xl bg-white/5 border-white/5 focus:border-primary/50 text-white font-black italic uppercase text-2xl tracking-tighter" 
                         value={form.name} 
                         onChange={e => setForm({ ...form, name: e.target.value })} 
                         placeholder="E.G. PANADOL ADVANCE" 
                       />
                    </div>
                    <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Registry Code (SKU)</Label>
                       <Input 
                         className="h-16 rounded-2xl bg-white/5 border-white/5 text-white font-mono tracking-widest" 
                         value={form.sku} 
                         onChange={e => setForm({ ...form, sku: e.target.value })} 
                         placeholder="SKU_99182_PH" 
                       />
                    </div>
                    <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Active Formulation</Label>
                       <Select value={form.generic_name} onValueChange={v => setForm({ ...form, generic_name: v })}>
                          <SelectTrigger className="h-16 rounded-2xl bg-white/5 border-white/5 text-white/80 font-bold italic">
                             <SelectValue placeholder="Select Metric..." />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0a0a0c] border-white/10 rounded-2xl backdrop-blur-3xl text-sm font-bold p-2">
                             {GENERIC_NAMES.map(n => <SelectItem key={n} value={n} className="rounded-xl p-3">{n}</SelectItem>)}
                          </SelectContent>
                       </Select>
                    </div>
                    <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex justify-between">
                          <span>Physical Protocol (Barcode)</span>
                          <button onClick={() => setScannerModalOpen(true)} className="text-primary hover:underline lowercase text-[9px] tracking-normal flex items-center gap-1">
                             <QrCode size={10} /> Mobile Sync
                          </button>
                       </Label>
                       <div className="relative group">
                          <Barcode className={cn(
                            "absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors",
                            lastRemoteBarcode ? "text-primary animate-bounce font-black" : "text-white/20 group-focus-within:text-primary"
                          )} />
                          <Input 
                            className={cn(
                              "h-16 pl-14 rounded-2xl bg-white/5 border-white/5 text-white font-mono tracking-[0.2em] text-xl transition-all duration-500",
                              lastRemoteBarcode ? "border-primary ring-8 ring-primary/10 bg-primary/5" : "focus:border-primary/50"
                            )} 
                            value={form.barcode} 
                            onChange={e => setForm({ ...form, barcode: e.target.value })} 
                            placeholder="600********" 
                          />
                          <AnimatePresence>
                             {lastRemoteBarcode && (
                               <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 border-2 border-primary rounded-2xl pointer-events-none shadow-[0_0_30px_rgba(var(--primary-rgb),0.2)]" />
                             )}
                          </AnimatePresence>
                       </div>
                    </div>
                    <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Dosage Protocol</Label>
                        <Select value={form.form} onValueChange={v => setForm({ ...form, form: v })}>
                          <SelectTrigger className="h-16 rounded-2xl bg-white/5 border-white/5 text-white font-bold italic">
                             <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0a0a0c] border-white/10 rounded-2xl backdrop-blur-3xl p-2 max-h-[300px]">
                             {DOSAGE_FORMS.map(f => <SelectItem key={f} value={f} className="rounded-xl p-3 text-xs font-bold">{f}</SelectItem>)}
                          </SelectContent>
                       </Select>
                    </div>
                 </div>
              </div>

              {/* Layer 2: Inventory & Supply */}
              <div className="space-y-8">
                 <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">02 Supply Dynamics</span>
                    <div className="h-px flex-1 bg-white/5" />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-accent ml-1">Batch Registry</Label>
                       <Input className="h-16 rounded-2xl bg-white/5 border-white/5 text-white font-mono italic" value={form.batch_number} onChange={e => setForm({ ...form, batch_number: e.target.value })} placeholder="BATCH_2026_X" />
                    </div>
                    <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-accent ml-1">Temporal Expiry</Label>
                       <Input type="date" className="h-16 rounded-2xl bg-white/5 border-white/5 text-white font-black" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} />
                    </div>
                    <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Liquid Strength</Label>
                       <Input className="h-16 rounded-2xl bg-white/5 border-white/5 text-white font-bold italic text-lg" value={form.strength} onChange={e => setForm({ ...form, strength: e.target.value })} placeholder="500MG" />
                    </div>
                    <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-rose-500 ml-1">Critical Threshold</Label>
                       <Input type="number" className="h-16 rounded-2xl bg-rose-500/5 border-rose-500/20 text-rose-500 font-black text-xl" value={form.reorder_level} onChange={e => setForm({ ...form, reorder_level: Number(e.target.value) })} />
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">On-Hand Units</Label>
                       <div className="flex gap-4">
                          <Input type="number" className="h-16 flex-1 rounded-2xl bg-white/5 border-white/5 text-white font-black text-2xl italic tracking-tighter" value={form.stock} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} />
                          <Select value={form.unit} onValueChange={v => setForm({ ...form, unit: v })}>
                             <SelectTrigger className="h-16 w-32 rounded-2xl bg-white/5 border-white/5 text-[10px] font-black uppercase tracking-widest text-primary">
                                <SelectValue />
                             </SelectTrigger>
                             <SelectContent className="bg-[#0a0a0c] border-white/10 p-2 rounded-xl">
                                {["pcs", "box", "bottle", "vial", "strip", "ampoule"].map(u => <SelectItem key={u} value={u} className="font-black p-3 text-[10px] uppercase">{u}</SelectItem>)}
                             </SelectContent>
                          </Select>
                       </div>
                    </div>
                    <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Manufacturer Node</Label>
                       <Input className="h-16 rounded-2xl bg-white/5 border-white/5 text-white uppercase font-bold text-sm tracking-widest" value={form.manufacturer} onChange={e => setForm({ ...form, manufacturer: e.target.value })} />
                    </div>
                 </div>
              </div>

              {/* Layer 3: Valuation */}
              <div className="space-y-8">
                 <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">03 Commercial Strat</span>
                    <div className="h-px flex-1 bg-white/5" />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Asset Value (Acq)</Label>
                       <Input type="number" className="h-16 rounded-2xl bg-white/5 border-white/5 text-white/40 font-black text-xl italic" value={form.cost_price} onChange={e => setForm({ ...form, cost_price: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Market Price (Retail)</Label>
                       <Input type="number" className="h-16 rounded-2xl bg-primary/10 border-primary/30 text-white font-black text-3xl italic tracking-tighter shadow-2xl shadow-primary/10" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-3 flex flex-col justify-end pb-1 px-4 border border-white/5 rounded-2xl bg-white/[0.01]">
                       <div className="flex items-center justify-between mb-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Prescription Required</Label>
                          <Switch 
                            checked={form.prescription_required} 
                            onCheckedChange={v => setForm({ ...form, prescription_required: v })} 
                            className="data-[state=checked]:bg-rose-500"
                          />
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           <DialogFooter className="p-0 border-t border-white/5">
              <Button disabled={saving} onClick={handleSave} className="h-24 w-full rounded-none bg-primary text-white font-black uppercase text-xs tracking-[0.5em] gap-4 hover:bg-primary/90 transition-all click-compress">
                 {saving ? <Loader2 className="animate-spin h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
                 {editingDrug ? "Commit Record Evolution" : "Finalize Asset Protocol"}
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      <EntityIntelligenceModal 
        open={intelOpen}
        onOpenChange={setIntelOpen}
        entityData={intelData}
        initialTab={intelTab}
      />

      <ScannerHubModal 
        open={scannerModalOpen} 
        onOpenChange={setScannerModalOpen}
        onScan={handleRemoteScan}
        sessionId={sessionId}
      />
    </div>
  );
}
