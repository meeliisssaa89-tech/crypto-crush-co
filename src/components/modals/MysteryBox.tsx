import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Box, Loader2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { hapticFeedback } from "@/hooks/useTelegram";
import { toast } from "sonner";

interface BoxPrize {
  id: string;
  label: string;
  value: number;
  emoji: string | null;
  rarity: string;
  image_url: string | null;
  sound_url: string | null;
  animation_url: string | null;
  weight: number;
}

interface MysteryBoxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MysteryBox = ({ open, onOpenChange }: MysteryBoxProps) => {
  const { user } = useAuth();
  const [prizes, setPrizes] = useState<BoxPrize[]>([]);
  const [opening, setOpening] = useState(false);
  const [result, setResult] = useState<BoxPrize | null>(null);
  const [boxState, setBoxState] = useState<"closed" | "shaking" | "opened">("closed");
  const [loading, setLoading] = useState(true);
  const [canOpen, setCanOpen] = useState(false);
  const [unlockMethod, setUnlockMethod] = useState<"task" | "ad" | "both">("both");
  const [tasksRequired, setTasksRequired] = useState(3);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [dailyBoxLimit, setDailyBoxLimit] = useState(5);
  const [boxesOpenedToday, setBoxesOpenedToday] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (open && user) fetchData();
  }, [open, user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const [{ data: prizeData }, { data: settingsData }] = await Promise.all([
      supabase.from("box_prizes").select("*").eq("is_active", true),
      supabase.from("app_settings").select("key, value").in("key", [
        "box_unlock_method", "box_tasks_required", "daily_box_limit"
      ]),
    ]);

    if (prizeData && prizeData.length > 0) setPrizes(prizeData);

    let method: "task" | "ad" | "both" = "both";
    let reqTasks = 3;
    let boxLimit = 5;

    if (settingsData) {
      const s = Object.fromEntries(settingsData.map((r: any) => [r.key, r.value]));
      if (s.box_unlock_method) method = s.box_unlock_method as any;
      if (s.box_tasks_required) reqTasks = Number(s.box_tasks_required);
      if (s.daily_box_limit) boxLimit = Number(s.daily_box_limit);
    }

    setUnlockMethod(method);
    setTasksRequired(reqTasks);
    setDailyBoxLimit(boxLimit);

    // Check today's box opens
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: boxCount } = await supabase
      .from("user_box_opens")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("opened_at", today.toISOString());
    const opened = boxCount ?? 0;
    setBoxesOpenedToday(opened);

    // Check tasks completed today for unlock
    const { count: taskCount } = await supabase
      .from("user_tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("completed_at", today.toISOString());

    const completed = taskCount ?? 0;
    setTasksCompleted(completed);

    const hasUnlocked = method === "ad" || completed >= reqTasks;
    setCanOpen(hasUnlocked && opened < boxLimit);

    setLoading(false);
  };

  const getWeightedRandom = (): BoxPrize => {
    const total = prizes.reduce((s, p) => s + p.weight, 0);
    let r = Math.random() * total;
    for (const p of prizes) {
      r -= p.weight;
      if (r <= 0) return p;
    }
    return prizes[0];
  };

  const openBox = async () => {
    if (!user || opening || !canOpen || prizes.length === 0) return;
    setOpening(true);
    setResult(null);
    setBoxState("shaking");
    hapticFeedback.impact("heavy");

    setTimeout(() => setBoxState("opened"), 1500);

    setTimeout(async () => {
      const prize = getWeightedRandom();
      setResult(prize);

      if (prize.sound_url) {
        try {
          audioRef.current = new Audio(prize.sound_url);
          audioRef.current.play();
        } catch {}
      }

      await supabase.from("user_box_opens").insert({
        user_id: user.id,
        prize_id: prize.id,
        reward_amount: prize.value,
        unlock_method: unlockMethod === "ad" ? "ad" : "task",
      });

      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "mystery_box",
        amount: prize.value,
        description: `Mystery Box: ${prize.rarity} - ${prize.label}`,
      });

      await supabase.rpc("add_xp", { p_user_id: user.id, p_amount: Math.floor(prize.value) });

      setBoxesOpenedToday(prev => prev + 1);
      setOpening(false);
      hapticFeedback.notification("success");
      toast.success(`${prize.rarity}! You got ${prize.label}! ${prize.emoji}`);
    }, 2500);
  };

  const reset = () => {
    setBoxState("closed");
    setResult(null);
  };

  const rarityColors: Record<string, string> = {
    Common: "text-muted-foreground",
    Uncommon: "text-earn",
    Rare: "text-accent",
    Epic: "text-primary",
    Legendary: "text-warning",
  };

  const remaining = dailyBoxLimit - boxesOpenedToday;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="glass border-border max-w-[380px]">
        <DialogHeader>
          <DialogTitle className="text-foreground font-display text-center">📦 Mystery Box</DialogTitle>
          <DialogDescription className="text-muted-foreground text-center">
            {remaining > 0 ? `${remaining} box${remaining > 1 ? "es" : ""} left today` : "No boxes left today"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : prizes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No prizes configured yet.</p>
        ) : (
          <>
            {/* Unlock progress */}
            {!canOpen && remaining > 0 && (unlockMethod === "task" || unlockMethod === "both") && (
              <div className="glass rounded-lg p-3 text-center space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <Lock className="h-4 w-4 text-warning" />
                  <span className="text-xs font-medium text-foreground">Complete {tasksRequired} tasks to unlock</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{tasksCompleted}/{tasksRequired} tasks completed today</p>
              </div>
            )}

            <div className="flex flex-col items-center py-6 space-y-6">
              <motion.div
                animate={
                  boxState === "shaking"
                    ? { rotate: [0, -10, 10, -10, 10, -5, 5, 0], scale: [1, 1.05, 1.05, 1.05, 1.05, 1.02, 1.02, 1] }
                    : boxState === "opened"
                    ? { scale: [1, 1.2, 0], opacity: [1, 1, 0] }
                    : {}
                }
                transition={{ duration: boxState === "shaking" ? 1.5 : 0.5 }}
                className="text-8xl"
              >
                {boxState !== "opened" ? "📦" : ""}
              </motion.div>

              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", damping: 10, stiffness: 200 }}
                    className="text-center space-y-2"
                  >
                    {result.image_url ? (
                      <motion.img
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5, repeat: 2 }}
                        src={result.image_url}
                        alt={result.label}
                        className="w-20 h-20 mx-auto rounded-xl object-cover"
                      />
                    ) : result.animation_url ? (
                      <motion.img
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5, repeat: 2 }}
                        src={result.animation_url}
                        alt={result.label}
                        className="w-20 h-20 mx-auto"
                      />
                    ) : (
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5, repeat: 2 }}
                        className="text-7xl block"
                      >
                        {result.emoji}
                      </motion.span>
                    )}
                    <p className={`text-sm font-bold uppercase tracking-wider ${rarityColors[result.rarity]}`}>
                      {result.rarity}
                    </p>
                    <p className="text-2xl font-display font-bold text-earn">+{result.value} XP!</p>
                    <p className="text-xs text-muted-foreground">{result.label}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Button
              onClick={result ? reset : openBox}
              disabled={(opening && !result) || (!canOpen && !result) || remaining <= 0}
              className="w-full gradient-warning text-white border-0 gap-2"
            >
              {opening && !result ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : result ? (
                <>
                  <Box className="h-4 w-4" /> Open Another
                </>
              ) : !canOpen ? (
                <>
                  <Lock className="h-4 w-4" /> Locked
                </>
              ) : (
                <>
                  <Box className="h-4 w-4" /> Open Box ({remaining} left)
                </>
              )}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MysteryBox;
