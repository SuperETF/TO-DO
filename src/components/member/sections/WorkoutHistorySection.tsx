import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

interface Props {
  memberId: string;
}

interface WorkoutLog {
  id: string;
  date: string;
  workout_notes: string | null;
  pain_score: number | null;
  is_completed: boolean | null;
}

export default function WorkoutHistorySection({ memberId }: Props) {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from("workout_logs")
        .select("id, date, workout_notes, pain_score, is_completed")
        .eq("member_id", memberId)
        .order("date", { ascending: false })
        .limit(10);

      if (!error && data) {
        setLogs(data);
      }

      setLoading(false);
    };

    if (memberId) fetchLogs();
  }, [memberId]);

  return (
    <section className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <h2 className="text-lg font-semibold mb-3">운동 히스토리</h2>
      {loading ? (
        <p className="text-sm text-gray-500">불러오는 중...</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-gray-500">운동 기록이 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <div
              key={log.id}
              className="border-l-2 border-teal-500 pl-3"
            >
              <h3 className="font-medium">{log.workout_notes || "운동 기록"}</h3>
              <p className="text-sm text-gray-600">
                {formatDate(log.date)}
              </p>
              <div className="flex items-center mt-1">
                {log.pain_score !== null && (
                  <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full mr-2">
                    통증 {log.pain_score}점
                  </span>
                )}
                {log.is_completed && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    완료
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}
