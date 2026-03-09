import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hmac } from "https://deno.land/x/hmac@v2.0.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function validateInitData(initData: string, botToken: string): { valid: boolean; data: Record<string, string> } {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return { valid: false, data: {} };

  params.delete("hash");
  const entries = Array.from(params.entries());
  entries.sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join("\n");

  const secretKey = hmac("sha256", "WebAppData", botToken, "utf8", "hex");
  const computedHash = hmac("sha256", secretKey, dataCheckString, "hex", "hex");

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

    // Validate initData
    const { valid, data } = validateInitData(initData, botToken);
    if (!valid) {
      return new Response(
        JSON.stringify({ error: "Invalid initData" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check auth_date freshness (allow 5 min)
    const authDate = parseInt(data.auth_date || "0", 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 300) {
      return new Response(
        JSON.stringify({ error: "initData expired" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse user from initData
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

    // Generate a deterministic email for the TG user
    const email = `tg_${telegramId}@telegram.user`;
    const password = `tg_${telegramId}_${botToken.slice(0, 16)}`;

    // Try to sign in first
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInData?.session) {
      // Update profile with latest TG info
      await supabase
        .from("profiles")
        .update({
          telegram_id: telegramId,
          username: tgUser.username || tgUser.first_name || null,
          avatar_url: tgUser.photo_url || null,
        })
        .eq("user_id", signInData.user.id);

      return new Response(
        JSON.stringify({
          access_token: signInData.session.access_token,
          refresh_token: signInData.session.refresh_token,
          user: signInData.user,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // User doesn't exist — create account
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

    // Update profile with telegram_id
    await supabase
      .from("profiles")
      .update({
        telegram_id: telegramId,
        username: tgUser.username || tgUser.first_name || null,
        avatar_url: tgUser.photo_url || null,
      })
      .eq("user_id", signUpData.user.id);

    // Sign in the newly created user
    const { data: newSession, error: sessionError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

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
