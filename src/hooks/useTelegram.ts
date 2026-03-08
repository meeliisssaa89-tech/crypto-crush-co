// Full Telegram Mini App SDK integration
// Supports: user detection, haptic feedback, back button, cloud storage,
// theme params, popups, QR scanner, sharing, viewport, biometric auth

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  is_premium?: boolean;
  allows_write_to_pm?: boolean;
}

interface SafeAreaInset {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    start_param?: string;
    auth_date?: number;
    hash?: string;
    query_id?: string;
    chat_instance?: string;
    chat_type?: string;
  };
  version: string;
  platform: string;
  colorScheme: "light" | "dark";
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
    header_bg_color?: string;
    accent_text_color?: string;
    section_bg_color?: string;
    section_header_text_color?: string;
    subtitle_text_color?: string;
    destructive_text_color?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  isClosingConfirmationEnabled: boolean;
  isVerticalSwipesEnabled: boolean;
  headerColor: string;
  backgroundColor: string;
  bottomBarColor: string;
  safeAreaInset: SafeAreaInset;
  contentSafeAreaInset: SafeAreaInset;
  ready: () => void;
  expand: () => void;
  close: () => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  disableVerticalSwipes: () => void;
  enableVerticalSwipes: () => void;
  requestFullscreen: () => void;
  exitFullscreen: () => void;
  lockOrientation: () => void;
  unlockOrientation: () => void;
  sendData: (data: string) => void;
  switchInlineQuery: (query: string, chatTypes?: string[]) => void;
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  openTelegramLink: (url: string) => void;
  openInvoice: (url: string, callback?: (status: string) => void) => void;
  shareToStory: (media_url: string, params?: { text?: string; widget_link?: { url: string; name?: string } }) => void;
  requestContact: (callback: (shared: boolean) => void) => void;
  requestWriteAccess: (callback: (granted: boolean) => void) => void;
  showPopup: (params: { title?: string; message: string; buttons?: Array<{ id?: string; type?: string; text?: string }> }, callback?: (buttonId: string) => void) => void;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
  showScanQrPopup: (params: { text?: string }, callback?: (data: string) => boolean) => void;
  closeScanQrPopup: () => void;
  readTextFromClipboard: (callback: (text: string) => void) => void;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    show: () => void;
    hide: () => void;
    setText: (text: string) => void;
    setParams: (params: { text?: string; color?: string; text_color?: string; is_active?: boolean; is_visible?: boolean; has_shine_effect?: boolean }) => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
    enable: () => void;
    disable: () => void;
  };
  SecondaryButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    show: () => void;
    hide: () => void;
    setText: (text: string) => void;
    setParams: (params: { text?: string; color?: string; text_color?: string; is_active?: boolean; is_visible?: boolean; has_shine_effect?: boolean; position?: string }) => void;
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
  SettingsButton: {
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
  CloudStorage: {
    setItem: (key: string, value: string, callback?: (error: string | null, stored: boolean) => void) => void;
    getItem: (key: string, callback: (error: string | null, value: string) => void) => void;
    getItems: (keys: string[], callback: (error: string | null, values: Record<string, string>) => void) => void;
    removeItem: (key: string, callback?: (error: string | null, removed: boolean) => void) => void;
    removeItems: (keys: string[], callback?: (error: string | null, removed: boolean) => void) => void;
    getKeys: (callback: (error: string | null, keys: string[]) => void) => void;
  };
  BiometricManager: {
    isInited: boolean;
    isBiometricAvailable: boolean;
    biometricType: string;
    isAccessRequested: boolean;
    isAccessGranted: boolean;
    isBiometricTokenSaved: boolean;
    deviceId: string;
    init: (callback?: () => void) => void;
    requestAccess: (params: { reason: string }, callback?: (granted: boolean) => void) => void;
    authenticate: (params: { reason: string }, callback?: (success: boolean, token?: string) => void) => void;
    updateBiometricToken: (token: string, callback?: (updated: boolean) => void) => void;
    openSettings: () => void;
  };
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  setBottomBarColor: (color: string) => void;
  onEvent: (eventType: string, callback: () => void) => void;
  offEvent: (eventType: string, callback: () => void) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export const getTelegramWebApp = (): TelegramWebApp | null => {
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

export const getInitData = (): string => {
  return getTelegramWebApp()?.initData ?? "";
};

export const getPlatform = (): string => {
  return getTelegramWebApp()?.platform ?? "unknown";
};

export const getVersion = (): string => {
  return getTelegramWebApp()?.version ?? "0.0";
};

// Haptic Feedback
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

// Cloud Storage
export const cloudStorage = {
  set: (key: string, value: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const tg = getTelegramWebApp();
      if (!tg?.CloudStorage) { resolve(false); return; }
      tg.CloudStorage.setItem(key, value, (err, stored) => resolve(!err && stored));
    });
  },
  get: (key: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const tg = getTelegramWebApp();
      if (!tg?.CloudStorage) { resolve(null); return; }
      tg.CloudStorage.getItem(key, (err, value) => resolve(err ? null : value));
    });
  },
  getMultiple: (keys: string[]): Promise<Record<string, string> | null> => {
    return new Promise((resolve) => {
      const tg = getTelegramWebApp();
      if (!tg?.CloudStorage) { resolve(null); return; }
      tg.CloudStorage.getItems(keys, (err, values) => resolve(err ? null : values));
    });
  },
  remove: (key: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const tg = getTelegramWebApp();
      if (!tg?.CloudStorage) { resolve(false); return; }
      tg.CloudStorage.removeItem(key, (err, removed) => resolve(!err && removed));
    });
  },
  getKeys: (): Promise<string[]> => {
    return new Promise((resolve) => {
      const tg = getTelegramWebApp();
      if (!tg?.CloudStorage) { resolve([]); return; }
      tg.CloudStorage.getKeys((err, keys) => resolve(err ? [] : keys));
    });
  },
};

