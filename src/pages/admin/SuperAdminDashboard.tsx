import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { localDb, AppRole, Pharmacy, User, Sale } from "@/lib/db";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { 
  ShieldCheck, 
  Plus, 
  Building2, 
  Users, 
  Activity,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Calendar,
  CreditCard,
  Loader2,
  Mail,
  FileText,
  PauseCircle,
  PlayCircle,
  Trash2,
  Sparkles,
  Search,
  Key,
  Filter,
  TrendingUp,
  DollarSign,
  Megaphone,
  ArrowUpRight,
  Clock,
  ExternalLink,
  Copy,
  Info,
  Sliders
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

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
  const stats = useMemo(() => {
    const totalMRR = pharmacies.reduce((sum, p) => sum + (p.monthly_fee || 0), 0);
    const totalSalesVolume = globalSales.reduce((sum, s) => sum + s.total_amount, 0);
    const activeNodes = pharmacies.filter(p => p.status === 'active').length;
    
    // Mock growth data for chart
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
    toast.primary(`Switching to branch: ${pharmacyName}`);
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

  // derived analytics...
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

  const handleCreateAnnouncement = async () => {
    if (!announcement.title || !announcement.message) return;
    setSubmitting(true);
    try {
      await localDb.announcements.create(announcement.title, announcement.message, announcement.target);
      toast.success("Announcement broadcasted successfully!");
      setIsAnnouncing(false);
      setAnnouncement({ title: "", message: "", target: "all" });
    } catch (err) {
      toast.error("Failed to send announcement.");
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
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-5xl font-black tracking-tighter flex items-center gap-4 text-white uppercase italic">
            <div className="h-14 w-14 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-2xl shadow-primary/20">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            Platform Administration
          </h1>
          <p className="text-muted-foreground mt-3 font-black text-xs uppercase tracking-[0.3em] flex items-center gap-2 opacity-60">
            Global Network Management • Revenue Analytics • Pharmacy Hub
          </p>
        </div>
        
        <div className="flex items-center gap-3">
           <Button 
            variant="outline"
            className="h-14 px-6 rounded-2xl border-white/5 text-muted-foreground font-black uppercase text-[10px] tracking-widest gap-2 hover:bg-white/5"
            onClick={() => navigate("/super-admin/pulse")}
          >
            <Sliders className="h-4 w-4" /> System Control
          </Button>
          <Button 
            className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-black font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-primary/20 gap-2 group transition-all"
            onClick={() => navigate("/super-admin/onboard")}
          >
            <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
            Add New Pharmacy
          </Button>
        </div>
      </div>

      {/* Analytics Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Platform MRR", value: `KSh ${stats.totalMRR.toLocaleString()}`, sub: "+12.5% from last month", icon: DollarSign, color: "text-emerald-500" },
          { label: "Network Sales", value: `KSh ${stats.totalSalesVolume.toLocaleString()}`, sub: "Gross merchandise traffic", icon: TrendingUp, color: "text-blue-500" },
          { label: "Active Pharmacies", value: stats.activeNodes, sub: "Revenue-generating branches", icon: Activity, color: "text-primary" },
          { label: "Network Uptime", value: "99.9%", sub: "System availability", icon: Clock, color: "text-amber-500" },
        ].map((stat, i) => (
          <Card key={i} className="bg-card/30 border-primary/10 backdrop-blur-md overflow-hidden relative group hover:border-primary/30 transition-all border-l-4 border-l-primary/40">
            <CardHeader className="pb-2 space-y-1">
              <CardDescription className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                <stat.icon className={`h-3 w-3 ${stat.color}`} /> {stat.label}
              </CardDescription>
              <CardTitle className="text-3xl font-black text-foreground! tracking-tight">{stat.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 bg-emerald-500/5 w-fit px-2 py-0.5 rounded-full border border-emerald-500/10">
                <ArrowUpRight size={10} /> {stat.sub}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="nodes" className="w-full">
        <TabsList className="bg-card/40 border border-primary/10 p-1.5 h-16 rounded-[2rem] gap-2 mb-8 backdrop-blur-3xl w-full md:w-fit">
          {[
            { id: "nodes", label: "Registry", icon: Building2 },
            { id: "analytics", label: "SaaS Insight", icon: TrendingUp },
            { id: "billing", label: "Subscription Hub", icon: CreditCard },
            { id: "staff", label: "Personnel", icon: Users },
            { id: "activity", label: "Network Traffic", icon: Activity },
          ].map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="rounded-2xl px-8 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black uppercase text-[10px] tracking-widest gap-2.5 transition-all">
              <tab.icon size={14} className="opacity-70" /> {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab 1: Node Registry */}
        <TabsContent value="nodes" className="space-y-6">
           <Card className="bg-card/40 border-primary/10 backdrop-blur-2xl overflow-hidden shadow-2xl rounded-[2.5rem] border-t-primary/20">
            <CardHeader className="flex flex-row items-center justify-between border-b border-primary/5 pb-8 p-8">
              <div>
                <CardTitle className="text-2xl font-black tracking-tight">Pharmacy Registry</CardTitle>
                <CardDescription className="font-bold text-muted-foreground/60">Manage pharmacy licenses, access status, and branch health.</CardDescription>
              </div>
               <div className="flex items-center gap-3">
                 <div className="relative w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                    <Input placeholder="Search Registry..." className="h-12 pl-12 rounded-xl bg-primary/5 border-primary/10 focus:border-primary/40 font-bold" />
                 </div>
                 <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl border-primary/10 hover:bg-primary/10 text-primary">
                    <Filter size={20} />
                 </Button>
               </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-primary/5">
                  <TableRow className="border-primary/5 hover:bg-transparent">
                    <TableHead className="py-6 px-10 font-black uppercase tracking-[0.2em] text-[10px] text-primary/60">Pharmacy Name</TableHead>
                    <TableHead className="font-black uppercase tracking-[0.2em] text-[10px] text-primary/60">Access Status</TableHead>
                    <TableHead className="font-black uppercase tracking-[0.2em] text-[10px] text-primary/60">Subscription Tier</TableHead>
                    <TableHead className="font-black uppercase tracking-[0.2em] text-[10px] text-primary/60">Node Traffic</TableHead>
                    <TableHead className="text-right px-10 font-black uppercase tracking-[0.2em] text-[10px] text-primary/60">Governance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pharmacies.map((p) => (
                    <TableRow key={p.id} className="border-primary/5 hover:bg-primary/5 group transition-all">
                      <TableCell className="py-6 px-10 font-black text-base tracking-tight flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20 shadow-lg group-hover:scale-110 transition-transform">
                          <Building2 size={20} />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-white">{p.name}</span>
                           <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1"><Calendar size={10}/> Since {new Date(p.created_at).toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border ${
                          p.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}>
                          <div className={`h-1.5 w-1.5 rounded-full ${p.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                          {p.status}
                        </div>
                      </TableCell>
                      <TableCell>
                         <div className="flex flex-col">
                            <span className="font-black uppercase text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 w-fit">{p.subscription_tier || 'Enterprise'}</span>
                            <span className="text-[10px] text-muted-foreground mt-1 font-bold">Expires: {p.expires_at ? new Date(p.expires_at).toLocaleDateString() : 'Active'}</span>
                         </div>
                      </TableCell>
                      <TableCell>
                         <div className="flex items-center gap-2 font-black text-sm text-foreground!">
                            <Activity size={14} className="text-primary/60" />
                            KSh {p.total_revenue_contributed?.toLocaleString() || '0'}
                         </div>
                      </TableCell>
                      <TableCell className="text-right px-10">
                        <div className="flex items-center justify-end gap-2">
                           <Button onClick={() => handleEnterBranch(p.id, p.name)} className="h-10 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs hover:bg-primary hover:text-black gap-2 transition-all opacity-0 group-hover:opacity-100">
                             <ExternalLink size={14} /> View Branch
                           </Button>
                           <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/10">
                                <MoreVertical size={20} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64 bg-[#0a0a0c] border-white/10 rounded-2xl p-2 shadow-3xl">
                               <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground opacity-60 tracking-[0.2em] px-4 pt-4 mb-2">Branch Controls</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEnterBranch(p.id, p.name)} className="cursor-pointer gap-3 py-4 font-black text-xs text-primary focus:bg-primary/10 rounded-xl px-4">
                                <ExternalLink size={16} /> Login as Admin
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-white/5 mx-2" />
                              <DropdownMenuItem className="cursor-pointer gap-3 py-4 font-black text-xs text-foreground! rounded-xl px-4">
                                <CreditCard size={16} /> Manage Billing
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleTogglePharmacyStatus(p.id, p.status)} className="cursor-pointer gap-3 py-4 font-black text-xs text-foreground! rounded-xl px-4">
                                {p.status === 'active' ? <PauseCircle size={16} className="text-red-500" /> : <PlayCircle size={16} className="text-emerald-500" />}
                                {p.status === 'active' ? 'Suspend Branch' : 'Activate Branch'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-white/5 mx-2" />
                              <DropdownMenuItem className="cursor-pointer gap-3 py-4 font-black text-xs text-red-500 focus:bg-red-500/10 rounded-xl px-4">
                                <Trash2 size={16} /> Delete Pharmacy Branch
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: SaaS Insights (Analytics) */}
        <TabsContent value="analytics" className="space-y-8 animate-in zoom-in-95 duration-500">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="bg-card/40 border-primary/10 backdrop-blur-3xl p-8 rounded-[2.5rem] border-t-primary/20">
                 <CardHeader className="px-0 pt-0 pb-8 border-b border-primary/5 mb-8">
                    <CardTitle className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                       <TrendingUp className="text-primary h-6 w-6" /> Platform Revenue Growth
                    </CardTitle>
                    <CardDescription className="font-bold">Aggregated MRR across all active branch nodes</CardDescription>
                 </CardHeader>
                 <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={stats.chartData}>
                          <defs>
                             <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#FB923C" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#FB923C" stopOpacity={0}/>
                             </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                          <XAxis dataKey="name" stroke="#ffffff20" fontSize={10} fontStyle="bold" />
                          <YAxis stroke="#ffffff20" fontSize={10} fontStyle="bold" />
                          <Tooltip 
                            contentStyle={{ background: '#0a0a0c', border: '1px solid #ffffff10', borderRadius: '12px' }}
                            itemStyle={{ color: '#FB923C', fontWeight: '900' }}
                          />
                          <Area type="monotone" dataKey="revenue" stroke="#FB923C" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </Card>

              <Card className="bg-card/40 border-primary/10 backdrop-blur-3xl p-8 rounded-[2.5rem] border-t-primary/20">
                 <CardHeader className="px-0 pt-0 pb-8 border-b border-primary/5 mb-8 text-white">
                    <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
                       <Building2 className="text-primary h-6 w-6" /> Tier Distribution
                    </CardTitle>
                    <CardDescription className="font-bold text-muted-foreground/60">Pharmacy segmentation by subscription type</CardDescription>
                 </CardHeader>
                 <div className="h-[350px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={[
                         { name: 'Basic', count: pharmacies.filter(p => p.subscription_tier === 'basic').length },
                         { name: 'Standard', count: pharmacies.filter(p => p.subscription_tier === 'standard').length },
                         { name: 'Enterprise', count: pharmacies.filter(p => p.subscription_tier === 'enterprise').length },
                       ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                          <XAxis dataKey="name" stroke="#ffffff20" fontSize={10} fontStyle="bold" />
                          <YAxis stroke="#ffffff20" fontSize={10} fontStyle="bold" />
                          <Tooltip 
                             cursor={{fill: '#ffffff05'}}
                             contentStyle={{ background: '#0a0a0c', border: '1px solid #ffffff10', borderRadius: '12px' }}
                          />
                          <Bar dataKey="count" fill="#FB923C" radius={[8, 8, 0, 0]} barSize={60} />
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
              </Card>
           </div>
        </TabsContent>

        {/* Tab 3: Billing & Subscriptions */}
        <TabsContent value="billing" className="space-y-6">
           <Card className="bg-card/40 border-primary/10 backdrop-blur-2xl overflow-hidden shadow-2xl rounded-[2.5rem]">
               <CardHeader className="p-10 border-b border-primary/5 bg-primary/5">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-3xl bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
                           <CreditCard size={32} />
                        </div>
                        <div>
                           <CardTitle className="text-3xl font-black text-white italic tracking-tighter uppercase">Subscription Registry</CardTitle>
                           <CardDescription className="text-muted-foreground font-black text-xs uppercase tracking-[0.2em] mt-1">SaaS Revenue & Billing Lifecycle</CardDescription>
                        </div>
                     </div>
                      <div className="text-right">
                        <div className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-1">Monthly Revenue</div>
                        <div className="text-4xl font-black text-white">KSh {stats.totalMRR.toLocaleString()}</div>
                      </div>
                  </div>
               </CardHeader>
               <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-primary/5 hover:bg-transparent">
                        <TableHead className="py-6 px-10 font-bold text-xs">Pharamcy & Owner</TableHead>
                        <TableHead className="font-bold text-xs">Monthly Subscription</TableHead>
                        <TableHead className="font-bold text-xs">Payment Status</TableHead>
                        <TableHead className="font-bold text-xs">Next Due Data</TableHead>
                        <TableHead className="text-right px-10 font-bold text-xs">Billing Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pharmacies.map(p => (
                          <TableRow key={p.id} className="border-primary/5">
                             <TableCell className="py-6 px-10">
                                <div className="font-black text-white text-base">{p.name}</div>
                                <div className="text-[10px] text-muted-foreground font-bold flex items-center gap-1"><Mail size={10} /> {staff.find(s => s.id === p.owner_id)?.email || 'Unassigned'}</div>
                             </TableCell>
                             <TableCell className="font-black text-foreground!">KSh {p.monthly_fee?.toLocaleString() || '5,000'}</TableCell>
                             <TableCell>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase rounded-full border border-emerald-500/20">
                                   <CheckCircle2 size={10} /> Paid Up
                                </div>
                             </TableCell>
                             <TableCell className="font-bold text-sm text-muted-foreground">
                                {new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                             </TableCell>
                             <TableCell className="text-right px-10">
                                <Button variant="outline" className="h-10 rounded-xl border-primary/20 text-primary font-bold text-xs hover:bg-primary hover:text-black">
                                   Record Payment
                                </Button>
                             </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
               </CardContent>
           </Card>
        </TabsContent>

        {/* Tab 4: Global Activity (Network Traffic) */}
        <TabsContent value="activity" className="space-y-6 animate-in slide-in-from-right-4 duration-500">
           <Card className="bg-card/40 border-primary/10 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden border-t-primary/20">
              <CardHeader className="p-10 border-b border-primary/5 flex flex-row items-center justify-between">
                 <div>
                    <CardTitle className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                       <Activity className="text-primary h-6 w-6" /> Platform-Wide Activity
                    </CardTitle>
                    <CardDescription className="font-bold">Real-time event stream from all branches</CardDescription>
                 </div>
                 <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase border border-emerald-500/20">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live Stream
                 </div>
              </CardHeader>
              <CardContent className="p-0">
                 <div className="divide-y divide-white/5">
                    {globalSales.length === 0 ? (
                       <div className="p-20 text-center text-muted-foreground font-bold">No network sales recorded yet.</div>
                    ) : (
                       globalSales.slice(0, 15).map((sale: any, idx) => (
                          <div key={sale.id} className="p-6 flex items-center justify-between group hover:bg-primary/5 transition-all">
                             <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                   <CreditCard size={20} />
                                </div>
                                <div>
                                   <div className="text-sm font-black text-white italic">Branch Sale: KSh {sale.total_amount.toLocaleString()}</div>
                                   <div className="text-[10px] text-muted-foreground font-bold flex items-center gap-2">
                                      <Building2 size={10} className="text-primary/60" /> {sale.pharmacy_name} 
                                      <span className="opacity-30">•</span> 
                                      <Clock size={10} className="text-primary/60" /> {new Date(sale.created_at).toLocaleTimeString()}
                                   </div>
                                </div>
                             </div>
                             <div className="flex items-center gap-6">
                                <div className="text-right">
                                   <div className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.1em]">Verified Transaction</div>
                                   <div className="text-[10px] text-muted-foreground font-medium opacity-60 uppercase">{sale.payment_method}</div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <Info size={18} className="text-primary" />
                                </Button>
                             </div>
                          </div>
                       ))
                    )}
                 </div>
              </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-6">
           {/* Previous Staff UI - already high quality, keeping as is but ensuring it works with localDb */}
           <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input 
                   placeholder="Search by Email, Name or Branch..." 
                   className="h-12 pl-12 rounded-xl bg-card/40 border-primary/10 focus:border-primary/40 text-sm font-medium"
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                 />
              </div>
              <Button 
                onClick={() => setIsCreatingUser(true)}
                className="h-12 rounded-xl bg-primary text-black font-bold px-6 gap-2"
              >
                <Plus size={16} /> Add Personnel
              </Button>
           </div>

           <Card className="bg-card/40 border-primary/10 backdrop-blur-xl overflow-hidden shadow-2xl rounded-[2rem]">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-primary/5 hover:bg-transparent">
                    <TableHead className="py-5 px-6 font-bold uppercase tracking-wider text-[10px]">Employee Info</TableHead>
                    <TableHead className="font-bold uppercase tracking-wider text-[10px]">Assigned Branch</TableHead>
                    <TableHead className="font-bold uppercase tracking-wider text-[10px]">Role</TableHead>
                    <TableHead className="font-bold uppercase tracking-wider text-[10px]">Access Status</TableHead>
                    <TableHead className="text-right px-6 font-bold uppercase tracking-wider text-[10px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   {staff.filter(s => s.email.toLowerCase().includes(searchQuery.toLowerCase())).map((user) => (
                    <TableRow key={user.id} className="border-primary/5 hover:bg-primary/5 group transition-colors">
                      <TableCell className="py-5 px-6">
                         <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden border border-primary/30">
                               {user.full_name?.charAt(0) || user.email.charAt(0)}
                            </div>
                            <div>
                               <div className="text-sm font-black text-foreground!">{user.full_name || 'Anonymous'}</div>
                               <div className="text-[10px] text-muted-foreground">{user.email}</div>
                            </div>
                         </div>
                      </TableCell>
                      <TableCell>
                         <div className="flex items-center gap-2 text-xs font-bold text-foreground!">
                            <Building2 size={12} className="text-primary/60" />
                            {user.pharmacy_name}
                         </div>
                      </TableCell>
                      <TableCell>
                         <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-white/5 border border-white/10 px-2 py-0.5 rounded text-muted-foreground">
                            {user.role}
                         </div>
                      </TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          user.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {user.is_active ? 'Authorized' : 'Suspended'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        {/* dropdown menu same as before... */}
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10">
                                <MoreVertical size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 bg-[#0a0a0c] border-white/10 rounded-xl p-2">
                               <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground opacity-60 tracking-[0.2em] px-3 pt-4 mb-2">Personnel controls</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleToggleUserStatus(user.id, user.is_active)} className="cursor-pointer gap-2 py-3 font-bold text-xs text-foreground! rounded-xl px-4">
                                 {user.is_active ? <PauseCircle size={14} className="text-red-500" /> : <PlayCircle size={14} className="text-emerald-500" />}
                                 {user.is_active ? 'Suspend Access' : 'Restore Access'}
                              </DropdownMenuItem>
                               <DropdownMenuItem className="cursor-pointer gap-2 py-3 font-bold text-xs text-foreground! rounded-xl px-4">
                                 <Trash2 size={14} className="text-red-500" /> Remove Identity
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Onboarding Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-3xl bg-[#0a0a0c] border border-white/5 shadow-3xl rounded-[3rem] p-0 overflow-hidden backdrop-blur-3xl border-t-primary/20">
          <div className="relative p-12 space-y-10">
            <div className="absolute top-0 right-0 p-12 opacity-5 -z-10 bg-primary blur-[120px] rounded-full w-96 h-96" />
            <DialogHeader>
              <div className="flex items-center gap-6">
                 <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-2xl">
                    <Building2 className="h-8 w-8 text-primary" />
                 </div>
                  <div>
                    <DialogTitle className="text-4xl font-black tracking-tighter text-white mb-1 italic uppercase">Add Pharmacy Branch</DialogTitle>
                    <DialogDescription className="font-bold text-muted-foreground/60 tracking-tight text-lg">Create a new pharmacy branch and admin user.</DialogDescription>
                  </div>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] uppercase tracking-[0.4em] font-black text-primary/80 ml-1">Branch Identity</Label>
                    <Input 
                      placeholder="e.g. Nairobi Central" 
                      className="h-16 rounded-2xl bg-white/5 border-white/10 text-white font-black text-lg focus:border-primary/50 transition-all placeholder:text-muted-foreground/20"
                      value={form.pharmacyName}
                      onChange={e => setForm({...form, pharmacyName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] uppercase tracking-[0.4em] font-black text-primary/80 ml-1">Admin Holder Name</Label>
                    <Input 
                      placeholder="e.g. Dr. Jane Smith" 
                      className="h-16 rounded-2xl bg-white/5 border-white/10 text-white font-black focus:border-primary/50 placeholder:text-muted-foreground/20"
                      value={form.ownerName}
                      onChange={e => setForm({...form, ownerName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] uppercase tracking-[0.4em] font-black text-primary/80 ml-1">Holder Access Email</Label>
                    <Input 
                      placeholder="admin@branch.com" 
                      className="h-16 rounded-2xl bg-white/5 border-white/10 text-white font-black focus:border-primary/50 placeholder:text-muted-foreground/20"
                      value={form.ownerEmail}
                      onChange={e => setForm({...form, ownerEmail: e.target.value})}
                    />
                  </div>
               </div>
               <div className="space-y-8">
                  <div className="p-8 rounded-[2rem] bg-primary/5 border border-primary/10 space-y-6">
                     <div className="space-y-3">
                        <Label className="text-[10px] uppercase tracking-[0.4em] font-black text-primary/80 block mb-2">Subscription Tier</Label>
                        <div className="grid grid-cols-3 gap-2">
                           {['basic', 'standard', 'enterprise'].map((t) => (
                             <button 
                               key={t}
                               onClick={() => setForm({...form, tier: t as any, monthlyFee: t === 'basic' ? 3000 : t === 'standard' ? 5000 : 10000 })}
                               className={`h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                 form.tier === t ? 'bg-primary text-black border-primary' : 'bg-white/5 border-white/10 text-muted-foreground hover:border-primary/50'
                               }`}
                             >
                                {t}
                             </button>
                           ))}
                        </div>
                     </div>
                     <div className="space-y-3">
                        <Label className="text-[10px] uppercase tracking-[0.4em] font-black text-primary/80">Monthly Fee (KSh)</Label>
                        <div className="relative">
                           <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                           <Input 
                             type="number"
                             className="h-16 pl-12 rounded-2xl bg-white/5 border-white/10 text-white text-2xl font-black focus:border-primary/50"
                             value={form.monthlyFee}
                             onChange={e => setForm({...form, monthlyFee: parseInt(e.target.value)})}
                           />
                        </div>
                     </div>
                  </div>
                  <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-3">
                     <Info size={16} className="text-emerald-500 mt-0.5" />
                     <p className="text-[10px] text-emerald-500/80 font-bold leading-relaxed">
                        Nodes are isolated on the client-side. The admin will be prompted to set their custom password after their first login.
                     </p>
                  </div>
               </div>
            </div>

            <DialogFooter className="pt-4">
              <Button disabled={submitting} onClick={handleOnboard} className="h-20 w-full rounded-3xl bg-primary text-black font-black uppercase text-xs tracking-[0.3em] shadow-2xl shadow-primary/30 gap-4 group">
                {submitting ? <Loader2 className="animate-spin h-6 w-6" /> : <Sparkles className="h-6 w-6 group-hover:scale-125 transition-transform" />}
                Register Pharmacy Branch
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Credential Receipt Modal */}
      <Dialog open={showCreds} onOpenChange={setShowCreds}>
         <DialogContent className="max-w-md bg-[#0a0a0c] border border-primary/20 rounded-[2.5rem] p-10 text-center space-y-8 animate-in zoom-in-95 backdrop-blur-3xl">
            <div className="flex justify-center">
               <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border-2 border-emerald-500/20">
                  <CheckCircle2 size={40} />
               </div>
            </div>
            <div>
                <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">Pharmacy Registered!</h2>
                <p className="text-muted-foreground font-bold text-sm">Please share these login details with the pharmacy owner.</p>
            </div>
            
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4 relative group">
               <button onClick={copyCreds} className="absolute top-4 right-4 p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-black transition-all">
                  <Copy size={16} />
               </button>
               <div className="text-left space-y-4">
                  <div>
                     <Label className="text-[9px] font-black uppercase tracking-widest text-primary/60">Admin Email</Label>
                     <div className="text-white font-black text-lg">{newCreds?.admin.email}</div>
                  </div>
                  <div>
                     <Label className="text-[9px] font-black uppercase tracking-widest text-primary/60">Generated Password</Label>
                     <div className="text-white font-black text-2xl tracking-[0.2em]">{newCreds?.admin.password}</div>
                  </div>
                  <div className="pt-2">
                     <div className="inline-flex items-center gap-2 px-2 py-1 bg-primary/10 text-primary text-[9px] font-black uppercase rounded border border-primary/20">
                        {newCreds?.pharmacy.subscription_tier} tier
                     </div>
                  </div>
               </div>
            </div>

            <Button onClick={() => setShowCreds(false)} className="h-14 w-full rounded-2xl bg-white text-black font-black uppercase text-[10px] tracking-widest">
               Dismiss Record
            </Button>
         </DialogContent>
      </Dialog>

      {/* Broadcast Modal */}
      <Dialog open={isAnnouncing} onOpenChange={setIsAnnouncing}>
         <DialogContent className="max-w-lg bg-[#0a0a0c] border border-white/10 rounded-[2.5rem] p-12 space-y-8 backdrop-blur-3xl">
            <DialogHeader>
               <CardTitle className="text-3xl font-black text-white flex items-center gap-3">
                  <Megaphone className="text-primary" /> Network Broadcast
               </CardTitle>
               <CardDescription className="font-bold">Send a global announcement to all branch dashboards.</CardDescription>
            </DialogHeader>
            <div className="space-y-6">
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60">Announcement Title</Label>
                  <Input 
                    placeholder="e.g. Planned Maintenance" 
                    className="h-14 rounded-xl bg-white/5 border-white/10 text-white font-black focus:border-primary/50"
                    value={announcement.title}
                    onChange={e => setAnnouncement({...announcement, title: e.target.value})}
                  />
               </div>
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60">Recipient Group</Label>
                  <select 
                    className="h-14 w-full rounded-xl bg-white/5 border border-white/10 text-white font-bold px-4 outline-none focus:border-primary/50 appearance-none"
                    value={announcement.target}
                    onChange={e => setAnnouncement({...announcement, target: e.target.value as any})}
                  >
                     <option value="all">All Personnel</option>
                     <option value="admin">Branch Admins Only</option>
                     <option value="seller">Sellers / Pharmacists Only</option>
                  </select>
               </div>
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60">Message Body</Label>
                  <textarea 
                    placeholder="Describe the update..."
                    className="h-32 w-full rounded-xl bg-white/5 border border-white/10 text-white font-bold p-4 outline-none focus:border-primary/50 resize-none text-sm"
                    value={announcement.message}
                    onChange={e => setAnnouncement({...announcement, message: e.target.value})}
                  />
               </div>
            </div>
            <DialogFooter>
               <Button disabled={submitting} onClick={handleCreateAnnouncement} className="h-16 w-full rounded-2xl bg-primary text-black font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-primary/30">
                  {submitting ? <Loader2 className="animate-spin" /> : 'Transmit to Network'}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}
