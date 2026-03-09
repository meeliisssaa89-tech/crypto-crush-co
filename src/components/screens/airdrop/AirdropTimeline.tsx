import { motion } from "framer-motion";
import { CheckCircle2, Circle, Rocket, Gift, Lock, Zap, Globe } from "lucide-react";

const phases = [
  {
    title: "Phase 1 — Accumulation",
    desc: "Complete tasks, refer friends, and earn tokens through daily activity.",
    icon: Zap,
    status: "active" as "active" | "done" | "upcoming",
  },
  {
    title: "Phase 2 — Snapshot",
    desc: "A snapshot of all participant balances will be taken for final allocation.",
    icon: Globe,
    status: "upcoming" as const,
  },
  {
    title: "Phase 3 — Token Generation",
    desc: "Tokens will be generated on-chain and prepared for distribution.",
    icon: Rocket,
    status: "upcoming" as const,
  },
  {
    title: "Phase 4 — Vesting & Unlock",
    desc: "Locked tokens will unlock gradually over time. Claimed tokens available immediately.",
    icon: Lock,
    status: "upcoming" as const,
  },
  {
    title: "Phase 5 — Full Distribution",
    desc: "All tokens fully unlocked and distributed to wallets.",
    icon: Gift,
    status: "upcoming" as const,
  },
];

const AirdropTimeline = () => (
  <div className="space-y-4">
    <div className="glass rounded-xl p-4">
      <h3 className="text-sm font-semibold text-foreground mb-4">Airdrop Roadmap</h3>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border" />

        <div className="space-y-5">
          {phases.map((phase, i) => {
            const isActive = phase.status === "active";
            const isDone = phase.status === "done";
            return (
              <motion.div
                key={phase.title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-3 relative"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${
                  isActive ? 'gradient-primary shadow-lg shadow-primary/30' :
                  isDone ? 'bg-earn' : 'bg-secondary border border-border'
                }`}>
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  ) : isActive ? (
                    <phase.icon className="h-4 w-4 text-white" />
                  ) : (
                    <Circle className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
                <div className={`flex-1 pb-1 ${!isActive && !isDone ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-2">
                    <p className={`text-xs font-semibold ${isActive ? 'text-primary' : 'text-foreground'}`}>
                      {phase.title}
                    </p>
                    {isActive && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full gradient-primary text-white font-bold uppercase tracking-wider">
                        Live
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{phase.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>

    {/* Info card */}
    <div className="glass rounded-xl p-4 border border-warning/20">
      <p className="text-xs font-semibold text-foreground mb-1">📢 Important</p>
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        70% of earned tokens are locked and will unlock during Phase 4. Continue earning to increase your allocation before the snapshot. Stay active to maximize your airdrop!
      </p>
    </div>
  </div>
);

export default AirdropTimeline;
