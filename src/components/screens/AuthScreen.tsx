import { motion } from "framer-motion";
import { Loader2, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const AuthScreen = () => {
  const { telegramAutoLogin } = useAuth();

  if (telegramAutoLogin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="w-16 h-16 mx-auto gradient-primary rounded-2xl flex items-center justify-center text-3xl">
            🪙
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Signing in via Telegram...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[380px] space-y-8 text-center"
      >
        <div className="space-y-3">
          <div className="w-20 h-20 mx-auto gradient-primary rounded-2xl flex items-center justify-center text-4xl mb-4">
            🪙
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">CryptoEarner</h1>
          <p className="text-sm text-muted-foreground">
            افتح التطبيق عبر بوت Telegram للدخول تلقائياً
          </p>
        </div>

        <div className="glass rounded-xl p-6 space-y-4">
          <Send className="h-10 w-10 text-primary mx-auto" />
          <p className="text-sm text-foreground font-medium">
            هذا التطبيق يعمل داخل Telegram فقط
          </p>
          <p className="text-xs text-muted-foreground">
            افتح البوت على Telegram وانقر "Start" للدخول تلقائياً بحسابك
          </p>
          <a
            href="https://t.me/earnbot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 gradient-primary text-white rounded-xl text-sm font-semibold"
          >
            <Send className="h-4 w-4" />
            Open in Telegram
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthScreen;
