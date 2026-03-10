import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isTelegramEnvironment, getInitData } from "@/hooks/useTelegram";
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

  // Call this after any XP/reward change to trigger re-fetches across screens
  const refreshProfile = useCallback(() => {
    setProfileVersion(v => v + 1);
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      setTelegramAutoLogin(false);
    });

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      // If no session and in Telegram, attempt auto-login
      if (!session && isTelegramEnvironment()) {
        attemptTelegramLogin();
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const attemptTelegramLogin = async () => {
    const initData = getInitData();
    if (!initData) {
      setLoading(false);
      return;
    }

    setTelegramAutoLogin(true);
    try {
      const { data, error } = await supabase.functions.invoke("telegram-auth", {
        body: { initData },
      });

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
    <AuthContext.Provider value={{ user, session, loading, telegramAutoLogin, profileVersion, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
