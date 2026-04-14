import { useEffect, useState } from "react";
import { localDb, Supplier } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Truck, Mail, Phone, ShoppingBag, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function SupplierManagement() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    category: "Wholesale"
  });

  const fetchSuppliers = async () => {
    const data = await localDb.suppliers.getAll();
    setSuppliers(data);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleCreate = async () => {
    if (!form.name || !form.email) {
      toast.error("Supplier name and email are required");
      return;
    }
    setSaving(true);
    // Simulate network delay
    await new Promise(r => setTimeout(r, 600));

    await localDb.suppliers.insert({
      ...form,
      is_active: true
    });

    toast.success("Supplier registered successfully");
    setSaving(false);
    setDialogOpen(false);
    setForm({ name: "", contact_person: "", email: "", phone: "", category: "Wholesale" });
    fetchSuppliers();
  };

  const filtered = (suppliers || []).filter(s => 
    (s?.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (s?.contact_person || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <Truck className="h-4 w-4" />
            Supply Chain
          </div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">
            Supplier Network
          </h1>
          <p className="text-muted-foreground">Manage pharmaceutical vendors and wholesale procurement contacts</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="h-12 rounded-xl shadow-xl shadow-primary/20 gap-2 px-6 font-bold">
          <Plus className="h-5 w-5" /> Add New Supplier
        </Button>
      </div>

      <div className="relative group max-w-md">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          placeholder="Filter by supplier name or contact..."
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
              <TableHead className="py-5 font-bold text-xs uppercase tracking-widest text-muted-foreground">Contact Person</TableHead>
              <TableHead className="py-5 font-bold text-xs uppercase tracking-widest text-muted-foreground">Category</TableHead>
              <TableHead className="py-5 text-right font-bold text-xs uppercase tracking-widest text-muted-foreground px-6">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-24 text-muted-foreground">
                  <div className="flex flex-col items-center gap-3">
                    <Truck className="h-12 w-12 opacity-10" />
                    <p>No suppliers found in your network</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.map((sup, i) => (
              <TableRow 
                key={sup.id}
                className="group hover:bg-muted dark:bg-white/[0.02] border-border dark:border-white/5 transition-colors animate-fade-in"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <TableCell className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover:scale-110 transition-transform font-bold">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground dark:text-white text-base">{sup.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                          <Mail className="h-3 w-3" /> {sup.email}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                          <Phone className="h-3 w-3" /> {sup.phone}
                        </div>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground dark:text-white font-medium">{sup.contact_person}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-card dark:bg-white/5 border-border dark:border-white/10 text-muted-foreground">
                    {sup.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-right px-6">
                   <Badge className="bg-green-500/10 text-green-500 border-green-500/20 rounded-lg px-2 py-0.5 text-[10px] font-black uppercase">
                     Active Partner
                   </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-background border-border dark:border-white/10 rounded-[2rem] p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-8 bg-muted dark:bg-white/[0.02] border-b border-border dark:border-white/5">
            <DialogTitle className="text-2xl font-bold text-foreground dark:text-white">Register Supplier</DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Company Name *</Label>
              <Input className="h-12 rounded-xl bg-card dark:bg-white/5 border-border dark:border-white/10" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Contact Person</Label>
                <Input className="h-12 rounded-xl bg-card dark:bg-white/5 border-border dark:border-white/10" value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Category</Label>
                <Input className="h-12 rounded-xl bg-card dark:bg-white/5 border-border dark:border-white/10" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email Address *</Label>
              <Input className="h-12 rounded-xl bg-card dark:bg-white/5 border-border dark:border-white/10" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Phone Number</Label>
              <Input className="h-12 rounded-xl bg-card dark:bg-white/5 border-border dark:border-white/10" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <DialogFooter className="p-8 bg-muted dark:bg-white/[0.02] border-t border-border dark:border-white/5">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="h-12 rounded-xl text-muted-foreground hover:text-foreground dark:text-white font-bold">Cancel</Button>
            <Button onClick={handleCreate} disabled={saving} className="h-12 rounded-xl px-8 shadow-xl shadow-primary/20 font-bold">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Supplier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
