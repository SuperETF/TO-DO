// functions/complete-activity/index.ts

import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { member_id, type, meta } = await req.json();
  if (!member_id || !type) {
    return new Response("❌ 필수 정보 누락", { status: 400 });
  }

  let activityMessage = "";
  let scoreDiff = 0;

  // 1. 활동 기록
  if (type === "routine") {
    const { date, day, week_id } = meta;
    const { error } = await supabase.from("routine_logs").upsert(
      [
        { member_id, date, day, week_id, completed: true },
      ],
      { onConflict: "member_id,date" }
    );
    if (error) return new Response("❌ 루틴 기록 실패: " + error.message, { status: 500 });
    activityMessage = "루틴 완료";
    scoreDiff = 5;
  }

  if (type === "workout") {
    const { date, week, video_url, title } = meta;
    const { error } = await supabase.from("workout_logs").insert([
      { member_id, date, week, video_url, workout_notes: title, is_completed: true },
    ]);
    if (error) return new Response("❌ 운동 기록 실패: " + error.message, { status: 500 });
    activityMessage = "운동 완료";
    scoreDiff = 20;
  }

  if (type === "mission") {
    const { mission_id } = meta;
    const { error } = await supabase
      .from("mission_logs")
      .update({ is_completed: true })
      .eq("mission_id", mission_id)
      .eq("member_id", member_id);
    if (error) return new Response("❌ 미션 완료 실패: " + error.message, { status: 500 });
    activityMessage = "미션 완료";
    scoreDiff = 10;
  }

  if (type === "recommendation") {
    const { id } = meta;
    const { error } = await supabase
      .from("member_recommendations")
      .update({ is_completed: true })
      .eq("id", id);
    if (error) return new Response("❌ 추천 운동 완료 실패: " + error.message, { status: 500 });
    activityMessage = "추천 운동 완료";
    scoreDiff = 10;
  }

  // 2. 점수/레벨 계산
  const { count: m } = await supabase
    .from("mission_logs")
    .select("id", { count: "exact", head: true })
    .eq("member_id", member_id)
    .eq("is_completed", true);

  const { count: w } = await supabase
    .from("workout_logs")
    .select("id", { count: "exact", head: true })
    .eq("member_id", member_id)
    .eq("is_completed", true);

  const { count: r } = await supabase
    .from("routine_logs")
    .select("id", { count: "exact", head: true })
    .eq("member_id", member_id)
    .eq("completed", true);

  const mission = m || 0;
  const workout = w || 0;
  const routine = r || 0;

  const total = mission + workout + routine;
  const score = mission * 10 + workout * 20 + routine * 5;
  const level = Math.floor(total / 5) + 1;

  const { data: prev } = await supabase
    .from("members")
    .select("level")
    .eq("id", member_id)
    .maybeSingle();

  const prevLevel = prev?.level || 1;
  const levelUp = level > prevLevel;

  const { error: updateError } = await supabase
    .from("members")
    .update({ score, level })
    .eq("id", member_id);
  if (updateError) return new Response("❌ 점수 반영 실패: " + updateError.message, { status: 500 });

  // 3. 레벨 보상 지급
  if (level >= 10 && level % 10 === 0) {
    const rewardLevel = Math.floor(level / 10) * 10;
    const rewardMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    const { data: rewards } = await supabase
      .from("lesson_rewards")
      .select("id")
      .eq("member_id", member_id)
      .eq("reward_level", rewardLevel)
      .eq("reward_month", rewardMonth);

    if (!rewards || rewards.length === 0) {
      await supabase.from("lesson_rewards").insert([
        { member_id, reward_level: rewardLevel, reward_month: rewardMonth },
      ]);
    }
  }

  return new Response(
    JSON.stringify({
      status: "success",
      message: `✅ ${activityMessage} +${scoreDiff}점`,
      levelUp,
      newLevel: level,
      newScore: score
    }),
    { headers: { "Content-Type": "application/json" }, status: 200 }
  );
});