import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Pill, Loader2, AlertCircle, ShieldCheck, Mail, Lock, Zap, ArrowLeft } from "lucide-react";
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
      toast.success("Login Successful. Welcome back.");
      
      // Role-aware redirection
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

  return (
    <div className="flex min-h-screen items-center justify-center p-6 relative overflow-hidden bg-[#050505]">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

      <Button 
        variant="ghost" 
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 text-muted-foreground hover:text-foreground transition-colors z-50 rounded-xl hidden sm:flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Return to Home
      </Button>

      <div className="w-full max-w-lg animate-fade-in relative z-10">

        <div className="premium-card p-1 shadow-2xl! shadow-primary/5!">
          <Card className="bg-transparent border-0">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60 italic">Secure Local Session</span>
              </div>
              <CardTitle className="text-3xl font-bold text-foreground dark:text-white tracking-tight">Secure Login</CardTitle>
              <CardDescription className="text-muted-foreground font-medium pt-1">Enter your credentials to access the system</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="flex items-center gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 animate-in slide-in-from-top-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span className="font-bold">{error}</span>
                  </div>
                )}
                
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Email Address</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter corporate email..."
                      className="h-14 pl-12 rounded-2xl bg-card dark:bg-white/5 border-border dark:border-white/10 focus:bg-white/10 transition-all text-lg font-medium"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="h-14 pl-12 rounded-2xl bg-card dark:bg-white/5 border-border dark:border-white/10 focus:bg-white/10 transition-all text-lg font-medium"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-14 rounded-2xl shadow-xl shadow-primary/20 text-base font-bold uppercase tracking-widest group" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Sign In
                      <Zap className="h-4 w-4 fill-current group-hover:animate-pulse" />
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center gap-6">
            <div className="h-px w-12 bg-white/10" />
            <p className="text-[10px] text-foreground dark:text-white/20 font-bold uppercase tracking-[0.4em]">Lumiaxy Enterprise</p>
            <div className="h-px w-12 bg-white/10" />
          </div>
          <div className="p-4 rounded-2xl border border-border dark:border-white/5 bg-muted dark:bg-white/[0.02] backdrop-blur-md">
             <p className="text-[11px] text-muted-foreground/60 text-center leading-relaxed">
              Secured by <span className="text-foreground dark:text-white/60">Lumiaxy OS</span> enterprise security.<br/>
              © 2026 Lumiaxy. All data is encrypted and stored locally.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