// Popup & Alerts
export const showPopup = (params: {
  title?: string;
  message: string;
  buttons?: Array<{ id?: string; type?: string; text?: string }>;
}): Promise<string> => {
  return new Promise((resolve) => {
    const tg = getTelegramWebApp();
    if (!tg) { resolve(""); return; }
    tg.showPopup(params, (buttonId) => resolve(buttonId));
  });
};

export const showAlert = (message: string): Promise<void> => {
  return new Promise((resolve) => {
    const tg = getTelegramWebApp();
    if (!tg) { resolve(); return; }
    tg.showAlert(message, () => resolve());
  });
};

export const showConfirm = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const tg = getTelegramWebApp();
    if (!tg) { resolve(false); return; }
    tg.showConfirm(message, (confirmed) => resolve(confirmed));
  });
};

// QR Scanner
export const scanQrCode = (text?: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const tg = getTelegramWebApp();
    if (!tg) { resolve(null); return; }
    tg.showScanQrPopup({ text: text ?? "Scan QR Code" }, (data) => {
      tg.closeScanQrPopup();
      resolve(data);
      return true;
    });
  });
};

// Sharing & Links
export const openLink = (url: string, tryInstantView = false) => {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.openLink(url, { try_instant_view: tryInstantView });
  } else {
    window.open(url, "_blank");
  }
};

export const openTelegramLink = (url: string) => {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.openTelegramLink(url);
  } else {
    window.open(url, "_blank");
  }
};

export const shareToStory = (mediaUrl: string, text?: string) => {
  getTelegramWebApp()?.shareToStory(mediaUrl, { text });
};

export const switchInlineQuery = (query: string, chatTypes?: string[]) => {
  getTelegramWebApp()?.switchInlineQuery(query, chatTypes);
};

// Write access & Contact sharing
export const requestWriteAccess = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const tg = getTelegramWebApp();
    if (!tg) { resolve(false); return; }
    tg.requestWriteAccess((granted) => resolve(granted));
  });
};

export const requestContact = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const tg = getTelegramWebApp();
    if (!tg) { resolve(false); return; }
    tg.requestContact((shared) => resolve(shared));
  });
};

// Clipboard
export const readClipboard = (): Promise<string | null> => {
  return new Promise((resolve) => {
    const tg = getTelegramWebApp();
    if (!tg) { resolve(null); return; }
    tg.readTextFromClipboard((text) => resolve(text));
  });
};

