import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { localDb } from "@/lib/db";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, 
  Search, 
  Star, 
  Calendar, 
  Phone, 
  History,
  TrendingUp,
  Award,
  Filter,
  ArrowUpRight,
  Gift
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function CustomerLoyalty() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers", user?.pharmacy_id],
    queryFn: () => localDb.customers.getAll(),
    enabled: !!user?.pharmacy_id
  });

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.phone.includes(search)
    ).sort((a, b) => b.points - a.points);
  }, [customers, search]);

  const stats = useMemo(() => {
    const totalPoints = customers.reduce((sum, c) => sum + (c.points || 0), 0);
    const topCustomer = [...customers].sort((a, b) => b.points - a.points)[0];
    return { totalPoints, topCustomer };
  }, [customers]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/10">
            <Star className="text-primary h-6 w-6" />
          </div>
          Loyalty Intelligence
        </h1>
        <p className="text-muted-foreground font-black text-xs uppercase tracking-[0.2em] opacity-60">
          Retention Management • Customer Lifetime Value • Reward Registry
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/40 border-primary/10 backdrop-blur-3xl p-6 rounded-[2rem] border-t-primary/20">
           <CardHeader className="p-0 pb-4">
              <CardDescription className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                 <TrendingUp className="h-3 w-3 text-emerald-500" /> Circulating Points
              </CardDescription>
              <CardTitle className="text-4xl font-black text-white">{stats.totalPoints.toLocaleString()}</CardTitle>
           </CardHeader>
           <CardContent className="p-0">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Aggregate reward liability</p>
           </CardContent>
        </Card>

        <Card className="bg-card/40 border-primary/10 backdrop-blur-3xl p-6 rounded-[2rem] border-t-primary/20">
           <CardHeader className="p-0 pb-4">
              <CardDescription className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                 <Award className="h-3 w-3 text-primary" /> Elite Rank Holder
              </CardDescription>
              <CardTitle className="text-2xl font-black text-white truncate italic">{stats.topCustomer?.name || 'N/A'}</CardTitle>
           </CardHeader>
           <CardContent className="p-0">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Highest participation score</p>
           </CardContent>
        </Card>

        <Card className="bg-card/40 border-primary/10 backdrop-blur-3xl p-6 rounded-[2rem] border-t-primary/20">
           <CardHeader className="p-0 pb-4">
              <CardDescription className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-primary">
                 <Gift className="h-3 w-3" /> Potential Revenue
              </CardDescription>
              <CardTitle className="text-4xl font-black text-white">+18.4%</CardTitle>
           </CardHeader>
           <CardContent className="p-0 text-emerald-500/80 font-bold text-xs">
              Projected retention uplift
           </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
         <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
            <Input 
              placeholder="SEARCH BY IDENTITY OR TELEMETRY..." 
              className="h-14 pl-14 rounded-2xl bg-primary/5 border-primary/10 focus:border-primary/40 font-black text-[10px] tracking-widest text-white uppercase placeholder:text-muted-foreground/20"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
         </div>
         <Button variant="outline" className="h-14 w-14 rounded-2xl border-primary/10 bg-primary/5 text-primary">
            <Filter size={20} />
         </Button>
      </div>

      <Card className="bg-card/40 border-primary/10 backdrop-blur-2xl overflow-hidden rounded-[2.5rem]">
        <CardHeader className="p-8 border-b border-primary/5 bg-primary/5 flex flex-row items-center justify-between">
           <div>
              <CardTitle className="text-xl font-black text-white italic tracking-widest uppercase">Member Registry</CardTitle>
              <CardDescription className="font-bold text-muted-foreground/60">Loyalty point accrual and visit frequency audit.</CardDescription>
           </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-primary/5 hover:bg-transparent">
                <TableHead className="px-10 py-6 font-black uppercase tracking-[0.2em] text-[10px] text-primary/60">Customer Name</TableHead>
                <TableHead className="font-black uppercase tracking-[0.2em] text-[10px] text-primary/60">Phone Uplink</TableHead>
                <TableHead className="font-black uppercase tracking-[0.2em] text-[10px] text-primary/60">Accrued Points</TableHead>
                <TableHead className="font-black uppercase tracking-[0.2em] text-[10px] text-primary/60">Last Presence</TableHead>
                <TableHead className="text-right px-10 font-black uppercase tracking-[0.2em] text-[10px] text-primary/60">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((c) => (
                <TableRow key={c.id} className="border-primary/5 hover:bg-primary/5 group transition-all">
                  <TableCell className="px-10 py-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black border border-primary/20 shadow-inner group-hover:scale-110 transition-transform">
                        {c.name[0]}
                      </div>
                      <div className="text-sm font-black text-white italic uppercase tracking-tighter">{c.name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                       <Phone size={12} className="text-primary/40" /> {c.phone}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-lg border border-primary/20 font-black text-xs">
                       <Star size={12} fill="currentColor" /> {c.points}
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                       <History size={12} className="text-primary/40" /> {new Date(c.last_visit).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right px-10">
                    <Button variant="ghost" size="sm" className="h-10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-black gap-2 opacity-0 group-hover:opacity-100 transition-all">
                       Reward Protocol <ArrowUpRight size={12} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCustomers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-24 text-center">
                     <div className="flex flex-col items-center gap-4 opacity-10">
                        <Users size={64} className="text-white" />
                        <p className="font-black text-sm uppercase tracking-[0.3em]">Registry Silent</p>
                     </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
