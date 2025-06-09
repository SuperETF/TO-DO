import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { subscribeToRealtime } from "../lib/realtime";
export function useAchievement(memberId: string) {
  const [state, setState] = useState({
    missionCount: 0,
    workoutCount: 0,
    routineCount: 0,
    level: 0,
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
      const score = data.score ?? 0;
      const level = data.level ?? 0;
      const percent = data.percent ?? 0;

      setState({
        missionCount: data.mission_count ?? 0,
        workoutCount: data.workout_count ?? 0,
        routineCount: data.routine_count ?? 0,
        level,
        score,
        percent,
      });
    }
  };

  useEffect(() => {
    if (!memberId) return;

    fetch();

    const unsubscribe = subscribeToRealtime(() => {
      fetch(); // 테이블 변경 발생 시 View 재조회
    });

    return () => {
      unsubscribe?.(); // 채널 해제
    };
  }, [memberId]);

  return state;
}
