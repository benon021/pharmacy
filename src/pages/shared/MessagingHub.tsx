import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { localDb } from "@/lib/db";
import { useQuery } from "@tanstack/react-query";
import { 
  MessageSquare, 
  Send, 
  ShieldCheck, 
  Zap, 
  Clock, 
  CheckCircle2,
  Building2,
  Bell,
  User as UserIcon,
  Search,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function MessagingHub() {
  const { user, role } = useAuth();
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: tickets = [], isLoading: ticketsLoading, refetch: refetchTickets } = useQuery({
    queryKey: ["support-tickets", user?.id, role],
    queryFn: async () => {
       const all = await localDb.tickets.getAll();
       if (role === 'super_admin') return all;
       if (role === 'admin') {
         // Admins see everything in their pharmacy
         return all.filter((t: any) => t.pharmacy_id === user?.pharmacy_id);
       }
       // Sellers only see their own
       return all.filter((t: any) => t.user_id === user?.id);
    },
  });

  const { data: announcements = [], isLoading: announcementsLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => localDb.announcements.getAll(),
  });

  const handleSendMessage = async () => {
    if (!message || !subject) {
      toast.error("Transmission rejected. Missing data.");
      return;
    }

    setSubmitting(true);
    try {
      await localDb.tickets.create(subject, message);
      toast.success("Uplink established successfully.");
      setMessage("");
      setSubject("");
      refetchTickets();
    } catch (err) {
      toast.error("Signal failure.");
    } finally {
      setSubmitting(false);
    }
  };

  if (ticketsLoading || announcementsLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
          Uplink <span className="text-primary italic underline decoration-primary/20 underline-offset-8">Hub</span>
        </h1>
        <p className="text-muted-foreground font-medium italic opacity-60">Unified coordination and support channel.</p>
      </div>

      <Tabs defaultValue="tickets" className="space-y-8">
        <TabsList className="bg-white/5 border border-white/10 p-1.5 h-14 rounded-2xl w-fit">
          <TabsTrigger value="tickets" className="rounded-xl px-8 h-full font-black uppercase text-[10px] tracking-widest flex gap-3">
             <MessageSquare size={14} /> Messages
          </TabsTrigger>
          <TabsTrigger value="announcements" className="rounded-xl px-8 h-full font-black uppercase text-[10px] tracking-widest flex gap-3">
             <Bell size={14} /> Announcements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1 space-y-6">
            <Card className="glass-card p-6 border-t-primary/40">
              <CardHeader className="p-0 mb-6">
                 <CardTitle className="text-xl font-black italic uppercase text-white">New Transmission</CardTitle>
                 <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    Contact {role === 'seller' ? 'Pharmacy Administration' : 'Enterprise Command'}
                 </CardDescription>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                 <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-primary/60 ml-1">Subject</label>
                    <Input 
                      placeholder="Transmission topic..."
                      className="bg-black/40 border-white/5 h-12 rounded-xl text-xs font-bold"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                    />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-primary/60 ml-1">Message Body</label>
                    <textarea 
                      placeholder="Detail your request..."
                      className="w-full bg-black/40 border border-white/5 rounded-xl text-xs font-medium p-4 h-32 outline-none focus:border-primary/40 transition-all italic"
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                    />
                 </div>
                 <Button 
                   onClick={handleSendMessage}
                   disabled={submitting}
                   className="w-full h-14 bg-primary text-black font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-primary/10 group"
                 >
                    {submitting ? <Clock className="animate-spin" /> : <Send size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                    Establish Uplink
                 </Button>
              </CardContent>
            </Card>

            <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 space-y-3">
               <div className="flex items-center gap-2 text-primary">
                  <ShieldCheck size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Secure Handshake</span>
               </div>
               <p className="text-[9px] font-medium text-muted-foreground/80 leading-relaxed italic">
                  Priority tickets are reviewed instantly. Normal response time is under 15 minutes.
               </p>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
             <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white italic">Transmission Log</h3>
                <Badge variant="outline" className="border-white/10 text-[9px] uppercase tracking-widest font-black opacity-40">
                   {tickets.length} Records
                </Badge>
             </div>

             <div className="grid gap-4">
                {tickets.length === 0 ? (
                  <div className="py-20 text-center glass-card border-dashed flex flex-col items-center gap-4 opacity-30">
                     <Clock size={32} />
                     <p className="text-[10px] font-black uppercase tracking-widest">No previous uplinks found</p>
                  </div>
                ) : tickets.map((t: any) => (
                  <Card key={t.id} className="glass-card hover:border-primary/20 transition-all group overflow-hidden">
                     <div className="h-1 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                     <CardHeader className="p-6 flex flex-row items-start justify-between">
                        <div className="flex items-start gap-4">
                           <div className={cn(
                             "h-10 w-10 rounded-xl flex items-center justify-center border transition-all",
                             t.status === 'open' ? 'bg-primary/10 border-primary/20 text-primary glow-primary' : 'bg-white/5 border-white/5 text-muted-foreground'
                           )}>
                              <MessageSquare size={18} />
                           </div>
                           <div>
                              <CardTitle className="text-md font-black italic uppercase text-white tracking-tight">{t.subject}</CardTitle>
                              <div className="flex items-center gap-3 mt-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                                 <span>Sent: {new Date(t.created_at).toLocaleString()}</span>
                                 <span className={cn(
                                   "px-2 py-0.5 rounded-full",
                                   t.status === 'open' ? 'text-primary' : 'text-emerald-500'
                                 )}>• {t.status.toUpperCase()}</span>
                              </div>
                           </div>
                        </div>
                     </CardHeader>
                     <CardContent className="px-6 pb-6 pt-0">
                        <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-xs font-medium italic text-muted-foreground leading-relaxed">
                           {t.message}
                        </div>
                     </CardContent>
                  </Card>
                ))}
             </div>
          </div>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {announcements.length === 0 ? (
                <div className="col-span-full py-40 text-center opacity-20 flex flex-col items-center gap-4">
                   <Bell size={64} />
                   <p className="text-lg font-black uppercase tracking-[0.5em] italic">No Broadcasts Active</p>
                </div>
              ) : announcements.map((a: any) => (
                <Card key={a.id} className="glass-card p-8 space-y-4 hover:-translate-y-1 transition-transform relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-2 opacity-5">
                      <Zap size={80} className="text-primary" />
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                         <Zap size={20} />
                      </div>
                      <div className="flex flex-col">
                         <h4 className="font-black italic uppercase tracking-tighter text-white">{a.title}</h4>
                         <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">{new Date(a.created_at).toLocaleDateString()}</span>
                      </div>
                   </div>
                   <p className="text-xs font-medium italic text-muted-foreground leading-loose">{a.message}</p>
                   <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                      <Badge variant="outline" className="border-white/10 text-[8px] uppercase tracking-widest font-black opacity-30">
                         System Broadcast
                      </Badge>
                      <span className="text-[8px] font-bold text-primary italic uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Protocol Alpha</span>
                   </div>
                </Card>
              ))}
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
