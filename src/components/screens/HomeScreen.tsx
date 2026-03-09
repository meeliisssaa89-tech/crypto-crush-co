import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Gift, Box, Zap, Trophy, Clock, ChevronRight, Star, Send, Calendar, X, ChevronDown, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTG } from "@/components/layout/TelegramProvider";
import { hapticFeedback, openTelegramLink } from "@/hooks/useTelegram";
import SpinWheel from "@/components/modals/SpinWheel";
import MysteryBox from "@/components/modals/MysteryBox";
import DailyBonus from "@/components/modals/DailyBonus";
import { toast } from "sonner";

const HomeScreen = () => {
  const { user } = useAuth();
  const { isTelegram, user: tgUser } = useTG();
  const [profile, setProfile] = useState<any>(null);
  const [showSpin, setShowSpin] = useState(false);
  const [showMystery, setShowMystery] = useState(false);
  const [showDaily, setShowDaily] = useState(false);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [allActivity, setAllActivity] = useState<any[]>([]);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [limitedOfferTimer, setLimitedOfferTimer] = useState(9252);
  const [completedToday, setCompletedToday] = useState(0);
  const [tickerConfig, setTickerConfig] = useState({ points_usd_rate: 0.001, ticker_enabled: true });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchActivity();
      fetchTodayTasks();
    }
    fetchTickerConfig();
  }, [user]);

  const fetchTickerConfig = async () => {
    const { data } = await supabase.from("app_settings").select("*").eq("key", "ticker_config").single();
    if (data?.value && typeof data.value === "object") {
      setTickerConfig(prev => ({ ...prev, ...(data.value as any) }));
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setLimitedOfferTimer(prev => prev > 0 ? prev - 1 : 86400);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
    if (data) setProfile(data);
  };

  const fetchActivity = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);
    if (data) setRecentActivity(data);
  };

  const fetchAllActivity = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setAllActivity(data);
  };

  const fetchTodayTasks = async () => {
    if (!user) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from("user_tasks")
      .select("id")
      .eq("user_id", user.id)
      .gte("completed_at", today.toISOString());
    if (data) setCompletedToday(data.length);
  };

  const handleViewAll = () => {
    hapticFeedback.impact("light");
    fetchAllActivity();
    setShowAllActivity(true);
  };

  const handleInviteFriend = () => {
    hapticFeedback.impact("medium");
    if (isTelegram && profile?.referral_code) {
      const botUrl = `https://t.me/share/url?url=https://t.me/Eg_Token_bot?start=${profile.referral_code}&text=Join%20CryptoMaine%20and%20earn%20crypto!%20🚀`;
      openTelegramLink(botUrl);
    } else if (profile?.referral_code) {
      navigator.clipboard.writeText(`https://t.me/Eg_Token_bot?start=${profile.referral_code}`);
      toast.success("Referral link copied!");
    }
  };

  const streakDays = profile?.streak_days ?? 0;
  const totalStreakDays = 7;
  const username = profile?.username ?? tgUser?.first_name ?? user?.email?.split("@")[0] ?? "User";
  const level = profile?.level ?? 1;
  const xp = profile?.xp ?? 0;

  const formatTimer = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "spin_reward": return "🎰";
      case "box_reward": return "📦";
      case "daily_bonus": return "📅";
      case "task_reward": return "✅";
      case "referral_reward": return "👥";
      default: return "🪙";
    }
  };

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="text-xl font-display font-bold text-foreground">
            {tgUser?.first_name || username}
            {tgUser?.is_premium && <span className="ml-1 text-warning">⭐</span>}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="glass rounded-full px-3 py-1.5 flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-warning" />
            <span className="text-sm font-semibold text-foreground">{streakDays}</span>
          </div>
        </div>
      </div>

      {/* Balance Card */}
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="gradient-primary rounded-2xl p-5 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />

        {/* Price Ticker Ribbon */}
        {tickerConfig.ticker_enabled && (
          <div className="absolute top-0 left-0 z-10">
            <div
              className="bg-white/15 backdrop-blur-sm px-4 py-1 pr-6"
              style={{
                clipPath: "polygon(0 0, 100% 0, 85% 100%, 0 100%)",
                minWidth: "140px",
              }}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-white/60 uppercase tracking-wider">1 XP</span>
                <span className="text-[10px] font-bold text-white">= ${tickerConfig.points_usd_rate}</span>
                <TrendingUp className="h-2.5 w-2.5 text-emerald-300" />
              </div>
            </div>
          </div>
        )}

        <p className="text-sm text-white/70 mb-1 mt-2">Level {level}</p>
        <h2 className="text-3xl font-display font-bold text-white mb-1">{xp.toLocaleString()} XP</h2>
        {tickerConfig.ticker_enabled && (
          <p className="text-[10px] text-white/50 mb-2">≈ ${(xp * tickerConfig.points_usd_rate).toFixed(2)} USD</p>
        )}
        <div className="flex gap-4">
          <div>
            <p className="text-[10px] text-white/50 uppercase tracking-wider">Streak</p>
            <p className="text-sm font-semibold text-white">{streakDays} days</p>
          </div>
          <div>
            <p className="text-[10px] text-white/50 uppercase tracking-wider">Level</p>
            <p className="text-sm font-semibold text-white">{level}</p>
          </div>
          <div>
            <p className="text-[10px] text-white/50 uppercase tracking-wider">Today</p>
            <p className="text-sm font-semibold text-white">{completedToday} tasks</p>
          </div>
        </div>
      </motion.div>

      {/* Daily Streak */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-warning" />
            <span className="text-sm font-semibold text-foreground">Daily Streak</span>
          </div>
          <span className="text-xs text-muted-foreground">{streakDays}/{totalStreakDays} days</span>
        </div>
        <Progress value={(streakDays / totalStreakDays) * 100} className="h-2 bg-muted" />
        <div className="flex justify-between mt-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${
                i < streakDays
                  ? "gradient-primary text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { hapticFeedback.impact("light"); setShowSpin(true); }}
          className="glass rounded-xl p-3 flex flex-col items-center gap-2"
        >
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
            <Star className="h-5 w-5 text-white" />
          </div>
          <span className="text-[10px] font-medium text-foreground">Spin</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { hapticFeedback.impact("light"); setShowMystery(true); }}
          className="glass rounded-xl p-3 flex flex-col items-center gap-2"
        >
          <div className="w-10 h-10 gradient-warning rounded-xl flex items-center justify-center">
            <Box className="h-5 w-5 text-white" />
          </div>
          <span className="text-[10px] font-medium text-foreground">Mystery</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { hapticFeedback.impact("light"); setShowDaily(true); }}
          className="glass rounded-xl p-3 flex flex-col items-center gap-2"
        >
          <div className="w-10 h-10 gradient-earn rounded-xl flex items-center justify-center">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <span className="text-[10px] font-medium text-foreground">Daily</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleInviteFriend}
          className="glass rounded-xl p-3 flex flex-col items-center gap-2"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent/20">
            <Send className="h-5 w-5 text-accent" />
          </div>
          <span className="text-[10px] font-medium text-foreground">Invite</span>
        </motion.button>
      </div>

      {/* Limited Offer FOMO */}
      <motion.div
        animate={{ boxShadow: ["0 0 20px hsl(262 83% 58% / 0.2)", "0 0 40px hsl(262 83% 58% / 0.4)", "0 0 20px hsl(262 83% 58% / 0.2)"] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="glass rounded-xl p-4 border border-primary/30"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-warning" />
            <span className="text-sm font-semibold text-foreground">Limited Offer</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-warning">
            <Clock className="h-3 w-3" />
            <span>{formatTimer(limitedOfferTimer)}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1 mb-3">Complete 3 tasks & earn 2x rewards!</p>
        <Progress value={(completedToday / 3) * 100} className="h-1.5 bg-muted" />
        <p className="text-[10px] text-muted-foreground mt-1">{Math.min(completedToday, 3)}/3 completed</p>
      </motion.div>

      {/* Milestone Progress */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Level Progress</span>
          </div>
          <span className="text-xs gradient-text font-bold">Lv. {level}</span>
        </div>
        <Progress value={(xp % 1000) / 10} className="h-2 bg-muted" />
        <p className="text-[10px] text-muted-foreground mt-1">{xp} / {level * 1000} XP to Level {level + 1}</p>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-foreground">Recent Activity</span>
          <button onClick={handleViewAll} className="text-xs text-primary flex items-center gap-0.5">
            View all <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="space-y-2">
          {recentActivity.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No activity yet. Complete tasks to earn!</p>
          ) : (
            recentActivity.map((item) => (
              <div key={item.id} className="glass rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getTypeIcon(item.type)}</span>
                  <div>
                    <p className="text-sm text-foreground">{item.description || item.type}</p>
                    <p className="text-[10px] text-muted-foreground">{formatTime(item.created_at)}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-earn">+{item.amount} coins</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* View All Activity Drawer */}
      <AnimatePresence>
        {showAllActivity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowAllActivity(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="absolute bottom-0 left-0 right-0 max-h-[80vh] bg-background border-t border-border rounded-t-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">All Activity</h3>
                <button onClick={() => setShowAllActivity(false)} className="p-1 rounded-lg hover:bg-muted">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[calc(80vh-56px)] p-4 space-y-2">
                {allActivity.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">No activity yet.</p>
                ) : (
                  allActivity.map((item) => (
                    <div key={item.id} className="glass rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getTypeIcon(item.type)}</span>
                        <div>
                          <p className="text-sm text-foreground">{item.description || item.type}</p>
                          <p className="text-[10px] text-muted-foreground">{formatTime(item.created_at)}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-earn">+{item.amount} coins</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SpinWheel open={showSpin} onOpenChange={setShowSpin} />
      <MysteryBox open={showMystery} onOpenChange={setShowMystery} />
      <DailyBonus open={showDaily} onOpenChange={setShowDaily} />
    </div>
  );
};

export default HomeScreen;
