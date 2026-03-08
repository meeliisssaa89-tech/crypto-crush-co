import { useEffect, createContext, useContext, useState, ReactNode } from "react";
import {
  initTelegramApp,
  isTelegramEnvironment,
  getTelegramUser,
  getStartParam,
  getViewportHeight,
  getSafeAreaInset,
  getContentSafeAreaInset,
  getTelegramWebApp,
  type TelegramUser,
} from "@/hooks/useTelegram";

interface TelegramContextType {
  isTelegram: boolean;
  user: TelegramUser | null;
  startParam: string | null;
  viewportHeight: number;
  safeAreaTop: number;
  safeAreaBottom: number;
}

const TelegramContext = createContext<TelegramContextType>({
  isTelegram: false,
  user: null,
  startParam: null,
  viewportHeight: window.innerHeight,
  safeAreaTop: 0,
  safeAreaBottom: 0,
});

export const useTG = () => useContext(TelegramContext);

const TelegramProvider = ({ children }: { children: ReactNode }) => {
  const [isTelegram] = useState(() => isTelegramEnvironment());
  const [user] = useState(() => getTelegramUser());
  const [startParam] = useState(() => getStartParam());
  const [viewportHeight, setViewportHeight] = useState(() => getViewportHeight());
  const [safeAreaTop, setSafeAreaTop] = useState(0);
  const [safeAreaBottom, setSafeAreaBottom] = useState(0);

  useEffect(() => {
    if (isTelegram) {
      initTelegramApp();
      console.log("[TG] Running inside Telegram Mini App");

      const tg = getTelegramWebApp();
      if (tg) {
        // Set CSS vars for safe areas
        const updateSafeAreas = () => {
          const sa = getSafeAreaInset();
          const csa = getContentSafeAreaInset();
          setSafeAreaTop(sa.top + csa.top);
          setSafeAreaBottom(sa.bottom + csa.bottom);
          document.documentElement.style.setProperty("--tg-safe-top", `${sa.top + csa.top}px`);
          document.documentElement.style.setProperty("--tg-safe-bottom", `${sa.bottom + csa.bottom}px`);
        };

        const updateViewport = () => {
          setViewportHeight(tg.viewportStableHeight || tg.viewportHeight);
          document.documentElement.style.setProperty("--tg-viewport-height", `${tg.viewportStableHeight || tg.viewportHeight}px`);
        };

        updateSafeAreas();
        updateViewport();

        tg.onEvent("viewportChanged", updateViewport);
        tg.onEvent("safeAreaChanged", updateSafeAreas);
        tg.onEvent("contentSafeAreaChanged", updateSafeAreas);

        return () => {
          tg.offEvent("viewportChanged", updateViewport);
          tg.offEvent("safeAreaChanged", updateSafeAreas);
          tg.offEvent("contentSafeAreaChanged", updateSafeAreas);
        };
      }
    } else {
      console.log("[TG] Running as standalone web app");
    }
  }, [isTelegram]);

  return (
    <TelegramContext.Provider value={{ isTelegram, user, startParam, viewportHeight, safeAreaTop, safeAreaBottom }}>
      {children}
    </TelegramContext.Provider>
  );
};

export default TelegramProvider;
