import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flame, Gift, Box, Zap, Trophy, Clock, ChevronRight, Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import SpinWheel from "@/components/modals/SpinWheel";
import MysteryBox from "@/components/modals/MysteryBox";

const HomeScreen = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [showSpin, setShowSpin] = useState(false);
  const [showMystery, setShowMystery] = useState(false);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchActivity();
    }
  }, [user]);

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

  const streakDays = profile?.streak_days ?? 0;
  const totalStreakDays = 7;
  const username = profile?.username ?? user?.email?.split("@")[0] ?? "User";
  const level = profile?.level ?? 1;
  const xp = profile?.xp ?? 0;

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="text-xl font-display font-bold text-foreground">{username}</h1>
        </div>
        <div className="glass rounded-full px-3 py-1.5 flex items-center gap-1.5">
          <Flame className="h-4 w-4 text-warning" />
          <span className="text-sm font-semibold text-foreground">{streakDays}</span>
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
        <p className="text-sm text-white/70 mb-1">Level {level}</p>
        <h2 className="text-3xl font-display font-bold text-white mb-3">{xp.toLocaleString()} XP</h2>
        <div className="flex gap-4">
          <div>
            <p className="text-[10px] text-white/50 uppercase tracking-wider">Streak</p>
            <p className="text-sm font-semibold text-white">{streakDays} days</p>
          </div>
          <div>
            <p className="text-[10px] text-white/50 uppercase tracking-wider">Level</p>
            <p className="text-sm font-semibold text-white">{level}</p>
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
      <div className="grid grid-cols-3 gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowSpin(true)}
          className="glass rounded-xl p-3 flex flex-col items-center gap-2 relative overflow-hidden"
        >
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
            <Star className="h-5 w-5 text-white" />
          </div>
          <span className="text-[11px] font-medium text-foreground">Spin Wheel</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowMystery(true)}
          className="glass rounded-xl p-3 flex flex-col items-center gap-2 relative overflow-hidden"
        >
          <div className="w-10 h-10 gradient-warning rounded-xl flex items-center justify-center">
            <Box className="h-5 w-5 text-white" />
          </div>
          <span className="text-[11px] font-medium text-foreground">Mystery Box</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="glass rounded-xl p-3 flex flex-col items-center gap-2 relative overflow-hidden"
        >
          <div className="w-10 h-10 gradient-earn rounded-xl flex items-center justify-center">
            <Gift className="h-5 w-5 text-white" />
          </div>
          <span className="text-[11px] font-medium text-foreground">Daily Bonus</span>
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
            <span>02:34:12</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1 mb-3">Complete 3 tasks & earn 2x rewards!</p>
        <Progress value={33} className="h-1.5 bg-muted" />
        <p className="text-[10px] text-muted-foreground mt-1">1/3 completed</p>
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
        <p className="text-[10px] text-muted-foreground mt-1">{xp} / {(level) * 1000} XP to Level {level + 1}</p>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-foreground">Recent Activity</span>
          <button className="text-xs text-primary flex items-center gap-0.5">
            View all <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="space-y-2">
          {recentActivity.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No activity yet. Complete tasks to earn!</p>
          ) : (
            recentActivity.map((item) => (
              <div key={item.id} className="glass rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">{item.description || item.type}</p>
                  <p className="text-[10px] text-muted-foreground">{formatTime(item.created_at)}</p>
                </div>
                <span className="text-sm font-semibold text-earn">+{item.amount} coins</span>
              </div>
            ))
          )}
        </div>
      </div>

      <SpinWheel open={showSpin} onOpenChange={setShowSpin} />
      <MysteryBox open={showMystery} onOpenChange={setShowMystery} />
    </div>
  );
};

export default HomeScreen;
