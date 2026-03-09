import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Star,
  Box,
  Plus,
  Trash2,
  Edit3,
  Loader2,
  Upload,
  Image,
  Volume2,
  Sparkles,
  Settings,
  Gift,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const RARITY_OPTIONS = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];
const COLOR_PRESETS = [
  "hsl(262, 83%, 58%)",
  "hsl(217, 91%, 60%)",
  "hsl(160, 84%, 39%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)",
  "hsl(186, 91%, 50%)",
  "hsl(200, 95%, 50%)",
  "hsl(262, 83%, 45%)",
];
const DEFAULT_DAILY_REWARDS = [10, 15, 25, 35, 50, 75, 150];

type GameTab = "config" | "daily" | "spin" | "box";

type PrizeType = "spin" | "box";

interface Prize {
  id: string;
  label: string;
  value: number;
  weight: number;
  emoji: string | null;
  image_url: string | null;
  sound_url: string | null;
  animation_url: string | null;
  is_active: boolean;
  color?: string;
  rarity?: string;
}

const parseDailyRewards = (value: unknown): number[] => {
  if (Array.isArray(value)) {
    const parsed = value
      .map((v) => Number(v))
      .filter((n) => Number.isFinite(n) && n >= 0)
      .slice(0, 7);

    if (parsed.length === 7) return parsed;
  }

  if (typeof value === "string") {
    const parsed = value
      .split(",")
      .map((v) => Number(v.trim()))
      .filter((n) => Number.isFinite(n) && n >= 0)
      .slice(0, 7);

    if (parsed.length === 7) return parsed;
  }

  return DEFAULT_DAILY_REWARDS;
};

