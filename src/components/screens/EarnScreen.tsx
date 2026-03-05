import { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Clock, CheckCircle2, Play, Share2, Users, Download, FileText, ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const tasks = [
  { id: 1, title: "Join Telegram Channel", reward: 50, type: "Social", icon: Share2, status: "available", daily: false },
  { id: 2, title: "Subscribe YouTube", reward: 100, type: "Social", icon: Share2, status: "available", daily: false },
  { id: 3, title: "Install App - GameX", reward: 200, type: "Install", icon: Download, status: "available", daily: false },
  { id: 4, title: "Complete Survey #12", reward: 150, type: "Survey", icon: FileText, status: "pending", daily: false },
  { id: 5, title: "Follow Twitter Account", reward: 75, type: "Social", icon: Share2, status: "completed", daily: false },
  { id: 6, title: "Daily Check-in Task", reward: 30, type: "Daily", icon: CheckCircle2, status: "available", daily: true },
  { id: 7, title: "Invite 3 Friends", reward: 500, type: "Referral", icon: Users, status: "available", daily: false },
];

const shortlinks = [
  { id: 1, title: "Link #1 - Premium", reward: 15, timer: 10, network: "Monetag" },
  { id: 2, title: "Link #2 - Standard", reward: 10, timer: 8, network: "Adsterra" },
  { id: 3, title: "Link #3 - Basic", reward: 8, timer: 5, network: "Monetag" },
  { id: 4, title: "Link #4 - Premium", reward: 20, timer: 15, network: "ShrinkMe" },
  { id: 5, title: "Link #5 - Standard", reward: 12, timer: 10, network: "Adsterra" },
];

const ads = [
  { id: 1, title: "Watch Video Ad", reward: 25, cooldown: "Ready", available: true },
  { id: 2, title: "Rewarded Interstitial", reward: 15, cooldown: "Ready", available: true },
  { id: 3, title: "Full Screen Ad", reward: 30, cooldown: "02:45", available: false },
  { id: 4, title: "Short Clip Ad", reward: 10, cooldown: "Ready", available: true },
];

const statusColors: Record<string, string> = {
  available: "bg-earn/20 text-earn",
  pending: "bg-warning/20 text-warning",
  completed: "bg-primary/20 text-primary",
};

const EarnScreen = () => {
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
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              whileTap={{ scale: 0.98 }}
              className="glass rounded-xl p-3.5 flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <task.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                  {task.daily && <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-warning text-warning">Daily</Badge>}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge className={`text-[9px] px-1.5 py-0 h-4 border-0 ${statusColors[task.status]}`}>{task.status}</Badge>
                  <span className="text-[10px] text-muted-foreground">{task.type}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-earn">+{task.reward}</p>
                <p className="text-[9px] text-muted-foreground">coins</p>
              </div>
            </motion.div>
          ))}
        </TabsContent>

        <TabsContent value="shortlinks" className="mt-4 space-y-2">
          <div className="glass rounded-xl p-3 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Today's earnings</span>
              <span className="text-sm font-bold text-earn">+65 coins</span>
            </div>
            <Progress value={40} className="h-1.5 mt-2 bg-muted" />
            <p className="text-[10px] text-muted-foreground mt-1">4/10 links visited</p>
          </div>
          {shortlinks.map((link) => (
            <motion.button
              key={link.id}
              whileTap={{ scale: 0.98 }}
              className="glass rounded-xl p-3.5 w-full flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-lg gradient-earn flex items-center justify-center shrink-0">
                <ExternalLink className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">{link.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{link.timer}s wait</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">• {link.network}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-earn">+{link.reward}</p>
                <p className="text-[9px] text-muted-foreground">coins</p>
              </div>
            </motion.button>
          ))}
        </TabsContent>

        <TabsContent value="ads" className="mt-4 space-y-2">
          {ads.map((ad) => (
            <motion.button
              key={ad.id}
              whileTap={{ scale: 0.98 }}
              disabled={!ad.available}
              className="glass rounded-xl p-3.5 w-full flex items-center gap-3 disabled:opacity-50"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${ad.available ? 'gradient-primary' : 'bg-muted'}`}>
                <Play className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">{ad.title}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className={`text-[10px] ${ad.available ? 'text-earn' : 'text-muted-foreground'}`}>{ad.cooldown}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-earn">+{ad.reward}</p>
                <p className="text-[9px] text-muted-foreground">coins</p>
              </div>
            </motion.button>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EarnScreen;
