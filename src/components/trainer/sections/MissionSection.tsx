import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import type { Database } from "../../../types/supabase.ts";

type Mission = Database["public"]["Tables"]["monthly_missions"]["Row"];
type MissionLog = Database["public"]["Tables"]["mission_logs"]["Row"];
type MissionLogInsert = Database["public"]["Tables"]["mission_logs"]["Insert"];

interface Props {
  memberId: string;
}

export default function MissionSection({ memberId }: Props) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [logs, setLogs] = useState<MissionLog[]>([]);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);

  const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

  useEffect(() => {
    const fetchMissionsAndLogs = async () => {
      const [missionRes, logRes] = await Promise.all([
        supabase
          .from("monthly_missions")
          .select("*")
          .eq("month", currentMonth)
          .order("created_at", { ascending: true }),
        supabase
          .from("mission_logs")
          .select("*")
          .eq("member_id", memberId),
      ]);

      if (missionRes.data) setMissions(missionRes.data);
      if (logRes.data) setLogs(logRes.data);
    };

    if (memberId) fetchMissionsAndLogs();
  }, [memberId]);

  const isCompleted = (missionId: string) =>
    logs.some((log) => log.mission_id === missionId && log.is_completed);

  const handleToggle = async (missionId: string) => {
    setLoading(true);

    const existing = logs.find((log) => log.mission_id === missionId);
    const isNowComplete = !existing?.is_completed;

    const payload: MissionLogInsert = {
      member_id: memberId,
      mission_id: missionId,
      is_completed: isNowComplete,
    };

    const { error, data } = await supabase
      .from("mission_logs")
      .upsert(payload, { onConflict: "member_id, mission_id" })
      .select()
      .single();

    if (error) {
      setToast("❌ 저장 실패: " + error.message);
    } else if (data) {
      setLogs((prev) => {
        const exists = prev.some((log) => log.mission_id === missionId);
        if (exists) {
          return prev.map((log) =>
            log.mission_id === missionId ? { ...log, is_completed: isNowComplete } : log
          );
        } else {
          return [...prev, data];
        }
      });
      setToast("✅ 미션 업데이트 완료");
    }

    setLoading(false);
    setTimeout(() => setToast(""), 3000);
  };

  const completedCount = missions.filter((m) => isCompleted(m.id)).length;
  const allCompleted = missions.length > 0 && completedCount === missions.length;

  return (
    <div className="space-y-4 border-t pt-4 mt-4">
      <h3 className="font-semibold text-gray-700">이달의 미션</h3>

      <ul className="space-y-2">
        {missions.map((mission) => (
          <li
            key={mission.id}
            className="flex items-center justify-between bg-gray-50 p-3 rounded-md"
          >
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!isCompleted(mission.id)}
                onChange={() => handleToggle(mission.id)}
                disabled={loading}
              />
              <div>
                <p className="font-medium">{mission.title}</p>
                {mission.description && (
                  <p className="text-sm text-gray-500">{mission.description}</p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="text-sm text-gray-600 text-center">
        {completedCount}/{missions.length}개 완료됨
      </div>

      {allCompleted && (
        <div className="bg-yellow-100 text-yellow-800 text-sm text-center font-semibold py-2 rounded-lg">
          🎉 이달의 모든 미션을 완료했어요! 레벨업 + 마일리지 적립!
        </div>
      )}

      {toast && (
        <p className="text-center text-sm text-green-600 transition-opacity duration-300">
          {toast}
        </p>
      )}
    </div>
  );
}
