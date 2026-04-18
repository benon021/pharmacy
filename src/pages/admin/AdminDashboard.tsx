import { useEffect, useState } from "react";
import { localDb, Sale, Drug, Expense } from "@/lib/db";
import { Link } from "react-router-dom";
import { Package, ShoppingCart, Users, AlertTriangle, TrendingUp, DollarSign, Activity, CalendarDays, ChevronRight, Pill, ArrowRight, BarChart3, Wallet } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";


interface Stats {
  totalDrugs: number;
  lowStockCount: number;
  totalSalesToday: number;
  totalRevenue: number;
  totalSellers: number;
  expiringCount: number;
  expiredCount: number;
}

function getDaysUntilExpiry(expiryDate: string | null): number | null {
  if (!expiryDate) return null;
  const now = new Date();
  const expiry = new Date(expiryDate);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function AdminDashboard() {
  const { data: drugs = [] } = useQuery({ queryKey: ["drugs"], queryFn: () => localDb.drugs.getAll() });
  const { data: sales = [] } = useQuery({ queryKey: ["sales"], queryFn: () => localDb.sales.getAll() });
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: () => localDb.auth.getAll() });
  const { data: expenses = [] } = useQuery({ queryKey: ["expenses"], queryFn: () => localDb.expenses.getAll() });
  const { data: recentSales = [] } = useQuery({ queryKey: ["recent-sales"], queryFn: () => localDb.sales.getRecent(5) });

  const [stats, setStats] = useState<Stats>({
    totalDrugs: 0, lowStockCount: 0, totalSalesToday: 0, totalRevenue: 0, totalSellers: 0, expiringCount: 0, expiredCount: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [inventoryChart, setInventoryChart] = useState<any[]>([]);
  const [lowStockDrugs, setLowStockDrugs] = useState<Drug[]>([]);
  const [expiringDrugs, setExpiringDrugs] = useState<Drug[]>([]);


  useEffect(() => {
    const calculateStats = () => {
      const today = new Date().toISOString().split("T")[0];
      
      const todaySales = sales.filter(s => s.created_at.startsWith(today));
      const activeDrugs = drugs.filter(d => d.is_active);
      const lowStock = activeDrugs.filter(d => d.stock <= (d.reorder_level || 10));
      const expiring = activeDrugs.filter(d => {
        const days = getDaysUntilExpiry(d.expiry_date);
        return days !== null && days <= 90;
      });
      const expired = activeDrugs.filter(d => {
        const days = getDaysUntilExpiry(d.expiry_date);
        return days !== null && days <= 0;
      });

      setStats({
        totalDrugs: activeDrugs.length,
        lowStockCount: lowStock.length,
        totalSalesToday: todaySales.length,
        totalRevenue: sales.reduce((sum, s) => sum + Number(s.total_amount), 0),
        totalSellers: users.filter(u => u.role === "seller").length,
        expiringCount: expiring.length,
        expiredCount: expired.length,
      });

      setLowStockDrugs(lowStock.slice(0, 5));
      setExpiringDrugs(expiring.sort((a, b) => {
        const da = getDaysUntilExpiry(a.expiry_date) ?? 999;
        const db = getDaysUntilExpiry(b.expiry_date) ?? 999;
        return da - db;
      }).slice(0, 5));

      const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split("T")[0];
      });

      const chartD = last7.map(day => ({
        day: day.slice(8), 
        sales: sales.filter(s => s.created_at.startsWith(day)).reduce((sum, s) => sum + Number(s.total_amount), 0),
        expenses: expenses.filter(e => e.created_at.startsWith(day)).reduce((sum, e) => sum + Number(e.amount), 0),
      }));
      setChartData(chartD);

      setInventoryChart([
        { name: 'Healthy', value: drugs.filter(d => d.is_active && d.stock > (d.reorder_level || 10)).length },
        { name: 'Low', value: lowStock.length },
        { name: 'Expired', value: expired.length },
      ]);
    };
    calculateStats();
  }, [drugs, sales, users, expenses]);


  const statCards = [
    { label: "Revenue", value: `KES ${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-primary" },
    { label: "Total Medicines", value: stats.totalDrugs, icon: Package, color: "text-slate-600" },
    { label: "Low Stock", value: stats.lowStockCount, icon: AlertTriangle, color: "text-red-600" },
    { label: "Sales Today", value: stats.totalSalesToday, icon: ShoppingCart, color: "text-blue-600" },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Pharmacy Dashboard
        </h1>
        <p className="text-muted-foreground text-base">Key insights into branch performance and stock levels.</p>
      </div>

      {/* Point of Sale Quick Access */}
      <Link 
        to="/seller/new-sale" 
        className="group relative flex items-center justify-between p-6 rounded-lg bg-primary/[0.03] border border-primary/20 hover:bg-primary/[0.05] transition-all overflow-hidden shadow-sm"
      >
        <div className="flex items-center gap-6 relative z-10">
          <div className="h-14 w-14 rounded-lg bg-primary flex items-center justify-center text-white shadow-md">
            <ShoppingCart className="h-7 w-7" />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-xl font-bold text-foreground">Point of Sale (POS)</h2>
            <p className="text-sm text-primary font-medium flex items-center gap-1.5">
               Open the transaction terminal <ArrowRight className="h-3.5 w-3.5" />
            </p>
          </div>
        </div>
        <div className="hidden md:flex h-10 px-6 items-center gap-2 rounded-md bg-primary text-white font-bold uppercase tracking-widest text-[10px] shadow-sm">
          New Sale
        </div>
      </Link>

      {/* Stat Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <div key={stat.label} className="premium-card group" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#A0A0FF]/40">{stat.label}</p>
                <div className="stat-value text-white group-hover:aurora-text transition-all duration-500">{stat.value}</div>
              </div>
              <div className={cn("p-4 rounded-2xl bg-white/5 border border-white/10 group-hover:border-primary/50 transition-all", stat.color)}>
                <stat.icon size={20} />
              </div>
            </div>
            {/* Subtle Aurora Glow on Hover */}
            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>

      {/* Alert Banners */}
      {(stats.expiredCount > 0 || stats.lowStockCount > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {stats.expiredCount > 0 && (
            <Link to="/admin/expiry" className="flex items-center gap-4 p-4 rounded-lg bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 hover:shadow-md transition-all group">
              <div className="h-10 w-10 rounded-md bg-red-100 dark:bg-red-500/10 flex items-center justify-center border border-red-200 dark:border-red-500/20">
                <CalendarDays className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-red-900 dark:text-red-400">{stats.expiredCount} Expired Medicine{stats.expiredCount > 1 ? "s" : ""}</p>
                <p className="text-[11px] text-red-700 dark:text-red-400/60">Remove items from shelves immediately.</p>
              </div>
              <ChevronRight className="h-4 w-4 text-red-400" />
            </Link>
          )}
          {stats.expiringCount > 0 && (
            <Link to="/admin/expiry" className="flex items-center gap-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 hover:shadow-md transition-all group">
              <div className="h-10 w-10 rounded-md bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center border border-amber-200 dark:border-amber-500/20">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-900 dark:text-amber-400">{stats.expiringCount} Item{stats.expiringCount > 1 ? "s" : ""} Expiring Soon</p>
                <p className="text-[11px] text-amber-700 dark:text-amber-400/60">Within 90 days — check shelf placement.</p>
              </div>
              <ChevronRight className="h-4 w-4 text-amber-400" />
            </Link>
          )}
        </div>
      )}

      {/* Financial Trends + Transactions */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-border p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">Financial Trends</h2>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase">
                 <div className="h-2 w-2 rounded-full bg-primary" /> Revenue
               </div>
               <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 uppercase">
                 <div className="h-2 w-2 rounded-full bg-red-500" /> Expense
               </div>
            </div>
          </div>
          
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#71717a", fontSize: 10, fontWeight: 'bold' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#71717a", fontSize: 10 }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ 
                    backgroundColor: "rgba(9, 9, 11, 0.95)", 
                    borderRadius: "16px", 
                    border: "1px solid rgba(255,255,255,0.1)",
                    backdropFilter: "blur(20px)",
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
                   }} 
                />
                <Bar 
                  dataKey="sales" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]} 
                  animationDuration={1500}
                />
                <Bar 
                  dataKey="expenses" 
                  fill="#ef4444" 
                  radius={[4, 4, 0, 0]} 
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 premium-card">
          <div className="flex items-center gap-2 mb-6">
            <ShoppingCart className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-bold">Recent Activity</h2>
          </div>
          
          <div className="space-y-4">
            {recentSales.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">No recent transactions</div>
            ) : recentSales.map((sale, i) => (
              <div key={sale.id} className="flex items-center justify-between p-3 rounded-xl bg-card dark:bg-white/5 border border-border dark:border-white/5 hover:border-border dark:border-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                    {sale.customer_name?.[0] || "W"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{sale.customer_name || "Walk-in Customer"}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{sale.payment_method}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground dark:text-white">KES {sale.total_amount.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock + Expiry Alerts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Low Stock Alert Panel */}
        <div className="premium-card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <h2 className="text-lg font-bold">Low Stock Alerts</h2>
            </div>
            <Link to="/admin/drugs" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-foreground dark:text-white transition-colors">
              View Catalog →
            </Link>
          </div>
          <div className="space-y-3">
            {lowStockDrugs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">All stock levels are healthy ✓</p>
            ) : lowStockDrugs.map(drug => (
              <div key={drug.id} className="flex items-center justify-between p-3 rounded-xl bg-card dark:bg-white/5 border border-border dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
                    <Pill className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground dark:text-white">{drug.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Threshold: {drug.reorder_level}</p>

                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-red-500 tabular-nums">{drug.stock}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{drug.unit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expiry Alert Panel */}
        <div className="premium-card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-amber-400" />
              <h2 className="text-lg font-bold">Expiry Alerts</h2>
            </div>
            <Link to="/admin/expiry" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-foreground dark:text-white transition-colors">
              Full Tracker →
            </Link>
          </div>
          <div className="space-y-3">
            {expiringDrugs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No expiring drugs in the next 90 days ✓</p>
            ) : expiringDrugs.map(drug => {
              const days = getDaysUntilExpiry(drug.expiry_date);
              const isExpired = days !== null && days <= 0;
              return (
                <div key={drug.id} className="flex items-center justify-between p-3 rounded-xl bg-card dark:bg-white/5 border border-border dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-10 w-10 flex items-center justify-center rounded-xl border",
                      isExpired ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-amber-400/10 text-amber-400 border-amber-400/20"
                    )}>
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground dark:text-white">{drug.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Expires: {drug.expiry_date ? new Date(drug.expiry_date).toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" }) : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                    isExpired ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-amber-400/10 text-amber-400 border-amber-400/20"
                  )}>
                    {isExpired ? `${Math.abs(days!)}d overdue` : `${days}d left`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
