import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function getDayAndDate(dateString: string) {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const date = new Date(dateString);
  const dayOfWeek = days[date.getDay()];
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${dayOfWeek})`;
}

function parseCommandText(text: string) {
  const trimmed = (text ?? "").trim();
  if (!trimmed) return { mode: "future", trainerName: "" };
  if (trimmed.startsWith("과거")) {
    const trainerName = trimmed.replace("과거", "").trim();
    return { mode: "past", trainerName };
  }
  return { mode: "future", trainerName: trimmed };
}

serve(async (req) => {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const form = await req.formData();
  const text = form.get("text") as string;
  const { mode, trainerName } = parseCommandText(text);

  let dateFilter = {};
  if (mode === "past") {
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    const from = sevenDaysAgo.toISOString().split("T")[0];
    dateFilter = { gte: from, lte: todayStr };
  } else {
    dateFilter = { gte: todayStr };
  }

  // 쿼리: appointments → members(name, trainer_id, trainers(name))
  let query = supabase
    .from("appointments")
    .select(`
      id,
      appointment_date,
      appointment_time,
      type,
      members(name, trainer_id, trainers(name))
    `)
    .eq("type", "personal")
    .gte("appointment_date", dateFilter.gte)
    .order("appointment_date", { ascending: true })
    .limit(30);

  if ((dateFilter as any).lte) {
    query = query.lte("appointment_date", (dateFilter as any).lte);
  }

  // 트레이너 이름 검색: 담당 트레이너만! (trainer_id null 제외)
  if (trainerName) {
    query = query
      .not("members.trainer_id", "is", null)
      .eq("members.trainers.name", trainerName);
    // 만약 부분 일치로 하고 싶다면 .ilike("members.trainers.name", `%${trainerName}%`)
  }

  const { data, error } = await query;

  if (error) {
    return new Response(
      JSON.stringify({
        response_type: "ephemeral",
        text: `❌ DB 조회 오류: ${error.message}`,
      }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );
  }

  if (!data || data.length === 0) {
    return new Response(
      JSON.stringify({
        response_type: "in_channel",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text:
                (mode === "past"
                  ? "🕓 지난 7일간"
                  : "오늘 이후") +
                (trainerName ? ` *${trainerName}* 트레이너 회원의` : " 전체") +
                "\n*개인 운동 예약이 없습니다.*\n\n:zzz:",
            },
          },
        ],
      }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );
  }

  // Block Kit 헤더
  const blocks: any[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text:
          "📅 개인 운동 예약 현황" +
          (mode === "past" ? " (지난 7일간" : " (오늘~미래") +
          (trainerName ? `, 트레이너: ${trainerName}` : "") +
          ")",
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*이름 | 담당 트레이너 | 날짜(요일) | 예약 시간*",
      },
    },
    { type: "divider" },
  ];

  data.forEach((a: any) => {
    const memberName = a.members?.name ?? "-";
    const trainer = a.members?.trainers?.name ?? "-";
    const dayAndDate = getDayAndDate(a.appointment_date);
    const time = a.appointment_time?.slice(0, 5) ?? "-";
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${memberName}* | *${trainer}* | ${dayAndDate} | *${time}*`,
      },
    });
  });

  return new Response(
    JSON.stringify({
      response_type: "in_channel",
      blocks,
    }),
    { headers: { "Content-Type": "application/json" }, status: 200 }
  );
});
