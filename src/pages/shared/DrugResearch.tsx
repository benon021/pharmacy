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
  ChevronDown,
  Camera,
  Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
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
  
  // External Media
  images?: string[];
}

const SectionHeader = ({ icon: Icon, title, color = "primary" }: any) => (
  <div className="flex items-center gap-2 mb-4">
    <div className={cn("h-6 w-6 rounded-lg flex items-center justify-center", `bg-${color}/10 text-${color}`)}>
      <Icon size={14} />
    </div>
    <h4 className={cn("text-[10px] font-black uppercase tracking-[0.3em]", `text-${color}`)}>{title}</h4>
  </div>
);

const DataBlock = ({ content, title, icon: Icon }: any) => {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!content || !content[0]) return null;

  const text = content[0];
  const isLong = text.length > 400;

  return (
    <div className="space-y-3 bg-white/[0.01] border border-white/5 p-6 rounded-2xl group hover:bg-white/[0.03] transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground group-hover:text-white transition-colors">
          {Icon && <Icon size={14} />}
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
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const fetchDrugImages = async (brandName: string) => {
    try {
      // NIH RxImage API
      const response = await axios.get(`https://rxnav.nlm.nih.gov/REST/rximage/search`, {
        params: { name: brandName }
      });
      return response.data.nlmRxImages?.map((img: any) => img.imageUrl) || [];
    } catch (e) {
      return [];
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResults([]);
    setSelectedDrug(null);
    
    try {
      // Searching brand name OR generic name OR substance with wildcards
      const response = await axios.get(`https://api.fda.gov/drug/label.json`, {
        params: {
          search: `(openfda.brand_name:"${query}*" openfda.generic_name:"${query}*" substance_name:"${query}*")`,
          limit: 25
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

  const openIntelligenceReport = async (drug: DrugLabelResult) => {
    setSelectedDrug(drug);
    setIsDetailLoading(true);
    
    // Fetch images in the background
    if (drug.brand_name?.[0]) {
      const imgs = await fetchDrugImages(drug.brand_name[0]);
      setSelectedDrug(prev => prev ? { ...prev, images: imgs } : null);
    }
    setIsDetailLoading(false);
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
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40 mt-1">Multi-Source Hybrid Registry v4.5</p>
               </div>
            </div>
            
            <form onSubmit={handleSearch} className="hidden lg:flex relative group w-[500px]">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Molecular Formula / Brand Name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-14 pl-14 pr-32 rounded-2xl bg-white/[0.03] border-white/5 focus:border-primary/40 focus:bg-white/[0.06] text-sm font-bold uppercase tracking-widest transition-all shadow-2xl! shadow-black/80!"
              />
              <Button 
                type="submit"
                disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-8 px-4 rounded-xl bg-primary text-black font-black uppercase tracking-widest text-[8px]"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Initiate Scry"}
              </Button>
            </form>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pb-32">
          {/* Registry Index Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {results.map((drug, index) => (
                <motion.div
                  key={drug.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => openIntelligenceReport(drug)}
                  className="p-8 cursor-pointer transition-all border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-primary/40 rounded-[2.5rem] group relative overflow-hidden flex flex-col justify-between h-72 shadow-2xl! shadow-black/40!"
                >
                  <div className="relative z-10 space-y-6">
                    <div className="flex flex-wrap gap-2">
                       <Badge className="bg-primary text-black font-black uppercase text-[8px] tracking-widest py-1 px-2.5 rounded-lg">
                        {drug.brand_name?.[0] || "Component"}
                       </Badge>
                       {drug.route?.[0] && (
                        <Badge variant="outline" className="border-white/10 text-[8px] font-black uppercase tracking-widest px-2.5">
                          {drug.route[0]}
                        </Badge>
                       )}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {drug.generic_name?.[0] || "Unknown Molecule"}
                      </h3>
                      <div className="flex items-center gap-3 mt-4">
                         <div className="h-px w-8 bg-primary/30" />
                         <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground truncate">
                          {drug.manufacturer_name?.[0] || "Global Pharm Source"}
                         </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground group-hover:text-white transition-colors">
                     <p className="text-[9px] font-black uppercase tracking-[0.3em]">Query Token: {drug.id.slice(0, 8)}</p>
                     <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {results.length === 0 && !isLoading && (
            <div className="py-44 flex flex-col items-center justify-center text-center opacity-10">
                <div className="h-44 w-44 rounded-full border-[6px] border-dashed border-white/20 flex items-center justify-center mb-10 rotate-12">
                    <BookOpen size={96} className="text-white" />
                </div>
                <h2 className="text-6xl font-black italic tracking-tighter uppercase">Registry Hub Standby</h2>
                <p className="text-xs font-black uppercase tracking-[0.8em] mt-6">Awaiting clinical search parameters...</p>
            </div>
          )}
        </div>
      </div>

      {/* Intelligence Modal Report */}
      <Dialog open={!!selectedDrug} onOpenChange={(open) => !open && setSelectedDrug(null)}>
        <DialogContent className="max-w-[1400px] w-[95vw] h-[90vh] bg-[#0A0A0C] border-white/5 rounded-[4rem] overflow-hidden p-0 shadow-3xl!">
          <div className="h-full flex flex-col">
            {/* Modal Header */}
            <div className="h-24 px-12 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/[0.02]">
              <div className="flex items-center gap-6">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <ShieldCheck size={28} />
                </div>
                <div>
                   <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white leading-none">Comprehensive Intelligence Report</h2>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40 mt-1.5 flex items-center gap-2">
                    <FlaskConical size={12} /> SECURE FDA/NIH DATALINK ACTIVE
                   </p>
                </div>
              </div>
              <Button onClick={() => setSelectedDrug(null)} variant="ghost" className="h-12 w-12 rounded-2xl text-muted-foreground hover:bg-white/5">
                <X size={24} />
              </Button>
            </div>

            {/* Modal Content Scrollable Area */}
            {selectedDrug && (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-12 space-y-20">
                
                {/* Visual Identity Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
                   <div className="lg:col-span-7 space-y-10">
                      <div className="space-y-6">
                        <div className="flex flex-wrap gap-2">
                           <Badge className="bg-primary text-black font-black uppercase text-[10px] tracking-widest py-1.5 px-4 rounded-xl">MASTER RECORD</Badge>
                           <Badge variant="outline" className="border-white/10 text-[10px] font-black uppercase tracking-widest px-4">{selectedDrug.route?.[0]}</Badge>
                        </div>
                        <div>
                          <h1 className="text-6xl font-black italic tracking-tighter uppercase leading-none text-white tracking-widest!">
                            {selectedDrug.brand_name?.[0] || selectedDrug.generic_name?.[0]}
                          </h1>
                          <p className="text-xl font-medium text-white/40 italic mt-6 border-l-4 border-primary pl-6 max-w-2xl">
                            {selectedDrug.generic_name?.[0]} — {selectedDrug.manufacturer_name?.[0]}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-6">
                        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-2">
                           <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Class Logic</p>
                           <p className="text-sm font-bold uppercase text-primary truncate">{selectedDrug.pharm_class_moa?.[0] || "General"}</p>
                        </div>
                        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-2">
                           <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Substance Token</p>
                           <p className="text-sm font-bold uppercase text-primary truncate">{selectedDrug.substance_name?.[0] || "Complex"}</p>
                        </div>
                        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-2">
                           <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Logistics ID</p>
                           <p className="text-sm font-bold uppercase text-primary truncate">{selectedDrug.id.slice(0, 10).toUpperCase()}</p>
                        </div>
                      </div>
                   </div>

                   {/* Image & Photo Intelligence */}
                   <div className="lg:col-span-5 space-y-6">
                      <div className="aspect-[4/3] rounded-[3rem] bg-gradient-to-br from-white/5 to-transparent border border-white/10 overflow-hidden relative group shadow-3xl!">
                         {isDetailLoading ? (
                           <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/40 backdrop-blur-3xl">
                             <Loader2 className="h-10 w-10 animate-spin text-primary" />
                             <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary">Streaming NIH Graphics...</p>
                           </div>
                         ) : selectedDrug.images && selectedDrug.images.length > 0 ? (
                            <img 
                              src={selectedDrug.images[0]} 
                              alt="Physical ID" 
                              className="w-full h-full object-contain p-8 group-hover:scale-105 transition-transform duration-700" 
                            />
                         ) : (
                           <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 opacity-30 group-hover:opacity-60 transition-opacity">
                             <div className="h-24 w-24 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                                <ImageIcon size={48} />
                             </div>
                             <p className="text-[10px] font-black uppercase tracking-[0.4em]">Official Photo N/A</p>
                           </div>
                         )}
                         <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                            <div className="px-4 py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full text-[8px] font-black uppercase tracking-[0.3em]">
                               RXNAV VISUAL SIGNATURE
                            </div>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-primary text-black">
                               <Camera size={18} />
                            </Button>
                         </div>
                      </div>
                      <p className="text-center text-[9px] font-medium text-white/20 italic italic pr-6 pl-6">Clinical rendering provided by RxImage NIH Cloud. Some variations in coloring and shape may exist.</p>
                   </div>
                </div>

                {/* Safety Intelligence Section */}
                <div className="space-y-12">
                   <SectionHeader icon={ShieldAlert} title="Critical Safety Intelligence" color="red-500" />
                   
                   {selectedDrug.boxed_warning && (
                      <div className="p-10 rounded-[3rem] bg-red-500/10 border border-red-500/20 space-y-6 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
                         <div className="flex items-center gap-3 text-red-500">
                            <AlertCircle size={24} strokeWidth={3} />
                            <h3 className="text-lg font-black uppercase tracking-[0.2em] italic">Official Boxed Warning</h3>
                         </div>
                         <div className="text-lg font-bold text-red-200/90 leading-relaxed italic border-l-4 border-red-500/30 pl-8">
                            {selectedDrug.boxed_warning[0]}
                         </div>
                      </div>
                   )}

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <DataBlock title="Contraindications" icon={ShieldAlert} content={selectedDrug.contraindications} />
                      <DataBlock title="Drug Interaction Matrix" icon={Zap} content={selectedDrug.drug_interactions} />
                      <DataBlock title="Adverse Reactivity" icon={Activity} content={selectedDrug.adverse_reactions} />
                      <DataBlock title="Major Warnings" icon={AlertCircle} content={selectedDrug.warnings} />
                   </div>
                </div>

                {/* Clinical Pharmacology */}
                <div className="space-y-12 pb-20 border-t border-white/5 pt-20">
                   <SectionHeader icon={Microscope} title="Clinical Intelligence Hub" color="blue-500" />
                   <div className="grid grid-cols-1 gap-10">
                      <DataBlock title="Pharmacological Mechanism (MOA)" icon={Zap} content={selectedDrug.clinical_pharmacology} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <DataBlock title="Indications & Usage" icon={Stethoscope} content={selectedDrug.indications_and_usage} />
                         <DataBlock title="Dosage Profile" icon={Info} content={selectedDrug.dosage_and_administration} />
                      </div>
                      <DataBlock title="Scientific Description" icon={Info} content={selectedDrug.description} />
                   </div>
                </div>

                {/* Logistics */}
                <div className="space-y-12 pb-24 border-t border-white/5 pt-20">
                   <SectionHeader icon={Package} title="Deployment Intelligence" color="amber-500" />
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <DataBlock title="Storage Logic" icon={Thermometer} content={selectedDrug.storage_and_handling} />
                      <DataBlock title="Format & Supply" icon={Package} content={selectedDrug.how_supplied} />
                      <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] flex flex-col justify-center gap-6">
                        <div className="space-y-2">
                           <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Protocol Verification</p>
                           <p className="text-xs text-white/40 italic">Check against official FDA-vetted labels in the Source SPL Registry.</p>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => window.open(`https://open.fda.gov/drug/label/results/?search=id:${selectedDrug.id}`, '_blank')}
                          className="h-14 rounded-2xl border-primary/20 text-primary font-black uppercase tracking-widest text-[9px] hover:bg-primary hover:text-black transition-all gap-3"
                        >
                          Launch Master Record <ExternalLink size={14} />
                        </Button>
                      </div>
                   </div>
                </div>

              </div>
            )}
            
            {/* Modal Bottom Branding */}
            <div className="h-16 border-t border-white/5 px-12 flex items-center justify-between shrink-0 bg-white/[0.01]">
                <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20">© 2026 Lumiaxy Intelligence Hub — Secure Clinical Uplink</p>
                <div className="flex items-center gap-4">
                   <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                   <span className="text-[10px] font-black tracking-widest text-primary/40 uppercase">Datalink Stream: Validated</span>
                </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
