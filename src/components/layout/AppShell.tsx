import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BottomNav, { type TabId } from "./BottomNav";
import HomeScreen from "@/components/screens/HomeScreen";
import EarnScreen from "@/components/screens/EarnScreen";
import AirdropScreen from "@/components/screens/AirdropScreen";
import WalletScreen from "@/components/screens/WalletScreen";
import ProfileScreen from "@/components/screens/ProfileScreen";
import { showBackButton, hideBackButton, showSettingsButton, hapticFeedback } from "@/hooks/useTelegram";
import { useTG } from "@/components/layout/TelegramProvider";

const screens: Record<TabId, React.ComponentType> = {
  home: HomeScreen,
  earn: EarnScreen,
  airdrop: AirdropScreen,
  wallet: WalletScreen,
  profile: ProfileScreen,
};

const AppShell = () => {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const { isTelegram } = useTG();

  useEffect(() => {
    if (activeTab !== "home") {
      const cleanup = showBackButton(() => {
        hapticFeedback.impact("light");
        setActiveTab("home");
      });
      return cleanup;
    } else {
      hideBackButton();
    }
  }, [activeTab]);

  // Show settings button in Telegram to go to Profile
  useEffect(() => {
    if (isTelegram) {
      const cleanup = showSettingsButton(() => {
        hapticFeedback.selection();
        setActiveTab("profile");
      });
      return cleanup;
    }
  }, [isTelegram]);

  const Screen = screens[activeTab];

  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-background relative" style={{ minHeight: "var(--tg-viewport-height, 100vh)" }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="safe-bottom min-h-screen"
          style={{ paddingTop: "var(--tg-safe-top, 0px)" }}
        >
          <Screen />
        </motion.div>
      </AnimatePresence>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default AppShell;
