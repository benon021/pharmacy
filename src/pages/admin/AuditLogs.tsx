import { useEffect, useState } from "react";
import { localDb, AuditLog } from "@/lib/db";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, Search, Calendar, User, Activity, History, Filter, 
  BarChart as BarIcon, PieChart as PieIcon, Info, Users,
  CheckCircle2, AlertCircle, Clock, ShieldAlert, Fingerprint
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from "recharts";
import EntityIntelligenceModal from "@/components/EntityIntelligenceModal";

const COLORS = ["#10b981", "#6366f1", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [intelOpen, setIntelOpen] = useState(false);
  const [frequencyData, setFrequencyData] = useState<any[]>([]);
  const [moduleDistribution, setModuleDistribution] = useState<any[]>([]);

  useEffect(() => {
    const fetchAudits = async () => {
        const allLogs = await localDb.auditLogs.getAll();
        setLogs(allLogs);

        // 1. Activity Frequency (Last 7 Days)
        const freqMap: Record<string, number> = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const day = d.toLocaleDateString('en-US', { weekday: 'short' });
            freqMap[day] = 0;
        }

        allLogs.forEach(l => {
            const day = new Date(l.created_at).toLocaleDateString('en-US', { weekday: 'short' });
            if (freqMap[day] !== undefined) freqMap[day]++;
        });
        setFrequencyData(Object.entries(freqMap).map(([name, value]) => ({ name, value })));

        // 2. Module Distribution
        const modMap: Record<string, number> = {};
        allLogs.forEach(l => {
            modMap[l.module] = (modMap[l.module] || 0) + 1;
        });
        setModuleDistribution(Object.entries(modMap).map(([name, value]) => ({ name, value })));
    };
    fetchAudits();
  }, []);

  const filteredLogs = (logs || []).filter(log => {
    const matchesSearch = 
      (log?.action || "").toLowerCase().includes(search.toLowerCase()) || 
      (log?.user_name || "").toLowerCase().includes(search.toLowerCase());
    const matchesModule = moduleFilter === "All" || log?.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  const modules = ["All", "Auth", "Inventory", "Sales", "Settings", "Restock"];

  const handleOpenIntel = (log: AuditLog) => {
    setSelectedLog(log);
    setIntelOpen(true);
  };

  return (
    <div className="space-y-10 animate-fade-in pb-32">
      {/* Audit Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-[0.4em] mb-1 italic">
          <Shield className="h-4 w-4" /> System Audit Logs
        </div>
        <h1 className="text-4xl xl:text-6xl font-black tracking-tighter text-foreground dark:text-white italic leading-none">
          Operational <span className="text-primary not-italic tracking-normal">Activity</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">Secure record of all system events and administrative actions.</p>
      </div>

      {/* Analytics Pulse Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 premium-card p-8 border-white/5 space-y-8 bg-white/[0.01]">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary border border-primary/10 flex items-center justify-center">
                    <BarIcon className="h-6 w-6" />
                  </div>
                  <div className="space-y-0.5">
                     <h2 className="text-xl font-black italic text-white uppercase tracking-tighter">Event Frequency</h2>
                     <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">7-Day Activity Trend</p>
                  </div>
               </div>
               <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black uppercase tracking-widest px-3 italic py-1">Integrity: 100%</Badge>
            </div>
            <div className="h-48 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={frequencyData}>
                     <Tooltip 
                        contentStyle={{ backgroundColor: "#09090b", borderRadius: "1.5rem", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(20px)" }}
                        itemStyle={{ color: "#10b981", fontStyle: "italic", fontWeight: "900", fontSize: "12px" }}
                        cursor={{ fill: "rgba(255,255,255,0.02)" }}
                     />
                     <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {frequencyData.map((_, index) => (
                           <Cell key={`cell-${index}`} fill={index === 6 ? "#10b981" : "#3f3f46"} fillOpacity={index === 6 ? 1 : 0.3} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="premium-card p-8 border-white/5 space-y-8 bg-white/[0.01]">
            <div className="flex items-center gap-4">
               <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/10 flex items-center justify-center">
                 <PieIcon className="h-6 w-6" />
               </div>
               <div className="space-y-0.5">
                  <h2 className="text-xl font-black italic text-white uppercase tracking-tighter">Module Reach</h2>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Audit Distribution</p>
               </div>
            </div>
            <div className="h-48 w-full flex items-center justify-center">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie 
                        data={moduleDistribution} 
                        innerRadius={60} 
                        outerRadius={80} 
                        paddingAngle={5} 
                        dataKey="value" 
                        stroke="none"
                     >
                        {moduleDistribution.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                     </Pie>
                     <Tooltip contentStyle={{ backgroundColor: "#09090b", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.1)" }} />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

      {/* Filter Matrix */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative group flex-1">
          <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-all duration-500" />
          <Input
            placeholder="Search system activity..."
            className="pl-14 h-16 rounded-[2rem] bg-white/[0.02] border-white/5 text-base transition-all focus:bg-white/[0.05] focus:border-primary/20 italic font-medium placeholder:text-white/20"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 items-center px-2">
          {modules.map(mod => (
            <button
              key={mod}
              onClick={() => setModuleFilter(mod)}
              className={cn(
                "h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border transition-all whitespace-nowrap italic",
                moduleFilter === mod 
                  ? "bg-primary text-black border-primary shadow-[0_0_30px_rgba(16,185,129,0.3)] scale-105" 
                  : "bg-white/[0.02] text-muted-foreground border-white/5 hover:bg-white/[0.05]"
              )}
            >
              {mod}
            </button>
          ))}
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="premium-card !p-0 overflow-hidden border-white/5 bg-white/[0.01]">
        <Table>
          <TableHeader>
            <TableRow className="bg-white/[0.03] hover:bg-white/[0.03] border-white/5 pointer-events-none">
              <TableHead className="py-8 font-black text-[10px] uppercase tracking-[0.3em] text-muted-foreground px-10 w-[240px] italic">Activity Timestamp</TableHead>
              <TableHead className="py-8 font-black text-[10px] uppercase tracking-[0.3em] text-muted-foreground w-[200px] italic">Authorized User</TableHead>
              <TableHead className="py-8 font-black text-[10px] uppercase tracking-[0.3em] text-muted-foreground w-[150px] italic">System Module</TableHead>
              <TableHead className="py-8 font-black text-[10px] uppercase tracking-[0.3em] text-muted-foreground px-10 italic">Event Description</TableHead>
              <TableHead className="py-8 w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-32 text-muted-foreground">
                  <div className="flex flex-col items-center gap-6">
                    <History className="h-16 w-16 opacity-[0.05] animate-pulse" />
                    <p className="text-xs font-black uppercase tracking-[0.4em] italic">No activity logs found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredLogs.map((log, i) => (
              <TableRow 
                key={log.id}
                onClick={() => handleOpenIntel(log)}
                className="group cursor-pointer hover:bg-white/[0.04] border-white/5 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <TableCell className="px-10 py-6">
                  <div className="flex items-center gap-3 text-xs font-black italic tracking-wider text-white">
                    <Clock className="h-4 w-4 text-primary opacity-40" />
                    {new Date(log.created_at).toLocaleDateString()}
                    <span className="opacity-20 mx-1">—</span>
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-white/[0.05] border border-white/5 flex items-center justify-center text-[11px] font-black text-white italic group-hover:scale-110 transition-transform shadow-inner">
                      {log.user_name[0]}
                    </div>
                    <span className="text-sm font-black text-white italic tracking-tighter uppercase">{log.user_name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn(
                    "rounded-xl px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] italic border-none shadow-sm",
                    log.module === "Auth" ? "bg-indigo-500/10 text-indigo-400" :
                    log.module === "Sales" ? "bg-primary/10 text-primary" :
                    log.module === "Inventory" ? "bg-amber-500/10 text-amber-500" :
                    log.module === "Restock" ? "bg-green-500/10 text-green-500" :
                    "bg-white/10 text-white/40"
                  )}>
                    {log.module}
                  </Badge>
                </TableCell>
                <TableCell className="px-10">
                  <p className="text-sm text-white/70 font-medium italic group-hover:text-white transition-colors leading-relaxed">
                    {log.action}
                  </p>
                </TableCell>
                <TableCell className="pr-10 text-right">
                   <div className="h-10 w-10 rounded-xl bg-white/[0.05] flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-all">
                      <Info className="h-4 w-4" />
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
        type="audit"
        data={selectedLog}
      />
    </div>
  );
}
