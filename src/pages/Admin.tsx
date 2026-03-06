import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users, ListChecks, ArrowDownUp, BarChart3, Settings, Shield,
  Search, Ban, Edit3, Check, X, DollarSign, TrendingUp, Activity,
  Coins, Globe, Bell, ChevronRight, Plus, Trash2, Eye
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// --- Mock data ---
const mockUsers = [
  { id: "u1", name: "whale_user", email: "whale@test.com", balance: 125000, level: 24, status: "active", joined: "Jan 12" },
  { id: "u2", name: "crypto_king", email: "king@test.com", balance: 98500, level: 18, status: "active", joined: "Feb 3" },
  { id: "u3", name: "bot_suspect", email: "bot@test.com", balance: 5000, level: 2, status: "banned", joined: "Mar 1" },
  { id: "u4", name: "diamond_h", email: "diamond@test.com", balance: 87200, level: 22, status: "active", joined: "Jan 20" },
  { id: "u5", name: "newuser99", email: "new@test.com", balance: 150, level: 1, status: "active", joined: "Mar 5" },
];

const mockTasks = [
  { id: "t1", title: "Join Telegram Channel", reward: 50, type: "Social", status: "active", completions: 1240 },
  { id: "t2", title: "Install App - GameX", reward: 200, type: "Install", status: "active", completions: 430 },
  { id: "t3", title: "Complete Survey #12", reward: 150, type: "Survey", status: "paused", completions: 89 },
  { id: "t4", title: "Daily Check-in", reward: 30, type: "Daily", status: "active", completions: 5600 },
];

const mockWithdrawals = [
  { id: "w1", user: "whale_user", amount: 5000, method: "USDT", status: "pending", date: "Mar 5" },
  { id: "w2", user: "crypto_king", amount: 2000, method: "Crypto", status: "pending", date: "Mar 4" },
  { id: "w3", user: "diamond_h", amount: 1500, method: "Binance ID", status: "approved", date: "Mar 3" },
  { id: "w4", user: "moonshot", amount: 800, method: "USDT", status: "rejected", date: "Mar 2" },
];

