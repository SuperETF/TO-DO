import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export function useScore(memberId: string) {
  const [monthlyScore, setMonthlyScore] = useState(0);

  useEffect(() => {
    if (!memberId) return;

    const fetchMonthlyScore = async () => {
      const currentMonth = new Date().toISOString().slice(0, 7); // "2025-06"

      const { data: missions } = await supabase
        .from("mission_logs")
        .select("id")
        .eq("member_id", memberId)
        .eq("is_completed", true)
        .eq("assigned_month", currentMonth);

      const { data: routines } = await supabase
        .from("routine_logs")
        .select("id")
        .eq("member_id", memberId)
        .eq("completed", true);

      const { data: workouts } = await supabase
        .from("workout_logs")
        .select("id")
        .eq("member_id", memberId)
        .eq("is_completed", true);

      const m = missions?.length || 0;
      const r = routines?.length || 0;
      const w = workouts?.length || 0;

      const score = m * 10 + r * 5 + w * 20;
      setMonthlyScore(score);

      // ✅ 월간 점수 저장 로그 테이블로 기록
      await supabase
        .from("score_logs")
        .upsert({
          member_id: memberId,
          month: currentMonth,
          score,
          updated_at: new Date().toISOString(),
        }, { onConflict: "member_id,month" });
    };

    fetchMonthlyScore();
  }, [memberId]);

  return { monthlyScore };
}