// Biometric Auth
export const biometric = {
  init: (): Promise<void> => {
    return new Promise((resolve) => {
      const tg = getTelegramWebApp();
      if (!tg?.BiometricManager) { resolve(); return; }
      tg.BiometricManager.init(() => resolve());
    });
  },
  isAvailable: (): boolean => {
    return getTelegramWebApp()?.BiometricManager?.isBiometricAvailable ?? false;
  },
  requestAccess: (reason: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const tg = getTelegramWebApp();
      if (!tg?.BiometricManager) { resolve(false); return; }
      tg.BiometricManager.requestAccess({ reason }, (granted) => resolve(granted));
    });
  },
  authenticate: (reason: string): Promise<{ success: boolean; token?: string }> => {
    return new Promise((resolve) => {
      const tg = getTelegramWebApp();
      if (!tg?.BiometricManager) { resolve({ success: false }); return; }
      tg.BiometricManager.authenticate({ reason }, (success, token) => resolve({ success, token }));
    });
  },
};

// Main Button
export const mainButton = {
  show: (text: string, callback: () => void) => {
    const tg = getTelegramWebApp();
    if (!tg) return () => {};
    tg.MainButton.setText(text);
    tg.MainButton.show();
    tg.MainButton.onClick(callback);
    return () => {
      tg.MainButton.hide();
      tg.MainButton.offClick(callback);
    };
  },
  hide: () => {
    getTelegramWebApp()?.MainButton.hide();
  },
  showProgress: () => {
    getTelegramWebApp()?.MainButton.showProgress(true);
  },
  hideProgress: () => {
    getTelegramWebApp()?.MainButton.hideProgress();
  },
};

// Back Button
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

// Settings Button
export const showSettingsButton = (callback: () => void) => {
  const tg = getTelegramWebApp();
  if (!tg) return () => {};
  tg.SettingsButton.show();
  tg.SettingsButton.onClick(callback);
  return () => {
    tg.SettingsButton.hide();
    tg.SettingsButton.offClick(callback);
  };
};

// Theme
export const getThemeParams = () => {
  return getTelegramWebApp()?.themeParams ?? {};
};

export const getColorScheme = (): "light" | "dark" => {
  return getTelegramWebApp()?.colorScheme ?? "dark";
};

// Viewport
export const getViewportHeight = (): number => {
  return getTelegramWebApp()?.viewportStableHeight ?? window.innerHeight;
};

export const getSafeAreaInset = (): SafeAreaInset => {
  return getTelegramWebApp()?.safeAreaInset ?? { top: 0, bottom: 0, left: 0, right: 0 };
};

export const getContentSafeAreaInset = (): SafeAreaInset => {
  return getTelegramWebApp()?.contentSafeAreaInset ?? { top: 0, bottom: 0, left: 0, right: 0 };
};

// Init
export const initTelegramApp = () => {
  const tg = getTelegramWebApp();
  if (!tg) return;

  tg.ready();
  tg.expand();
  tg.setHeaderColor("#0f1117");
  tg.setBackgroundColor("#0f1117");
  tg.setBottomBarColor?.("#0f1117");
  tg.disableVerticalSwipes?.();
  tg.enableClosingConfirmation?.();

  // Request fullscreen on supported versions
  try { tg.requestFullscreen?.(); } catch {}

  console.log("[TG] Platform:", tg.platform, "Version:", tg.version);
  console.log("[TG] User:", tg.initDataUnsafe?.user?.username);
};

// Combined hook
export const useTelegramContext = () => {
  return {
    isTelegram: isTelegramEnvironment(),
    user: getTelegramUser(),
    startParam: getStartParam(),
    initData: getInitData(),
    platform: getPlatform(),
    version: getVersion(),
    haptic: hapticFeedback,
    cloud: cloudStorage,
    theme: getThemeParams(),
    colorScheme: getColorScheme(),
    viewportHeight: getViewportHeight(),
    safeArea: getSafeAreaInset(),
    contentSafeArea: getContentSafeAreaInset(),
  };
};
