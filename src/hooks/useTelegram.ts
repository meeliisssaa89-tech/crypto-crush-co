// Telegram Mini App SDK integration
// Detects if running inside Telegram, provides user data, haptic feedback, and back button handling

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    start_param?: string;
  };
  version: string;
  platform: string;
  colorScheme: "light" | "dark";
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  ready: () => void;
  expand: () => void;
  close: () => void;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    show: () => void;
    hide: () => void;
    setText: (text: string) => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
    notificationOccurred: (type: "error" | "success" | "warning") => void;
    selectionChanged: () => void;
  };
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

const getTelegramWebApp = (): TelegramWebApp | null => {
  return window.Telegram?.WebApp ?? null;
};

export const isTelegramEnvironment = (): boolean => {
  const tg = getTelegramWebApp();
  return !!tg && !!tg.initData;
};

export const getTelegramUser = (): TelegramUser | null => {
  const tg = getTelegramWebApp();
  return tg?.initDataUnsafe?.user ?? null;
};

export const getStartParam = (): string | null => {
  const tg = getTelegramWebApp();
  return tg?.initDataUnsafe?.start_param ?? null;
};

export const hapticFeedback = {
  impact: (style: "light" | "medium" | "heavy" | "rigid" | "soft" = "medium") => {
    getTelegramWebApp()?.HapticFeedback?.impactOccurred(style);
  },
  notification: (type: "error" | "success" | "warning") => {
    getTelegramWebApp()?.HapticFeedback?.notificationOccurred(type);
  },
  selection: () => {
    getTelegramWebApp()?.HapticFeedback?.selectionChanged();
  },
};

export const initTelegramApp = () => {
  const tg = getTelegramWebApp();
  if (!tg) return;

  tg.ready();
  tg.expand();
  tg.setHeaderColor("#0f1117");
  tg.setBackgroundColor("#0f1117");
};

export const showBackButton = (callback: () => void) => {
  const tg = getTelegramWebApp();
  if (!tg) return () => {};

  tg.BackButton.show();
  tg.BackButton.onClick(callback);

  return () => {
    tg.BackButton.hide();
    tg.BackButton.offClick(callback);
  };
};

export const hideBackButton = () => {
  getTelegramWebApp()?.BackButton.hide();
};

export const useTelegramContext = () => {
  return {
    isTelegram: isTelegramEnvironment(),
    user: getTelegramUser(),
    startParam: getStartParam(),
    haptic: hapticFeedback,
  };
};
