import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { hapticFeedback } from "@/hooks/useTelegram";
import { toast } from "sonner";

interface SpinPrize {
  id: string;
  label: string;
  value: number;
  color: string;
  emoji: string | null;
  image_url: string | null;
  sound_url: string | null;
  animation_url: string | null;
  weight: number;
}

interface SpinWheelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SpinWheel = ({ open, onOpenChange }: SpinWheelProps) => {
  const { user } = useAuth();
  const [prizes, setPrizes] = useState<SpinPrize[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<SpinPrize | null>(null);
  const [saving, setSaving] = useState(false);
  const [spinsToday, setSpinsToday] = useState(0);
  const [maxSpins, setMaxSpins] = useState(3);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (open) fetchData();
  }, [open, user]);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: prizeData }, { data: settingsData }] = await Promise.all([
      supabase.from("spin_prizes").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("app_settings").select("key, value").in("key", ["daily_spin_limit"]),
    ]);

    if (prizeData && prizeData.length > 0) setPrizes(prizeData);
    if (settingsData) {
      const s = Object.fromEntries(settingsData.map((r: any) => [r.key, r.value]));
      if (s.daily_spin_limit) setMaxSpins(Number(s.daily_spin_limit));
    }

    if (user) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("user_spins")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("spun_at", today.toISOString());
      setSpinsToday(count ?? 0);
    }
    setLoading(false);
  };

  const getWeightedRandom = (): SpinPrize => {
    const total = prizes.reduce((s, p) => s + p.weight, 0);
    let r = Math.random() * total;
    for (const p of prizes) {
      r -= p.weight;
      if (r <= 0) return p;
    }
    return prizes[0];
  };

  const spin = async () => {
    if (!user || spinning || prizes.length === 0) return;
    if (spinsToday >= maxSpins) {
      toast.error(`You've used all ${maxSpins} spins today!`);
      return;
    }

    setSpinning(true);
    setResult(null);
    hapticFeedback.impact("heavy");

    const prize = getWeightedRandom();
    const winIndex = prizes.indexOf(prize);
    const segmentAngle = 360 / prizes.length;
    const targetAngle = 360 - (winIndex * segmentAngle + segmentAngle / 2);
    const newRotation = rotation + 1440 + targetAngle;
    setRotation(newRotation);

    setTimeout(async () => {
      setResult(prize);
      setSaving(true);

      // Play sound if available
      if (prize.sound_url) {
        try {
          audioRef.current = new Audio(prize.sound_url);
          audioRef.current.play();
        } catch {}
      }

      await supabase.from("user_spins").insert({
        user_id: user.id,
        prize_id: prize.id,
        reward_amount: prize.value,
      });

      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "spin_reward",
        amount: prize.value,
        description: `Spin Wheel: ${prize.label}`,
      });

      await supabase.rpc("add_xp", { p_user_id: user.id, p_amount: Math.floor(prize.value) });

      setSpinsToday(prev => prev + 1);
      setSaving(false);
      setSpinning(false);
      hapticFeedback.notification("success");
      toast.success(`You won ${prize.label}! 🎉`);
    }, 4000);
  };

  const segmentAngle = prizes.length > 0 ? 360 / prizes.length : 45;
  const remaining = maxSpins - spinsToday;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-border max-w-[380px]">
        <DialogHeader>
          <DialogTitle className="text-foreground font-display text-center">🎰 Spin Wheel</DialogTitle>
          <DialogDescription className="text-muted-foreground text-center">
            {remaining > 0 ? `${remaining} spin${remaining > 1 ? "s" : ""} remaining today` : "No spins left today"}
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
            <div className="relative w-64 h-64 mx-auto my-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-primary" />
              <motion.div
                className="w-full h-full rounded-full relative overflow-hidden border-4 border-primary/30"
                animate={{ rotate: rotation }}
                transition={{ duration: 4, ease: [0.17, 0.67, 0.12, 0.99] }}
              >
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  {prizes.map((seg, i) => {
                    const startAngle = i * segmentAngle;
                    const endAngle = startAngle + segmentAngle;
                    const startRad = (Math.PI / 180) * (startAngle - 90);
                    const endRad = (Math.PI / 180) * (endAngle - 90);
                    const x1 = 100 + 100 * Math.cos(startRad);
                    const y1 = 100 + 100 * Math.sin(startRad);
                    const x2 = 100 + 100 * Math.cos(endRad);
                    const y2 = 100 + 100 * Math.sin(endRad);
                    const largeArc = segmentAngle > 180 ? 1 : 0;
                    const midRad = (Math.PI / 180) * ((startAngle + endAngle) / 2 - 90);
                    const tx = 100 + 65 * Math.cos(midRad);
                    const ty = 100 + 65 * Math.sin(midRad);

                    return (
                      <g key={seg.id}>
                        <path
                          d={`M100,100 L${x1},${y1} A100,100 0 ${largeArc},1 ${x2},${y2} Z`}
                          fill={seg.color}
                          stroke="hsl(230, 25%, 7%)"
                          strokeWidth="1"
                        />
                        {seg.image_url ? (
                          <image
                            href={seg.image_url}
                            x={tx - 12}
                            y={ty - 12}
                            width="24"
                            height="24"
                            clipPath="circle(12px)"
                          />
                        ) : (
                          <text
                            x={tx}
                            y={ty}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="white"
                            fontSize="12"
                            fontWeight="bold"
                            transform={`rotate(${(startAngle + endAngle) / 2}, ${tx}, ${ty})`}
                          >
                            {seg.label}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </motion.div>
            </div>

            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-2"
                >
                  {result.image_url ? (
                    <img src={result.image_url} alt={result.label} className="w-16 h-16 mx-auto rounded-lg object-cover" />
                  ) : result.animation_url ? (
                    <img src={result.animation_url} alt={result.label} className="w-16 h-16 mx-auto" />
                  ) : (
                    <span className="text-4xl block">{result.emoji}</span>
                  )}
                  <p className="text-2xl font-display font-bold text-earn">+{result.value} coins!</p>
                  <p className="text-xs text-muted-foreground">{result.label}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              onClick={spin}
              disabled={spinning || saving || remaining <= 0}
              className="w-full gradient-primary text-white border-0 gap-2"
            >
              {spinning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Star className="h-4 w-4" /> Spin! ({remaining} left)
                </>
              )}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SpinWheel;
