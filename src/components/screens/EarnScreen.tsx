import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink, Clock, CheckCircle2, Play, Share2, Users, Download,
  FileText, Loader2, Timer, Megaphone, MessageSquare, Globe, Sparkles, ChevronRight,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { hapticFeedback } from "@/hooks/useTelegram";
import { toast } from "sonner";

const typeConfig: Record<string, { icon: any; gradient: string; label: string }> = {
  social: { icon: Share2, gradient: "from-blue-500 to-cyan-500", label: "Social" },
  join_channel: { icon: Megaphone, gradient: "from-violet-500 to-purple-600", label: "Channel" },
  join_group: { icon: Users, gradient: "from-indigo-500 to-blue-600", label: "Group" },
  external_link: { icon: Globe, gradient: "from-emerald-500 to-teal-500", label: "Link" },
  referral: { icon: Users, gradient: "from-amber-500 to-orange-500", label: "Referral" },
  install: { icon: Download, gradient: "from-pink-500 to-rose-500", label: "Install" },
  survey: { icon: FileText, gradient: "from-sky-500 to-blue-500", label: "Survey" },
  daily: { icon: CheckCircle2, gradient: "from-green-500 to-emerald-500", label: "Daily" },
};

interface TaskRow {
  id: string; title: string; description: string | null; reward_amount: number;
  type: string; status: string; is_daily: boolean; url: string | null;
  verification_type: string; cooldown_seconds: number;
  reward_type: string; token_reward_amount: number;
}

interface ShortlinkRow {
  id: string; title: string; url: string; reward_amount: number;
  timer_seconds: number; network: string;
  reward_type: string; token_reward_amount: number;
}

interface AdRow {
  id: string; title: string; ad_type: string; reward_amount: number; cooldown_seconds: number;
  ad_zone_id: string | null; ads_per_click: number;
  reward_type: string; token_reward_amount: number;
}

declare global { interface Window { [key: string]: any; } }

