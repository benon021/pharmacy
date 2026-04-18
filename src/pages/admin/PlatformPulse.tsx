import { useState } from "react";
import { localDb } from "@/lib/db";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Zap, 
  Plus, 
  Trash2, 
  Activity, 
  ShieldCheck, 
  Globe, 
  Megaphone, 
  ArrowRight,
  Database,
  Users,
  Clock,
  Settings
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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function PlatformPulse() {
  const queryClient = useQueryClient();
  const [newTier, setNewTier] = useState({
    name: "",
    price: "",
    duration: "30"
  });

  const { data: tiers = [], isLoading: loadingTiers } = useQuery({
    queryKey: ["pricing-tiers"],
    queryFn: () => localDb.pricing.getAll()
  });

  const { data: stats } = useQuery({
    queryKey: ["network-stats"],
    queryFn: async () => {
      const pharmacies = await localDb.pharmacies.getAll();
      const users = await localDb.auth.getAll(); // Simplified for local demo
      return {
        totalNodes: pharmacies.length,
        totalPersonnel: users.length,
        uptime: "99.98%"
      };
    }
  });

  const createTierMutation = useMutation({
    mutationFn: (tier: any) => localDb.pricing.create(tier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-tiers"] });
      setNewTier({ name: "", price: "", duration: "30" });
      toast.success("Subscription plan created.");
    }
  });

  const deleteTierMutation = useMutation({
    mutationFn: (id: string) => localDb.pricing.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-tiers"] });
      toast.error("Subscription plan deleted.");
    }
  });

  const handleAddTier = () => {
    if (!newTier.name || !newTier.price) {
      toast.error("Invalid plan details.");
      return;
    }
    createTierMutation.mutate({
      name: newTier.name,
      price: Number(newTier.price),
      duration_days: Number(newTier.duration)
    });
  };

  if (loadingTiers) return <LoadingSpinner />;

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div className="flex flex-col gap-3">
        <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic flex items-center gap-4">
          <div className="h-14 w-14 rounded-[2rem] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-2xl shadow-primary/10">
            <Activity className="text-primary h-7 w-7" />
          </div>
          System Settings
        </h1>
        <p className="text-muted-foreground font-black text-xs uppercase tracking-[0.3em] opacity-60">
          Global Management • Subscription Settings • System Configuration
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: ShieldCheck, label: "Security Status", val: "AES-256", status: "Secure" },
          { icon: Globe, label: "System Uptime", val: stats?.uptime || "...", status: "Normal" },
          { icon: Database, label: "Storage Mode", val: "Local Database", status: "Active" }
        ].map((item, i) => (
          <Card key={i} className="bg-card/40 border-primary/10 backdrop-blur-3xl overflow-hidden group">
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <item.icon className="h-3 w-3 text-primary" /> {item.label}
              </CardDescription>
              <CardTitle className="text-3xl font-black text-white">{item.val}</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
               <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                  <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                  {item.status}
               </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Pricing Engine */}
        <Card className="bg-card/40 border-primary/10 backdrop-blur-3xl rounded-[2.5rem] p-8 border-t-primary/30">
          <CardHeader className="p-0 pb-8 border-b border-primary/5 mb-8">
             <div className="flex items-center justify-between">
                <div>
                   <CardTitle className="text-2xl font-black text-white italic uppercase tracking-tight">Subscription Plans</CardTitle>
                   <CardDescription className="font-bold text-muted-foreground">Manage pricing tiers and billing cycles for pharmacies.</CardDescription>
                </div>
                <Zap className="text-primary/20 h-10 w-10" />
             </div>
          </CardHeader>
          <CardContent className="p-0 space-y-8">
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary/60">Plan Name</Label>
                   <Input 
                     placeholder="e.g. Standard" 
                     className="h-14 rounded-2xl bg-white/5 border-white/5 text-white font-black italic"
                     value={newTier.name}
                     onChange={e => setNewTier({...newTier, name: e.target.value})}
                   />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary/60">Fee (KSh)</Label>
                   <Input 
                     placeholder="3000" 
                     type="number"
                     className="h-14 rounded-2xl bg-white/5 border-white/5 text-white font-black italic"
                     value={newTier.price}
                     onChange={e => setNewTier({...newTier, price: e.target.value})}
                   />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-primary/60">Duration (Days)</Label>
                   <Input 
                     placeholder="30" 
                     type="number"
                     className="h-14 rounded-2xl bg-white/5 border-white/5 text-white font-black italic"
                     value={newTier.duration}
                     onChange={e => setNewTier({...newTier, duration: e.target.value})}
                   />
                </div>
             </div>
             <Button 
               onClick={handleAddTier}
               disabled={createTierMutation.isPending}
               className="w-full h-16 rounded-2xl bg-primary text-black font-black uppercase tracking-widest gap-2 shadow-2xl shadow-primary/20"
             >
                <Plus size={18} /> Create Subscription Plan
             </Button>

             <div className="space-y-4 pt-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic px-1">Active Plans</h4>
                {tiers.length === 0 ? (
                  <div className="py-12 border-2 border-dashed border-white/5 rounded-3xl text-center text-xs font-bold text-muted-foreground/30 uppercase tracking-[0.3em]">
                    No Active Tiers
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tiers.map((tier) => (
                      <div key={tier.id} className="flex items-center justify-between p-6 rounded-[1.5rem] bg-white/[0.03] border border-white/5 group hover:border-primary/20 transition-all">
                        <div>
                          <p className="text-lg font-black text-white italic uppercase tracking-tight">{tier.name}</p>
                          <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em]">{tier.duration_days} Days Billing Cycle</p>
                        </div>
                        <div className="flex items-center gap-6">
                           <div className="text-right">
                              <p className="text-xl font-black text-white italic tracking-tighter">KSh {tier.price.toLocaleString()}</p>
                           </div>
                           <Button 
                             onClick={() => deleteTierMutation.mutate(tier.id)}
                             variant="ghost" 
                             className="h-12 w-12 rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                           >
                              <Trash2 size={20} />
                           </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
           <Card className="bg-card/40 border-primary/10 backdrop-blur-3xl rounded-[2.5rem] p-8">
              <CardHeader className="p-0 pb-6 flex flex-row items-center justify-between">
                 <div>
                    <CardTitle className="text-xl font-black text-white italic uppercase tracking-tight">System Notification</CardTitle>
                    <CardDescription className="font-bold text-muted-foreground">Broadcast updates to the entire network.</CardDescription>
                 </div>
                 <Megaphone size={28} className="text-primary/20" />
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                 <textarea 
                    placeholder="Type global announcement..."
                    className="h-32 w-full rounded-2xl bg-white/5 border border-white/5 text-white font-bold p-6 outline-none focus:border-primary/20 resize-none text-sm placeholder:text-muted-foreground/20 italic"
                 />
                 <Button className="w-full h-14 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black uppercase text-[10px] tracking-widest gap-2">
                    Send Announcement <ArrowRight size={14} />
                 </Button>
              </CardContent>
           </Card>

           <div className="premium-card p-1">
              <div className="bg-[#0B0E14] rounded-[2rem] p-8 flex items-center justify-between overflow-hidden relative">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] rounded-full" />
                 <div className="flex items-center gap-4 relative z-10">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                       <Clock size={24} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Managed Branches</p>
                       <p className="text-2xl font-black text-white italic">{stats?.totalNodes || 0} Pharmacies</p>
                    </div>
                 </div>
                 <Users size={32} className="text-primary/20" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
