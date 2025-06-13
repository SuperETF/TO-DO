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
  const [recentLogs, setRecentLogs] = useState<PainLog[]>([]);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [editId, setEditId] = useState<string | null>(null);

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from("pain_logs")
      .select("id, date, pain_score, pain_area, source")
      .eq("member_id", memberId)
      .order("date", { ascending: false })
      .limit(50);

    if (error) {
      console.error("❌ 통증 기록 불러오기 실패:", error);
      return;
    }

    setRecentLogs(data ?? []);
  };

  useEffect(() => {
    if (memberId) fetchLogs();
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
      source: "trainer",
    };

    const { error } = await supabase.from("pain_logs").insert(payload);

    if (error) {
      console.error("❌ 저장 실패:", error);
      showToast(`❌ 저장 실패: ${error.message}`, "error");
    } else {
      showToast("✅ 통증 기록 저장 완료", "success");
      setEditId(null);
      await fetchLogs();
      setDate(new Date().toISOString().slice(0, 10));
      setScore(0);
      setArea("");
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("pain_logs").delete().eq("id", id);

    if (error) {
      showToast("❌ 삭제 실패", "error");
    } else {
      showToast("🗑️ 삭제 완료", "success");
      await fetchLogs();
      if (editId === id) {
        setEditId(null);
        setDate(new Date().toISOString().slice(0, 10));
        setScore(0);
        setArea("");
      }
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
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1">날짜</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1">통증 점수 (0~10)</label>
          <select
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm"
          >
            {Array.from({ length: 11 }, (_, i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-1">통증 부위</label>
        <input
          type="text"
          placeholder="예: 허리, 무릎"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm"
        />
      </div>

      <button
        onClick={handleSave}
        className="w-full bg-indigo-600 text-white py-3 rounded-xl text-base font-semibold hover:bg-indigo-700 transition"
      >
        {editId ? "수정하기" : "기록 저장"}
      </button>

      <div>
        <h4 className="text-sm font-semibold mb-2">최근 통증 기록</h4>
        <div className="space-y-2 text-sm max-h-64 overflow-y-auto">
          {recentLogs.length === 0 && (
            <div className="text-gray-400">기록이 없습니다.</div>
          )}
          {recentLogs.map((log) => (
            <div key={log.id} className="flex justify-between items-center border-b pb-2">
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
                    setEditId(log.id);
                    setDate(log.date);
                    setScore(log.pain_score);
                    setArea(log.pain_area ?? "");
                  }}
                  className="text-gray-400 hover:text-indigo-600"
                >
                  <i className="fas fa-edit"></i>
                </button>
                <button
                  onClick={() => handleDelete(log.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {toast && (
        <div
          className={`text-sm text-center font-medium transition ${
            toastType === "success" ? "text-green-600" : "text-red-500"
          }`}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
