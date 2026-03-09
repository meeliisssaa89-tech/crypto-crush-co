import { useState, useEffect, useRef } from "react";
import {
  TrendingUp, DollarSign, Image, Save, Loader2, Upload, X, Eye
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const defaultTickerConfig = {
  ticker_enabled: true,
  points_usd_rate: 0.001,
  token_ticker_enabled: true,
  token_usd_rate: 0.01,
  token_image_url: "",
};

const TickerSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [config, setConfig] = useState(defaultTickerConfig);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    const { data } = await supabase.from("app_settings").select("*").eq("key", "ticker_config").single();
    if (data?.value && typeof data.value === "object") {
      setConfig(prev => ({ ...prev, ...(data.value as any) }));
    }
    setLoading(false);
  };

  const saveConfig = async () => {
    setSaving(true);
    const { error } = await supabase.from("app_settings").upsert(
      { key: "ticker_config", value: config as any },
      { onConflict: "key" }
    );
    if (error) toast.error(error.message);
    else toast.success("Ticker settings saved!");
    setSaving(false);
  };

  const uploadTokenImage = async (file: File) => {
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `token-images/token-${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("prize-media").upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    });

    if (error) {
      toast.error("Upload failed: " + error.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("prize-media").getPublicUrl(path);
    setConfig({ ...config, token_image_url: urlData.publicUrl });
    toast.success("Token image uploaded!");
    setUploading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Points Ticker */}
      <div className="glass rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          Points Price Ticker (Home)
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-foreground">Enable Ticker</p>
              <p className="text-[10px] text-muted-foreground">Show price ribbon on home card</p>
            </div>
            <Switch
              checked={config.ticker_enabled}
              onCheckedChange={(v) => setConfig({ ...config, ticker_enabled: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-foreground">1 XP = USD</p>
              <p className="text-[10px] text-muted-foreground">Exchange rate for display</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">$</span>
              <Input
                type="number"
                step={0.0001}
                min={0}
                value={config.points_usd_rate}
                onChange={(e) => setConfig({ ...config, points_usd_rate: Number(e.target.value) })}
                className="w-24 h-8 text-xs bg-secondary/50 text-right"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Token Ticker */}
      <div className="glass rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-earn" />
          Token Price Ticker (Airdrop)
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-foreground">Enable Token Ticker</p>
              <p className="text-[10px] text-muted-foreground">Show price ribbon on airdrop card</p>
            </div>
            <Switch
              checked={config.token_ticker_enabled}
              onCheckedChange={(v) => setConfig({ ...config, token_ticker_enabled: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-foreground">1 Token = USD</p>
              <p className="text-[10px] text-muted-foreground">Token exchange rate for display</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">$</span>
              <Input
                type="number"
                step={0.0001}
                min={0}
                value={config.token_usd_rate}
                onChange={(e) => setConfig({ ...config, token_usd_rate: Number(e.target.value) })}
                className="w-24 h-8 text-xs bg-secondary/50 text-right"
              />
            </div>
          </div>

          {/* Token Image Upload */}
          <div>
            <p className="text-xs text-foreground mb-2">Token Image</p>
            <p className="text-[10px] text-muted-foreground mb-2">Upload coin/token logo to display on airdrop card</p>

            {config.token_image_url ? (
              <div className="flex items-center gap-3 bg-secondary/30 rounded-lg p-3">
                <img src={config.token_image_url} alt="Token" className="w-12 h-12 rounded-full object-cover border-2 border-border shadow-md" />
                <div className="flex-1">
                  <p className="text-xs text-foreground font-medium">Token image uploaded</p>
                  <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{config.token_image_url.split("/").pop()}</p>
                </div>
                <button
                  onClick={() => setConfig({ ...config, token_image_url: "" })}
                  className="p-1.5 rounded-lg hover:bg-secondary/50 text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center gap-2 hover:bg-secondary/30 transition-colors"
              >
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                  <Upload className="h-6 w-6 text-muted-foreground" />
                )}
                <span className="text-xs text-muted-foreground">
                  {uploading ? "Uploading..." : "Click to upload token image"}
                </span>
              </button>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadTokenImage(file);
              }}
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="glass rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          Preview
        </h3>
        <div className="gradient-primary rounded-xl p-4 relative overflow-hidden">
          {config.ticker_enabled && (
            <div className="absolute top-0 left-0 z-10">
              <div
                className="bg-white/15 backdrop-blur-sm px-3 py-1 pr-6 flex items-center gap-2"
                style={{
                  clipPath: "polygon(0 0, 100% 0, 85% 100%, 0 100%)",
                  minWidth: "130px",
                }}
              >
                {config.token_image_url && (
                  <img src={config.token_image_url} alt="" className="w-4 h-4 rounded-full" />
                )}
                <div className="flex items-center gap-1">
                  <span className="text-[8px] text-white/60">1 XP</span>
                  <span className="text-[9px] font-bold text-white">= ${config.points_usd_rate}</span>
                </div>
              </div>
            </div>
          )}
          <p className="text-white/60 text-[10px] mt-4">Sample Balance</p>
          <p className="text-lg font-bold text-white">1,000 XP ≈ ${(1000 * config.points_usd_rate).toFixed(2)}</p>
        </div>
      </div>

      <Button onClick={saveConfig} disabled={saving} className="w-full gradient-primary text-white border-0 gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save Ticker Settings
      </Button>
    </div>
  );
};

export default TickerSettings;
