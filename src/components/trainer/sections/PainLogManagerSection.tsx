import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

interface Props {
  memberId: string;
}

interface PainLog {
  id: string;
  date: string;
  pain_score: number;
  pain_area?: string;
  source?: string;
}

export default function PainLogManagerSection({ memberId }: Props) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [score, setScore] = useState(0);
  const [area, setArea] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [recentLogs, setRecentLogs] = useState<PainLog[]>([]);

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from("pain_logs")
      .select("id, date, pain_score, pain_area, source")
      .eq("member_id", memberId)
      .order("date", { ascending: false })
      .limit(50);

    if (!error && data) setRecentLogs(data);
    else setRecentLogs([]);
  };

  useEffect(() => {
    if (memberId) fetchLogs();
  }, [memberId]);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(""), 2000);
  };

  const handleSave = async () => {
    if (!area.trim()) {
      showToast("통증 부위를 입력해주세요", "error");
      return;
    }
    setIsLoading(true);

    const payload = {
      member_id: memberId,
      date,
      pain_score: score,
      pain_area: area.trim(),
      source: "trainer",
    };

    const { error } = await supabase.from("pain_logs").insert(payload);
    setIsLoading(false);

    if (error) {
      showToast(`저장 실패: ${error.message}`, "error");
    } else {
      showToast("통증 기록이 저장되었습니다", "success");
      setArea("");
      setScore(0);
      setDate(new Date().toISOString().slice(0, 10));
      fetchLogs();
    }
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    const { error } = await supabase.from("pain_logs").delete().eq("id", id);
    setIsLoading(false);
    if (error) {
      showToast("삭제 실패", "error");
    } else {
      showToast("통증 기록이 삭제되었습니다", "error");
      fetchLogs();
    }
  };

  const getPainScoreColor = (score: number) => {
    if (score <= 3) return "text-green-500";
    if (score <= 6) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      {/* 피드백 알림 */}
      {toast && (
        <div
          className={`fixed top-14 left-0 right-0 mx-auto w-11/12 p-3 rounded-lg shadow-lg z-50 transition-all duration-300 ${
            toastType === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          <p className="text-center font-medium">{toast}</p>
        </div>
      )}

      {/* 메인 카드 */}
      <div className="pt-2 pb-50 px-4">
        {/* 통증 기록 입력 카드 */}
        <div className="bg-white rounded-xl shadow-md p-5 mt-4">
          <h2 className="text-lg font-medium mb-4">새 통증 기록</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <i className="fas fa-calendar-alt absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">통증 점수</label>
              <div className="relative">
                <select
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm cursor-pointer"
                >
                  {[...Array(11)].map((_, i) => (
                    <option key={i} value={i}>
                      {i} {i <= 3 ? "(약함)" : i <= 6 ? "(중간)" : "(심함)"}
                    </option>
                  ))}
                </select>
                <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              </div>
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">통증 부위</label>
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="예: 오른쪽 어깨, 허리 하단부"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 cursor-pointer flex justify-center items-center"
          >
            {isLoading ? (
              <span className="inline-block animate-spin mr-2">
                <i className="fas fa-circle-notch"></i>
              </span>
            ) : (
              <i className="fas fa-save mr-2"></i>
            )}
            {isLoading ? "저장 중..." : "통증 기록 저장하기"}
          </button>
        </div>

        {/* 최근 기록 리스트 (5개만 표시, 스크롤) */}
        <div className="mt-6">
          <h2 className="text-lg font-medium mb-3">최근 통증 기록</h2>
          {recentLogs.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-5 text-center text-gray-500">
              <i className="fas fa-clipboard-list text-3xl mb-2"></i>
              <p>아직 기록된 통증 내역이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-100 overflow-y-auto">
            {recentLogs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center">
                    <div className="text-gray-500 text-sm">
                      <i className="far fa-calendar-alt mr-1"></i>
                      {new Date(log.date).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                  <div className="font-medium mt-1">{log.pain_area}</div>
                </div>
                <div className="flex items-center">
                  <div className={`text-lg font-bold mr-4 ${getPainScoreColor(log.pain_score)}`}>
                    {log.pain_score}
                  </div>
                  <button
                    onClick={() => handleDelete(log.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                    aria-label="통증 기록 삭제"
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          )}
        </div>
      </div>
    </div>
  );
}
