import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { getISOWeek } from "date-fns";

interface Props {
  memberId: string;
}

interface RoutineLog {
  day: number;
  completed: boolean;
  date: string;
}

function getWeekId(date: Date) {
  return `${date.getFullYear()}-W${String(getISOWeek(date)).padStart(2, "0")}`;
}

export default function WeeklyRoutineSummarySection({ memberId }: Props) {
  const [routines, setRoutines] = useState<RoutineLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    if (memberId) fetchRoutine();
  }, [memberId]);

  return (
    <section className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <h3 className="text-lg font-semibold mb-3">주간 운동 체크 (확인용)</h3>
      {loading ? (
        <div className="text-center text-gray-400 py-8">불러오는 중...</div>
      ) : (
        <div className="flex justify-between">
          {["월", "화", "수", "목", "금", "토", "일"].map((dayLabel, idx) => {
            const log = routines.find((r) => r.day === idx);
            const completed = log?.completed ?? false;

            return (
              <div key={idx} className="flex flex-col items-center">
                <span className="text-sm text-gray-600 mb-1">{dayLabel}</span>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition ${
                    completed
                      ? "bg-teal-500 border-teal-500 text-white"
                      : "border-gray-300 text-gray-400 bg-white"
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
