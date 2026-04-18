import React, { useState, useRef } from "react";
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
  Zap,
  ShieldCheck,
  Stethoscope,
  Microscope,
  Package,
  Thermometer,
  Eye,
  Activity,
  ChevronDown
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
  substance_name?: string[];
  route?: string[];
  pharm_class_cs?: string[];
  pharm_class_moa?: string[];
  
  // Dense Clinical Data
  purpose?: string[];
  indications_and_usage?: string[];
  dosage_and_administration?: string[];
  active_ingredient?: string[];
  warnings?: string[];
  boxed_warning?: string[];
  contraindications?: string[];
  adverse_reactions?: string[];
  drug_interactions?: string[];
  clinical_pharmacology?: string[];
  overdosage?: string[];
  storage_and_handling?: string[];
  how_supplied?: string[];
  description?: string[];
}

const SectionHeader = ({ icon: Icon, title, color = "primary" }: any) => (
  <div className="flex items-center gap-2 mb-4">
    <div className={cn("h-6 w-6 rounded-lg flex items-center justify-center", `bg-${color}/10 text-${color}`)}>
      <Icon size={14} />
    </div>
    <h4 className={cn("text-[10px] font-black uppercase tracking-[0.3em]", `text-${color}`)}>{title}</h4>
  </div>
);

const DataBlock = ({ content, title, icon }: any) => {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!content || !content[0]) return null;

  const text = content[0];
  const isLong = text.length > 400;

  return (
    <div className="space-y-3 bg-white/[0.01] border border-white/5 p-6 rounded-2xl group hover:bg-white/[0.03] transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground group-hover:text-white transition-colors">
          {icon && React.createElement(icon, { size: 14 })}
          <span className="text-[9px] font-black uppercase tracking-widest">{title}</span>
        </div>
      </div>
      <div className={cn(
        "text-[12px] leading-relaxed text-white/70 font-medium whitespace-pre-wrap",
        !isExpanded && isLong && "line-clamp-4"
      )}>
        {text}
      </div>
      {isLong && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1"
        >
          {isExpanded ? "Collapse Report" : "Read Full Analysis"} 
          <ChevronDown size={10} className={cn("transition-transform", isExpanded && "rotate-180")} />
        </button>
      )}
    </div>
  );
};

