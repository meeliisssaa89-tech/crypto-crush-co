import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Gift, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { hapticFeedback } from "@/hooks/useTelegram";
import { toast } from "sonner";

const DAILY_REWARDS = [
  { day: 1, reward: 10, emoji: "🪙" },
  { day: 2, reward: 15, emoji: "💰" },
  { day: 3, reward: 25, emoji: "💎" },
  { day: 4, reward: 35, emoji: "🏆" },
  { day: 5, reward: 50, emoji: "👑" },
  { day: 6, reward: 75, emoji: "🌟" },
  { day: 7, reward: 150, emoji: "🎁" },
];

interface DailyBonusProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DailyBonus = ({ open, onOpenChange }: DailyBonusProps) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [claimedReward, setClaimedReward] = useState<number>(0);

  useEffect(() => {
    if (open && user) fetchProfile();
  }, [open, user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("streak_days, last_streak_date").eq("user_id", user.id).single();
    if (data) {
      setProfile(data);
      // Check if already claimed today
      if (data.last_streak_date) {
        const lastDate = new Date(data.last_streak_date);
        const today = new Date();
        if (lastDate.toDateString() === today.toDateString()) {
          setClaimed(true);
        } else {
          setClaimed(false);
        }
      }
    }
  };

  const claimBonus = async () => {
    if (!user || claiming || claimed) return;
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
      newStreak = 1; // streak broken, start over
    }

    const dayIndex = Math.min(newStreak - 1, 6);
    const reward = DAILY_REWARDS[dayIndex].reward;

    // Update profile streak
    await supabase.from("profiles").update({
      streak_days: newStreak,
      last_streak_date: today.toISOString().split("T")[0],
      xp: (profile?.xp ?? 0) + reward,
    }).eq("user_id", user.id);

    // Record transaction
    await supabase.from("transactions").insert({
      user_id: user.id,
      type: "daily_bonus",
      amount: reward,
      description: `Day ${newStreak} daily bonus`,
    });

    setClaimedReward(reward);
    setClaimed(true);
    setClaiming(false);
    hapticFeedback.notification("success");
    toast.success(`Day ${newStreak} bonus: +${reward} coins! 🎉`);
  };

  const currentDay = profile?.streak_days ?? 0;
  const canClaim = !claimed;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-border max-w-[380px]">
        <DialogHeader>
          <DialogTitle className="text-foreground font-display text-center">📅 Daily Bonus</DialogTitle>
          <DialogDescription className="text-muted-foreground text-center">
            Come back every day to earn bigger rewards!
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-7 gap-1.5 my-4">
          {DAILY_REWARDS.map((day, i) => {
            const isCompleted = i < currentDay;
            const isCurrent = i === currentDay && canClaim;
            const isToday = i === currentDay - 1 && claimed;

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

        {/* Claimed result */}
        <AnimatePresence>
          {claimed && claimedReward > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-2"
            >
              <p className="text-2xl font-display font-bold text-earn">+{claimedReward} coins!</p>
              <p className="text-xs text-muted-foreground mt-1">Come back tomorrow for more!</p>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          onClick={claimBonus}
          disabled={claiming || claimed}
          className={`w-full border-0 gap-2 ${claimed ? "bg-muted text-muted-foreground" : "gradient-earn text-white"}`}
        >
          {claiming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : claimed ? (
            <>
              <Check className="h-4 w-4" /> Claimed Today
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
