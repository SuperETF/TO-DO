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

    if (error) {
      console.error("데이터 조회 실패:", error.message);
      return;
    }

    if (data) {
      setState((prevState) => {
        const newState = {
          missionCount: data.mission_count ?? 0,
          workoutCount: data.workout_count ?? 0,
          routineCount: data.routine_count ?? 0,
          lessonCount: data.lesson_count ?? 0,
          personalCount: data.personal_count ?? 0,
          score: data.score ?? 0,
          level: data.level ?? 1,
          percent: data.percent ?? 0,
        };

        if (
          newState.missionCount !== prevState.missionCount ||
          newState.workoutCount !== prevState.workoutCount ||
          newState.routineCount !== prevState.routineCount ||
          newState.lessonCount !== prevState.lessonCount ||
          newState.personalCount !== prevState.personalCount ||
          newState.score !== prevState.score ||
          newState.level !== prevState.level ||
          newState.percent !== prevState.percent
        ) {
          return newState;
        }

        return prevState; // 변경되지 않으면 이전 상태 유지
      });
    }
  };

  // refetch 함수 수정: Promise<void>를 반환하도록 async로 정의
  const refetch = async (): Promise<void> => {
    await fetch(); // 데이터 다시 가져오기
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

  return { ...state, refetch }; // refetch 반환
}
