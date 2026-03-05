import { motion } from "framer-motion";
import { Copy, Share2, Users, ChevronRight, Settings, Globe, Bell, Shield, LogOut, Crown, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const referralStats = [
  { level: "Level 1", count: 24, earnings: 2400, percent: "10%" },
  { level: "Level 2", count: 86, earnings: 1720, percent: "5%" },
  { level: "Level 3", count: 312, earnings: 1560, percent: "2%" },
];

const withdrawalHistory = [
  { id: 1, amount: "500 EARN", method: "USDT", status: "completed", date: "Mar 1" },
  { id: 2, amount: "1000 EARN", method: "Crypto", status: "pending", date: "Feb 28" },
  { id: 3, amount: "250 EARN", method: "Binance ID", status: "completed", date: "Feb 25" },
];

const ProfileScreen = () => {
  const referralLink = "t.me/earnbot?ref=user123";

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      {/* Profile Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-2xl">
          👤
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-display font-bold text-foreground">CryptoEarner</h1>
            <Crown className="h-4 w-4 text-warning" />
          </div>
          <p className="text-xs text-muted-foreground">Level 12 • Top 5%</p>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3 text-earn" />
            <span className="text-[10px] text-earn">Active streak: 5 days</span>
          </div>
        </div>
      </div>

      {/* Referral Card */}
      <div className="glass rounded-xl p-4 border border-primary/20">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Invite & Earn</span>
        </div>
        <div className="glass rounded-lg p-3 flex items-center gap-2 mb-3">
          <p className="text-xs text-muted-foreground flex-1 truncate font-mono">{referralLink}</p>
          <button className="text-primary"><Copy className="h-4 w-4" /></button>
          <button className="text-primary"><Share2 className="h-4 w-4" /></button>
        </div>
        <p className="text-[10px] text-muted-foreground">Earn up to 10% from your referrals' earnings</p>
      </div>

      {/* Referral Stats */}
      <div className="glass rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Referral Breakdown</h3>
        <div className="space-y-3">
          {referralStats.map((stat) => (
            <div key={stat.level} className="flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground w-14">{stat.level}</span>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-foreground">{stat.count} users</span>
                  <span className="text-xs text-earn">+{stat.earnings} coins</span>
                </div>
                <Progress value={(stat.count / 400) * 100} className="h-1 bg-muted" />
              </div>
              <span className="text-[10px] text-primary font-semibold w-8">{stat.percent}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-border flex justify-between">
          <span className="text-xs text-muted-foreground">Total referral earnings</span>
          <span className="text-sm font-bold text-earn">5,680 coins</span>
        </div>
      </div>

      {/* Withdrawal History */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Withdrawal History</h3>
        <div className="space-y-2">
          {withdrawalHistory.map((w) => (
            <div key={w.id} className="glass rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">{w.amount}</p>
                <p className="text-[10px] text-muted-foreground">{w.method} • {w.date}</p>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                w.status === "completed" ? "bg-earn/20 text-earn" : "bg-warning/20 text-warning"
              }`}>{w.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground mb-2">Settings</h3>
        {[
          { icon: Globe, label: "Language", value: "English" },
          { icon: Bell, label: "Notifications", value: "On" },
          { icon: Shield, label: "Security", value: "" },
          { icon: LogOut, label: "Logout", value: "", destructive: true },
        ].map((item) => (
          <button
            key={item.label}
            className="glass rounded-lg p-3 w-full flex items-center gap-3 hover:bg-secondary/50 transition-colors"
          >
            <item.icon className={`h-4 w-4 ${item.destructive ? 'text-destructive' : 'text-muted-foreground'}`} />
            <span className={`flex-1 text-sm text-left ${item.destructive ? 'text-destructive' : 'text-foreground'}`}>{item.label}</span>
            {item.value && <span className="text-xs text-muted-foreground">{item.value}</span>}
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProfileScreen;
