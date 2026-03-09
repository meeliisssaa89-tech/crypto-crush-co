import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft, Repeat, Copy, Eye, EyeOff, ChevronDown, QrCode, Loader2 } from "lucide-react";
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
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("Crypto");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const [{ data: curr }, { data: bal }, { data: txs }] = await Promise.all([
      supabase.from("currencies").select("*").eq("is_active", true),
      supabase.from("user_balances").select("*, currencies(symbol, name)").eq("user_id", user.id),
      supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
    ]);

    if (curr) setCurrencies(curr);
    if (bal) setBalances(bal);
    if (txs) setTransactions(txs);
    setLoading(false);
  };

  const totalBalance = balances.reduce((sum, b) => {
    const curr = currencies.find(c => c.id === b.currency_id);
    return sum + Number(b.balance) * (curr?.exchange_rate ?? 0);
  }, 0);

  const submitWithdrawal = async () => {
    if (!user || submitting) return;
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < 500) {
      toast.error("Minimum withdrawal is 500 EARN");
      return;
    }
    setSubmitting(true);
    hapticFeedback.impact("medium");

    const fee = amount * 0.02;
    const earnCurrency = currencies.find(c => c.symbol === "EARN");

    const { error } = await supabase.from("withdrawal_requests").insert({
      user_id: user.id,
      amount,
      method: withdrawMethod,
      wallet_address: withdrawAddress || null,
      fee_amount: fee,
      currency_id: earnCurrency?.id || null,
    });

    if (error) {
      toast.error("Failed to submit withdrawal");
    } else {
      hapticFeedback.notification("success");
      toast.success("Withdrawal request submitted!");
      setModal(null);
      setWithdrawAmount("");
      setWithdrawAddress("");
      fetchData();
    }
    setSubmitting(false);
  };

  const tokenIcons: Record<string, string> = { EARN: "🪙", USDT: "💵", PTS: "⭐", BNB: "🔶", SOL: "🟣" };
  const tokenColors: Record<string, string> = {
    EARN: "from-purple-500 to-blue-500",
    USDT: "from-green-500 to-emerald-500",
    PTS: "from-yellow-500 to-orange-500",
  };

  const feeAmount = parseFloat(withdrawAmount) ? parseFloat(withdrawAmount) * 0.02 : 0;
  const receiveAmount = parseFloat(withdrawAmount) ? parseFloat(withdrawAmount) - feeAmount : 0;

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-display font-bold text-foreground">Wallet</h1>
        <button onClick={() => { hapticFeedback.selection(); setHideBalance(!hideBalance); }} className="text-muted-foreground">
          {hideBalance ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>

      {/* Main Balance */}
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="glass rounded-2xl p-5 relative overflow-hidden border border-primary/20">
        <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-primary/10 blur-2xl" />
        <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
        <h2 className="text-3xl font-display font-bold text-foreground mb-1">
          {hideBalance ? "••••••" : `$${totalBalance.toFixed(2)}`}
        </h2>
        <div className="flex gap-3 mt-4">
          {[
            { icon: ArrowDownLeft, label: "Deposit", action: "deposit" as ModalType },
            { icon: ArrowUpRight, label: "Withdraw", action: "withdraw" as ModalType },
            { icon: Repeat, label: "Swap", action: "swap" as ModalType },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={() => { hapticFeedback.impact("light"); setModal(btn.action); }}
              className="flex-1 glass rounded-xl py-2.5 flex flex-col items-center gap-1.5 hover:bg-secondary/50 transition-colors"
            >
              <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center">
                <btn.icon className="h-4 w-4 text-white" />
              </div>
              <span className="text-[10px] font-medium text-foreground">{btn.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* TON Wallet */}
      <TonWalletSection />

      {/* Token List */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Assets</h3>
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : currencies.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No currencies configured</p>
        ) : (
          <div className="space-y-2">
            {currencies.map((curr) => {
              const bal = balances.find(b => b.currency_id === curr.id);
              const balance = bal?.balance ?? 0;
              const value = balance * curr.exchange_rate;
              return (
                <motion.div key={curr.id} whileTap={{ scale: 0.98 }} className="glass rounded-xl p-3.5 flex items-center gap-3">
                  <span className="text-2xl">{tokenIcons[curr.symbol] || "🪙"}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{curr.symbol}</p>
                    <p className="text-[10px] text-muted-foreground">{curr.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{hideBalance ? "••••" : Number(balance).toLocaleString()}</p>
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
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="glass rounded-lg p-3 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  Number(tx.amount) > 0 ? "bg-earn/20" : "bg-destructive/20"
                }`}>
                  {Number(tx.amount) > 0 ? (
                    <ArrowDownLeft className="h-4 w-4 text-earn" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-destructive" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">{tx.description || tx.type}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`text-sm font-semibold ${Number(tx.amount) > 0 ? "text-earn" : "text-destructive"}`}>
                  {Number(tx.amount) > 0 ? "+" : ""}{tx.amount}
                </span>
              </div>
            ))
          )}
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
            <div className="w-32 h-32 mx-auto bg-muted rounded-xl flex items-center justify-center">
              <QrCode className="h-16 w-16 text-muted-foreground" />
            </div>
            <div className="glass rounded-lg p-3 flex items-center gap-2">
              <p className="text-xs text-muted-foreground flex-1 truncate font-mono">0x1a2b...f8e9</p>
              <button onClick={() => { hapticFeedback.notification("success"); toast.success("Address copied!"); }} className="text-primary"><Copy className="h-4 w-4" /></button>
            </div>
            <p className="text-[10px] text-center text-muted-foreground">Only send supported tokens to this address</p>
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
                <button
                  key={m}
                  onClick={() => { hapticFeedback.selection(); setWithdrawMethod(m); }}
                  className={`glass rounded-lg p-2.5 text-xs font-medium transition-colors ${
                    withdrawMethod === m ? "border-primary text-primary border" : "text-foreground border border-transparent"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <Input
              placeholder="Amount"
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="bg-secondary/50"
            />
            {withdrawMethod !== "Binance ID" && (
              <Input
                placeholder="Wallet address"
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                className="bg-secondary/50"
              />
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
            <DialogTitle className="text-foreground font-display">Swap</DialogTitle>
            <DialogDescription className="text-muted-foreground">Convert between currencies</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="glass rounded-xl p-4">
              <p className="text-[10px] text-muted-foreground mb-1">From</p>
              <div className="flex items-center gap-2">
                <Input placeholder="0.00" type="number" className="bg-transparent border-0 text-xl font-bold p-0 h-auto" />
                <button className="glass rounded-lg px-3 py-1.5 flex items-center gap-1 text-sm font-medium text-foreground shrink-0">
                  🪙 EARN <ChevronDown className="h-3 w-3" />
                </button>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center">
                <Repeat className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="glass rounded-xl p-4">
              <p className="text-[10px] text-muted-foreground mb-1">To</p>
              <div className="flex items-center gap-2">
                <Input placeholder="0.00" type="number" className="bg-transparent border-0 text-xl font-bold p-0 h-auto" readOnly />
                <button className="glass rounded-lg px-3 py-1.5 flex items-center gap-1 text-sm font-medium text-foreground shrink-0">
                  💵 USDT <ChevronDown className="h-3 w-3" />
                </button>
              </div>
            </div>
            <div className="glass rounded-lg p-3">
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Rate</span><span className="text-foreground">1 EARN = $0.10</span></div>
            </div>
            <Button className="w-full gradient-primary text-white border-0">Swap</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WalletScreen;
