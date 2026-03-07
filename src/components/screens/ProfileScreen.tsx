import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, Share2, Users, ChevronRight, Settings, Globe, Bell, Shield, LogOut, Crown, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [referralCount, setReferralCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchWithdrawals();
      fetchReferrals();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
    if (data) setProfile(data);
  };

  const fetchWithdrawals = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);
    if (data) setWithdrawals(data);
  };

  const fetchReferrals = async () => {
    if (!user) return;
    const { data } = await supabase.from("referrals").select("id").eq("referrer_id", user.id);
    if (data) setReferralCount(data.length);
  };

  const referralLink = profile?.referral_code ? `t.me/earnbot?ref=${profile.referral_code}` : "Loading...";
  const username = profile?.username ?? user?.email?.split("@")[0] ?? "User";
  const level = profile?.level ?? 1;
  const streakDays = profile?.streak_days ?? 0;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied!");
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      {/* Profile Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-2xl">
          {username[0]?.toUpperCase() ?? "👤"}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-display font-bold text-foreground">{username}</h1>
            <Crown className="h-4 w-4 text-warning" />
          </div>
          <p className="text-xs text-muted-foreground">Level {level} • {user?.email}</p>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3 text-earn" />
            <span className="text-[10px] text-earn">Active streak: {streakDays} days</span>
          </div>
        </div>
      </div>

      {/* Referral Card */}
      <div className="glass rounded-xl p-4 border border-primary/20">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Invite & Earn</span>
        </div>
        <div className="glass rounded-lg p-3 flex items-center gap-2 mb-3">
          <p className="text-xs text-muted-foreground flex-1 truncate font-mono">{referralLink}</p>
          <button onClick={copyLink} className="text-primary"><Copy className="h-4 w-4" /></button>
          <button className="text-primary"><Share2 className="h-4 w-4" /></button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          {referralCount} referrals • Earn up to 10% from your referrals' earnings
        </p>
      </div>

      {/* Withdrawal History */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Withdrawal History</h3>
        <div className="space-y-2">
          {withdrawals.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No withdrawals yet</p>
          ) : (
            withdrawals.map((w) => (
              <div key={w.id} className="glass rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">{w.amount} EARN</p>
                  <p className="text-[10px] text-muted-foreground">{w.method} • {new Date(w.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  w.status === "completed" ? "bg-earn/20 text-earn" : w.status === "pending" ? "bg-warning/20 text-warning" : "bg-destructive/20 text-destructive"
                }`}>{w.status}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground mb-2">Settings</h3>
        {[
          { icon: Globe, label: "Language", value: "English" },
          { icon: Bell, label: "Notifications", value: "On" },
          { icon: Shield, label: "Security", value: "" },
        ].map((item) => (
          <button
            key={item.label}
            className="glass rounded-lg p-3 w-full flex items-center gap-3 hover:bg-secondary/50 transition-colors"
          >
            <item.icon className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm text-left text-foreground">{item.label}</span>
            {item.value && <span className="text-xs text-muted-foreground">{item.value}</span>}
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
        <button
          onClick={handleLogout}
          className="glass rounded-lg p-3 w-full flex items-center gap-3 hover:bg-secondary/50 transition-colors"
        >
          <LogOut className="h-4 w-4 text-destructive" />
          <span className="flex-1 text-sm text-left text-destructive">Logout</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};

export default ProfileScreen;
