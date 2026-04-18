import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { localDb } from "@/lib/db";
import { useQuery } from "@tanstack/react-query";
import { 
  LifeBuoy, 
  Send, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Building2,
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
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function SupportCenter() {
  const { user, role } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    message: ""
  });

  const { data: tickets = [], isLoading, refetch } = useQuery({
    queryKey: ["support-tickets", user?.id],
    queryFn: () => localDb.tickets.getAll(),
    enabled: !!user
  });

  const handleSubmit = async () => {
    if (!form.subject || !form.message) {
      toast.error("Transmission rejected. Incomplete data.");
      return;
    }

    setSubmitting(true);
    try {
      await localDb.tickets.create(form.subject, form.message);
      toast.success("Message uplink established. Super Admin notified.");
      setForm({ subject: "", message: "" });
      refetch();
    } catch (err) {
      toast.error("Signal failure. Please retry.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseTicket = async (id: string) => {
     await localDb.tickets.close(id);
     toast.success("Protocol concluded. Ticket archived.");
     refetch();
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-[0.3em] animate-pulse">
           <ShieldCheck size={12} /> Enterprise Encryption Active
        </div>
        <h1 className="text-6xl font-black tracking-tighter text-white italic uppercase py-3">
          Lumiaxy <span className="text-primary underline decoration-primary/20 underline-offset-8">Support</span> Uplink
        </h1>
        <p className="text-muted-foreground font-black text-xs uppercase tracking-[0.2em] opacity-60">
          Direct communication channel with platform command and governance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Contact Form */}
        <Card className="lg:col-span-1 bg-card/40 border-primary/20 backdrop-blur-3xl p-8 rounded-[2.5rem] relative overflow-hidden h-fit border-t-primary/40">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-transparent" />
           <CardHeader className="px-0 pt-0 pb-8 space-y-1">
              <CardTitle className="text-2xl font-black text-white italic uppercase tracking-tight">Initiate Uplink</CardTitle>
              <CardDescription className="text-muted-foreground font-bold">Encrypted message to Super Admin.</CardDescription>
           </CardHeader>
           <CardContent className="px-0 space-y-6">
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1">Transmission Subject</Label>
                 <Input 
                   placeholder="e.g. Account Billing Query" 
                   className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-black focus:border-primary placeholder:text-muted-foreground/20"
                   value={form.subject}
                   onChange={e => setForm({...form, subject: e.target.value})}
                 />
              </div>
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1">Detailed Message</Label>
                 <textarea 
                   placeholder="Describe your requirement..."
                   className="h-40 w-full rounded-2xl bg-white/5 border border-white/10 text-white font-bold p-6 outline-none focus:border-primary resize-none placeholder:text-muted-foreground/20 text-sm"
                   value={form.message}
                   onChange={e => setForm({...form, message: e.target.value})}
                 />
              </div>
              <Button 
                disabled={submitting}
                onClick={handleSubmit}
                className="w-full h-16 rounded-2xl bg-primary text-black font-black uppercase text-xs tracking-[0.2em] gap-3 shadow-2xl shadow-primary/20 group"
              >
                {submitting ? <Clock className="animate-spin" /> : <Send className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" size={18} />}
                Establish Contact
              </Button>
           </CardContent>
           
           <div className="pt-8 border-t border-white/5 mt-4 space-y-4">
              <div className="flex items-start gap-3 opacity-50">
                 <Lock size={16} className="text-primary mt-1" />
                 <p className="text-[10px] font-bold text-muted-foreground/80 leading-relaxed">
                    All support transmissions are logged in the global audit trail and secured with AES-256 equivalent local protocols.
                 </p>
              </div>
           </div>
        </Card>

        {/* Previous Tickets */}
        <div className="lg:col-span-2 space-y-6">
           <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white italic">Active Protocols</h3>
              <div className="flex items-center gap-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                 <div className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-primary" /> Open</div>
                 <div className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-white/20" /> Archived</div>
              </div>
           </div>

           {tickets.length === 0 ? (
              <Card className="bg-white/[0.02] border-white/5 p-20 text-center rounded-[2.5rem] border-dashed">
                 <div className="flex flex-col items-center gap-4 opacity-20">
                    <MessageSquare size={64} className="text-white" />
                    <p className="font-black text-sm uppercase tracking-[0.4em]">No Active Uplinks</p>
                 </div>
              </Card>
           ) : (
              <div className="grid grid-cols-1 gap-4">
                 {tickets.map((ticket) => (
                    <Card key={ticket.id} className="bg-card/40 border-white/5 hover:border-primary/20 transition-all rounded-[2rem] overflow-hidden group">
                       <CardHeader className="p-8 flex flex-row items-start justify-between">
                          <div className="flex items-start gap-4">
                             <div className={`mt-1 h-10 w-10 rounded-xl flex items-center justify-center transition-all ${
                               ticket.status === 'open' 
                               ? 'bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/10' 
                               : 'bg-white/5 text-muted-foreground border border-white/10'
                             }`}>
                                {ticket.status === 'open' ? <MessageSquare size={20} /> : <CheckCircle2 size={20} />}
                             </div>
                             <div>
                                <CardTitle className="text-lg font-black text-white italic uppercase tracking-tight">{ticket.subject}</CardTitle>
                                <div className="flex items-center gap-3 mt-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                                   <span>Sent: {new Date(ticket.created_at).toLocaleString()}</span>
                                   {role === 'super_admin' && (
                                      <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded text-primary/60">
                                         <Building2 size={10} /> Branch ID: {ticket.pharmacy_id.slice(0, 8)}...
                                      </span>
                                   )}
                                </div>
                             </div>
                          </div>
                          {ticket.status === 'open' && (
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               onClick={() => handleCloseTicket(ticket.id)}
                               className="h-10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500/10 hover:text-emerald-500 gap-2 border border-transparent hover:border-emerald-500/20"
                             >
                                Finalize
                             </Button>
                          )}
                       </CardHeader>
                       <CardContent className="px-8 pb-8 pt-0">
                          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 text-[13px] font-medium leading-relaxed italic text-muted-foreground group-hover:text-white/80 transition-colors">
                             {ticket.message}
                          </div>
                          {role === 'super_admin' && ticket.status === 'open' && (
                             <div className="mt-4 flex justify-end">
                                <Button className="h-10 rounded-xl bg-primary text-black font-black text-[9px] uppercase tracking-widest gap-2">
                                   Respond via Secure Link <ArrowRight size={12} />
                                </Button>
                             </div>
                          )}
                       </CardContent>
                    </Card>
                 ))}
              </div>
           )}
        </div>
      </div>
    </div>
  );
}
