import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

export interface MonthlyMissionSectionProps {
  memberId: string;
  refetch?: () => Promise<void>;
}

interface MissionLog {
  mission_id: string;
  is_completed: boolean;
  title: string;
}

export default function MonthlyMissionSection({
  memberId,
  refetch,
}: MonthlyMissionSectionProps) {
  const [missions, setMissions] = useState<MissionLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMissions = async () => {
    setLoading(true);
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const { data: logs, error } = await supabase
      .from("mission_logs")
      .select("is_completed, mission_id, monthly_missions(title)")
      .eq("member_id", memberId)
      .eq("assigned_month", currentMonth);

    if (!error && logs) {
      const formatted: MissionLog[] = logs.map((l: any) => ({
        mission_id: l.mission_id,
        is_completed: l.is_completed,
        title: l.monthly_missions?.title ?? "",
      }));

      setMissions(formatted);
    } else {
      setMissions([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (memberId) fetchMissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId]);

  const completedCount = missions.filter((m) => m.is_completed).length;
  const total = missions.length;
  // 총 미션 개수가 0일 때 0%로 처리
  const percent = total === 0 ? 0 : Math.round((completedCount / total) * 100);

  const handleComplete = async (missionId: string) => {
    const { error } = await supabase
      .from("mission_logs")
      .update({ is_completed: true })
      .eq("mission_id", missionId)
      .eq("member_id", memberId);

    if (!error) {
      const updated = missions.map((m) =>
        m.mission_id === missionId ? { ...m, is_completed: true } : m
      );
      setMissions(updated);
      if (refetch) await refetch();
    }
  };

  // 최대 3개까지 미완료 미션 노출
  const visible = missions.filter((m) => !m.is_completed).slice(0, 3);

  return (
    <section className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <h2 className="text-lg font-semibold mb-3">이달의 미션</h2>
      <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
        <div
          className="h-3 bg-teal-500 rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        ></div>
      </div>
      <p className="text-sm text-center text-gray-600 mb-4">
        달성률: <span className="font-semibold text-teal-600">{percent}%</span>
      </p>

      {loading ? (
        <div className="text-center text-gray-400 py-4">로딩 중...</div>
      ) : total === 0 ? (
        <div className="text-center text-gray-400 py-4">등록된 미션이 없습니다.</div>
      ) : (
        visible.map((mission) => (
          <div key={mission.mission_id} className="mb-4">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-800">{mission.title}</span>
              <button
                className="text-sm text-indigo-600 hover:underline disabled:text-gray-300"
                onClick={() => handleComplete(mission.mission_id)}
                disabled={mission.is_completed}
              >
                완료하기
              </button>
            </div>
          </div>
        ))
      )}

      {completedCount === total && total > 0 && (
        <div className="mt-4 text-center text-sm text-green-600 font-medium">
          🎉 모든 미션을 완료했어요!
        </div>
      )}
    </section>
  );
}
