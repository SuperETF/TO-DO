import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { subscribeToRealtime } from "../lib/realtime";

export function useAchievement(memberId: string) {
  const [state, setState] = useState({
    missionCount: 0,
    workoutCount: 0,
    routineCount: 0,
    lessonCount: 0,
    personalCount: 0,
    level: 1,
    score: 0,
    percent: 0,
  });

  const fetch = async () => {
    const { data, error } = await supabase
      .from("member_achievement_view")
      .select("*")
      .eq("member_id", memberId)
      .single();

    if (data && !error) {
      setState({
        missionCount: data.mission_count ?? 0,
        workoutCount: data.workout_count ?? 0,
        routineCount: data.routine_count ?? 0,
        lessonCount: data.lesson_count ?? 0,
        personalCount: data.personal_count ?? 0,
        score: data.score ?? 0,
        level: data.level ?? 1,
        percent: data.percent ?? 0,
      });
    }
  };

  useEffect(() => {
    if (!memberId) return;

    fetch();

    const unsubscribe = subscribeToRealtime(() => {
      fetch(); // 실시간 반영
    });

    return () => {
      unsubscribe?.(); // 채널 해제
    };
  }, [memberId]);

  return state;
}
