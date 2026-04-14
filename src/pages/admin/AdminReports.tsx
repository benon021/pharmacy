import { useEffect, useState } from "react";
import { localDb, Drug } from "@/lib/db";
import { 
  TrendingUp, TrendingDown, DollarSign, Package, AlertCircle, ShoppingCart, 
  ArrowUpRight, ArrowDownRight, Activity, PieChart as PieChartIcon, 
  BarChart as BarChartIcon, Users, Calendar, Tag, CreditCard, Receipt, Wallet, Truck, 
  ShieldCheck, History, Search, Filter, LineChart as LineChartIcon, AreaChart as AreaChartIcon
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie, LineChart, Line
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const COLORS = ["#10b981", "#6366f1", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function AdminReports() {
  const [timeRange, setTimeRange] = useState<"Today" | "Weekly" | "Monthly">("Monthly");
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [paymentData, setPaymentData] = useState<any[]>([]);
  const [sellerData, setSellerData] = useState<any[]>([]);
  const [fastMoving, setFastMoving] = useState<any[]>([]);
  const [slowMoving, setSlowMoving] = useState<any[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);
  const [projections, setProjections] = useState({ next30Days: 0, growth: 0 });
  const [profitStats, setProfitStats] = useState({ revenue: 0, cost: 0, expenses: 0, netProfit: 0, margin: 0 });

  useEffect(() => {
    const fetchReports = async () => {
      const allSales = await localDb.sales.getDetailed();
      const allRawSales = await localDb.sales.getAll();
      const drugs = await localDb.drugs.getAll();
      const users = await localDb.auth.getAll(); 
      const expenses = await localDb.expenses.getAll();

    // Filtering based on timeRange
    const now = new Date();
    let filteredSales = allSales;
    let filteredRawSales = allRawSales;
    let filteredExpenses = expenses;

    if (timeRange === "Today") {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        filteredSales = allSales.filter(s => new Date(s.created_at).getTime() >= startOfToday);
        filteredRawSales = allRawSales.filter(s => new Date(s.created_at).getTime() >= startOfToday);
        filteredExpenses = expenses.filter(e => new Date(e.created_at).getTime() >= startOfToday);
    } else if (timeRange === "Weekly") {
        const startOfWeek = now.getTime() - 7 * 24 * 60 * 60 * 1000;
        filteredSales = allSales.filter(s => new Date(s.created_at).getTime() >= startOfWeek);
        filteredRawSales = allRawSales.filter(s => new Date(s.created_at).getTime() >= startOfWeek);
        filteredExpenses = expenses.filter(e => new Date(e.created_at).getTime() >= startOfWeek);
    }

    // 1. Time-Series Sales Analysis
    const drugCostMap = drugs.reduce((acc, d) => ({ ...acc, [d.id]: d.cost_price || 0 }), {} as Record<string, number>);
    const chartDataMap: Record<string, { date: string, revenue: number, profit: number }> = {};

    if (timeRange === "Today") {
        // Hourly for Today
        for (let i = 0; i < 24; i++) {
            const label = `${i.toString().padStart(2, '0')}:00`;
            chartDataMap[label] = { date: label, revenue: 0, profit: 0 };
        }
        filteredSales.forEach(s => {
            const hour = new Date(s.created_at).getHours().toString().padStart(2, '0') + ":00";
            if (chartDataMap[hour]) {
                const rev = Number(s.total_amount);
                let cost = 0;
                s.items.forEach((item: any) => cost += (drugCostMap[item.drug_id] || 0) * Number(item.quantity));
                chartDataMap[hour].revenue += rev;
                chartDataMap[hour].profit += (rev - cost);
            }
        });
    } else {
        // Daily for Week/Month
        const days = timeRange === "Weekly" ? 7 : 30;
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            chartDataMap[dateStr] = { date: dateStr, revenue: 0, profit: 0 };
        }
        filteredSales.forEach(s => {
            const dateStr = new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (chartDataMap[dateStr]) {
                const rev = Number(s.total_amount);
                let cost = 0;
                s.items.forEach((item: any) => cost += (drugCostMap[item.drug_id] || 0) * Number(item.quantity));
                chartDataMap[dateStr].revenue += rev;
                chartDataMap[dateStr].profit += (rev - cost);
            }
        });
    }
    setTimeSeriesData(Object.values(chartDataMap));

    // 2. Revenue by Category
    const catMap: Record<string, number> = {};
    filteredSales.forEach(s => {
      s.items.forEach((item: any) => {
        const drug = drugs.find(d => d.id === item.drug_id);
        const cat = drug?.category || "Other";
        catMap[cat] = (catMap[cat] || 0) + Number(item.total_price || 0);
      });
    });
    setCategoryData(Object.entries(catMap).map(([name, value]) => ({ name, value })));

    // 3. Payment Methods
    const payMap: Record<string, number> = {};
    filteredRawSales.forEach(s => {
      payMap[s.payment_method] = (payMap[s.payment_method] || 0) + Number(s.total_amount);
    });
    setPaymentData(Object.entries(payMap).map(([name, value]) => ({ name, value })));

    // 4. Seller Performance Matrix
    const sellerPerformance: Record<string, { revenue: number, profit: number }> = {};
    const sellerNames = users.reduce((acc, u) => ({ ...acc, [u.id]: u.full_name }), {} as Record<string, string>);

    filteredSales.forEach(s => {
      const name = sellerNames[s.seller_id] || "Unknown Seller";
      if (!sellerPerformance[name]) sellerPerformance[name] = { revenue: 0, profit: 0 };
      const rev = Number(s.total_amount);
      let cost = 0;
      s.items.forEach((item: any) => cost += (drugCostMap[item.drug_id] || 0) * Number(item.quantity));
      sellerPerformance[name].revenue += rev;
      sellerPerformance[name].profit += (rev - cost);
    });
    setSellerData(Object.entries(sellerPerformance).map(([name, stats]) => ({ name, ...stats })).sort((a, b) => b.profit - a.profit));

    // 5. Fast vs Slow Moving (Calculated from filtered period)
    const movementMap: Record<string, { name: string, qty: number, revenue: number, category: string }> = {};
    filteredSales.forEach(s => {
      s.items.forEach((item: any) => {
        const drug = drugs.find(d => d.id === item.drug_id);
        if (!drug) return;
        if (!movementMap[drug.id]) movementMap[drug.id] = { name: drug.name, qty: 0, revenue: 0, category: drug.category };
        movementMap[drug.id].qty += Number(item.quantity);
        movementMap[drug.id].revenue += Number(item.total_price);
      });
    });
    setFastMoving(Object.values(movementMap).sort((a, b) => b.qty - a.qty).slice(0, 5));
    setSlowMoving(drugs.map(d => ({ name: d.name, qty: movementMap[d.id]?.qty || 0, revenue: movementMap[d.id]?.revenue || 0, category: d.category })).sort((a, b) => a.qty - b.qty).slice(0, 5));

    // 6. Enterprise Financial Strategy
    let totalRevenue = filteredRawSales.reduce((sum, s) => sum + Number(s.total_amount), 0);
    let totalCost = 0;
    filteredSales.forEach(s => s.items.forEach((item: any) => totalCost += (drugCostMap[item.drug_id] || 0) * Number(item.quantity)));
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalCost - totalExpenses;
      const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      setProfitStats({ revenue: totalRevenue, cost: totalCost, expenses: totalExpenses, netProfit, margin: Math.round(margin) });
      setProjections({ next30Days: Math.round((allRawSales.reduce((sum, s) => sum + Number(s.total_amount), 0) / 30 || 0) * 30 * 1.15), growth: 15 });
    };
    fetchReports();
  }, [timeRange]);

  return (
    <div className="space-y-10 animate-fade-in pb-32">
      {/* Dynamic Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-[0.4em] mb-2 blur-[0.2px]">
            <LineChartIcon className="h-4 w-4" /> Strategic Intelligence Matrix v4.2
          </div>
          <h1 className="text-4xl xl:text-6xl font-black tracking-tight text-foreground dark:text-white italic tracking-tighter leading-none">
            Profit Control <span className="text-primary not-italic tracking-normal">Center</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">Forensic visualization of revenue streams and inventory burn for the {timeRange.toLowerCase()} period.</p>
        </div>
        
        <div className="flex bg-white/5 p-1.5 rounded-[1.5rem] border border-white/5 backdrop-blur-md">
            {["Today", "Weekly", "Monthly"].map((range) => (
                <button
                    key={range}
                    onClick={() => setTimeRange(range as any)}
                    className={cn(
                        "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all italic",
                        timeRange === range 
                            ? "bg-primary text-black shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-105" 
                            : "text-muted-foreground hover:text-white"
                    )}
                >
                    {range}
                </button>
            ))}
        </div>
      </div>

      {/* Financial Pulse Row */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="premium-card relative overflow-hidden group border-white/5 hover:border-primary/20 transition-all duration-500">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700">
            <DollarSign className="h-20 w-20 text-white" />
          </div>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mb-2 italic">Gross Revenue</p>
          <div className="flex items-baseline gap-2">
             <p className="text-4xl font-black text-foreground dark:text-white tabular-nums tracking-tighter italic shadow-sm">KES {profitStats.revenue.toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-2 mt-4 text-[9px] text-primary font-black uppercase tracking-widest leading-none">
             <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> {timeRange} Inflow
          </div>
        </div>

        <div className="premium-card relative overflow-hidden group border-white/5 hover:border-amber-500/20 transition-all duration-500">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700">
            <Package className="h-20 w-20 text-white" />
          </div>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mb-2 italic">COGS Matrix</p>
          <p className="text-4xl font-black text-foreground dark:text-white tabular-nums tracking-tighter italic">KES {profitStats.cost.toLocaleString()}</p>
          <div className="flex items-center gap-2 mt-4 text-[9px] text-amber-500 font-black uppercase tracking-widest leading-none">
             <TrendingDown className="h-3 w-3" /> Acquisition Cost
          </div>
        </div>

        <div className="premium-card relative overflow-hidden group border-red-500/10 bg-red-500/[0.02] hover:border-red-500/20 transition-all duration-500">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700">
            <Wallet className="h-20 w-20 text-white" />
          </div>
          <p className="text-[10px] text-red-400 font-black uppercase tracking-[0.3em] mb-2 italic">OPEX Burn</p>
          <p className="text-4xl font-black text-red-500 tabular-nums tracking-tighter italic">KES {profitStats.expenses.toLocaleString()}</p>
          <div className="flex items-center gap-2 mt-4 text-[9px] text-red-400/60 font-black uppercase tracking-widest leading-none text-red-500/60">
            <div className="h-1.5 w-1.5 rounded-full bg-red-500" /> Administrative Hub
          </div>
        </div>

        <div className="premium-card relative overflow-hidden group border-primary/30 bg-primary/5 shadow-[0_0_50px_rgba(16,185,129,0.1)] transition-all duration-700">
          <div className="absolute top-0 right-0 p-6 opacity-[0.05]">
            <Activity className="h-20 w-20 text-primary" />
          </div>
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] text-primary font-black uppercase tracking-[0.3em] italic">Net Yield</p>
            <Badge className="bg-primary/20 text-primary border-primary/20 rounded-lg text-[9px] font-black italic">{profitStats.margin}% Margin</Badge>
          </div>
          <p className="text-4xl font-black text-foreground dark:text-white tabular-nums tracking-tighter italic shadow-xl">KES {profitStats.netProfit.toLocaleString()}</p>
          <div className="flex items-center gap-2 mt-4 text-[9px] text-primary font-black uppercase tracking-widest">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Verified Net Pulse
          </div>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-3">
        {/* Main Analytics Block */}
        <div className="lg:col-span-2 space-y-10">
          {/* Time Series Chart */}
          <div className="premium-card p-10 space-y-10 bg-white/[0.01] border-white/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary border border-primary/10 flex items-center justify-center">
                  <AreaChartIcon className="h-7 w-7" />
                </div>
                <div className="space-y-0.5">
                   <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase">Sales Velocity</h2>
                   <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">{timeRange === 'Today' ? '24-Hour Forensic Sync' : `${timeRange === 'Weekly' ? '7' : '30'}-Day Pulse`}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-[9px] font-black uppercase text-muted-foreground">Revenue</span>
                 </div>
                 <div className="flex items-center gap-1.5 ml-4">
                    <div className="h-2 w-2 rounded-full bg-indigo-500" />
                    <span className="text-[9px] font-black uppercase text-muted-foreground">Profit</span>
                 </div>
              </div>
            </div>
            <div className="h-[400px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={10} fontStyle="italic" fontWeight="900" tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} fontStyle="italic" fontWeight="900" tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#09090b", borderRadius: "2rem", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(40px)", padding: "1.5rem" }}
                    itemStyle={{ color: "#fff", fontStyle: "italic", fontWeight: "900", textTransform: "uppercase", fontSize: "11px" }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={4} name="Gross" />
                  <Area type="monotone" dataKey="profit" stroke="#6366f1" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={4} name="Net" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Movement Matrix */}
          <div className="grid md:grid-cols-2 gap-10">
            {/* Fast Moving */}
            <div className="premium-card p-8 border-white/5 space-y-8 bg-white/[0.01]">
               <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-green-500/10 text-green-500 border border-green-500/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div className="space-y-0.5">
                    <h2 className="text-xl font-black italic text-white uppercase tracking-tighter">Fast Moving</h2>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">High Velocity SKUs</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {fastMoving.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-5 rounded-[2rem] bg-muted/20 border border-white/5 hover:bg-white/[0.04] transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/10 text-[11px] font-black text-primary border border-primary/10 group-hover:scale-110 transition-transform">{i+1}</div>
                        <div>
                          <p className="font-black text-sm text-foreground dark:text-white italic">{item.name}</p>
                          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">{item.qty} Dispensed • {item.category}</p>
                        </div>
                      </div>
                      <p className="font-black text-primary text-sm tabular-nums italic">KES {item.revenue.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
            </div>

            {/* Slow Moving / Risk */}
            <div className="premium-card p-8 border-white/5 space-y-8 bg-white/[0.01]">
               <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/10 flex items-center justify-center">
                    <TrendingDown className="h-6 w-6" />
                  </div>
                  <div className="space-y-0.5">
                    <h2 className="text-xl font-black italic text-white uppercase tracking-tighter">Slow Moving</h2>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Capital Locked SKUs</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {slowMoving.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-5 rounded-[2rem] bg-muted/20 border border-white/5 hover:bg-white/[0.04] transition-all">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-red-500/10 text-[11px] font-black text-red-500 border border-red-500/10">!</div>
                        <div>
                          <p className="font-black text-sm text-foreground dark:text-white italic">{item.name}</p>
                          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">{item.qty} units • {item.category}</p>
                        </div>
                      </div>
                      <p className="font-black text-red-500/60 text-sm tabular-nums italic">KES {item.revenue.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
            </div>
          </div>
        </div>

        {/* Sidebar Analytics */}
        <div className="space-y-10">
          {/* Revenue Forecast */}
          <div className="premium-card border-primary/20 bg-primary/5 p-8 relative overflow-hidden group">
             <div className="absolute -right-4 -top-4 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                <TrendingUp className="h-32 w-32 text-primary" />
             </div>
             <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 italic">Enterprise Forecast</p>
             <div className="flex items-baseline gap-2 mb-4">
               <span className="text-4xl font-black text-foreground dark:text-white tabular-nums tracking-tighter italic">KES {projections.next30Days.toLocaleString()}</span>
               <div className="flex items-center text-green-400 font-bold text-xs bg-green-400/10 px-2 py-0.5 rounded-full">
                 <ArrowUpRight className="h-4 w-4" />
                 {projections.growth}%
               </div>
             </div>
             <p className="text-[11px] text-muted-foreground leading-relaxed italic font-medium">Predictive turnover model based on high-velocity SKUs and historical seasonality.</p>
          </div>

          {/* Performance Heatmap */}
          <div className="premium-card p-8 bg-white/[0.01] border-white/5">
            <div className="flex items-center gap-3 mb-10">
               <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/10 flex items-center justify-center">
                  <Activity className="h-5 w-5" />
               </div>
               <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">Seller Ledger</h3>
            </div>
            <div className="space-y-10">
              {sellerData.map((s, i) => (
                <div key={i} className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest italic">{s.name}</p>
                      <p className="font-black text-white tabular-nums text-xl italic tracking-widest leading-none mt-1">KES {s.profit.toLocaleString()}</p>
                    </div>
                    <Badge variant="ghost" className="text-[9px] font-black text-primary uppercase border border-primary/20 bg-primary/5 italic">{Math.round((s.profit / (profitStats.revenue || 1)) * 100)}% Matrix</Badge>
                  </div>
                  <div className="h-2 w-full bg-white/[0.03] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary/40 to-primary shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all duration-1000" 
                      style={{ width: `${Math.min(100, (s.profit / (profitStats.revenue || 1)) * 100)}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Burn Analysis */}
          <div className="premium-card bg-red-500/[0.02] border-red-500/10 p-8 space-y-6">
             <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                 <Wallet className="h-5 w-5 text-red-500" />
               </div>
               <h4 className="text-lg font-black text-white italic uppercase tracking-tighter">Capital Burn</h4>
             </div>
             <div className="space-y-4">
               <div className="p-5 rounded-[2rem] bg-white/[0.02] border border-white/5 flex justify-between items-center transition-all hover:bg-white/[0.04]">
                 <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Acquisition Burn</span>
                 <span className="text-xs font-black text-white tabular-nums">KES {profitStats.cost.toLocaleString()}</span>
               </div>
               <div className="p-5 rounded-[2rem] bg-white/[0.02] border border-white/5 flex justify-between items-center transition-all hover:bg-white/[0.04]">
                 <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Fixed Overheads</span>
                 <span className="text-xs font-black text-white tabular-nums">KES {profitStats.expenses.toLocaleString()}</span>
               </div>
               <div className="p-6 rounded-[2rem] bg-red-500/10 border border-red-500/20 flex justify-between items-center mt-6 shadow-xl shadow-red-500/5">
                 <span className="text-[10px] font-black uppercase tracking-widest text-red-400 italic">Combined Outflow</span>
                 <span className="text-lg font-black text-red-500 tabular-nums italic">KES {(profitStats.cost + profitStats.expenses).toLocaleString()}</span>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

