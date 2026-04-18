import { useState } from "react";
import { db, seedDatabase } from "@/lib/dexie";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Loader2, CheckCircle2, ArrowLeft, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function DebugSetup() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const navigate = useNavigate();

  const resetLocalDatabase = async () => {
    if (!confirm("This will DELETE all local data. Are you sure?")) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      await db.delete();
      await db.open();
      await seedDatabase();
      localStorage.removeItem('lumiaxy_session');
      
      setResult("Local Database Reset & Master Admin Seeded!");
      toast.success("Database reset successfully.");
    } catch (err: any) {
      setResult(`Critical Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const reSeedAdmin = async () => {
    setLoading(true);
    try {
      await seedDatabase();
      setResult("Master Admin Provisioned! Creds: admin@lumiaxy.ph / LumiaxySuperAdmin2026!");
      toast.success("Master account created.");
    } catch (err: any) {
      setResult(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-card/40 border-primary/10 backdrop-blur-xl shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <ShieldAlert className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-black text-white">System Maintenance</CardTitle>
          <CardDescription className="text-muted-foreground">Local Database Tools & Management</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-xs text-primary/80 leading-relaxed font-medium">
            Lumiaxy is now running on a <span className="text-white font-bold">Local Database (Dexie)</span>. 
            All your data is stored securely in this browser.
          </div>

          {result && (
            <div className={`p-4 rounded-xl border text-sm font-bold flex items-start gap-3 ${result.includes('Error') ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
              {!result.includes('Error') ? <CheckCircle2 className="h-5 w-5 flex-shrink-0" /> : <ShieldAlert className="h-5 w-5 flex-shrink-0" />}
              {result}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button 
              className="h-14 rounded-2xl bg-primary text-black font-black uppercase tracking-widest text-[10px] w-full shadow-xl shadow-primary/20"
              onClick={reSeedAdmin}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Provision Master Admin"}
            </Button>

            <Button 
              variant="destructive"
              className="h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] w-full"
              onClick={resetLocalDatabase}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Reset All Local Data
            </Button>
            
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
