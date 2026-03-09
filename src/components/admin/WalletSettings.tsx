import { useState, useEffect, useRef } from "react";
import {
  Coins, Plus, Trash2, Save, Loader2, Upload, X, Edit3, Eye, Link2, Hash
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CHAINS = ["internal", "Ethereum", "BSC", "Polygon", "Solana", "TON", "Arbitrum", "Base", "Avalanche"];

interface CurrencyForm {
  name: string;
  symbol: string;
  chain: string;
  contract_address: string;
  icon_url: string;
  exchange_rate: number;
  decimals: number;
  is_active: boolean;
  sort_order: number;
}

const defaultForm: CurrencyForm = {
  name: "", symbol: "", chain: "internal", contract_address: "",
  icon_url: "", exchange_rate: 0, decimals: 18, is_active: true, sort_order: 0,
};

const WalletSettings = () => {
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CurrencyForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchCurrencies(); }, []);

  const fetchCurrencies = async () => {
    setLoading(true);
    const { data } = await supabase.from("currencies").select("*").order("sort_order", { ascending: true });
    if (data) setCurrencies(data);
    setLoading(false);
  };

  const openCreate = () => {
    setEditId(null);
    setForm(defaultForm);
    setModal(true);
  };

  const openEdit = (c: any) => {
    setEditId(c.id);
    setForm({
      name: c.name, symbol: c.symbol, chain: c.chain || "internal",
      contract_address: c.contract_address || "", icon_url: c.icon_url || "",
      exchange_rate: c.exchange_rate, decimals: c.decimals || 18,
      is_active: c.is_active, sort_order: c.sort_order || 0,
    });
    setModal(true);
  };

  const uploadIcon = async (file: File) => {
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `token-icons/${form.symbol || "token"}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("prize-media").upload(path, file, { cacheControl: "3600", upsert: true });
    if (error) { toast.error("Upload failed"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("prize-media").getPublicUrl(path);
    setForm(prev => ({ ...prev, icon_url: urlData.publicUrl }));
    toast.success("Icon uploaded!");
    setUploading(false);
  };

  const saveCurrency = async () => {
    if (!form.name.trim() || !form.symbol.trim()) { toast.error("Name & symbol required"); return; }
    setSaving(true);
    const payload = {
      name: form.name, symbol: form.symbol.toUpperCase(), chain: form.chain,
      contract_address: form.contract_address || null, icon_url: form.icon_url || null,
      exchange_rate: form.exchange_rate, decimals: form.decimals,
      is_active: form.is_active, sort_order: form.sort_order,
    };

    const { error } = editId
      ? await supabase.from("currencies").update(payload).eq("id", editId)
      : await supabase.from("currencies").insert(payload);

    if (error) toast.error(error.message);
    else {
      toast.success(editId ? "Currency updated!" : "Currency created!");
      setModal(false);
      fetchCurrencies();
    }
    setSaving(false);
  };

  const deleteCurrency = async (id: string) => {
    const { error } = await supabase.from("currencies").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted!"); fetchCurrencies(); }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <Button onClick={openCreate} className="w-full gradient-primary text-white border-0 gap-2">
        <Plus className="h-4 w-4" /> Add Token / Currency
      </Button>

      {/* Token List */}
      <div className="space-y-2">
        {currencies.map((c) => (
          <div key={c.id} className="glass rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center overflow-hidden shrink-0">
              {c.icon_url ? (
                <img src={c.icon_url} alt={c.symbol} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <Coins className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{c.symbol}</p>
                <Badge className={`text-[8px] px-1.5 py-0 h-4 border-0 ${c.is_active ? "bg-earn/20 text-earn" : "bg-muted text-muted-foreground"}`}>
                  {c.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {c.name} • {c.chain || "internal"} {c.contract_address ? `• ${c.contract_address.slice(0, 8)}...` : ""}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-semibold text-foreground">${c.exchange_rate}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground">
                <Edit3 className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => deleteCurrency(c.id)} className="p-1.5 rounded-lg hover:bg-secondary/50 text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
        {currencies.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No tokens configured yet</p>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="glass border-border max-w-[420px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground font-display">{editId ? "Edit Token" : "Add Token"}</DialogTitle>
            <DialogDescription className="text-muted-foreground">Configure blockchain token details</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {/* Icon */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-secondary/50 flex items-center justify-center overflow-hidden shrink-0 border-2 border-dashed border-border">
                {form.icon_url ? (
                  <img src={form.icon_url} alt="" className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <Coins className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-1 text-xs">
                  {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                  Upload Icon
                </Button>
                {form.icon_url && (
                  <button onClick={() => setForm(p => ({ ...p, icon_url: "" }))} className="text-[10px] text-destructive flex items-center gap-1">
                    <X className="h-2.5 w-2.5" /> Remove
                  </button>
                )}
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadIcon(f); }} />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">Name</label>
                <Input placeholder="Tether" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} className="bg-secondary/50" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">Symbol</label>
                <Input placeholder="USDT" value={form.symbol} onChange={(e) => setForm(p => ({ ...p, symbol: e.target.value.toUpperCase() }))} className="bg-secondary/50" />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">Blockchain</label>
              <select
                value={form.chain}
                onChange={(e) => setForm(p => ({ ...p, chain: e.target.value }))}
                className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm text-foreground"
              >
                {CHAINS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
              </select>
            </div>

            {form.chain !== "internal" && (
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block flex items-center gap-1">
                  <Link2 className="h-3 w-3" /> Contract Address
                </label>
                <Input
                  placeholder="0x..."
                  value={form.contract_address}
                  onChange={(e) => setForm(p => ({ ...p, contract_address: e.target.value }))}
                  className="bg-secondary/50 font-mono text-xs"
                />
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">USD Rate</label>
                <Input type="number" step={0.0001} min={0} value={form.exchange_rate}
                  onChange={(e) => setForm(p => ({ ...p, exchange_rate: Number(e.target.value) }))}
                  className="bg-secondary/50" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">Decimals</label>
                <Input type="number" value={form.decimals}
                  onChange={(e) => setForm(p => ({ ...p, decimals: Number(e.target.value) }))}
                  className="bg-secondary/50" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 block">Sort Order</label>
                <Input type="number" value={form.sort_order}
                  onChange={(e) => setForm(p => ({ ...p, sort_order: Number(e.target.value) }))}
                  className="bg-secondary/50" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground">Active</span>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm(p => ({ ...p, is_active: v }))} />
            </div>

            <Button onClick={saveCurrency} disabled={saving} className="w-full gradient-primary text-white border-0 gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editId ? "Update Token" : "Add Token"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WalletSettings;
