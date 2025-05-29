import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  try {
    const { type, record, old_record } = await req.json();
    const data = type === "INSERT" ? record : old_record;
    const {
      member_id,
      appointment_date,
      appointment_time,
      reason,
      type: apptType,
    } = data;

    // 🔐 환경변수
    const webhookUrl = Deno.env.get("SLACK_WEBHOOK_URL");
    const supabaseUrl = "https://ymmkxglmzbsdazthmghl.supabase.co";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // ✅ 환경변수 누락 체크
    if (!webhookUrl || !anonKey || !serviceRoleKey) {
      console.error("❌ 환경변수 누락");
      return new Response("환경변수 누락", { status: 500 });
    }

    // 🔍 회원 조회
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

    if (!memberRes.ok) {
      const errText = await memberRes.text();
      console.error("❌ 회원 조회 실패:", errText);
      return new Response("회원 정보 조회 실패", { status: 500 });
    }

    const member = (await memberRes.json())[0];
    let trainerName = "N/A";

    // 🔍 트레이너 조회
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

      if (trainerRes.ok) {
        const trainer = (await trainerRes.json())[0];
        trainerName = trainer?.name || "N/A";
      }
    }

    // 📩 메시지 생성
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
      const slackErr = await slackRes.text();
      console.error("❌ Slack 전송 실패:", slackErr);
      return new Response("Slack 전송 실패", { status: 500 });
    }

    return new Response("Slack 전송 완료", { status: 200 });
  } catch (err) {
    console.error("❌ 전반적인 처리 실패:", err);
    return new Response("함수 처리 중 오류", { status: 500 });
  }
});
