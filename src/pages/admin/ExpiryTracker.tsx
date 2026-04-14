import { useEffect, useState } from "react";
import { localDb, Drug } from "@/lib/db";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Pill, Shield, CalendarDays, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type HealthStatus = "expired" | "finished" | "critical_expiry" | "low_stock" | "warning_expiry" | "safe";

function getHealthStatus(drug: Drug): HealthStatus {
  const isFinished = drug.stock <= 0;
  
  if (drug.expiry_date) {
    const diffMs = new Date(drug.expiry_date).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return "expired";
    if (isFinished) return "finished";
    if (diffDays <= 30) return "critical_expiry";
    if (drug.stock <= (drug.low_stock_threshold || 10)) return "low_stock";
    if (diffDays <= 90) return "warning_expiry";
    return "safe";
  }

  if (isFinished) return "finished";
  if (drug.stock <= (drug.low_stock_threshold || 10)) return "low_stock";
  
  return "safe";
}

function getDaysUntilExpiry(expiryDate: string | null): number | null {
  if (!expiryDate) return null;
  const now = new Date();
  const expiry = new Date(expiryDate);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

const statusConfig: Record<HealthStatus, { label: string; color: string; bg: string; border: string; icon: any }> = {
  expired: { label: "EXPIRED", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", icon: AlertTriangle },
  finished: { label: "STOCK OUT", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", icon: AlertTriangle },
  critical_expiry: { label: "CRITICAL EXPIRY", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20", icon: AlertTriangle },
  low_stock: { label: "LOW STOCK", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20", icon: Shield },
  warning_expiry: { label: "EXPIRING SOON", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", icon: Clock },
  safe: { label: "HEALTHY", color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20", icon: CheckCircle },
};

export default function ExpiryTracker() {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [filter, setFilter] = useState<HealthStatus | "all">("all");

  useEffect(() => {
    const allDrugs = localDb.drugs.getAll().filter(d => d.is_active);
    // Sort by expiry date ascending (earliest first) taking into account stock priority
    allDrugs.sort((a, b) => {
      const aStatus = getHealthStatus(a);
      const bStatus = getHealthStatus(b);
      if (aStatus === "expired" && bStatus !== "expired") return -1;
      if (bStatus === "expired" && aStatus !== "expired") return 1;
      
      if (!a.expiry_date) return 1;
      if (!b.expiry_date) return -1;
      return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
    });
    setDrugs(allDrugs);
  }, []);

  const filteredDrugs = filter === "all"
    ? drugs
    : drugs.filter(d => getHealthStatus(d) === filter);

  const stats = {
    expired: drugs.filter(d => getHealthStatus(d) === "expired").length,
    finished: drugs.filter(d => getHealthStatus(d) === "finished").length,
    critical_expiry: drugs.filter(d => getHealthStatus(d) === "critical_expiry").length,
    low_stock: drugs.filter(d => getHealthStatus(d) === "low_stock").length,
    warning_expiry: drugs.filter(d => getHealthStatus(d) === "warning_expiry").length,
    safe: drugs.filter(d => getHealthStatus(d) === "safe").length,
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
          <CalendarDays className="h-4 w-4" />
          Compliance Monitor
        </div>
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent italic tracking-tighter">
          Inventory Health Monitor
        </h1>
        <p className="text-muted-foreground">Monitor expiry dates and stock levels concurrently to maintain optimal pharmacy health</p>
      </div>

      {/* Status Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(["expired", "finished", "critical_expiry", "low_stock", "warning_expiry", "safe"] as HealthStatus[]).map(status => {
          const config = statusConfig[status];
          const count = stats[status];
          const StatusIcon = config.icon;
          return (
            <button
              key={status}
              onClick={() => setFilter(filter === status ? "all" : status)}
              className={cn(
                "premium-card text-left transition-all",
                filter === status && "ring-2 ring-white/20 scale-[1.02]"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{config.label}</p>
                  <p className={cn("text-3xl font-black", config.color)}>{count}</p>
                </div>
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center border", config.bg, config.border)}>
                  <StatusIcon className={cn("h-6 w-6", config.color)} />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Drug Expiry Table */}
      <div className="premium-card !p-0 overflow-hidden border-border dark:border-white/5!">
        <Table>
          <TableHeader>
            <TableRow className="bg-white/[0.03] hover:bg-white/[0.03] border-border dark:border-white/5">
              <TableHead className="py-5 font-bold text-xs uppercase tracking-widest text-muted-foreground px-6">Medicine</TableHead>
              <TableHead className="py-5 font-bold text-xs uppercase tracking-widest text-muted-foreground">Category</TableHead>
              <TableHead className="py-5 font-bold text-xs uppercase tracking-widest text-muted-foreground">Expiry Date</TableHead>
              <TableHead className="py-5 font-bold text-xs uppercase tracking-widest text-muted-foreground">Days Remaining</TableHead>
              <TableHead className="py-5 text-right font-bold text-xs uppercase tracking-widest text-muted-foreground px-6">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDrugs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                  <div className="flex flex-col items-center gap-3">
                    <CheckCircle className="h-12 w-12 opacity-10" />
                    <p>No drugs match the selected filter</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredDrugs.map((drug, i) => {
              const status = getHealthStatus(drug);
              const config = statusConfig[status];
              const days = getDaysUntilExpiry(drug.expiry_date);
              const StatusIcon = config.icon;

              return (
                <TableRow
                  key={drug.id}
                  className={cn(
                    "group hover:bg-muted dark:bg-white/[0.02] border-border dark:border-white/5 transition-colors animate-fade-in",
                    (status === "expired" || status === "finished") && "bg-red-500/[0.02]"
                  )}
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <TableCell className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-12 w-12 flex items-center justify-center rounded-xl border transition-transform group-hover:scale-110",
                        (status === "expired" || status === "finished")  ? "bg-red-500/10 text-red-500 border-red-500/20" : 
                        (status === "critical_expiry" || status === "low_stock") ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                        "bg-primary/5 text-primary border-primary/10"
                      )}>
                        <Pill className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground dark:text-white text-base">{drug.name}</p>
                        {drug.generic_name && <p className="text-xs text-muted-foreground mt-0.5">{drug.generic_name}</p>}
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Stock: {drug.stock} {drug.unit}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest border",
                      drug.category === "Controlled" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                      drug.category === "Prescription" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                      "bg-card dark:bg-white/5 text-muted-foreground border-border dark:border-white/10"
                    )}>
                      {drug.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="font-bold text-foreground dark:text-white">
                      {drug.expiry_date
                        ? new Date(drug.expiry_date).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" })
                        : "Not set"
                      }
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className={cn("text-lg font-black tabular-nums tracking-tighter", config.color)}>
                      {days !== null ? (days <= 0 ? `${Math.abs(days)}d overdue` : `${days} days`) : "—"}
                    </p>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                      config.bg, config.color, config.border
                    )}>
                      <StatusIcon className="h-3 w-3" />
                      {config.label}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
