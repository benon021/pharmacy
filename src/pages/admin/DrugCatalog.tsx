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
  Loader2, Barcode, Hash, CalendarDays, Package, QrCode, ShieldAlert
} from "lucide-react";
import EntityIntelligenceModal from "@/components/EntityIntelligenceModal";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ScannerHubModal from "@/components/ScannerHubModal";
import { supabase } from "@/lib/supabase";


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
  OTC: "bg-green-500/10 text-green-500 border-green-500/20",
  Prescription: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Supplement: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  Controlled: "bg-red-500/10 text-red-500 border-red-500/20",
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
    staleTime: 30000, // 30 seconds
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDrug, setEditingDrug] = useState<Drug | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [barcodeBuffer, setBarcodeBuffer] = useState("");
  const [lastCharTime, setLastCharTime] = useState(0);
  const [form, setForm] = useState(emptyDrug);
  const [intelOpen, setIntelOpen] = useState(false);
  const [intelData, setIntelData] = useState<any>(null);
  const [intelTab, setIntelTab] = useState<any>("intelligence");
  const [scannerModalOpen, setScannerModalOpen] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());

  useEffect(() => {


    const handleBarcodeInDialog = (e: KeyboardEvent) => {
      if (!dialogOpen) return;

      const target = e.target as HTMLElement;
      const now = Date.now();
      const diff = now - lastCharTime;

      if (diff > 50) {
        setBarcodeBuffer(e.key);
      } else {
        if (e.key === "Enter") {
          if (barcodeBuffer.length > 3 && diff < 40) {
            e.preventDefault();
            setForm(prev => ({ ...prev, barcode: barcodeBuffer }));
            toast.success("Barcode Scanned: " + barcodeBuffer, { duration: 1000 });
            setBarcodeBuffer("");
          }
        } else {
          if (e.key.length === 1) {
            setBarcodeBuffer(prev => prev + e.key);
          }
        }
      }
      setLastCharTime(now);
    };

    window.addEventListener("keydown", handleBarcodeInDialog);
    return () => window.removeEventListener("keydown", handleBarcodeInDialog);
  }, [dialogOpen, barcodeBuffer, lastCharTime]);

  const handleRestockClick = (e: React.MouseEvent, drug: Drug) => {
    e.stopPropagation(); // Avoid row click
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
          const drugData: Omit<Drug, "id" | "created_at"> = {
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
    toast.info("Generated Barcode: " + code);
  };

  const handleRemoteScan = (barcode: string) => {
    setForm(prev => ({ ...prev, barcode }));
    toast.success("Barcode Captured from Phone Scanner", { duration: 1500 });
    // Ack back to phone
    supabase.channel(`scanner-session:${sessionId}`).send({
      type: "broadcast",
      event: "SCAN_ACK",
      payload: { product: { name: barcode, price: "Linked" } }
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
      else toast.success("Forensic record updated successfully");
    } else {
      const { error } = await localDb.drugs.insert(payload);
      if (error) toast.error(error.message);
      else toast.success("New product registered in inventory");
    }

    setSaving(false);
    setDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["drugs"] });
  };


  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-[0.3em] mb-2">
            <ShieldCheck className="h-4 w-4" /> PPB Regulatory Compliance v3.5
          </div>
          <h1 className="text-4xl xl:text-5xl font-black tracking-tight text-foreground dark:text-white italic tracking-tighter flex items-baseline gap-3">
            Inventory Ledger <span className="text-primary not-italic tracking-normal text-sm font-black bg-primary/20 px-3 py-1 rounded-full">{drugs.length} Items</span>
          </h1>
          <p className="text-muted-foreground text-lg">Centralized pharmaceutical tracking with real-time forensic auditing</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input type="file" id="excel-import" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleImport} />
          <Button
            variant="ghost"
            onClick={() => document.getElementById('excel-import')?.click()}
            className="h-14 rounded-2xl bg-card dark:bg-white/5 border border-border dark:border-white/10 hover:bg-card dark:bg-white/10 gap-2 px-6 font-black uppercase text-[10px] tracking-widest"
          >
            <FileUp className="h-4 w-4 text-primary" /> Import Excel
          </Button>
          <Button onClick={openCreate} className="h-14 rounded-2xl shadow-2xl shadow-primary/20 gap-3 px-8 font-black uppercase text-[10px] tracking-[0.2em] bg-primary text-black hover:scale-105 transition-transform" size="lg">
            <Plus className="h-5 w-5" /> Add New Medicine
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search by Brand, Formulation, Barcode or SKU..."
            className="pl-14 h-16 rounded-[2rem] bg-card dark:bg-white/5 border-border dark:border-white/10 text-lg transition-all focus:bg-white/10 focus:ring-4 focus:ring-primary/5 shadow-inner"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 min-w-[240px]">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full h-16 rounded-[2rem] bg-card dark:bg-white/5 border-border dark:border-white/10 font-black uppercase text-[10px] tracking-widest text-muted-foreground focus:ring-4 focus:ring-primary/5">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                <SelectValue placeholder="All Categories" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#0B0E14] border-border dark:border-white/10 text-foreground dark:text-white">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="OTC">OTC</SelectItem>
              <SelectItem value="Prescription">Prescription</SelectItem>
              <SelectItem value="Supplement">Supplement</SelectItem>
              <SelectItem value="Controlled">Controlled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="premium-card !p-0 overflow-hidden border-border dark:border-white/5! shadow-2xl backdrop-blur-3xl">
        <Table>
          <TableHeader>
            <TableRow className="bg-white/[0.03] hover:bg-white/[0.03] border-border dark:border-white/5">
              <TableHead className="py-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground px-8">Medicine Formulation</TableHead>
              <TableHead className="py-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Classification</TableHead>
              <TableHead className="py-6 text-right font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground px-8">Retail Pulse</TableHead>
              <TableHead className="py-6 text-right font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Operational Stock</TableHead>
              <TableHead className="py-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground px-8">Forensic Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-32 text-muted-foreground">
                  <div className="flex flex-col items-center gap-4">
                    {isLoading ? (
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    ) : (
                      <Package className="h-16 w-16 opacity-5 animate-pulse" />
                    )}
                    <p className="font-bold uppercase tracking-[0.2em] text-[10px]">
                      {isLoading ? "Consulting Global Ledger..." : "Zero matches across forensic database"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>

            ) : filtered.map((drug, i) => {
              const isExpired = drug.expiry_date && new Date(drug.expiry_date) < new Date();
              const isFinished = drug.stock <= 0;
              const isLow = !isFinished && drug.stock <= (drug.reorder_level || 10);

              return (
                <TableRow
                  key={drug.id}
                  onClick={() => {
                    setIntelData(drug);
                    setIntelTab("intelligence");
                    setIntelOpen(true);
                  }}
                  className={cn(
                    "group hover:bg-muted dark:bg-white/[0.02] border-border dark:border-white/5 transition-all cursor-pointer",
                    isExpired && "bg-red-500/[0.03]"
                  )}
                >
                  <TableCell className="px-8 py-6">
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        "flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 shadow-lg",
                        isExpired ? "bg-red-500/10 text-red-500 border-red-500/20" :
                          isFinished ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                            "bg-primary/5 text-primary border-primary/10"
                      )}>
                        {drug.form === "Syrup" ? <Activity className="h-7 w-7" /> : <Pill className="h-7 w-7" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-black text-foreground dark:text-white text-lg tracking-tighter leading-tight group-hover:text-primary transition-colors italic">{drug.name}</p>
                          {drug.sku && <Badge variant="outline" className="h-4 px-1 text-[8px] font-mono border-white/5 text-muted-foreground opacity-50 uppercase tracking-tighter">SKU: {drug.sku}</Badge>}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-1">{drug.generic_name || "Formulation Pending"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {isExpired ? (
                        <Badge className="bg-red-500 text-black font-black uppercase tracking-widest text-[9px] animate-pulse rounded-lg px-3">EXPIRED</Badge>
                      ) : isFinished ? (
                        <Badge className="bg-amber-500 text-black font-black uppercase tracking-widest text-[9px] rounded-lg px-3">STOCK_OUT</Badge>
                      ) : (
                        <Badge className={cn("px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest", categoryColors[drug.category])}>
                          {drug.category}
                        </Badge>
                      )}
                      {isLow && !isExpired && (
                        <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-[8px] font-black px-2 h-5 flex items-center gap-1 rounded-lg">
                          <AlertTriangle className="h-3 w-3" /> DEPLETING
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right px-8">
                    <p className="font-black text-foreground dark:text-white tabular-nums text-2xl tracking-tighter italic">KES {Number(drug.price).toLocaleString()}</p>
                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-1">
                      {drug.is_taxable ? <span className="text-amber-500 opacity-80 decoration-double underline underline-offset-4">VAT_ENABLED</span> : <span className="text-green-500 opacity-80">ZERO_RATED</span>}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        {isLow && <AlertCircle className="h-4 w-4 text-red-500 animate-pulse" />}
                        <span className={cn("font-black tabular-nums text-3xl tracking-tighter italic", (isLow || isFinished || isExpired) ? "text-red-500" : "text-foreground dark:text-white")}>
                          {drug.stock}
                        </span>
                      </div>
                      <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.3em]">{drug.unit} AVAILABLE</p>
                    </div>
                  </TableCell>
                  <TableCell className="px-8">
                    <div className="flex items-center justify-end gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleRestockClick(e, drug)}
                        className="h-12 w-12 rounded-2xl bg-green-500/5 hover:bg-green-500 text-green-500 hover:text-black border border-green-500/10 transition-all shadow-lg"
                        title="Restock Intel"
                      >
                        <PackagePlus className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => openEdit(e, drug)}
                        className="h-12 w-12 rounded-2xl bg-card dark:bg-white/5 hover:bg-primary text-muted-foreground hover:text-black border border-border dark:border-white/5 transition-all"
                        title="Edit Record"
                      >
                        <Edit className="h-5 w-5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl bg-[#09090b] border-white/5 rounded-[3rem] p-0 overflow-hidden shadow-[0_0_100px_rgba(16,185,129,0.1)] backdrop-blur-3xl">
          <DialogHeader className="p-10 bg-white/[0.02] border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <DialogTitle className="text-3xl font-black italic tracking-tighter text-white uppercase">{editingDrug ? "Update Forensic Entry" : "Register New Product"}</DialogTitle>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-primary">
                  <Activity className="h-3 w-3" /> System Operational | PPB Verified
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-1">Global Catalog</p>
                <Badge variant="outline" className="rounded-xl border-white/5 font-mono text-white tracking-widest">{drugs.length + 1} SKUs</Badge>
              </div>
            </div>
          </DialogHeader>

          <div className="p-10 space-y-10 max-h-[75vh] overflow-y-auto custom-scrollbar">
            {/* Identification Layer */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px flex-1 bg-white/5" />
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">Identification</span>
                <div className="h-px flex-1 bg-white/5" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2 lg:col-span-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Commercial / Display Name *</Label>
                  <Input className="h-14 rounded-2xl bg-white/5 border-white/10 focus:ring-4 focus:ring-primary/10 text-white font-bold italic" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Panadol Forte" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Manufacturer Brand</Label>
                  <Input className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-bold" value={form.brand_name || ""} onChange={e => setForm({ ...form, brand_name: e.target.value })} placeholder="e.g. GSK" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Generic / Formulation</Label>
                  <Select 
                    value={form.generic_name && !GENERIC_NAMES.filter(n => n !== "Other").includes(form.generic_name) ? "Other" : form.generic_name || ""} 
                    onValueChange={v => setForm({ ...form, generic_name: v === "Other" ? "" : v })}
                  >
                    <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 text-white/70 font-bold italic"><SelectValue placeholder="Select Generic..." /></SelectTrigger>
                    <SelectContent className="bg-[#0B0E14] border-white/10 text-white max-h-[300px]">
                      {GENERIC_NAMES.map(name => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(form.generic_name === "" || (form.generic_name && !GENERIC_NAMES.filter(n => n !== "Other").includes(form.generic_name))) && (
                    <Input className="h-12 mt-2 rounded-xl bg-white/5 border-primary/20 text-white text-xs italic animate-slide-up" value={form.generic_name || ""} onChange={e => setForm({ ...form, generic_name: e.target.value })} placeholder="Type custom formulation..." />
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex justify-between">
                    <span>Barcode / QR</span>
                    <div className="flex gap-2">
                       <button onClick={() => setScannerModalOpen(true)} className="text-primary hover:underline lowercase text-[9px] tracking-normal flex items-center gap-1">
                          <QrCode size={10} /> Link Phone
                       </button>
                       <button onClick={generateBarcode} className="text-muted-foreground hover:underline lowercase text-[9px] tracking-normal">Generate Random</button>
                    </div>
                  </Label>
                  <div className="relative">
                    <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input className="h-14 pl-12 rounded-2xl bg-white/5 border-white/10 text-white font-mono" value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} placeholder="Scan or type..." />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Drug Code / SKU</Label>
                  <Input className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-mono" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="e.g. PAN-992-KE" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Therapeutic Class</Label>
                  <Select 
                    value={form.therapeutic_class && !THERAPEUTIC_CLASSES.filter(c => c !== "Other").includes(form.therapeutic_class) ? "Other" : form.therapeutic_class || ""} 
                    onValueChange={v => setForm({ ...form, therapeutic_class: v === "Other" ? "" : v })}
                  >
                    <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-bold"><SelectValue placeholder="Select Class..." /></SelectTrigger>
                    <SelectContent className="bg-[#0B0E14] border-white/10 text-white max-h-[300px]">
                      {THERAPEUTIC_CLASSES.map(cls => (
                        <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(form.therapeutic_class === "" || (form.therapeutic_class && !THERAPEUTIC_CLASSES.filter(c => c !== "Other").includes(form.therapeutic_class))) && (
                    <Input className="h-12 mt-2 rounded-xl bg-white/5 border-primary/20 text-white text-xs italic animate-slide-up" value={form.therapeutic_class || ""} onChange={e => setForm({ ...form, therapeutic_class: e.target.value })} placeholder="Type custom therapeutic class..." />
                  )}
                </div>
              </div>
            </div>

            {/* Composition & formulation */}
            <div className="space-y-6">
               <div className="flex items-center gap-2 mb-4">
                <div className="h-px flex-1 bg-white/5" />
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">Composition</span>
                <div className="h-px flex-1 bg-white/5" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2 lg:col-span-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Ingredients (Strength)</Label>
                  <Input className="h-14 rounded-2xl bg-white/5 border-white/10 text-white" value={form.active_ingredients} onChange={e => setForm({ ...form, active_ingredients: e.target.value })} placeholder="e.g. Paracetamol 500mg, Caffeine 30mg" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Dosage Form</Label>
                  <Select value={form.form} onValueChange={v => setForm({ ...form, form: v })}>
                    <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 font-bold text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#0B0E14] border-white/10 text-white max-h-[300px]">
                      {DOSAGE_FORMS.map(f => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                      <SelectItem value="Other">Other Form...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Medical Strength</Label>
                  <div className="flex gap-2">
                    <Input 
                      className="h-14 w-24 rounded-2xl bg-white/5 border-white/10 text-white font-bold text-center"
                      value={form.strength?.match(/^\d+/)?.[0] || ""}
                      onChange={e => {
                        const unit = form.strength?.replace(/^\d+/, "") || "mg";
                        setForm({ ...form, strength: e.target.value + unit });
                      }}
                      placeholder="500"
                    />
                    <Select 
                      value={form.strength?.replace(/^\d+/, "") || "mg"} 
                      onValueChange={v => {
                        const val = form.strength?.match(/^\d+/)?.[0] || "";
                        setForm({ ...form, strength: val + v });
                      }}
                    >
                      <SelectTrigger className="h-14 flex-1 rounded-2xl bg-white/5 border-white/10 text-white font-bold">
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0B0E14] border-white/10 text-white max-h-[300px]">
                        {STRENGTH_UNITS.map(unit => (
                          <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory Dynamics */}
            <div className="space-y-6">
               <div className="flex items-center gap-2 mb-4">
                <div className="h-px flex-1 bg-white/5" />
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">Inventory & Supply</span>
                <div className="h-px flex-1 bg-white/5" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-2"><Hash className="h-3 w-3" /> Batch identity</Label>
                  <Input className="h-14 rounded-2xl bg-accent/5 border-accent/20 text-white font-mono" value={form.batch_number} onChange={e => setForm({ ...form, batch_number: e.target.value })} placeholder="LOT_2024_001" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-2"><CalendarDays className="h-3 w-3" /> Expiry date</Label>
                  <Input className="h-14 rounded-2xl bg-accent/5 border-accent/20 text-white" type="date" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Stock On-Hand</Label>
                  <div className="flex gap-2">
                    <Input type="number" className="h-14 flex-1 rounded-2xl bg-white/5 border-white/10 text-white font-black text-lg" value={form.stock} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} />
                    <Select value={form.unit} onValueChange={v => setForm({ ...form, unit: v })}>
                      <SelectTrigger className="h-14 w-28 rounded-2xl bg-white/5 border-white/10 text-[10px] font-black uppercase tracking-widest text-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0B0E14] border-white/10 text-white">
                        {["pcs", "box", "bottle", "vial", "strip", "ampoule", "sachet", "tin"].map(u => (
                          <SelectItem key={u} value={u} className="uppercase text-[9px] font-black tracking-widest">{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-red-500/80">Reorder threshold</Label>
                  <Input type="number" className="h-14 rounded-2xl bg-red-500/5 border-red-500/20 text-red-500 font-black" value={form.reorder_level} onChange={e => setForm({ ...form, reorder_level: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Manufacturer / Global Brand</Label>
                  <Input className="h-14 rounded-2xl bg-white/5 border-white/10 text-white" value={form.manufacturer} onChange={e => setForm({ ...form, manufacturer: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Registered Supplier</Label>
                  <Input className="h-14 rounded-2xl bg-white/5 border-white/10 text-white" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Commercial Strategy */}
            <div className="space-y-6">
               <div className="flex items-center gap-2 mb-4">
                <div className="h-px flex-1 bg-white/5" />
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">Financials & Clinical</span>
                <div className="h-px flex-1 bg-white/5" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Purchase Price (Acquisition)</Label>
                  <Input type="number" className="h-14 rounded-2xl bg-white/5 border-white/10 text-white/60 font-bold" value={form.cost_price} onChange={e => setForm({ ...form, cost_price: Number(e.target.value) })} />
                </div>
                 <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Selling Price (Retail)</Label>
                  <Input type="number" className="h-14 rounded-2xl bg-primary/5 border-primary/20 text-white font-black text-xl italic" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-amber-500">VAT Rate (%)</Label>
                  <Input type="number" className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-bold" value={form.tax_rate} onChange={e => setForm({ ...form, tax_rate: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category Strategy</Label>
                  <Select value={form.category} onValueChange={v => setForm({ ...form, category: v, prescription_required: v === "Prescription" || v === "Controlled" })}>
                    <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 font-black text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#0B0E14] border-white/10 text-white">
                      <SelectItem value="OTC">OTC / Retail</SelectItem>
                      <SelectItem value="Prescription">Prescription Only</SelectItem>
                      <SelectItem value="Supplement">Nutraceuticals</SelectItem>
                      <SelectItem value="Controlled">Dangerous Drug Act (DDA)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-white/[0.02] p-8 rounded-[2rem] border border-white/5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-black text-white italic">VAT Compliance</Label>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Apply tax rate</p>
                  </div>
                  <Switch checked={form.is_taxable} onCheckedChange={v => setForm({ ...form, is_taxable: v })} className="data-[state=checked]:bg-primary" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-black text-white italic">Clinical Block</Label>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Rx Required</p>
                  </div>
                  <Switch checked={form.prescription_required} onCheckedChange={v => setForm({ ...form, prescription_required: v })} className="data-[state=checked]:bg-accent" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-black text-white italic">Visibility</Label>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Active Status</p>
                  </div>
                  <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} className="data-[state=checked]:bg-green-500" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Clinical Indications / Usage Guidelines</Label>
              <textarea
                className="w-full rounded-[2rem] bg-white/5 border-white/10 p-6 text-sm focus:ring-4 focus:ring-primary/10 outline-none min-h-[120px] text-white/80 font-medium leading-relaxed"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Enter clinical notes, antibiotic course details, or contraindications..."
              />
            </div>
          </div>

          <DialogFooter className="p-10 bg-white/[0.02] border-t border-white/5 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <div className="flex w-full justify-between items-center">
              <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">
                <ShieldCheck className="h-4 w-4 text-primary" /> 256-Bit Encrypted Persistence
              </div>
              <div className="flex gap-4">
                <Button variant="ghost" onClick={() => setDialogOpen(false)} className="h-14 rounded-2xl px-8 text-muted-foreground hover:text-white font-black uppercase text-[10px] tracking-widest transition-colors">Cancel Session</Button>
                <Button onClick={handleSave} disabled={saving} className="h-14 rounded-2xl px-12 shadow-2xl shadow-primary/20 font-black uppercase text-[10px] tracking-[0.3em] bg-primary text-black hover:scale-105 transition-all">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin text-black" />}
                  {editingDrug ? "Authorize Changes" : "Confirm Registration"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EntityIntelligenceModal
        open={intelOpen}
        onClose={() => setIntelOpen(false)}
        type="drug"
        data={intelData}
        initialTab={intelTab}
      />
      <ScannerHubModal 
        open={scannerModalOpen} 
        onClose={() => setScannerModalOpen(false)} 
        onScan={handleRemoteScan}
        title="Drug Registration Scanner"
      />
    </div>
  );
}