const statsCards = [
  { label: "Total Users", value: "12,458", change: "+124 today", icon: Users, color: "text-primary" },
  { label: "Revenue", value: "$4,820", change: "+$340 today", icon: DollarSign, color: "text-earn" },
  { label: "Active Tasks", value: "24", change: "3 new", icon: ListChecks, color: "text-accent" },
  { label: "Pending Withdrawals", value: "18", change: "$12,400", icon: ArrowDownUp, color: "text-warning" },
];

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [editTaskModal, setEditTaskModal] = useState<string | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const sections = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users },
    { id: "tasks", label: "Tasks", icon: ListChecks },
    { id: "withdrawals", label: "Withdrawals", icon: ArrowDownUp },
    { id: "settings", label: "Settings", icon: Settings },
  ];

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
                activeSection === s.id
                  ? "gradient-primary text-white"
                  : "glass text-muted-foreground hover:text-foreground"
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
              {statsCards.map((stat) => (
                <div key={stat.label} className="glass rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                  </div>
                  <p className="text-xl font-display font-bold text-foreground">{stat.value}</p>
                  <p className="text-[10px] text-earn mt-0.5">{stat.change}</p>
                </div>
              ))}
            </div>

            {/* Revenue Chart Placeholder */}
            <div className="glass rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-earn" />
                Revenue (7 days)
              </h3>
              <div className="h-32 flex items-end gap-1">
                {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-md gradient-primary opacity-80"
                      style={{ height: `${h}%` }}
                    />
                    <span className="text-[8px] text-muted-foreground">
                      {["M", "T", "W", "T", "F", "S", "S"][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Log */}
            <div className="glass rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Recent Activity
              </h3>
              <div className="space-y-2">
                {[
                  { text: "whale_user withdrew 5000 EARN", time: "2m ago", type: "withdraw" },
                  { text: "New user registered: newuser99", time: "5m ago", type: "user" },
                  { text: "Task 'Join Channel' completed 50 times", time: "12m ago", type: "task" },
                  { text: "bot_suspect flagged by anti-fraud", time: "30m ago", type: "alert" },
                ].map((log, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      log.type === "alert" ? "bg-destructive" : log.type === "withdraw" ? "bg-warning" : "bg-earn"
                    }`} />
                    <span className="text-foreground flex-1">{log.text}</span>
                    <span className="text-muted-foreground">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* USERS */}
        {activeSection === "users" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-secondary/50"
                />
              </div>
            </div>
            {mockUsers
              .filter((u) => u.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((user) => (
                <div key={user.id} className="glass rounded-xl p-3.5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-sm">
                    {user.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                      <Badge className={`text-[9px] px-1.5 py-0 h-4 border-0 ${
                        user.status === "active" ? "bg-earn/20 text-earn" : "bg-destructive/20 text-destructive"
                      }`}>{user.status}</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{user.email} • Lv.{user.level} • {user.joined}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <p className="text-xs font-semibold text-foreground">{user.balance.toLocaleString()}</p>
                    <button className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground"><Edit3 className="h-3.5 w-3.5" /></button>
                    <button className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground"><Ban className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* TASKS */}
        {activeSection === "tasks" && (
          <div className="space-y-3">
            <Button className="w-full gradient-primary text-white border-0 gap-2">
              <Plus className="h-4 w-4" /> Create New Task
            </Button>
            {mockTasks.map((task) => (
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
                      <span className="text-[10px] text-earn">+{task.reward} coins</span>
                      <span className="text-[10px] text-muted-foreground">{task.completions} completions</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setEditTaskModal(task.id)} className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground"><Edit3 className="h-3.5 w-3.5" /></button>
                    <button className="p-1.5 rounded-lg hover:bg-secondary/50 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </div>
            ))}

            {/* Edit Task Modal */}
            <Dialog open={!!editTaskModal} onOpenChange={() => setEditTaskModal(null)}>
              <DialogContent className="glass border-border max-w-[400px]">
                <DialogHeader>
                  <DialogTitle className="text-foreground font-display">Edit Task</DialogTitle>
                  <DialogDescription className="text-muted-foreground">Modify task settings</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Title</label>
                    <Input defaultValue={mockTasks.find((t) => t.id === editTaskModal)?.title} className="bg-secondary/50" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Reward</label>
                      <Input type="number" defaultValue={mockTasks.find((t) => t.id === editTaskModal)?.reward} className="bg-secondary/50" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Type</label>
                      <Input defaultValue={mockTasks.find((t) => t.id === editTaskModal)?.type} className="bg-secondary/50" />
                    </div>
                  </div>
                  <Button className="w-full gradient-primary text-white border-0">Save Changes</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* WITHDRAWALS */}
        {activeSection === "withdrawals" && (
          <div className="space-y-3">
            <div className="glass rounded-xl p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Pending total</span>
                <span className="font-bold text-warning">$7,000</span>
              </div>
            </div>
            {mockWithdrawals.map((w) => (
              <div key={w.id} className="glass rounded-xl p-3.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{w.user}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-foreground">{w.amount} EARN</span>
                    <span className="text-[10px] text-muted-foreground">via {w.method}</span>
                    <span className="text-[10px] text-muted-foreground">{w.date}</span>
                  </div>
                </div>
                {w.status === "pending" ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button className="p-1.5 rounded-lg bg-earn/20 text-earn hover:bg-earn/30"><Check className="h-4 w-4" /></button>
                    <button className="p-1.5 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30"><X className="h-4 w-4" /></button>
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

        {/* SETTINGS */}
        {activeSection === "settings" && (
          <div className="space-y-4">
            {/* Token Control */}
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
                  <span className="text-xs text-muted-foreground">Total Supply</span>
                  <Input defaultValue="10000000" className="w-32 h-8 text-xs bg-secondary/50 text-right" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Coins → Points Rate</span>
                  <Input defaultValue="1:2" className="w-20 h-8 text-xs bg-secondary/50 text-right" />
                </div>
              </div>
            </div>

            {/* Referral Settings */}
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

            {/* Ad Management */}
            <div className="glass rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Globe className="h-4 w-4 text-accent" />
                Ad Network Codes
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">Monetag Script</label>
                  <Input placeholder="Paste Monetag ad code..." className="bg-secondary/50 text-xs" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block">Adsterra Script</label>
                  <Input placeholder="Paste Adsterra ad code..." className="bg-secondary/50 text-xs" />
                </div>
              </div>
            </div>

            {/* System */}
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
                  <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
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

            <Button className="w-full gradient-primary text-white border-0">Save All Settings</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
