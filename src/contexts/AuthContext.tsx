import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";

import { supabase } from "@/integrations/supabase/client";

import {
  isTelegramEnvironment,
  getInitData,
  getTelegramUser,
  getStartParam,
} from "@/hooks/useTelegram";

import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  telegramAutoLogin: boolean;
  profileVersion: number;
  refreshProfile: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [telegramAutoLogin, setTelegramAutoLogin] = useState(false);
  const [profileVersion, setProfileVersion] = useState(0);

  const refreshProfile = useCallback(() => {
    setProfileVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    // 🔹 Listener لحالة المصادقة
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      setTelegramAutoLogin(false);
    });

    // 🔹 التحقق من Session الحالية + مطابقتها لمستخدم Telegram
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const tgUser = isTelegramEnvironment() ? getTelegramUser() : null;

      // 🚨 لو Session موجودة لكن تخص مستخدم تيليجرام مختلف
      if (session && tgUser) {
        const emailBelongsToUser = session.user?.email?.startsWith(`tg_${tgUser.id}@`) ||
          session.user?.email?.startsWith(`tg_${tgUser.id}_`);

        if (!emailBelongsToUser) {
          await supabase.auth.signOut();
          attemptTelegramLogin();
          return;
        }
      }

      setSession(session);
      setUser(session?.user ?? null);

      // 🔹 لا يوجد Session → حاول تسجيل الدخول عبر Telegram
      if (!session && isTelegramEnvironment()) {
        attemptTelegramLogin();
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 🔐 تسجيل الدخول التلقائي عبر Telegram
  const attemptTelegramLogin = async () => {
    const initData = getInitData();

    if (!initData) {
      setLoading(false);
      return;
    }

    const startParam = getStartParam(); // 🎯 كود الدعوة

    setTelegramAutoLogin(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "telegram-auth",
        {
          body: { initData, startParam },
        }
      );

      if (error || !data?.access_token) {
        console.error("[TG Auth] Failed:", error || data?.error);
        setLoading(false);
        setTelegramAutoLogin(false);
        return;
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      if (sessionError) {
        console.error("[TG Auth] Session error:", sessionError);
      }
    } catch (err) {
      console.error("[TG Auth] Error:", err);
      setLoading(false);
      setTelegramAutoLogin(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        telegramAutoLogin,
        profileVersion,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
