import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight, ArrowDownLeft, Repeat, Eye, EyeOff, ChevronDown,
  Loader2, TrendingUp, Coins, Send
} from "lucide-react";
import TonWalletSection from "@/components/wallet/TonWalletSection";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { hapticFeedback } from "@/hooks/useTelegram";
import { toast } from "sonner";

type ModalType = "deposit" | "withdraw" | "swap" | null;

const WalletScreen = () => {
  const { user } = useAuth();
  const [hideBalance, setHideBalance] = useState(false);
  const [modal, setModal] = useState<ModalType>(null);
  const [balances, setBalances] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  // Withdrawal
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("Crypto");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Swap
  const [swapFrom, setSwapFrom] = useState("XP");
  const [swapTo, setSwapTo] = useState("USDT");
  const [swapAmount, setSwapAmount] = useState("");
  const [swapping, setSwapping] = useState(false);

  // Ticker config
  const [tickerConfig, setTickerConfig] = useState({
    token_usd_rate: 0.01, token_image_url: "", token_ticker_enabled: true,
    points_usd_rate: 0.001,
  });

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
    const [{ data: curr }, { data: bal }, { data: txs }, { data: prof }] = await Promise.all([
      supabase.from("currencies").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
      supabase.from("user_balances").select("*, currencies(symbol, name, icon_url, chain)").eq("user_id", user.id),
      supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
    ]);
    if (curr) setCurrencies(curr);
    if (bal) setBalances(bal);
    if (txs) setTransactions(txs);
    if (prof) setProfile(prof);
    setLoading(false);
  };

  const totalBalance = balances.reduce((sum, b) => {
    const curr = currencies.find(c => c.id === b.currency_id);
    return sum + Number(b.balance) * (curr?.exchange_rate ?? 0);
  }, 0);

  const xpBalance = profile?.xp ?? 0;
  const xpValue = xpBalance * tickerConfig.points_usd_rate;

  // Swap XP to token
  const executeSwap = async () => {
    if (!user || swapping) return;
    const amount = parseFloat(swapAmount);
    if (!amount || amount < 100) { toast.error("Minimum swap is 100 XP"); return; }
    if (amount > xpBalance) { toast.error("Insufficient XP balance"); return; }

    setSwapping(true);
    hapticFeedback.impact("medium");

    const targetCurrency = currencies.find(c => c.symbol === swapTo);
    if (!targetCurrency) { toast.error("Target currency not found"); setSwapping(false); return; }

    const xpInUsd = amount * tickerConfig.points_usd_rate;
    const tokensReceived = targetCurrency.exchange_rate > 0 ? xpInUsd / targetCurrency.exchange_rate : 0;

    // Deduct XP
    const { error: xpError } = await supabase.from("profiles").update({ xp: xpBalance - amount }).eq("user_id", user.id);
    if (xpError) { toast.error("Failed to deduct XP"); setSwapping(false); return; }

    // Add to balance (upsert)
    const existingBal = balances.find(b => b.currency_id === targetCurrency.id);
    if (existingBal) {
      await supabase.from("user_balances").update({
        balance: Number(existingBal.balance) + tokensReceived,
      }).eq("id", existingBal.id);
    } else {
      await supabase.from("user_balances").insert({
        user_id: user.id, currency_id: targetCurrency.id, balance: tokensReceived,
      });
    }

    // Record transaction
    await supabase.from("transactions").insert({
      user_id: user.id, type: "swap", amount: tokensReceived,
      currency_id: targetCurrency.id,
      description: `Swapped ${amount} XP → ${tokensReceived.toFixed(4)} ${swapTo}`,
    });

    hapticFeedback.notification("success");
    toast.success(`Swapped ${amount} XP → ${tokensReceived.toFixed(4)} ${swapTo}`);
    setModal(null);
    setSwapAmount("");
    fetchData();
    setSwapping(false);
  };

  // Withdrawal
  const submitWithdrawal = async () => {
    if (!user || submitting) return;
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < 500) { toast.error("Minimum withdrawal is 500 EARN"); return; }
    setSubmitting(true);
    hapticFeedback.impact("medium");

    const fee = amount * 0.02;
    const earnCurrency = currencies.find(c => c.symbol === "EARN");
    const { error } = await supabase.from("withdrawal_requests").insert({
      user_id: user.id, amount, method: withdrawMethod,
      wallet_address: withdrawAddress || null, fee_amount: fee,
      currency_id: earnCurrency?.id || null,
    });

    if (error) { toast.error("Failed to submit withdrawal"); }
    else {
      hapticFeedback.notification("success");
      toast.success("Withdrawal request submitted!");
      setModal(null); setWithdrawAmount(""); setWithdrawAddress("");
      fetchData();
    }
    setSubmitting(false);
  };

  const feeAmount = parseFloat(withdrawAmount) ? parseFloat(withdrawAmount) * 0.02 : 0;
  const receiveAmount = parseFloat(withdrawAmount) ? parseFloat(withdrawAmount) - feeAmount : 0;

  // Swap calculations
  const swapAmountNum = parseFloat(swapAmount) || 0;
  const swapTargetCurrency = currencies.find(c => c.symbol === swapTo);
  const swapXpUsd = swapAmountNum * tickerConfig.points_usd_rate;
  const swapReceive = swapTargetCurrency && swapTargetCurrency.exchange_rate > 0
    ? swapXpUsd / swapTargetCurrency.exchange_rate : 0;

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-display font-bold text-foreground">Wallet</h1>
        <button onClick={() => { hapticFeedback.selection(); setHideBalance(!hideBalance); }} className="text-muted-foreground">
          {hideBalance ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>

      {/* App Token Hero */}
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
              <p className="text-xs text-white/60 mb-0.5">Total Portfolio</p>
              <h2 className="text-3xl font-display font-bold text-white">
                {hideBalance ? "••••••" : `$${(totalBalance + xpValue).toFixed(2)}`}
              </h2>
              <p className="text-[10px] text-white/50 mt-0.5">
                {!hideBalance && `${xpBalance.toLocaleString()} XP ≈ $${xpValue.toFixed(2)}`}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            {[
              { icon: ArrowDownLeft, label: "Deposit", action: "deposit" as ModalType },
              { icon: ArrowUpRight, label: "Withdraw", action: "withdraw" as ModalType },
              { icon: Repeat, label: "Swap XP", action: "swap" as ModalType },
            ].map((btn) => (
              <button key={btn.label}
                onClick={() => { hapticFeedback.impact("light"); setModal(btn.action); }}
                className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl py-2.5 flex flex-col items-center gap-1.5 hover:bg-white/20 transition-colors border border-white/10">
                <div className="w-8 h-8 bg-white/15 rounded-full flex items-center justify-center">
                  <btn.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-[10px] font-medium text-white">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* XP Balance Card */}
      <motion.div whileTap={{ scale: 0.98 }} className="glass rounded-xl p-3.5 flex items-center gap-3 border border-primary/20">
        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
          <span className="text-lg">⭐</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">XP Points</p>
          <p className="text-[10px] text-muted-foreground">Convertible to tokens</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-foreground">{hideBalance ? "••••" : xpBalance.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">{hideBalance ? "••••" : `≈ $${xpValue.toFixed(2)}`}</p>
        </div>
      </motion.div>

      {/* TON Wallet */}
      <TonWalletSection />

      {/* Token List */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Blockchain Assets</h3>
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : currencies.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No tokens configured</p>
        ) : (
          <div className="space-y-2">
            {currencies.map((curr) => {
              const bal = balances.find(b => b.currency_id === curr.id);
              const balance = bal?.balance ?? 0;
              const value = balance * curr.exchange_rate;
              return (
                <motion.div key={curr.id} whileTap={{ scale: 0.98 }} className="glass rounded-xl p-3.5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center overflow-hidden shrink-0">
                    {curr.icon_url ? (
                      <img src={curr.icon_url} alt={curr.symbol} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <Coins className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{curr.symbol}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {curr.name} {curr.chain !== "internal" && `• ${curr.chain}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{hideBalance ? "••••" : Number(balance).toLocaleString(undefined, { maximumFractionDigits: 4 })}</p>
                    <p className="text-[10px] text-muted-foreground">{hideBalance ? "••••" : `$${value.toFixed(2)}`}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transactions */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Recent Transactions</h3>
        <div className="space-y-2">
          {transactions.length === 0 ? (
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

      {/* Deposit Modal */}
      <Dialog open={modal === "deposit"} onOpenChange={() => setModal(null)}>
        <DialogContent className="glass border-border max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-foreground font-display">Deposit</DialogTitle>
            <DialogDescription className="text-muted-foreground">Send crypto to your wallet</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-center text-foreground">Connect your TON wallet above to deposit funds on-chain.</p>
            <p className="text-xs text-center text-muted-foreground">Or earn XP through tasks and convert them via Swap.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Modal */}
      <Dialog open={modal === "withdraw"} onOpenChange={() => setModal(null)}>
        <DialogContent className="glass border-border max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-foreground font-display">Withdraw</DialogTitle>
            <DialogDescription className="text-muted-foreground">Choose method and amount</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {["Crypto", "USDT", "Binance ID"].map((m) => (
                <button key={m}
                  onClick={() => { hapticFeedback.selection(); setWithdrawMethod(m); }}
                  className={`glass rounded-lg p-2.5 text-xs font-medium transition-colors ${withdrawMethod === m ? "border-primary text-primary border" : "text-foreground border border-transparent"}`}>
                  {m}
                </button>
              ))}
            </div>
            <Input placeholder="Amount" type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} className="bg-secondary/50" />
            {withdrawMethod !== "Binance ID" && (
              <Input placeholder="Wallet address" value={withdrawAddress} onChange={(e) => setWithdrawAddress(e.target.value)} className="bg-secondary/50" />
            )}
            <div className="glass rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Fee (2%)</span><span className="text-foreground">{feeAmount.toFixed(2)} EARN</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Min withdrawal</span><span className="text-foreground">500 EARN</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">You receive</span><span className="text-earn font-semibold">{receiveAmount.toFixed(2)} EARN</span></div>
            </div>
            <Button onClick={submitWithdrawal} disabled={submitting} className="w-full gradient-primary text-white border-0">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Withdrawal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Swap Modal */}
      <Dialog open={modal === "swap"} onOpenChange={() => setModal(null)}>
        <DialogContent className="glass border-border max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-foreground font-display">Swap XP</DialogTitle>
            <DialogDescription className="text-muted-foreground">Convert your XP points to tokens</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {/* From XP */}
            <div className="glass rounded-xl p-4">
              <p className="text-[10px] text-muted-foreground mb-1">From</p>
              <div className="flex items-center gap-2">
                <Input placeholder="0" type="number" value={swapAmount}
                  onChange={(e) => setSwapAmount(e.target.value)}
                  className="bg-transparent border-0 text-xl font-bold p-0 h-auto flex-1" />
                <div className="glass rounded-lg px-3 py-1.5 flex items-center gap-1 text-sm font-medium text-foreground shrink-0">
                  ⭐ XP
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Balance: {xpBalance.toLocaleString()} XP • ≈ ${swapXpUsd.toFixed(4)}
              </p>
            </div>

            <div className="flex justify-center">
              <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center">
                <Repeat className="h-4 w-4 text-white" />
              </div>
            </div>

            {/* To Token */}
            <div className="glass rounded-xl p-4">
              <p className="text-[10px] text-muted-foreground mb-1">To</p>
              <div className="flex items-center gap-2">
                <div className="text-xl font-bold text-foreground flex-1">
                  {swapReceive > 0 ? swapReceive.toFixed(4) : "0.0000"}
                </div>
                <select
                  value={swapTo}
                  onChange={(e) => setSwapTo(e.target.value)}
                  className="glass rounded-lg px-3 py-1.5 text-sm font-medium text-foreground border border-border bg-transparent"
                >
                  {currencies.map(c => (
                    <option key={c.id} value={c.symbol}>{c.symbol}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Rate info */}
            <div className="glass rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Rate</span>
                <span className="text-foreground">1 XP = ${tickerConfig.points_usd_rate}</span>
              </div>
              {swapTargetCurrency && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">1 {swapTo}</span>
                  <span className="text-foreground">= ${swapTargetCurrency.exchange_rate}</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Min swap</span>
                <span className="text-foreground">100 XP</span>
              </div>
            </div>

            <Button onClick={executeSwap} disabled={swapping || swapAmountNum < 100}
              className="w-full gradient-primary text-white border-0">
              {swapping ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Swap"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WalletScreen;
