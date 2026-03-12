import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function hmacSha256(key: string | ArrayBuffer, data: string): Promise<ArrayBuffer> {
  const keyBuffer = typeof key === "string" ? new TextEncoder().encode(key) : key;

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
}

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function validateInitData(initData: string, botToken: string) {
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
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
    const { initData } = await req.json();

    const { valid, data } = await validateInitData(initData, botToken);

    if (!valid) {
      return new Response(JSON.stringify({ error: "Invalid initData" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const tgUser = JSON.parse(data.user || "{}");
    const telegramId = tgUser.id;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 🔎 البحث عن مستخدم بنفس telegram id
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("telegram_id", telegramId)
      .maybeSingle();

    let userId;

    if (existingProfile) {
      userId = existingProfile.user_id;
    } else {
      // 🆕 إنشاء مستخدم جديد
      const { data: newUser, error } = await supabase.auth.admin.createUser({
        email: `tg_${telegramId}@telegram.user`,
        password: crypto.randomUUID(),
        email_confirm: true,
        user_metadata: {
          telegram_id: telegramId,
          username: tgUser.username || tgUser.first_name,
        },
      });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: corsHeaders,
        });
      }

      userId = newUser.user.id;

      await supabase.from("profiles").insert({
        user_id: userId,
        telegram_id: telegramId,
        username: tgUser.username || tgUser.first_name,
        avatar_url: tgUser.photo_url || null,
        points: 0,
        tokens: 0,
      });
    }

    // 🔑 تسجيل الدخول
    const { data: sessionData, error: sessionError } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: `tg_${telegramId}@telegram.user`,
      });

    if (sessionError) {
      return new Response(JSON.stringify({ error: sessionError.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify(sessionData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
