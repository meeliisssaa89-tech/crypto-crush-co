import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Clock, CheckCircle2, Play, Share2, Users, Download, FileText, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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

const EarnScreen = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [userTaskIds, setUserTaskIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const fetchTasks = async () => {
    setLoading(true);
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
    setLoading(false);
  };

  const completeTask = async (taskId: string, rewardAmount: number) => {
    if (!user || userTaskIds.has(taskId)) return;
    setCompleting(taskId);

    // Check for existing completion
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

    // Insert user_task
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

    // Record transaction
    await supabase.from("transactions").insert({
      user_id: user.id,
      type: "task_reward",
      amount: rewardAmount,
      description: `Task reward`,
      reference_id: taskId,
    });

    // Update XP in profile
    await supabase.rpc("has_role" as any, { _user_id: user.id, _role: "user" }); // just a no-op to keep types
    const { data: profile } = await supabase.from("profiles").select("xp").eq("user_id", user.id).single();
    if (profile) {
      await supabase.from("profiles").update({ xp: profile.xp + Math.floor(rewardAmount / 2) }).eq("user_id", user.id);
    }

    setUserTaskIds(prev => new Set(prev).add(taskId));
    toast.success(`+${rewardAmount} coins earned!`);
    setCompleting(null);
  };

  const getTaskStatus = (taskId: string) => {
    if (userTaskIds.has(taskId)) return "completed";
    return "available";
  };

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

        <TabsContent value="shortlinks" className="mt-4">
          <div className="glass rounded-xl p-6 text-center space-y-2">
            <ExternalLink className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm font-semibold text-foreground">Shortlinks Coming Soon</p>
            <p className="text-xs text-muted-foreground">Earn coins by visiting shortlinks. This feature is being configured.</p>
          </div>
        </TabsContent>

        <TabsContent value="ads" className="mt-4">
          <div className="glass rounded-xl p-6 text-center space-y-2">
            <Play className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm font-semibold text-foreground">Ad Rewards Coming Soon</p>
            <p className="text-xs text-muted-foreground">Watch ads to earn coins. This feature is being configured.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EarnScreen;
