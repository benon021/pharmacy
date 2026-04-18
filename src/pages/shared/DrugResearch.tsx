import React, { useState } from "react";
import axios from "axios";
import { 
  Search, 
  Pill, 
  AlertCircle, 
  Info, 
  ChevronRight, 
  Loader2, 
  ExternalLink, 
  BookOpen, 
  FlaskConical, 
  ShieldAlert,
  Menu,
  X,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DrugLabelResult {
  id: string;
  brand_name?: string[];
  generic_name?: string[];
  manufacturer_name?: string[];
  purpose?: string[];
  indications_and_usage?: string[];
  dosage_and_administration?: string[];
  active_ingredient?: string[];
  warnings?: string[];
  description?: string[];
}

export default function DrugResearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DrugLabelResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<DrugLabelResult | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResults([]);
    
    try {
      // Searching brand name OR generic name
      const response = await axios.get(`https://api.fda.gov/drug/label.json`, {
        params: {
          search: `openfda.brand_name:"${query}" openfda.generic_name:"${query}"`,
          limit: 15
        }
      });

      const formatted = response.data.results.map((r: any) => ({
        id: r.id,
        brand_name: r.openfda?.brand_name,
        generic_name: r.openfda?.generic_name,
        manufacturer_name: r.openfda?.manufacturer_name,
        purpose: r.purpose,
        indications_and_usage: r.indications_and_usage,
        dosage_and_administration: r.dosage_and_administration,
        active_ingredient: r.active_ingredient,
        warnings: r.warnings,
        description: r.description
      }));

      setResults(formatted);
      if (formatted.length === 0) toast.info("No matching records found in the FDA database.");
    } catch (err: any) {
      console.error("FDA Search Error:", err);
      toast.error("Cloud search failed. Please check your connectivity.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in pb-32">
      {/* Header & Search */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
                <BookOpen size={20} />
             </div>
             <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Global <span className="text-primary not-italic">Drug Intelligence</span></h1>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground ml-13">Powered by openFDA Real-time Data</p>
        </div>

        <form onSubmit={handleSearch} className="relative group max-w-2xl">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search by Brand Name or Generic Formulation (e.g. Aspirin, Ibuprofen)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-16 pl-14 pr-32 rounded-3xl bg-white/[0.02] border-white/5 focus:border-primary/40 focus:bg-white/[0.05] text-lg font-medium transition-all shadow-2xl! shadow-black/40!"
          />
          <Button 
            variant="ghost"
            type="submit"
            disabled={isLoading}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-10 px-6 rounded-2xl bg-primary text-black font-black uppercase tracking-widest text-[9px] hover:scale-105 transition-all"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Query Database"}
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Results List */}
        <div className={cn("space-y-4", selectedDrug ? "lg:col-span-4" : "lg:col-span-12")}>
          <AnimatePresence mode="popLayout">
            {results.map((drug, index) => (
              <motion.div
                key={drug.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedDrug(drug)}
                className={cn(
                  "premium-card p-6 cursor-pointer transition-all border group",
                  selectedDrug?.id === drug.id 
                    ? "bg-primary/5 border-primary/40 ring-1 ring-primary/20" 
                    : "bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.04]"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {drug.brand_name?.map((name, i) => (
                        <Badge key={i} className="bg-primary text-black font-black uppercase text-[8px] tracking-widest py-1.5 px-3 rounded-lg">{name}</Badge>
                      ))}
                      {!drug.brand_name && <Badge className="bg-white/10 text-white font-black uppercase text-[8px] tracking-widest py-1.5 px-3 rounded-lg">GENERIC FORMULA</Badge>}
                    </div>
                    <div>
                      <h3 className="text-xl font-black italic tracking-tighter uppercase leading-none">
                        {drug.generic_name?.[0] || "Unknown Substance"}
                      </h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2 flex items-center gap-2">
                        <FlaskConical size={10} className="text-primary" />
                        {drug.manufacturer_name?.[0] || "Multiple Manufacturers"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={20} className={cn("text-muted-foreground group-hover:text-primary transition-all", selectedDrug?.id === drug.id && "rotate-90 text-primary")} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {results.length === 0 && !isLoading && !query && (
            <div className="py-24 flex flex-col items-center justify-center text-center opacity-30 select-none">
                <div className="h-24 w-24 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center mb-6">
                    <Search size={40} className="text-white/20" />
                </div>
                <h2 className="text-2xl font-black italic tracking-tighter uppercase">Intelligence Terminal Ready</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-3">Awaiting search parameters to query global medical registry</p>
            </div>
          )}
        </div>

        {/* Detailed View */}
        <AnimatePresence>
          {selectedDrug && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-8 flex flex-col gap-6"
            >
              <div className="premium-card p-10 bg-white/[0.03] space-y-10 sticky top-24">
                <div className="flex items-center justify-between">
                   <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                          <ShieldAlert size={20} />
                        </span>
                        <h2 className="text-3xl font-black italic tracking-tighter uppercase">Medical Insights</h2>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium italic border-l-2 border-primary pl-4 max-w-xl">
                        This information is automatically retrieved from official FDA label records. Always consult a healthcare professional before making clinical decisions.
                      </p>
                   </div>
                   <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setSelectedDrug(null)}
                    className="h-12 w-12 rounded-2xl hover:bg-white/5 text-muted-foreground"
                   >
                     <X size={24} />
                   </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Indications */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                      <Zap size={16} />
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Indications & Usage</h4>
                    </div>
                    <div className="text-[13px] text-white/70 leading-relaxed font-medium line-clamp-6 overflow-hidden">
                      {selectedDrug.indications_and_usage?.[0] || "Data not available in this record."}
                    </div>
                  </div>

                  {/* Dosage */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-amber-500">
                      <Info size={16} />
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Dosage & Admin</h4>
                    </div>
                    <div className="text-[13px] text-white/70 leading-relaxed font-medium line-clamp-6 overflow-hidden">
                      {selectedDrug.dosage_and_administration?.[0] || "Data not available in this record."}
                    </div>
                  </div>
                </div>

                <div className="p-8 rounded-[2rem] bg-red-500/10 border border-red-500/20 space-y-4">
                  <div className="flex items-center gap-2 text-red-500 uppercase">
                    <ShieldAlert size={16} />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em]">Safety Warnings</h4>
                  </div>
                  <div className="text-[12px] text-red-400/90 leading-relaxed font-bold italic line-clamp-4">
                    {selectedDrug.warnings?.[0] || "No critical warnings retrieved from this record."}
                  </div>
                </div>

                <div className="pt-6 flex items-center justify-between border-t border-white/5">
                  <div className="flex items-center gap-6">
                    <div className="h-1px w-12 bg-white/10" />
                    <p className="text-[9px] font-black uppercase tracking-[0.5em] opacity-30 italic">Lumiaxy Intelligence Hub</p>
                  </div>
                  <Button variant="link" className="text-primary text-[10px] font-black uppercase tracking-widest gap-2">
                    Official FDA Source <ExternalLink size={12} />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
