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
    <section className="bg-white rounded-2xl w-full px-8 py-8 mb-6">
      {/* 피드백 토스트 */}
      {toast && (
        <div
          className="mb-3 px-3 py-2 rounded-lg flex items-center justify-center text-sm font-medium bg-green-100 text-green-700"
        >
          <i className="fas fa-check-circle mr-2" />
          <span>{toast}</span>
        </div>
      )}

      <div className="mb-6 flex items-center gap-2">
        <i className="fas fa-flag-checkered text-blue-500" />
        <h3 className="font-bold text-xl text-gray-800">이달의 미션</h3>
      </div>

      {missions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <i className="fas fa-tasks text-4xl mb-2" />
          <p className="mt-2">이번 달 미션이 아직 등록되지 않았습니다.</p>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {missions.map((mission) => (
              <li
                key={mission.id}
                className={`flex items-start bg-gray-50 rounded-xl p-4 transition ${
                  isCompleted(mission.id)
                    ? "border-2 border-blue-500 bg-blue-50"
                    : "border border-gray-100"
                }`}
              >
                <button
                  className={`mt-1 w-7 h-7 rounded-full flex items-center justify-center border-2 mr-4 transition
                    ${isCompleted(mission.id)
                      ? "bg-blue-500 border-blue-500"
                      : "bg-white border-gray-300"
                    }`}
                  disabled={loading}
                  onClick={() => handleToggle(mission.id)}
                  aria-label="미션 완료 토글"
                >
                  {isCompleted(mission.id) ? (
                    <i className="fas fa-check text-white text-lg" />
                  ) : (
                    <i className="fas fa-circle text-gray-300 text-lg" />
                  )}
                </button>
                <div className="flex-1">
                  <p className={`font-semibold text-base ${
                    isCompleted(mission.id) ? "text-blue-600" : "text-gray-800"
                  }`}>
                    {mission.title}
                  </p>
                  {mission.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{mission.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 text-center">
            <div className="text-sm text-gray-700 font-medium mb-2">
              <span className="font-bold text-blue-600">{completedCount}</span>
              <span className="mx-1">/</span>
              <span>{missions.length}</span>
              <span className="ml-1">개 완료됨</span>
            </div>
            {allCompleted && (
              <div className="bg-yellow-100 text-yellow-800 text-sm font-semibold py-2 px-4 rounded-lg mt-3 flex items-center justify-center">
                <i className="fas fa-crown mr-2" />
                🎉 이달의 모든 미션을 완료했어요! 레벨업 + 마일리지 적립!
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
