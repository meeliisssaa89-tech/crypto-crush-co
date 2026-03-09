import { useState, useEffect, useCallback } from "react";
import { useTonConnectUI, useTonAddress, useTonWallet } from "@tonconnect/ui-react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, ExternalLink, Copy, LogOut, Loader2, RefreshCw } from "lucide-react";
import { hapticFeedback } from "@/hooks/useTelegram";
import { toast } from "sonner";

interface TonBalance {
  nanotons: string;
  tons: number;
}

interface Jetton {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceFormatted: number;
  image?: string;
  usdPrice?: number;
}

interface TonWalletSectionProps {
  hideBalance?: boolean;
  onAssetsLoaded?: (assets: { tonBalance: number; jettons: Jetton[] }) => void;
}

const TonWalletSection = ({ hideBalance = false, onAssetsLoaded }: TonWalletSectionProps) => {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const address = useTonAddress();
  const [balance, setBalance] = useState<TonBalance | null>(null);
  const [jettons, setJettons] = useState<Jetton[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [loadingJettons, setLoadingJettons] = useState(false);

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
        const tons = parseInt(nanotons, 10) / 1e9;
        setBalance({ nanotons, tons });
        return tons;
      }
    } catch {
      console.error("Failed to fetch TON balance");
    } finally {
      setLoadingBalance(false);
    }
    return 0;
  }, [address]);

  const fetchJettons = useCallback(async () => {
    if (!address) return;
    setLoadingJettons(true);
    try {
      const res = await fetch(
        `https://tonapi.io/v2/accounts/${address}/jettons?currencies=usd`
      );
      const data = await res.json();
      if (data.balances && Array.isArray(data.balances)) {
        const parsed: Jetton[] = data.balances
          .filter((j: any) => j.balance && j.balance !== "0")
          .map((j: any) => {
            const meta = j.jetton;
            const decimals = meta?.decimals ?? 9;
            const rawBalance = j.balance || "0";
            const balanceFormatted = parseInt(rawBalance, 10) / Math.pow(10, decimals);
            return {
              address: meta?.address || "",
              symbol: meta?.symbol || "???",
              name: meta?.name || "Unknown",
              decimals,
              balance: rawBalance,
              balanceFormatted,
              image: meta?.image || meta?.icon || undefined,
              usdPrice: j.price?.prices?.USD || 0,
            };
          });
        setJettons(parsed);
        return parsed;
      }
    } catch {
      console.error("Failed to fetch jettons");
    } finally {
      setLoadingJettons(false);
    }
    return [];
  }, [address]);

  useEffect(() => {
    if (wallet && address) {
      Promise.all([fetchBalance(), fetchJettons()]).then(([tons, jts]) => {
        onAssetsLoaded?.({ tonBalance: tons || 0, jettons: jts || [] });
      });
    } else {
      setBalance(null);
      setJettons([]);
      onAssetsLoaded?.({ tonBalance: 0, jettons: [] });
    }
  }, [wallet, address, fetchBalance, fetchJettons]);

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
    setJettons([]);
    toast.success("Wallet disconnected");
  };

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    hapticFeedback.notification("success");
    toast.success("Address copied!");
  };

  const refreshAll = async () => {
    hapticFeedback.impact("light");
    const [tons, jts] = await Promise.all([fetchBalance(), fetchJettons()]);
    onAssetsLoaded?.({ tonBalance: tons || 0, jettons: jts || [] });
    toast.success("Refreshed!");
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
            Link your wallet to view on-chain balances & tokens
          </p>
        </div>
        <div className="text-[10px] font-medium text-primary px-2 py-1 rounded-full bg-primary/10">
          Connect
        </div>
      </motion.button>
    );
  }

  const isLoading = loadingBalance || loadingJettons;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        {/* Wallet Header */}
        <div className="glass rounded-2xl p-4 border border-accent/20">
          <div className="flex items-center justify-between mb-3">
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
            <div className="flex items-center gap-2">
              <button onClick={refreshAll} disabled={isLoading} className="text-muted-foreground hover:text-primary transition-colors">
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>
              <button onClick={handleDisconnect} className="text-muted-foreground hover:text-destructive transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* TON Balance */}
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
                <p className="text-sm font-semibold text-foreground">
                  {hideBalance ? "••••" : balance ? balance.tons.toFixed(4) : "0.0000"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Jettons List */}
        {jettons.length > 0 && (
          <div className="space-y-1.5">
            {jettons.map((jet) => {
              const usdValue = jet.balanceFormatted * (jet.usdPrice || 0);
              return (
                <motion.div
                  key={jet.address}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass rounded-xl p-3 flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-full bg-secondary/50 flex items-center justify-center overflow-hidden shrink-0">
                    {jet.image ? (
                      <img src={jet.image} alt={jet.symbol} className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <span className="text-sm">🪙</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{jet.symbol}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{jet.name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-foreground">
                      {hideBalance ? "••••" : jet.balanceFormatted.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </p>
                    {jet.usdPrice ? (
                      <p className="text-[10px] text-muted-foreground">
                        {hideBalance ? "••••" : `$${usdValue.toFixed(2)}`}
                      </p>
                    ) : null}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Tonviewer link */}
        <a
          href={`https://tonviewer.com/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 text-[10px] text-accent hover:underline pt-1"
        >
          View on Tonviewer <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </motion.div>
    </AnimatePresence>
  );
};

export default TonWalletSection;
