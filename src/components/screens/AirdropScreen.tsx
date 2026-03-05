import { motion } from "framer-motion";
import { Gift, Clock, Trophy, ChevronRight, Coins, Target, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const leaderboard = [
  { rank: 1, name: "whale_user", tokens: 125000, avatar: "🐋" },
  { rank: 2, name: "crypto_king", tokens: 98500, avatar: "👑" },
  { rank: 3, name: "diamond_h", tokens: 87200, avatar: "💎" },
  { rank: 4, name: "moonshot", tokens: 65400, avatar: "🚀" },
  { rank: 5, name: "hodler99", tokens: 54100, avatar: "💪" },
];

const AirdropScreen = () => {
  const totalTokens = 45200;
  const claimableTokens = 12000;
  const nextDistribution = "2d 14h 32m";

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <h1 className="text-xl font-display font-bold text-foreground mb-1">Airdrop</h1>
      <p className="text-sm text-muted-foreground">Earn tokens through your activity</p>

      {/* Token Balance Card */}
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="gradient-earn rounded-2xl p-5 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
        <div className="flex items-center gap-2 mb-1">
          <Coins className="h-4 w-4 text-white/80" />
          <p className="text-sm text-white/70">Earned Tokens</p>
        </div>
        <h2 className="text-3xl font-display font-bold text-white mb-4">{totalTokens.toLocaleString()}</h2>
        <div className="flex gap-4">
          <div>
            <p className="text-[10px] text-white/50 uppercase tracking-wider">Claimable</p>
            <p className="text-sm font-semibold text-white">{claimableTokens.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] text-white/50 uppercase tracking-wider">Locked</p>
            <p className="text-sm font-semibold text-white">{(totalTokens - claimableTokens).toLocaleString()}</p>
          </div>
        </div>
      </motion.div>

      {/* Claim Button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        className="w-full gradient-primary rounded-xl p-4 flex items-center justify-between animate-pulse-glow"
      >
        <div className="text-left">
          <p className="text-sm font-bold text-white">Claim {claimableTokens.toLocaleString()} Tokens</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Clock className="h-3 w-3 text-white/60" />
            <p className="text-[10px] text-white/60">Next drop: {nextDistribution}</p>
          </div>
        </div>
        <Gift className="h-6 w-6 text-white" />
      </motion.button>

      {/* Activity Breakdown */}
      <div className="glass rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          Token Allocation
        </h3>
        <div className="space-y-3">
          {[
            { label: "Task Completion", value: 40, tokens: 18080 },
            { label: "Referral Bonus", value: 25, tokens: 11300 },
            { label: "Daily Activity", value: 20, tokens: 9040 },
            { label: "Special Events", value: 15, tokens: 6780 },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <span className="text-xs font-semibold text-foreground">{item.tokens.toLocaleString()}</span>
              </div>
              <Progress value={item.value} className="h-1.5 bg-muted" />
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Trophy className="h-4 w-4 text-warning" />
            Leaderboard
          </h3>
          <button className="text-xs text-primary flex items-center gap-0.5">
            View all <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="space-y-2">
          {leaderboard.map((user) => (
            <div key={user.rank} className="glass rounded-lg p-3 flex items-center gap-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                user.rank <= 3 ? 'gradient-primary text-white' : 'bg-muted text-muted-foreground'
              }`}>
                {user.rank}
              </span>
              <span className="text-lg">{user.avatar}</span>
              <span className="flex-1 text-sm font-medium text-foreground">{user.name}</span>
              <div className="text-right">
                <p className="text-xs font-semibold text-earn">{user.tokens.toLocaleString()}</p>
                <p className="text-[9px] text-muted-foreground">tokens</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Your Rank */}
      <div className="glass rounded-xl p-4 border border-primary/30">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Your Rank: #128</p>
            <p className="text-[10px] text-muted-foreground">Top 5% of all earners</p>
          </div>
          <span className="text-sm font-bold gradient-text">{totalTokens.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default AirdropScreen;
