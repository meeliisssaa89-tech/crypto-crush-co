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
 * Create a consistent email for a telegram user
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
 * Create a real session with access_token and refresh_token for a user
 */
async function getUserSession(
  userId: string,
  supabase: any
): Promise<any> {
  try {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.admin.createSession({ user_id: userId });

    if (sessionError) {
      console.error("Session generation error:", sessionError);
      throw new Error(`Failed to create session: ${sessionError.message}`);
    }

    return {
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
    };
  } catch (err) {
    console.error("Error creating session:", err);
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

      // Process referral for new users (L1, L2, L3)
      if (referralCode) {
        try {
          const { data: referrerProfile } = await supabase
            .from("profiles")
            .select("user_id, username, referred_by")
            .eq("referral_code", referralCode)
            .maybeSingle();

          if (referrerProfile && referrerProfile.user_id !== userId) {
            // Fetch referral config
            const { data: configData } = await supabase
              .from("app_settings")
              .select("value")
              .eq("key", "referral_config")
              .maybeSingle();

            const refConfig = (configData?.value as any) || {};
            const rewardXp = refConfig.referral_reward_xp || 100;
            const l2Percent = refConfig.referral_percent_l2 || 0;
            const l3Percent = refConfig.referral_percent_l3 || 0;

            const newUserName = tgUser.username || tgUser.first_name;

            // --- L1 referral ---
            await supabase.from("referrals").insert({
              referrer_id: referrerProfile.user_id,
              referred_id: userId,
              level: 1,
              reward_amount: rewardXp,
            });
            await supabase.rpc("add_xp", { p_user_id: referrerProfile.user_id, p_amount: rewardXp });
            await supabase.from("transactions").insert({
              user_id: referrerProfile.user_id,
              type: "referral_reward",
              amount: rewardXp,
              description: `L1 Referral: ${newUserName} joined`,
            });

            // Update referred_by on new user profile
            await supabase.from("profiles").update({
              referred_by: referrerProfile.user_id,
            }).eq("user_id", userId);

            console.log(`L1 Referral: ${referrerProfile.username} -> ${newUserName}, +${rewardXp} XP`);

            // --- L2 referral ---
            if (l2Percent > 0 && referrerProfile.referred_by) {
              const l2UserId = referrerProfile.referred_by;
              if (l2UserId !== userId) {
                const l2Reward = Math.floor(rewardXp * l2Percent / 100);
                if (l2Reward > 0) {
                  const { data: l2Profile } = await supabase
                    .from("profiles")
                    .select("user_id, username, referred_by")
                    .eq("user_id", l2UserId)
                    .maybeSingle();

                  if (l2Profile) {
                    await supabase.from("referrals").insert({
                      referrer_id: l2UserId,
                      referred_id: userId,
                      level: 2,
                      reward_amount: l2Reward,
                    });
                    await supabase.rpc("add_xp", { p_user_id: l2UserId, p_amount: l2Reward });
                    await supabase.from("transactions").insert({
                      user_id: l2UserId,
                      type: "referral_reward",
                      amount: l2Reward,
                      description: `L2 Referral: ${newUserName} joined`,
                    });
                    console.log(`L2 Referral: ${l2Profile.username} -> ${newUserName}, +${l2Reward} XP`);

                    // --- L3 referral ---
                    if (l3Percent > 0 && l2Profile.referred_by) {
                      const l3UserId = l2Profile.referred_by;
                      if (l3UserId !== userId && l3UserId !== l2UserId) {
                        const l3Reward = Math.floor(rewardXp * l3Percent / 100);
                        if (l3Reward > 0) {
                          await supabase.from("referrals").insert({
                            referrer_id: l3UserId,
                            referred_id: userId,
                            level: 3,
                            reward_amount: l3Reward,
                          });
                          await supabase.rpc("add_xp", { p_user_id: l3UserId, p_amount: l3Reward });
                          await supabase.from("transactions").insert({
                            user_id: l3UserId,
                            type: "referral_reward",
                            amount: l3Reward,
                            description: `L3 Referral: ${newUserName} joined`,
                          });
                          console.log(`L3 Referral: +${l3Reward} XP`);
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        } catch (refErr) {
          console.error("Referral processing error:", refErr);
        }
      }
    }

    // Generate session
    const sessionData = await getUserSession(userId, supabase);

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
