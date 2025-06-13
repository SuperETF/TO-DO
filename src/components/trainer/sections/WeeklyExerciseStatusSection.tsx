import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

interface Props {
  memberId: string;
  totalWeeks?: number; // 기본값 12
}

interface WeeklyItem {
  week: number;
  sortOrders: number[];
  completedOrders: number[];
}

export default function WeeklyExerciseStatusSection({ memberId }: Props) {
  const [status, setStatus] = useState<WeeklyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      const { data: logs } = await supabase
        .from("workout_logs")
        .select("week, sort_order")
        .eq("member_id", memberId)
        .eq("type", "weekly")
        .eq("is_completed", true);

      const { data: workouts } = await supabase
        .from("recommended_workouts")
        .select("week, sort_order");

      const grouped: Record<number, WeeklyItem> = {};

      workouts?.forEach(({ week, sort_order }) => {
        const w = Number(week);
        const s = Number(sort_order);
        if (!grouped[w]) grouped[w] = { week: w, sortOrders: [], completedOrders: [] };
        grouped[w].sortOrders.push(s);
      });

      logs?.forEach(({ week, sort_order }) => {
        const w = Number(week);
        const s = Number(sort_order);
        if (!grouped[w]) grouped[w] = { week: w, sortOrders: [], completedOrders: [] };
        if (!grouped[w].completedOrders.includes(s)) grouped[w].completedOrders.push(s);
      });

      setStatus(Object.values(grouped).sort((a, b) => a.week - b.week));
      setLoading(false);
    };

    fetchStatus();
  }, [memberId]);

  if (loading) return <div className="text-sm text-gray-400">주차별 완료 상태 로딩 중...</div>;

  return (
    <section className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <h2 className="text-lg font-semibold mb-3">주차별 운동 완료 현황</h2>
      <div className="space-y-4">
        {status.map(({ week, sortOrders, completedOrders }) => (
          <div key={week}>
            <h3 className="text-sm font-medium mb-1">{week}주차</h3>
            <div className="flex flex-wrap gap-2">
              {sortOrders.map((order) => {
                const isCompleted = completedOrders.includes(order);
                return (
                  <div
                    key={order}
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${
                      isCompleted
                        ? "bg-teal-500 text-white border-teal-500"
                        : "bg-gray-100 text-gray-400 border-gray-300"
                    }`}
                  >
                    {order}번 영상
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}