import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users, ListChecks, ArrowDownUp, BarChart3, Settings, Shield,
  Search, Ban, Edit3, Check, X, DollarSign, TrendingUp, Activity,
  Coins, Globe, Bell, ChevronRight, Plus, Trash2, Eye, Loader2, Send, MessageSquare,
  Gamepad2, Wallet, Rocket, BarChart
} from "lucide-react";
import GameSettings from "@/components/admin/GameSettings";
import EarnSettings from "@/components/admin/EarnSettings";
import AirdropSettings from "@/components/admin/AirdropSettings";
import TickerSettings from "@/components/admin/TickerSettings";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Data states
  const [users, setUsers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [stats, setStats] = useState({ totalUsers: 0, totalTasks: 0, pendingWithdrawals: 0, totalTransactions: 0 });

  // Modals
  const [editTaskModal, setEditTaskModal] = useState<any>(null);
  const [createTaskModal, setCreateTaskModal] = useState(false);
  const [broadcastModal, setBroadcastModal] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // New task form
  const [newTask, setNewTask] = useState({ title: "", reward_amount: 50, type: "social", url: "", description: "" });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchUsers(), fetchTasks(), fetchWithdrawals(), fetchSettings(), fetchStats()]);
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(50);
    if (data) setUsers(data);
  };

  const fetchTasks = async () => {
    const { data } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
    if (data) setTasks(data);
  };

  const fetchWithdrawals = async () => {
    const { data } = await supabase.from("withdrawal_requests").select("*").order("created_at", { ascending: false }).limit(50);
    if (data) setWithdrawals(data);
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from("app_settings").select("*");
    if (data) {
      const s: Record<string, any> = {};
      data.forEach(item => { s[item.key] = item.value; });
      setSettings(s);
      setMaintenanceMode(s.maintenance_mode === true);
    }
  };

  const fetchStats = async () => {
    const [{ count: uc }, { count: tc }, { count: wc }] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("tasks").select("id", { count: "exact", head: true }),
      supabase.from("withdrawal_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]);
    setStats({
      totalUsers: uc ?? 0,
      totalTasks: tc ?? 0,
      pendingWithdrawals: wc ?? 0,
      totalTransactions: 0,
    });
  };

  // Task CRUD
  const createTask = async () => {
    if (!newTask.title.trim()) { toast.error("Title required"); return; }
    const { error } = await supabase.from("tasks").insert({
      title: newTask.title,
      reward_amount: newTask.reward_amount,
      type: newTask.type,
      url: newTask.url || null,
      description: newTask.description || null,
      status: "active",
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Task created!");
    setCreateTaskModal(false);
    setNewTask({ title: "", reward_amount: 50, type: "social", url: "", description: "" });
    fetchTasks();
  };

  const updateTask = async (taskId: string, updates: any) => {
    const { error } = await supabase.from("tasks").update(updates).eq("id", taskId);
    if (error) { toast.error(error.message); return; }
    toast.success("Task updated!");
    setEditTaskModal(null);
    fetchTasks();
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) { toast.error(error.message); return; }
    toast.success("Task deleted!");
    fetchTasks();
  };

  // Withdrawal actions
  const processWithdrawal = async (id: string, status: "approved" | "rejected", note?: string) => {
    const { error } = await supabase.from("withdrawal_requests").update({
      status,
      admin_note: note || null,
      processed_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Withdrawal ${status}!`);
    fetchWithdrawals();
  };

  // Settings
  const saveSetting = async (key: string, value: any) => {
    const { error } = await supabase.from("app_settings").upsert({ key, value }, { onConflict: "key" });
    if (error) toast.error(error.message);
    else toast.success("Setting saved!");
    fetchSettings();
  };

  // Broadcast message
  const sendBroadcast = async () => {
    if (!broadcastMessage.trim()) { toast.error("Message required"); return; }
    try {
      const { error } = await supabase.functions.invoke("send-telegram-message", {
        body: { message: broadcastMessage, broadcast: true },
      });
      if (error) throw error;
      toast.success("Broadcast sent!");
      setBroadcastModal(false);
      setBroadcastMessage("");
    } catch {
      toast.error("Failed to send broadcast. Make sure the bot is configured.");
    }
  };

  const sections = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users },
    { id: "tasks", label: "Tasks", icon: ListChecks },
    { id: "earn", label: "Earn", icon: Wallet },
    { id: "airdrop", label: "Airdrop", icon: Rocket },
    { id: "ticker", label: "Ticker", icon: BarChart },
    { id: "games", label: "Games", icon: Gamepad2 },
    { id: "withdrawals", label: "Withdrawals", icon: ArrowDownUp },
    { id: "broadcast", label: "Broadcast", icon: MessageSquare },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const pendingWithdrawals = withdrawals.filter(w => w.status === "pending");
  const pendingTotal = pendingWithdrawals.reduce((s, w) => s + Number(w.amount), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="glass-strong border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-display font-bold text-foreground">Admin Panel</h1>
        </div>
        <Badge className="bg-earn/20 text-earn border-0 text-[10px]">Live</Badge>
      </div>

      {/* Section Nav */}
      <div className="px-4 pt-3 pb-2 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 min-w-max">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeSection === s.id ? "gradient-primary text-white" : "glass text-muted-foreground hover:text-foreground"
              }`}
            >
              <s.icon className="h-3.5 w-3.5" />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-[900px] mx-auto">
        {/* OVERVIEW */}
        {activeSection === "overview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total Users", value: stats.totalUsers.toLocaleString(), icon: Users, color: "text-primary" },
                { label: "Active Tasks", value: stats.totalTasks.toString(), icon: ListChecks, color: "text-earn" },
                { label: "Pending Withdrawals", value: stats.pendingWithdrawals.toString(), icon: ArrowDownUp, color: "text-warning" },
                { label: "Pending Total", value: `$${pendingTotal.toFixed(0)}`, icon: DollarSign, color: "text-accent" },
              ].map((stat) => (
                <div key={stat.label} className="glass rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                  </div>
                  <p className="text-xl font-display font-bold text-foreground">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* USERS */}
        {activeSection === "users" && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-secondary/50" />
            </div>
            {users
              .filter((u) => (u.username || "").toLowerCase().includes(searchQuery.toLowerCase()))
              .map((u) => (
                <div key={u.id} className="glass rounded-xl p-3.5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-sm">
                    {(u.username || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{u.username || "anonymous"}</p>
                    <p className="text-[10px] text-muted-foreground">Lv.{u.level} • {u.xp} XP • {new Date(u.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-semibold text-foreground">{u.streak_days}🔥</span>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* TASKS */}
        {activeSection === "tasks" && (
          <div className="space-y-3">
            <Button onClick={() => setCreateTaskModal(true)} className="w-full gradient-primary text-white border-0 gap-2">
              <Plus className="h-4 w-4" /> Create New Task
            </Button>
            {tasks.map((task) => (
              <div key={task.id} className="glass rounded-xl p-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{task.title}</p>
                      <Badge className={`text-[9px] px-1.5 py-0 h-4 border-0 ${
                        task.status === "active" ? "bg-earn/20 text-earn" : "bg-warning/20 text-warning"
                      }`}>{task.status}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-muted-foreground">{task.type}</span>
                      <span className="text-[10px] text-earn">+{task.reward_amount} coins</span>
                      <span className="text-[10px] text-muted-foreground">{task.current_completions} done</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setEditTaskModal(task)} className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground"><Edit3 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => deleteTask(task.id)} className="p-1.5 rounded-lg hover:bg-secondary/50 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </div>
            ))}

            {/* Create Task Modal */}
            <Dialog open={createTaskModal} onOpenChange={setCreateTaskModal}>
              <DialogContent className="glass border-border max-w-[400px]">
                <DialogHeader>
                  <DialogTitle className="text-foreground font-display">Create Task</DialogTitle>
                  <DialogDescription className="text-muted-foreground">Add a new task for users</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <Input placeholder="Task title" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} className="bg-secondary/50" />
                  <Input placeholder="Description" value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} className="bg-secondary/50" />
                  <div className="grid grid-cols-2 gap-3">
                    <Input type="number" placeholder="Reward" value={newTask.reward_amount} onChange={(e) => setNewTask({ ...newTask, reward_amount: Number(e.target.value) })} className="bg-secondary/50" />
                    <select
                      value={newTask.type}
                      onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
                      className="bg-secondary/50 border border-border rounded-md px-3 text-sm text-foreground"
                    >
                      <option value="social">Social</option>
                      <option value="install">Install</option>
                      <option value="survey">Survey</option>
                      <option value="daily">Daily</option>
                      <option value="referral">Referral</option>
                    </select>
                  </div>
                  <Input placeholder="URL (optional)" value={newTask.url} onChange={(e) => setNewTask({ ...newTask, url: e.target.value })} className="bg-secondary/50" />
                  <Button onClick={createTask} className="w-full gradient-primary text-white border-0">Create Task</Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Edit Task Modal */}
            <Dialog open={!!editTaskModal} onOpenChange={() => setEditTaskModal(null)}>
              <DialogContent className="glass border-border max-w-[400px]">
                <DialogHeader>
                  <DialogTitle className="text-foreground font-display">Edit Task</DialogTitle>
                  <DialogDescription className="text-muted-foreground">Modify task settings</DialogDescription>
                </DialogHeader>
                {editTaskModal && (
                  <div className="space-y-3">
                    <Input defaultValue={editTaskModal.title} id="edit-title" className="bg-secondary/50" />
                    <div className="grid grid-cols-2 gap-3">
                      <Input type="number" defaultValue={editTaskModal.reward_amount} id="edit-reward" className="bg-secondary/50" />
                      <select defaultValue={editTaskModal.status} id="edit-status" className="bg-secondary/50 border border-border rounded-md px-3 text-sm text-foreground">
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                      </select>
                    </div>
                    <Button
                      onClick={() => {
                        const title = (document.getElementById("edit-title") as HTMLInputElement)?.value;
                        const reward = Number((document.getElementById("edit-reward") as HTMLInputElement)?.value);
                        const status = (document.getElementById("edit-status") as HTMLSelectElement)?.value;
                        updateTask(editTaskModal.id, { title, reward_amount: reward, status });
                      }}
                      className="w-full gradient-primary text-white border-0"
                    >
                      Save Changes
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* EARN */}
        {activeSection === "earn" && <EarnSettings />}

        {/* AIRDROP */}
        {activeSection === "airdrop" && <AirdropSettings />}

        {/* GAMES */}
        {activeSection === "games" && <GameSettings />}

        {/* WITHDRAWALS */}
        {activeSection === "withdrawals" && (
          <div className="space-y-3">
            <div className="glass rounded-xl p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Pending total</span>
                <span className="font-bold text-warning">{pendingTotal.toLocaleString()} EARN</span>
              </div>
            </div>
            {withdrawals.map((w) => (
              <div key={w.id} className="glass rounded-xl p-3.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{Number(w.amount).toLocaleString()} EARN</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">via {w.method}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(w.created_at).toLocaleDateString()}</span>
                    {w.wallet_address && <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{w.wallet_address}</span>}
                  </div>
                </div>
                {w.status === "pending" ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => processWithdrawal(w.id, "approved")} className="p-1.5 rounded-lg bg-earn/20 text-earn hover:bg-earn/30"><Check className="h-4 w-4" /></button>
                    <button onClick={() => processWithdrawal(w.id, "rejected", "Declined by admin")} className="p-1.5 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <Badge className={`text-[9px] px-2 py-0.5 h-5 border-0 ${
                    w.status === "approved" ? "bg-earn/20 text-earn" : "bg-destructive/20 text-destructive"
                  }`}>{w.status}</Badge>
                )}
              </div>
            ))}
          </div>
        )}

        {/* BROADCAST */}
        {activeSection === "broadcast" && (
          <div className="space-y-4">
            <div className="glass rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Send Broadcast Message
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Send a message to all users via Telegram bot. Requires bot token configuration.
              </p>
              <Textarea
                placeholder="Type your broadcast message..."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="bg-secondary/50 min-h-[100px] mb-3"
              />
              <Button onClick={sendBroadcast} className="w-full gradient-primary text-white border-0 gap-2">
                <Send className="h-4 w-4" /> Send to All Users
              </Button>
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {activeSection === "settings" && (
          <div className="space-y-4">
            <div className="glass rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Coins className="h-4 w-4 text-primary" />
                Token & Currency Control
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">EARN Token Price</span>
                  <Input defaultValue="0.10" className="w-24 h-8 text-xs bg-secondary/50 text-right" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Coins → Points Rate</span>
                  <Input defaultValue="1:2" className="w-20 h-8 text-xs bg-secondary/50 text-right" />
                </div>
              </div>
            </div>

            <div className="glass rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-earn" />
                Referral Percentages
              </h3>
              <div className="space-y-2">
                {[
                  { level: "Level 1", pct: "10" },
                  { level: "Level 2", pct: "5" },
                  { level: "Level 3", pct: "2" },
                ].map((r) => (
                  <div key={r.level} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{r.level}</span>
                    <div className="flex items-center gap-1">
                      <Input defaultValue={r.pct} className="w-16 h-8 text-xs bg-secondary/50 text-right" />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                System
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-foreground">Maintenance Mode</p>
                    <p className="text-[10px] text-muted-foreground">Disable all user access</p>
                  </div>
                  <Switch
                    checked={maintenanceMode}
                    onCheckedChange={(v) => {
                      setMaintenanceMode(v);
                      saveSetting("maintenance_mode", v);
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-foreground">Anti-Fraud Detection</p>
                    <p className="text-[10px] text-muted-foreground">IP & device fingerprint checks</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
