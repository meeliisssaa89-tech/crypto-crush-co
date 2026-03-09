import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Clock, CheckCircle2, Play, Share2, Users, Download, FileText, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { hapticFeedback } from "@/hooks/useTelegram";
import { toast } from "sonner";

const iconMap: Record<string, any> = {
  social: Share2,
  install: Download,
  survey: FileText,
  daily: CheckCircle2,
  referral: Users,
};

const statusColors: Record<string, string> = {
  available: "bg-earn/20 text-earn",
  started: "bg-warning/20 text-warning",
  completed: "bg-primary/20 text-primary",
};

interface TaskRow {
  id: string;
  title: string;
  reward_amount: number;
  type: string;
  status: string;
  is_daily: boolean;
  url: string | null;
}

interface ShortlinkRow {
  id: string;
  title: string;
  url: string;
  reward_amount: number;
  timer_seconds: number;
  network: string;
}

interface AdRow {
  id: string;
  title: string;
  ad_type: string;
  reward_amount: number;
  cooldown_seconds: number;
}

const EarnScreen = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [userTaskIds, setUserTaskIds] = useState<Set<string>>(new Set());
  const [shortlinks, setShortlinks] = useState<ShortlinkRow[]>([]);
  const [completedShortlinks, setCompletedShortlinks] = useState<Set<string>>(new Set());
  const [shortlinkEarnings, setShortlinkEarnings] = useState(0);
  const [ads, setAds] = useState<AdRow[]>([]);
  const [adCooldowns, setAdCooldowns] = useState<Record<string, Date>>({});
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchTasks(), fetchShortlinks(), fetchAds()]);
    setLoading(false);
  };

  const fetchTasks = async () => {
    const { data: taskData } = await supabase
      .from("tasks")
      .select("id, title, reward_amount, type, status, is_daily, url")
      .eq("status", "active");
    if (taskData) setTasks(taskData);

    if (user) {
      const { data: userTasks } = await supabase
        .from("user_tasks")
        .select("task_id, status")
        .eq("user_id", user.id);
      if (userTasks) {
        setUserTaskIds(new Set(userTasks.filter(ut => ut.status === "completed").map(ut => ut.task_id)));
      }
    }
  };

  const fetchShortlinks = async () => {
    const { data } = await supabase
      .from("shortlinks")
      .select("id, title, url, reward_amount, timer_seconds, network")
      .eq("is_active", true);
    if (data) setShortlinks(data);

    if (user) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: completions } = await supabase
        .from("user_shortlinks")
        .select("shortlink_id, reward_amount")
        .eq("user_id", user.id)
        .gte("completed_at", today.toISOString());
      if (completions) {
        setCompletedShortlinks(new Set(completions.map(c => c.shortlink_id)));
        setShortlinkEarnings(completions.reduce((s, c) => s + Number(c.reward_amount), 0));
      }
    }
  };

  const fetchAds = async () => {
    const { data } = await supabase
      .from("ads")
      .select("id, title, ad_type, reward_amount, cooldown_seconds")
      .eq("is_active", true);
    if (data) setAds(data);

    if (user) {
      const { data: views } = await supabase
        .from("user_ad_views")
        .select("ad_id, viewed_at")
        .eq("user_id", user.id)
        .order("viewed_at", { ascending: false });
      if (views) {
        const cooldowns: Record<string, Date> = {};
        views.forEach(v => {
          if (!cooldowns[v.ad_id]) cooldowns[v.ad_id] = new Date(v.viewed_at);
        });
        setAdCooldowns(cooldowns);
      }
    }
  };

  const completeTask = async (taskId: string, rewardAmount: number) => {
    if (!user || userTaskIds.has(taskId)) return;
    setCompleting(taskId);

    const { data: existing } = await supabase
      .from("user_tasks")
      .select("id")
      .eq("user_id", user.id)
      .eq("task_id", taskId)
      .eq("status", "completed")
      .maybeSingle();

    if (existing) {
      toast.error("Task already completed!");
      setCompleting(null);
      return;
    }

    const { error: taskError } = await supabase.from("user_tasks").insert({
      user_id: user.id,
      task_id: taskId,
      status: "completed",
      completed_at: new Date().toISOString(),
    });

    if (taskError) {
      toast.error("Failed to complete task");
      setCompleting(null);
      return;
    }

    await supabase.from("transactions").insert({
      user_id: user.id,
      type: "task_reward",
      amount: rewardAmount,
      description: "Task reward",
      reference_id: taskId,
    });

    const { data: profile } = await supabase.from("profiles").select("xp").eq("user_id", user.id).single();
    if (profile) {
      await supabase.from("profiles").update({ xp: profile.xp + Math.floor(rewardAmount / 2) }).eq("user_id", user.id);
    }

    setUserTaskIds(prev => new Set(prev).add(taskId));
    toast.success(`+${rewardAmount} coins earned!`);
    setCompleting(null);
  };

  const completeShortlink = async (link: ShortlinkRow) => {
    if (!user || completedShortlinks.has(link.id)) return;
    hapticFeedback.impact("medium");

    // Open the link
    window.open(link.url, "_blank");
    setCompleting(link.id);

    // Wait for the timer
    await new Promise(resolve => setTimeout(resolve, link.timer_seconds * 1000));

    await supabase.from("user_shortlinks").insert({
      user_id: user.id,
      shortlink_id: link.id,
      reward_amount: link.reward_amount,
    });

    await supabase.from("transactions").insert({
      user_id: user.id,
      type: "shortlink",
      amount: link.reward_amount,
      description: `Shortlink: ${link.title}`,
    });

    setCompletedShortlinks(prev => new Set(prev).add(link.id));
    setShortlinkEarnings(prev => prev + link.reward_amount);
    hapticFeedback.notification("success");
    toast.success(`+${link.reward_amount} coins earned!`);
    setCompleting(null);
  };

  const watchAd = async (ad: AdRow) => {
    if (!user) return;
    const lastView = adCooldowns[ad.id];
    if (lastView) {
      const elapsed = (Date.now() - lastView.getTime()) / 1000;
      if (elapsed < ad.cooldown_seconds) {
        const remaining = Math.ceil(ad.cooldown_seconds - elapsed);
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        toast.error(`Cooldown: ${mins}:${secs.toString().padStart(2, "0")} remaining`);
        return;
      }
    }

    hapticFeedback.impact("medium");
    setCompleting(ad.id);

    // Simulate ad watch (3 seconds)
    await new Promise(resolve => setTimeout(resolve, 3000));

    await supabase.from("user_ad_views").insert({
      user_id: user.id,
      ad_id: ad.id,
      reward_amount: ad.reward_amount,
    });

    await supabase.from("transactions").insert({
      user_id: user.id,
      type: "ad_reward",
      amount: ad.reward_amount,
      description: `Ad reward: ${ad.title}`,
    });

    setAdCooldowns(prev => ({ ...prev, [ad.id]: new Date() }));
    hapticFeedback.notification("success");
    toast.success(`+${ad.reward_amount} coins earned!`);
    setCompleting(null);
  };

  const getAdCooldownText = (ad: AdRow) => {
    const lastView = adCooldowns[ad.id];
    if (!lastView) return "Ready";
    const elapsed = (Date.now() - lastView.getTime()) / 1000;
    if (elapsed >= ad.cooldown_seconds) return "Ready";
    const remaining = Math.ceil(ad.cooldown_seconds - elapsed);
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isAdAvailable = (ad: AdRow) => {
    const lastView = adCooldowns[ad.id];
    if (!lastView) return true;
    return (Date.now() - lastView.getTime()) / 1000 >= ad.cooldown_seconds;
  };

  const getTaskStatus = (taskId: string) => userTaskIds.has(taskId) ? "completed" : "available";

  const completedShortlinkCount = completedShortlinks.size;
  const totalShortlinkCount = shortlinks.length;

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="text-xl font-display font-bold text-foreground mb-1">Earn</h1>
      <p className="text-sm text-muted-foreground mb-4">Complete tasks to earn rewards</p>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="w-full bg-secondary/50 border border-border">
          <TabsTrigger value="tasks" className="flex-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Tasks</TabsTrigger>
          <TabsTrigger value="shortlinks" className="flex-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Shortlinks</TabsTrigger>
          <TabsTrigger value="ads" className="flex-1 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Ads</TabsTrigger>
        </TabsList>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="mt-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No tasks available</p>
          ) : (
            tasks.map((task) => {
              const status = getTaskStatus(task.id);
              const Icon = iconMap[task.type] || Share2;
              const isCompleted = status === "completed";
              const isCompleting = completing === task.id;

              return (
                <motion.button
                  key={task.id}
                  whileTap={{ scale: 0.98 }}
                  disabled={isCompleted || isCompleting}
                  onClick={() => completeTask(task.id, task.reward_amount)}
                  className="glass rounded-xl p-3.5 flex items-center gap-3 w-full text-left disabled:opacity-60"
                >
                  <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    {isCompleting ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <Icon className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                      {task.is_daily && <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-warning text-warning">Daily</Badge>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge className={`text-[9px] px-1.5 py-0 h-4 border-0 ${statusColors[status]}`}>{status}</Badge>
                      <span className="text-[10px] text-muted-foreground capitalize">{task.type}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-earn">+{task.reward_amount}</p>
                    <p className="text-[9px] text-muted-foreground">coins</p>
                  </div>
                </motion.button>
              );
            })
          )}
        </TabsContent>

        {/* Shortlinks Tab */}
        <TabsContent value="shortlinks" className="mt-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : shortlinks.length === 0 ? (
            <div className="glass rounded-xl p-6 text-center space-y-2">
              <ExternalLink className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-semibold text-foreground">No shortlinks available</p>
              <p className="text-xs text-muted-foreground">Check back later for new shortlinks to earn coins.</p>
            </div>
          ) : (
            <>
              <div className="glass rounded-xl p-3 mb-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Today's earnings</span>
                  <span className="text-sm font-bold text-earn">+{shortlinkEarnings} coins</span>
                </div>
                <Progress value={totalShortlinkCount > 0 ? (completedShortlinkCount / totalShortlinkCount) * 100 : 0} className="h-1.5 mt-2 bg-muted" />
                <p className="text-[10px] text-muted-foreground mt-1">{completedShortlinkCount}/{totalShortlinkCount} links visited</p>
              </div>
              {shortlinks.map((link) => {
                const isDone = completedShortlinks.has(link.id);
                const isProcessing = completing === link.id;
                return (
                  <motion.button
                    key={link.id}
                    whileTap={{ scale: 0.98 }}
                    disabled={isDone || isProcessing}
                    onClick={() => completeShortlink(link)}
                    className="glass rounded-xl p-3.5 w-full flex items-center gap-3 disabled:opacity-60"
                  >
                    <div className="w-9 h-9 rounded-lg gradient-earn flex items-center justify-center shrink-0">
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 text-white animate-spin" />
                      ) : isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      ) : (
                        <ExternalLink className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-foreground">{link.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{link.timer_seconds}s wait</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">• {link.network}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-earn">+{link.reward_amount}</p>
                      <p className="text-[9px] text-muted-foreground">coins</p>
                    </div>
                  </motion.button>
                );
              })}
            </>
          )}
        </TabsContent>

        {/* Ads Tab */}
        <TabsContent value="ads" className="mt-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : ads.length === 0 ? (
            <div className="glass rounded-xl p-6 text-center space-y-2">
              <Play className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-semibold text-foreground">No ads available</p>
              <p className="text-xs text-muted-foreground">Check back later for rewarded ads.</p>
            </div>
          ) : (
            ads.map((ad) => {
              const available = isAdAvailable(ad);
              const cooldownText = getAdCooldownText(ad);
              const isProcessing = completing === ad.id;
              return (
                <motion.button
                  key={ad.id}
                  whileTap={{ scale: 0.98 }}
                  disabled={!available || isProcessing}
                  onClick={() => watchAd(ad)}
                  className="glass rounded-xl p-3.5 w-full flex items-center gap-3 disabled:opacity-50"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${available ? 'gradient-primary' : 'bg-muted'}`}>
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-foreground">{ad.title}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className={`text-[10px] ${available ? 'text-earn' : 'text-muted-foreground'}`}>{cooldownText}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-earn">+{ad.reward_amount}</p>
                    <p className="text-[9px] text-muted-foreground">coins</p>
                  </div>
                </motion.button>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EarnScreen;
