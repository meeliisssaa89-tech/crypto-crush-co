import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft, Repeat, Copy, Eye, EyeOff, ChevronDown, QrCode, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const tokens = [
  { symbol: "EARN", name: "EarnToken", balance: "1,100.00", value: "$110.00", icon: "🪙", color: "from-purple-500 to-blue-500" },
  { symbol: "USDT", name: "Tether", balance: "45.50", value: "$45.50", icon: "💵", color: "from-green-500 to-emerald-500" },
  { symbol: "BNB", name: "Binance Coin", balance: "0.125", value: "$38.75", icon: "🔶", color: "from-yellow-500 to-orange-500" },
  { symbol: "SOL", name: "Solana", balance: "0.85", value: "$127.50", icon: "🟣", color: "from-violet-500 to-purple-500" },
];

const transactions = [
  { type: "in", title: "Task Reward", amount: "+50 EARN", time: "2m ago" },
  { type: "in", title: "Referral Bonus", amount: "+120 EARN", time: "1h ago" },
  { type: "out", title: "Withdrawal", amount: "-500 EARN", time: "5h ago" },
  { type: "swap", title: "Swap EARN → USDT", amount: "200 EARN", time: "1d ago" },
  { type: "in", title: "Airdrop Claim", amount: "+1000 EARN", time: "2d ago" },
];

type ModalType = "deposit" | "withdraw" | "swap" | null;

const WalletScreen = () => {
  const [hideBalance, setHideBalance] = useState(false);
  const [modal, setModal] = useState<ModalType>(null);

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-display font-bold text-foreground">Wallet</h1>
        <button onClick={() => setHideBalance(!hideBalance)} className="text-muted-foreground">
          {hideBalance ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>

      {/* Main Balance Card */}
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="glass rounded-2xl p-5 relative overflow-hidden border border-primary/20"
      >
        <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-primary/10 blur-2xl" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-accent/10 blur-2xl" />
        <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
        <h2 className="text-3xl font-display font-bold text-foreground mb-1">
          {hideBalance ? "••••••" : "$321.75"}
        </h2>
        <p className="text-xs text-earn mb-5">+$12.40 (4.01%) today</p>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {[
            { icon: ArrowDownLeft, label: "Deposit", action: "deposit" as ModalType },
            { icon: ArrowUpRight, label: "Withdraw", action: "withdraw" as ModalType },
            { icon: Repeat, label: "Swap", action: "swap" as ModalType },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={() => setModal(btn.action)}
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

      {/* Token List */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Assets</h3>
        <div className="space-y-2">
          {tokens.map((token) => (
            <motion.div
              key={token.symbol}
              whileTap={{ scale: 0.98 }}
              className="glass rounded-xl p-3.5 flex items-center gap-3"
            >
              <span className="text-2xl">{token.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{token.symbol}</p>
                <p className="text-[10px] text-muted-foreground">{token.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">{hideBalance ? "••••" : token.balance}</p>
                <p className="text-[10px] text-muted-foreground">{hideBalance ? "••••" : token.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Transactions */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Recent Transactions</h3>
        <div className="space-y-2">
          {transactions.map((tx, i) => (
            <div key={i} className="glass rounded-lg p-3 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                tx.type === "in" ? "bg-earn/20" : tx.type === "out" ? "bg-destructive/20" : "bg-primary/20"
              }`}>
                {tx.type === "in" ? (
                  <ArrowDownLeft className="h-4 w-4 text-earn" />
                ) : tx.type === "out" ? (
                  <ArrowUpRight className="h-4 w-4 text-destructive" />
                ) : (
                  <Repeat className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground">{tx.title}</p>
                <p className="text-[10px] text-muted-foreground">{tx.time}</p>
              </div>
              <span className={`text-sm font-semibold ${
                tx.type === "in" ? "text-earn" : tx.type === "out" ? "text-destructive" : "text-primary"
              }`}>{tx.amount}</span>
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
            <div className="w-32 h-32 mx-auto bg-muted rounded-xl flex items-center justify-center">
              <QrCode className="h-16 w-16 text-muted-foreground" />
            </div>
            <div className="glass rounded-lg p-3 flex items-center gap-2">
              <p className="text-xs text-muted-foreground flex-1 truncate font-mono">0x1a2b...f8e9</p>
              <button className="text-primary"><Copy className="h-4 w-4" /></button>
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
                <button key={m} className="glass rounded-lg p-2.5 text-xs font-medium text-foreground hover:border-primary/50 border border-transparent transition-colors">
                  {m}
                </button>
              ))}
            </div>
            <Input placeholder="Amount" type="number" className="bg-secondary/50" />
            <div className="glass rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Fee</span><span className="text-foreground">2%</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Min withdrawal</span><span className="text-foreground">500 EARN</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">You receive</span><span className="text-earn font-semibold">0.00</span></div>
            </div>
            <Button className="w-full gradient-primary text-white border-0">Confirm Withdrawal</Button>
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
