import { useState, useEffect } from "react";
import {
  ArrowDownUp, Check, X, Loader2, Clock, CheckCircle2, XCircle, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  fee_amount: number;
  method: string;
  wallet_address: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  processed_at: string | null;
  currency_id: string | null;
  username?: string;
}

const statusConfig: Record<string, { icon: any; color: string; bg: string }> = {
  pending: { icon: Clock, color: "text-warning", bg: "bg-warning/15" },
  approved: { icon: CheckCircle2, color: "text-earn", bg: "bg-earn/15" },
  rejected: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/15" },
};

const WithdrawalSettings = () => {
  const [loading, setLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [processing, setProcessing] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [tickerConfig, setTickerConfig] = useState({ xp_to_ton_rate: 0.0001, withdrawal_fee_percent: 2 });

  useEffect(() => {
    fetchWithdrawals();
    fetchTickerConfig();
  }, []);

  const fetchTickerConfig = async () => {
    const { data } = await supabase.from("app_settings").select("*").eq("key", "ticker_config").single();
    if (data?.value && typeof data.value === "object") {
      setTickerConfig(prev => ({ ...prev, ...(data.value as any) }));
    }
  };

  const fetchWithdrawals = async () => {
    setLoading(true);
    const { data: wData } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (wData && wData.length > 0) {
      const userIds = [...new Set(wData.map(w => w.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.username]) || []);
      setWithdrawals(wData.map(w => ({ ...w, username: profileMap.get(w.user_id) || "Unknown" })));
    } else {
      setWithdrawals([]);
    }
    setLoading(false);
  };

  const xpToTon = (xpAmount: number) => {
    return (xpAmount * tickerConfig.xp_to_ton_rate).toFixed(6);
  };

  const processWithdrawal = async (id: string, status: "approved" | "rejected") => {
    setProcessing(true);
    const { error } = await supabase.from("withdrawal_requests").update({
      status,
      admin_note: adminNote || null,
      processed_at: new Date().toISOString(),
    }).eq("id", id);

    if (error) {
      toast.error(error.message);
      setProcessing(false);
      return;
    }

    toast.success(`طلب السحب تم ${status === "approved" ? "قبوله" : "رفضه"} بنجاح!`);

    const withdrawal = withdrawals.find(w => w.id === id);
    if (withdrawal) {
      await sendNotification(withdrawal, status);
      await sendChannelNotification(withdrawal, status);
    }

    setSelectedWithdrawal(null);
    setAdminNote("");
    setProcessing(false);
    fetchWithdrawals();
  };

  const sendNotification = async (withdrawal: Withdrawal, status: "approved" | "rejected") => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("telegram_id")
        .eq("user_id", withdrawal.user_id)
        .single();

      if (!profile?.telegram_id) return;

      const statusEmoji = status === "approved" ? "✅" : "❌";
      const statusText = status === "approved" ? "تمت الموافقة" : "تم الرفض";
      const tonAmount = xpToTon(withdrawal.amount - withdrawal.fee_amount);
      const message = `${statusEmoji} <b>تحديث طلب السحب</b>\n\nالمبلغ: ${withdrawal.amount} XP\nقيمة TON: ${tonAmount} TON\nالحالة: ${statusText}${adminNote ? `\nملاحظة: ${adminNote}` : ""}`;

      await supabase.functions.invoke("send-telegram-message", {
        body: { message, chat_id: profile.telegram_id },
      });
    } catch {
      // Silent fail
    }
  };

  const sendChannelNotification = async (withdrawal: Withdrawal, status: "approved" | "rejected") => {
    try {
      // Get channel ID from settings
      const { data: setting } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "withdrawal_channel_id")
        .single();

      const channelId = (setting?.value as any)?.channel_id;
      if (!channelId) return;

      const statusEmoji = status === "approved" ? "✅" : "❌";
      const tonAmount = xpToTon(withdrawal.amount - withdrawal.fee_amount);
      const message = `${statusEmoji} <b>عملية سحب ${status === "approved" ? "مقبولة" : "مرفوضة"}</b>\n\n👤 @${withdrawal.username}\n💰 ${withdrawal.amount} XP → ${tonAmount} TON\n📍 ${withdrawal.wallet_address || "—"}`;

      await supabase.functions.invoke("send-telegram-message", {
        body: { message, channel_id: channelId },
      });
    } catch {
      // Silent fail
    }
  };

  const sendCustomNotification = async (withdrawal: Withdrawal) => {
    if (!adminNote.trim()) {
      toast.error("اكتب رسالة الإشعار أولاً");
      return;
    }
    setNotifying(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("telegram_id")
        .eq("user_id", withdrawal.user_id)
        .single();

      if (!profile?.telegram_id) {
        toast.error("المستخدم ليس لديه Telegram ID");
        setNotifying(false);
        return;
      }

      await supabase.functions.invoke("send-telegram-message", {
        body: { message: adminNote, chat_id: profile.telegram_id },
      });
      toast.success("تم إرسال الإشعار!");
      setAdminNote("");
    } catch {
      toast.error("فشل إرسال الإشعار");
    }
    setNotifying(false);
  };

  const filtered = withdrawals.filter(w => filter === "all" || w.status === filter);
  const pendingCount = withdrawals.filter(w => w.status === "pending").length;
  const pendingTotalXP = withdrawals.filter(w => w.status === "pending").reduce((s, w) => s + Number(w.amount), 0);
  const pendingTotalTON = pendingTotalXP * tickerConfig.xp_to_ton_rate;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="glass rounded-xl p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase">معلقة</p>
          <p className="text-lg font-bold text-warning">{pendingCount}</p>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase">المجموع (TON)</p>
          <p className="text-lg font-bold text-foreground">{pendingTotalTON.toFixed(4)}</p>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase">الكل</p>
          <p className="text-lg font-bold text-foreground">{withdrawals.length}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f ? "gradient-primary text-white" : "glass text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? "الكل" : f === "pending" ? "معلقة" : f === "approved" ? "مقبولة" : "مرفوضة"}
            {f === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 bg-warning/30 text-warning px-1.5 py-0.5 rounded-full text-[9px]">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center">
          <ArrowDownUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">لا توجد طلبات سحب</p>
        </div>
      ) : (
        filtered.map((w) => {
          const sc = statusConfig[w.status] || statusConfig.pending;
          const StatusIcon = sc.icon;
          const tonValue = xpToTon(w.amount - w.fee_amount);
          return (
            <div
              key={w.id}
              onClick={() => { setSelectedWithdrawal(w); setAdminNote(w.admin_note || ""); }}
              className="glass rounded-xl p-3.5 cursor-pointer hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${sc.bg} flex items-center justify-center`}>
                  <StatusIcon className={`h-5 w-5 ${sc.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{tonValue} TON</p>
                    <span className="text-[10px] text-muted-foreground">({Number(w.amount)} XP)</span>
                    <Badge className={`text-[9px] px-1.5 py-0 h-4 border-0 ${sc.bg} ${sc.color}`}>
                      {w.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">@{w.username}</span>
                    <span className="text-[10px] text-muted-foreground">• {new Date(w.created_at).toLocaleDateString()}</span>
                  </div>
                  {w.wallet_address && (
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5 font-mono">{w.wallet_address}</p>
                  )}
                </div>
                {w.status === "pending" && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); processWithdrawal(w.id, "approved"); }}
                      className="p-1.5 rounded-lg bg-earn/20 text-earn hover:bg-earn/30"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); processWithdrawal(w.id, "rejected"); }}
                      className="p-1.5 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* Detail Modal */}
      <Dialog open={!!selectedWithdrawal} onOpenChange={() => setSelectedWithdrawal(null)}>
        <DialogContent className="glass border-border max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-foreground font-display">تفاصيل طلب السحب</DialogTitle>
            <DialogDescription className="text-muted-foreground">مراجعة وإدارة الطلب</DialogDescription>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="glass rounded-xl p-3 space-y-2">
                {[
                  { label: "المستخدم", value: `@${selectedWithdrawal.username}` },
                  { label: "المبلغ (XP)", value: Number(selectedWithdrawal.amount).toLocaleString() },
                  { label: "الرسوم (XP)", value: Number(selectedWithdrawal.fee_amount).toLocaleString() },
                  { label: "القيمة (TON)", value: `${xpToTon(selectedWithdrawal.amount - selectedWithdrawal.fee_amount)} TON` },
                  { label: "الطريقة", value: selectedWithdrawal.method },
                  { label: "العنوان", value: selectedWithdrawal.wallet_address || "—" },
                  { label: "التاريخ", value: new Date(selectedWithdrawal.created_at).toLocaleString() },
                  { label: "الحالة", value: selectedWithdrawal.status },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="text-foreground font-medium text-right max-w-[200px] truncate">{item.value}</span>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1.5">ملاحظة / رسالة إشعار</p>
                <Textarea
                  placeholder="اكتب ملاحظة أو رسالة للمستخدم..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="bg-secondary/50 min-h-[80px] text-xs"
                />
              </div>

              {selectedWithdrawal.status === "pending" ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => processWithdrawal(selectedWithdrawal.id, "approved")}
                    disabled={processing}
                    className="bg-earn hover:bg-earn/90 text-white border-0 gap-1.5"
                  >
                    {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    قبول
                  </Button>
                  <Button
                    onClick={() => processWithdrawal(selectedWithdrawal.id, "rejected")}
                    disabled={processing}
                    variant="destructive"
                    className="gap-1.5"
                  >
                    {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                    رفض
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => sendCustomNotification(selectedWithdrawal)}
                  disabled={notifying || !adminNote.trim()}
                  className="w-full gradient-primary text-white border-0 gap-1.5"
                >
                  {notifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  إرسال إشعار للمستخدم
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WithdrawalSettings;
