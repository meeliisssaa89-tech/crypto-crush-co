import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Box, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const PRIZES = [
  { label: "5 Coins", value: 5, emoji: "🪙", rarity: "Common" },
  { label: "15 Coins", value: 15, emoji: "💰", rarity: "Common" },
  { label: "30 Coins", value: 30, emoji: "💎", rarity: "Uncommon" },
  { label: "50 Coins", value: 50, emoji: "🏆", rarity: "Rare" },
  { label: "100 Coins", value: 100, emoji: "👑", rarity: "Epic" },
  { label: "250 Coins", value: 250, emoji: "🌟", rarity: "Legendary" },
];

const WEIGHTS = [35, 25, 20, 12, 6, 2]; // probability weights

interface MysteryBoxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MysteryBox = ({ open, onOpenChange }: MysteryBoxProps) => {
  const { user } = useAuth();
  const [opening, setOpening] = useState(false);
  const [result, setResult] = useState<typeof PRIZES[0] | null>(null);
  const [boxState, setBoxState] = useState<"closed" | "shaking" | "opened">("closed");

  const getWeightedRandom = () => {
    const total = WEIGHTS.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < WEIGHTS.length; i++) {
      r -= WEIGHTS[i];
      if (r <= 0) return PRIZES[i];
    }
    return PRIZES[0];
  };

  const openBox = async () => {
    if (!user || opening) return;
    setOpening(true);
    setResult(null);
    setBoxState("shaking");

    setTimeout(() => setBoxState("opened"), 1500);

    setTimeout(async () => {
      const prize = getWeightedRandom();
      setResult(prize);

      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "mystery_box",
        amount: prize.value,
        description: `Mystery Box: ${prize.rarity} - ${prize.label}`,
      });

      const { data: profile } = await supabase.from("profiles").select("xp").eq("user_id", user.id).single();
      if (profile) {
        await supabase.from("profiles").update({ xp: profile.xp + Math.floor(prize.value / 4) }).eq("user_id", user.id);
      }

      setOpening(false);
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

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="glass border-border max-w-[380px]">
        <DialogHeader>
          <DialogTitle className="text-foreground font-display text-center">📦 Mystery Box</DialogTitle>
          <DialogDescription className="text-muted-foreground text-center">Open to reveal your prize!</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-6 space-y-6">
          {/* Box */}
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

          {/* Result */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", damping: 10, stiffness: 200 }}
                className="text-center space-y-2"
              >
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                  className="text-7xl block"
                >
                  {result.emoji}
                </motion.span>
                <p className={`text-sm font-bold uppercase tracking-wider ${rarityColors[result.rarity]}`}>
                  {result.rarity}
                </p>
                <p className="text-2xl font-display font-bold text-earn">+{result.value} coins!</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Button
          onClick={result ? reset : openBox}
          disabled={opening && !result}
          className="w-full gradient-warning text-white border-0 gap-2"
        >
          {opening && !result ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : result ? (
            <>
              <Box className="h-4 w-4" /> Open Another
            </>
          ) : (
            <>
              <Box className="h-4 w-4" /> Open Box
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default MysteryBox;
