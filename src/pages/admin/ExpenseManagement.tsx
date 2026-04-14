import { useEffect, useState } from "react";
import { localDb, Expense } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, Search, Trash2, Wallet, Calendar, Tag, CreditCard, 
  Banknote, Zap, Users, Home, Loader2, Filter, DollarSign,
  TrendingDown, TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";

const categories = [
  { id: "Rent", icon: Home, color: "text-blue-500 bg-blue-500/10" },
  { id: "Salaries", icon: Users, color: "text-violet-500 bg-violet-500/10" },
  { id: "Power", icon: Zap, color: "text-amber-500 bg-amber-500/10" },
  { id: "Stock", icon: Tag, color: "text-green-500 bg-green-500/10" },
  { id: "Marketing", icon: Megaphone, color: "text-pink-500 bg-pink-500/10" },
  { id: "Other", icon: Wallet, color: "text-gray-500 bg-gray-500/10" },
];

function Megaphone(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
  )
}

export default function ExpenseManagement() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    amount: 0,
    category: "Other",
    date: new Date().toISOString().split('T')[0],
    description: ""
  });

  const fetchExpenses = async () => {
    const data = await localDb.expenses.getAll();
    setExpenses(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSave = async () => {
    if (!form.title || form.amount <= 0) {
      toast.error("Please fill in the title and a valid amount");
      return;
    }
    setSaving(true);
    // Mimic DB delay
    await new Promise(r => setTimeout(r, 600));

    const { error } = await localDb.expenses.create({
      ...form,
      amount: Number(form.amount)
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Expense logged: KES ${Number(form.amount).toLocaleString()}`);
      setDialogOpen(false);
      setForm({ title: "", amount: 0, category: "Other", date: new Date().toISOString().split('T')[0], description: "" });
      fetchExpenses();
    }
    setSaving(false);
  };

  const deleteExpense = async (id: string) => {
    await localDb.expenses.delete(id);
    toast.info("Expense record removed");
    fetchExpenses();
  };

  const filtered = expenses.filter(e => 
    (e.title || "").toLowerCase().includes(search.toLowerCase()) || 
    (e.category || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
            <Wallet className="h-4 w-4" /> Operational Burn
          </div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent italic tracking-tighter">
            Expense Tracker
          </h1>
          <p className="text-muted-foreground">Log utilities, rent, and staff salaries to calculate real net profit</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="h-12 rounded-xl shadow-xl shadow-red-500/20 gap-2 px-6 font-bold bg-red-500 text-foreground dark:text-white hover:bg-red-600 border-none transition-all">
          <Plus className="h-5 w-5" /> Log New Expense
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="premium-card bg-red-500/[0.03] border-red-500/20">
           <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Total Monthly Burn</p>
           <p className="text-3xl font-black text-red-500 tabular-nums">KES {totalExpenses.toLocaleString()}</p>
        </div>
        <div className="premium-card">
           <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Active Ledger Items</p>
           <p className="text-3xl font-black text-foreground dark:text-white">{expenses.length}</p>
        </div>
        <div className="premium-card bg-primary/5 border-primary/20">
           <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Burn Variance</p>
           <p className="text-3xl font-black text-primary flex items-center gap-2">
             0.0% <TrendingDown className="h-6 w-6 text-primary/40" />
           </p>
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
        <Input 
          placeholder="Filter expenses by name or category..." 
          className="pl-12 h-14 rounded-2xl bg-card dark:bg-white/5 border-border dark:border-white/10 text-lg transition-all focus:bg-white/10" 
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="premium-card !p-0 overflow-hidden border-border dark:border-white/5!">
        <Table>
          <TableHeader>
            <TableRow className="bg-white/[0.03] hover:bg-white/[0.03] border-border dark:border-white/5">
              <TableHead className="py-5 font-bold text-xs uppercase tracking-widest text-muted-foreground px-6">Expense Details</TableHead>
              <TableHead className="py-5 font-bold text-xs uppercase tracking-widest text-muted-foreground">Category</TableHead>
              <TableHead className="py-5 font-bold text-xs uppercase tracking-widest text-muted-foreground">Date</TableHead>
              <TableHead className="py-5 text-right font-bold text-xs uppercase tracking-widest text-muted-foreground px-6">Amount</TableHead>
              <TableHead className="py-5 text-right font-bold text-xs uppercase tracking-widest text-muted-foreground px-6">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                  No expenditure records found
                </TableCell>
              </TableRow>
            ) : filtered.map((exp, i) => {
              const cat = categories.find(c => c.id === exp.category) || categories[5];
              return (
                <TableRow key={exp.id} className="group hover:bg-muted dark:bg-white/[0.02] border-border dark:border-white/5 animate-fade-in" style={{ animationDelay: `${i*30}ms` }}>
                  <TableCell className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className={cn("h-10 w-10 flex items-center justify-center rounded-xl", cat.color)}>
                        <cat.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground dark:text-white text-base">{exp.title}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">{exp.description || 'No notes attached'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-bold text-foreground dark:text-white/60">{exp.category}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                      <Calendar className="h-3.5 w-3.5" /> {exp.date}
                    </div>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <p className="font-black text-red-400 tabular-nums text-lg italic tracking-tighter">KES {exp.amount.toLocaleString()}</p>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <Button variant="ghost" size="icon" onClick={() => deleteExpense(exp.id)} className="h-10 w-10 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-background border-border dark:border-white/10 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-8 bg-muted dark:bg-white/[0.02] border-b border-border dark:border-white/5">
            <DialogTitle className="text-2xl font-bold text-foreground dark:text-white">Log Operational Core Charge</DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Charge Title *</Label>
              <Input className="h-12 rounded-xl bg-card dark:bg-white/5 border-border dark:border-white/10 text-foreground dark:text-white font-bold" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Nairobi Power - April" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category</Label>
                <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                  <SelectTrigger className="h-12 rounded-xl bg-card dark:bg-white/5 border-border dark:border-white/10 font-bold text-foreground dark:text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#0B0E14] border-border dark:border-white/10 text-foreground dark:text-white">
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.id}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount (KES) *</Label>
                <Input type="number" className="h-12 rounded-xl bg-card dark:bg-white/5 border-border dark:border-white/10 text-foreground dark:text-white font-black italic tabular-nums" value={form.amount || ""} onChange={e => setForm({...form, amount: Number(e.target.value)})} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Billing Date</Label>
              <Input type="date" className="h-12 rounded-xl bg-card dark:bg-white/5 border-border dark:border-white/10 text-foreground dark:text-white" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Internal Notes</Label>
              <textarea className="w-full h-24 rounded-xl bg-card dark:bg-white/5 border-border dark:border-white/10 p-4 text-sm text-foreground dark:text-white outline-none focus:ring-1 focus:ring-red-500/30" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Voucher numbers, reference details..." />
            </div>
          </div>
          <DialogFooter className="p-8 bg-muted dark:bg-white/[0.02] border-t border-border dark:border-white/5">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="h-12 rounded-xl text-muted-foreground hover:text-foreground dark:text-white font-bold">Discard</Button>
            <Button onClick={handleSave} disabled={saving} className="h-12 rounded-xl px-12 shadow-xl shadow-red-500/20 font-black bg-red-500 text-foreground dark:text-white hover:bg-red-600 transition-all">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Authorize Burn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
