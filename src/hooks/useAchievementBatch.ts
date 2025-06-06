// hooks/useAchievementBatch.ts

import { supabase } from "../lib/supabaseClient";

export async function getAchievementLevels(memberIds: string[]) {
  const { data: missions } = await supabase
    .from("mission_logs")
    .select("member_id")
    .in("member_id", memberIds);

  const { data: workouts } = await supabase
    .from("workout_logs")
    .select("member_id")
    .in("member_id", memberIds);

  const { data: routines } = await supabase
    .from("routine_logs")
    .select("member_id")
    .in("member_id", memberIds);

  const result: {
    [memberId: string]: {
      missionCount: number;
      workoutCount: number;
      routineCount: number;
      level: number;
      percent: number;
    };
  } = {};

  memberIds.forEach((id) => {
    const missionCount = missions?.filter((m) => m.member_id === id).length ?? 0;
    const workoutCount = workouts?.filter((w) => w.member_id === id).length ?? 0;
    const routineCount = routines?.filter((r) => r.member_id === id).length ?? 0;

    const totalExp = missionCount + workoutCount + routineCount;
    const level = Math.floor(totalExp / 5) + 1;
    const percent = (totalExp % 5) * 20;

    result[id] = { missionCount, workoutCount, routineCount, level, percent };
  });

  return result;
}
