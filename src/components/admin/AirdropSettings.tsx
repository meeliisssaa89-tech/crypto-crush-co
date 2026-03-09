import { useState, useEffect } from "react";
import {
  Rocket, Coins, Users, TrendingUp, BarChart3, Lock, Unlock,
  Save, Loader2, Target, Clock, Zap, Gift, Globe, CheckCircle2,
  RefreshCw, Percent
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AirdropStats {
  totalParticipants: number;
  totalTokensEarned: number;
  totalTokensClaimed: number;
  totalTokensLocked: number;
  totalClaimableTokens: number;
  claimsToday: number;
}

const defaultConfig = {
  lock_percentage: 70,
  token_multiplier: 0.5,
  claim_enabled: true,
  allocations: [
    { label: "Task Completion", pct: 40 },
    { label: "Referral Bonus", pct: 25 },
    { label: "Daily Activity", pct: 20 },
    { label: "Special Events", pct: 15 },
  ],
  phases: [
    { title: "Phase 1 — Accumulation", status: "active" },
    { title: "Phase 2 — Snapshot", status: "upcoming" },
    { title: "Phase 3 — Token Generation", status: "upcoming" },
    { title: "Phase 4 — Vesting & Unlock", status: "upcoming" },
    { title: "Phase 5 — Full Distribution", status: "upcoming" },
  ],
};

const AirdropSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<AirdropStats>({
    totalParticipants: 0,
    totalTokensEarned: 0,
    totalTokensClaimed: 0,
    totalTokensLocked: 0,
    totalClaimableTokens: 0,
    claimsToday: 0,
  });
  const [config, setConfig] = useState(defaultConfig);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchConfig()]);
    setLoading(false);
  };

  const fetchStats = async () => {
    const { data: airdrops } = await supabase.from("airdrops").select("tokens_earned, tokens_claimed, tokens_locked, last_claim_at");
    if (airdrops) {
      const today = new Date().toISOString().split("T")[0];
      setStats({
        totalParticipants: airdrops.length,
        totalTokensEarned: airdrops.reduce((s, a) => s + Number(a.tokens_earned), 0),
        totalTokensClaimed: airdrops.reduce((s, a) => s + Number(a.tokens_claimed), 0),
        totalTokensLocked: airdrops.reduce((s, a) => s + Number(a.tokens_locked), 0),
        totalClaimableTokens: airdrops.reduce((s, a) => s + Math.max(0, Number(a.tokens_earned) - Number(a.tokens_locked) - Number(a.tokens_claimed)), 0),
        claimsToday: airdrops.filter(a => a.last_claim_at && a.last_claim_at.startsWith(today)).length,
      });
    }
  };

  const fetchConfig = async () => {
    const { data } = await supabase.from("app_settings").select("*").eq("key", "airdrop_config").single();
    if (data?.value && typeof data.value === "object") {
      setConfig({ ...defaultConfig, ...(data.value as any) });
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    const { error } = await supabase.from("app_settings").upsert(
      { key: "airdrop_config", value: config as any },
      { onConflict: "key" }
    );
    if (error) toast.error(error.message);
    else toast.success("Airdrop settings saved!");
    setSaving(false);
  };

  const updateAllocation = (index: number, pct: number) => {
    const newAllocs = [...config.allocations];
    newAllocs[index] = { ...newAllocs[index], pct };
    setConfig({ ...config, allocations: newAllocs });
  };

  const updatePhaseStatus = (index: number, status: string) => {
    const newPhases = [...config.phases];
    newPhases[index] = { ...newPhases[index], status };
    setConfig({ ...config, phases: newPhases });
  };

  const totalAllocPct = config.allocations.reduce((s, a) => s + a.pct, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Airdrop Statistics
          </h3>
          <button onClick={fetchAll} className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Participants", value: stats.totalParticipants.toLocaleString(), icon: Users, color: "text-primary" },
            { label: "Tokens Earned", value: stats.totalTokensEarned.toLocaleString(), icon: Coins, color: "text-earn" },
            { label: "Tokens Claimed", value: stats.totalTokensClaimed.toLocaleString(), icon: CheckCircle2, color: "text-accent" },
            { label: "Tokens Locked", value: stats.totalTokensLocked.toLocaleString(), icon: Lock, color: "text-warning" },
            { label: "Claimable Now", value: stats.totalClaimableTokens.toLocaleString(), icon: Unlock, color: "text-earn" },
            { label: "Claims Today", value: stats.claimsToday.toLocaleString(), icon: TrendingUp, color: "text-primary" },
          ].map((s) => (
            <div key={s.label} className="bg-secondary/30 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</span>
              </div>
              <p className="text-lg font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* General Config */}
      <div className="glass rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          General Configuration
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-foreground">Lock Percentage</p>
              <p className="text-[10px] text-muted-foreground">% of earned tokens that are locked</p>
            </div>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={0}
                max={100}
                value={config.lock_percentage}
                onChange={(e) => setConfig({ ...config, lock_percentage: Number(e.target.value) })}
                className="w-20 h-8 text-xs bg-secondary/50 text-right"
              />
              <Percent className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-foreground">Token Multiplier</p>
              <p className="text-[10px] text-muted-foreground">XP earned × multiplier = tokens</p>
            </div>
            <Input
              type="number"
              step={0.1}
              min={0.1}
              value={config.token_multiplier}
              onChange={(e) => setConfig({ ...config, token_multiplier: Number(e.target.value) })}
              className="w-20 h-8 text-xs bg-secondary/50 text-right"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-foreground">Claims Enabled</p>
              <p className="text-[10px] text-muted-foreground">Allow users to claim tokens</p>
            </div>
            <Switch
              checked={config.claim_enabled}
              onCheckedChange={(v) => setConfig({ ...config, claim_enabled: v })}
            />
          </div>
        </div>
      </div>

      {/* Token Allocations */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Token Allocations
          </h3>
          <Badge className={`text-[9px] border-0 ${totalAllocPct === 100 ? 'bg-earn/20 text-earn' : 'bg-destructive/20 text-destructive'}`}>
            {totalAllocPct}%
          </Badge>
        </div>
        <div className="space-y-2.5">
          {config.allocations.map((alloc, i) => (
            <div key={alloc.label} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground flex-1">{alloc.label}</span>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={alloc.pct}
                  onChange={(e) => updateAllocation(i, Number(e.target.value))}
                  className="w-16 h-8 text-xs bg-secondary/50 text-right"
                />
                <span className="text-[10px] text-muted-foreground">%</span>
              </div>
            </div>
          ))}
        </div>
        {totalAllocPct !== 100 && (
          <p className="text-[10px] text-destructive mt-2">⚠️ Allocations must total 100%</p>
        )}
      </div>

      {/* Timeline Phases */}
      <div className="glass rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Roadmap Phases
        </h3>
        <div className="space-y-2.5">
          {config.phases.map((phase, i) => (
            <div key={phase.title} className="flex items-center gap-3 bg-secondary/30 rounded-lg p-2.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                phase.status === "active" ? "gradient-primary" :
                phase.status === "done" ? "bg-earn" : "bg-secondary border border-border"
              }`}>
                {phase.status === "done" ? (
                  <CheckCircle2 className="h-3 w-3 text-white" />
                ) : phase.status === "active" ? (
                  <Zap className="h-3 w-3 text-white" />
                ) : (
                  <span className="text-[8px] text-muted-foreground">{i + 1}</span>
                )}
              </div>
              <span className="text-xs text-foreground flex-1 truncate">{phase.title}</span>
              <select
                value={phase.status}
                onChange={(e) => updatePhaseStatus(i, e.target.value)}
                className="bg-secondary/50 border border-border rounded-md px-2 py-1 text-[10px] text-foreground"
              >
                <option value="upcoming">Upcoming</option>
                <option value="active">Active</option>
                <option value="done">Done</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <Button onClick={saveConfig} disabled={saving} className="w-full gradient-primary text-white border-0 gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save Airdrop Settings
      </Button>
    </div>
  );
};

export default AirdropSettings;
