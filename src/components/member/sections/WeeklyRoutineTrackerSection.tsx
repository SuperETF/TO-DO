import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { getISOWeek, startOfWeek, addDays } from "date-fns";

export interface WeeklyRoutineTrackerSectionProps {
  memberId: string;
  refetch?: () => Promise<void>;
}

interface RoutineLog {
  day: number;
  completed: boolean;
  date: string;
}

function getWeekId(date: Date) {
  return `${date.getFullYear()}-W${String(getISOWeek(date)).padStart(2, "0")}`;
}

export default function WeeklyRoutineTrackerSection({
  memberId,
  refetch,
}: WeeklyRoutineTrackerSectionProps) {
  const [routines, setRoutines] = useState<RoutineLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoutine = async () => {
    setLoading(true);
    const weekId = getWeekId(new Date());

    const { data, error } = await supabase
      .from("routine_logs")
      .select("day, completed, date")
      .eq("member_id", memberId)
      .eq("week_id", weekId);

    if (!error && data) {
      setRoutines(data as RoutineLog[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (memberId) fetchRoutine();
  }, [memberId]);

  const toggleDay = async (day: number) => {
    const today = new Date();
    const weekId = getWeekId(today);

    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // 월요일 시작
    const base = addDays(weekStart, day);
    const isoDate = base.toISOString().split("T")[0];

    const existing = routines.find((r) => r.day === day);

    if (existing) {
      const newCompleted = !existing.completed;
      const { error } = await supabase
        .from("routine_logs")
        .update({ completed: newCompleted })
        .eq("member_id", memberId)
        .eq("date", isoDate);

      if (!error) {
        setRoutines((prev) =>
          prev.map((r) =>
            r.day === day ? { ...r, completed: newCompleted } : r
          )
        );
        if (refetch) await refetch();
        await updateAchievement(memberId);
      }
    } else {
      const newLog = {
        member_id: memberId,
        date: isoDate,
        day,
        week_id: weekId,
        completed: true,
      };

      const { error } = await supabase.from("routine_logs").insert([newLog]);

      if (!error) {
        setRoutines((prev) => [...prev, newLog]);
        if (refetch) await refetch();
        await updateAchievement(memberId);
      }
    }
  };

  const updateAchievement = async (memberId: string) => {
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
      .eq("completed", true);

    const m = missions?.length ?? 0;
    const w = workouts?.length ?? 0;
    const r = routines?.length ?? 0;

    const newLevel = Math.floor((m + w + r) / 5) + 1;
    const newScore = m * 10 + w * 20 + r * 5;

    await supabase
      .from("members")
      .update({ level: newLevel, score: newScore })
      .eq("id", memberId);
  };

  return (
    <section className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <h2 className="text-lg font-semibold mb-3">주간 운동 체크</h2>
      {loading ? (
        <div className="text-center text-gray-400 py-8">로딩 중...</div>
      ) : (
        <div className="flex justify-between">
          {["월", "화", "수", "목", "금", "토", "일"].map((label, idx) => {
            const found = routines.find((r) => r.day === idx);
            const completed = found?.completed ?? false;

            return (
              <div
                key={idx}
                className="flex flex-col items-center"
                onClick={() => toggleDay(idx)}
              >
                <span className="text-sm text-gray-600 mb-1">{label}</span>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 cursor-pointer transition ${
                    completed
                      ? "bg-teal-500 border-teal-500 text-white"
                      : "border-gray-300 text-gray-400"
                  }`}
                >
                  {completed && <i className="fas fa-check" />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
