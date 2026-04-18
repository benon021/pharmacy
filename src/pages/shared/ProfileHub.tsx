import { useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { localDb, User } from "@/lib/db";
import { useQuery } from "@tanstack/react-query";
import { 
  User as UserIcon, 
  Shield, 
  Mail, 
  Building2, 
  ShieldCheck, 
  Activity, 
  Zap, 
  Calendar,
  Award,
  Clock,
  MapPin,
  Smartphone
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/LoadingSpinner";
import { cn } from "@/lib/utils";

export default function ProfileHub() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser, role: currentRole } = useAuth();
  
  // If no userId in URL, show current user's profile
  const targetId = userId || currentUser?.id;

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile", targetId],
    queryFn: () => targetId ? localDb.auth.getProfile(targetId) : null,
    enabled: !!targetId
  });

  const { data: pharmacy } = useQuery({
    queryKey: ["pharmacy-details", profile?.pharmacy_id],
    queryFn: () => profile?.pharmacy_id ? localDb.pharmacies.getById(profile.pharmacy_id) : null,
    enabled: !!profile?.pharmacy_id
  });

  if (isLoading) return <LoadingSpinner />;
  if (!profile) return (
     <div className="py-40 text-center opacity-30 flex flex-col items-center gap-4">
        <Activity size={64} />
        <p className="text-xl font-black uppercase tracking-widest italic">User Entity Not Found</p>
     </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-fade-in">
      {/* Hero Header */}
      <div className="relative h-64 w-full rounded-[3rem] overflow-hidden bg-gradient-to-br from-primary/20 to-[#0B0E14] border border-white/5 shadow-2xl">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
         <div className="absolute bottom-0 left-0 w-full p-12 bg-gradient-to-t from-[#0B0E14] to-transparent flex items-end justify-between">
            <div className="flex items-center gap-8 translate-y-6">
               <div className="h-40 w-40 rounded-[2.5rem] bg-[#0B0E14] border-4 border-[#0B0E14] shadow-2xl overflow-hidden shadow-primary/20">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-tr from-primary/10 to-white/5 flex items-center justify-center text-primary font-black text-4xl italic uppercase">
                       {profile.full_name[0]}
                    </div>
                  )}
               </div>
               <div className="pb-4">
                  <div className="flex items-center gap-4">
                    <h1 className="text-5xl font-black italic tracking-tighter uppercase text-white">{profile.full_name}</h1>
                    <Badge className="bg-primary text-black font-black uppercase tracking-widest text-[10px] rounded-full px-4 h-6">
                       Verified Entity
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-primary/60 font-black uppercase tracking-[0.2em] text-[10px]">
                     <span className="flex items-center gap-1.5 focus:text-white transition-colors cursor-default">
                        <Shield size={12} /> {profile.role}
                     </span>
                     <span className="opacity-30">•</span>
                     <span className="flex items-center gap-1.5">
                        <Clock size={12} /> Established {new Date(profile.created_at).toLocaleDateString()}
                     </span>
                  </div>
               </div>
            </div>
            
            <div className="flex items-center gap-3 translate-y-6">
               <Badge variant="outline" className={cn(
                 "h-10 px-6 rounded-2xl border-white/10 font-black uppercase tracking-widest text-[9px]",
                 profile.is_active ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" : "text-red-500 border-red-500/20 bg-red-500/5"
               )}>
                  Status: {profile.is_active ? "OPERATIONAL" : "DEACTIVATED"}
               </Badge>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-10">
         {/* Identity Meta */}
         <div className="lg:col-span-1 space-y-6">
            <Card className="glass-card p-10 space-y-8 rounded-[2.5rem]">
               <div className="space-y-6">
                  <div className="flex items-center gap-4">
                     <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-primary border border-white/10">
                        <Mail size={20} />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Communication Uplink</span>
                        <span className="text-sm font-bold text-white italic">{profile.email || "Confidential System Entity"}</span>
                     </div>
                  </div>

                  <div className="flex items-center gap-4">
                     <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-primary border border-white/10">
                        <Building2 size={20} />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Assigned Branch</span>
                        <span className="text-sm font-bold text-white italic">{pharmacy?.name || "Global Headquarters"}</span>
                     </div>
                  </div>

                  {pharmacy?.location && (
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-primary border border-white/10">
                          <MapPin size={20} />
                      </div>
                      <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Entity Geo-Coordinates</span>
                          <span className="text-sm font-bold text-white italic">{pharmacy.location}</span>
                      </div>
                    </div>
                  )}
               </div>

               <div className="pt-8 border-t border-white/5">
                  <div className="flex items-center justify-between mb-6">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white italic">Clearance Matrix</h4>
                     <Zap size={14} className="text-primary animate-pulse" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-40 italic">Module POS</span>
                        <span className="text-[10px] font-black text-emerald-500 uppercase">Granted</span>
                     </div>
                     <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-40 italic">Audit Log</span>
                        <span className="text-[10px] font-black text-emerald-500 uppercase">Granted</span>
                     </div>
                     <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-40 italic">Inventory Admin</span>
                        <span className={cn(
                          "text-[10px] font-black uppercase",
                          profile.role === 'seller' ? "text-red-500" : "text-emerald-500"
                        )}>{profile.role === 'seller' ? "Denied" : "Granted"}</span>
                     </div>
                  </div>
               </div>
            </Card>

            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-[#101319] to-black border border-white/5 flex flex-col items-center justify-center text-center space-y-4">
               <Award size={32} className="text-primary" />
               <div className="space-y-1">
                  <h4 className="font-black italic uppercase tracking-tighter text-white">Advanced Professional</h4>
                  <p className="text-[10px] font-medium text-muted-foreground/60 italic leading-none">Ranked Top 5% in Branch Attendance</p>
               </div>
            </div>
         </div>

         {/* Activity & Performance */}
         <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Card className="glass-card p-8 rounded-[2.5rem]">
                  <div className="flex items-center justify-between mb-8">
                     <div className="flex flex-col">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white italic">Sales Velocity</h4>
                        <span className="text-2xl font-black italic uppercase text-primary tracking-tighter">KES 142,500</span>
                     </div>
                     <Activity size={24} className="text-primary/40" />
                  </div>
                  <div className="space-y-4">
                     <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full w-[75%] bg-primary shadow-[0_0_10px_rgba(255,102,0,0.5)]" />
                     </div>
                     <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-muted-foreground/40">Daily Quota</span>
                        <span className="text-white italic">75% Achieved</span>
                     </div>
                  </div>
               </Card>

               <Card className="glass-card p-8 rounded-[2.5rem]">
                  <div className="flex items-center justify-between mb-8">
                     <div className="flex flex-col">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white italic">Shift Efficiency</h4>
                        <span className="text-2xl font-black italic uppercase text-primary tracking-tighter">09:42 Avg Clock-In</span>
                     </div>
                     <Calendar size={24} className="text-primary/40" />
                  </div>
                  <div className="space-y-4">
                     <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full w-[90%] bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                     </div>
                     <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-muted-foreground/40">Reliability Grade</span>
                        <span className="text-emerald-500 italic">Grade A+</span>
                     </div>
                  </div>
               </Card>
            </div>

            <Card className="glass-card p-0 rounded-[2.5rem] overflow-hidden">
               <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white italic">Recent Infrastructure Interactions</h4>
                  <Smartphone size={16} className="text-muted-foreground/20" />
               </div>
               <div className="p-0">
                  <div className="flex flex-col">
                     {[1,2,3].map((i) => (
                       <div key={i} className="px-8 py-6 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors flex items-center justify-between group">
                          <div className="flex items-center gap-6">
                             <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground/40 group-hover:text-primary transition-all">
                                <Zap size={16} />
                             </div>
                             <div className="flex flex-col">
                                <p className="text-xs font-black italic uppercase text-white tracking-tighter">Manual POS Entry #{8374 + i}</p>
                                <span className="text-[9px] font-medium text-muted-foreground/40 italic">Encryption Layer 2 Established</span>
                             </div>
                          </div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/20">Success</p>
                       </div>
                     ))}
                  </div>
               </div>
            </Card>
         </div>
      </div>
    </div>
  );
}
