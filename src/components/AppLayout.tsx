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
  Clock, Megaphone, LifeBuoy, Zap, MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTenant } from "@/contexts/TenantContext";
import { useTheme } from "@/contexts/ThemeContext";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useLocation as useLocationRouter } from "react-router-dom";

const adminNavigation = [
  {
    heading: "Operations",
    links: [
      { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/research", icon: BarChart3, label: "Drug Intelligence" },
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
      { to: "/messaging", icon: MessageSquare, label: "Staff Communication" },
      { to: "/admin/settings", icon: Settings, label: "Store Settings" },
    ]
  }
];

const sellerNavigation = [
  {
    heading: "Terminal",
    links: [
      { to: "/seller", icon: LayoutDashboard, label: "Overview" },
      { to: "/research", icon: BarChart3, label: "Drug Research" },
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
      { to: "/messaging", icon: MessageSquare, label: "Staff Communication" },
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
    toast.success("Identity session terminated.");
  };

  const sphereLogo = "/iridescent_sphere_logo_total_1776509962585.png";

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/20 overflow-hidden transition-colors duration-500">
      {/* Aniq-Style Spatial Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-primary/10 rounded-full blur-[160px] opacity-40 mix-blend-plus-lighter" 
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            x: [0, -40, 0],
            y: [0, -20, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-accent/10 rounded-full blur-[160px] opacity-30 mix-blend-plus-lighter" 
        />
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#070710]/60 backdrop-blur-md md:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-white/[0.03] backdrop-blur-3xl border-white/5 transition-all duration-500 md:h-[calc(100vh-2rem)] md:m-4 md:rounded-[2.5rem] md:sticky md:top-4 md:translate-x-0 overflow-y-auto custom-scrollbar overflow-x-hidden shadow-2xl md:border",
          sidebarOpen ? "translate-x-0 w-[260px]" : "-translate-x-full w-[260px]",
          !isCollapsed ? "md:w-[280px]" : "md:w-[90px]"
        )}
      >
        <div className={cn("flex items-center gap-4 py-8 px-8", isCollapsed && "md:px-0 md:justify-center transition-all")}>
          <Link to="/" className="flex items-center gap-4 group">
            <img src={sphereLogo} alt="Logo" className="h-10 w-10 flex-shrink-0 animate-aurora" style={{ backgroundSize: '200%' }} />
            {!isCollapsed && (
              <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-500">
                <span className="font-heading font-extrabold text-xl tracking-tighter text-white uppercase italic">
                  Lumiaxy
                </span>
                <span className="text-[9px] font-bold text-[#A0A0FF]/40 uppercase tracking-[0.4em] mt-0.5">
                  Intelligence
                </span>
              </div>
            )}
          </Link>
          <button className="ml-auto md:hidden text-white/30 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Global System Status */}
        {!isCollapsed && role === 'super_admin' && (
          <div className="mx-6 mb-6 p-4 rounded-2xl bg-primary/10 border border-primary/20 backdrop-blur-md">
            <div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-[0.2em]">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Intelligence Operational
            </div>
          </div>
        )}

        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute top-12 -right-3 h-7 w-7 rounded-full bg-[#0B0E14] border border-white/10 text-white items-center justify-center hover:bg-primary transition-all z-[60]"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        <nav className="flex-1 space-y-8 overflow-y-auto p-6 custom-scrollbar">
          {navigation.map((group, groupIdx) => (
            <div key={groupIdx} className="flex flex-col gap-2">
              {!isCollapsed && (
                <h3 className="px-4 text-[9px] font-bold uppercase tracking-[0.5em] text-white/20 mb-2">
                  {group.heading}
                </h3>
              )}
              {group.links.map((link) => {
                const Icon = link.icon;
                const { to, label } = link;
                const isActive = location.pathname === to || (to !== "/admin" && to !== "/seller" && location.pathname.startsWith(to));

                // Humanized Labels
                const displayLabel = label
                  .replace("Drug Intelligence", "Inventory AI")
                  .replace("Launch POS", "New Terminal")
                  .replace("Drug Catalog", "Medicine Hub")
                  .replace("Shift Ledger", "Sales Events")
                  .replace("Medication Registry", "Stock Ledger")
                  .replace("Temporal", "Attendance");

                return (
                  <motion.div
                    key={to}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.97 }}
                    className="relative"
                  >
                    <Link
                      to={to}
                      className={cn(
                        "relative z-10 group flex items-center gap-4 rounded-2xl px-5 py-4 text-[10px] font-bold uppercase tracking-widest transition-all duration-300",
                        isActive
                          ? "text-white"
                          : "text-muted-foreground hover:text-foreground",
                        isCollapsed && "px-0 justify-center h-12 w-12 mx-auto"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 flex-shrink-0 transition-colors", isActive ? "text-white" : "group-hover:text-primary")} />
                      {!isCollapsed && <span className="flex-1">{displayLabel}</span>}
                      
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active"
                          className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-2xl -z-10 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      
                      {isActive && !isCollapsed && (
                        <motion.div
                          layoutId="sidebar-dot"
                          className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.8)]"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Attendance Action */}
        {role !== 'super_admin' && (
           <div className={cn("px-6 mb-6", isCollapsed && "px-2")}>
              <button 
                onClick={handleClockAction}
                disabled={isClocking}
                className={cn(
                  "w-full h-12 rounded-2xl transition-all flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] font-heading",
                  currentAttendance 
                    ? "border border-white/10 text-white/60 hover:bg-white/5" 
                    : "bg-accent text-[#070710] shadow-[0_0_30px_rgba(var(--accent-rgb),0.3)] hover:scale-[1.02]",
                  isCollapsed && "p-0 h-12 w-12 mx-auto overflow-hidden text-[0px]"
                )}
              >
                {isClocking ? <Clock className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                {!isCollapsed && (currentAttendance ? "Clock Out" : "Clock In")}
              </button>
           </div>
        )}

        <div className={cn("mt-auto p-6 border-t border-white/5", isCollapsed && "p-4 border-none")}>
          <Link to="/profile" className={cn("flex items-center gap-4 mb-6 transition-all group p-2 rounded-2xl", isCollapsed && "justify-center mb-4")}>
            <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-white uppercase shadow-inner group-hover:border-primary/50 transition-colors">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Profile" className="h-full w-full object-cover rounded-[inherit]" />
              ) : (
                user?.full_name?.split(" ").map(n => n[0]).join("") || "U"
              )}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-white truncate">
                  {user?.full_name || "Enterprise User"}
                </p>
                <p className="text-[9px] text-[#A0A0FF]/40 truncate font-semibold uppercase tracking-widest">{role.replace('_', ' ')}</p>
              </div>
            )}
          </Link>
          <button
            onClick={handleSignOut}
            className={cn(
              "w-full flex items-center justify-start rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all text-[10px] font-bold uppercase tracking-[0.2em] p-3",
              isCollapsed && "justify-center px-0 w-12 mx-auto"
            )}
          >
            <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
            {!isCollapsed && "Terminate Session"}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-[100dvh] overflow-hidden relative z-10">
        <header className="h-20 lg:h-24 flex-shrink-0 flex items-center justify-between px-10 bg-white/[0.02] border-b border-white/5 backdrop-blur-3xl relative z-20">
          <div className="flex items-center gap-8">
            <button className="md:hidden p-3 rounded-2xl bg-white/5 border border-white/10" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5 text-white" />
            </button>
            <div className="hidden md:flex items-center gap-3 text-white/20 text-[10px] font-bold uppercase tracking-[0.3em]">
               <span className="hover:text-white transition-colors cursor-pointer">Intelligence</span>
               <ChevronRight size={14} className="text-white/10" />
               <span className="text-white bg-white/5 px-3 py-1 rounded-full border border-white/10">{location.pathname.split('/').pop() || 'Portal'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 p-1 rounded-2xl bg-white/5 border border-white/5">
              <button 
                onClick={() => setTheme("light")}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  theme === "light" ? "bg-white text-black shadow-lg" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Sun size={14} />
              </button>
              <button 
                onClick={() => setTheme("dark")}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  theme === "dark" ? "bg-white/10 text-white shadow-lg" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Moon size={14} />
              </button>
            </div>

            <Popover>
            <PopoverTrigger asChild>
                <button className="h-12 w-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all relative group click-compress">
                <Bell className="h-5 w-5 group-hover:animate-bounce" />
                {unreadCount > 0 && (
                    <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),1)] animate-pulse" />
                )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 bg-popover/80 border-white/10 rounded-[2rem] shadow-3xl overflow-hidden mt-4 backdrop-blur-xl" align="end">
                <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-foreground">System Alerts</h3>
                    {unreadCount > 0 && (
                        <button onClick={markRead} className="text-[9px] font-bold text-primary uppercase hover:underline">Clear Loop</button>
                    )}
                </div>
                <div className="max-h-[350px] overflow-y-auto py-2 custom-scrollbar">
                {notifications.length === 0 ? (
                    <div className="py-16 text-center text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Aura Clear</div>
                ) : notifications.map(n => (
                    <div key={n.id} className={cn("px-6 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.05] transition-colors", !n.read && "bg-primary/5")}>
                        <p className="text-[11px] font-bold text-foreground flex items-center gap-3 mb-1">
                            <span className={cn("h-2 w-2 rounded-full", n.type === "low_stock" ? "bg-red-500" : "bg-primary")} />
                            {n.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">{n.message}</p>
                    </div>
                ))}
                </div>
            </PopoverContent>
            </Popover>
            
            <div className="h-10 w-px bg-white/5 hidden sm:block" />
            
            <Link to="/profile" className="flex items-center gap-4 group click-compress">
              <div className="text-right hidden md:block">
                <p className="text-[11px] font-bold text-foreground group-hover:text-primary transition-colors uppercase tracking-widest">{user?.full_name}</p>
                <p className="text-[9px] text-muted-foreground uppercase font-semibold tracking-[0.3em]">{role.replace('_', ' ')}</p>
              </div>
              <div className="h-11 w-11 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center font-bold text-[10px] text-foreground/40 group-hover:border-primary/50 group-hover:text-primary transition-all shadow-inner overflow-hidden">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  user?.full_name?.[0] || "U"
                )}
              </div>
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-transparent pb-32 md:pb-12 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div 
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="max-w-[1600px] mx-auto p-6 md:p-12 min-h-full flex flex-col relative z-10"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile Bottom Navigation Bar (Matching Reference Aesthetic) */}
        <div className="md:hidden fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] bg-white/5 border border-white/10 backdrop-blur-3xl rounded-[2rem] h-20 z-50 px-8 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
           {navigation[0].links.concat(navigation[1].links.slice(0, 1)).slice(0, 4).map((link) => {
             const Icon = link.icon;
             const isActive = location.pathname === link.to;
             return (
               <Link key={link.to} to={link.to} className={cn(
                 "p-4 rounded-2xl transition-all relative overflow-hidden group",
                 isActive ? "bg-primary text-white scale-110 shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" : "text-white/30"
               )}>
                 <Icon size={20} className={cn("relative z-10", isActive && "animate-pulse")} />
                 {isActive && <div className="absolute inset-0 bg-gradient-to-tr from-primary to-purple-400 opacity-50 blur-xl" />}
               </Link>
             );
           })}
           <Link to="/seller/settings" className={cn(
             "p-4 rounded-2xl transition-all text-white/30",
             location.pathname.includes("settings") && "bg-primary text-white scale-110 shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]"
           )}>
              <Settings size={20} />
           </Link>
        </div>
      </main>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
