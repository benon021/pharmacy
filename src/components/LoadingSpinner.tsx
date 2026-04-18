import { Activity } from "lucide-react";

const LoadingSpinner = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <div className="relative">
        {/* Glow behind the spinner */}
        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
        
        {/* The main spinner icon */}
        <div className="relative h-16 w-16 flex items-center justify-center rounded-2xl bg-card border border-primary/20 shadow-2xl shadow-primary/10 animate-spin-slow">
          <Activity className="h-8 w-8 text-primary animate-pulse" />
        </div>
      </div>
      
      {/* Loading text */}
      <div className="mt-8 space-y-2 text-center">
        <h3 className="text-xl font-black italic tracking-tighter uppercase text-foreground">
          Loading <span className="text-primary">System</span>
        </h3>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground animate-pulse">
          Synchronizing Data...
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
