import { useEffect, createContext, useContext, useState, ReactNode, useCallback } from "react";
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
  const [isTelegram, setIsTelegram] = useState(() => isTelegramEnvironment());
  const [user, setUser] = useState(() => getTelegramUser());
  const [startParam, setStartParam] = useState(() => getStartParam());
  const [viewportHeight, setViewportHeight] = useState(() => getViewportHeight());
  const [safeAreaTop, setSafeAreaTop] = useState(0);
  const [safeAreaBottom, setSafeAreaBottom] = useState(0);

  const syncTelegramState = useCallback(() => {
    setIsTelegram(isTelegramEnvironment());
    setUser(getTelegramUser());
    setStartParam(getStartParam());
    setViewportHeight(getViewportHeight());
    document.documentElement.style.setProperty("--tg-viewport-height", `${getViewportHeight()}px`);
  }, []);

  useEffect(() => {
    let intervalId: number | undefined;
    let timeoutId: number | undefined;
    let cleanupListeners: (() => void) | undefined;

    const applySafeAreas = () => {
      const sa = getSafeAreaInset();
      const csa = getContentSafeAreaInset();
      const nextTop = sa.top + csa.top;
      const nextBottom = sa.bottom + csa.bottom;

      setSafeAreaTop(nextTop);
      setSafeAreaBottom(nextBottom);
      document.documentElement.style.setProperty("--tg-safe-top", `${nextTop}px`);
      document.documentElement.style.setProperty("--tg-safe-bottom", `${nextBottom}px`);
    };

    const setupTelegram = () => {
      syncTelegramState();

      if (!isTelegramEnvironment()) {
        return false;
      }

      const tg = getTelegramWebApp();
      if (!tg) {
        applySafeAreas();
        return false;
      }

      initTelegramApp();
      console.log("[TG] Running inside Telegram Mini App");

      const updateViewport = () => {
        const nextHeight = tg.viewportStableHeight || tg.viewportHeight || window.innerHeight;
        setViewportHeight(nextHeight);
        document.documentElement.style.setProperty("--tg-viewport-height", `${nextHeight}px`);
      };

      applySafeAreas();
      updateViewport();

      tg.onEvent("viewportChanged", updateViewport);
      tg.onEvent("safeAreaChanged", applySafeAreas);
      tg.onEvent("contentSafeAreaChanged", applySafeAreas);

      cleanupListeners = () => {
        tg.offEvent("viewportChanged", updateViewport);
        tg.offEvent("safeAreaChanged", applySafeAreas);
        tg.offEvent("contentSafeAreaChanged", applySafeAreas);
      };

      return true;
    };

    if (!setupTelegram()) {
      intervalId = window.setInterval(() => {
        if (setupTelegram() && intervalId) {
          window.clearInterval(intervalId);
          intervalId = undefined;
        }
      }, 250);

      timeoutId = window.setTimeout(() => {
        if (intervalId) {
          window.clearInterval(intervalId);
          intervalId = undefined;
        }

        syncTelegramState();

        if (!isTelegramEnvironment()) {
          console.log("[TG] Running as standalone web app");
        }
      }, 5000);
    }

    return () => {
      if (intervalId) window.clearInterval(intervalId);
      if (timeoutId) window.clearTimeout(timeoutId);
      cleanupListeners?.();
    };
  }, [syncTelegramState]);

  return (
    <TelegramContext.Provider value={{ isTelegram, user, startParam, viewportHeight, safeAreaTop, safeAreaBottom }}>
      {children}
    </TelegramContext.Provider>
  );
};

export default TelegramProvider;
