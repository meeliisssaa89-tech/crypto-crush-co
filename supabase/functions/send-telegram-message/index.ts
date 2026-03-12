import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const { message, chat_id, broadcast, parse_mode, photo_url, inline_keyboard, channel_id } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const results: Array<{ chat_id: number | string; success: boolean; error?: string }> = [];

    // Build reply_markup if inline_keyboard is provided
    const reply_markup = inline_keyboard ? { inline_keyboard } : undefined;

    const sendToChat = async (targetChatId: number | string) => {
      try {
        let endpoint: string;
        let body: Record<string, any>;

        if (photo_url) {
          endpoint = `https://api.telegram.org/bot${botToken}/sendPhoto`;
          body = {
            chat_id: targetChatId,
            photo: photo_url,
            caption: message,
            parse_mode: parse_mode || "HTML",
            ...(reply_markup ? { reply_markup: JSON.stringify(reply_markup) } : {}),
          };
        } else {
          endpoint = `https://api.telegram.org/bot${botToken}/sendMessage`;
          body = {
            chat_id: targetChatId,
            text: message,
            parse_mode: parse_mode || "HTML",
            ...(reply_markup ? { reply_markup: JSON.stringify(reply_markup) } : {}),
          };
        }

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        results.push({
          chat_id: targetChatId,
          success: data.ok,
          error: data.ok ? undefined : data.description,
        });
      } catch (err) {
        results.push({
          chat_id: targetChatId,
          success: false,
          error: String(err),
        });
      }
    };

    // Send to specific channel if provided
    if (channel_id) {
      await sendToChat(channel_id);
    }

    if (broadcast) {
      // ✅ تحسين البث: جلب المستخدمين الفريدين فقط
      const { data: profiles, error: fetchError } = await supabase
        .from("profiles")
        .select("telegram_id, user_id")
        .not("telegram_id", "is", null)
        .order("created_at", { ascending: false }); // احصل على أحدث الملفات الشخصية

      if (fetchError) {
        console.error("Error fetching profiles:", fetchError);
        return new Response(
          JSON.stringify({ error: `Failed to fetch profiles: ${fetchError.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (profiles && profiles.length > 0) {
        // ✅ تتبع المستخدمين الذين تم إرسالهم لهم الرسالة لتجنب التكرار
        const sentToTelegramIds = new Set<number>();

        for (const profile of profiles) {
          const telegramId = profile.telegram_id;

          // تجنب إرسال نفس الرسالة مرتين لنفس المستخدم
          if (sentToTelegramIds.has(telegramId)) {
            console.log(`Skipping duplicate telegram_id: ${telegramId}`);
            continue;
          }

          await sendToChat(telegramId);
          sentToTelegramIds.add(telegramId);

          // تأخير بين الرسائل لتجنب حد السرعة من Telegram
          await new Promise((r) => setTimeout(r, 35));
        }

        console.log(`Broadcast sent to ${sentToTelegramIds.size} unique users`);
      }
    } else if (chat_id) {
      // إرسال رسالة لمستخدم محدد
      await sendToChat(chat_id);
    } else if (!channel_id) {
      return new Response(
        JSON.stringify({ error: "Either chat_id, broadcast=true, or channel_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    // Log activity
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      try {
        const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: { user } } = await userClient.auth.getUser();
        if (user) {
          await supabase.from("activity_logs").insert({
            user_id: user.id,
            action: broadcast ? "broadcast_message" : "send_message",
            details: {
              message: message.substring(0, 100),
              success_count: successCount,
              fail_count: failCount,
              timestamp: new Date().toISOString(),
            },
          });
        }
      } catch (logErr) {
        console.error("Error logging activity:", logErr);
        // Don't throw - logging failure shouldn't break the message sending
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failCount,
        results,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Telegram message error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
