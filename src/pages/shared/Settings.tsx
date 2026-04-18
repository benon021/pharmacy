import { useState } from "react";
import { localDb, User } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User as UserIcon, Shield, Camera, Mail, Lock, 
  CheckCircle, Loader2, Key, Bell, CreditCard,
  ShieldAlert, History, UserCircle
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Settings() {
  const user = localDb.auth.getSession();
  const [saving, setSaving] = useState(false);
  
  // Profile State
  const [profile, setProfile] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    avatar_url: user?.avatar_url || null
  });

  // Security State
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  if (!user) return null;

  const handleProfileSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800)); // Sim delay
    
    const { error } = localDb.auth.update(user.id, profile);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Profile identity updated successfully");
      // Force UI refresh by updating session in place if needed (done in db already)
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwords.new.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    
    const { error } = localDb.auth.changePassword(user.id, passwords.current, passwords.new);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password changed securely. Admins have been notified.");
      setPasswords({ current: "", new: "", confirm: "" });
    }
    setSaving(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error("Image too large. Max 1MB for local storage.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, avatar_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-primary font-semibold text-sm">
          <Shield className="h-4 w-4" />
          Account & Protocol
        </div>
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent italic">
          User Settings
        </h1>
        <p className="text-muted-foreground">Manage your pharmacy identity, security credentials, and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-card dark:bg-white/5 border border-border dark:border-white/10 p-1 h-14 rounded-2xl mb-8">
          <TabsTrigger value="profile" className="rounded-xl px-8 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold flex gap-2 transition-all">
            <UserIcon className="h-4 w-4" /> Identity
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl px-8 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold flex gap-2 transition-all">
            <Lock className="h-4 w-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-xl px-8 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold flex gap-2 transition-all">
            <Bell className="h-4 w-4" /> Alerts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
          <div className="grid gap-8 md:grid-cols-3">
            {/* Avatar Section */}
            <div className="md:col-span-1 space-y-4">
              <div className="premium-card flex flex-col items-center gap-6 py-12">
                <div className="relative group">
                  <div className="h-40 w-40 rounded-[2.5rem] bg-gradient-to-tr from-primary/20 to-accent/20 border-2 border-dashed border-white/20 p-2 overflow-hidden shadow-2xl transition-all group-hover:border-primary/50">
                    <div className="h-full w-full rounded-[1.8rem] bg-[#0B0E14] flex items-center justify-center overflow-hidden">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="DP" className="h-full w-full object-cover" />
                      ) : (
                        <UserCircle className="h-20 w-20 text-foreground dark:text-white/10" />
                      )}
                    </div>
                  </div>
                  <label className="absolute -bottom-2 -right-2 h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-xl cursor-pointer hover:scale-110 transition-transform glow-primary border-4 border-[#0B0E14]">
                    <Camera className="h-5 w-5" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                  </label>
                </div>
                <div className="text-center space-y-1">
                  <h3 className="font-bold text-foreground dark:text-white text-lg">{profile.full_name}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black">{user.role}</p>
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="md:col-span-2 space-y-6">
              <div className="premium-card space-y-8">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Administrative Name</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                      <Input 
                        className="pl-12 h-12 rounded-xl bg-card dark:bg-white/5 border-border dark:border-white/10 text-foreground dark:text-white font-bold transition-all focus:bg-white/10"
                        value={profile.full_name}
                        onChange={e => setProfile({...profile, full_name: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contact Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                      <Input 
                        disabled
                        className="pl-12 h-12 rounded-xl bg-card dark:bg-white/5 border-border dark:border-white/10 text-foreground dark:text-white/40 font-bold transition-all cursor-not-allowed opacity-60"
                        value={profile.email}
                      />
                    </div>
                    <p className="text-[9px] text-primary/60 font-medium px-1 italic">Email changes require Super Admin approval</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <History className="h-4 w-4 opacity-40" />
                    <p className="text-xs">Identifiable changes are logged for system audit</p>
                  </div>
                  <Button 
                    onClick={handleProfileSave} 
                    disabled={saving}
                    className="h-12 rounded-xl px-12 shadow-xl shadow-primary/20 font-black bg-primary text-primary-foreground hover:scale-105 transition-all"
                  >
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sync Identity
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security" className="animate-in slide-in-from-bottom-2 duration-300">
          <div className="max-w-2xl space-y-6">
            <div className="premium-card space-y-8">
              <div className="flex items-center gap-3 text-red-400">
                <ShieldAlert className="h-5 w-5" />
                <h3 className="font-bold text-lg">Credential Renewal</h3>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Current Authentication Key</Label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                    <Input 
                      type="password"
                      className="pl-12 h-12 rounded-xl bg-card dark:bg-white/5 border-border dark:border-white/10 text-foreground dark:text-white font-bold"
                      value={passwords.current}
                      onChange={e => setPasswords({...passwords, current: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">New Security Phrase</Label>
                    <Input 
                      type="password"
                      className="h-12 rounded-xl bg-card dark:bg-white/5 border-border dark:border-white/10 text-foreground dark:text-white font-bold"
                      value={passwords.new}
                      onChange={e => setPasswords({...passwords, new: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Confirm New Phrase</Label>
                    <Input 
                      type="password"
                      className="h-12 rounded-xl bg-card dark:bg-white/5 border-border dark:border-white/10 text-foreground dark:text-white font-bold"
                      value={passwords.confirm}
                      onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-4">
                <Shield className="h-6 w-6 text-primary mt-1" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground dark:text-white">Advanced Security Protocol</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Updating your password will invalidate existing session keys and notify system administrators. Ensure your new phrase exceeds 12 characters for maximum encryption strength.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border dark:border-white/5 flex justify-end">
                <Button 
                  onClick={handleChangePassword}
                  disabled={saving}
                  className="h-12 rounded-xl px-12 shadow-xl shadow-red-500/20 font-black bg-red-500 text-foreground dark:text-white hover:bg-red-600 transition-all"
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Finalize Credential Change
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="animate-in slide-in-from-bottom-2 duration-300">
          <div className="premium-card">
             <div className="flex flex-col items-center py-20 text-center space-y-4">
                <Bell className="h-16 w-16 text-muted-foreground/10" />
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-foreground dark:text-white">Alert Preferences</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">Configuring real-time system alerts via WebSocket and Telegram. This module is undergoing calibration.</p>
                </div>
                <Button disabled className="h-12 rounded-xl bg-card dark:bg-white/5 text-muted-foreground border-border dark:border-white/10 cursor-not-allowed">
                  Under Configuration
                </Button>
             </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
