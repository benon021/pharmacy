import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { localDb } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Pill, ShoppingCart, Users, BarChart3,
  LogOut, Menu, X, ChevronRight, Activity, Bell, Search, CalendarDays,
  Truck, Wallet, ShieldCheck, History, Settings, UserCircle, ChevronLeft, Sun, Moon, Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

const adminNavigation = [
  {
    heading: "Core",
    links: [
      { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/admin/sales", icon: ShoppingCart, label: "All Sales" },
      { to: "/seller/new-sale", icon: Package, label: "Branch POS" },
      { to: "/seller/history", icon: History, label: "Personal History" },
    ]
  },
  {
    heading: "Inventory",
    links: [
      { to: "/admin/drugs", icon: Pill, label: "Drug Catalog" },
      { to: "/admin/expiry", icon: CalendarDays, label: "Health Monitor" },
      { to: "/admin/suppliers", icon: Truck, label: "Suppliers" },
    ]
  },
  {
    heading: "Management",
    links: [
      { to: "/admin/sellers", icon: Users, label: "Staff & Sellers" },
      { to: "/admin/expenses", icon: Wallet, label: "Expenses" },
      { to: "/admin/reports", icon: BarChart3, label: "Intelligence" },
      { to: "/admin/audit", icon: ShieldCheck, label: "Audit Logs" },
    ]
  },
  {
    heading: "System",
    links: [
      { to: "/admin/settings", icon: Settings, label: "Settings" },
    ]
  }
];

const sellerNavigation = [
  {
    heading: "Core",
    links: [
      { to: "/seller", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/seller/new-sale", icon: ShoppingCart, label: "Terminal POS" },
      { to: "/seller/history", icon: History, label: "My History" },
    ]
  },
  {
    heading: "Reference",
    links: [
      { to: "/seller/catalog", icon: Pill, label: "Item Catalog" },
    ]
  },
  {
    heading: "System",
    links: [
      { to: "/seller/settings", icon: Settings, label: "Profile" },
    ]
  }
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { role, signOut, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    return saved === "true";
  });
  const [notifications, setNotifications] = useState<any[]>([]);
  const navigation = role === "admin" ? adminNavigation : sellerNavigation;

  const fetchNotifs = () => {
    setNotifications(localDb.notifications.getAll());
  };

  const checkSystem = () => {
    const drugs = localDb.drugs.getAll();
    const unread = localDb.notifications.getUnread();
    
    drugs.forEach(d => {
      // Low Stock
      if (d.stock <= d.low_stock_threshold) {
        const title = `Low Stock: ${d.name}`;
        if (!unread.find(n => n.title === title)) {
          localDb.notifications.create({
            title,
            message: `${d.name} is down to ${d.stock} ${d.unit}. Consider restocking.`,
            type: "low_stock"
          });
        }
      }

      // Expiry (within 30 days)
      if (d.expiry_date) {
        const daysLeft = Math.ceil((new Date(d.expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
        if (daysLeft > 0 && daysLeft < 30) {
          const title = `Expiry Warning: ${d.name}`;
          if (!unread.find(n => n.title === title)) {
            localDb.notifications.create({
              title,
              message: `${d.name} expires in ${daysLeft} days (${d.expiry_date}).`,
              type: "expiry"
            });
          }
        }
      }
    });

    fetchNotifs();
  };

  useEffect(() => {
    checkSystem();
    
    // Auto collapse on screen resize
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    };
    
    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    
    const interval = setInterval(checkSystem, 60000); // Check every minute
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar_collapsed", String(isCollapsed));
  }, [isCollapsed]);

  const markRead = () => {
    localDb.notifications.markAllRead();
    fetchNotifs();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    toast.success("Safe departure confirmed. Session terminated.");
  };

  return (
    <div className="flex min-h-screen bg-background transition-colors duration-500">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md md:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0B0E14] border-r border-border dark:border-white/5 transition-all duration-300 md:h-screen md:sticky md:top-0 md:translate-x-0 overflow-y-auto custom-scrollbar overflow-x-hidden",
          sidebarOpen ? "translate-x-0 w-[280px]" : "-translate-x-full w-[280px]",
          !isCollapsed ? "md:w-[280px]" : "md:w-[90px]"
        )}
      >
        {/* Brand */}
        <div className={cn("flex items-center gap-3 py-8 px-6", isCollapsed && "md:px-0 md:justify-center transition-all")}>
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 flex flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary text-primary-foreground shadow-lg shadow-black/20 dark:shadow-primary/20 hover:scale-105 transition-transform">
              <Activity className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <span className="font-extrabold text-xl tracking-tight text-foreground dark:text-white uppercase">
                Lumiaxy<span className="text-primary font-black dark:text-primary/70">.</span>
              </span>
            )}
          </Link>
          <button className="ml-auto md:hidden text-foreground dark:text-white/50 hover:text-foreground dark:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Collapse Toggle (Desktop only) */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute top-10 -right-3 h-6 w-6 rounded-full bg-white/10 border border-border dark:border-white/10 text-foreground dark:text-white items-center justify-center backdrop-blur-md hover:bg-primary hover:text-black transition-all z-[60] shadow-xl"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        {/* Nav */}
        <nav className="flex-1 space-y-6 overflow-y-auto p-4 custom-scrollbar">
          {navigation.map((group, groupIdx) => (
            <div key={groupIdx} className="flex flex-col gap-1">
              {!isCollapsed && (
                <h3 className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">
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
                      "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-white/5",
                      isCollapsed && "px-0 justify-center h-12 w-12 mx-auto"
                    )}
                  >
                    <Icon className={cn("h-5 w-5 transition-all flex-shrink-0", isActive && "text-primary-foreground")} />
                    {!isCollapsed && <span className="flex-1 animate-in fade-in duration-500">{label}</span>}
                    {isActive && !isCollapsed && (
                      <div className="h-1.5 w-1.5 rounded-full bg-white dark:bg-primary shadow-sm" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User section */}
        <div className={cn("mt-auto p-4 m-4 rounded-2xl bg-white/[0.03] border border-border dark:border-white/5 transition-all", isCollapsed && "m-0 rounded-none bg-transparent border-none p-2")}>
          <div className={cn("flex items-center gap-3 mb-4", isCollapsed && "justify-center mb-2")}>
            <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-border dark:border-white/10 text-xs font-bold text-foreground dark:text-white uppercase tracking-tighter shadow-inner overflow-hidden">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                user?.full_name?.split(" ").map(n => n[0]).join("") || "U"
              )}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 animate-in fade-in duration-500">
                <p className="text-sm font-bold text-foreground dark:text-white truncate">
                  {user?.full_name || "Guest User"}
                </p>
                <p className="text-[10px] text-muted-foreground truncate uppercase tracking-widest">{role}</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className={cn(
              "w-full justify-start rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300 text-xs font-bold uppercase tracking-widest",
              isCollapsed && "justify-center px-0 w-10 mx-auto"
            )}
            title={isCollapsed ? "Sign Out" : ""}
          >
            <LogOut className={cn("h-3.5 w-3.5", !isCollapsed && "mr-2")} />
            {!isCollapsed && "Sign Out"}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-background">
        <header className="h-20 flex-shrink-0 flex items-center justify-between px-6 bg-card/80 backdrop-blur-xl border-b border-border dark:border-white/5 dark:border-border">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 rounded-lg bg-card dark:bg-white/5" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5 text-foreground dark:text-white" />
            </button>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card dark:bg-white/5 border border-border dark:border-white/5 text-muted-foreground">
              <Search className="h-4 w-4" />
              <input 
                type="text" 
                placeholder="Quick Search (Ctrl+K)" 
                className="bg-transparent border-none outline-none text-xs w-48 focus:w-64 transition-all duration-300"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg bg-card dark:bg-white/5 text-muted-foreground hover:text-foreground transition-colors relative"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <Popover>
              <PopoverTrigger asChild>
                <button className="p-2 rounded-lg bg-card dark:bg-white/5 text-muted-foreground hover:text-foreground dark:text-white transition-colors relative">
                  <Bell className="h-5 w-5" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary border-2 border-[#0B0E14]" />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 bg-[#0B0E14] border-border dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden" align="end">
                <div className="p-4 border-b border-border dark:border-white/5 bg-muted dark:bg-white/[0.02] flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground dark:text-white">Notifications</h3>
                  {notifications.filter(n => !n.read).length > 0 && (
                    <button onClick={markRead} className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto py-2 custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground italic">
                      No notifications yet
                    </div>
                  ) : notifications.map(n => (
                    <div key={n.id} className={cn("px-4 py-3 border-b border-border dark:border-white/5 last:border-0 hover:bg-muted dark:bg-white/[0.02] transition-colors", !n.read && "bg-primary/5")}>
                      <p className="text-xs font-bold text-foreground dark:text-white flex items-center gap-2">
                        <span className={cn("h-1.5 w-1.5 rounded-full", n.type === "low_stock" ? "bg-red-500" : n.type === "expiry" ? "bg-amber-500" : "bg-primary")} />
                        {n.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{n.message}</p>
                      <p className="text-[9px] text-foreground dark:text-white/20 mt-2">{new Date(n.created_at).toLocaleTimeString()}</p>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-foreground dark:text-white">{user?.full_name || "User"}</p>
                <p className="text-[10px] text-muted-foreground uppercase">{role}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-accent p-[1px]">
                <div className="h-full w-full rounded-[11px] bg-[#0B0E14] flex items-center justify-center font-bold text-xs text-foreground dark:text-white overflow-hidden">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    user?.full_name?.[0] || "U"
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth">
          <div className="max-w-[1600px] mx-auto p-6 md:p-8 lg:p-10">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
