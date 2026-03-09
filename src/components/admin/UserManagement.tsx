import { useState, useEffect } from "react";
import {
  Search, Edit3, Trash2, Loader2, Users, Ban, CheckCircle2,
  Send, ChevronDown, Eye
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  user_id: string;
  username: string | null;
  telegram_id: number | null;
  avatar_url: string | null;
  xp: number;
  level: number;
  streak_days: number;
  referral_code: string | null;
  created_at: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editModal, setEditModal] = useState(false);
  const [messageModal, setMessageModal] = useState(false);
  const [editXp, setEditXp] = useState(0);
  const [editLevel, setEditLevel] = useState(1);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userAirdrop, setUserAirdrop] = useState<any>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data) setUsers(data as UserProfile[]);
    setLoading(false);
  };

  const openUserDetail = async (user: UserProfile) => {
    setSelectedUser(user);
    setEditXp(user.xp);
    setEditLevel(user.level);
    // Fetch airdrop data
    const { data } = await supabase
      .from("airdrops")
      .select("*")
      .eq("user_id", user.user_id)
      .maybeSingle();
    setUserAirdrop(data);
    setEditModal(true);
  };

  const saveUserEdits = async () => {
    if (!selectedUser) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ xp: editXp, level: editLevel })
      .eq("user_id", selectedUser.user_id);
    if (error) toast.error(error.message);
    else {
      toast.success("تم حفظ التعديلات!");
      fetchUsers();
    }
    setSaving(false);
    setEditModal(false);
  };

  const deleteUser = async (user: UserProfile) => {
    if (!confirm(`هل أنت متأكد من حذف ${user.username || "هذا المستخدم"}؟ لا يمكن التراجع.`)) return;
    
    // Delete profile (cascade will handle related records)
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("user_id", user.user_id);
    
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("تم حذف المستخدم!");
    fetchUsers();
  };

  const sendMessageToUser = async () => {
    if (!selectedUser || !message.trim()) return;
    if (!selectedUser.telegram_id) {
      toast.error("المستخدم ليس لديه Telegram ID");
      return;
    }
    setSending(true);
    try {
      await supabase.functions.invoke("send-telegram-message", {
        body: { message, chat_id: selectedUser.telegram_id },
      });
      toast.success("تم إرسال الرسالة!");
      setMessage("");
      setMessageModal(false);
    } catch {
      toast.error("فشل إرسال الرسالة");
    }
    setSending(false);
  };

  const filtered = users.filter((u) =>
    (u.username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.telegram_id?.toString() || "").includes(searchQuery) ||
    u.user_id.includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="glass rounded-xl p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase">إجمالي المستخدمين</p>
          <p className="text-lg font-bold text-foreground">{users.length}</p>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase">مستخدمو تليجرام</p>
          <p className="text-lg font-bold text-primary">{users.filter(u => u.telegram_id).length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="بحث بالاسم أو Telegram ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-secondary/50"
        />
      </div>

      {/* Users List */}
      {filtered.map((u) => (
        <div key={u.id} className="glass rounded-xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden gradient-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
            {u.avatar_url ? (
              <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              (u.username || "?")[0].toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{u.username || "anonymous"}</p>
            <p className="text-[10px] text-muted-foreground">
              Lv.{u.level} • {u.xp} XP • 🔥{u.streak_days}
              {u.telegram_id && ` • TG:${u.telegram_id}`}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => openUserDetail(u)}
              className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => { setSelectedUser(u); setMessageModal(true); }}
              className="p-1.5 rounded-lg hover:bg-secondary/50 text-primary"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => deleteUser(u)}
              className="p-1.5 rounded-lg hover:bg-secondary/50 text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="glass rounded-xl p-8 text-center">
          <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">لا يوجد مستخدمون</p>
        </div>
      )}

      {/* Edit User Modal */}
      <Dialog open={editModal} onOpenChange={setEditModal}>
        <DialogContent className="glass border-border max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-foreground font-display">تعديل المستخدم</DialogTitle>
            <DialogDescription className="text-muted-foreground">تعديل بيانات {selectedUser?.username}</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="glass rounded-xl p-3 space-y-2">
                {[
                  { label: "User ID", value: selectedUser.user_id.slice(0, 16) + "..." },
                  { label: "Telegram ID", value: selectedUser.telegram_id || "—" },
                  { label: "Referral Code", value: selectedUser.referral_code || "—" },
                  { label: "تاريخ التسجيل", value: new Date(selectedUser.created_at).toLocaleDateString() },
                  { label: "التوكنات المكتسبة", value: userAirdrop?.tokens_earned?.toFixed(2) || "0" },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="text-foreground font-medium">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">XP</label>
                  <Input
                    type="number"
                    value={editXp}
                    onChange={(e) => setEditXp(Number(e.target.value))}
                    className="bg-secondary/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Level</label>
                  <Input
                    type="number"
                    value={editLevel}
                    onChange={(e) => setEditLevel(Number(e.target.value))}
                    className="bg-secondary/50"
                  />
                </div>
              </div>

              <Button
                onClick={saveUserEdits}
                disabled={saving}
                className="w-full gradient-primary text-white border-0"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "حفظ التعديلات"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Message User Modal */}
      <Dialog open={messageModal} onOpenChange={setMessageModal}>
        <DialogContent className="glass border-border max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-foreground font-display">إرسال رسالة</DialogTitle>
            <DialogDescription className="text-muted-foreground">إرسال رسالة لـ {selectedUser?.username}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              placeholder="اكتب رسالتك..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-secondary/50 min-h-[100px]"
            />
            <Button
              onClick={sendMessageToUser}
              disabled={sending || !message.trim()}
              className="w-full gradient-primary text-white border-0 gap-2"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              إرسال
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
