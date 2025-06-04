import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

interface Props {
  memberId: string;
}

interface WorkoutLog {
  id: string;
  date: string;
  title: string | null;
  feedback: string | null;
  pain_score: number | null;
  completed: boolean | null;
}

export default function WorkoutHistorySection({ memberId }: Props) {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from("workouts") // ✅ 테이블명 수정
        .select("id, date, title, feedback, pain_score, completed")
        .eq("member_id", memberId)
        .order("date", { ascending: false }); // ✅ 최신순

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
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {logs.map((log) => (
            <div key={log.id} className="border-l-2 border-teal-500 pl-3">
              <h3 className="font-medium text-base">{log.title || "운동 제목 없음"}</h3>
              <p className="text-sm text-gray-500 mb-1">{formatDate(log.date)}</p>

              {log.feedback && (
                <p className="text-sm text-gray-600 mb-1">{log.feedback}</p>
              )}

              <div className="flex flex-wrap items-center gap-2">
                {log.pain_score !== null && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                    통증 {log.pain_score}점
                  </span>
                )}
                {log.completed !== null && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      log.completed
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {log.completed ? "완료" : "미완료"}
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
