import { useEffect, useState } from "react";
import { localDb } from "@/lib/db";
import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Calendar, User, Search, Filter, ArrowUpRight, ArrowRight, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function AdminSales() {
  const [sales, setSales] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setSales(localDb.sales.getDetailed());
  }, []);

  const filteredSales = sales.filter(s => 
    s.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.seller_name.toLowerCase().includes(search.toLowerCase()) ||
    s.items.some((i: any) => i.drug_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <ShoppingCart className="h-4 w-4" />
            General Ledger
          </div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">
            System-wide Sales
          </h1>
          <p className="text-muted-foreground">Comprehensive record of every transaction across all pharmacy outlets</p>
        </div>
        <Link to="/seller/new-sale">
          <Button className="h-14 px-8 rounded-2xl bg-primary text-black font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-primary/20 hover:scale-[1.05] transition-all flex items-center gap-3">
            Launch POS Center <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative group flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search by customer, seller, or product name..."
            className="pl-12 h-14 rounded-2xl bg-card dark:bg-white/5 border-border dark:border-white/10 text-lg transition-all focus:bg-white/10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex h-14 items-center gap-4 px-6 rounded-2xl bg-card dark:bg-white/5 border border-border dark:border-white/10">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-bold text-foreground dark:text-white uppercase tracking-widest whitespace-nowrap">Filter Logs</span>
        </div>
      </div>

      <div className="premium-card !p-0 overflow-hidden border-border dark:border-white/5!">
        <Table>
          <TableHeader>
            <TableRow className="bg-white/[0.03] hover:bg-white/[0.03] border-border dark:border-white/5">
              <TableHead className="py-5 font-bold text-xs uppercase tracking-widest text-muted-foreground px-6">Transaction Details</TableHead>
              <TableHead className="py-5 font-bold text-xs uppercase tracking-widest text-muted-foreground">Stakeholders</TableHead>
              <TableHead className="py-5 font-bold text-xs uppercase tracking-widest text-muted-foreground">Product Log</TableHead>
              <TableHead className="py-5 text-right font-bold text-xs uppercase tracking-widest text-muted-foreground px-6">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-20 text-muted-foreground">
                  No transaction data available in the current records
                </TableCell>
              </TableRow>
            ) : filteredSales.map((sale, i) => (
              <TableRow 
                key={sale.id}
                className="group hover:bg-muted dark:bg-white/[0.02] border-border dark:border-white/5 transition-colors animate-fade-in"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <TableCell className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-card dark:bg-white/5 text-muted-foreground border border-border dark:border-white/5 font-mono text-[10px] tabular-nums">
                      {sale.id.slice(0, 4)}
                    </div>
                    <div>
                      <p className="font-bold text-foreground dark:text-white text-sm">
                        {new Date(sale.created_at).toLocaleDateString("en-KE", { month: "short", day: "numeric" })}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                        {new Date(sale.created_at).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       <User className="h-3 w-3 text-primary" />
                       <p className="text-sm font-bold text-foreground dark:text-white whitespace-nowrap">{sale.seller_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                       <p className="text-[11px] text-muted-foreground">{sale.customer_name || "Guest Walk-in"}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-[200px] space-y-0.5">
                    {sale.items.map((item: any, idx: number) => (
                      <p key={idx} className="text-[11px] text-muted-foreground truncate">
                        <span className="text-foreground dark:text-white/40">{item.quantity}x</span> {item.drug_name}
                      </p>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right px-6">
                  <div className="inline-flex flex-col items-end">
                    <p className="text-lg font-bold text-foreground dark:text-white tracking-tighter tabular-nums">KES {Number(sale.total_amount).toLocaleString()}</p>
                    <div className="flex items-center gap-1 text-[10px] text-green-400 font-bold uppercase tracking-tighter">
                      <ArrowUpRight className="h-3 w-3" />
                      Processed
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
