import { useEffect, useState } from "react";
import { localDb, User as AppUser } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Loader2, Users, Search, Mail, Phone, Shield, Power, 
  Key, ShieldAlert, TrendingUp, Target, BarChart3, Fingerprint,
  Activity, ArrowUpRight, ShoppingBag, DollarSign, UserCircle
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EntityIntelligenceModal from "@/components/EntityIntelligenceModal";
import { Info } from "lucide-react";

export default function SellerManagement() {
  const [sellers, setSellers] = useState<AppUser[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ email: "", password: "", fullName: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<AppUser | null>(null);
  const [intelOpen, setIntelOpen] = useState(false);
  const [intelData, setIntelData] = useState<any>(null);

  const fetchSellers = () => {
    const allUsers = localDb.auth.getAll();
    setSellers(allUsers.filter(u => u.role === "seller"));
  };

  useEffect(() => { 
    fetchSellers(); 
  }, []);

  const filteredSellers = sellers.filter(s => 
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!form.email || !form.password || !form.fullName) {
      toast.error("Please fill all required fields");
      return;
    }
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));

    localDb.auth.insert({
      email: form.email,
      password: form.password,
      full_name: form.fullName,
      role: "seller",
      is_active: true
    });

    toast.success("New seller credential generated");
    setSaving(false);
    setDialogOpen(false);
    setForm({ email: "", password: "", fullName: "", phone: "" });
    fetchSellers();
  };

  const toggleActive = async (seller: AppUser) => {
    localDb.auth.update(seller.id, { is_active: !seller.is_active });
    toast.success(seller.is_active ? "Access revoked" : "Access restored");
    fetchSellers();
  };

  const forceResetPassword = (seller: AppUser) => {
    localDb.auth.update(seller.id, { password: "password123" });
    toast.warning(`Security Protocol: Password for ${seller.full_name} reset to default.`);
    localDb.auditLogs.create("Security", `Admin force-reset password for ${seller.full_name}`, "admin", "Admin");
    fetchSellers();
    if (selectedSeller?.id === seller.id) setSelectedSeller({...seller, password: "password123"});
  };

  const openIntel = (seller: AppUser) => {
    setSelectedSeller(seller);
    setIntelOpen(true);
  };

  const getSellerPerformance = (sellerId: string) => {
    const sales = localDb.sales.getDetailed().filter(s => s.seller_id === sellerId);
    const drugs = localDb.drugs.getAll();
    const costMap = drugs.reduce((acc, d) => ({ ...acc, [d.id]: d.cost_price || 0 }), {} as any);

    const perf: Record<string, { name: string, qty: number, revenue: number, profit: number }> = {};

    sales.forEach(s => {
      s.items.forEach((item: any) => {
        if (!perf[item.drug_id]) {
          perf[item.drug_id] = { name: item.drug_name, qty: 0, revenue: 0, profit: 0 };
        }
        const unitProfit = Number(item.unit_price) - (costMap[item.drug_id] || 0);
        perf[item.drug_id].qty += Number(item.quantity);
        perf[item.drug_id].revenue += Number(item.total_price);
        perf[item.drug_id].profit += (unitProfit * Number(item.quantity));
      });
    });

    return Object.values(perf).sort((a, b) => b.profit - a.profit);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-accent font-semibold text-sm">
            <Shield className="h-4 w-4" />
            Authorized Personnel
          </div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">
            Seller Management
          </h1>
          <p className="text-muted-foreground">Provision and audit pharmacy staff access protocols</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="h-12 rounded-xl shadow-xl shadow-primary/20 gap-2 px-6 font-bold">
          <Plus className="h-5 w-5" /> Provision Seller
        </Button>
      </div>

      <div className="relative group max-w-md">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          placeholder="Search staff by name or email..."
          className="pl-12 h-12 rounded-xl bg-card dark:bg-white/5 border-border dark:border-white/10 text-sm transition-all focus:bg-white/10"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="premium-card !p-0 overflow-hidden border-border dark:border-white/5!">
        <Table>
          <TableHeader>
            <TableRow className="bg-white/[0.03] hover:bg-white/[0.03] border-border dark:border-white/5">
              <TableHead className="py-5 font-bold text-xs uppercase tracking-widest text-muted-foreground px-6">Identity</TableHead>
              <TableHead className="py-5 font-bold text-xs uppercase tracking-widest text-muted-foreground">Contact</TableHead>
              <TableHead className="py-5 font-bold text-xs uppercase tracking-widest text-muted-foreground">Status</TableHead>
              <TableHead className="py-5 text-right font-bold text-xs uppercase tracking-widest text-muted-foreground px-6">Operational Control</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSellers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-24 text-muted-foreground">
                  <div className="flex flex-col items-center gap-3">
                    <Users className="h-12 w-12 opacity-10" />
                    <p>No seller accounts match your search</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredSellers.map((seller, i) => (
              <TableRow 
                key={seller.id}
                className="group hover:bg-muted dark:bg-white/[0.02] border-border dark:border-white/5 transition-colors animate-fade-in"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <TableCell className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover:scale-110 transition-transform font-bold overflow-hidden">
                      {seller.avatar_url ? (
                        <img src={seller.avatar_url} alt="DP" className="h-full w-full object-cover" />
                      ) : (
                        seller.full_name[0]
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-foreground dark:text-white text-base">{seller.full_name}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                         <Shield className="h-3 w-3 text-accent" />
                         ID: {seller.id}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {seller.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                   <Badge className={cn(
                     "rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-widest border",
                     seller.is_active 
                      ? "bg-green-500/10 text-green-500 border-green-500/20" 
                      : "bg-red-500/10 text-red-500 border-red-500/20"
                   )}>
                     {seller.is_active ? "Active" : "Deactivated"}
                   </Badge>
                </TableCell>
                <TableCell className="text-right px-6">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => openIntel(seller)}
                    className="h-10 rounded-xl px-4 flex items-center gap-2 font-bold uppercase tracking-widest text-[9px] border-primary/20 hover:bg-primary/10 hover:text-primary transition-all shadow-lg shadow-primary/5"
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    View Intelligence
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-background border-border dark:border-white/10 rounded-[2rem] p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-8 bg-muted dark:bg-white/[0.02] border-b border-border dark:border-white/5">
            <DialogTitle className="text-2xl font-bold text-foreground dark:text-white">Issue Staff Credentials</DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Legal Full Name *</Label>
              <Input className="h-12 rounded-xl bg-card dark:bg-white/5 border-border dark:border-white/10" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Corporate Email *</Label>
              <Input className="h-12 rounded-xl bg-card dark:bg-white/5 border-border dark:border-white/10" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Access Password *</Label>
              <Input className="h-12 rounded-xl bg-card dark:bg-white/5 border-border dark:border-white/10" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
          </div>
          <DialogFooter className="p-8 bg-muted dark:bg-white/[0.02] border-t border-border dark:border-white/5">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="h-12 rounded-xl text-muted-foreground hover:text-foreground dark:text-white font-bold">Cancel</Button>
            <Button onClick={handleCreate} disabled={saving} className="h-12 rounded-xl px-8 shadow-xl shadow-primary/20 font-bold">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EntityIntelligenceModal
        open={intelOpen}
        onClose={() => setIntelOpen(false)}
        type="seller"
        data={selectedSeller}
      />
    </div>
  );
}
