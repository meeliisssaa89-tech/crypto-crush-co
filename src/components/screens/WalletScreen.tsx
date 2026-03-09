import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight, ArrowDownLeft, Repeat, Eye, EyeOff,
  Loader2, TrendingUp, Lock, Send
} from "lucide-react";
import TonWalletSection from "@/components/wallet/TonWalletSection";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { hapticFeedback } from "@/hooks/useTelegram";
import { toast } from "sonner";

type ModalType = "withdraw" | "swap" | null;

const WalletScreen = () => {
  const { user } = useAuth();
  const [hideBalance, setHideBalance] = useState(false);
  const [modal, setModal] = useState<ModalType>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  // Withdrawal (XP → TON)
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Ticker config
  const [tickerConfig, setTickerConfig] = useState({
    token_usd_rate: 0.01, token_image_url: "", token_ticker_enabled: true,
    points_usd_rate: 0.001, min_withdrawal_xp: 100, xp_to_ton_rate: 0.0001,
    withdrawal_fee_percent: 2,
  });

  // Airdrop data
  const [airdropData, setAirdropData] = useState({ tokens_earned: 0, tokens_locked: 0, tokens_claimed: 0 });

  useEffect(() => {
    if (user) fetchData();
    fetchTickerConfig();
  }, [user]);

  const fetchTickerConfig = async () => {
    const { data } = await supabase.from("app_settings").select("*").eq("key", "ticker_config").single();
    if (data?.value && typeof data.value === "object") {
      setTickerConfig(prev => ({ ...prev, ...(data.value as any) }));
    }
  };

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: txs }, { data: prof }, { data: airdrop }] = await Promise.all([
      supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("airdrops").select("*").eq("user_id", user.id).maybeSingle(),
    ]);
    if (txs) setTransactions(txs);
    if (prof) setProfile(prof);
    if (airdrop) setAirdropData(airdrop as any);
    setLoading(false);
  };

  const xpBalance = profile?.xp ?? 0;
  const xpValue = xpBalance * tickerConfig.points_usd_rate;
  const tokenBalance = airdropData.tokens_earned - airdropData.tokens_claimed;
  const tokenValue = tokenBalance * tickerConfig.token_usd_rate;

  // Withdraw XP as TON
  const submitWithdrawal = async () => {
    if (!user || submitting) return;
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < tickerConfig.min_withdrawal_xp) { toast.error(`Minimum withdrawal is ${tickerConfig.min_withdrawal_xp} XP`); return; }
    if (amount > xpBalance) { toast.error("Insufficient XP balance"); return; }
    if (!withdrawAddress.trim()) { toast.error("Enter your TON wallet address"); return; }

    setSubmitting(true);
    hapticFeedback.impact("medium");

    const fee = amount * (tickerConfig.withdrawal_fee_percent / 100);

    // Deduct XP immediately to prevent duplicate requests
    const { error: deductError } = await supabase.rpc("add_xp", { p_user_id: user.id, p_amount: -amount });
    if (deductError) { toast.error("Failed to deduct XP"); setSubmitting(false); return; }

    const { error } = await supabase.from("withdrawal_requests").insert({
      user_id: user.id, amount, method: "TON",
      wallet_address: withdrawAddress, fee_amount: fee,
    });

    if (error) {
      // Refund XP if withdrawal request failed
      await supabase.rpc("add_xp", { p_user_id: user.id, p_amount: amount });
      toast.error("Failed to submit withdrawal");
    } else {
      // Record negative transaction
      await supabase.from("transactions").insert({
        user_id: user.id, type: "withdrawal", amount: -amount,
        description: `Withdrawal request: ${amount} XP → TON`,
      });
      hapticFeedback.notification("success");
      toast.success("Withdrawal request submitted! XP deducted.");
      setModal(null); setWithdrawAmount(""); setWithdrawAddress("");
      fetchData();
    }
    setSubmitting(false);
  };

  const feePercent = tickerConfig.withdrawal_fee_percent;
  const feeAmount = parseFloat(withdrawAmount) ? parseFloat(withdrawAmount) * (feePercent / 100) : 0;
  const receiveAmount = parseFloat(withdrawAmount) ? parseFloat(withdrawAmount) - feeAmount : 0;
  const receiveInTon = receiveAmount * tickerConfig.xp_to_ton_rate;

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-display font-bold text-foreground">Wallet</h1>
        <button onClick={() => { hapticFeedback.selection(); setHideBalance(!hideBalance); }} className="text-muted-foreground">
          {hideBalance ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>

      {/* App Token Card (Locked) */}
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 gradient-primary opacity-90" />
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />

        {/* Token Ticker */}
        {tickerConfig.token_ticker_enabled && (
          <div className="absolute top-0 left-0 z-10">
            <div className="bg-white/15 backdrop-blur-sm px-3 py-1 pr-8 flex items-center gap-2"
              style={{ clipPath: "polygon(0 0, 100% 0, 82% 100%, 0 100%)", minWidth: "160px" }}>
              {tickerConfig.token_image_url && (
                <img src={tickerConfig.token_image_url} alt="Token" className="w-5 h-5 rounded-full object-cover border border-white/20" />
              )}
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-white/60 uppercase tracking-wider">1 TKN</span>
                <span className="text-[10px] font-bold text-white">= ${tickerConfig.token_usd_rate}</span>
                <TrendingUp className="h-2.5 w-2.5 text-emerald-300" />
              </div>
            </div>
          </div>
        )}

        <div className="relative p-5">
          <div className="flex items-start gap-3 mt-2">
            {tickerConfig.token_image_url && (
              <div className="shrink-0">
                <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/20 flex items-center justify-center shadow-xl">
                  <img src={tickerConfig.token_image_url} alt="Token" className="w-11 h-11 rounded-full object-cover" />
                </div>
              </div>
            )}
            <div className="flex-1">
              <p className="text-xs text-white/60 mb-0.5">App Token</p>
              <h2 className="text-3xl font-display font-bold text-white">
                {hideBalance ? "••••••" : tokenBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </h2>
              <p className="text-[10px] text-white/50 mt-0.5">
                {hideBalance ? "••••" : `≈ $${tokenValue.toFixed(2)}`}
              </p>
            </div>
          </div>

          {/* Locked badge */}
          <div className="mt-3 bg-white/10 backdrop-blur-sm rounded-xl p-3 flex items-center gap-2 border border-white/10">
            <Lock className="h-4 w-4 text-yellow-300" />
            <div className="flex-1">
              <p className="text-[11px] font-medium text-white">Token Locked</p>
              <p className="text-[9px] text-white/50">Will be available after listing on exchanges</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* XP Points Card */}
      <motion.div whileTap={{ scale: 0.98 }} className="glass rounded-2xl p-4 border border-primary/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
            <span className="text-lg">⭐</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">XP Points</p>
            <p className="text-[10px] text-muted-foreground">Withdrawable as TON</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-foreground">{hideBalance ? "••••" : xpBalance.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">{hideBalance ? "••••" : `≈ $${xpValue.toFixed(2)}`}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => { hapticFeedback.impact("light"); setModal("withdraw"); }}
            className="flex-1 bg-primary/10 rounded-xl py-2.5 flex items-center justify-center gap-2 hover:bg-primary/20 transition-colors border border-primary/20"
          >
            <Send className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Withdraw as TON</span>
          </button>
        </div>
      </motion.div>

      {/* TON Wallet & On-chain Assets */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">On-Chain Assets</h3>
        <TonWalletSection hideBalance={hideBalance} />
      </div>

      {/* Transactions */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Recent Activity</h3>
        <div className="space-y-2">
          {loading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : transactions.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No transactions yet</p>
          ) : transactions.map((tx) => (
            <div key={tx.id} className="glass rounded-lg p-3 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${Number(tx.amount) > 0 ? "bg-earn/20" : "bg-destructive/20"}`}>
                {Number(tx.amount) > 0 ? <ArrowDownLeft className="h-4 w-4 text-earn" /> : <ArrowUpRight className="h-4 w-4 text-destructive" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{tx.description || tx.type}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`text-sm font-semibold shrink-0 ${Number(tx.amount) > 0 ? "text-earn" : "text-destructive"}`}>
                {Number(tx.amount) > 0 ? "+" : ""}{Number(tx.amount).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Withdraw XP as TON Modal */}
      <Dialog open={modal === "withdraw"} onOpenChange={() => setModal(null)}>
        <DialogContent className="glass border-border max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-foreground font-display">Withdraw XP as TON</DialogTitle>
            <DialogDescription className="text-muted-foreground">Convert your XP to TON and withdraw</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="glass rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground mb-1">Available XP</p>
              <p className="text-lg font-bold text-foreground">{xpBalance.toLocaleString()} XP</p>
              <p className="text-[10px] text-muted-foreground">≈ ${xpValue.toFixed(4)}</p>
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Amount (XP)</label>
              <Input placeholder={`Min ${tickerConfig.min_withdrawal_xp} XP`} type="number" value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)} className="bg-secondary/50" />
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">TON Wallet Address</label>
              <Input placeholder="UQ..." value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)} className="bg-secondary/50 font-mono text-xs" />
            </div>

            <div className="glass rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Rate</span>
                <span className="text-foreground">1 XP = {tickerConfig.xp_to_ton_rate} TON</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Fee ({feePercent}%)</span>
                <span className="text-foreground">{feeAmount.toFixed(2)} XP</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Min withdrawal</span>
                <span className="text-foreground">{tickerConfig.min_withdrawal_xp} XP</span>
              </div>
              <div className="h-px bg-border my-1" />
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">You receive</span>
                <span className="text-earn font-semibold">≈ {receiveInTon.toFixed(6)} TON</span>
              </div>
            </div>

            <Button onClick={submitWithdrawal} disabled={submitting} className="w-full gradient-primary text-white border-0">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Withdrawal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WalletScreen;
