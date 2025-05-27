import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

interface Props {
  memberId: string;
}

interface PainLog {
  date: string;
  pain_score: number;
  pain_area?: string;
}

export default function PainLogManagerSection({ memberId }: Props) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [score, setScore] = useState(0);
  const [area, setArea] = useState("");
  const [recentLogs, setRecentLogs] = useState<PainLog[]>([]);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [editKey, setEditKey] = useState<string | null>(null);

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from("pain_logs")
      .select("date, pain_score, pain_area")
      .eq("member_id", memberId)
      .order("date", { ascending: false })
      .limit(50);

    if (error) {
      console.error("❌ 통증 기록 불러오기 실패:", error);
      return;
    }

    if (data) setRecentLogs(data);
  };

  useEffect(() => {
    fetchLogs();
  }, [memberId]);

  const handleSave = async () => {
    const trimmedArea = area.trim();
    if (!trimmedArea) {
      showToast("❌ 통증 부위를 입력해주세요", "error");
      return;
    }

    const payload = {
      member_id: memberId,
      date,
      pain_score: score,
      pain_area: trimmedArea,
    };

    const { error } = await supabase
      .from("pain_logs")
      .upsert([payload], {
        onConflict: "member_id,date,pain_area", // ✅ 문자열로
      });

    if (error) {
      console.error("❌ 저장 실패:", error);
      showToast(`❌ 저장 실패: ${error.message}`, "error");
    } else {
      showToast(editKey ? "✅ 수정 완료" : "✅ 통증 기록 저장 완료", "success");
      setEditKey(null);
      await fetchLogs();
    }
  };

  const handleDelete = async (targetDate: string, targetArea?: string) => {
    const { error } = await supabase
      .from("pain_logs")
      .delete()
      .eq("member_id", memberId)
      .eq("date", targetDate)
      .eq("pain_area", targetArea);

    if (error) {
      showToast("❌ 삭제 실패", "error");
    } else {
      showToast("🗑️ 삭제 완료", "success");
      await fetchLogs();
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast(message);
    setToastType(type);
    setTimeout(() => setToast(""), 2500);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 space-y-6">
      <h3 className="text-base font-bold text-gray-800">통증 점수 기록</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">날짜</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">통증 점수 (0~10)</label>
          <select
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            {[...Array(11)].map((_, i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 mb-1">통증 부위</label>
        <input
          type="text"
          placeholder="예: 허리, 무릎"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <button
        onClick={handleSave}
        className="w-full bg-[#4C51BF] text-white py-3 rounded-xl text-base font-semibold hover:bg-indigo-700 transition"
      >
        {editKey ? "수정하기" : "기록 저장"}
      </button>

      <div>
        <h4 className="text-sm font-semibold mb-2">최근 통증 기록</h4>
        <div className="space-y-2 text-sm max-h-64 overflow-y-auto">
          {recentLogs.map((log, i) => {
            const key = `${log.date}-${log.pain_area}`;
            return (
              <div key={key} className="flex justify-between items-center border-b border-gray-100 pb-2">
                <div>
                  <span>{log.date}</span>
                  {log.pain_area && (
                    <span className="ml-2 text-gray-500">({log.pain_area})</span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <span
                    className={
                      log.pain_score >= 7
                        ? "text-red-500"
                        : log.pain_score >= 4
                        ? "text-orange-500"
                        : "text-green-500"
                    }
                  >
                    {log.pain_score}점
                  </span>
                  <button
                    onClick={() => {
                      setEditKey(key);
                      setDate(log.date);
                      setScore(log.pain_score);
                      setArea(log.pain_area ?? "");
                    }}
                    className="text-gray-400 hover:text-indigo-600"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    onClick={() => handleDelete(log.date, log.pain_area)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {toast && (
        <div
          className={`text-sm text-center font-medium ${toastType === "success" ? "text-green-600" : "text-red-500"}`}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
