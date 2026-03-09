import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Star, Box, Plus, Trash2, Edit3, Loader2, Upload, Image, Volume2, Sparkles, Settings
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const RARITY_OPTIONS = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];
const COLOR_PRESETS = [
  "hsl(262, 83%, 58%)", "hsl(217, 91%, 60%)", "hsl(160, 84%, 39%)",
  "hsl(38, 92%, 50%)", "hsl(0, 72%, 51%)", "hsl(186, 91%, 50%)",
  "hsl(200, 95%, 50%)", "hsl(262, 83%, 45%)"
];

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
  [key: string]: any;
}

const GameSettings = () => {
  const [activeTab, setActiveTab] = useState<"spin" | "box" | "config">("config");
  const [spinPrizes, setSpinPrizes] = useState<Prize[]>([]);
  const [boxPrizes, setBoxPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState<{ type: "spin" | "box"; prize: Prize | null } | null>(null);
  const [uploading, setUploading] = useState(false);

  // Settings
  const [dailySpinLimit, setDailySpinLimit] = useState("3");
  const [dailyBoxLimit, setDailyBoxLimit] = useState("5");
  const [boxUnlockMethod, setBoxUnlockMethod] = useState("both");
  const [boxTasksRequired, setBoxTasksRequired] = useState("3");
  const [dailyBonusEnabled, setDailyBonusEnabled] = useState(true);
  const [dailyBonusRewards, setDailyBonusRewards] = useState("10,15,25,35,50,75,150");

  // Form state for new/edit prize
  const [form, setForm] = useState({
    label: "", value: 0, weight: 10, emoji: "🪙",
    color: COLOR_PRESETS[0], rarity: "Common",
    image_url: "", sound_url: "", animation_url: "",
  });

  const imageInputRef = useRef<HTMLInputElement>(null);
  const soundInputRef = useRef<HTMLInputElement>(null);
  const animInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: sp }, { data: bp }, { data: settings }] = await Promise.all([
      supabase.from("spin_prizes").select("*").order("sort_order"),
      supabase.from("box_prizes").select("*").order("created_at"),
      supabase.from("app_settings").select("key, value").in("key", [
        "daily_spin_limit", "daily_box_limit", "box_unlock_method", "box_tasks_required"
      ]),
    ]);
    if (sp) setSpinPrizes(sp);
    if (bp) setBoxPrizes(bp);
    if (settings) {
      const s = Object.fromEntries(settings.map((r: any) => [r.key, r.value]));
      if (s.daily_spin_limit) setDailySpinLimit(String(s.daily_spin_limit));
      if (s.daily_box_limit) setDailyBoxLimit(String(s.daily_box_limit));
      if (s.box_unlock_method) setBoxUnlockMethod(String(s.box_unlock_method));
      if (s.box_tasks_required) setBoxTasksRequired(String(s.box_tasks_required));
    }
    setLoading(false);
  };

  const saveSetting = async (key: string, value: any) => {
    await supabase.from("app_settings").upsert({ key, value }, { onConflict: "key" });
    toast.success(`${key} saved!`);
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("prize-media").upload(path, file);
    setUploading(false);
    if (error) { toast.error("Upload failed"); return null; }
    const { data } = supabase.storage.from("prize-media").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleFileUpload = async (file: File, type: "image" | "sound" | "animation") => {
    const url = await uploadFile(file, type === "image" ? "images" : type === "sound" ? "sounds" : "animations");
    if (url) {
      const key = type === "image" ? "image_url" : type === "sound" ? "sound_url" : "animation_url";
      setForm(prev => ({ ...prev, [key]: url }));
    }
  };

  const openEditModal = (type: "spin" | "box", prize: Prize | null) => {
    if (prize) {
      setForm({
        label: prize.label,
        value: Number(prize.value),
        weight: prize.weight,
        emoji: prize.emoji || "🪙",
        color: prize.color || COLOR_PRESETS[0],
        rarity: prize.rarity || "Common",
        image_url: prize.image_url || "",
        sound_url: prize.sound_url || "",
        animation_url: prize.animation_url || "",
      });
    } else {
      setForm({ label: "", value: 0, weight: 10, emoji: "🪙", color: COLOR_PRESETS[0], rarity: "Common", image_url: "", sound_url: "", animation_url: "" });
    }
    setEditModal({ type, prize });
  };

  const savePrize = async () => {
    if (!editModal || !form.label.trim()) { toast.error("Label required"); return; }
    const table = editModal.type === "spin" ? "spin_prizes" : "box_prizes";

    const payload: any = {
      label: form.label,
      value: form.value,
      weight: form.weight,
      emoji: form.emoji || null,
      image_url: form.image_url || null,
      sound_url: form.sound_url || null,
      animation_url: form.animation_url || null,
      is_active: true,
    };

    if (editModal.type === "spin") {
      payload.color = form.color;
      payload.sort_order = spinPrizes.length;
    } else {
      payload.rarity = form.rarity;
    }

    if (editModal.prize) {
      const { error } = await supabase.from(table).update(payload).eq("id", editModal.prize.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Prize updated!");
    } else {
      const { error } = await supabase.from(table).insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Prize created!");
    }

    setEditModal(null);
    fetchAll();
  };

  const deletePrize = async (type: "spin" | "box", id: string) => {
    const table = type === "spin" ? "spin_prizes" : "box_prizes";
    await supabase.from(table).delete().eq("id", id);
    toast.success("Prize deleted!");
    fetchAll();
  };

  const togglePrize = async (type: "spin" | "box", id: string, active: boolean) => {
    const table = type === "spin" ? "spin_prizes" : "box_prizes";
    await supabase.from(table).update({ is_active: active }).eq("id", id);
    fetchAll();
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        {[
          { id: "config" as const, label: "Game Config", icon: Settings },
          { id: "spin" as const, label: "Spin Prizes", icon: Star },
          { id: "box" as const, label: "Box Prizes", icon: Box },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === t.id ? "gradient-primary text-white" : "glass text-muted-foreground"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Game Config */}
      {activeTab === "config" && (
        <div className="space-y-4">
          <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" /> Spin Wheel Settings
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Daily Spin Limit</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={dailySpinLimit}
                    onChange={e => setDailySpinLimit(e.target.value)}
                    className="w-20 h-8 text-xs bg-secondary/50 text-right"
                  />
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => saveSetting("daily_spin_limit", Number(dailySpinLimit))}>Save</Button>
                </div>
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
                    onChange={e => setDailyBoxLimit(e.target.value)}
                    className="w-20 h-8 text-xs bg-secondary/50 text-right"
                  />
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => saveSetting("daily_box_limit", Number(dailyBoxLimit))}>Save</Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground">Unlock Method</span>
                  <p className="text-[10px] text-muted-foreground">How users unlock mystery boxes</p>
                </div>
                <select
                  value={boxUnlockMethod}
                  onChange={e => { setBoxUnlockMethod(e.target.value); saveSetting("box_unlock_method", e.target.value); }}
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
                      onChange={e => setBoxTasksRequired(e.target.value)}
                      className="w-20 h-8 text-xs bg-secondary/50 text-right"
                    />
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => saveSetting("box_tasks_required", Number(boxTasksRequired))}>Save</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Spin Prizes */}
      {activeTab === "spin" && (
        <div className="space-y-3">
          <Button onClick={() => openEditModal("spin", null)} className="w-full gradient-primary text-white border-0 gap-2">
            <Plus className="h-4 w-4" /> Add Spin Prize
          </Button>
          {spinPrizes.map(p => (
            <div key={p.id} className="glass rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: p.color }}>
                {p.image_url ? <img src={p.image_url} alt="" className="w-8 h-8 rounded object-cover" /> : <span className="text-lg">{p.emoji}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{p.label}</p>
                  {!p.is_active && <Badge className="text-[9px] bg-destructive/20 text-destructive border-0">Off</Badge>}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[10px] text-earn">+{p.value} coins</span>
                  <span className="text-[10px] text-muted-foreground">Weight: {p.weight}</span>
                  {p.sound_url && <Volume2 className="h-3 w-3 text-muted-foreground" />}
                  {p.image_url && <Image className="h-3 w-3 text-muted-foreground" />}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Switch checked={p.is_active} onCheckedChange={v => togglePrize("spin", p.id, v)} />
                <button onClick={() => openEditModal("spin", p)} className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground"><Edit3 className="h-3.5 w-3.5" /></button>
                <button onClick={() => deletePrize("spin", p.id)} className="p-1.5 rounded-lg hover:bg-secondary/50 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
          {spinPrizes.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No spin prizes yet. Add some above!</p>}
        </div>
      )}

      {/* Box Prizes */}
      {activeTab === "box" && (
        <div className="space-y-3">
          <Button onClick={() => openEditModal("box", null)} className="w-full gradient-warning text-white border-0 gap-2">
            <Plus className="h-4 w-4" /> Add Box Prize
          </Button>
          {boxPrizes.map(p => (
            <div key={p.id} className="glass rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                {p.image_url ? <img src={p.image_url} alt="" className="w-8 h-8 rounded object-cover" /> : <span className="text-lg">{p.emoji}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{p.label}</p>
                  <Badge className={`text-[9px] px-1.5 py-0 h-4 border-0 ${
                    p.rarity === "Legendary" ? "bg-warning/20 text-warning" :
                    p.rarity === "Epic" ? "bg-primary/20 text-primary" :
                    p.rarity === "Rare" ? "bg-accent/20 text-accent" :
                    "bg-muted text-muted-foreground"
                  }`}>{p.rarity}</Badge>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[10px] text-earn">+{p.value} coins</span>
                  <span className="text-[10px] text-muted-foreground">Weight: {p.weight}</span>
                  {p.sound_url && <Volume2 className="h-3 w-3 text-muted-foreground" />}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Switch checked={p.is_active} onCheckedChange={v => togglePrize("box", p.id, v)} />
                <button onClick={() => openEditModal("box", p)} className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground"><Edit3 className="h-3.5 w-3.5" /></button>
                <button onClick={() => deletePrize("box", p.id)} className="p-1.5 rounded-lg hover:bg-secondary/50 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
          {boxPrizes.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No box prizes yet. Add some above!</p>}
        </div>
      )}

      {/* Edit/Create Prize Modal */}
      <Dialog open={!!editModal} onOpenChange={() => setEditModal(null)}>
        <DialogContent className="glass border-border max-w-[420px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground font-display">
              {editModal?.prize ? "Edit Prize" : "Add Prize"} ({editModal?.type === "spin" ? "Spin" : "Box"})
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">Configure prize details and media</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Prize label (e.g. '50 Coins')" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} className="bg-secondary/50" />
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground">Value</label>
                <Input type="number" value={form.value} onChange={e => setForm({ ...form, value: Number(e.target.value) })} className="bg-secondary/50" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Weight</label>
                <Input type="number" value={form.weight} onChange={e => setForm({ ...form, weight: Number(e.target.value) })} className="bg-secondary/50" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Emoji</label>
                <Input value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value })} className="bg-secondary/50" />
              </div>
            </div>

            {editModal?.type === "spin" && (
              <div>
                <label className="text-[10px] text-muted-foreground">Color</label>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  {COLOR_PRESETS.map(c => (
                    <button
                      key={c}
                      onClick={() => setForm({ ...form, color: c })}
                      className={`w-7 h-7 rounded-md border-2 ${form.color === c ? "border-white" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            )}

            {editModal?.type === "box" && (
              <div>
                <label className="text-[10px] text-muted-foreground">Rarity</label>
                <select value={form.rarity} onChange={e => setForm({ ...form, rarity: e.target.value })} className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm text-foreground mt-1">
                  {RARITY_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            )}

            {/* Media uploads */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1"><Sparkles className="h-3.5 w-3.5 text-primary" /> Media (optional)</p>

              <div className="glass rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Image className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Prize Image</span>
                  </div>
                  {form.image_url ? (
                    <div className="flex items-center gap-2">
                      <img src={form.image_url} alt="" className="w-8 h-8 rounded object-cover" />
                      <button onClick={() => setForm({ ...form, image_url: "" })} className="text-destructive"><Trash2 className="h-3 w-3" /></button>
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
                      <button onClick={() => setForm({ ...form, sound_url: "" })} className="text-destructive"><Trash2 className="h-3 w-3" /></button>
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
                      <button onClick={() => setForm({ ...form, animation_url: "" })} className="text-destructive"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => animInputRef.current?.click()}>
                      <Upload className="h-3 w-3" /> Upload
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Hidden file inputs */}
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], "image")} />
            <input ref={soundInputRef} type="file" accept="audio/*" className="hidden" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], "sound")} />
            <input ref={animInputRef} type="file" accept="image/gif,.json" className="hidden" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], "animation")} />

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
