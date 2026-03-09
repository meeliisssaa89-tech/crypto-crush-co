import { useState, useEffect, useCallback } from "react";
import { useTonConnectUI, useTonAddress, useTonWallet } from "@tonconnect/ui-react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, ExternalLink, Copy, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hapticFeedback } from "@/hooks/useTelegram";
import { toast } from "sonner";

interface TonBalance {
  nanotons: string;
  tons: number;
}

const TonWalletSection = () => {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const address = useTonAddress();
  const [balance, setBalance] = useState<TonBalance | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  const fetchBalance = useCallback(async () => {
    if (!address) return;
    setLoadingBalance(true);
    try {
      const res = await fetch(
        `https://toncenter.com/api/v2/getAddressBalance?address=${address}`
      );
      const data = await res.json();
      if (data.ok) {
        const nanotons = data.result;
        setBalance({
          nanotons,
          tons: parseInt(nanotons, 10) / 1e9,
        });
      }
    } catch {
      console.error("Failed to fetch TON balance");
    } finally {
      setLoadingBalance(false);
    }
  }, [address]);

  useEffect(() => {
    if (wallet && address) {
      fetchBalance();
    } else {
      setBalance(null);
    }
  }, [wallet, address, fetchBalance]);

  const handleConnect = async () => {
    hapticFeedback.impact("medium");
    try {
      await tonConnectUI.openModal();
    } catch (err) {
      console.error("TON Connect error:", err);
    }
  };

  const handleDisconnect = async () => {
    hapticFeedback.impact("medium");
    await tonConnectUI.disconnect();
    setBalance(null);
    toast.success("Wallet disconnected");
  };

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    hapticFeedback.notification("success");
    toast.success("Address copied!");
  };

  if (!wallet) {
    return (
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleConnect}
        className="w-full glass rounded-2xl p-4 flex items-center gap-3 border border-dashed border-primary/30 hover:border-primary/50 transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
          <Wallet className="h-5 w-5 text-accent" />
        </div>
        <div className="text-left flex-1">
          <p className="text-sm font-semibold text-foreground">Connect TON Wallet</p>
          <p className="text-[10px] text-muted-foreground">
            Link your wallet to view on-chain balances
          </p>
        </div>
        <div className="text-[10px] font-medium text-primary px-2 py-1 rounded-full bg-primary/10">
          Connect
        </div>
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-4 space-y-3 border border-accent/20"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">TON Wallet</p>
              <button
                onClick={copyAddress}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                {shortAddress}
                <Copy className="h-2.5 w-2.5" />
              </button>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        {/* On-chain TON balance */}
        <div className="glass rounded-xl p-3 flex items-center gap-3">
          <span className="text-2xl">💎</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">TON</p>
            <p className="text-[10px] text-muted-foreground">Toncoin</p>
          </div>
          <div className="text-right">
            {loadingBalance ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary ml-auto" />
            ) : (
              <>
                <p className="text-sm font-semibold text-foreground">
                  {balance ? balance.tons.toFixed(4) : "0.0000"}
                </p>
                <p className="text-[10px] text-muted-foreground">On-chain</p>
              </>
            )}
          </div>
        </div>

        <a
          href={`https://tonviewer.com/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 text-[10px] text-accent hover:underline"
        >
          View on Tonviewer <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </motion.div>
    </AnimatePresence>
  );
};

export default TonWalletSection;
