import { useState, useMemo } from "react";
import { localDb } from "@/lib/db";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  FileCheck, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  Copy, 
  ArrowRight,
  ShieldAlert,
  Save,
  Loader2,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useNavigate } from "react-router-dom";

export default function PharmacyOnboarding() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [credentials, setCredentials] = useState<{email: string, password: string} | null>(null);

  const [form, setForm] = useState({
    name: "",
    location: "",
    kra_pin: "",
    license_number: "",
    tier_id: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: ""
  });

  const { data: tiers = [], isLoading: loadingTiers } = useQuery({
    queryKey: ["pricing-tiers"],
    queryFn: () => localDb.pricing.getAll()
  });

  const selectedTier = useMemo(() => {
    return tiers.find(t => t.id === form.tier_id);
  }, [tiers, form.tier_id]);

  const onboardMutation = useMutation({
    mutationFn: (data: any) => localDb.pharmacies.onboard(data),
    onSuccess: (result) => {
      setCredentials(result.credentials);
      setStep(3);
      toast.success("Pharmacy Branch Registered.");
      queryClient.invalidateQueries({ queryKey: ["pharmacies"] });
    },
    onError: () => {
      toast.error("Failed to register pharmacy.");
    }
  });

  const handleOnboard = () => {
    if (!form.name || !form.ownerEmail || !form.tier_id) {
      toast.error("Please fill in all required fields.");
      return;
    }
    onboardMutation.mutate({
      ...form,
      price: selectedTier?.price,
      duration_days: selectedTier?.duration_days
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.primary("Copied to clipboard.");
  };

  if (loadingTiers) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-1000">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-black tracking-tighter text-white italic uppercase py-2">
          Branch <span className="text-primary underline decoration-primary/20 underline-offset-8">Registration</span>
        </h1>
        <p className="text-muted-foreground font-black text-xs uppercase tracking-[0.3em] opacity-60">
          Adding a new pharmacy branch to the Lumiaxy network.
        </p>
      </div>

      {step === 3 ? (
        <Card className="bg-[#0B0E14] border-emerald-500/20 shadow-[0_0_100px_rgba(16,185,129,0.05)] p-12 rounded-[3.5rem] border-t-emerald-500/40 relative overflow-hidden text-center">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-emerald-500/10 border border-emerald-500/20 mb-8 animate-pulse shadow-2xl shadow-emerald-500/10">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            </div>
            <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4">Registration Successful</h2>
            <p className="text-muted-foreground font-medium text-lg max-w-lg mx-auto mb-12">
               Pharmacy Branch <span className="text-white font-bold">"{form.name}"</span> is now live. Share these credentials with the branch administrator.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
               <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/5 relative group cursor-pointer" onClick={() => copyToClipboard(credentials?.email || '')}>
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Admin Email</p>
                  <p className="text-xl font-black text-white italic truncate">{credentials?.email}</p>
                  <Copy className="absolute top-4 right-4 h-4 w-4 text-white/20 group-hover:text-primary transition-colors" />
               </div>
               <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/5 relative group cursor-pointer" onClick={() => copyToClipboard(credentials?.password || '')}>
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Temporary Password</p>
                  <p className="text-xl font-black text-white italic tracking-[0.2em]">{credentials?.password}</p>
                  <Copy className="absolute top-4 right-4 h-4 w-4 text-white/20 group-hover:text-primary transition-colors" />
               </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
               <Button onClick={() => navigate("/super-admin/pharmacies")} variant="outline" className="flex-1 h-16 rounded-2xl border-white/10 text-white font-black uppercase tracking-widest text-[10px]">
                  View Branch Registry
               </Button>
               <Button onClick={() => { setStep(1); setForm({name:"", location:"", kra_pin:"", license_number:"", tier_id:"", ownerName:"", ownerEmail:"", ownerPhone:""}); setCredentials(null); }} className="flex-1 h-16 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[10px]">
                  Register Another Branch
               </Button>
            </div>
        </Card>
      ) : (
        <div className="space-y-8">
           <div className="flex items-center justify-between mb-8 px-8">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                   <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg transition-all ${
                     step === i ? 'bg-primary text-black shadow-2xl shadow-primary/30 scale-110' : 
                     step > i ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-white/5 text-muted-foreground border border-white/5'
                   }`}>
                      {step > i ? <CheckCircle2 size={24} /> : i}
                   </div>
                   <div className="text-left hidden sm:block">
                      <p className={`text-[10px] font-black uppercase tracking-widest leading-none ${step === i ? 'text-primary' : 'text-muted-foreground/40'}`}>
                         Step 0{i}
                      </p>
                      <p className={`text-xs font-bold italic mt-1 ${step === i ? 'text-white' : 'text-muted-foreground/20'}`}>
                         {i === 1 ? 'Branch Details' : 'Owner Information'}
                      </p>
                   </div>
                   {i === 1 && <div className="h-px w-20 bg-white/5 mx-4" />}
                </div>
              ))}
           </div>

           <Card className="bg-card/40 border-primary/10 backdrop-blur-3xl p-10 rounded-[3rem] border-t-primary/20 relative overflow-hidden">
              <div className="absolute top-0 right-10 w-40 h-40 bg-primary/5 blur-[80px] rounded-full" />
              <CardContent className="p-0 space-y-10">
                 {step === 1 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 animate-in slide-in-from-right-4 duration-500">
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1 flex items-center gap-2 italic">
                             <Building2 size={12} /> Pharmacy Name
                          </Label>
                          <Input 
                            placeholder="e.g. Nairobi Central Hub" 
                            className="h-14 font-black text-white bg-white/5 border-0 focus:bg-white/10 rounded-2xl italic"
                            value={form.name}
                            onChange={e => setForm({...form, name: e.target.value})}
                          />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1 flex items-center gap-2 italic">
                             <MapPin size={12} /> Physical Address / Location
                          </Label>
                          <Input 
                            placeholder="Street, City" 
                            className="h-14 font-black text-white bg-white/5 border-0 focus:bg-white/10 rounded-2xl italic"
                            value={form.location}
                            onChange={e => setForm({...form, location: e.target.value})}
                          />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1 flex items-center gap-2 italic">
                             <ShieldCheck size={12} /> KRA Compliance PIN
                          </Label>
                          <Input 
                            placeholder="P05XXXXXXXX" 
                            className="h-14 font-black text-white bg-white/5 border-0 focus:bg-white/10 rounded-2xl italic uppercase"
                            value={form.kra_pin}
                            onChange={e => setForm({...form, kra_pin: e.target.value})}
                          />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1 flex items-center gap-2 italic">
                             <FileCheck size={12} /> Pharmacy License Number (PPB)
                          </Label>
                          <Input 
                            placeholder="PPB-2026-XXXX" 
                            className="h-14 font-black text-white bg-white/5 border-0 focus:bg-white/10 rounded-2xl italic uppercase"
                            value={form.license_number}
                            onChange={e => setForm({...form, license_number: e.target.value})}
                          />
                       </div>
                       <div className="md:col-span-2 space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1 flex items-center gap-2 italic">
                             <Zap size={12} /> Subscription Plan
                          </Label>
                          <Select 
                            value={form.tier_id} 
                            onValueChange={val => setForm({...form, tier_id: val})}
                          >
                             <SelectTrigger className="h-16 rounded-3xl bg-white/5 border-2 border-primary/10 text-white font-black text-base italic">
                                <SelectValue placeholder="SELECT SUBSCRIPTION PLAN" />
                             </SelectTrigger>
                             <SelectContent className="bg-[#0B0E14] border-white/10 rounded-2xl">
                                {tiers.map(t => (
                                   <SelectItem key={t.id} value={t.id} className="h-12 font-black italic text-white focus:bg-primary focus:text-black rounded-lg m-1">
                                      {t.name.toUpperCase()} (KSh {t.price.toLocaleString()} / {t.duration_days} Days)
                                   </SelectItem>
                                ))}
                                {tiers.length === 0 && (
                                   <div className="p-4 text-[10px] font-black uppercase text-red-500 text-center italic">
                                      <ShieldAlert size={14} className="mx-auto mb-2" />
                                      Warning: No Subscription Plans Defined.
                                   </div>
                                )}
                             </SelectContent>
                          </Select>
                       </div>
                    </div>
                 ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 animate-in slide-in-from-left-4 duration-500">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1 flex items-center gap-2 italic">
                             <User size={12} /> Pharmacy Owner Name
                          </Label>
                          <Input 
                            placeholder="Full Legal Name" 
                            className="h-14 font-black text-white bg-white/5 border-0 focus:bg-white/10 rounded-2xl italic"
                            value={form.ownerName}
                            onChange={e => setForm({...form, ownerName: e.target.value})}
                          />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1 flex items-center gap-2 italic">
                             <Mail size={12} /> Primary Admin Email
                          </Label>
                          <Input 
                            placeholder="admin@pharmacy.com" 
                            className="h-14 font-black text-white bg-white/5 border-0 focus:bg-white/10 rounded-2xl italic"
                            value={form.ownerEmail}
                            onChange={e => setForm({...form, ownerEmail: e.target.value})}
                          />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1 flex items-center gap-2 italic">
                             <Phone size={12} /> Contact Phone Number
                          </Label>
                          <Input 
                            placeholder="+254 7XX XXX XXX" 
                            className="h-14 font-black text-white bg-white/5 border-0 focus:bg-white/10 rounded-2xl italic"
                            value={form.ownerPhone}
                            onChange={e => setForm({...form, ownerPhone: e.target.value})}
                          />
                       </div>
                       <div className="space-y-2 p-8 rounded-3xl bg-primary/5 border border-primary/10 flex flex-col justify-center">
                          <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Security Auto-Pilot</p>
                          <p className="text-xs font-bold text-white italic opacity-60">
                             System will auto-generate an encrypted 8-character password for initial node access.
                          </p>
                       </div>
                    </div>
                 )}

                 <div className="flex items-center gap-4 pt-4">
                    {step > 1 && (
                      <Button onClick={() => setStep(1)} variant="outline" className="h-16 w-32 rounded-2xl border-white/5 text-muted-foreground font-black uppercase text-[10px] tracking-widest">
                         Back
                      </Button>
                    )}
                    <Button 
                      onClick={() => step === 1 ? setStep(2) : handleOnboard()}
                      disabled={onboardMutation.isPending}
                      className="flex-1 h-16 rounded-2xl bg-primary text-black font-black uppercase tracking-[0.3em] gap-3 shadow-2xl shadow-primary/30"
                    >
                       {onboardMutation.isPending ? <Loader2 className="animate-spin" /> : step === 1 ? 'Continue to Step 02' : 'Complete Registration'}
                       <ArrowRight size={18} />
                    </Button>
                 </div>
              </CardContent>
           </Card>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-30">
              <div className="flex items-start gap-4 p-8 rounded-[2rem] border border-white/5">
                 <Lock size={20} className="text-primary mt-1" />
                 <p className="text-[10px] font-black text-muted-foreground uppercase leading-relaxed tracking-widest">
                    Data is isolated per branch. Your information is securely stored and never shared between branches.
                 </p>
              </div>
              <div className="flex items-start gap-4 p-8 rounded-[2rem] border border-white/5">
                 <ShieldAlert size={20} className="text-primary mt-1" />
                 <p className="text-[10px] font-black text-muted-foreground uppercase leading-relaxed tracking-widest">
                    The PPB License and KRA PIN are validated against the local forensic ledger for compliance verification during onboarding.
                 </p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
