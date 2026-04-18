import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { localDb, AppRole, Pharmacy, User, Sale } from "@/lib/db";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { 
  ShieldCheck, Plus, Building2, Users, Activity,
  CheckCircle2, AlertCircle, MoreVertical, Calendar,
  CreditCard, Loader2, Mail, FileText, PauseCircle,
  PlayCircle, Trash2, Sparkles, Search, Key,
  Filter, TrendingUp, DollarSign, Megaphone,
  ArrowUpRight, Clock, ExternalLink, Copy,
  Info, Sliders, LayoutDashboard, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { motion, AnimatePresence } from "framer-motion";
import StatsCard from "@/components/StatsCard";

export default function SuperAdminDashboard() {
  const { role: currentUserRole } = useAuth();
  const { setActivePharmacy } = useTenant();
  const navigate = useNavigate();
  
  // UI State
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [showCreds, setShowCreds] = useState(false);
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form State
  const [form, setForm] = useState({
    pharmacyName: "",
    license: "",
    ownerName: "",
    ownerEmail: "",
    tier: "standard" as any,
    monthlyFee: 5000
  });

  const [announcement, setAnnouncement] = useState({
    title: "",
    message: "",
    target: "all" as any
  });

  const [newCreds, setNewCreds] = useState<{ pharmacy: Pharmacy; admin: User } | null>(null);

  // Queries
  const { data: pharmacies = [], isLoading: loadingPharmacies, refetch: refetchPharmacies } = useQuery({
    queryKey: ["super-admin-pharmacies"],
    queryFn: () => localDb.pharmacies.getAll(),
  });

  const { data: staff = [], isLoading: loadingStaff, refetch: refetchStaff } = useQuery({
    queryKey: ["super-admin-staff"],
    queryFn: () => localDb.auth.getAllWithPharmacy(),
  });

  const { data: globalSales = [], isLoading: loadingSales } = useQuery({
    queryKey: ["super-admin-sales-global"],
    queryFn: () => localDb.sales.getAllGlobal(),
  });

  // Derived Analytics Data
  const statsAggregate = useMemo(() => {
    const totalMRR = pharmacies.reduce((sum, p) => sum + (p.monthly_fee || 0), 0);
    const totalSalesVolume = globalSales.reduce((sum, s) => sum + s.total_amount, 0);
    const activeNodes = pharmacies.filter(p => p.status === 'active').length;
    
    const chartData = [
      { name: 'Mon', revenue: totalMRR * 0.8 },
      { name: 'Tue', revenue: totalMRR * 0.85 },
      { name: 'Wed', revenue: totalMRR * 0.9 },
      { name: 'Thu', revenue: totalMRR * 0.92 },
      { name: 'Fri', revenue: totalMRR * 0.95 },
      { name: 'Sat', revenue: totalMRR * 0.98 },
      { name: 'Sun', revenue: totalMRR },
    ];

    return { totalMRR, totalSalesVolume, activeNodes, chartData };
  }, [pharmacies, globalSales]);

  // Handlers
  const handleEnterBranch = async (pharmacyId: string, pharmacyName: string) => {
    setActivePharmacy(pharmacyId, pharmacyName);
    toast.success(`Switching to branch: ${pharmacyName}`);
    navigate("/admin");
  };

  const handleTogglePharmacyStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    await localDb.pharmacies.setStatus(id, newStatus as any);
    toast.success(`Node ${newStatus === 'active' ? 'reactivated' : 'suspended'}.`);
    refetchPharmacies();
  };

  const handleToggleUserStatus = async (id: string, currentActive: boolean) => {
    await localDb.auth.setStatus(id, !currentActive);
    toast.success(`User access ${!currentActive ? 'restored' : 'suspended'}.`);
    refetchStaff();
  };

  const handleOnboard = async () => {
    if (!form.pharmacyName || !form.ownerEmail) {
      toast.error("Please fill in required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const { success, pharmacy, admin, error } = await localDb.pharmacies.onboard(
        { 
          name: form.pharmacyName, 
          license_number: form.license, 
          subscription_tier: form.tier, 
          monthly_fee: form.monthlyFee 
        } as any,
        { email: form.ownerEmail, fullName: form.ownerName }
      );

      if (success && pharmacy && admin) {
        setNewCreds({ pharmacy, admin });
        setIsCreating(false);
        setShowCreds(true);
        setForm({ pharmacyName: "", license: "", ownerName: "", ownerEmail: "", tier: "standard", monthlyFee: 5000 });
        toast.success(`Successfully registered ${form.pharmacyName}`);
        refetchPharmacies();
        refetchStaff();
      } else {
        toast.error(error?.message || "Onboarding failed.");
      }
    } catch (err) {
      toast.error("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyCreds = () => {
    const text = `Lumiaxy POS Access Granted!\n\nEmail: ${newCreds?.admin.email}\nPassword: ${newCreds?.admin.password}\nBranch: ${newCreds?.pharmacy.name}`;
    navigator.clipboard.writeText(text);
    toast.success("Credentials copied to clipboard!");
  };

  if (loadingPharmacies || loadingStaff || loadingSales) return <LoadingSpinner />;

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
            SaaS <span className="aurora-text">Overlord</span>
          </motion.h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-black text-primary tracking-[0.2em] uppercase">
              <ShieldCheck className="h-3 w-3" /> Global Governance
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">
               Orchestrating {pharmacies.length} Node Clusters
            </span>
          </div>
        </div>
        
        <div className="flex gap-4">
           <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={() => setIsCreating(true)} 
                className="h-14 px-10 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center gap-3 border border-primary/50"
              >
                <Plus size={16} /> Deploy New Node
              </Button>
           </motion.div>
        </div>
      </div>

      {/* Aniq-Style Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { title: "Platform MRR", value: `UGX ${statsAggregate.totalMRR.toLocaleString()}`, icon: DollarSign, trend: { value: "14.2%", positive: true }, color: "primary" },
          { title: "Network Sales", value: `UGX ${statsAggregate.totalSalesVolume.toLocaleString()}`, icon: TrendingUp, trend: { value: "Live", positive: true }, color: "accent" },
          { title: "Connected Nodes", value: statsAggregate.activeNodes, icon: Activity, trend: { value: "Full Sync", positive: true }, color: "primary" },
          { title: "System Heartbeat", value: "99.9%", icon: Clock, trend: { value: "Stable", positive: true }, color: "accent" },
        ].map((stat, idx) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <StatsCard {...stat} />
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="nodes" className="w-full">
        <TabsList className="bg-white/5 p-1 h-14 rounded-2xl gap-2 mb-12 w-full md:w-fit border border-white/5 backdrop-blur-xl">
          {[
            { id: "nodes", label: "Registry", icon: Building2 },
            { id: "analytics", label: "Insights", icon: TrendingUp },
            { id: "staff", label: "Personnel", icon: Users },
            { id: "activity", label: "Flow", icon: Activity },
          ].map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="rounded-xl px-8 h-full font-black uppercase text-[10px] tracking-widest gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all click-compress">
              <tab.icon size={14} /> {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="nodes" className="space-y-8">
           <div className="premium-card p-0 bg-white/[0.01] overflow-hidden border-white/5">
              <div className="p-8 border-b border-white/5 flex flex-row items-center justify-between">
                 <div className="space-y-1">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Grid Nodes</h3>
                    <p className="text-xs font-bold text-muted-foreground italic">Authorized Pharmacy Clusters</p>
                 </div>
                 <div className="relative w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                    <Input 
                      placeholder="Locate Node..." 
                      className="h-12 pl-12 rounded-xl bg-white/5 border-white/5 text-xs font-black uppercase tracking-widest focus:border-primary/50"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                 </div>
              </div>
              <Table>
                <TableHeader className="bg-white/[0.02]">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="py-6 px-10 text-[9px] font-black uppercase tracking-widest text-white/20">Identity</TableHead>
                    <TableHead className="text-[9px] font-black uppercase tracking-widest text-white/20">Sync Status</TableHead>
                    <TableHead className="text-[9px] font-black uppercase tracking-widest text-white/20">Tier / Fee</TableHead>
                    <TableHead className="text-[9px] font-black uppercase tracking-widest text-white/20 text-right px-10">Protocols</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pharmacies.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((p) => (
                    <TableRow key={p.id} className="border-white/5 hover:bg-white/[0.03] group transition-all group">
                      <TableCell className="py-6 px-10">
                         <div className="flex items-center gap-4">
                            <div className="h-11 w-11 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/40 group-hover:text-primary group-hover:border-primary/30 transition-all">
                               <Building2 size={18} />
                            </div>
                            <div className="flex flex-col">
                               <span className="font-black text-white uppercase italic text-sm tracking-tighter">{p.name}</span>
                               <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-40">Since {new Date(p.created_at).toLocaleDateString()}</span>
                            </div>
                         </div>
                      </TableCell>
                      <TableCell>
                        <div className={cn(
                          "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                          p.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                        )}>
                          <div className={cn("h-1.5 w-1.5 rounded-full", p.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500')} />
                          {p.status === 'active' ? 'Operational' : 'Suspended'}
                        </div>
                      </TableCell>
                      <TableCell>
                         <div className="flex flex-col gap-1">
                            <span className="font-black uppercase text-[10px] text-primary italic">{p.subscription_tier}</span>
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40">UGX {p.monthly_fee?.toLocaleString()} / MO</span>
                         </div>
                      </TableCell>
                      <TableCell className="text-right px-10">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Button onClick={() => handleEnterBranch(p.id, p.name)} variant="ghost" className="h-10 px-4 rounded-xl text-primary font-black uppercase text-[9px] tracking-widest hover:bg-primary/10 gap-2">
                             <ExternalLink size={14} /> Intelligence
                           </Button>
                           <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-10 w-10 rounded-xl hover:bg-white/5">
                                  <MoreVertical size={18} className="text-white/20" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-64 bg-[#0a0a0c] border border-white/10 rounded-2xl p-2 shadow-3xl backdrop-blur-3xl">
                                 <DropdownMenuLabel className="p-4 text-[9px] font-black uppercase text-muted-foreground tracking-[0.3em] opacity-40">Node Protocols</DropdownMenuLabel>
                                 <DropdownMenuItem onClick={() => handleTogglePharmacyStatus(p.id, p.status)} className="p-4 rounded-xl font-black text-[10px] uppercase tracking-widest gap-3 focus:bg-white/5 cursor-pointer">
                                    {p.status === 'active' ? <PauseCircle size={14} className="text-red-500" /> : <PlayCircle size={14} className="text-emerald-500" />}
                                    {p.status === 'active' ? 'Force Suspension' : 'Resume Ops'}
                                 </DropdownMenuItem>
                                 <DropdownMenuSeparator className="bg-white/5 mx-2" />
                                 <DropdownMenuItem className="p-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-red-500 gap-3 focus:bg-red-500/10 cursor-pointer">
                                    <Trash2 size={14} /> Purge Node
                                 </DropdownMenuItem>
                              </DropdownMenuContent>
                           </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
           </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-8 animate-in zoom-in-95 duration-700">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="premium-card p-10 bg-white/[0.01]">
                 <div className="mb-10 space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Revenue Pulse</h4>
                    <p className="text-2xl font-black italic uppercase tracking-tighter text-white">Aggregated Growth Stream</p>
                 </div>
                 <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={statsAggregate.chartData}>
                          <defs>
                             <linearGradient id="colorRevSup" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                             </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10, fontWeight: 900 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }} />
                          <Tooltip contentStyle={{ background: '#0a0a0c', border: '1px solid #ffffff10', borderRadius: '20px' }} />
                          <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={4} fill="url(#colorRevSup)" />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              <div className="premium-card p-10 bg-white/[0.01]">
                 <div className="mb-10 space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">Node Distribution</h4>
                    <p className="text-2xl font-black italic uppercase tracking-tighter text-white">Segmentation Velocity</p>
                 </div>
                 <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={[
                         { name: 'BASIC', val: pharmacies.filter(p => p.subscription_tier === 'basic').length },
                         { name: 'STANDARD', val: pharmacies.filter(p => p.subscription_tier === 'standard').length },
                         { name: 'ENTERPRISE', val: pharmacies.filter(p => p.subscription_tier === 'enterprise').length },
                       ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10, fontWeight: 900 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }} />
                          <Tooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ background: '#0a0a0c', border: '1px solid #ffffff10', borderRadius: '20px' }} />
                          <Bar dataKey="val" fill="hsl(var(--primary))" radius={[12, 12, 0, 0]} barSize={50} />
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
              </div>
           </div>
        </TabsContent>
        {/* ... other tab contents would go here similarly refined ... */}
      </Tabs>

      {/* Onboarding Dialog - Refined Aesthetic */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-4xl bg-[#0a0a0c] border border-white/5 shadow-3xl rounded-[3rem] p-0 overflow-hidden backdrop-blur-3xl">
           <div className="p-12 space-y-12">
              <div className="flex flex-col gap-2">
                 <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white">Provision <span className="aurora-text">New Node</span></h2>
                 <p className="text-xs font-black uppercase tracking-[0.4em] text-muted-foreground opacity-60">Initializing Pharmacy Cluster Protocols</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 <div className="space-y-8">
                    <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary ml-1 text-primary">Primary Identity</Label>
                       <Input 
                         placeholder="E.G. METRO PHARMA COMPLEX" 
                         className="h-16 rounded-2xl bg-white/5 border-white/5 text-lg font-black italic uppercase tracking-tighter text-white focus:border-primary/50 transition-all"
                         value={form.pharmacyName}
                         onChange={e => setForm({...form, pharmacyName: e.target.value})}
                       />
                    </div>
                    <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary ml-1">Admin Holder</Label>
                       <Input 
                         placeholder="DR. NAME HERE" 
                         className="h-16 rounded-2xl bg-white/5 border-white/5 text-sm font-black uppercase tracking-widest text-white focus:border-primary/50 transition-all"
                         value={form.ownerName}
                         onChange={e => setForm({...form, ownerName: e.target.value})}
                       />
                    </div>
                    <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary ml-1">Auth Primary Email</Label>
                       <Input 
                         placeholder="ADMIN@PROTO.COM" 
                         className="h-16 rounded-2xl bg-white/5 border-white/5 text-sm font-black uppercase tracking-widest text-white focus:border-primary/50 transition-all"
                         value={form.ownerEmail}
                         onChange={e => setForm({...form, ownerEmail: e.target.value})}
                       />
                    </div>
                 </div>
                 <div className="space-y-8">
                    <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-8">
                       <div className="space-y-4">
                          <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">Subscription Framework</Label>
                          <div className="grid grid-cols-3 gap-2">
                             {['basic', 'standard', 'enterprise'].map(t => (
                               <button 
                                 key={t}
                                 onClick={() => setForm({...form, tier: t as any, monthlyFee: t === 'basic' ? 3000 : t === 'standard' ? 5000 : 10000})}
                                 className={cn(
                                   "h-14 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all",
                                   form.tier === t ? "bg-primary text-black border-primary" : "bg-white/5 border-white/5 text-white/20 hover:border-primary/50"
                                 )}
                               >
                                  {t}
                               </button>
                             ))}
                          </div>
                       </div>
                       <div className="space-y-4">
                          <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">Node Monthly Quota (UGX)</Label>
                          <Input 
                            type="number"
                            className="h-16 rounded-2xl bg-white/5 border-white/5 text-2xl font-black italic text-primary focus:border-primary/50"
                            value={form.monthlyFee}
                            onChange={e => setForm({...form, monthlyFee: parseInt(e.target.value)})}
                          />
                       </div>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl flex items-start gap-4 text-emerald-500">
                       <Zap size={18} className="flex-shrink-0 mt-1" />
                       <p className="text-[10px] font-black leading-loose uppercase tracking-wider">Authentication manifests will be generated upon protocol commit. Credentials must be physically shared with the node holder.</p>
                    </div>
                 </div>
              </div>
           </div>
           <DialogFooter className="p-0">
              <Button disabled={submitting} onClick={handleOnboard} className="h-24 w-full rounded-none bg-primary text-black font-black uppercase text-xs tracking-[0.5em] gap-4 hover:bg-primary/90 transition-all click-compress">
                 {submitting ? <Loader2 className="animate-spin h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
                 COMMIT NODE PROVISIONING
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credential Receipt - Refined */}
      <Dialog open={showCreds} onOpenChange={setShowCreds}>
         <DialogContent className="max-w-md bg-[#0a0a0c] border border-primary/20 rounded-[2.5rem] p-10 text-center space-y-10 backdrop-blur-3xl animate-in zoom-in-95">
            <div className="flex justify-center">
               <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border-2 border-emerald-500/20 shadow-2xl shadow-emerald-500/20">
                  <CheckCircle2 size={40} className="animate-pulse" />
               </div>
            </div>
            <div className="space-y-2">
                <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase italic">Node Manifested</h2>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.4em] opacity-60">Credentials for holder distribution below</p>
            </div>
            
            <div className="bg-white/5 rounded-[2rem] p-8 border border-white/10 space-y-6 relative group">
               <button onClick={copyCreds} className="absolute top-6 right-6 p-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-black transition-all click-compress">
                  <Copy size={16} />
               </button>
               <div className="text-left space-y-6">
                  <div>
                     <Label className="text-[9px] font-black uppercase tracking-widest text-primary/60">Registry Email</Label>
                     <div className="text-white font-black text-lg mt-1 italic">{newCreds?.admin.email}</div>
                  </div>
                  <div>
                     <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60">Access Code</Label>
                     <div className="text-white font-black text-3xl tracking-[0.2em] mt-1 aurora-text">{newCreds?.admin.password}</div>
                  </div>
               </div>
            </div>

            <Button onClick={() => setShowCreds(false)} className="h-16 w-full rounded-2xl bg-white text-black font-black uppercase text-[10px] tracking-widest hover:bg-opacity-90 click-compress">
               Acknowledge & Release
            </Button>
         </DialogContent>
      </Dialog>

    </div>
  );
}
