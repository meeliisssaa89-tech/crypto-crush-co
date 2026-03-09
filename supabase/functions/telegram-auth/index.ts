import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function hmacSha256(key: string | ArrayBuffer, data: string): Promise<ArrayBuffer> {
  const keyBuffer = typeof key === "string" ? new TextEncoder().encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyBuffer, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
}

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function validateInitData(initData: string, botToken: string): Promise<{ valid: boolean; data: Record<string, string> }> {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return { valid: false, data: {} };

  params.delete("hash");
  const entries = Array.from(params.entries());
  entries.sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join("\n");

  const secretKey = await hmacSha256("WebAppData", botToken);
  const computedHash = bufToHex(await hmacSha256(secretKey, dataCheckString));

  const data: Record<string, string> = {};
  for (const [k, v] of new URLSearchParams(initData).entries()) {
    data[k] = v;
  }

  return { valid: computedHash === hash, data };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!botToken) {
      return new Response(
        JSON.stringify({ error: "Bot token not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { initData } = await req.json();
    if (!initData) {
      return new Response(
        JSON.stringify({ error: "initData is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { valid, data } = await validateInitData(initData, botToken);
    if (!valid) {
      return new Response(
        JSON.stringify({ error: "Invalid initData" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authDate = parseInt(data.auth_date || "0", 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) {
      return new Response(
        JSON.stringify({ error: "initData expired" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tgUser = JSON.parse(data.user || "{}");
    const telegramId = tgUser.id;
    if (!telegramId) {
      return new Response(
        JSON.stringify({ error: "No user in initData" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const email = `tg_${telegramId}@telegram.user`;
    const password = `tg_${telegramId}_${botToken.slice(0, 16)}`;

    const { data: signInData } = await supabase.auth.signInWithPassword({ email, password });

    if (signInData?.session) {
      await supabase
        .from("profiles")
        .upsert({
          user_id: signInData.user.id,
          telegram_id: telegramId,
          username: tgUser.username || tgUser.first_name || null,
          avatar_url: tgUser.photo_url || null,
          referral_code: `tg${telegramId}`.slice(0, 8),
        }, { onConflict: "user_id" });

      return new Response(
        JSON.stringify({
          access_token: signInData.session.access_token,
          refresh_token: signInData.session.refresh_token,
          user: signInData.user,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username: tgUser.username || tgUser.first_name || `user_${telegramId}`,
        telegram_id: telegramId,
      },
    });

    if (signUpError || !signUpData.user) {
      return new Response(
        JSON.stringify({ error: signUpError?.message || "Failed to create user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase
      .from("profiles")
      .update({
        telegram_id: telegramId,
        username: tgUser.username || tgUser.first_name || null,
        avatar_url: tgUser.photo_url || null,
      })
      .eq("user_id", signUpData.user.id);

    const { data: newSession, error: sessionError } = await supabase.auth.signInWithPassword({ email, password });

    if (sessionError || !newSession.session) {
      return new Response(
        JSON.stringify({ error: "Account created but sign-in failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        access_token: newSession.session.access_token,
        refresh_token: newSession.session.refresh_token,
        user: newSession.user,
        created: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
