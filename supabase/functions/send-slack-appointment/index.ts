import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  try {
    // ✅ Content-Type 강제 확인
    const contentType = req.headers.get("content-type");
    if (contentType !== "application/json") {
      console.error("❌ Content-Type이 application/json이 아님:", contentType);
      return new Response("Invalid Content-Type", { status: 415 });
    }

    // ✅ JSON 파싱
    let body;
    try {
      body = await req.json();
    } catch (err) {
      console.error("❌ JSON 파싱 실패:", err);
      return new Response("Invalid JSON", { status: 400 });
    }

    const { type, record, old_record } = body;
    const data = type === "INSERT" ? record : old_record;

    const {
      member_id,
      appointment_date,
      appointment_time,
      reason,
      type: apptType,
    } = data;

    // ✅ 환경변수 불러오기
    const webhookUrl = Deno.env.get("SLACK_WEBHOOK_URL");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!webhookUrl || !supabaseUrl || !anonKey || !serviceRoleKey) {
      console.error("❌ 환경변수 누락");
      return new Response("Missing env vars", { status: 500 });
    }

    // ✅ 회원 정보 조회
    const memberRes = await fetch(
      `${supabaseUrl}/rest/v1/members?id=eq.${member_id}&select=name,trainer_id`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          Accept: "application/json",
        },
      }
    );

    const member = (await memberRes.json())[0];

    // ✅ 트레이너 정보 조회
    let trainerName = "N/A";
    if (member?.trainer_id) {
      const trainerRes = await fetch(
        `${supabaseUrl}/rest/v1/trainers?id=eq.${member.trainer_id}&select=name`,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${serviceRoleKey}`,
            Accept: "application/json",
          },
        }
      );
      const trainer = (await trainerRes.json())[0];
      trainerName = trainer?.name || "N/A";
    }

    // ✅ Slack 메시지 작성
    const emoji = type === "INSERT" ? "📅" : "🚫";
    const title = type === "INSERT" ? "[신규 예약 등록]" : "[예약 취소됨]";

    const message = {
      text: `${emoji} *${title}*
👤 회원: ${member?.name || "알 수 없음"} (트레이너: ${trainerName})
📆 날짜: ${appointment_date}
⏰ 시간: ${appointment_time}
🏷️ 유형: ${apptType === "lesson" ? "1:1 레슨" : "개인 운동"}
${type === "INSERT" ? `📝 사유: ${reason || "-없음-"}` : ""}`,
    };

    // ✅ Slack 전송
    const slackRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });

    if (!slackRes.ok) {
      const err = await slackRes.text();
      console.error("❌ Slack 전송 실패:", err);
      return new Response("Slack 전송 실패", { status: 500 });
    }

    return new Response("Slack 전송 완료", { status: 200 });

  } catch (err) {
    console.error("❌ send-slack-appointment 함수 전체 실패:", err);
    return new Response("함수 처리 중 오류", { status: 500 });
  }
});
