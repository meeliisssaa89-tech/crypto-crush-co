import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Gift, Clock, Trophy, ChevronRight, Coins, Target, TrendingUp, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { hapticFeedback } from "@/hooks/useTelegram";
import { toast } from "sonner";

const AirdropScreen = () => {
  const { user } = useAuth();
  const [airdrop, setAirdrop] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    // Fetch or create airdrop record
    let { data: ad } = await supabase.from("airdrops").select("*").eq("user_id", user.id).single();
    if (!ad) {
      // Calculate from transactions
      const { data: txs } = await supabase.from("transactions").select("amount").eq("user_id", user.id).gt("amount", 0);
      const totalEarned = txs?.reduce((s, t) => s + Number(t.amount), 0) ?? 0;
      const tokensEarned = Math.floor(totalEarned * 0.5);

      const { data: newAd } = await supabase.from("airdrops").insert({
        user_id: user.id,
        tokens_earned: tokensEarned,
        tokens_claimed: 0,
        tokens_locked: Math.floor(tokensEarned * 0.7),
      }).select().single();
      ad = newAd;
    }
    if (ad) setAirdrop(ad);

    // Leaderboard from profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("username, xp, user_id")
      .order("xp", { ascending: false })
      .limit(5);
    if (profiles) {
      setLeaderboard(profiles.map((p, i) => ({
        rank: i + 1,
        name: p.username || "anon",
        tokens: p.xp * 5,
        avatar: ["🐋", "👑", "💎", "🚀", "💪"][i] || "🎯",
      })));
      const myIndex = profiles.findIndex(p => p.user_id === user.id);
      setUserRank(myIndex >= 0 ? myIndex + 1 : null);
    }

    setLoading(false);
  };

  const claimTokens = async () => {
    if (!user || !airdrop || claiming) return;
    const claimable = airdrop.tokens_earned - airdrop.tokens_locked - airdrop.tokens_claimed;
    if (claimable <= 0) {
      toast.error("No tokens available to claim");
      return;
    }

    setClaiming(true);
    hapticFeedback.impact("heavy");

    await supabase.from("airdrops").update({
      tokens_claimed: airdrop.tokens_claimed + claimable,
      last_claim_at: new Date().toISOString(),
    }).eq("id", airdrop.id);

    await supabase.from("transactions").insert({
      user_id: user.id,
      type: "airdrop_claim",
      amount: claimable,
      description: "Airdrop token claim",
    });

    hapticFeedback.notification("success");
    toast.success(`Claimed ${claimable.toLocaleString()} tokens! 🎉`);
    setClaiming(false);
    fetchData();
  };

  const totalTokens = airdrop?.tokens_earned ?? 0;
  const claimedTokens = airdrop?.tokens_claimed ?? 0;
  const lockedTokens = airdrop?.tokens_locked ?? 0;
  const claimableTokens = Math.max(0, totalTokens - lockedTokens - claimedTokens);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <h1 className="text-xl font-display font-bold text-foreground mb-1">Airdrop</h1>
      <p className="text-sm text-muted-foreground">Earn tokens through your activity</p>

      {/* Token Balance Card */}
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="gradient-earn rounded-2xl p-5 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
        <div className="flex items-center gap-2 mb-1">
          <Coins className="h-4 w-4 text-white/80" />
          <p className="text-sm text-white/70">Earned Tokens</p>
        </div>
        <h2 className="text-3xl font-display font-bold text-white mb-4">{totalTokens.toLocaleString()}</h2>
        <div className="flex gap-4">
          <div>
            <p className="text-[10px] text-white/50 uppercase tracking-wider">Claimable</p>
            <p className="text-sm font-semibold text-white">{claimableTokens.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] text-white/50 uppercase tracking-wider">Claimed</p>
            <p className="text-sm font-semibold text-white">{claimedTokens.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] text-white/50 uppercase tracking-wider">Locked</p>
            <p className="text-sm font-semibold text-white">{lockedTokens.toLocaleString()}</p>
          </div>
        </div>
      </motion.div>

      {/* Claim Button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={claimTokens}
        disabled={claiming || claimableTokens <= 0}
        className="w-full gradient-primary rounded-xl p-4 flex items-center justify-between animate-pulse-glow disabled:opacity-50"
      >
        <div className="text-left">
          <p className="text-sm font-bold text-white">
            {claiming ? "Claiming..." : claimableTokens > 0 ? `Claim ${claimableTokens.toLocaleString()} Tokens` : "No tokens to claim"}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <Clock className="h-3 w-3 text-white/60" />
            <p className="text-[10px] text-white/60">Earn more by completing tasks</p>
          </div>
        </div>
        {claiming ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <Gift className="h-6 w-6 text-white" />}
      </motion.button>

      {/* Activity Breakdown */}
      <div className="glass rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          Token Allocation
        </h3>
        <div className="space-y-3">
          {[
            { label: "Task Completion", value: 40, tokens: Math.floor(totalTokens * 0.4) },
            { label: "Referral Bonus", value: 25, tokens: Math.floor(totalTokens * 0.25) },
            { label: "Daily Activity", value: 20, tokens: Math.floor(totalTokens * 0.2) },
            { label: "Special Events", value: 15, tokens: Math.floor(totalTokens * 0.15) },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <span className="text-xs font-semibold text-foreground">{item.tokens.toLocaleString()}</span>
              </div>
              <Progress value={item.value} className="h-1.5 bg-muted" />
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Trophy className="h-4 w-4 text-warning" />
            Leaderboard
          </h3>
        </div>
        <div className="space-y-2">
          {leaderboard.map((u) => (
            <div key={u.rank} className="glass rounded-lg p-3 flex items-center gap-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                u.rank <= 3 ? 'gradient-primary text-white' : 'bg-muted text-muted-foreground'
              }`}>
                {u.rank}
              </span>
              <span className="text-lg">{u.avatar}</span>
              <span className="flex-1 text-sm font-medium text-foreground">{u.name}</span>
              <div className="text-right">
                <p className="text-xs font-semibold text-earn">{u.tokens.toLocaleString()}</p>
                <p className="text-[9px] text-muted-foreground">tokens</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Your Rank */}
      <div className="glass rounded-xl p-4 border border-primary/30">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Your Rank: #{userRank ?? "—"}</p>
            <p className="text-[10px] text-muted-foreground">{totalTokens.toLocaleString()} tokens earned</p>
          </div>
          <span className="text-sm font-bold gradient-text">{totalTokens.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default AirdropScreen;
