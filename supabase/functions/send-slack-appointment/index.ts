import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  const { type, record, old_record } = await req.json();

  const data = type === "INSERT" ? record : old_record;
  const { member_id, appointment_date, appointment_time, reason, type: apptType } = data;

  const webhookUrl = Deno.env.get("SLACK_WEBHOOK_URL")!;

  // 🔍 Supabase에서 member + trainer 이름 조회
  const memberRes = await fetch(
    `https://ymmkxglmzbsdazthmghl.supabase.co/rest/v1/members?id=eq.${member_id}&select=name,trainer_id`,
    {
      headers: {
        apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!}`,
      },
    }
  );
  const member = (await memberRes.json())[0];

  let trainerName = "N/A";
  if (member?.trainer_id) {
    const trainerRes = await fetch(
      `https://ymmkxglmzbsdazthmghl.supabase.co/rest/v1/trainers?id=eq.${member.trainer_id}&select=name`,
      {
        headers: {
          apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!}`,
        },
      }
    );
    const trainer = (await trainerRes.json())[0];
    trainerName = trainer?.name || "N/A";
  }

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

  const slackRes = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });

  return new Response(slackRes.ok ? "전송 완료" : "Slack 전송 실패", {
    status: slackRes.ok ? 200 : 500,
  });
});
