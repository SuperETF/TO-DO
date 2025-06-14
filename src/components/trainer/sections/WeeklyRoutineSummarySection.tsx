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

  // 0:일, 1:월 ... 6:토
  const today = new Date().getDay();
  // 월~일(월=0, 일=6)
  const weekdays = ["월", "화", "수", "목", "금", "토", "일"];
  // 오늘 요일 인덱스 (월=0, ..., 일=6)
  const todayIndex = today === 0 ? 6 : today - 1;

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

  // 스켈레톤 로딩 UI
  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 mb-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="flex justify-between mt-4">
          {[...Array(7)].map((_, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="h-3 bg-gray-200 rounded w-4 mb-2"></div>
              <div className="w-10 h-10 rounded-full bg-gray-200"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 데이터 없음
  if (!routines || routines.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 flex flex-col items-center justify-center mb-6">
        <i className="fas fa-dumbbell text-gray-300 text-4xl mb-4"></i>
        <p className="text-gray-500 text-center mb-4">
          아직 운동 데이터가 없습니다.
        </p>
      </div>
    );
  }

  // 정상 상태
  return (
    <div className="rounded-2xl bg-white p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">이번 주 운동 현황</h2>
      <div className="flex justify-between mt-4">
        {weekdays.map((day, idx) => {
          const log = routines.find((r) => r.day === idx);
          const completed = log?.completed ?? false;
          return (
            <div
              key={idx}
              className={`flex flex-col items-center ${
                todayIndex === idx ? "bg-blue-50 rounded-lg px-2 py-1" : ""
              }`}
            >
              <span
                className={`text-xs mb-2 ${
                  todayIndex === idx
                    ? "font-semibold text-blue-600"
                    : "text-gray-500"
                }`}
              >
                {day}
              </span>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition
                  ${
                    completed
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "border-gray-300 text-gray-400 bg-white"
                  }`}
              >
                {completed && <i className="fas fa-check" />}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          이번 주 {routines.filter((r) => r.completed).length}일 완료했어요!
        </p>
      </div>
    </div>
  );
}
