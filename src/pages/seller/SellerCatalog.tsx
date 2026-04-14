import { useEffect, useState } from "react";
import { localDb } from "@/lib/db";
import EntityIntelligenceModal from "@/components/EntityIntelligenceModal";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, AlertTriangle, Package, Pill, Filter, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SellerCatalog() {
  const [drugs, setDrugs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [intelOpen, setIntelOpen] = useState(false);
  const [intelData, setIntelData] = useState<any>(null);

  useEffect(() => {
    const fetchDrugs = async () => {
      const allDrugs = await localDb.drugs.getAll();
      setDrugs(allDrugs.filter(d => d.is_active));
    };
    fetchDrugs();
  }, []);

  const filtered = drugs.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || (d.generic_name?.toLowerCase().includes(search.toLowerCase()));
    const matchCat = category === "all" || d.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-primary font-semibold text-sm">
          <Package className="h-4 w-4" />
          Inventory Node
        </div>
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">
          Product Catalog
        </h1>
        <p className="text-muted-foreground">Search and verify medicine availability across local stock</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative group flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search by drug name or generic formula..." 
            className="pl-12 h-14 rounded-2xl bg-card dark:bg-white/5 border-border dark:border-white/10 text-lg transition-all focus:bg-white/10" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <div className="w-full md:w-64 h-14 relative">
          <Filter className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-full rounded-2xl bg-card dark:bg-white/5 border-border dark:border-white/10 pl-11 text-xs font-bold uppercase tracking-widest text-foreground dark:text-white">
              <SelectValue placeholder="Category Filter" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border dark:border-white/10 text-foreground dark:text-white font-bold">
              <SelectItem value="all">All Modules</SelectItem>
              <SelectItem value="OTC">OTC (Over the counter)</SelectItem>
              <SelectItem value="Prescription">Prescription (Rx)</SelectItem>
              <SelectItem value="Supplement">Supplements</SelectItem>
              <SelectItem value="Controlled">Controlled Substances</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="premium-card !p-0 overflow-hidden border-border dark:border-white/5!">
        <Table>
          <TableHeader>
            <TableRow className="bg-white/[0.03] hover:bg-white/[0.03] border-border dark:border-white/5">
              <TableHead className="py-6 px-6 font-bold text-xs uppercase tracking-[0.2em] text-muted-foreground">Medicine Specifications</TableHead>
              <TableHead className="py-6 font-bold text-xs uppercase tracking-[0.2em] text-muted-foreground">Classification</TableHead>
              <TableHead className="py-6 text-right font-bold text-xs uppercase tracking-[0.2em] text-muted-foreground">Unit Price</TableHead>
              <TableHead className="py-6 px-6 text-right font-bold text-xs uppercase tracking-[0.2em] text-muted-foreground">Storage Level</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-24 text-muted-foreground">
                  No medicine matches the current query
                </TableCell>
              </TableRow>
            ) : filtered.map((d, i) => (
              <TableRow 
                key={d.id}
                onClick={() => {
                  setIntelData(d);
                  setIntelOpen(true);
                }}
                className="group hover:bg-muted dark:bg-white/[0.02] border-border dark:border-white/5 transition-colors animate-fade-in cursor-pointer hover-glow-intel"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <TableCell className="px-6 py-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-card dark:bg-white/5 text-muted-foreground border border-border dark:border-white/5 group-hover:border-primary/20 group-hover:text-primary transition-all">
                      <Pill className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground dark:text-white text-base group-hover:text-primary transition-colors">{d.name}</p>
                      {d.generic_name && (
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
                          Ref: {d.generic_name}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                   <div className="flex flex-wrap gap-2">
                    <Badge className={cn(
                      "rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest border",
                      d.category === "Controlled" 
                        ? "bg-red-500/10 text-red-500 border-red-500/20" 
                        : d.category === "Prescription" 
                          ? "bg-primary/10 text-primary border-primary/20" 
                          : "bg-card dark:bg-white/5 text-muted-foreground border-border dark:border-white/10"
                    )}>
                      {d.category}
                    </Badge>
                    {d.prescription_required && (
                      <Badge variant="outline" className="rounded-lg h-6 border-accent/20 text-accent bg-accent/5 text-[9px] font-bold">REQUIRED Rx</Badge>
                    )}
                   </div>
                </TableCell>
                <TableCell className="text-right">
                  <p className="text-lg font-bold text-foreground dark:text-white tracking-tighter tabular-nums">KES {Number(d.price).toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Per {d.unit}</p>
                </TableCell>
                <TableCell className="text-right px-6">
                  <div className="inline-flex flex-col items-end">
                    <div className={cn(
                      "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-tighter",
                      d.stock <= d.low_stock_threshold 
                        ? "bg-red-500/10 text-red-500 border border-red-500/20" 
                        : "bg-green-500/10 text-green-500 border border-green-500/20"
                    )}>
                      {d.stock} <span className="opacity-50 text-[10px]">{d.unit}</span>
                      {d.stock <= d.low_stock_threshold && <AlertTriangle className="h-3 w-3 animate-pulse" />}
                    </div>
                    {d.stock <= d.low_stock_threshold && (
                      <p className="text-[10px] text-red-400 font-bold uppercase mt-1 tracking-tight">Low Allocation</p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EntityIntelligenceModal 
        open={intelOpen} 
        onClose={() => setIntelOpen(false)} 
        type="drug" 
        data={intelData} 
      />
    </div>
  );
}
