import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { hapticFeedback } from "@/hooks/useTelegram";
import { toast } from "sonner";

const DEFAULT_REWARDS = [10, 15, 25, 35, 50, 75, 150];
const DAY_EMOJIS = ["🪙", "💰", "💎", "🏆", "👑", "🌟", "🎁"];

interface DailyBonusProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DailyRewardItem {
  day: number;
  reward: number;
  emoji: string;
}

const parseRewards = (value: unknown): number[] => {
  if (Array.isArray(value)) {
    const parsed = value
      .map((v) => Number(v))
      .filter((n) => Number.isFinite(n) && n >= 0)
      .slice(0, 7);
    if (parsed.length === 7) return parsed;
  }

  if (typeof value === "string") {
    const parsed = value
      .split(",")
      .map((v) => Number(v.trim()))
      .filter((n) => Number.isFinite(n) && n >= 0)
      .slice(0, 7);
    if (parsed.length === 7) return parsed;
  }

  return DEFAULT_REWARDS;
};

const DailyBonus = ({ open, onOpenChange }: DailyBonusProps) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [claimedReward, setClaimedReward] = useState<number>(0);
  const [enabled, setEnabled] = useState(true);
  const [dailyRewards, setDailyRewards] = useState<DailyRewardItem[]>(
    DEFAULT_REWARDS.map((reward, index) => ({ day: index + 1, reward, emoji: DAY_EMOJIS[index] }))
  );

  useEffect(() => {
    if (open && user) fetchData();
  }, [open, user]);

  const fetchData = async () => {
    if (!user) return;

    const [{ data: profileData, error: profileError }, { data: settingsData, error: settingsError }] = await Promise.all([
      supabase.from("profiles").select("streak_days, last_streak_date, xp").eq("user_id", user.id).single(),
      supabase
        .from("app_settings")
        .select("key, value")
        .in("key", ["daily_bonus_enabled", "daily_bonus_rewards"]),
    ]);

    if (profileError) {
      toast.error(profileError.message);
      return;
    }

    if (settingsError) {
      toast.error(settingsError.message);
      return;
    }

    if (profileData) {
      setProfile(profileData);

      if (profileData.last_streak_date) {
        const lastDate = new Date(profileData.last_streak_date);
        const today = new Date();
        setClaimed(lastDate.toDateString() === today.toDateString());
      } else {
        setClaimed(false);
      }
    }

    if (settingsData) {
      const settings = Object.fromEntries(settingsData.map((row: any) => [row.key, row.value]));

      if (settings.daily_bonus_enabled !== undefined) {
        setEnabled(settings.daily_bonus_enabled === true || settings.daily_bonus_enabled === "true");
      }

      const rewards = parseRewards(settings.daily_bonus_rewards);
      setDailyRewards(rewards.map((reward, index) => ({ day: index + 1, reward, emoji: DAY_EMOJIS[index] })));
    }
  };

  const claimBonus = async () => {
    if (!user || claiming || claimed || !enabled) return;

    setClaiming(true);
    hapticFeedback.impact("heavy");

    const currentStreak = profile?.streak_days ?? 0;
    const lastDate = profile?.last_streak_date ? new Date(profile.last_streak_date) : null;

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let newStreak: number;

    if (lastDate && lastDate.toDateString() === yesterday.toDateString()) {
      newStreak = Math.min(currentStreak + 1, 7);
    } else if (lastDate && lastDate.toDateString() === today.toDateString()) {
      toast.error("Already claimed today!");
      setClaiming(false);
      return;
    } else {
      newStreak = 1;
    }

    const reward = dailyRewards[Math.min(newStreak - 1, 6)]?.reward ?? DEFAULT_REWARDS[Math.min(newStreak - 1, 6)];

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        streak_days: newStreak,
        last_streak_date: today.toISOString().split("T")[0],
        xp: (profile?.xp ?? 0) + reward,
      })
      .eq("user_id", user.id);

    if (updateError) {
      toast.error(updateError.message);
      setClaiming(false);
      return;
    }

    const { error: transactionError } = await supabase.from("transactions").insert({
      user_id: user.id,
      type: "daily_bonus",
      amount: reward,
      description: `Day ${newStreak} daily bonus`,
    });

    if (transactionError) {
      toast.error(transactionError.message);
      setClaiming(false);
      return;
    }

    setClaimedReward(reward);
    setClaimed(true);
    setClaiming(false);
    setProfile((prev: any) => ({
      ...(prev || {}),
      streak_days: newStreak,
      last_streak_date: today.toISOString().split("T")[0],
      xp: (prev?.xp ?? 0) + reward,
    }));

    hapticFeedback.notification("success");
    toast.success(`Day ${newStreak} bonus: +${reward} XP! 🎉`);
  };

  const currentDay = profile?.streak_days ?? 0;
  const canClaim = enabled && !claimed;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-border max-w-[380px]">
        <DialogHeader>
          <DialogTitle className="text-foreground font-display text-center">📅 Daily Bonus</DialogTitle>
          <DialogDescription className="text-muted-foreground text-center">
            {enabled ? "Come back every day to earn bigger rewards!" : "Daily bonus is currently disabled by admin."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-7 gap-1.5 my-4">
          {dailyRewards.map((day, index) => {
            const isCompleted = index < currentDay;
            const isCurrent = index === currentDay && canClaim;
            const isToday = index === currentDay - 1 && claimed;

            return (
              <motion.div
                key={day.day}
                animate={isCurrent ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
                className={`flex flex-col items-center p-1.5 rounded-lg text-center ${
                  isCompleted || isToday
                    ? "gradient-primary"
                    : isCurrent
                    ? "border-2 border-primary bg-primary/10"
                    : "bg-muted/50"
                }`}
              >
                <span className="text-[9px] text-white/70 font-medium">D{day.day}</span>
                <span className="text-base">{isCompleted || isToday ? "✅" : day.emoji}</span>
                <span className="text-[9px] font-bold text-white/90">+{day.reward}</span>
              </motion.div>
            );
          })}
        </div>

        <AnimatePresence>
          {claimed && claimedReward > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-2">
              <p className="text-2xl font-display font-bold text-earn">+{claimedReward} coins!</p>
              <p className="text-xs text-muted-foreground mt-1">Come back tomorrow for more!</p>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          onClick={claimBonus}
          disabled={claiming || claimed || !enabled}
          className={`w-full border-0 gap-2 ${claimed || !enabled ? "bg-muted text-muted-foreground" : "gradient-earn text-white"}`}
        >
          {claiming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : claimed ? (
            <>
              <Check className="h-4 w-4" /> Claimed Today
            </>
          ) : !enabled ? (
            <>
              <Gift className="h-4 w-4" /> Disabled by Admin
            </>
          ) : (
            <>
              <Gift className="h-4 w-4" /> Claim Day {Math.min(currentDay + 1, 7)} Bonus
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default DailyBonus;
