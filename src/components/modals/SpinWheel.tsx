import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const SEGMENTS = [
  { label: "10", value: 10, color: "hsl(262, 83%, 58%)" },
  { label: "25", value: 25, color: "hsl(217, 91%, 60%)" },
  { label: "50", value: 50, color: "hsl(160, 84%, 39%)" },
  { label: "100", value: 100, color: "hsl(38, 92%, 50%)" },
  { label: "5", value: 5, color: "hsl(200, 95%, 50%)" },
  { label: "200", value: 200, color: "hsl(0, 72%, 51%)" },
  { label: "15", value: 15, color: "hsl(262, 83%, 45%)" },
  { label: "75", value: 75, color: "hsl(186, 91%, 50%)" },
];

interface SpinWheelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SpinWheel = ({ open, onOpenChange }: SpinWheelProps) => {
  const { user } = useAuth();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const spin = async () => {
    if (!user || spinning) return;
    setSpinning(true);
    setResult(null);

    const winIndex = Math.floor(Math.random() * SEGMENTS.length);
    const prize = SEGMENTS[winIndex].value;
    const segmentAngle = 360 / SEGMENTS.length;
    const targetAngle = 360 - (winIndex * segmentAngle + segmentAngle / 2);
    const newRotation = rotation + 1440 + targetAngle; // 4 full spins + landing

    setRotation(newRotation);

    setTimeout(async () => {
      setResult(prize);
      setSaving(true);

      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "spin_reward",
        amount: prize,
        description: "Spin Wheel reward",
      });

      const { data: profile } = await supabase.from("profiles").select("xp").eq("user_id", user.id).single();
      if (profile) {
        await supabase.from("profiles").update({ xp: profile.xp + Math.floor(prize / 4) }).eq("user_id", user.id);
      }

      setSaving(false);
      setSpinning(false);
      toast.success(`You won ${prize} coins! 🎉`);
    }, 4000);
  };

  const segmentAngle = 360 / SEGMENTS.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-border max-w-[380px]">
        <DialogHeader>
          <DialogTitle className="text-foreground font-display text-center">🎰 Spin Wheel</DialogTitle>
          <DialogDescription className="text-muted-foreground text-center">Spin to win coins!</DialogDescription>
        </DialogHeader>

        <div className="relative w-64 h-64 mx-auto my-4">
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-primary" />

          {/* Wheel */}
          <motion.div
            className="w-full h-full rounded-full relative overflow-hidden border-4 border-primary/30"
            animate={{ rotate: rotation }}
            transition={{ duration: 4, ease: [0.17, 0.67, 0.12, 0.99] }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {SEGMENTS.map((seg, i) => {
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
                  <g key={i}>
                    <path
                      d={`M100,100 L${x1},${y1} A100,100 0 ${largeArc},1 ${x2},${y2} Z`}
                      fill={seg.color}
                      stroke="hsl(230, 25%, 7%)"
                      strokeWidth="1"
                    />
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
                  </g>
                );
              })}
            </svg>
          </motion.div>
        </div>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <p className="text-2xl font-display font-bold text-earn">+{result} coins!</p>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          onClick={spin}
          disabled={spinning || saving}
          className="w-full gradient-primary text-white border-0 gap-2"
        >
          {spinning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Star className="h-4 w-4" /> Spin!
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default SpinWheel;
