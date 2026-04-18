import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, Mail, Lock, Zap, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);
    if (error) {
      setError(error.message);
    } else {
      toast.success("Identity Verified. Welcome back.");
      
      const userStr = localStorage.getItem("lumiaxy_session");
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'super_admin') navigate("/super-admin");
        else if (user.role === 'admin') navigate("/admin");
        else navigate("/seller");
      } else {
        navigate("/");
      }
    }
  };

  const sphereLogo = "/iridescent_sphere_logo_total_1776509962585.png";

  return (
    <div className="flex min-h-screen items-center justify-center p-6 relative overflow-hidden bg-[#070710]">
      {/* Immersive Aurora Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-accent/10 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <Button 
        variant="ghost" 
        onClick={() => navigate("/")}
        className="absolute top-8 left-8 text-white/40 hover:text-white transition-colors z-50 rounded-full border border-white/5 bg-white/5 backdrop-blur-md px-6 hidden sm:flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Return
      </Button>

      <div className="w-full max-w-lg animate-fade-in relative z-10">
        <div className="flex flex-col items-center mb-10">
           <img src={sphereLogo} alt="Logo" className="h-16 w-16 mb-6 animate-aurora" style={{ backgroundSize: '200%' }} />
           <h2 className="text-3xl font-heading font-extrabold text-white tracking-tighter uppercase italic">Initialization</h2>
           <p className="text-[#A0A0FF]/40 text-[10px] font-bold uppercase tracking-[0.4em] mt-2">Distributed Intelligence Security</p>
        </div>

        <div className="premium-card p-1 shadow-2xl! shadow-primary/10!">
          <Card className="bg-transparent border-0">
            <CardHeader className="p-8 pb-4 text-center">
              <CardTitle className="text-2xl font-heading font-bold text-white tracking-tight">System Access</CardTitle>
              <CardDescription className="text-[#A0A0FF]/40 font-bold text-[10px] uppercase tracking-widest pt-2">Enter credentials for identity verification</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="flex items-center gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-xs text-red-400 animate-in slide-in-from-top-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span className="font-bold">{error}</span>
                  </div>
                )}
                
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 ml-1">Universal Email</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@lumiaxy.com"
                      className="h-14 pl-12 rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 transition-all text-white font-medium"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 ml-1">Access Token</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="h-14 pl-12 rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/10 transition-all text-white font-medium"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-16 rounded-2xl bg-primary text-white font-heading font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all group" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  ) : (
                    <span className="flex items-center justify-center gap-3">
                      Verify Identity
                      <Zap className="h-4 w-4 fill-current group-hover:animate-pulse" />
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 flex flex-col items-center gap-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center gap-6">
            <div className="h-px w-12 bg-white/5" />
            <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.6em]">Lumiaxy Enterprise</p>
            <div className="h-px w-12 bg-white/5" />
          </div>
        </div>
      </div>
    </div>
  );
}
