import { useState, useEffect } from "react";
import { Users, Search, Loader2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReferralRow {
  id: string;
  referrer_id: string;
  referred_id: string;
  reward_amount: number;
  level: number;
  created_at: string;
  referrer_username?: string;
  referred_username?: string;
}

interface ReferralConfig {
  referral_reward_xp: number;
  referral_percent_l1: number;
  referral_percent_l2: number;
  referral_percent_l3: number;
  bot_name: string;
}

const ReferralSettings = () => {
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [config, setConfig] = useState<ReferralConfig>({
    referral_reward_xp: 100,
    referral_percent_l1: 10,
    referral_percent_l2: 5,
    referral_percent_l3: 2,
    bot_name: "Eg_Token_bot",
  });
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ total: 0, topReferrer: "", topCount: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchReferrals(), fetchConfig(), fetchStats()]);
    setLoading(false);
  };

  const fetchReferrals = async () => {
    const { data } = await supabase
      .from("referrals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (data) {
      // Get usernames for referrers and referred
      const userIds = [...new Set(data.flatMap(r => [r.referrer_id, r.referred_id]))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.username]) || []);

      setReferrals(data.map(r => ({
        ...r,
        referrer_username: profileMap.get(r.referrer_id) || "Unknown",
        referred_username: profileMap.get(r.referred_id) || "Unknown",
      })));
    }
  };

  const fetchConfig = async () => {
    const { data } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["referral_config"]);

    if (data && data.length > 0) {
      const val = data[0].value;
      if (val && typeof val === "object") {
        setConfig(prev => ({ ...prev, ...(val as any) }));
      }
    }
  };

  const fetchStats = async () => {
    const { count } = await supabase
      .from("referrals")
      .select("id", { count: "exact", head: true });

    // Get top referrer
    const { data: topData } = await supabase
      .from("referrals")
      .select("referrer_id");

    if (topData && topData.length > 0) {
      const counts: Record<string, number> = {};
      topData.forEach(r => { counts[r.referrer_id] = (counts[r.referrer_id] || 0) + 1; });
      const topId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      if (topId) {
        const { data: prof } = await supabase.from("profiles").select("username").eq("user_id", topId[0]).maybeSingle();
        setStats({ total: count ?? 0, topReferrer: prof?.username || "Unknown", topCount: topId[1] });
      }
    } else {
      setStats({ total: count ?? 0, topReferrer: "-", topCount: 0 });
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    const { error } = await supabase.from("app_settings").upsert(
      { key: "referral_config", value: config as any },
      { onConflict: "key" }
    );
    if (error) toast.error(error.message);
    else toast.success("Referral settings saved!");
    setSaving(false);
  };

  const deleteReferral = async (id: string) => {
    if (!confirm("Delete this referral?")) return;
    const { error } = await supabase.from("referrals").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); fetchReferrals(); }
  };

  const filtered = referrals.filter(r =>
    !search || r.referrer_username?.toLowerCase().includes(search.toLowerCase()) ||
    r.referred_username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass rounded-xl p-3 text-center">
          <p className="text-[10px] text-muted-foreground">Total Referrals</p>
          <p className="text-lg font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <p className="text-[10px] text-muted-foreground">Top Referrer</p>
          <p className="text-sm font-bold text-foreground truncate">{stats.topReferrer}</p>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <p className="text-[10px] text-muted-foreground">Top Count</p>
          <p className="text-lg font-bold text-earn">{stats.topCount}</p>
        </div>
      </div>

      {/* Config */}
      <div className="glass rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" /> Referral Config
        </h3>

        <div>
          <label className="text-[10px] text-muted-foreground">Bot Name</label>
          <Input value={config.bot_name} onChange={e => setConfig(p => ({ ...p, bot_name: e.target.value }))} className="bg-secondary/50" />
          <p className="text-[9px] text-muted-foreground mt-1">
            Link: https://t.me/{config.bot_name}?startapp=CODE
          </p>
        </div>

        <div>
          <label className="text-[10px] text-muted-foreground">Signup Reward (XP)</label>
          <Input type="number" value={config.referral_reward_xp} onChange={e => setConfig(p => ({ ...p, referral_reward_xp: Number(e.target.value) }))} className="bg-secondary/50" />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground">L1 %</label>
            <Input type="number" value={config.referral_percent_l1} onChange={e => setConfig(p => ({ ...p, referral_percent_l1: Number(e.target.value) }))} className="bg-secondary/50" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">L2 %</label>
            <Input type="number" value={config.referral_percent_l2} onChange={e => setConfig(p => ({ ...p, referral_percent_l2: Number(e.target.value) }))} className="bg-secondary/50" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">L3 %</label>
            <Input type="number" value={config.referral_percent_l3} onChange={e => setConfig(p => ({ ...p, referral_percent_l3: Number(e.target.value) }))} className="bg-secondary/50" />
          </div>
        </div>

        <Button onClick={saveConfig} disabled={saving} className="w-full gradient-primary text-white border-0">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Config"}
        </Button>
      </div>

      {/* Referral List */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by username..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-secondary/50" />
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No referrals found</p>
        ) : (
          filtered.map(r => (
            <div key={r.id} className="glass rounded-xl p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground">
                  <span className="font-semibold">{r.referrer_username}</span>
                  <span className="text-muted-foreground"> → </span>
                  <span className="font-semibold">{r.referred_username}</span>
                </p>
                <p className="text-[10px] text-muted-foreground">
                  L{r.level} • +{r.reward_amount} XP • {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>
              <button onClick={() => deleteReferral(r.id)} className="p-1.5 rounded-lg hover:bg-secondary/50 text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReferralSettings;
