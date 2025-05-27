import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getISOWeek } from "date-fns";

export function useAchievement(memberId: string) {
  const [missionCount, setMissionCount] = useState(0);
  const [workoutCount, setWorkoutCount] = useState(0);
  const [routineCount, setRoutineCount] = useState(0);
  const [level, setLevel] = useState(1);
  const [percent, setPercent] = useState(0);

  const fetchData = useCallback(async () => {
    if (!memberId) return;

    const currentWeekId = `${new Date().getFullYear()}-W${String(
      getISOWeek(new Date())
    ).padStart(2, "0")}`;

    const { data: missions } = await supabase
      .from("mission_logs")
      .select("id")
      .eq("member_id", memberId)
      .eq("is_completed", true);

    const { data: workouts } = await supabase
      .from("workout_logs")
      .select("id")
      .eq("member_id", memberId)
      .eq("is_completed", true);

    const { data: routines } = await supabase
      .from("routine_logs")
      .select("id")
      .eq("member_id", memberId)
      .eq("week_id", currentWeekId)
      .eq("completed", true);

    const m = missions?.length || 0;
    const w = workouts?.length || 0;
    const r = routines?.length || 0;

    const total = m + w + r;
    const newLevel = Math.floor(total / 5) + 1;
    const newPercent = (total % 5) * 20;

    console.log("🎯 useAchievement fetchData:", {
      missionCount: m,
      workoutCount: w,
      routineCount: r,
      total,
      level: newLevel,
      percent: newPercent,
    });

    setMissionCount(m);
    setWorkoutCount(w);
    setRoutineCount(r);
    setLevel(newLevel);
    setPercent(newPercent);

    await checkAndRewardLevel(newLevel);
  }, [memberId]);

  const checkAndRewardLevel = async (newLevel: number) => {
    if (!memberId || newLevel < 10 || newLevel % 10 !== 0) return;

    const rewardLevel = Math.floor(newLevel / 10) * 10;
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

    const { data, error } = await supabase
      .from("lesson_rewards")
      .select("id")
      .eq("member_id", memberId)
      .eq("reward_level", rewardLevel)
      .eq("reward_month", currentMonth);

    if (!error && data.length === 0) {
      const { error: insertError } = await supabase.from("lesson_rewards").insert({
        member_id: memberId,
        reward_level: rewardLevel,
        reward_month: currentMonth,
      });

      if (!insertError) {
        alert(`🎉 레벨 ${rewardLevel} 도달! 레슨권 1매가 지급되었습니다!`);
      } else {
        console.error("❌ 레슨권 지급 실패:", insertError.message);
      }
    }
  };

  useEffect(() => {
    if (memberId) fetchData();
  }, [memberId, fetchData]);

  useEffect(() => {
    if (!memberId) return;

    const tables = ["mission_logs", "workout_logs", "routine_logs"];
    const channels = [];

    for (const table of tables) {
      const channel = supabase
        .channel(`realtime_${table}_${memberId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table,
            filter: `member_id=eq.${memberId}`,
          },
          (payload) => {
            console.log(`📡 Realtime [${table}] change detected:`, payload);
            fetchData();
          }
        )
        .subscribe((status) => {
          console.log(`🔌 Subscribed to [${table}]:`, status);
        });

      channels.push(channel);
    }

    return () => {
      channels.forEach((c) => supabase.removeChannel(c));
    };
  }, [memberId, fetchData]);

  return {
    missionCount,
    workoutCount,
    routineCount,
    level,
    percent,
    refetch: fetchData,
  };
}
