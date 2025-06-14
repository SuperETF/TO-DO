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

  // 스켈레톤 카드
  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl shadow p-5 mb-4 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div className="flex gap-2">
        <div className="h-8 bg-gray-200 rounded w-20"></div>
        <div className="h-8 bg-gray-200 rounded w-20"></div>
        <div className="h-8 bg-gray-200 rounded w-20"></div>
      </div>
    </div>
  );

  // 미션 없음 Empty
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <i className="fas fa-dumbbell text-6xl mb-6 text-gray-200" />
      <h3 className="text-lg font-medium text-gray-700 mb-2">
        아직 등록된 미션이 없습니다
      </h3>
      <p className="text-sm text-gray-500 max-w-xs">
        운동 미션이 등록되면 이곳에서 주차별 진행 상황을 확인할 수 있습니다.
      </p>
    </div>
  );

  return (
    <section className="w-full">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-1">주차별 운동 완료 현황</h2>
        <p className="text-sm text-gray-500">
          각 주차별 운동 미션의 진행 상태를 확인하세요.
        </p>
      </div>
      <div className="space-y-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : status.length === 0 ? (
          <EmptyState />
        ) : (
          status.map(({ week, sortOrders, completedOrders }) => (
            <div
              key={week}
              className="bg-white rounded-2xl shadow p-5 transition-all duration-200 hover:shadow-md"
            >
              <h3 className="text-lg font-bold mb-3">{week}주차</h3>
              <div className="flex flex-wrap gap-3">
                {sortOrders.map((order) => {
                  const isCompleted = completedOrders.includes(order);
                  return (
                    <div
                      key={order}
                      className={`flex items-center px-4 py-2 rounded-full font-medium text-sm transition 
                        ${isCompleted
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-600"
                        }`}
                    >
                      <span className="mr-2">{order}번 영상</span>
                      {isCompleted ? (
                        <i className="fas fa-check-circle ml-1 text-white" />
                      ) : (
                        <i className="far fa-circle ml-1" />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 text-xs text-gray-500">
                {sortOrders.filter((o) => completedOrders.includes(o)).length} / {sortOrders.length} 개 완료
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
