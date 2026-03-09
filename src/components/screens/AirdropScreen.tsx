import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Gift, Clock, Trophy, Coins, Target, TrendingUp, Loader2,
  Rocket, Lock, Unlock, Zap, Award, Users, ArrowUpRight, Star,
  CheckCircle2, Timer, Flame
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { hapticFeedback } from "@/hooks/useTelegram";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Sub-components
import AirdropHeroCard from "./airdrop/AirdropHeroCard";
import AirdropTokenBreakdown from "./airdrop/AirdropTokenBreakdown";
import AirdropLeaderboard from "./airdrop/AirdropLeaderboard";
import AirdropTimeline from "./airdrop/AirdropTimeline";

export interface AirdropData {
  id: string;
  tokens_earned: number;
  tokens_claimed: number;
  tokens_locked: number;
  last_claim_at: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  tokens: number;
  avatar: string;
  userId: string;
  xp: number;
  level: number;
}

const AirdropScreen = () => {
  const { user } = useAuth();
  const [airdrop, setAirdrop] = useState<AirdropData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({
    lock_percentage: 70,
    token_multiplier: 0.5,
    claim_enabled: true,
    allocations: [
      { label: "Task Completion", pct: 40 },
      { label: "Referral Bonus", pct: 25 },
      { label: "Daily Activity", pct: 20 },
      { label: "Special Events", pct: 15 },
    ],
    phases: [
      { title: "Phase 1 — Accumulation", status: "active" },
      { title: "Phase 2 — Snapshot", status: "upcoming" },
      { title: "Phase 3 — Token Generation", status: "upcoming" },
      { title: "Phase 4 — Vesting & Unlock", status: "upcoming" },
      { title: "Phase 5 — Full Distribution", status: "upcoming" },
    ],
  });

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    await Promise.all([fetchAirdrop(), fetchLeaderboard(), fetchConfig()]);
    setLoading(false);
  };

  const fetchConfig = async () => {
    const { data } = await supabase.from("app_settings").select("*").eq("key", "airdrop_config").single();
    if (data?.value && typeof data.value === "object") {
      setConfig(prev => ({ ...prev, ...(data.value as any) }));
    }
  };

  const fetchAirdrop = async () => {
    if (!user) return;
    let { data: ad } = await supabase.from("airdrops").select("*").eq("user_id", user.id).single();
    if (!ad) {
      const { data: txs } = await supabase.from("transactions").select("amount").eq("user_id", user.id).gt("amount", 0);
      const totalEarned = txs?.reduce((s, t) => s + Number(t.amount), 0) ?? 0;
      const tokensEarned = Math.floor(totalEarned * config.token_multiplier);
      const { data: newAd } = await supabase.from("airdrops").insert({
        user_id: user.id,
        tokens_earned: tokensEarned,
        tokens_claimed: 0,
        tokens_locked: Math.floor(tokensEarned * config.lock_percentage / 100),
      }).select().single();
      ad = newAd;
    }
    if (ad) setAirdrop(ad as AirdropData);
  };

  const fetchLeaderboard = async () => {
    if (!user) return;
    // Get total count
    const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true });
    setTotalParticipants(count ?? 0);

    // Top 20 leaderboard
    const { data: profiles } = await supabase
      .from("profiles")
      .select("username, xp, user_id, level, avatar_url")
      .order("xp", { ascending: false })
      .limit(20);

    if (profiles) {
      const avatars = ["🐋", "👑", "💎", "🚀", "💪", "🔥", "⚡", "🎯", "🏆", "💰", "🌟", "🎮", "🦁", "🐉", "🦅", "🎪", "🌈", "⭐", "🎲", "🏅"];
      setLeaderboard(profiles.map((p, i) => ({
        rank: i + 1,
        name: p.username || `User ${(p.user_id).slice(0, 6)}`,
        tokens: (p.xp ?? 0) * 5,
        avatar: avatars[i] || "🎯",
        userId: p.user_id,
        xp: p.xp ?? 0,
        level: p.level ?? 1,
      })));

      // Find user rank - if not in top 20, query separately
      const myIndex = profiles.findIndex(p => p.user_id === user.id);
      if (myIndex >= 0) {
        setUserRank(myIndex + 1);
      } else {
        // Count how many have more XP than current user
        const { data: myProfile } = await supabase.from("profiles").select("xp").eq("user_id", user.id).maybeSingle();
        if (myProfile) {
          const { count: above } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .gt("xp", myProfile.xp ?? 0);
          setUserRank((above ?? 0) + 1);
        }
      }
    }
  };

  const claimTokens = async () => {
    if (!user || !airdrop || claiming) return;
    if (!config.claim_enabled) {
      toast.error("Claims are currently disabled");
      return;
    }
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
      user_id: user.id, type: "airdrop_claim", amount: claimable, description: "Airdrop token claim",
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Airdrop
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Earn & claim your token rewards</p>
        </div>
        <div className="glass rounded-lg px-3 py-1.5 flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">{totalParticipants.toLocaleString()}</span>
          <span className="text-[10px] text-muted-foreground">participants</span>
        </div>
      </div>

      {/* Hero Card */}
      <AirdropHeroCard
        totalTokens={totalTokens}
        claimableTokens={claimableTokens}
        claimedTokens={claimedTokens}
        lockedTokens={lockedTokens}
        claiming={claiming}
        onClaim={claimTokens}
      />

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full bg-secondary/50 border border-border">
          <TabsTrigger value="overview" className="flex-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1">
            <Target className="h-3 w-3" />Overview
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1">
            <Trophy className="h-3 w-3" />Leaderboard
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1">
            <Clock className="h-3 w-3" />Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <AirdropTokenBreakdown totalTokens={totalTokens} allocations={config.allocations} />

          {/* Your Stats */}
          <div className="glass rounded-xl p-4 border border-primary/20">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Your Progress
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary/50 rounded-lg p-3 text-center">
                <Award className="h-5 w-5 text-warning mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">#{userRank ?? "—"}</p>
                <p className="text-[10px] text-muted-foreground">Your Rank</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3 text-center">
                <Coins className="h-5 w-5 text-earn mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{totalTokens.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Total Earned</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3 text-center">
                <Unlock className="h-5 w-5 text-accent mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{claimableTokens.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Claimable</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3 text-center">
                <Lock className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{lockedTokens.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Locked ({config.lock_percentage}%)</p>
              </div>
            </div>
          </div>

          {/* How to earn more */}
          <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Flame className="h-4 w-4 text-destructive" />
              How to Earn More
            </h3>
            <div className="space-y-2.5">
              {[
                { icon: CheckCircle2, label: "Complete daily tasks", desc: "Earn XP & boost ranking", color: "text-earn" },
                { icon: Users, label: "Invite friends", desc: "Get 10% of referral earnings", color: "text-accent" },
                { icon: Star, label: "Maintain login streak", desc: "Bonus multiplier on rewards", color: "text-warning" },
                { icon: ArrowUpRight, label: "Watch ads & shortlinks", desc: "Extra tokens per view", color: "text-primary" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 bg-secondary/30 rounded-lg p-2.5">
                  <item.icon className={`h-4 w-4 ${item.color} shrink-0`} />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-foreground">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-4">
          <AirdropLeaderboard
            leaderboard={leaderboard}
            userRank={userRank}
            totalTokens={totalTokens}
            currentUserId={user?.id ?? ""}
            totalParticipants={totalParticipants}
          />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <AirdropTimeline phases={config.phases} lockPercentage={config.lock_percentage} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AirdropScreen;
