import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  description?: string;
  className?: string;
  onClick?: () => void;
  color?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  description, 
  className,
  onClick,
  color = "primary"
}: StatsCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-[2.5rem] p-8",
        "bg-white/[0.03] border border-white/10 backdrop-blur-3xl",
        "shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]",
        "cursor-pointer group transition-all duration-500",
        "hover:border-primary/30",
        className
      )}
    >
      {/* Background Aurora Glow */}
      <div className={cn(
        "absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-20 transition-all duration-700 group-hover:opacity-40",
        color === "primary" ? "bg-primary" : "bg-accent"
      )} />
      
      <div className="relative z-10 flex flex-col h-full space-y-6">
        <div className="flex items-center justify-between">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/70 group-hover:text-primary group-hover:border-primary/30 transition-all">
            <Icon size={24} />
          </div>
          {trend && (
            <div className={cn(
              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
              trend.positive 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                : "bg-rose-500/10 border-rose-500/20 text-rose-500"
            )}>
              {trend.positive ? "+" : "-"}{trend.value}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 group-hover:text-white/60 transition-colors">
            {title}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black italic tracking-tighter text-white font-heading">
              {value}
            </span>
          </div>
          {description && (
            <p className="text-[10px] font-medium text-white/30 italic">
              {description}
            </p>
          )}
        </div>

        <div className="pt-4 mt-auto">
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "70%" }}
              transition={{ duration: 1, delay: 0.5 }}
              className={cn(
                "h-full rounded-full",
                color === "primary" ? "bg-primary" : "bg-accent"
              )}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