export default function DrugResearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DrugLabelResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<DrugLabelResult | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResults([]);
    setSelectedDrug(null);
    
    try {
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
        substance_name: r.openfda?.substance_name,
        route: r.openfda?.route,
        pharm_class_cs: r.openfda?.pharm_class_cs,
        pharm_class_moa: r.openfda?.pharm_class_moa,
        
        purpose: r.purpose,
        indications_and_usage: r.indications_and_usage,
        dosage_and_administration: r.dosage_and_administration,
        active_ingredient: r.active_ingredient,
        warnings: r.warnings,
        boxed_warning: r.boxed_warning,
        contraindications: r.contraindications,
        adverse_reactions: r.adverse_reactions,
        drug_interactions: r.drug_interactions,
        clinical_pharmacology: r.clinical_pharmacology,
        overdosage: r.overdosage,
        storage_and_handling: r.storage_and_handling,
        how_supplied: r.how_supplied,
        description: r.description
      }));

      setResults(formatted);
      if (formatted.length === 0) toast.info("No matching records found.");
    } catch (err: any) {
      toast.error("Global Registry Timeout.");
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToTop = () => {
     if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
     }
  };

  return (
    <div className="min-h-screen bg-[#050507] text-white font-sans overflow-hidden flex flex-col">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[140px]" />
      </div>

      <div className="flex-1 flex flex-col p-4 md:p-8 space-y-8 overflow-hidden">
        {/* Universal Search Interface */}
        <div className="flex flex-col gap-8 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shadow-2xl">
                  <Microscope size={24} />
               </div>
               <div>
                  <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Clinical <span className="text-primary not-italic">Intelligence</span></h1>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40 mt-1">Lumiaxy Global Registry v4.0</p>
               </div>
            </div>
            
            <form onSubmit={handleSearch} className="hidden lg:flex relative group w-[500px]">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Molecular Formula / Brand Name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-14 pl-14 pr-32 rounded-2xl bg-white/[0.03] border-white/5 focus:border-primary/40 focus:bg-white/[0.06] text-sm font-bold uppercase tracking-widest transition-all"
              />
              <Button 
                type="submit"
                disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-8 px-4 rounded-xl bg-primary text-black font-black uppercase tracking-widest text-[8px]"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Query"}
              </Button>
            </form>
          </div>
          
          <form onSubmit={handleSearch} className="lg:hidden relative group w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search Meds..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-14 pl-14 rounded-2xl bg-card border-white/5"
            />
          </form>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden pb-8">
          {/* Registry Index */}
          <div className={cn("flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2", selectedDrug ? "lg:col-span-3" : "lg:col-span-12")}>
            <AnimatePresence mode="popLayout">
              {results.map((drug, index) => (
                <motion.div
                  key={drug.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => { setSelectedDrug(drug); scrollToTop(); }}
                  className={cn(
                    "p-6 cursor-pointer transition-all border rounded-3xl group relative overflow-hidden",
                    selectedDrug?.id === drug.id 
                      ? "bg-primary/10 border-primary shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)] scale-[1.02]" 
                      : "bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.05]"
                  )}
                >
                  <div className="relative z-10 flex items-start justify-between">
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {drug.brand_name?.slice(0, 1).map((name, i) => (
                          <Badge key={i} className="bg-primary text-black font-black uppercase text-[8px] tracking-widest py-1 px-2.5 rounded-lg">{name}</Badge>
                        ))}
                      </div>
                      <div>
                        <h3 className="text-lg font-black italic tracking-tighter uppercase leading-none group-hover:text-primary transition-colors">
                          {drug.generic_name?.[0] || "Component Registry"}
                        </h3>
                        <div className="flex items-center gap-3 mt-3">
                           <div className="h-px w-6 bg-primary/30" />
                           <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground truncate max-w-[150px]">
                            {drug.manufacturer_name?.[0] || "Global Source"}
                           </p>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={18} className={cn("text-muted-foreground transition-all", selectedDrug?.id === drug.id && "rotate-90 text-primary")} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {results.length === 0 && !isLoading && !query && (
              <div className="py-32 flex flex-col items-center justify-center text-center opacity-10">
                  <div className="h-32 w-32 rounded-full border-[4px] border-dashed border-white/20 flex items-center justify-center mb-8 rotate-12">
                      <BookOpen size={64} className="text-white" />
                  </div>
                  <h2 className="text-4xl font-black italic tracking-tighter uppercase">Registry Standby</h2>
                  <p className="text-xs font-black uppercase tracking-[0.5em] mt-4">Establish search connection to stream clinical data</p>
              </div>
            )}
          </div>

          {/* Deep Intelligence Detail Section */}
          <AnimatePresence>
            {selectedDrug && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="lg:col-span-9 bg-white/[0.02] border border-white/10 rounded-[3rem] overflow-hidden flex flex-col shadow-2xl backdrop-blur-3xl"
              >
                {/* Internal Scrollable Content */}
                <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 space-y-16">
                  
                  {/* Visual Header & Profile */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-start">
                    <div className="space-y-8">
                      <div className="flex items-center gap-4">
                         <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-primary to-orange-500 flex items-center justify-center text-black shadow-xl shadow-primary/20">
                            <Pill size={28} />
                         </div>
                         <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-1 block">Clinical Master Record</span>
                            <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">{selectedDrug.brand_name?.[0] || selectedDrug.generic_name?.[0]}</h2>
                         </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-3">
                         {selectedDrug.substance_name?.slice(0, 3).map((sub, i) => (
                           <div key={i} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2">
                              <FlaskConical size={12} className="text-primary/60" />
                              <span className="text-[10px] font-black uppercase tracking-widest">{sub}</span>
                           </div>
                         ))}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">Primary Route</p>
                            <div className="flex items-center gap-2">
                               <Package size={14} className="text-primary" />
                               <span className="text-sm font-bold uppercase">{selectedDrug.route?.[0] || "Unknown"}</span>
                            </div>
                         </div>
                         <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">Class Structure</p>
                            <div className="flex items-center gap-2">
                               <Zap size={14} className="text-primary" />
                               <span className="text-xs font-bold uppercase truncate">{selectedDrug.pharm_class_cs?.[0]?.split('[')?.[0] || "N/A"}</span>
                            </div>
                         </div>
                      </div>
                    </div>

                    {/* Virtual Spec Visualization */}
                    <div className="relative group">
                       <div className="absolute inset-0 bg-primary/10 rounded-[2.5rem] blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity" />
                       <div className="relative aspect-[4/3] rounded-[2.5rem] bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex flex-col items-center justify-center gap-8 overflow-hidden group shadow-2xl">
                          <motion.div 
                            initial={{ rotate: -15, scale: 0.9 }}
                            animate={{ rotate: 10, scale: 1.1 }}
                            transition={{ repeat: Infinity, duration: 6, repeatType: 'reverse' }}
                            className="text-primary/10 absolute -right-10 -bottom-10"
                          >
                            <Microscope size={300} strokeWidth={1} />
                          </motion.div>
                          
                          <div className="flex flex-col items-center gap-4 relative z-10">
                             <div className="h-32 w-32 rounded-3xl bg-black border border-primary/20 flex items-center justify-center text-primary shadow-2xl shadow-primary/10">
                                <Zap size={64} className="animate-pulse" />
                             </div>
                             <div className="text-center">
                                <h4 className="text-[11px] font-black uppercase tracking-[0.4em] mb-1 italic text-white/40">Visual Spec ID</h4>
                                <p className="text-xl font-black font-mono tracking-tighter text-primary">{selectedDrug.id.slice(0, 8).toUpperCase()}</p>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Safety Critical Section */}
                  <div className="space-y-8 pt-8 border-t border-white/5">
                    <SectionHeader icon={ShieldAlert} title="Safety Intelligence" color="red-500" />
                    
                    {selectedDrug.boxed_warning && (
                       <div className="p-8 rounded-[2rem] bg-red-500/10 border border-red-500/30 space-y-4 animate-pulse-slow">
                          <div className="flex items-center gap-2 text-red-500">
                             <ShieldAlert size={18} />
                             <span className="text-[11px] font-black uppercase tracking-widest">CRITICAL BLACK BOX WARNING</span>
                          </div>
                          <p className="text-sm font-bold text-red-200/80 leading-relaxed italic pr-12">
                            {selectedDrug.boxed_warning[0]}
                          </p>
                       </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <DataBlock title="Contraindications" icon={ShieldAlert} content={selectedDrug.contraindications} />
                       <DataBlock title="Warnings & Precautions" icon={AlertCircle} content={selectedDrug.warnings} />
                       <DataBlock title="Adverse Reactions" icon={Activity} content={selectedDrug.adverse_reactions} />
                       <DataBlock title="Pharmaceutical Interactions" icon={Zap} content={selectedDrug.drug_interactions} />
                    </div>
                  </div>

                  {/* Deep Clinical Data */}
                  <div className="space-y-8 pt-8 border-t border-white/5">
                    <SectionHeader icon={Microscope} title="Molecular Intelligence" color="blue-500" />
                    <div className="grid grid-cols-1 gap-6">
                       <DataBlock title="Clinical Pharmacology" icon={FlaskConical} content={selectedDrug.clinical_pharmacology} />
                       <DataBlock title="Mechanism of Action" icon={Zap} content={selectedDrug.pharm_class_moa} />
                       <DataBlock title="Medical Description" icon={Info} content={selectedDrug.description} />
                       <DataBlock title="Therapeutic Intent (Purpose)" icon={Stethoscope} content={selectedDrug.purpose} />
                    </div>
                  </div>

                  {/* Logistics & Storage */}
                  <div className="space-y-8 pt-8 border-t border-white/5 pb-12">
                    <SectionHeader icon={Package} title="Deployment Intelligence" color="amber-500" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <DataBlock title="Storage & Handling" icon={Thermometer} content={selectedDrug.storage_and_handling} />
                       <DataBlock title="Physical Supply & Form" icon={Package} content={selectedDrug.how_supplied} />
                       <DataBlock title="Overdosage Recovery" icon={ShieldAlert} content={selectedDrug.overdosage} />
                       <div className="p-8 rounded-[2rem] bg-white/[0.01] border border-white/5 flex flex-col justify-center">
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground mb-4">Official Documentation</p>
                          <Button 
                            variant="outline" 
                            className="rounded-2xl border-primary/20 text-primary uppercase text-[9px] font-black tracking-widest gap-2 hover:bg-primary hover:text-black transition-all"
                            onClick={() => window.open(`https://open.fda.gov/drug/label/results/?search=id:${selectedDrug.id}`, '_blank')}
                          >
                            Access Master SPL File <ExternalLink size={14} />
                          </Button>
                       </div>
                    </div>
                  </div>

                </div>

                {/* Status Bar */}
                <div className="h-14 bg-black/40 border-t border-white/5 px-10 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                       <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                       <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30">Intelligence Uplink: SECURE</p>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest italic text-primary/40">© 2026 Lumiaxy Intelligence Hub</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
