import { useEffect } from "react";
import { initTelegramApp, isTelegramEnvironment } from "@/hooks/useTelegram";

const TelegramProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    if (isTelegramEnvironment()) {
      initTelegramApp();
      console.log("[TG] Running inside Telegram Mini App");
    } else {
      console.log("[TG] Running as standalone web app");
    }
  }, []);

  return <>{children}</>;
};

export default TelegramProvider;
