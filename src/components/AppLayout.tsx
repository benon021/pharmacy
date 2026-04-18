import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { localDb, Notification, User } from "@/lib/db";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Pill, ShoppingCart, Users, BarChart3,
  LogOut, Menu, X, ChevronRight, Activity, Bell, Search, CalendarDays,
  Truck, Wallet, ShieldCheck, History, Settings, UserCircle, ChevronLeft, Sun, Moon, Package,
  Clock, Megaphone, LifeBuoy, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useTenant } from "@/contexts/TenantContext";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

const adminNavigation = [
  {
    heading: "Operations",
    links: [
      { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/admin/sales", icon: ShoppingCart, label: "Sales History" },
      { to: "/seller/new-sale", icon: Zap, label: "POS Terminal" },
    ]
  },
  {
    heading: "Inventory",
    links: [
      { to: "/admin/drugs", icon: Pill, label: "Drug Catalog" },
      { to: "/admin/expiry", icon: CalendarDays, label: "Expiry Alerts" },
      { to: "/admin/suppliers", icon: Truck, label: "Suppliers" },
    ]
  },
  {
    heading: "Staff & Accounting",
    links: [
      { to: "/admin/sellers", icon: Users, label: "Employees" },
      { to: "/admin/attendance", icon: Clock, label: "Attendance" },
      { to: "/admin/loyalty", icon: Zap, label: "Customer Loyalty" },
      { to: "/admin/expenses", icon: Wallet, label: "Expenses" },
      { to: "/admin/audit", icon: ShieldCheck, label: "Audit Logs" },
    ]
  },
  {
    heading: "Settings",
    links: [
      { to: "/support", icon: LifeBuoy, label: "Support Center" },
      { to: "/admin/settings", icon: Settings, label: "Store Settings" },
    ]
  }
];

const sellerNavigation = [
  {
    heading: "Terminal",
    links: [
      { to: "/seller", icon: LayoutDashboard, label: "Overview" },
      { to: "/seller/new-sale", icon: Zap, label: "Launch POS" },
      { to: "/seller/history", icon: History, label: "My Shift Ledger" },
    ]
  },
  {
    heading: "Reference",
    links: [
      { to: "/seller/catalog", icon: Pill, label: "Medication Registry" },
    ]
  },
  {
    heading: "Support",
    links: [
      { to: "/support", icon: LifeBuoy, label: "Help Desk" },
      { to: "/seller/settings", icon: Settings, label: "Profile Settings" },
    ]
  }
];

const superAdminNavigation = [
  {
    heading: "Platform Administration",
    links: [
      { to: "/super-admin", icon: ShieldCheck, label: "Platform Overview" },
      { to: "/super-admin/pharmacies", icon: LayoutDashboard, label: "Pharmacy Branches" },
      { to: "/super-admin/onboard", icon: Zap, label: "Add Pharmacy" },
      { to: "/super-admin/billing", icon: Wallet, label: "Billing & Subscriptions" },
    ]
  },
  {
    heading: "Global Monitoring",
    links: [
      { to: "/admin/audit", icon: ShieldCheck, label: "Global Audit Logs" },
      { to: "/support", icon: LifeBuoy, label: "Partner Support" },
      { to: "/super-admin/pulse", icon: Activity, label: "System Status" },
      { to: "/seller/settings", icon: Settings, label: "Personal Settings" },
    ]
  }
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { role, signOut, user } = useAuth();
  const { activePharmacyName, isImpersonating, clearActivePharmacy } = useTenant();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    return saved === "true";
  });
  
  const [isClocking, setIsClocking] = useState(false);

  // 1. Activate Global Real-Time Sync
  useRealtimeSync();

  const { data: notifications = [], refetch: refetchNotifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => localDb.notifications.getAll(),
    staleTime: 60000,
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const { data: currentAttendance, refetch: refetchAttendance } = useQuery({
    queryKey: ["current-attendance", user?.id],
    queryFn: () => user ? localDb.attendance.getCurrent(user.id) : null,
    enabled: !!user
  });

  const navigation = role === "super_admin" 
    ? superAdminNavigation 
    : role === "admin" 
      ? adminNavigation 
      : sellerNavigation;

  const handleClockAction = async () => {
    if (!user) return;
    setIsClocking(true);
    try {
      if (currentAttendance) {
        await localDb.attendance.clockOut(currentAttendance.id);
        toast.success("Successfully clocked out.");
      } else {
        await localDb.attendance.clockIn(user.id);
        toast.success("Successfully clocked in.");
      }
      refetchAttendance();
    } catch (err) {
      toast.error("Temporal synchronization failed.");
    } finally {
      setIsClocking(false);
    }
  };

  const checkSystem = async () => {
    if (!user || role === 'super_admin') return;
    const drugs = await localDb.drugs.getAll();
    const unread = await localDb.notifications.getUnread();
    
    for (const d of drugs) {
      if (d.stock <= (d.reorder_level || 10)) {
        const title = `Low Stock: ${d.name}`;
        if (!unread.find(n => n.title === title)) {
          await localDb.notifications.create({
            title,
            message: `${d.name} is down to ${d.stock} ${d.unit}. Consider restocking.`,
            type: "low_stock"
          });
        }
      }

      if (d.expiry_date) {
        const daysLeft = Math.ceil((new Date(d.expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
        if (daysLeft > 0 && daysLeft < 30) {
          const title = `Expiry Warning: ${d.name}`;
          if (!unread.find(n => n.title === title)) {
            await localDb.notifications.create({
              title,
              message: `${d.name} expires in ${daysLeft} days (${d.expiry_date}).`,
              type: "expiry"
            });
          }
        }
      }
    }

    await refetchNotifications();
  };

  useEffect(() => {
    checkSystem();
    const handleResize = () => {
      if (window.innerWidth < 1024) setIsCollapsed(true);
    };
    handleResize(); 
    window.addEventListener("resize", handleResize);
    const interval = setInterval(checkSystem, 60000); 
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", handleResize);
    };
  }, [user]);

  useEffect(() => {
    localStorage.setItem("sidebar_collapsed", String(isCollapsed));
  }, [isCollapsed]);

  const markRead = async () => {
    await localDb.notifications.markAllRead();
    await refetchNotifications();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    toast.success("Logged out successfully.");
  };

  return (
    <div className="flex min-h-screen bg-background transition-colors duration-500">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md md:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0B0E14] border-r border-border dark:border-white/5 transition-all duration-300 md:h-screen md:sticky md:top-0 md:translate-x-0 overflow-y-auto custom-scrollbar overflow-x-hidden",
          sidebarOpen ? "translate-x-0 w-[280px]" : "-translate-x-full w-[280px]",
          !isCollapsed ? "md:w-[280px]" : "md:w-[90px]"
        )}
      >
        <div className={cn("flex items-center gap-3 py-10 px-6", isCollapsed && "md:px-0 md:justify-center transition-all")}>
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 flex flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-orange-600 text-black shadow-lg shadow-primary/20 hover:scale-110 transition-transform duration-500">
              <Zap className="h-6 w-6 font-black" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col animate-in slide-in-from-left-2 duration-700">
                <span className="font-black text-xl tracking-tighter text-white italic uppercase leading-none">
                  Lumiaxy
                </span>
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mt-0.5 ml-0.5">
                  Enterprise
                </span>
              </div>
            )}
          </Link>
          <button className="ml-auto md:hidden text-white/50 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Global Support Broadcast (Super Admin only label) */}
        {!isCollapsed && role === 'super_admin' && (
          <div className="mx-6 mb-4 p-4 rounded-2xl bg-primary/5 border border-primary/10 animate-pulse">
            <div className="flex items-center gap-2 text-[9px] font-black text-primary uppercase tracking-widest mb-1 text-white!">
              <Activity size={10} /> System Status: Online
            </div>
          </div>
        )}

        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute top-12 -right-3 h-6 w-6 rounded-full bg-white/10 border border-white/10 text-white items-center justify-center backdrop-blur-md hover:bg-primary hover:text-black transition-all z-[60] shadow-xl"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        <nav className="flex-1 space-y-8 overflow-y-auto p-4 custom-scrollbar mt-4 text-white!">
          {navigation.map((group, groupIdx) => (
            <div key={groupIdx} className="flex flex-col gap-1.5">
              {!isCollapsed && (
                <h3 className="px-4 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-2 italic">
                  {group.heading}
                </h3>
              )}
              {group.links.map((link) => {
                const Icon = link.icon;
                const { to, label } = link;
                const isActive = location.pathname === to || (to !== "/admin" && to !== "/seller" && location.pathname.startsWith(to));

                return (
                  <Link
                    key={to}
                    to={to}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-4 py-3.5 text-xs font-bold transition-all duration-300",
                      isActive
                        ? "bg-primary text-black shadow-[0_8px_30px_rgba(var(--primary-rgb),0.3)] scale-[1.02]"
                        : "text-muted-foreground hover:text-white hover:bg-white/5",
                      isCollapsed && "px-0 justify-center h-12 w-12 mx-auto"
                    )}
                  >
                    <Icon className={cn("h-5 w-5 transition-all flex-shrink-0", isActive && "text-black")} />
                    {!isCollapsed && <span className="flex-1">{label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Temporal Management (Attendance) */}
        {role !== 'super_admin' && (
           <div className={cn("px-4 mb-4", isCollapsed && "px-2")}>
              <Button 
                onClick={handleClockAction}
                disabled={isClocking}
                variant={currentAttendance ? "outline" : "default"}
                className={cn(
                  "w-full h-12 rounded-xl transition-all gap-2 text-[10px] font-black uppercase tracking-widest",
                  currentAttendance ? "border-primary/20 text-primary hover:bg-primary hover:text-black" : "bg-primary text-black shadow-lg",
                  isCollapsed && "p-0 h-10 w-10 mx-auto overflow-hidden text-[0px]"
                )}
              >
                {isClocking ? <Clock className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                {!isCollapsed && (currentAttendance ? "Clock Out" : "Clock In")}
              </Button>
           </div>
        )}

        <div className={cn("mt-auto p-4 m-4 rounded-2xl bg-white/[0.03] border border-white/5 transition-all", isCollapsed && "m-0 rounded-none bg-transparent border-none p-2")}>
          <div className={cn("flex items-center gap-3 mb-4", isCollapsed && "justify-center mb-2")}>
            <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-white/10 text-xs font-black text-primary uppercase overflow-hidden shadow-inner">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                user?.full_name?.split(" ").map(n => n[0]).join("") || "E"
              )}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-white truncate italic uppercase tracking-tighter">
                  {user?.full_name || "Enterprise User"}
                </p>
                <p className="text-[10px] text-primary/60 truncate font-black uppercase tracking-[0.2em]">{role}</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className={cn(
              "w-full justify-start rounded-xl text-muted-foreground hover:text-white hover:bg-red-500/10 transition-all duration-300 text-[9px] font-black uppercase tracking-widest",
              isCollapsed && "justify-center px-0 w-10 mx-auto"
            )}
          >
            <LogOut className={cn("h-3.5 w-3.5", !isCollapsed && "mr-2")} />
            {!isCollapsed && "Logout"}
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-background">
        {isImpersonating && (
          <div className="bg-primary/20 border-b border-primary/20 py-2.5 px-6 flex items-center justify-between animate-in slide-in-from-top duration-700 backdrop-blur-md">
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-white!">
              <ShieldCheck className="h-4 w-4 text-primary animate-pulse" />
              Viewing Pharmacy Details: <span className="text-primary italic ml-1 underline">{activePharmacyName}</span>
            </div>
            <Button 
              size="sm" 
              onClick={() => {
                clearActivePharmacy();
                navigate("/super-admin");
              }}
              className="h-8 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest bg-primary text-black hover:scale-105 transition-all shadow-xl shadow-primary/20"
            >
              Terminate Branch View
            </Button>
          </div>
        )}
        <header className="h-24 flex-shrink-0 flex items-center justify-between px-8 bg-card/40 backdrop-blur-3xl border-b border-white/5">
          <div className="flex items-center gap-6">
            <button className="md:hidden p-3 rounded-xl bg-white/5" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5 text-white" />
            </button>
            <div className="hidden md:flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/[0.02] border border-white/5 text-muted-foreground focus-within:border-primary/40 transition-all group">
              <Search className="h-4 w-4 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search system..." 
                className="bg-transparent border-none outline-none text-[10px] font-black tracking-widest w-64 focus:w-96 transition-all duration-500 placeholder:text-muted-foreground/20"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
                <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors hover:bg-primary/5"
                >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
                <Popover>
                <PopoverTrigger asChild>
                    <button className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors relative hover:bg-primary/5">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary animate-pulse" />
                    )}
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-96 p-0 bg-[#0B0E14] border-white/10 rounded-[2rem] shadow-3xl overflow-hidden mt-2" align="end">
                    <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest text-white italic">Notifications</h3>
                    {unreadCount > 0 && (
                        <button onClick={markRead} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">
                        Mark all as read
                        </button>
                    )}
                    </div>
                    <div className="max-h-[400px] overflow-y-auto py-2 custom-scrollbar">
                    {notifications.length === 0 ? (
                        <div className="py-20 text-center text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] italic opacity-20">
                        No messages
                        </div>
                    ) : notifications.map(n => (
                        <div key={n.id} className={cn("px-6 py-5 border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors", !n.read && "bg-primary/5")}>
                        <p className="text-xs font-black text-white italic uppercase flex items-center gap-2 mb-1">
                            <span className={cn("h-2 w-2 rounded-full", n.type === "low_stock" ? "bg-red-500" : n.type === "expiry" ? "bg-amber-500" : "bg-primary")} />
                            {n.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-medium leading-relaxed italic">{n.message}</p>
                        <p className="text-[9px] text-primary/30 mt-3 font-black uppercase tracking-widest">{new Date(n.created_at).toLocaleString()}</p>
                        </div>
                    ))}
                    </div>
                </PopoverContent>
                </Popover>
            </div>
            
            <div className="h-10 w-px bg-white/10 hidden sm:block" />
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-white italic uppercase tracking-tighter">{user?.full_name || "Enterprise User"}</p>
                <p className="text-[10px] text-primary/60 font-black uppercase tracking-[0.2em]">{role}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-primary to-orange-600 p-[1.5px] shadow-lg shadow-primary/10">
                <div className="h-full w-full rounded-[11px] bg-[#0B0E14] flex items-center justify-center font-black text-xs text-primary overflow-hidden">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    user?.full_name?.[0] || "E"
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth bg-gradient-to-b from-[#0a0a0c] to-background">
          <div className="max-w-[1600px] mx-auto p-8 md:p-12 lg:p-16">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
