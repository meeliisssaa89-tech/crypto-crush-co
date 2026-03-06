import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BottomNav, { type TabId } from "./BottomNav";
import HomeScreen from "@/components/screens/HomeScreen";
import EarnScreen from "@/components/screens/EarnScreen";
import AirdropScreen from "@/components/screens/AirdropScreen";
import WalletScreen from "@/components/screens/WalletScreen";
import ProfileScreen from "@/components/screens/ProfileScreen";
import { showBackButton, hideBackButton } from "@/hooks/useTelegram";

const screens: Record<TabId, React.ComponentType> = {
  home: HomeScreen,
  earn: EarnScreen,
  airdrop: AirdropScreen,
  wallet: WalletScreen,
  profile: ProfileScreen,
};

const AppShell = () => {
  const [activeTab, setActiveTab] = useState<TabId>("home");

  const Screen = screens[activeTab];

  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-background relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="safe-bottom min-h-screen"
        >
          <Screen />
        </motion.div>
      </AnimatePresence>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default AppShell;
