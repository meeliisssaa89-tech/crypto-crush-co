import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, Share2, Users, Crown, TrendingUp, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTG } from "@/components/layout/TelegramProvider";
import { hapticFeedback, openTelegramLink, isTelegramEnvironment } from "@/hooks/useTelegram";
import { toast } from "sonner";

const ProfileScreen = () => {
  const { user } = useAuth();
  const { isTelegram, user: tgUser } = useTG();
  const [profile, setProfile] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [referralCount, setReferralCount] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchWithdrawals();
      fetchReferrals();
      fetchTotalEarned();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
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

  const fetchTotalEarned = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", user.id)
      .gt("amount", 0);
    if (data) setTotalEarned(data.reduce((sum, t) => sum + Number(t.amount), 0));
  };

  const botName = "Eg_Token_bot";
  const referralCode = profile?.referral_code ?? "";
  const referralLink = `https://t.me/${botName}?startapp=${referralCode}`;
  const avatarUrl = profile?.avatar_url || tgUser?.photo_url;
  const username = profile?.username ?? tgUser?.first_name ?? tgUser?.username ?? "User";
  const telegramUsername = tgUser?.username || profile?.username;
  const level = profile?.level ?? 1;
  const streakDays = profile?.streak_days ?? 0;

  const copyLink = () => {
    hapticFeedback.notification("success");
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied!");
  };

  const shareViaTelegram = () => {
    hapticFeedback.impact("medium");
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent("Join CryptoMaine and earn crypto! 🚀💰")}`;
    if (isTelegram) {
      openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, "_blank");
    }
  };

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      {/* Profile Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-2xl overflow-hidden">
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            username[0]?.toUpperCase() ?? "👤"
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-display font-bold text-foreground">{username}</h1>
            {tgUser?.is_premium && <Crown className="h-4 w-4 text-warning" />}
          </div>
          <p className="text-xs text-muted-foreground">
            Level {level} {telegramUsername ? `• @${telegramUsername}` : ""}
          </p>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-earn" />
              <span className="text-[10px] text-earn">{streakDays} day streak</span>
            </div>
            <span className="text-[10px] text-muted-foreground">•</span>
            <span className="text-[10px] text-muted-foreground">{totalEarned.toLocaleString()} earned</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Level", value: level.toString(), icon: "🏆" },
          { label: "Referrals", value: referralCount.toString(), icon: "👥" },
          { label: "Streak", value: `${streakDays}d`, icon: "🔥" },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-3 text-center">
            <span className="text-lg">{stat.icon}</span>
            <p className="text-sm font-bold text-foreground">{stat.value}</p>
            <p className="text-[9px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Referral Card */}
      <div className="glass rounded-xl p-4 border border-primary/20">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Invite & Earn</span>
        </div>
        <div className="glass rounded-lg p-3 flex items-center gap-2 mb-3">
          <p className="text-xs text-muted-foreground flex-1 truncate font-mono">{referralCode ? referralLink : "Loading..."}</p>
          <button onClick={copyLink} className="text-primary"><Copy className="h-4 w-4" /></button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={shareViaTelegram}
            className="flex-1 glass rounded-lg p-2.5 flex items-center justify-center gap-2 text-xs font-medium text-foreground hover:bg-secondary/50 transition-colors"
          >
            <Send className="h-3.5 w-3.5 text-accent" />
            Share via Telegram
          </button>
          <button
            onClick={copyLink}
            className="flex-1 glass rounded-lg p-2.5 flex items-center justify-center gap-2 text-xs font-medium text-foreground hover:bg-secondary/50 transition-colors"
          >
            <Copy className="h-3.5 w-3.5 text-primary" />
            Copy Link
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-3">
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
                  <p className="text-sm text-foreground">{w.amount} XP</p>
                  <p className="text-[10px] text-muted-foreground">{w.method} • {new Date(w.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  w.status === "completed" || w.status === "approved" ? "bg-earn/20 text-earn" : w.status === "pending" ? "bg-warning/20 text-warning" : "bg-destructive/20 text-destructive"
                }`}>{w.status}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
