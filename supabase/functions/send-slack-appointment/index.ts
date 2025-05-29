import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SLACK_WEBHOOK_URL = Deno.env.get("SLACK_WEBHOOK_URL")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    const { type, record, id } = await req.json();
    let dbResult;
    if (type === "INSERT") {
      dbResult = await supabase.from("appointments").insert([record]).select();
    } else if (type === "DELETE") {
      dbResult = await supabase.from("appointments").delete().eq("id", id).select();
    } else {
      return new Response("Bad type", { status: 400 });
    }

    // 슬랙 알림
    await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `[${type === "INSERT" ? "신규 예약 등록" : "예약 취소"}]
회원: ${record.member_id}
날짜: ${record.appointment_date}
시간: ${record.appointment_time}
유형: ${record.type}
사유: ${record.reason || ""}`
      }),
    });

    return new Response(JSON.stringify({ dbResult }), { status: 200 });
  } catch (e) {
    return new Response("Error: " + e, { status: 500 });
  }
});
