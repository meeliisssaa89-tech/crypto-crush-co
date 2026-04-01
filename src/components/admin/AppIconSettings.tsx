import { useState, useEffect, useRef } from "react";
import { Image, Save, Loader2, Upload, X, Trash2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface IconEntry {
  key: string;
  label: string;
  url: string;
  type: "image" | "gif" | "lottie";
}

const defaultIcons: IconEntry[] = [
  { key: "home_hero", label: "Home Hero", url: "", type: "image" },
  { key: "earn_header", label: "Earn Header", url: "", type: "image" },
  { key: "airdrop_header", label: "Airdrop Header", url: "", type: "image" },
  { key: "wallet_header", label: "Wallet Header", url: "", type: "image" },
  { key: "profile_header", label: "Profile Header", url: "", type: "image" },
  { key: "spin_wheel", label: "Spin Wheel Icon", url: "", type: "gif" },
  { key: "mystery_box", label: "Mystery Box Icon", url: "", type: "gif" },
  { key: "daily_bonus", label: "Daily Bonus Icon", url: "", type: "gif" },
  { key: "referral_banner", label: "Referral Banner", url: "", type: "image" },
  { key: "ton_logo", label: "TON Coin Logo", url: "", type: "image" },
];

const AppIconSettings = () => {
  const [icons, setIcons] = useState<IconEntry[]>(defaultIcons);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => { fetchIcons(); }, []);

  const fetchIcons = async () => {
    setLoading(true);
    const { data } = await supabase.from("app_settings").select("value").eq("key", "app_icons").maybeSingle();
    if (data?.value && Array.isArray(data.value)) {
      const saved = data.value as IconEntry[];
      // Merge with defaults
      const merged = defaultIcons.map(d => {
        const found = saved.find(s => s.key === d.key);
        return found ? { ...d, ...found } : d;
      });
      // Add any custom ones
      const customKeys = saved.filter(s => !defaultIcons.find(d => d.key === s.key));
      setIcons([...merged, ...customKeys]);
    }
    setLoading(false);
  };

  const saveIcons = async () => {
    setSaving(true);
    const { error } = await supabase.from("app_settings").upsert(
      { key: "app_icons", value: icons as any },
      { onConflict: "key" }
    );
    if (error) toast.error(error.message);
    else toast.success("App icons saved!");
    setSaving(false);
  };

  const uploadFile = async (key: string, file: File) => {
    setUploading(key);
    const ext = file.name.split(".").pop();
    const path = `app-icons/${key}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("prize-media").upload(path, file, { cacheControl: "3600", upsert: true });
    if (error) { toast.error("Upload failed: " + error.message); setUploading(null); return; }
    const { data: urlData } = supabase.storage.from("prize-media").getPublicUrl(path);
    setIcons(prev => prev.map(i => i.key === key ? { ...i, url: urlData.publicUrl } : i));
    toast.success("Uploaded!");
    setUploading(null);
  };

  const updateIcon = (key: string, field: keyof IconEntry, value: string) => {
    setIcons(prev => prev.map(i => i.key === key ? { ...i, [field]: value } : i));
  };

  const removeIcon = (key: string) => {
    setIcons(prev => prev.map(i => i.key === key ? { ...i, url: "" } : i));
  };

  const addCustomIcon = () => {
    const key = `custom_${Date.now()}`;
    setIcons(prev => [...prev, { key, label: "Custom Icon", url: "", type: "image" }]);
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="glass rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
          <Image className="h-4 w-4 text-primary" />
          App Icons & Animations
        </h3>
        <p className="text-[10px] text-muted-foreground mb-4">
          Set icons, GIFs, or Telegram animations for each section. Supports images, GIFs, and Lottie/TGS URLs.
        </p>

        <div className="space-y-3">
          {icons.map((icon) => (
            <div key={icon.key} className="glass rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {icon.url ? (
                    <img src={icon.url} alt={icon.label} className="w-8 h-8 rounded-lg object-cover border border-border" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center">
                      <Image className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <Input
                      value={icon.label}
                      onChange={(e) => updateIcon(icon.key, "label", e.target.value)}
                      className="h-6 text-xs bg-transparent border-0 p-0 font-medium text-foreground"
                    />
                    <p className="text-[9px] text-muted-foreground">{icon.key}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <select
                    value={icon.type}
                    onChange={(e) => updateIcon(icon.key, "type", e.target.value)}
                    className="h-6 text-[10px] bg-secondary/50 border border-border rounded px-1 text-foreground"
                  >
                    <option value="image">Image</option>
                    <option value="gif">GIF/Animation</option>
                    <option value="lottie">Lottie/TGS</option>
                  </select>
                  {icon.url && (
                    <button onClick={() => removeIcon(icon.key)} className="p-1 rounded hover:bg-secondary/50 text-destructive">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="URL (paste link or upload)"
                  value={icon.url}
                  onChange={(e) => updateIcon(icon.key, "url", e.target.value)}
                  className="bg-secondary/50 text-xs flex-1 h-8"
                />
                <button
                  onClick={() => fileRefs.current[icon.key]?.click()}
                  disabled={uploading === icon.key}
                  className="px-2 h-8 rounded-md bg-secondary/50 border border-border text-muted-foreground hover:text-foreground text-xs flex items-center gap-1"
                >
                  {uploading === icon.key ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                </button>
                <input
                  ref={el => { fileRefs.current[icon.key] = el; }}
                  type="file"
                  accept="image/*,.gif,.webp,.tgs,.json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadFile(icon.key, file);
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <Button onClick={addCustomIcon} variant="outline" className="w-full mt-3 gap-2 text-xs">
          <Plus className="h-3.5 w-3.5" /> Add Custom Icon Slot
        </Button>
      </div>

      <Button onClick={saveIcons} disabled={saving} className="w-full gradient-primary text-white border-0 gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save Icon Settings
      </Button>
    </div>
  );
};

export default AppIconSettings;
