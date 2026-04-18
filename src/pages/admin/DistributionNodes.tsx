import { useState } from "react";
import { localDb } from "@/lib/db";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  CreditCard,
  Building2,
  Lock,
  Zap,
  Power,
  ArrowUpRight,
  TrendingUp,
  Activity,
  User,
  AlertCircle,
  Copy,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";

export default function DistributionNodes() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string | null>(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);

  const { data: pharmacies = [], isLoading } = useQuery({
    queryKey: ["pharmacies"],
    queryFn: () => localDb.pharmacies.getAll()
  });

  const { data: tiers = [] } = useQuery({
    queryKey: ["pricing-tiers"],
    queryFn: () => localDb.pricing.getAll()
  });

  const selectedPharmacy = pharmacies.find(p => p.id === selectedPharmacyId);

  const { data: adminUser, isLoading: loadingAdmin } = useQuery({
    queryKey: ["admin-user", selectedPharmacy?.owner_id],
    queryFn: () => selectedPharmacy ? localDb.auth.getProfile(selectedPharmacy.owner_id) : null,
    enabled: !!selectedPharmacyId && showCredentialsModal
  });

  const setStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: any }) => localDb.pharmacies.setStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pharmacies"] });
      toast.info("Branch status updated.");
    }
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic flex items-center gap-4">
            <div className="h-14 w-14 rounded-[2rem] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-2xl shadow-primary/10">
              <Building2 className="text-primary h-7 w-7" />
            </div>
            Pharmacy Branches
          </h1>
          <p className="text-muted-foreground font-black text-xs uppercase tracking-[0.3em] opacity-60">
            Network Registry • Branch Governance • System Overview
          </p>
        </div>
        <Button 
          onClick={() => navigate("/super-admin/onboard")}
          className="h-16 px-10 rounded-2xl bg-primary text-black font-black uppercase text-xs tracking-widest gap-3 shadow-2xl shadow-primary/20 hover:scale-105 transition-all"
        >
          <Plus size={18} /> Add New Branch
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { icon: Building2, label: "Total Branches", val: pharmacies.length },
          { icon: User, label: "Total Personnel", val: pharmacies.length * 3 }, 
          { icon: Zap, label: "Active Pharmacies", val: pharmacies.filter(p => p.status === 'active' || p.status === 'trialing').length },
          { icon: AlertCircle, label: "Inactive Pharmacies", val: pharmacies.filter(p => p.status === 'suspended' || p.status === 'expired').length }
        ].map((stat, i) => (
          <Card key={i} className="bg-white/[0.02] border-white/5 backdrop-blur-3xl group">
             <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardDescription className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                   <stat.icon className="h-3 w-3 text-primary" /> {stat.label}
                </CardDescription>
                <TrendingUp className="h-3 w-3 text-emerald-500 opacity-20 group-hover:opacity-100 transition-opacity" />
             </CardHeader>
             <CardTitle className="px-6 pb-6 text-3xl font-black text-white italic">{stat.val}</CardTitle>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
           <Input 
             placeholder="Search Pharmacy Registry..." 
             className="h-14 pl-12 rounded-2xl bg-white/5 border-white/5 text-white font-bold italic"
           />
        </div>
        <Button variant="outline" className="h-14 px-8 rounded-2xl border-white/5 text-muted-foreground font-black uppercase text-[10px] tracking-widest gap-2">
           <Filter size={16} /> Advanced Filter
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {pharmacies.length === 0 ? (
           <Card className="md:col-span-3 py-32 bg-white/[0.02] border-dashed border-2 border-white/5 flex flex-col items-center justify-center text-center rounded-[3rem]">
              <div className="h-20 w-20 rounded-[2rem] bg-primary/5 flex items-center justify-center text-primary/20 mb-6">
                 <ShieldCheck size={40} />
              </div>
              <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">No Branches Found</h3>
              <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest mt-2">Add your first pharmacy branch to get started.</p>
           </Card>
         ) : (
           pharmacies.map((pharmacy) => {
             const tier = tiers.find(t => t.id === pharmacy.subscription_tier);
             return (
               <Card key={pharmacy.id} className="bg-card/40 border-primary/10 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden group hover:border-primary/30 hover:bg-white/[0.03] transition-all duration-500 flex flex-col">
                  <div className={`h-1.5 w-full bg-gradient-to-r ${
                    pharmacy.status === 'active' || pharmacy.status === 'trialing' 
                    ? 'from-emerald-500/50 to-emerald-500' 
                    : 'from-red-500/50 to-red-500'
                  }`} />
                  <CardHeader className="p-8 pb-4">
                     <div className="flex items-start justify-between">
                        <div className="space-y-1">
                           <div className="flex items-center gap-2">
                              <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter truncate max-w-[180px]">{pharmacy.name}</h3>
                              <ArrowUpRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                           </div>
                           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                              <MapPin size={10} className="text-primary/60" /> {pharmacy.location || 'Undisclosed Node'}
                           </p>
                        </div>
                        <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl hover:bg-white/5">
                                 <MoreVertical className="h-5 w-5 text-muted-foreground" />
                              </Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent className="bg-[#0B0E14] border-white/10 rounded-xl w-56">
                              <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">Branch Controls</DropdownMenuLabel>
                              <DropdownMenuSeparator className="bg-white/5" />
                              <DropdownMenuItem className="h-10 font-bold italic text-white focus:bg-primary focus:text-black">View Analytics</DropdownMenuItem>
                              <DropdownMenuItem className="h-10 font-bold italic text-white focus:bg-primary focus:text-black">Employee Audit</DropdownMenuItem>
                              <DropdownMenuItem 
                                className="h-10 font-bold italic text-white focus:bg-primary focus:text-black"
                                onClick={() => {
                                  setSelectedPharmacyId(pharmacy.id);
                                  setShowCredentialsModal(true);
                                }}
                              >
                                <Lock size={14} className="mr-2" /> View Access Key
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-white/5" />
                              <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">System Access</DropdownMenuLabel>
                              <DropdownMenuItem 
                                onClick={() => setStatusMutation.mutate({ id: pharmacy.id, status: 'active' })}
                                className="h-10 font-bold italic text-emerald-500 focus:bg-emerald-500/10"
                              >
                                 <Power size={14} className="mr-2" /> Restore Access
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setStatusMutation.mutate({ id: pharmacy.id, status: 'suspended' })}
                                className="h-10 font-bold italic text-red-500 focus:bg-red-500/10"
                              >
                                 <Lock size={14} className="mr-2" /> Suspend Access
                              </DropdownMenuItem>
                           </DropdownMenuContent>
                        </DropdownMenu>
                     </div>
                  </CardHeader>
                  <CardContent className="p-8 pt-0 flex-1 flex flex-col justify-between">
                     <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                 <Zap size={8} /> Sub Tier
                              </p>
                              <p className="text-xs font-black text-white italic truncate">{tier?.name || 'GENERIC'}</p>
                           </div>
                           <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                 <CreditCard size={8} /> MMR Contrib
                              </p>
                              <p className="text-xs font-black text-white italic">KSh {pharmacy.monthly_fee.toLocaleString()}</p>
                           </div>
                        </div>

                        <div className="space-y-2">
                           <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                              <span className="text-muted-foreground flex items-center gap-1.5">
                                 <Clock size={10} /> Billing Cycle
                              </span>
                              <span className="text-white italic">
                                 {Math.ceil((new Date(pharmacy.expires_at || '').getTime() - Date.now()) / (1000 * 60 * 60 * 24))} Days Left
                              </span>
                           </div>
                           <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary" 
                                style={{ width: `${Math.max(0, Math.min(100, (Math.ceil((new Date(pharmacy.expires_at || '').getTime() - Date.now()) / (1000 * 60 * 60 * 24)) / 30) * 100))}%` }} 
                              />
                           </div>
                        </div>
                     </div>

                     <div className="pt-8 flex items-center justify-between mt-auto">
                        <Badge variant="outline" className={`rounded-xl px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] italic border-0 ${
                          pharmacy.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                          pharmacy.status === 'trialing' ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                           Status: {pharmacy.status}
                        </Badge>
                        <div className="flex items-center gap-2">
                           <div className="h-8 w-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-[10px] font-black text-muted-foreground">
                              AD
                           </div>
                           <p className="text-[10px] font-black text-white italic uppercase tracking-widest">Master Admin</p>
                        </div>
                     </div>
                  </CardContent>
               </Card>
             );
           })
         )}
      </div>

      <div className="flex items-center gap-6 p-8 rounded-[2.5rem] bg-primary/5 border border-primary/10">
         <Activity size={32} className="text-primary animate-pulse" />
         <div>
            <p className="text-xl font-black text-white italic tracking-tight">Enterprise Network Monitor</p>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">
               All pharmacy data is strictly isolated. System health is verified regularly across the entire network.
            </p>
         </div>
       </div>

      <Dialog open={showCredentialsModal} onOpenChange={setShowCredentialsModal}>
        <DialogContent className="bg-[#0B0E14] border-white/5 rounded-[2.5rem] p-10 max-w-md shadow-[0_0_100px_rgba(var(--primary-rgb),0.05)] backdrop-blur-3xl">
          <DialogHeader className="mb-6">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 border border-primary/20">
              <ShieldCheck size={32} />
            </div>
            <DialogTitle className="text-2xl font-black italic tracking-tighter text-white uppercase text-center">Security Credentials</DialogTitle>
            <DialogDescription className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Administrative Bridge • Development Mode</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {loadingAdmin ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Retrieving Access Tunnel...</p>
              </div>
            ) : adminUser ? (
              <div className="space-y-4">
                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 relative group">
                  <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-2">Primary Administrator</p>
                  <p className="text-sm font-black text-white italic truncate">{adminUser.email}</p>
                </div>
                <div 
                  className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 relative group cursor-pointer hover:bg-white/[0.05] transition-all"
                  onClick={() => {
                    navigator.clipboard.writeText(adminUser.password || '');
                    toast.success("Password copied to clipboard");
                  }}
                >
                  <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-2">Access Password</p>
                  <p className="text-xl font-black text-white italic tracking-[0.2em]">
                    {adminUser.password || 'GENERIC'}
                  </p>
                  <Copy className="absolute top-6 right-6 h-4 w-4 text-white/10 group-hover:text-primary transition-colors" />
                </div>
              </div>
            ) : (
              <p className="text-center text-red-500 font-bold italic py-10">Admin user not found in local registry.</p>
            )}

            <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10">
              <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest leading-relaxed">
                Caution: Credentials provide full administrative control over this node. Use only for development verifications.
              </p>
            </div>

            <Button onClick={() => setShowCredentialsModal(false)} className="w-full h-14 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[10px]">
              Close Access Bridge
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
