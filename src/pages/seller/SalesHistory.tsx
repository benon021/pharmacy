import { useEffect, useState } from "react";
import { localDb } from "@/lib/db";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Calendar, User, CreditCard, ChevronRight, Search, Printer, Receipt } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ReceiptModal from "@/components/ReceiptModal";

export default function SalesHistory() {
  const { user } = useAuth();
  const [sales, setSales] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const fetchSales = async () => {
      const allDetailed = await localDb.sales.getDetailed();
      const sellerSales = allDetailed.filter(s => s.seller_id === user.id);
      setSales(sellerSales);
    };
    fetchSales();
  }, [user]);

  const filteredSales = sales.filter(s => 
    s.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.items.some((i: any) => i.drug_name.toLowerCase().includes(search.toLowerCase()))
  );

  const openReceipt = (sale: any) => {
    const date = new Date(sale.created_at);
    setReceiptData({
      receiptNo: sale.id.toUpperCase().slice(0, 10),
      date: date.toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" }),
      time: date.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" }),
      sellerName: sale.seller_name || "Authorized Staff",
      customerName: sale.customer_name || "Walk-in Customer",
      customerPhone: sale.customer_phone || "",
      paymentMethod: sale.payment_method,
      items: sale.items.map((i: any) => ({
        name: i.drug_name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total_price: i.total_price,
        is_taxable: i.tax_amount > 0,
        batch_number: null // Note: Batch number might not be in detailed sale items, we'll use null
      })),
      taxAmount: sale.tax_amount,
      discount: sale.discount_total,
      subtotal: Number(sale.total_amount) - Number(sale.tax_amount) + Number(sale.discount_total),
      total: Number(sale.total_amount)
    });
    setReceiptOpen(true);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-primary font-semibold text-sm">
          <ShoppingBag className="h-4 w-4" />
          My Transactions
        </div>
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">
          Sales History
        </h1>
        <p className="text-muted-foreground">Review your personal sales performance and records</p>
      </div>

      <div className="relative group max-w-md">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          placeholder="Search by customer or drug name..."
          className="pl-12 h-12 rounded-xl bg-card dark:bg-white/5 border-border dark:border-white/10 text-sm transition-all focus:bg-white/10"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="premium-card !p-0 overflow-hidden border-border dark:border-white/5!">
        <Table>
          <TableHeader>
            <TableRow className="bg-white/[0.03] hover:bg-white/[0.03] border-border dark:border-white/5">
              <TableHead className="py-5 font-bold text-xs uppercase tracking-widest text-muted-foreground px-6">Timestamp</TableHead>
              <TableHead className="py-5 font-bold text-xs uppercase tracking-widest text-muted-foreground">Customer</TableHead>
              <TableHead className="py-5 font-bold text-xs uppercase tracking-widest text-muted-foreground">Purchased Items</TableHead>
              <TableHead className="py-5 text-right font-bold text-xs uppercase tracking-widest text-muted-foreground px-6">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-20 text-muted-foreground">
                  No sales found in your history
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
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-card dark:bg-white/5 text-muted-foreground">
                      <Calendar className="h-5 w-5" />
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
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 flex items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                      {sale.customer_name?.[0] || "W"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground dark:text-white">{sale.customer_name || "Walk-in Customer"}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <CreditCard className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{sale.payment_method}</span>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1 py-1">
                    {sale.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 group/item">
                        <ChevronRight className="h-3 w-3 text-primary/40 group-hover/item:text-primary transition-colors" />
                        <span className="text-xs text-muted-foreground group-hover/item:text-foreground dark:text-white transition-colors">
                          <span className="font-bold text-foreground dark:text-white/50">{item.quantity}x</span> {item.drug_name}
                        </span>
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right px-6">
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-lg font-bold text-primary tracking-tighter">KES {Number(sale.total_amount).toLocaleString()}</p>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openReceipt(sale)}
                        className="h-8 rounded-lg px-3 text-[10px] font-black uppercase tracking-widest bg-card dark:bg-white/5 hover:bg-primary hover:text-black transition-all gap-2"
                      >
                        <Printer className="h-3 w-3" />
                        Print Receipt
                      </Button>
                      <Badge variant="outline" className="text-[9px] h-4 border-primary/20 text-primary/60 bg-primary/5 uppercase tracking-tighter">Verified</Badge>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ReceiptModal 
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        data={receiptData}
      />
    </div>
  );
}
