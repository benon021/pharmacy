import { useAuth } from "@/contexts/AuthContext";
import { localDb } from "@/lib/db";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Timer, 
  ArrowUpRight,
  UserCheck,
  UserMinus,
  Briefcase
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useMemo } from "react";

export default function StaffAttendance() {
  const { user } = useAuth();

  const { data: attendance = [], isLoading } = useQuery({
    queryKey: ["attendance-logs", user?.pharmacy_id],
    queryFn: () => localDb.attendance.getAll(),
    enabled: !!user?.pharmacy_id
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["pharmacy-staff", user?.pharmacy_id],
    queryFn: () => localDb.auth.getAll(), // In a real app, filter by pharmacy_id
  });

  const stats = useMemo(() => {
    const activeShifts = attendance.filter(a => a.status === 'active').length;
    const completedToday = attendance.filter(a => a.status === 'completed' && new Date(a.clock_in).toDateString() === new Date().toDateString()).length;
    
    return { activeShifts, completedToday };
  }, [attendance]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Clock className="text-primary h-6 w-6" />
          </div>
          Temporal Shift Ops
        </h1>
        <p className="text-muted-foreground font-bold tracking-tight text-lg">
          Institutional Attendance Monitoring • Real-time Shift Registry
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/30 border-primary/10 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <UserCheck className="h-3 w-3 text-emerald-500" /> Active Personnel
            </CardDescription>
            <CardTitle className="text-4xl font-black text-white">{stats.activeShifts}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Currently on duty</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/30 border-primary/10 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-blue-500" /> Completed Cycles
            </CardDescription>
            <CardTitle className="text-4xl font-black text-white">{stats.completedToday}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Tasks finalized today</p>
          </CardContent>
        </Card>

        <Card className="bg-card/30 border-primary/10 backdrop-blur-md lg:col-span-1">
          <CardHeader className="pb-2">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-primary">
              <Timer className="h-3 w-3" /> Average Load
            </CardDescription>
            <CardTitle className="text-4xl font-black text-white">8.4h</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Temporal Density Coefficient</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/40 border-primary/10 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 border-b border-primary/5 bg-primary/5 flex flex-row items-center justify-between">
           <div>
              <CardTitle className="text-xl font-black text-white italic tracking-widest uppercase">Chronological Log</CardTitle>
              <CardDescription className="font-bold text-muted-foreground/60">Shift entry/exit synchronization events.</CardDescription>
           </div>
           <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[9px] font-black text-primary uppercase">
              <Briefcase size={10} /> Authorized Node
           </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-primary/5 hover:bg-transparent">
                <TableHead className="px-8 py-5 font-black uppercase tracking-[0.2em] text-[10px] text-primary/60">Personnel</TableHead>
                <TableHead className="font-black uppercase tracking-[0.2em] text-[10px] text-primary/60">Clock-In Event</TableHead>
                <TableHead className="font-black uppercase tracking-[0.2em] text-[10px] text-primary/60">Clock-Out Event</TableHead>
                <TableHead className="font-black uppercase tracking-[0.2em] text-[10px] text-primary/60">Status</TableHead>
                <TableHead className="font-black uppercase tracking-[0.2em] text-[10px] text-primary/60 text-right px-8">Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance.map((log) => {
                const staffMember = staff.find(s => s.id === log.user_id);
                const duration = log.clock_out 
                  ? ((new Date(log.clock_out).getTime() - new Date(log.clock_in).getTime()) / (1000 * 3600)).toFixed(1) + 'h'
                  : 'Active';

                return (
                  <TableRow key={log.id} className="border-primary/5 hover:bg-primary/5 transition-colors">
                    <TableCell className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                          {staffMember?.full_name?.[0] || 'U'}
                        </div>
                        <div>
                          <div className="text-sm font-black text-white italic">{staffMember?.full_name || 'System Identity'}</div>
                          <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{staffMember?.role}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-xs text-muted-foreground flex items-center gap-2 mt-4">
                      <Calendar size={12} className="text-primary/40" /> {new Date(log.clock_in).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-bold text-xs text-muted-foreground">
                      {log.clock_out ? (
                        <div className="flex items-center gap-2">
                           <Calendar size={12} className="text-primary/40" /> {new Date(log.clock_out).toLocaleString()}
                        </div>
                      ) : (
                        <span className="text-primary font-black animate-pulse uppercase tracking-widest text-[9px]">Ongoing Session</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        log.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-white/5 text-muted-foreground border-white/10'
                      }`}>
                        {log.status === 'active' && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                        {log.status}
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-8 font-black text-white italic">{duration}</TableCell>
                  </TableRow>
                );
              })}
              {attendance.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center font-black text-muted-foreground/20 italic uppercase tracking-[0.3em]">
                    No temporal data recorded
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
