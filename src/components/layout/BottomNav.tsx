import { Home, DollarSign, Gift, Wallet, User } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { hapticFeedback } from "@/hooks/useTelegram";

const tabs = [
  { id: "home", icon: Home, label: "Home" },
  { id: "earn", icon: DollarSign, label: "Earn" },
  { id: "airdrop", icon: Gift, label: "Airdrop" },
  { id: "wallet", icon: Wallet, label: "Wallet" },
  { id: "profile", icon: User, label: "Profile" },
] as const;

export type TabId = (typeof tabs)[number]["id"];

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-2 px-3">
      <div className="mx-auto max-w-[400px]">
        <nav
          className="rounded-2xl px-2 py-2.5"
          style={{
            background: "hsl(var(--glass) / 0.35)",
            backdropFilter: "blur(24px) saturate(1.4)",
            WebkitBackdropFilter: "blur(24px) saturate(1.4)",
            border: "1px solid hsl(var(--glass-border) / 0.25)",
            boxShadow: "0 8px 32px hsl(var(--background) / 0.4)",
          }}
        >
          <div className="flex items-center justify-around">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { hapticFeedback.selection(); onTabChange(tab.id); }}
                  className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 transition-all"
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background: "hsl(var(--primary) / 0.12)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid hsl(var(--primary) / 0.15)",
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <tab.icon
                    className={cn(
                      "h-5 w-5 transition-colors relative z-10",
                      isActive ? "text-primary" : "text-muted-foreground/70"
                    )}
                  />
                  <span
                    className={cn(
                      "text-[10px] font-medium transition-colors relative z-10",
                      isActive ? "text-primary" : "text-muted-foreground/70"
                    )}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default BottomNav;
