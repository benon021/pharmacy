import { localDb } from "@/lib/db";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Wallet, 
  TrendingUp, 
  ArrowDownLeft, 
  CreditCard, 
  Calendar, 
  Search,
  Building2,
  FileCheck,
  MoreVertical,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Banknote
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Badge } from "@/components/ui/badge";

export default function BillingManagement() {
  const queryClient = useQueryClient();

  const { data: pharmacies = [], isLoading } = useQuery({
    queryKey: ["pharmacies"],
    queryFn: () => localDb.pharmacies.getAll()
  });

  const { data: tiers = [] } = useQuery({
    queryKey: ["pricing-tiers"],
    queryFn: () => localDb.pricing.getAll()
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async ({ id, tierId }: { id: string; tierId: string }) => {
      const pharmacy = await localDb.pharmacies.getById(id);
      const tier = tiers.find(t => t.id === tierId);
      if (!pharmacy || !tier) throw new Error("Invalid billing data.");

      const newExpiry = new Date(Math.max(Date.now(), new Date(pharmacy.expires_at || '').getTime()) + (tier.duration_days * 24 * 60 * 60 * 1000));
      
      const updateData = {
        last_payment_date: new Date().toISOString(),
        expires_at: newExpiry.toISOString(),
        total_revenue_contributed: (pharmacy.total_revenue_contributed || 0) + tier.price,
        status: 'active' as any
      };
      
      // In a real app, we'd have a billing table. For now, we update the pharmacy node directly.
      await (localDb as any).pharmacies.setStatus(id, 'active');
      // Directly updating the DB for demo purposes
      const dexieDb = (localDb as any)._db || (await import('@/lib/dexie')).db;
      await dexieDb.pharmacies.update(id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pharmacies"] });
      toast.success("Payment recorded. Pharmacy subscription extended.");
    }
  });

  const totalMRR = pharmacies.reduce((acc, p) => acc + (p.monthly_fee || 0), 0);
  const totalRevenue = pharmacies.reduce((acc, p) => acc + (p.total_revenue_contributed || 0), 0);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div className="flex flex-col gap-3">
        <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic flex items-center gap-4">
          <div className="h-14 w-14 rounded-[2rem] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-2xl shadow-primary/10">
            <Wallet className="text-primary h-7 w-7" />
          </div>
          Billing & Revenue
        </h1>
        <p className="text-muted-foreground font-black text-xs uppercase tracking-[0.3em] opacity-60">
          Enterprise Billing • Subscription Health • Financial Oversight
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="bg-primary/5 border-primary/20 backdrop-blur-3xl p-8 rounded-[2.5rem] relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] rounded-full" />
           <CardHeader className="p-0 pb-2">
              <CardDescription className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                 <TrendingUp className="h-3 w-3 text-primary" /> Monthly Recurring Revenue
              </CardDescription>
              <CardTitle className="text-4xl font-black text-white italic tracking-tighter">
                KSh {totalMRR.toLocaleString()}
              </CardTitle>
           </CardHeader>
           <CardContent className="p-0 pt-4">
              <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                 <ArrowRight size={12} /> Projected Revenue Forecast
              </div>
           </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/5 backdrop-blur-3xl p-8 rounded-[2.5rem] relative overflow-hidden group">
           <CardHeader className="p-0 pb-2">
              <CardDescription className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                 <Banknote className="h-3 w-3 text-primary" /> Lifetime Value (LTV)
              </CardDescription>
              <CardTitle className="text-4xl font-black text-white italic tracking-tighter">
                KSh {totalRevenue.toLocaleString()}
              </CardTitle>
           </CardHeader>
           <CardContent className="p-0 pt-4">
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 opacity-40">
                 Cumulative Platform Earnings
              </div>
           </CardContent>
        </Card>

        <Card className="bg-white/[0.02] border-white/5 backdrop-blur-3xl p-8 rounded-[2.5rem] relative overflow-hidden group">
           <CardHeader className="p-0 pb-2">
              <CardDescription className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                 <CreditCard className="h-3 w-3 text-primary" /> Active Subscriptions
              </CardDescription>
              <CardTitle className="text-4xl font-black text-white italic tracking-tighter">
                {pharmacies.filter(p => (new Date(p.expires_at || '').getTime() > Date.now())).length}
              </CardTitle>
           </CardHeader>
           <CardContent className="p-0 pt-4">
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 opacity-40">
                 Branches with Active Access
              </div>
           </CardContent>
        </Card>
      </div>

      <Card className="bg-card/40 border-primary/10 rounded-[3rem] overflow-hidden backdrop-blur-3xl">
        <CardHeader className="p-10 pb-6 flex flex-row items-center justify-between border-b border-white/5">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black text-white italic uppercase tracking-tight">Billing Logs</CardTitle>
            <CardDescription className="font-bold text-muted-foreground">Detailed subscription status and branch payment history.</CardDescription>
          </div>
          <div className="relative w-72">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input placeholder="Search Ledger..." className="h-12 pl-12 rounded-xl bg-white/5 border-0 italic font-bold" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/[0.02] border-b border-white/5">
              <TableRow className="border-0 hover:bg-transparent">
                <TableHead className="px-10 h-16 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Pharmacy Branch</TableHead>
                <TableHead className="h-16 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Subscription Plan</TableHead>
                <TableHead className="h-16 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Billing Status</TableHead>
                <TableHead className="h-16 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Revenue Contributed</TableHead>
                <TableHead className="h-16 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right px-10">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pharmacies.map((pharmacy) => {
                const tier = tiers.find(t => t.id === pharmacy.subscription_tier);
                const isPaid = new Date(pharmacy.expires_at || '').getTime() > Date.now();
                
                return (
                  <TableRow key={pharmacy.id} className="border-b border-white/5 hover:bg-white/[0.02] group transition-colors">
                    <TableCell className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all">
                           <Building2 size={20} />
                        </div>
                        <div>
                           <p className="font-black text-white italic uppercase tracking-tight">{pharmacy.name}</p>
                           <p className="text-[10px] font-black text-muted-foreground opacity-40 uppercase tracking-widest truncate max-w-[150px]">{pharmacy.location}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                       <Badge variant="outline" className="rounded-lg bg-white/5 border-white/10 text-[9px] font-black uppercase text-white italic">
                          {tier?.name || 'GENERIC'}
                       </Badge>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
                          <span className="text-xs font-bold text-white italic">
                             {isPaid ? `Expires: ${new Date(pharmacy.expires_at!).toLocaleDateString()}` : 'EXPIRED / OVERDUE'}
                          </span>
                       </div>
                    </TableCell>
                    <TableCell className="text-right">
                       <p className="text-sm font-black text-white tracking-widest italic">KSh {pharmacy.total_revenue_contributed?.toLocaleString() || '0'}</p>
                    </TableCell>
                    <TableCell className="text-right px-10">
                       <Button 
                         disabled={recordPaymentMutation.isPending}
                         onClick={() => recordPaymentMutation.mutate({ id: pharmacy.id, tierId: pharmacy.subscription_tier })}
                         className="h-12 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500 hover:text-white transition-all gap-2"
                        >
                          <Banknote size={14} /> Record Payment
                       </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {pharmacies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center text-muted-foreground/30 font-black uppercase tracking-[0.4em]">
                     Ledger is Blank
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-start gap-4 p-8 rounded-[2.5rem] bg-emerald-500/5 border border-emerald-500/10 opacity-60">
         <ShieldCheck className="text-emerald-500 mt-1" />
         <div>
            <p className="text-sm font-black text-white italic uppercase tracking-tighter">Billing Policy</p>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-relaxed mt-1">
               Payment records are logged in the system audit logs. Subscriptions are extended based on the selected plan duration.
            </p>
         </div>
      </div>
    </div>
  );
}
