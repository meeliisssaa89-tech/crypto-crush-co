import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  ListChecks, Link2, Users, MessageSquare, Download, FileText, Play,
  Plus, Trash2, Edit3, Loader2, Clock, ExternalLink, Eye, EyeOff,
  Megaphone, Globe, Timer, CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type EarnTab = "tasks" | "shortlinks" | "ads";

const TASK_TYPES = [
  { value: "social", label: "Social Follow", icon: "📱" },
  { value: "join_channel", label: "Join Channel", icon: "📢" },
  { value: "join_group", label: "Join Group", icon: "👥" },
  { value: "external_link", label: "External Link", icon: "🔗" },
  { value: "referral", label: "Invite Friends", icon: "🤝" },
  { value: "install", label: "Install App", icon: "📲" },
  { value: "survey", label: "Survey", icon: "📋" },
  { value: "daily", label: "Daily", icon: "📅" },
];

const VERIFICATION_TYPES = [
  { value: "manual", label: "Manual (instant)" },
  { value: "timer", label: "Timer countdown" },
  { value: "admin", label: "Admin approval" },
];

const EarnSettings = () => {
  const [activeTab, setActiveTab] = useState<EarnTab>("tasks");
  const [tasks, setTasks] = useState<any[]>([]);
  const [shortlinks, setShortlinks] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [taskModal, setTaskModal] = useState<any | null>(null);
  const [shortlinkModal, setShortlinkModal] = useState<any | null>(null);
  const [adModal, setAdModal] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Task form
  const [taskForm, setTaskForm] = useState({
    title: "", description: "", reward_amount: 50, type: "social",
    url: "", is_daily: false, verification_type: "manual",
    cooldown_seconds: 0, is_limited: false, max_completions: 100,
  });

  // Shortlink form
  const [slForm, setSlForm] = useState({
    title: "", url: "", reward_amount: 10, timer_seconds: 10, network: "direct", daily_limit: 0,
  });

  // Ad form
  const [adForm, setAdForm] = useState({
    title: "", ad_type: "video", reward_amount: 5, cooldown_seconds: 300,
    ad_zone_id: "", ads_per_click: 1,
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [t, s, a] = await Promise.all([
      supabase.from("tasks").select("*").order("created_at", { ascending: false }),
      supabase.from("shortlinks").select("*").order("created_at", { ascending: false }),
      supabase.from("ads").select("*").order("created_at", { ascending: false }),
    ]);
    if (t.data) setTasks(t.data);
    if (s.data) setShortlinks(s.data);
    if (a.data) setAds(a.data);
    setLoading(false);
  };

  // ─── TASK CRUD ───
  const openTaskModal = (task?: any) => {
    if (task) {
      setTaskForm({
        title: task.title, description: task.description || "",
        reward_amount: task.reward_amount, type: task.type,
        url: task.url || "", is_daily: task.is_daily,
        verification_type: task.verification_type || "manual",
        cooldown_seconds: task.cooldown_seconds || 0,
        is_limited: task.is_limited, max_completions: task.max_completions || 100,
      });
      setTaskModal(task);
    } else {
      setTaskForm({
        title: "", description: "", reward_amount: 50, type: "social",
        url: "", is_daily: false, verification_type: "manual",
        cooldown_seconds: 0, is_limited: false, max_completions: 100,
      });
      setTaskModal({});
      setIsCreating(true);
    }
  };

  const saveTask = async () => {
    if (!taskForm.title.trim()) { toast.error("Title required"); return; }
    const payload = {
      title: taskForm.title.trim(),
      description: taskForm.description || null,
      reward_amount: Number(taskForm.reward_amount),
      type: taskForm.type,
      url: taskForm.url || null,
      is_daily: taskForm.is_daily,
      verification_type: taskForm.verification_type,
      cooldown_seconds: Number(taskForm.cooldown_seconds) || 0,
      is_limited: taskForm.is_limited,
      max_completions: taskForm.is_limited ? Number(taskForm.max_completions) : null,
    };

    if (isCreating || !taskModal?.id) {
      const { error } = await supabase.from("tasks").insert({ ...payload, status: "active" });
      if (error) { toast.error(error.message); return; }
      toast.success("Task created!");
    } else {
      const { error } = await supabase.from("tasks").update(payload).eq("id", taskModal.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Task updated!");
    }
    setTaskModal(null); setIsCreating(false); fetchAll();
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted"); fetchAll();
  };

  const toggleTaskStatus = async (id: string, current: string) => {
    const next = current === "active" ? "paused" : "active";
    await supabase.from("tasks").update({ status: next }).eq("id", id);
    fetchAll();
  };

  // ─── SHORTLINK CRUD ───
  const openSlModal = (sl?: any) => {
    if (sl) {
      setSlForm({
        title: sl.title, url: sl.url, reward_amount: sl.reward_amount,
        timer_seconds: sl.timer_seconds, network: sl.network, daily_limit: sl.daily_limit || 0,
      });
      setShortlinkModal(sl);
    } else {
      setSlForm({ title: "", url: "", reward_amount: 10, timer_seconds: 10, network: "direct", daily_limit: 0 });
      setShortlinkModal({});
      setIsCreating(true);
    }
  };

  const saveShortlink = async () => {
    if (!slForm.title.trim() || !slForm.url.trim()) { toast.error("Title and URL required"); return; }
    const payload = {
      title: slForm.title.trim(), url: slForm.url.trim(),
      reward_amount: Number(slForm.reward_amount),
      timer_seconds: Number(slForm.timer_seconds),
      network: slForm.network,
      daily_limit: Number(slForm.daily_limit) || null,
    };

    if (isCreating || !shortlinkModal?.id) {
      const { error } = await supabase.from("shortlinks").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Shortlink created!");
    } else {
      const { error } = await supabase.from("shortlinks").update(payload).eq("id", shortlinkModal.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Shortlink updated!");
    }
    setShortlinkModal(null); setIsCreating(false); fetchAll();
  };

  const deleteShortlink = async (id: string) => {
    await supabase.from("shortlinks").delete().eq("id", id);
    toast.success("Deleted"); fetchAll();
  };

  const toggleShortlink = async (id: string, active: boolean) => {
    await supabase.from("shortlinks").update({ is_active: !active }).eq("id", id);
    fetchAll();
  };

  // ─── AD CRUD ───
  const openAdModal = (ad?: any) => {
    if (ad) {
      setAdForm({
        title: ad.title, ad_type: ad.ad_type,
        reward_amount: ad.reward_amount, cooldown_seconds: ad.cooldown_seconds,
        ad_zone_id: ad.ad_zone_id || "", ads_per_click: ad.ads_per_click || 1,
      });
      setAdModal(ad);
    } else {
      setAdForm({ title: "", ad_type: "video", reward_amount: 5, cooldown_seconds: 300, ad_zone_id: "", ads_per_click: 1 });
      setAdModal({});
      setIsCreating(true);
    }
  };

  const saveAd = async () => {
    if (!adForm.title.trim()) { toast.error("Title required"); return; }
    const payload = {
      title: adForm.title.trim(), ad_type: adForm.ad_type,
      reward_amount: Number(adForm.reward_amount),
      cooldown_seconds: Number(adForm.cooldown_seconds),
      ad_zone_id: adForm.ad_zone_id.trim() || null,
      ads_per_click: Number(adForm.ads_per_click) || 1,
    };

    if (isCreating || !adModal?.id) {
      const { error } = await supabase.from("ads").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Ad created!");
    } else {
      const { error } = await supabase.from("ads").update(payload).eq("id", adModal.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Ad updated!");
    }
    setAdModal(null); setIsCreating(false); fetchAll();
  };

  const deleteAd = async (id: string) => {
    await supabase.from("ads").delete().eq("id", id);
    toast.success("Deleted"); fetchAll();
  };

  const toggleAd = async (id: string, active: boolean) => {
    await supabase.from("ads").update({ is_active: !active }).eq("id", id);
    fetchAll();
  };

  const getTypeInfo = (type: string) => TASK_TYPES.find(t => t.value === type) || TASK_TYPES[0];

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        {([
          { id: "tasks" as const, label: "Tasks", icon: ListChecks, count: tasks.length },
          { id: "shortlinks" as const, label: "Shortlinks", icon: Link2, count: shortlinks.length },
          { id: "ads" as const, label: "Ads", icon: Play, count: ads.length },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === tab.id ? "gradient-primary text-white" : "glass text-muted-foreground"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
            <Badge className="h-4 px-1 text-[9px] bg-secondary/80 text-muted-foreground border-0 ml-1">{tab.count}</Badge>
          </button>
        ))}
      </div>

      {/* ═══════════ TASKS TAB ═══════════ */}
      {activeTab === "tasks" && (
        <div className="space-y-3">
          <Button onClick={() => openTaskModal()} className="w-full gradient-earn text-white border-0 gap-2">
            <Plus className="h-4 w-4" /> Add New Task
          </Button>

          {tasks.map((task) => {
            const typeInfo = getTypeInfo(task.type);
            return (
              <div key={task.id} className="glass rounded-xl p-3.5">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{typeInfo.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{task.title}</p>
                      <Badge className={`text-[9px] px-1.5 py-0 h-4 border-0 ${
                        task.status === "active" ? "bg-earn/20 text-earn" : "bg-warning/20 text-warning"
                      }`}>{task.status}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-muted-foreground">{typeInfo.label}</span>
                      <span className="text-[10px] text-earn">+{task.reward_amount}</span>
                      {task.cooldown_seconds > 0 && (
                        <span className="text-[10px] text-accent flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />{task.cooldown_seconds}s
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">{task.verification_type}</span>
                      <span className="text-[10px] text-muted-foreground">{task.current_completions} done</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleTaskStatus(task.id, task.status)} className="p-1.5 rounded-lg hover:bg-secondary/50">
                      {task.status === "active" ? <Eye className="h-3.5 w-3.5 text-earn" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                    </button>
                    <button onClick={() => { setIsCreating(false); openTaskModal(task); }} className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground">
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => deleteTask(task.id)} className="p-1.5 rounded-lg hover:bg-secondary/50 text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════ SHORTLINKS TAB ═══════════ */}
      {activeTab === "shortlinks" && (
        <div className="space-y-3">
          <Button onClick={() => openSlModal()} className="w-full gradient-earn text-white border-0 gap-2">
            <Plus className="h-4 w-4" /> Add New Shortlink
          </Button>

          {shortlinks.map((sl) => (
            <div key={sl.id} className="glass rounded-xl p-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg gradient-earn flex items-center justify-center shrink-0">
                  <ExternalLink className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">{sl.title}</p>
                    <Badge className={`text-[9px] px-1.5 py-0 h-4 border-0 ${sl.is_active ? "bg-earn/20 text-earn" : "bg-muted text-muted-foreground"}`}>
                      {sl.is_active ? "active" : "paused"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-earn">+{sl.reward_amount}</span>
                    <span className="text-[10px] text-accent flex items-center gap-0.5"><Timer className="h-2.5 w-2.5" />{sl.timer_seconds}s</span>
                    <span className="text-[10px] text-muted-foreground">{sl.network}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggleShortlink(sl.id, sl.is_active)} className="p-1.5 rounded-lg hover:bg-secondary/50">
                    {sl.is_active ? <Eye className="h-3.5 w-3.5 text-earn" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                  <button onClick={() => { setIsCreating(false); openSlModal(sl); }} className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground">
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => deleteShortlink(sl.id)} className="p-1.5 rounded-lg hover:bg-secondary/50 text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════ ADS TAB ═══════════ */}
      {activeTab === "ads" && (
        <div className="space-y-3">
          <Button onClick={() => openAdModal()} className="w-full gradient-earn text-white border-0 gap-2">
            <Plus className="h-4 w-4" /> Add New Ad
          </Button>

          {ads.map((ad) => (
            <div key={ad.id} className="glass rounded-xl p-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                  <Play className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">{ad.title}</p>
                    <Badge className={`text-[9px] px-1.5 py-0 h-4 border-0 ${ad.is_active ? "bg-earn/20 text-earn" : "bg-muted text-muted-foreground"}`}>
                      {ad.is_active ? "active" : "paused"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-earn">+{ad.reward_amount}</span>
                    <span className="text-[10px] text-accent flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{Math.floor(ad.cooldown_seconds / 60)}m cooldown</span>
                    <span className="text-[10px] text-muted-foreground">{ad.ad_type}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggleAd(ad.id, ad.is_active)} className="p-1.5 rounded-lg hover:bg-secondary/50">
                    {ad.is_active ? <Eye className="h-3.5 w-3.5 text-earn" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                  <button onClick={() => { setIsCreating(false); openAdModal(ad); }} className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground">
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => deleteAd(ad.id)} className="p-1.5 rounded-lg hover:bg-secondary/50 text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══════ TASK MODAL ═══════ */}
      <Dialog open={!!taskModal} onOpenChange={() => { setTaskModal(null); setIsCreating(false); }}>
        <DialogContent className="glass border-border max-w-[420px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground font-display">{isCreating ? "Create" : "Edit"} Task</DialogTitle>
            <DialogDescription className="text-muted-foreground">Configure task details and verification</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Task title" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} className="bg-secondary/50" />
            <Textarea placeholder="Description (optional)" value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} className="bg-secondary/50 h-16 text-xs" />

            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Task Type</label>
              <div className="grid grid-cols-2 gap-1.5">
                {TASK_TYPES.map(t => (
                  <button key={t.value} onClick={() => setTaskForm({ ...taskForm, type: t.value })}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                      taskForm.type === t.value ? "gradient-primary text-white" : "glass text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>{t.icon}</span>{t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Reward</label>
                <Input type="number" value={taskForm.reward_amount} onChange={e => setTaskForm({ ...taskForm, reward_amount: Number(e.target.value) })} className="bg-secondary/50" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Cooldown (sec)</label>
                <Input type="number" value={taskForm.cooldown_seconds} onChange={e => setTaskForm({ ...taskForm, cooldown_seconds: Number(e.target.value) })} className="bg-secondary/50" />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">URL / Link</label>
              <Input placeholder="https://t.me/channel" value={taskForm.url} onChange={e => setTaskForm({ ...taskForm, url: e.target.value })} className="bg-secondary/50" />
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Verification</label>
              <div className="flex gap-1.5">
                {VERIFICATION_TYPES.map(v => (
                  <button key={v.value} onClick={() => setTaskForm({ ...taskForm, verification_type: v.value })}
                    className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                      taskForm.verification_type === v.value ? "gradient-earn text-white" : "glass text-muted-foreground"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-foreground">Daily Task</p>
                <p className="text-[10px] text-muted-foreground">Resets every 24h</p>
              </div>
              <Switch checked={taskForm.is_daily} onCheckedChange={v => setTaskForm({ ...taskForm, is_daily: v })} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-foreground">Limited Completions</p>
                <p className="text-[10px] text-muted-foreground">Cap total completions</p>
              </div>
              <Switch checked={taskForm.is_limited} onCheckedChange={v => setTaskForm({ ...taskForm, is_limited: v })} />
            </div>

            {taskForm.is_limited && (
              <Input type="number" placeholder="Max completions" value={taskForm.max_completions}
                onChange={e => setTaskForm({ ...taskForm, max_completions: Number(e.target.value) })} className="bg-secondary/50" />
            )}

            <Button onClick={saveTask} className="w-full gradient-primary text-white border-0">
              {isCreating ? "Create Task" : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════ SHORTLINK MODAL ═══════ */}
      <Dialog open={!!shortlinkModal} onOpenChange={() => { setShortlinkModal(null); setIsCreating(false); }}>
        <DialogContent className="glass border-border max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-foreground font-display">{isCreating ? "Create" : "Edit"} Shortlink</DialogTitle>
            <DialogDescription className="text-muted-foreground">Shortlink with countdown timer</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Title" value={slForm.title} onChange={e => setSlForm({ ...slForm, title: e.target.value })} className="bg-secondary/50" />
            <Input placeholder="https://shortlink.com/abc" value={slForm.url} onChange={e => setSlForm({ ...slForm, url: e.target.value })} className="bg-secondary/50" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Reward</label>
                <Input type="number" value={slForm.reward_amount} onChange={e => setSlForm({ ...slForm, reward_amount: Number(e.target.value) })} className="bg-secondary/50" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Timer (sec)</label>
                <Input type="number" value={slForm.timer_seconds} onChange={e => setSlForm({ ...slForm, timer_seconds: Number(e.target.value) })} className="bg-secondary/50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Network</label>
                <select value={slForm.network} onChange={e => setSlForm({ ...slForm, network: e.target.value })}
                  className="w-full bg-secondary/50 border border-border rounded-md px-3 h-10 text-sm text-foreground">
                  <option value="direct">Direct</option>
                  <option value="linkvertise">Linkvertise</option>
                  <option value="shrinkme">ShrinkMe</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Daily Limit</label>
                <Input type="number" value={slForm.daily_limit} onChange={e => setSlForm({ ...slForm, daily_limit: Number(e.target.value) })} className="bg-secondary/50" placeholder="0 = unlimited" />
              </div>
            </div>
            <Button onClick={saveShortlink} className="w-full gradient-primary text-white border-0">
              {isCreating ? "Create Shortlink" : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════ AD MODAL ═══════ */}
      <Dialog open={!!adModal} onOpenChange={() => { setAdModal(null); setIsCreating(false); }}>
        <DialogContent className="glass border-border max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-foreground font-display">{isCreating ? "Create" : "Edit"} Ad</DialogTitle>
            <DialogDescription className="text-muted-foreground">Rewarded ad with cooldown</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Ad title" value={adForm.title} onChange={e => setAdForm({ ...adForm, title: e.target.value })} className="bg-secondary/50" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Type</label>
                <select value={adForm.ad_type} onChange={e => setAdForm({ ...adForm, ad_type: e.target.value })}
                  className="w-full bg-secondary/50 border border-border rounded-md px-3 h-10 text-sm text-foreground">
                  <option value="video">Video</option>
                  <option value="interstitial">Interstitial</option>
                  <option value="banner">Banner</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Reward</label>
                <Input type="number" value={adForm.reward_amount} onChange={e => setAdForm({ ...adForm, reward_amount: Number(e.target.value) })} className="bg-secondary/50" />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Cooldown (seconds)</label>
              <Input type="number" value={adForm.cooldown_seconds} onChange={e => setAdForm({ ...adForm, cooldown_seconds: Number(e.target.value) })} className="bg-secondary/50" />
              <p className="text-[10px] text-muted-foreground mt-1">= {Math.floor(adForm.cooldown_seconds / 60)} min {adForm.cooldown_seconds % 60}s between views</p>
            </div>
            <Button onClick={saveAd} className="w-full gradient-primary text-white border-0">
              {isCreating ? "Create Ad" : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EarnSettings;
