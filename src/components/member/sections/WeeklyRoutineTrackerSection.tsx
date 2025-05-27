import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { getISOWeek } from "date-fns";

export interface WeeklyRoutineTrackerSectionProps {
  memberId: string;
  refetch?: () => Promise<void>;
}

interface RoutineLog {
  day: number; // 0 = Monday
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

  // 주간 루틴 데이터 가져오기
  const fetchRoutine = async () => {
    setLoading(true);
    const today = new Date();
    const weekId = getWeekId(today);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId]);

  const toggleDay = async (day: number) => {
    const today = new Date();
    const weekId = getWeekId(today);
    // 요일 인덱스 맞추기 (0 = 월요일)
    const base = new Date(today);
    base.setDate(base.getDate() - ((base.getDay() + 6) % 7) + day); // 월요일 기준으로 맞춤
    const isoDate = base.toISOString().split("T")[0];

    const existing = routines.find((r) => r.day === day);

    if (existing?.completed) {
      // 체크 해제(삭제)
      const { error } = await supabase
        .from("routine_logs")
        .delete()
        .eq("member_id", memberId)
        .eq("date", isoDate);

      if (!error) {
        setRoutines((prev) => prev.filter((r) => r.day !== day));
        if (refetch) await refetch();
      }
    } else {
      // 체크(추가)
      const newLog = {
        member_id: memberId,
        date: isoDate,
        day,
        week_id: weekId,
        completed: true,
      };

      const { error } = await supabase
        .from("routine_logs")
        .upsert([newLog], {
          onConflict: "member_id,date",
        });

      if (!error) {
        const updated = routines.filter((r) => r.day !== day);
        updated.push(newLog);
        setRoutines(updated);
        if (refetch) await refetch();
      }
    }
  };

  return (
    <section className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <h2 className="text-lg font-semibold mb-3">주간 운동 체크</h2>
      {loading ? (
        <div className="text-center text-gray-400 py-8">로딩 중...</div>
      ) : (
        <div className="flex justify-between">
          {["월", "화", "수", "목", "금", "토", "일"].map((dayLabel, idx) => {
            const found = routines.find((r) => r.day === idx);
            const completed = found?.completed ?? false;

            return (
              <div
                key={idx}
                className="flex flex-col items-center"
                onClick={() => toggleDay(idx)}
              >
                <span className="text-sm text-gray-600 mb-1">{dayLabel}</span>
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
