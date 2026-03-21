import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Coins, Gift, Loader2, Lock, Unlock, CheckCircle2, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

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
  const [tickerConfig, setTickerConfig] = useState({
    token_usd_rate: 0.01,
    token_ticker_enabled: true,
    token_image_url: "",
  });

  useEffect(() => {
    fetchTickerConfig();
  }, []);

  const fetchTickerConfig = async () => {
    const { data } = await supabase.from("app_settings").select("*").eq("key", "ticker_config").single();
    if (data?.value && typeof data.value === "object") {
      setTickerConfig(prev => ({ ...prev, ...(data.value as any) }));
    }
  };

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

      {/* Token Ticker Ribbon */}
      {tickerConfig.token_ticker_enabled && (
        <div className="absolute top-0 left-0 z-10">
          <div
            className="bg-white/15 backdrop-blur-sm px-3 py-1 pr-8 flex items-center gap-2"
            style={{
              clipPath: "polygon(0 0, 100% 0, 82% 100%, 0 100%)",
              minWidth: "160px",
            }}
          >
            {tickerConfig.token_image_url && (
              <img
                src={tickerConfig.token_image_url}
                alt="Token"
                className="w-5 h-5 rounded-full object-cover border border-white/20 shadow-lg"
              />
            )}
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-white/60 uppercase tracking-wider">1 EG Coin</span>
              <span className="text-[10px] font-bold text-white">= ${tickerConfig.token_usd_rate}</span>
              <TrendingUp className="h-2.5 w-2.5 text-emerald-300" />
            </div>
          </div>
        </div>
      )}

      <div className="relative p-5 space-y-4">
        {/* Top row */}
        <div className="flex items-start justify-between mt-2">
          <div className="flex items-start gap-3">
            {/* Token coin image */}
            {tickerConfig.token_image_url && (
              <div className="relative shrink-0 mt-1">
                <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/20 flex items-center justify-center shadow-xl">
                  <img
                    src={tickerConfig.token_image_url}
                    alt="Token"
                    className="w-11 h-11 rounded-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-400 flex items-center justify-center">
                  <TrendingUp className="h-2.5 w-2.5 text-white" />
                </div>
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Coins className="h-4 w-4 text-white/80" />
                <p className="text-xs text-white/60 uppercase tracking-wider font-medium">Total Earned</p>
              </div>
              <h2 className="text-4xl font-display font-bold text-white">{totalTokens.toLocaleString()}</h2>
              <p className="text-[10px] text-white/50 mt-0.5">
                tokens {tickerConfig.token_ticker_enabled && <span>≈ ${(totalTokens * tickerConfig.token_usd_rate).toFixed(2)}</span>}
              </p>
            </div>
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
