import { useEffect, useState } from "react";
import { localDb, Sale, Drug, Expense } from "@/lib/db";
import { Link } from "react-router-dom";
import { Package, ShoppingCart, Users, AlertTriangle, TrendingUp, DollarSign, Activity, CalendarDays, ChevronRight, Pill, ArrowRight, BarChart3, Wallet } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { cn } from "@/lib/utils";

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
  const [stats, setStats] = useState<Stats>({
    totalDrugs: 0, lowStockCount: 0, totalSalesToday: 0, totalRevenue: 0, totalSellers: 0, expiringCount: 0, expiredCount: 0
  });
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [inventoryChart, setInventoryChart] = useState<any[]>([]);
  const [lowStockDrugs, setLowStockDrugs] = useState<Drug[]>([]);
  const [expiringDrugs, setExpiringDrugs] = useState<Drug[]>([]);

  useEffect(() => {
    const fetchStats = () => {
      const today = new Date().toISOString().split("T")[0];
      const drugs = localDb.drugs.getAll();
      const sales = localDb.sales.getAll();
      const users = localDb.auth.getAll();
      const expenses = localDb.expenses.getAll();
      
      const todaySales = sales.filter(s => s.created_at.startsWith(today));
      const lowStock = drugs.filter(d => d.is_active && d.stock <= d.low_stock_threshold);
      const expiring = drugs.filter(d => {
        const days = getDaysUntilExpiry(d.expiry_date);
        return d.is_active && days !== null && days <= 90;
      });
      const expired = drugs.filter(d => {
        const days = getDaysUntilExpiry(d.expiry_date);
        return d.is_active && days !== null && days <= 0;
      });

      setStats({
        totalDrugs: drugs.filter(d => d.is_active).length,
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

      setRecentSales(localDb.sales.getRecent(5));

      const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split("T")[0];
      });

      const chartD = last7.map(day => ({
        day: day.slice(8), // Just the DD
        sales: sales.filter(s => s.created_at.startsWith(day)).reduce((sum, s) => sum + Number(s.total_amount), 0),
        expenses: expenses.filter(e => e.created_at.startsWith(day)).reduce((sum, e) => sum + Number(e.amount), 0),
      }));
      setChartData(chartD);

      setInventoryChart([
        { name: 'Healthy', value: drugs.filter(d => d.stock > (d.low_stock_threshold || 10)).length },
        { name: 'Low', value: lowStock.length },
        { name: 'Expired', value: expired.length },
      ]);
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: "Revenue", value: `KES ${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-primary", glow: "glow-primary" },
    { label: "Total Drugs", value: stats.totalDrugs, icon: Package, color: "text-accent", glow: "glow-accent" },
    { label: "Low Stock", value: stats.lowStockCount, icon: AlertTriangle, color: "text-destructive", glow: "" },
    { label: "Sales Today", value: stats.totalSalesToday, icon: ShoppingCart, color: "text-blue-400", glow: "" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-primary font-semibold text-sm">
          <Activity className="h-4 w-4" />
          System Live
        </div>
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">
          Admin Control Center
        </h1>
        <p className="text-muted-foreground">Monitoring pharmacy performance across all sectors</p>
      </div>

      {/* POS Quick Access */}
      <Link 
        to="/seller/new-sale" 
        className="group relative flex items-center justify-between p-8 rounded-[2.5rem] bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-all overflow-hidden shadow-2xl shadow-primary/5"
      >
        <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:scale-[1.6] group-hover:rotate-6 transition-all duration-700">
           <ShoppingCart className="h-48 w-48 text-primary" />
        </div>
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="h-20 w-20 rounded-3xl bg-primary flex items-center justify-center glow-primary shadow-xl shadow-primary/20">
            <ShoppingCart className="h-10 w-10 text-primary-foreground font-black" />
          </div>
          <div className="text-center md:text-left space-y-1">
            <h2 className="text-3xl font-black text-foreground dark:text-white italic tracking-tighter">Retail POS Terminal</h2>
            <p className="text-sm font-bold text-primary uppercase tracking-widest flex items-center gap-2 justify-center md:justify-start">
               Launch Cashier Command Center <ArrowRight className="h-4 w-4" />
            </p>
          </div>
        </div>
        <div className="hidden md:flex h-14 px-8 items-center gap-3 rounded-2xl bg-primary text-black font-black uppercase tracking-[0.2em] text-[10px] group-hover:gap-5 transition-all">
          Open Now <ArrowRight className="h-4 w-4" />
        </div>
      </Link>

      {/* Stat Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <div key={stat.label} className="premium-card group" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                <p className={`stat-value ${stat.color} ${stat.glow}`}>{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl bg-card dark:bg-white/5 border border-border dark:border-white/10 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alert Banners */}
      {(stats.expiredCount > 0 || stats.lowStockCount > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {stats.expiredCount > 0 && (
            <Link to="/admin/expiry" className="flex items-center gap-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 transition-all group">
              <div className="h-12 w-12 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/30">
                <CalendarDays className="h-6 w-6 text-red-500" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-red-400">{stats.expiredCount} Expired Medicine{stats.expiredCount > 1 ? "s" : ""}</p>
                <p className="text-xs text-red-400/60">Remove from shelves immediately — PPB compliance required</p>
              </div>
              <ChevronRight className="h-5 w-5 text-red-500/40 group-hover:text-red-500 transition-colors" />
            </Link>
          )}
          {stats.expiringCount > 0 && (
            <Link to="/admin/expiry" className="flex items-center gap-4 p-4 rounded-2xl bg-amber-400/10 border border-amber-400/20 hover:bg-amber-400/15 transition-all group">
              <div className="h-12 w-12 rounded-xl bg-amber-400/20 flex items-center justify-center border border-amber-400/30">
                <AlertTriangle className="h-6 w-6 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-amber-300">{stats.expiringCount} Drug{stats.expiringCount > 1 ? "s" : ""} Expiring Soon</p>
                <p className="text-xs text-amber-400/60">Within 90 days — review shelf placement</p>
              </div>
              <ChevronRight className="h-5 w-5 text-amber-400/40 group-hover:text-amber-400 transition-colors" />
            </Link>
          )}
        </div>
      )}

      {/* Revenue Chart + Recent Sales */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 premium-card border-border dark:border-white/5!">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold italic tracking-tighter">Profitability Forensics</h2>
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
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Threshold: {drug.low_stock_threshold}</p>
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