const EarnScreen = () => {
  const { user, refreshProfile } = useAuth();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [userTaskMap, setUserTaskMap] = useState<Record<string, string>>({});
  const [taskCooldowns, setTaskCooldowns] = useState<Record<string, number>>({});
  const [shortlinks, setShortlinks] = useState<ShortlinkRow[]>([]);
  const [completedShortlinks, setCompletedShortlinks] = useState<Set<string>>(new Set());
  const [shortlinkEarnings, setShortlinkEarnings] = useState(0);
  const [ads, setAds] = useState<AdRow[]>([]);
  const [adCooldowns, setAdCooldowns] = useState<Record<string, Date>>({});
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const [countdowns, setCountdowns] = useState<Record<string, number>>({});

  useEffect(() => { fetchAll(); }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdowns(prev => {
        const next = { ...prev }; let changed = false;
        for (const key in next) { if (next[key] > 0) { next[key]--; changed = true; } }
        return changed ? next : prev;
      });
      setTaskCooldowns(prev => {
        const next = { ...prev }; let changed = false;
        for (const key in next) { if (next[key] > 0) { next[key]--; changed = true; } else { delete next[key]; changed = true; } }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchTasks(), fetchShortlinks(), fetchAds()]);
    setLoading(false);
  };

  const fetchTasks = async () => {
    const { data: taskData } = await supabase.from("tasks")
      .select("id, title, description, reward_amount, type, status, is_daily, url, verification_type, cooldown_seconds, reward_type, token_reward_amount")
      .eq("status", "active");
    if (taskData) setTasks(taskData);

    if (user) {
      const { data: userTasks } = await supabase.from("user_tasks").select("task_id, status, completed_at").eq("user_id", user.id);
      if (userTasks) {
        const map: Record<string, string> = {};
        const cooldowns: Record<string, number> = {};
        userTasks.forEach(ut => {
          map[ut.task_id] = ut.status;
          if (ut.status === "completed" && ut.completed_at) {
            const task = taskData?.find(t => t.id === ut.task_id);
            if (task && task.cooldown_seconds > 0) {
              const elapsed = (Date.now() - new Date(ut.completed_at).getTime()) / 1000;
              const remaining = Math.ceil(task.cooldown_seconds - elapsed);
              if (remaining > 0) cooldowns[ut.task_id] = remaining;
            }
          }
        });
        setUserTaskMap(map); setTaskCooldowns(cooldowns);
      }
    }
  };

  const fetchShortlinks = async () => {
    const { data } = await supabase.from("shortlinks")
      .select("id, title, url, reward_amount, timer_seconds, network, reward_type, token_reward_amount")
      .eq("is_active", true);
    if (data) setShortlinks(data);

    if (user) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const { data: completions } = await supabase.from("user_shortlinks")
        .select("shortlink_id, reward_amount").eq("user_id", user.id).gte("completed_at", today.toISOString());
      if (completions) {
        setCompletedShortlinks(new Set(completions.map(c => c.shortlink_id)));
        setShortlinkEarnings(completions.reduce((s, c) => s + Number(c.reward_amount), 0));
      }
    }
  };

  const fetchAds = async () => {
    const { data } = await supabase.from("ads")
      .select("id, title, ad_type, reward_amount, cooldown_seconds, ad_zone_id, ads_per_click, reward_type, token_reward_amount")
      .eq("is_active", true);
    if (data) setAds(data);

    if (user) {
      const { data: views } = await supabase.from("user_ad_views")
        .select("ad_id, viewed_at").eq("user_id", user.id).order("viewed_at", { ascending: false });
      if (views) {
        const cooldowns: Record<string, Date> = {};
        views.forEach(v => { if (!cooldowns[v.ad_id]) cooldowns[v.ad_id] = new Date(v.viewed_at); });
        setAdCooldowns(cooldowns);
        const cd: Record<string, number> = {};
        data?.forEach(ad => {
          const lastView = cooldowns[ad.id];
          if (lastView) {
            const remaining = Math.ceil(ad.cooldown_seconds - (Date.now() - lastView.getTime()) / 1000);
            if (remaining > 0) cd[`ad_${ad.id}`] = remaining;
          }
        });
        setCountdowns(prev => ({ ...prev, ...cd }));
      }
    }
  };

  const completeTask = async (task: TaskRow) => {
    if (!user) return;
    const status = userTaskMap[task.id];
    if (status === "completed" && !task.is_daily && !task.cooldown_seconds) return;
    if (taskCooldowns[task.id] && taskCooldowns[task.id] > 0) {
      toast.error(`Wait ${formatTime(taskCooldowns[task.id])} before retrying`); return;
    }

    hapticFeedback.impact("medium");
    setCompleting(task.id);

    if (task.url) window.open(task.url, "_blank");

    const { data: existing } = await supabase.from("user_tasks")
      .select("id").eq("user_id", user.id).eq("task_id", task.id).eq("status", "completed").maybeSingle();
    if (existing && !task.is_daily) { toast.info("Task already completed"); setCompleting(null); return; }

    const { error: taskError } = await supabase.from("user_tasks").insert({
      user_id: user.id, task_id: task.id, status: "completed", completed_at: new Date().toISOString(),
    });
    if (taskError) { toast.error("Failed to complete task"); setCompleting(null); return; }

    await supabase.rpc("add_xp", { p_user_id: user.id, p_amount: task.reward_amount });
    if (task.reward_type === "xp_and_token" && task.token_reward_amount > 0) {
      await supabase.rpc("add_tokens", { p_user_id: user.id, p_amount: task.token_reward_amount });
    }
    await supabase.from("transactions").insert({
      user_id: user.id, type: "task_reward", amount: task.reward_amount,
      description: `Task: ${task.title}`, reference_id: task.id,
    });

    setUserTaskMap(prev => ({ ...prev, [task.id]: "completed" }));
    hapticFeedback.notification("success");
    const rewardMsg = task.reward_type === "xp_and_token"
      ? `+${task.reward_amount} XP & +${task.token_reward_amount} TKN earned!`
      : `+${task.reward_amount} XP earned!`;
    toast.success(rewardMsg);
    refreshProfile();

    if (task.verification_type === "timer" && task.cooldown_seconds > 0) {
      setCountdowns(prev => ({ ...prev, [`task_${task.id}`]: task.cooldown_seconds }));
      setTaskCooldowns(prev => ({ ...prev, [task.id]: task.cooldown_seconds }));
    }
    setCompleting(null);
  };

  const completeShortlink = async (link: ShortlinkRow) => {
    if (!user || completedShortlinks.has(link.id)) return;
    hapticFeedback.impact("medium");
    window.open(link.url, "_blank");
    setCompleting(link.id);
    setCountdowns(prev => ({ ...prev, [`sl_${link.id}`]: link.timer_seconds }));

    await new Promise(resolve => setTimeout(resolve, link.timer_seconds * 1000));

    await supabase.from("user_shortlinks").insert({ user_id: user.id, shortlink_id: link.id, reward_amount: link.reward_amount });
    await supabase.rpc("add_xp", { p_user_id: user.id, p_amount: link.reward_amount });
    if (link.reward_type === "xp_and_token" && link.token_reward_amount > 0) {
      await supabase.rpc("add_tokens", { p_user_id: user.id, p_amount: link.token_reward_amount });
    }
    await supabase.from("transactions").insert({ user_id: user.id, type: "shortlink", amount: link.reward_amount, description: `Shortlink: ${link.title}` });

    setCompletedShortlinks(prev => new Set(prev).add(link.id));
    setShortlinkEarnings(prev => prev + link.reward_amount);
    hapticFeedback.notification("success");
    const rewardMsg = link.reward_type === "xp_and_token"
      ? `+${link.reward_amount} XP & +${link.token_reward_amount} TKN earned!`
      : `+${link.reward_amount} XP earned!`;
    toast.success(rewardMsg);
    refreshProfile();
    setCompleting(null);
    setCountdowns(prev => { const n = { ...prev }; delete n[`sl_${link.id}`]; return n; });
  };

  const showMonetag = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const fn = window['show_8914235'];
      if (typeof fn === 'function') { fn().then(() => resolve()).catch(() => reject(new Error('Ad failed'))); }
      else { reject(new Error('Monetag SDK not loaded')); }
    });
  };

  const watchAd = async (ad: AdRow) => {
    if (!user) return;
    const cdKey = `ad_${ad.id}`;
    if (countdowns[cdKey] && countdowns[cdKey] > 0) { toast.error(`Cooldown: ${formatTime(countdowns[cdKey])}`); return; }

    hapticFeedback.impact("medium");
    setCompleting(ad.id);
    const totalAds = ad.ads_per_click || 1;

    try {
      for (let i = 0; i < totalAds; i++) {
        toast.info(`📺 Ad ${i + 1}/${totalAds}...`);
        setCountdowns(prev => ({ ...prev, [`watching_${ad.id}`]: totalAds - i }));
        await showMonetag();
        if (i < totalAds - 1) await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (err) {
      toast.error('Ad failed to load. Please try again.');
      setCompleting(null);
      setCountdowns(prev => { const n = { ...prev }; delete n[`watching_${ad.id}`]; return n; });
      return;
    }

    await supabase.from("user_ad_views").insert({ user_id: user.id, ad_id: ad.id, reward_amount: ad.reward_amount });
    await supabase.rpc("add_xp", { p_user_id: user.id, p_amount: ad.reward_amount });
    if (ad.reward_type === "xp_and_token" && ad.token_reward_amount > 0) {
      await supabase.rpc("add_tokens", { p_user_id: user.id, p_amount: ad.token_reward_amount });
    }
    await supabase.from("transactions").insert({ user_id: user.id, type: "ad_reward", amount: ad.reward_amount, description: `Ad: ${ad.title}` });

    setAdCooldowns(prev => ({ ...prev, [ad.id]: new Date() }));
    setCountdowns(prev => ({ ...prev, [cdKey]: ad.cooldown_seconds }));
    hapticFeedback.notification("success");
    const rewardMsg = ad.reward_type === "xp_and_token"
      ? `+${ad.reward_amount} XP & +${ad.token_reward_amount} TKN earned! (${totalAds} ads watched)`
      : `+${ad.reward_amount} XP earned! (${totalAds} ads watched)`;
    toast.success(rewardMsg);
    refreshProfile();
    setCompleting(null);
    setCountdowns(prev => { const n = { ...prev }; delete n[`watching_${ad.id}`]; return n; });
  };

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "Ready";
    const m = Math.floor(seconds / 60); const s = seconds % 60;
    return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${s}s`;
  };

  const isTaskAvailable = (task: TaskRow) => {
    const status = userTaskMap[task.id];
    if (status === "completed" && !task.is_daily && !task.cooldown_seconds) return false;
    if (taskCooldowns[task.id] && taskCooldowns[task.id] > 0) return false;
    return true;
  };

  const isAdAvailable = (ad: AdRow) => {
    const cdKey = `ad_${ad.id}`;
    return !countdowns[cdKey] || countdowns[cdKey] <= 0;
  };

  const completedTaskCount = Object.values(userTaskMap).filter(s => s === "completed").length;

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="mb-5">
        <h1 className="text-xl font-display font-bold text-foreground">Earn</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Complete tasks & watch ads to earn XP</p>
        <div className="flex items-center gap-3 mt-3">
          <div className="glass rounded-xl px-3 py-2 flex-1">
            <p className="text-[10px] text-muted-foreground">Tasks Done</p>
            <p className="text-sm font-bold text-foreground">{completedTaskCount}</p>
          </div>
          <div className="glass rounded-xl px-3 py-2 flex-1">
            <p className="text-[10px] text-muted-foreground">Links Today</p>
            <p className="text-sm font-bold text-earn">{completedShortlinks.size}/{shortlinks.length}</p>
          </div>
          <div className="glass rounded-xl px-3 py-2 flex-1">
            <p className="text-[10px] text-muted-foreground">Link Earnings</p>
            <p className="text-sm font-bold text-earn">+{shortlinkEarnings}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="w-full bg-secondary/50 border border-border">
          <TabsTrigger value="tasks" className="flex-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1">
            <Sparkles className="h-3 w-3" />Tasks
          </TabsTrigger>
          <TabsTrigger value="shortlinks" className="flex-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1">
            <ExternalLink className="h-3 w-3" />Links
          </TabsTrigger>
          <TabsTrigger value="ads" className="flex-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1">
            <Play className="h-3 w-3" />Ads
          </TabsTrigger>
        </TabsList>

        {/* TASKS */}
        <TabsContent value="tasks" className="mt-4 space-y-2.5">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : tasks.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center">
              <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">No tasks available</p>
              <p className="text-xs text-muted-foreground mt-1">Check back later!</p>
            </div>
          ) : (
            <AnimatePresence>
              {tasks.map((task, i) => {
                const config = typeConfig[task.type] || typeConfig.social;
                const Icon = config.icon;
                const completed = userTaskMap[task.id] === "completed" && !task.is_daily && !task.cooldown_seconds;
                const onCooldown = taskCooldowns[task.id] && taskCooldowns[task.id] > 0;
                const isProcessing = completing === task.id;
                const taskCdKey = `task_${task.id}`;
                const hasActiveCountdown = countdowns[taskCdKey] && countdowns[taskCdKey] > 0;

                return (
                  <motion.div key={task.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <button
                      onClick={() => completeTask(task)}
                      disabled={completed || !!onCooldown || isProcessing}
                      className={`w-full glass rounded-xl p-3.5 flex items-center gap-3 text-left transition-all ${
                        completed ? "opacity-50" : onCooldown ? "opacity-70" : "hover:bg-secondary/30 active:scale-[0.98]"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0`}>
                        {completed ? <CheckCircle2 className="h-5 w-5 text-white" /> : <Icon className="h-5 w-5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${completed ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.title}</p>
                        {task.description && <p className="text-[10px] text-muted-foreground truncate">{task.description}</p>}
                        {hasActiveCountdown && (
                          <div className="flex items-center gap-1 mt-1">
                            <Timer className="h-3 w-3 text-warning" />
                            <span className="text-[10px] text-warning font-mono">{formatTime(countdowns[taskCdKey])}</span>
                          </div>
                        )}
                        {onCooldown && !hasActiveCountdown && (
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground font-mono">{formatTime(taskCooldowns[task.id])}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                          <>
                            <p className="text-sm font-bold text-earn">+{task.reward_amount}</p>
                            <p className="text-[9px] text-muted-foreground">XP</p>
                            {task.reward_type === "xp_and_token" && task.token_reward_amount > 0 && (
                              <p className="text-[9px] text-primary">+{task.token_reward_amount} TKN</p>
                            )}
                          </>
                        )}
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </TabsContent>

        {/* SHORTLINKS */}
        <TabsContent value="shortlinks" className="mt-4 space-y-2.5">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : shortlinks.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center">
              <ExternalLink className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">No shortlinks available</p>
            </div>
          ) : (
            shortlinks.map((link, i) => {
              const done = completedShortlinks.has(link.id);
              const cdKey = `sl_${link.id}`;
              const hasCountdown = countdowns[cdKey] && countdowns[cdKey] > 0;
              const isProcessing = completing === link.id;

              return (
                <motion.div key={link.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <button
                    onClick={() => completeShortlink(link)}
                    disabled={done || isProcessing}
                    className={`w-full glass rounded-xl p-3.5 flex items-center gap-3 text-left transition-all ${
                      done ? "opacity-50" : "hover:bg-secondary/30 active:scale-[0.98]"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                      {done ? <CheckCircle2 className="h-5 w-5 text-white" /> : <ExternalLink className="h-5 w-5 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>{link.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{link.network}</Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Timer className="h-2.5 w-2.5" />{link.timer_seconds}s
                        </span>
                      </div>
                      {hasCountdown && (
                        <div className="mt-1.5">
                          <Progress value={((link.timer_seconds - countdowns[cdKey]) / link.timer_seconds) * 100} className="h-1" />
                          <p className="text-[9px] text-warning mt-0.5 font-mono">{formatTime(countdowns[cdKey])}</p>
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : (
                        <>
                          <p className="text-sm font-bold text-earn">+{link.reward_amount}</p>
                          <p className="text-[9px] text-muted-foreground">XP</p>
                        </>
                      )}
                    </div>
                  </button>
                </motion.div>
              );
            })
          )}
        </TabsContent>

        {/* ADS */}
        <TabsContent value="ads" className="mt-4 space-y-2.5">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : ads.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center">
              <Play className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">No ads available</p>
            </div>
          ) : (
            ads.map((ad, i) => {
              const cdKey = `ad_${ad.id}`;
              const onCd = countdowns[cdKey] && countdowns[cdKey] > 0;
              const isProcessing = completing === ad.id;
              const watchingKey = `watching_${ad.id}`;
              const isWatching = countdowns[watchingKey] && countdowns[watchingKey] > 0;

              return (
                <motion.div key={ad.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <button
                    onClick={() => watchAd(ad)}
                    disabled={!!onCd || isProcessing}
                    className={`w-full glass rounded-xl p-3.5 flex items-center gap-3 text-left transition-all ${
                      onCd ? "opacity-70" : "hover:bg-secondary/30 active:scale-[0.98]"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                      <Play className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{ad.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{ad.ad_type}</Badge>
                        {ad.ads_per_click > 1 && <span className="text-[10px] text-muted-foreground">{ad.ads_per_click} ads</span>}
                      </div>
                      {onCd && (
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-warning" />
                          <span className="text-[10px] text-warning font-mono">{formatTime(countdowns[cdKey])}</span>
                        </div>
                      )}
                      {isWatching && <p className="text-[10px] text-primary mt-1">📺 Watching...</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : (
                        <>
                          <p className="text-sm font-bold text-earn">+{ad.reward_amount}</p>
                          <p className="text-[9px] text-muted-foreground">XP</p>
                        </>
                      )}
                    </div>
                  </button>
                </motion.div>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EarnScreen;
