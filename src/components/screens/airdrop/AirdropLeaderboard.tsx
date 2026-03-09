import { motion } from "framer-motion";
import { Trophy, TrendingUp, Medal } from "lucide-react";
import type { LeaderboardEntry } from "../AirdropScreen";

interface Props {
  leaderboard: LeaderboardEntry[];
  userRank: number | null;
  totalTokens: number;
  currentUserId: string;
  totalParticipants: number;
}

const AirdropLeaderboard = ({ leaderboard, userRank, totalTokens, currentUserId, totalParticipants }: Props) => {
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3;
  const podiumHeights = ["h-16", "h-24", "h-12"];
  const podiumColors = ["bg-gradient-to-t from-slate-400/30 to-slate-300/10", "bg-gradient-to-t from-amber-500/30 to-yellow-400/10", "bg-gradient-to-t from-orange-700/30 to-orange-500/10"];
  const medals = ["🥈", "🥇", "🥉"];

  return (
    <div className="space-y-4">
      {/* Podium for top 3 */}
      {top3.length >= 3 && (
        <div className="glass rounded-xl p-4">
          <div className="flex items-end justify-center gap-2 mb-2">
            {podiumOrder.map((entry, i) => (
              <motion.div
                key={entry.rank}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className="flex flex-col items-center flex-1"
              >
                <span className="text-2xl mb-1">{medals[i]}</span>
                <span className="text-[10px] font-medium text-foreground truncate max-w-[80px] text-center">
                  {entry.name}
                </span>
                <span className="text-[9px] text-muted-foreground">Lv.{entry.level}</span>
                <span className="text-xs font-bold text-earn mt-0.5">{entry.tokens.toLocaleString()}</span>
                <div className={`w-full ${podiumHeights[i]} ${podiumColors[i]} rounded-t-lg mt-1.5 border border-border/30`} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Rest of leaderboard */}
      <div className="space-y-1.5">
        {rest.map((entry, i) => {
          const isMe = entry.userId === currentUserId;
          return (
            <motion.div
              key={entry.rank}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`glass rounded-lg p-3 flex items-center gap-3 ${isMe ? 'border border-primary/40 bg-primary/5' : ''}`}
            >
              <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-secondary text-muted-foreground">
                {entry.rank}
              </span>
              <span className="text-base">{entry.avatar}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isMe ? 'text-primary' : 'text-foreground'}`}>
                  {entry.name} {isMe && <span className="text-[9px] text-primary">(You)</span>}
                </p>
                <p className="text-[10px] text-muted-foreground">Level {entry.level} · {entry.xp.toLocaleString()} XP</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-earn">{entry.tokens.toLocaleString()}</p>
                <p className="text-[9px] text-muted-foreground">tokens</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Your rank card */}
      <div className="glass rounded-xl p-4 border border-primary/30">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              Your Rank: <span className="gradient-text">#{userRank ?? "—"}</span>
              <span className="text-[10px] text-muted-foreground ml-1.5">/ {totalParticipants.toLocaleString()}</span>
            </p>
            <p className="text-[10px] text-muted-foreground">{totalTokens.toLocaleString()} tokens earned</p>
          </div>
          <span className="text-sm font-bold gradient-text">{totalTokens.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default AirdropLeaderboard;
