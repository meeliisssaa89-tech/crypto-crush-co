import { motion } from "framer-motion";
import { Coins, Gift, Loader2, Lock, Unlock, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Props {
  totalTokens: number;
  claimableTokens: number;
  claimedTokens: number;
  lockedTokens: number;
  claiming: boolean;
  onClaim: () => void;
}

const AirdropHeroCard = ({ totalTokens, claimableTokens, claimedTokens, lockedTokens, claiming, onClaim }: Props) => {
  const claimProgress = totalTokens > 0 ? ((claimedTokens / totalTokens) * 100) : 0;

  return (
    <motion.div
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative overflow-hidden rounded-2xl"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 gradient-primary opacity-90" />
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />

      <div className="relative p-5 space-y-4">
        {/* Top row */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Coins className="h-4 w-4 text-white/80" />
              <p className="text-xs text-white/60 uppercase tracking-wider font-medium">Total Earned</p>
            </div>
            <h2 className="text-4xl font-display font-bold text-white">{totalTokens.toLocaleString()}</h2>
            <p className="text-[10px] text-white/50 mt-0.5">tokens</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
            <p className="text-lg font-bold text-white">{claimProgress.toFixed(0)}%</p>
            <p className="text-[8px] text-white/50 uppercase">claimed</p>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-white/60 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Claimed: {claimedTokens.toLocaleString()}
            </span>
            <span className="text-[10px] text-white/60 flex items-center gap-1">
              <Lock className="h-3 w-3" /> Locked: {lockedTokens.toLocaleString()}
            </span>
          </div>
          <Progress value={claimProgress} className="h-2 bg-white/10 [&>div]:bg-white/80" />
        </div>

        {/* Stats row */}
        <div className="flex gap-3">
          <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-lg p-2.5 text-center">
            <Unlock className="h-3.5 w-3.5 text-white/70 mx-auto mb-0.5" />
            <p className="text-sm font-bold text-white">{claimableTokens.toLocaleString()}</p>
            <p className="text-[8px] text-white/50 uppercase">Claimable</p>
          </div>
          <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-lg p-2.5 text-center">
            <CheckCircle2 className="h-3.5 w-3.5 text-white/70 mx-auto mb-0.5" />
            <p className="text-sm font-bold text-white">{claimedTokens.toLocaleString()}</p>
            <p className="text-[8px] text-white/50 uppercase">Claimed</p>
          </div>
          <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-lg p-2.5 text-center">
            <Lock className="h-3.5 w-3.5 text-white/70 mx-auto mb-0.5" />
            <p className="text-sm font-bold text-white">{lockedTokens.toLocaleString()}</p>
            <p className="text-[8px] text-white/50 uppercase">Locked</p>
          </div>
        </div>

        {/* Claim button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onClaim}
          disabled={claiming || claimableTokens <= 0}
          className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-3.5 flex items-center justify-center gap-2 transition-all disabled:opacity-40 border border-white/10"
        >
          {claiming ? (
            <Loader2 className="h-5 w-5 text-white animate-spin" />
          ) : (
            <Gift className="h-5 w-5 text-white" />
          )}
          <span className="text-sm font-bold text-white">
            {claiming ? "Claiming..." : claimableTokens > 0 ? `Claim ${claimableTokens.toLocaleString()} Tokens` : "No tokens to claim"}
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default AirdropHeroCard;
