import { useState } from "react";
import { seedSupabaseDatabase, seedPricingTiers, seedSuperAdmin } from "@/lib/supabase-seed";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Loader2, CheckCircle2, ArrowLeft, Database, Zap, User, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function DebugSetup() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const navigate = useNavigate();

  const runFullSeed = async () => {
    setLoading(true);
    setLogs([]);
    setStatus("idle");

    try {
      const result = await seedSupabaseDatabase();
      setLogs(result.details);
      setStatus(result.success ? "success" : "error");
      toast[result.success ? "success" : "error"](result.message);
    } catch (err: any) {
      setLogs([`❌ Critical Error: ${err.message}`]);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const seedTiersOnly = async () => {
    setLoading(true);
    try {
      const tierLogs = await seedPricingTiers();
      setLogs(tierLogs);
      setStatus(tierLogs.some(l => l.startsWith("❌")) ? "error" : "success");
      toast.success("Pricing tiers seeded.");
    } catch (err: any) {
      setLogs([`❌ ${err.message}`]);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const seedAdminOnly = async () => {
    setLoading(true);
    try {
      const adminLogs = await seedSuperAdmin();
      setLogs(adminLogs);
      setStatus(adminLogs.some(l => l.startsWith("❌")) ? "error" : "success");
      toast.success("Super admin provisioned.");
    } catch (err: any) {
      setLogs([`❌ ${err.message}`]);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    setLogs([]);
    try {
      const { data, error } = await supabase.from('pricing_tiers').select('count');
      if (error) {
        setLogs([`❌ Connection Failed: ${error.message}`, `Code: ${error.code}`, `Hint: ${error.hint || 'Check if table exists in Supabase'}`]);
        setStatus("error");
      } else {
        setLogs([`✅ Supabase connected successfully`, `Project: gyzlobstembsiisypuzw`]);
        
        // Check each table
        const tables = ['pricing_tiers', 'pharmacies', 'drugs', 'sales', 'profiles', 'suppliers', 'expenses', 'notifications', 'announcements', 'attendance', 'customers', 'support_tickets', 'audit_logs'];
        for (const table of tables) {
          const { data: tData, error: tErr } = await supabase.from(table).select('*', { count: 'exact', head: true });
          if (tErr) {
            setLogs(prev => [...prev, `❌ ${table}: ${tErr.message}`]);
          } else {
            setLogs(prev => [...prev, `  📋 ${table}: OK`]);
          }
        }
        setStatus("success");
      }
    } catch (err: any) {
      setLogs([`❌ Network Error: ${err.message}`]);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <Card className="w-full max-w-lg bg-card/40 border-primary/10 backdrop-blur-xl shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Database className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-black text-white">Supabase Setup</CardTitle>
          <CardDescription className="text-muted-foreground">
            Cloud Database Initialization & Management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-xs text-primary/80 leading-relaxed font-medium">
            Lumiaxy Enterprise runs on <span className="text-white font-bold">Supabase (Cloud)</span>. 
            Use these tools to seed initial data, create admin accounts, and diagnose connectivity.
          </div>

          {/* Logs Output */}
          {logs.length > 0 && (
            <div className={`p-4 rounded-xl border text-xs font-mono space-y-1 max-h-[250px] overflow-y-auto ${
              status === "error" ? "bg-red-500/5 border-red-500/20" : 
              status === "success" ? "bg-emerald-500/5 border-emerald-500/20" : 
              "bg-white/5 border-white/10"
            }`}>
              {logs.map((line, i) => (
                <p key={i} className={`leading-relaxed ${
                  line.startsWith("❌") ? "text-red-400" : 
                  line.startsWith("✅") ? "text-emerald-400" : 
                  line.startsWith("⚠️") ? "text-amber-400" :
                  line.startsWith("🔑") ? "text-primary font-bold" :
                  line.startsWith("---") ? "text-white/40 pt-1" :
                  "text-white/60"
                }`}>
                  {line}
                </p>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3">
            {/* Full Seed */}
            <Button 
              className="h-14 rounded-2xl bg-primary text-black font-black uppercase tracking-widest text-[10px] w-full shadow-xl shadow-primary/20"
              onClick={runFullSeed}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Seed Full Database (Tiers + Admin)
                </>
              )}
            </Button>

            {/* Individual Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline"
                className="h-12 rounded-xl border-white/10 text-white font-bold text-[9px] uppercase tracking-widest"
                onClick={seedTiersOnly}
                disabled={loading}
              >
                <Database className="h-3 w-3 mr-1.5" />
                Seed Tiers
              </Button>
              <Button 
                variant="outline"
                className="h-12 rounded-xl border-white/10 text-white font-bold text-[9px] uppercase tracking-widest"
                onClick={seedAdminOnly}
                disabled={loading}
              >
                <User className="h-3 w-3 mr-1.5" />
                Create Admin
              </Button>
            </div>

            {/* Test Connection */}
            <Button 
              variant="outline"
              className="h-12 rounded-xl border-primary/20 text-primary font-bold text-[9px] uppercase tracking-widest"
              onClick={testConnection}
              disabled={loading}
            >
              <RefreshCw className={`h-3 w-3 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Test Supabase Connection
            </Button>
            
            {/* Credentials Reminder */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] text-muted-foreground space-y-1">
              <p className="font-black uppercase tracking-widest text-white/40">Default Super Admin</p>
              <p>Email: <span className="text-primary font-bold">admin@lumiaxy.ph</span></p>
              <p>Password: <span className="text-primary font-bold">LumiaxySuperAdmin2026!</span></p>
            </div>

            <Button 
              variant="ghost" 
              className="h-14 rounded-2xl text-muted-foreground hover:text-white font-bold text-xs"
              onClick={() => navigate("/login")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
