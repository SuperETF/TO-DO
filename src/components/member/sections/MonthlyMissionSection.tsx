import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

interface Props {
  memberId: string;
  refetch?: () => Promise<void>; // ✅ props 타입 정의
}

interface MissionLog {
  mission_id: string;
  is_completed: boolean;
  title: string;
}

export default function MonthlyMissionSection({ memberId, refetch }: Props) {
  const [missions, setMissions] = useState<MissionLog[]>([]);
  const [visible, setVisible] = useState<MissionLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMissions = async () => {
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
        title: l.monthly_missions?.title ?? "", // ✅ 안전 처리
      }));

      setMissions(formatted);
      setVisible(formatted.filter((m) => !m.is_completed).slice(0, 3));
    }

    setLoading(false);
  };

  useEffect(() => {
    if (memberId) fetchMissions();
  }, [memberId]);

  const completedCount = missions.filter((m) => m.is_completed).length;
  const total = missions.length;
  const percent = Math.round((completedCount / 8) * 100); // 총 8개 기준

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
      setVisible(updated.filter((m) => !m.is_completed).slice(0, 3));
      if (refetch) await refetch(); // ✅ 상위에서 받은 refetch 사용
    }
  };

  return (
    <section className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <h2 className="text-lg font-semibold mb-3">이달의 미션</h2>

      {/* 진행률 게이지 */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
        <div
          className="h-3 bg-teal-500 rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        ></div>
      </div>
      <p className="text-sm text-center text-gray-600 mb-4">
        달성률: <span className="font-semibold text-teal-600">{percent}%</span>
      </p>

      {/* 미션 카드 */}
      {visible.map((mission) => (
        <div key={mission.mission_id} className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-800">{mission.title}</span>
            <button
              className="text-sm text-indigo-600 hover:underline"
              onClick={() => handleComplete(mission.mission_id)}
              disabled={mission.is_completed}
            >
              완료하기
            </button>
          </div>
        </div>
      ))}

      {/* 축하 메시지 */}
      {completedCount === total && total > 0 && (
        <div className="mt-4 text-center text-sm text-green-600 font-medium">
          🎉 모든 미션을 완료했어요!
        </div>
      )}
    </section>
  );
}
