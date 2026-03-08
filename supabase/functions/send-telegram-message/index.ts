import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const { message, chat_id, broadcast, parse_mode } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const results: Array<{ chat_id: number; success: boolean; error?: string }> = [];

    if (broadcast) {
      // Get all users with telegram_id
      const { data: profiles } = await supabase
        .from("profiles")
        .select("telegram_id")
        .not("telegram_id", "is", null);

      if (profiles && profiles.length > 0) {
        for (const profile of profiles) {
          try {
            const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: profile.telegram_id,
                text: message,
                parse_mode: parse_mode || "HTML",
              }),
            });
            const data = await res.json();
            results.push({
              chat_id: profile.telegram_id!,
              success: data.ok,
              error: data.ok ? undefined : data.description,
            });
          } catch (err) {
            results.push({
              chat_id: profile.telegram_id!,
              success: false,
              error: String(err),
            });
          }
          // Rate limit: max 30 messages per second
          await new Promise((r) => setTimeout(r, 35));
        }
      }
    } else if (chat_id) {
      // Send to specific user
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id,
          text: message,
          parse_mode: parse_mode || "HTML",
        }),
      });
      const data = await res.json();
      results.push({
        chat_id,
        success: data.ok,
        error: data.ok ? undefined : data.description,
      });
    } else {
      return new Response(
        JSON.stringify({ error: "Either chat_id or broadcast=true is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    // Log the broadcast activity
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        await supabase.from("activity_logs").insert({
          user_id: user.id,
          action: broadcast ? "broadcast_message" : "send_message",
          details: { message: message.substring(0, 100), success_count: successCount, fail_count: failCount },
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent: successCount, failed: failCount, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