const GameSettings = () => {
  const [activeTab, setActiveTab] = useState<GameTab>("config");
  const [spinPrizes, setSpinPrizes] = useState<Prize[]>([]);
  const [boxPrizes, setBoxPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState<{ type: PrizeType; prize: Prize | null } | null>(null);
  const [uploading, setUploading] = useState(false);

  const [dailySpinLimit, setDailySpinLimit] = useState("3");
  const [dailyBoxLimit, setDailyBoxLimit] = useState("5");
  const [boxUnlockMethod, setBoxUnlockMethod] = useState("both");
  const [boxTasksRequired, setBoxTasksRequired] = useState("3");

  const [dailyBonusEnabled, setDailyBonusEnabled] = useState(true);
  const [dailyBonusRewards, setDailyBonusRewards] = useState<number[]>(DEFAULT_DAILY_REWARDS);

  const [form, setForm] = useState({
    label: "",
    value: 0,
    weight: 10,
    emoji: "🪙",
    color: COLOR_PRESETS[0],
    rarity: "Common",
    image_url: "",
    sound_url: "",
    animation_url: "",
  });

  const imageInputRef = useRef<HTMLInputElement>(null);
  const soundInputRef = useRef<HTMLInputElement>(null);
  const animInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);

    const [{ data: spinData, error: spinError }, { data: boxData, error: boxError }, { data: settingsData, error: settingsError }] =
      await Promise.all([
        supabase.from("spin_prizes").select("*").order("sort_order"),
        supabase.from("box_prizes").select("*").order("created_at"),
        supabase
          .from("app_settings")
          .select("key, value")
          .in("key", [
            "daily_spin_limit",
            "daily_box_limit",
            "box_unlock_method",
            "box_tasks_required",
            "daily_bonus_enabled",
            "daily_bonus_rewards",
          ]),
      ]);

    if (spinError || boxError || settingsError) {
      toast.error(spinError?.message || boxError?.message || settingsError?.message || "Failed to load settings");
      setLoading(false);
      return;
    }

    setSpinPrizes((spinData as Prize[]) || []);
    setBoxPrizes((boxData as Prize[]) || []);

    if (settingsData) {
      const settings = Object.fromEntries(settingsData.map((row: any) => [row.key, row.value]));

      if (settings.daily_spin_limit !== undefined) setDailySpinLimit(String(settings.daily_spin_limit));
      if (settings.daily_box_limit !== undefined) setDailyBoxLimit(String(settings.daily_box_limit));
      if (settings.box_unlock_method !== undefined) setBoxUnlockMethod(String(settings.box_unlock_method));
      if (settings.box_tasks_required !== undefined) setBoxTasksRequired(String(settings.box_tasks_required));
      if (settings.daily_bonus_enabled !== undefined) {
        setDailyBonusEnabled(settings.daily_bonus_enabled === true || settings.daily_bonus_enabled === "true");
      }
      if (settings.daily_bonus_rewards !== undefined) {
        setDailyBonusRewards(parseDailyRewards(settings.daily_bonus_rewards));
      }
    }

    setLoading(false);
  };

  const saveSetting = async (key: string, value: unknown, successMessage?: string) => {
    const { data: existing, error: fetchError } = await supabase
      .from("app_settings")
      .select("id")
      .eq("key", key)
      .maybeSingle();

    if (fetchError) {
      toast.error(fetchError.message);
      return false;
    }

    const operation = existing
      ? supabase.from("app_settings").update({ value }).eq("key", key)
      : supabase.from("app_settings").insert({ key, value: value as any });

    const { error } = await operation;
    if (error) {
      toast.error(error.message);
      return false;
    }

    toast.success(successMessage || "Saved");
    return true;
  };

  const saveDailyRewards = async () => {
    const isValid = dailyBonusRewards.length === 7 && dailyBonusRewards.every((n) => Number.isFinite(n) && n >= 0);
    if (!isValid) {
      toast.error("Daily rewards must be 7 valid numbers");
      return;
    }

    await saveSetting("daily_bonus_rewards", dailyBonusRewards.join(","), "Daily rewards updated");
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    setUploading(true);

    const extension = file.name.split(".").pop() || "file";
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

    const { error } = await supabase.storage.from("prize-media").upload(path, file);
    setUploading(false);

    if (error) {
      toast.error(error.message || "Upload failed");
      return null;
    }

    const { data } = supabase.storage.from("prize-media").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleFileUpload = async (file: File, type: "image" | "sound" | "animation") => {
    const folder = type === "image" ? "images" : type === "sound" ? "sounds" : "animations";
    const uploadedUrl = await uploadFile(file, folder);

    if (!uploadedUrl) return;

    const key = type === "image" ? "image_url" : type === "sound" ? "sound_url" : "animation_url";
    setForm((prev) => ({ ...prev, [key]: uploadedUrl }));
  };

  const openEditModal = (type: PrizeType, prize: Prize | null) => {
    if (prize) {
      setForm({
        label: prize.label,
        value: Number(prize.value),
        weight: Number(prize.weight),
        emoji: prize.emoji || "🪙",
        color: prize.color || COLOR_PRESETS[0],
        rarity: prize.rarity || "Common",
        image_url: prize.image_url || "",
        sound_url: prize.sound_url || "",
        animation_url: prize.animation_url || "",
      });
    } else {
      setForm({
        label: "",
        value: 0,
        weight: 10,
        emoji: "🪙",
        color: COLOR_PRESETS[0],
        rarity: "Common",
        image_url: "",
        sound_url: "",
        animation_url: "",
      });
    }

    setEditModal({ type, prize });
  };

  const savePrize = async () => {
    if (!editModal) return;
    if (!form.label.trim()) {
      toast.error("Prize name is required");
      return;
    }

    const isSpin = editModal.type === "spin";
    const table = isSpin ? "spin_prizes" : "box_prizes";

    const payload: Record<string, unknown> = {
      label: form.label.trim(),
      value: Number(form.value) || 0,
      weight: Number(form.weight) || 1,
      emoji: form.emoji || null,
      image_url: form.image_url || null,
      sound_url: form.sound_url || null,
      animation_url: form.animation_url || null,
      is_active: true,
    };

    if (isSpin) {
      payload.color = form.color;
      if (!editModal.prize) payload.sort_order = spinPrizes.length;
    } else {
      payload.rarity = form.rarity;
    }

    if (editModal.prize) {
      const { error } = await supabase.from(table).update(payload).eq("id", editModal.prize.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Prize updated");
    } else {
      const { error } = await supabase.from(table).insert(payload as any);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Prize created");
    }

    setEditModal(null);
    fetchAll();
  };

  const deletePrize = async (type: PrizeType, id: string) => {
    const table = type === "spin" ? "spin_prizes" : "box_prizes";
    const { error } = await supabase.from(table).delete().eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Prize deleted");
    fetchAll();
  };

  const togglePrize = async (type: PrizeType, id: string, active: boolean) => {
    const table = type === "spin" ? "spin_prizes" : "box_prizes";
    const { error } = await supabase.from(table).update({ is_active: active }).eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    fetchAll();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[
          { id: "config" as const, label: "Game Config", icon: Settings },
          { id: "daily" as const, label: "Daily Gift", icon: Gift },
          { id: "spin" as const, label: "Spin Prizes", icon: Star },
          { id: "box" as const, label: "Box Prizes", icon: Box },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === tab.id ? "gradient-primary text-white" : "glass text-muted-foreground"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "config" && (
        <div className="space-y-4">
          <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" /> Spin Wheel Settings
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Daily Spin Limit</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={dailySpinLimit}
                  onChange={(e) => setDailySpinLimit(e.target.value)}
                  className="w-20 h-8 text-xs bg-secondary/50 text-right"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => saveSetting("daily_spin_limit", Number(dailySpinLimit || 0), "Spin limit saved")}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Box className="h-4 w-4 text-warning" /> Mystery Box Settings
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Daily Box Limit</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={dailyBoxLimit}
                    onChange={(e) => setDailyBoxLimit(e.target.value)}
                    className="w-20 h-8 text-xs bg-secondary/50 text-right"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => saveSetting("daily_box_limit", Number(dailyBoxLimit || 0), "Box limit saved")}
                  >
                    Save
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground">Unlock Method</span>
                  <p className="text-[10px] text-muted-foreground">How users unlock mystery boxes</p>
                </div>
                <select
                  value={boxUnlockMethod}
                  onChange={(e) => {
                    const value = e.target.value;
                    setBoxUnlockMethod(value);
                    saveSetting("box_unlock_method", value, "Unlock method saved");
                  }}
                  className="bg-secondary/50 border border-border rounded-md px-2 h-8 text-xs text-foreground"
                >
                  <option value="task">Complete Tasks</option>
                  <option value="ad">Watch Ad</option>
                  <option value="both">Both Options</option>
                </select>
              </div>

              {(boxUnlockMethod === "task" || boxUnlockMethod === "both") && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Tasks Required</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={boxTasksRequired}
                      onChange={(e) => setBoxTasksRequired(e.target.value)}
                      className="w-20 h-8 text-xs bg-secondary/50 text-right"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => saveSetting("box_tasks_required", Number(boxTasksRequired || 0), "Tasks requirement saved")}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "daily" && (
        <div className="space-y-4">
          <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Gift className="h-4 w-4 text-earn" /> Daily Gift Controls
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground">Enable Daily Gift</span>
                  <p className="text-[10px] text-muted-foreground">Turn daily bonus on/off completely</p>
                </div>
                <Switch
                  checked={dailyBonusEnabled}
                  onCheckedChange={(checked) => {
                    setDailyBonusEnabled(checked);
                    saveSetting("daily_bonus_enabled", checked, "Daily gift status saved");
                  }}
                />
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">Reward for each day (Day 1 → Day 7)</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {dailyBonusRewards.map((reward, index) => (
                    <div key={index} className="glass rounded-lg p-2">
                      <label className="text-[10px] text-muted-foreground">Day {index + 1}</label>
                      <Input
                        type="number"
                        value={reward}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          setDailyBonusRewards((prev) => {
                            const next = [...prev];
                            next[index] = Number.isFinite(value) ? Math.max(0, value) : 0;
                            return next;
                          });
                        }}
                        className="h-8 mt-1 text-xs bg-secondary/50"
                      />
                    </div>
                  ))}
                </div>

                <Button onClick={saveDailyRewards} className="w-full mt-3 gradient-earn text-white border-0">
                  Save Daily Rewards
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "spin" && (
        <div className="space-y-3">
          <Button onClick={() => openEditModal("spin", null)} className="w-full gradient-primary text-white border-0 gap-2">
            <Plus className="h-4 w-4" /> Add Spin Prize
          </Button>

          {spinPrizes.map((prize) => (
            <div key={prize.id} className="glass rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: prize.color }}>
                {prize.image_url ? (
                  <img src={prize.image_url} alt={prize.label} className="w-8 h-8 rounded object-cover" />
                ) : (
                  <span className="text-lg">{prize.emoji}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{prize.label}</p>
                  {!prize.is_active && <Badge className="text-[9px] bg-destructive/20 text-destructive border-0">Off</Badge>}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[10px] text-earn">+{prize.value} coins</span>
                  <span className="text-[10px] text-muted-foreground">Weight: {prize.weight}</span>
                  {prize.sound_url && <Volume2 className="h-3 w-3 text-muted-foreground" />}
                  {prize.image_url && <Image className="h-3 w-3 text-muted-foreground" />}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Switch checked={prize.is_active} onCheckedChange={(value) => togglePrize("spin", prize.id, value)} />
                <button
                  onClick={() => openEditModal("spin", prize)}
                  className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => deletePrize("spin", prize.id)}
                  className="p-1.5 rounded-lg hover:bg-secondary/50 text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {spinPrizes.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No spin prizes yet. Add your first one.</p>
          )}
        </div>
      )}

      {activeTab === "box" && (
        <div className="space-y-3">
          <Button onClick={() => openEditModal("box", null)} className="w-full gradient-warning text-white border-0 gap-2">
            <Plus className="h-4 w-4" /> Add Box Prize
          </Button>

          {boxPrizes.map((prize) => (
            <div key={prize.id} className="glass rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                {prize.image_url ? (
                  <img src={prize.image_url} alt={prize.label} className="w-8 h-8 rounded object-cover" />
                ) : (
                  <span className="text-lg">{prize.emoji}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{prize.label}</p>
                  <Badge
                    className={`text-[9px] px-1.5 py-0 h-4 border-0 ${
                      prize.rarity === "Legendary"
                        ? "bg-warning/20 text-warning"
                        : prize.rarity === "Epic"
                        ? "bg-primary/20 text-primary"
                        : prize.rarity === "Rare"
                        ? "bg-accent/20 text-accent"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {prize.rarity}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[10px] text-earn">+{prize.value} coins</span>
                  <span className="text-[10px] text-muted-foreground">Weight: {prize.weight}</span>
                  {prize.sound_url && <Volume2 className="h-3 w-3 text-muted-foreground" />}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Switch checked={prize.is_active} onCheckedChange={(value) => togglePrize("box", prize.id, value)} />
                <button
                  onClick={() => openEditModal("box", prize)}
                  className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => deletePrize("box", prize.id)}
                  className="p-1.5 rounded-lg hover:bg-secondary/50 text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {boxPrizes.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No box prizes yet. Add your first one.</p>
          )}
        </div>
      )}

      <Dialog open={!!editModal} onOpenChange={() => setEditModal(null)}>
        <DialogContent className="glass border-border max-w-[420px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground font-display">
              {editModal?.prize ? "Edit Prize" : "Add Prize"} ({editModal?.type === "spin" ? "Spin" : "Box"})
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">Configure prize details and media</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              placeholder="Prize label (e.g. 50 Coins)"
              value={form.label}
              onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
              className="bg-secondary/50"
            />

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground">Value</label>
                <Input
                  type="number"
                  value={form.value}
                  onChange={(e) => setForm((prev) => ({ ...prev, value: Number(e.target.value) }))}
                  className="bg-secondary/50"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Weight</label>
                <Input
                  type="number"
                  value={form.weight}
                  onChange={(e) => setForm((prev) => ({ ...prev, weight: Number(e.target.value) }))}
                  className="bg-secondary/50"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Emoji</label>
                <Input
                  value={form.emoji}
                  onChange={(e) => setForm((prev) => ({ ...prev, emoji: e.target.value }))}
                  className="bg-secondary/50"
                />
              </div>
            </div>

            {editModal?.type === "spin" && (
              <div>
                <label className="text-[10px] text-muted-foreground">Color</label>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setForm((prev) => ({ ...prev, color }))}
                      className={`w-7 h-7 rounded-md border-2 ${form.color === color ? "border-white" : "border-transparent"}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}

            {editModal?.type === "box" && (
              <div>
                <label className="text-[10px] text-muted-foreground">Rarity</label>
                <select
                  value={form.rarity}
                  onChange={(e) => setForm((prev) => ({ ...prev, rarity: e.target.value }))}
                  className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm text-foreground mt-1"
                >
                  {RARITY_OPTIONS.map((rarity) => (
                    <option key={rarity} value={rarity}>
                      {rarity}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Media (optional)
              </p>

              <div className="glass rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Image className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Prize Image</span>
                  </div>
                  {form.image_url ? (
                    <div className="flex items-center gap-2">
                      <img src={form.image_url} alt="Prize" className="w-8 h-8 rounded object-cover" />
                      <button
                        onClick={() => setForm((prev) => ({ ...prev, image_url: "" }))}
                        className="text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => imageInputRef.current?.click()}>
                      <Upload className="h-3 w-3" /> Upload
                    </Button>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Sound Effect</span>
                  </div>
                  {form.sound_url ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-earn">✓ Uploaded</span>
                      <button
                        onClick={() => setForm((prev) => ({ ...prev, sound_url: "" }))}
                        className="text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => soundInputRef.current?.click()}>
                      <Upload className="h-3 w-3" /> Upload
                    </Button>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Animation (GIF/Lottie)</span>
                  </div>
                  {form.animation_url ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-earn">✓ Uploaded</span>
                      <button
                        onClick={() => setForm((prev) => ({ ...prev, animation_url: "" }))}
                        className="text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => animInputRef.current?.click()}>
                      <Upload className="h-3 w-3" /> Upload
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "image")}
            />
            <input
              ref={soundInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "sound")}
            />
            <input
              ref={animInputRef}
              type="file"
              accept="image/gif,.json"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "animation")}
            />

            <Button onClick={savePrize} disabled={uploading} className="w-full gradient-primary text-white border-0 gap-2">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : editModal?.prize ? "Save Changes" : "Create Prize"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GameSettings;
