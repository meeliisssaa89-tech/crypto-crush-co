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

/**
 * Generate a unique referral code
 */
function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

/**
 * Create a unique email using telegram ID only (consistent across sessions)
 */
function generateUniqueEmail(telegramId: number): string {
  return `tg_${telegramId}@telegram.user`;
}

/**
 * Handle new user creation and profile setup
 */
async function handleNewUser(
  telegramId: number,
  tgUser: any,
  supabase: any
): Promise<string> {
  console.log(`Creating new user for telegram ID: ${telegramId}`);

  // Generate unique email and referral code
  const uniqueEmail = generateUniqueEmail(telegramId);
  const referralCode = generateReferralCode();

  // 🆕 إنشاء مستخدم جديد
  // Check if user already exists to avoid duplicates
  try {
    const { data: existingUser } = await supabase.auth.admin.getUserById(uniqueEmail);
    if (existingUser?.user?.id) {
      console.log(`User already exists with email: ${uniqueEmail}`);
      return existingUser.user.id;
    }
  } catch (err) {
    // User doesn't exist, continue with creation
    console.log(`User does not exist, creating new user for email: ${uniqueEmail}`);
  }

  const { data: newUser, error: createUserError } =
    await supabase.auth.admin.createUser({
      email: uniqueEmail,
      password: crypto.randomUUID(),
      email_confirm: true,
      user_metadata: {
        telegram_id: telegramId,
        username: tgUser.username || tgUser.first_name,
        created_from: "telegram",
        created_at: new Date().toISOString(),
      },
    });

  if (createUserError || !newUser?.user?.id) {
    console.error("User creation error:", createUserError);
    throw new Error(`Failed to create user: ${createUserError?.message || "Unknown error"}`);
  }

  const userId = newUser.user.id;
  console.log(`User created successfully with ID: ${userId}`);

  // ✅ إنشاء ملف شخصي فريد لهذا المستخدم فقط
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .insert({
      user_id: userId,
      telegram_id: telegramId,
      username: tgUser.username || tgUser.first_name,
      avatar_url: tgUser.photo_url || null,
      referral_code: referralCode,
      xp: 0,
      level: 1,
      streak_days: 0,
    })
    .select()
    .single();

  if (profileError) {
    console.error("Profile creation error:", profileError);
    throw new Error(`Failed to create profile: ${profileError.message}`);
  }

  console.log(`Profile created successfully for user ${userId}`);
  return userId;
}

/**
 * Get or create user session
 */
async function getUserSession(
  telegramId: number,
  email: string,
  supabase: any
): Promise<any> {
  try {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: email,
      });

    if (sessionError) {
      console.error("Session generation error:", sessionError);
      throw new Error(`Failed to generate session: ${sessionError.message}`);
    }

    return sessionData;
  } catch (err) {
    console.error("Error generating session:", err);
    throw err;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!botToken) {
      throw new Error("TELEGRAM_BOT_TOKEN not configured");
    }

    const { initData } = await req.json();

    if (!initData) {
      return new Response(JSON.stringify({ error: "initData is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { valid, data } = await validateInitData(initData, botToken);

    if (!valid) {
      return new Response(JSON.stringify({ error: "Invalid initData" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tgUser = JSON.parse(data.user || "{}");
    const telegramId = tgUser.id;

    if (!telegramId) {
      return new Response(JSON.stringify({ error: "Invalid telegram user data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing Telegram user: ${telegramId}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 🔎 البحث الدقيق عن مستخدم بنفس telegram id
    // استخدام .single() بدلاً من .maybeSingle() للتأكد من وجود مستخدم واحد فقط
    const { data: existingProfile, error: searchError } = await supabase
      .from("profiles")
      .select("user_id, telegram_id, username")
      .eq("telegram_id", telegramId)
      .maybeSingle(); // Use maybeSingle to allow null result

    let userId: string;

    if (existingProfile) {
      // المستخدم موجود بالفعل
      console.log(
        `Existing user found for telegram ID ${telegramId}: ${existingProfile.user_id}`
      );
      userId = existingProfile.user_id;
    } else {
      // 🆕 إنشاء مستخدم جديد
      userId = await handleNewUser(telegramId, tgUser, supabase);
    }

    // 🔑 تسجيل الدخول باستخدام البريد الإلكتروني المرتبط بـ telegram_id
    const email = `tg_${telegramId}@telegram.user`;
    const sessionData = await getUserSession(telegramId, email, supabase);

    // Log successful authentication
    try {
      await supabase.from("activity_logs").insert({
        user_id: userId,
        action: "telegram_login",
        details: {
          telegram_id: telegramId,
          username: tgUser.username || tgUser.first_name,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (logErr) {
      console.error("Error logging activity:", logErr);
      // Don't throw - logging failure shouldn't break the auth flow
    }

    return new Response(
      JSON.stringify({
        ...sessionData,
        user_id: userId,
        telegram_id: telegramId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Telegram auth error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
