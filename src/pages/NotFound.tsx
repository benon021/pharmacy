import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6 relative overflow-hidden bg-[#050505]">
      {/* Background glow */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-destructive/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px]" />

      <div className="text-center space-y-8 relative z-10 animate-fade-in">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-destructive/10 border border-destructive/20 shadow-2xl shadow-destructive/10">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-7xl font-black tracking-tighter bg-gradient-to-r from-white to-white/30 bg-clip-text text-transparent">
            404
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            The page you're looking for doesn't exist
          </p>
          <p className="text-xs text-muted-foreground/50 font-mono">
            {location.pathname}
          </p>
        </div>

        <Link to="/">
          <Button className="h-12 px-8 rounded-xl shadow-xl shadow-primary/20 font-bold gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
