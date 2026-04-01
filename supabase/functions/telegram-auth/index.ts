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
 * Create a unique email using timestamp to avoid conflicts
 */
function generateUniqueEmail(telegramId: number): string {
  const timestamp = Date.now();
  return `tg_${telegramId}_${timestamp}@telegram.user`;
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

    const { initData, startParam } = await req.json();

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
    // Also check start_param from initData itself
    const referralCode = startParam || data.start_param || null;

    if (!telegramId) {
      return new Response(JSON.stringify({ error: "Invalid telegram user data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing Telegram user: ${telegramId}, referralCode: ${referralCode}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: existingProfile, error: searchError } = await supabase
      .from("profiles")
      .select("user_id, telegram_id, username")
      .eq("telegram_id", telegramId)
      .maybeSingle();

    let userId: string;
    let isNewUser = false;

    if (existingProfile) {
      console.log(`Existing user found for telegram ID ${telegramId}: ${existingProfile.user_id}`);
      userId = existingProfile.user_id;

      // Update profile info from Telegram
      await supabase.from("profiles").update({
        username: tgUser.username || tgUser.first_name,
        avatar_url: tgUser.photo_url || null,
      }).eq("user_id", userId);
    } else {
      userId = await handleNewUser(telegramId, tgUser, supabase);
      isNewUser = true;

      // Process referral for new users
      if (referralCode) {
        try {
          const { data: referrerProfile } = await supabase
            .from("profiles")
            .select("user_id, username")
            .eq("referral_code", referralCode)
            .maybeSingle();

          if (referrerProfile && referrerProfile.user_id !== userId) {
            // Fetch referral config
            const { data: configData } = await supabase
              .from("app_settings")
              .select("value")
              .eq("key", "referral_config")
              .maybeSingle();

            const refConfig = (configData?.value as any) || { referral_reward_xp: 100 };
            const rewardXp = refConfig.referral_reward_xp || 100;

            // Create referral record
            await supabase.from("referrals").insert({
              referrer_id: referrerProfile.user_id,
              referred_id: userId,
              level: 1,
              reward_amount: rewardXp,
            });

            // Reward referrer
            await supabase.rpc("add_xp", { p_user_id: referrerProfile.user_id, p_amount: rewardXp });

            // Log transaction
            await supabase.from("transactions").insert({
              user_id: referrerProfile.user_id,
              type: "referral_reward",
              amount: rewardXp,
              description: `Referral: ${tgUser.username || tgUser.first_name} joined`,
            });

            // Update referred_by on new user profile
            await supabase.from("profiles").update({
              referred_by: referrerProfile.user_id,
            }).eq("user_id", userId);

            console.log(`Referral processed: ${referrerProfile.username} -> ${tgUser.username}, +${rewardXp} XP`);
          }
        } catch (refErr) {
          console.error("Referral processing error:", refErr);
        }
      }
    }

    // Generate session
    const email = `tg_${telegramId}@telegram.user`;
    const sessionData = await getUserSession(telegramId, email, supabase);

    // Log activity
    try {
      await supabase.from("activity_logs").insert({
        user_id: userId,
        action: "telegram_login",
        details: {
          telegram_id: telegramId,
          username: tgUser.username || tgUser.first_name,
          is_new: isNewUser,
          referral_code: referralCode,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (logErr) {
      console.error("Error logging activity:", logErr);
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
