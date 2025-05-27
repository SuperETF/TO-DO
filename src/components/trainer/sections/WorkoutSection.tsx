import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import type { Database } from "../../../types/supabase";

type WorkoutInsert = Database["public"]["Tables"]["workouts"]["Insert"];
type WorkoutRow = Database["public"]["Tables"]["workouts"]["Row"];

interface WorkoutSectionProps {
  memberId: string;
}

export default function WorkoutSection({ memberId }: WorkoutSectionProps) {
  const [date, setDate] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [editId, setEditId] = useState<number | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutRow[]>([]);

  const fetchWorkouts = async () => {
    const { data } = await supabase
      .from("workouts")
      .select("*")
      .eq("member_id", memberId)
      .order("date", { ascending: false });

    if (data) setWorkouts(data);
  };

  useEffect(() => {
    fetchWorkouts();
  }, [memberId]);

  const handleSave = async () => {
    if (!date.trim() || !content.trim()) {
      setToast("⚠️ 날짜와 운동 기록을 모두 입력해주세요.");
      setToastType("error");
      return;
    }

    setLoading(true);

    const payload: WorkoutInsert = {
      member_id: memberId,
      date,
      title: content,
    };

    const { error } = await supabase
      .from("workouts")
      .upsert(editId ? { ...payload, id: editId } : payload);

    if (error) {
      setToast("❌ 저장 실패: " + error.message);
      setToastType("error");
    } else {
      setToast(editId ? "✅ 운동 기록 수정 완료" : "✅ 운동 기록 저장 완료");
      setToastType("success");
      setDate("");
      setContent("");
      setEditId(null);
      await fetchWorkouts();
    }

    setLoading(false);
    setTimeout(() => setToast(""), 3000);
  };

  const handleEdit = (w: WorkoutRow) => {
    setDate(w.date ?? "");
    setContent(w.title);
    setEditId(w.id);
  };

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from("workouts").delete().eq("id", id);
    if (error) {
      setToast("❌ 삭제 실패");
      setToastType("error");
    } else {
      setToast("🗑️ 삭제 완료");
      setToastType("success");
      await fetchWorkouts();
    }
    setTimeout(() => setToast(""), 3000);
  };

  return (
    <div className="p-4 space-y-5">
      <div className="space-y-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="오늘의 운동 프로그램을 자유롭게 작성해주세요.
예시)
1. 스쿼트 20회 3세트
2. 데드리프트 15회 4세트
3. 런지 좌우 각 15회 3세트
4. 플랭크 1분 3세트"
          rows={5}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm"
        />

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {editId ? "수정하기" : loading ? "저장 중..." : "저장하기"}
        </button>

        {toast && (
          <p
            className={`text-center text-sm font-medium ${
              toastType === "success" ? "text-green-600" : "text-red-500"
            }`}
          >
            {toast}
          </p>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-3">
        <h4 className="text-sm font-medium mb-2">최근 운동 기록</h4>
        <div className="space-y-2 text-sm">
          {workouts.map((w) => (
            <div
              key={w.id}
              className="flex justify-between items-start text-gray-700 border-b pb-2"
            >
              <div className="flex flex-col">
                <span className="text-xs text-gray-400">{w.date}</span>
                <span>{w.title}</span>
              </div>
              <div className="flex space-x-2 pt-1">
                <button
                  onClick={() => handleEdit(w)}
                  className="text-gray-400 hover:text-indigo-600"
                >
                  <i className="fas fa-edit" />
                </button>
                <button
                  onClick={() => handleDelete(w.id)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <i className="fas fa-trash" />
                </button>
              </div>
            </div>
          ))}
          {workouts.length === 0 && (
            <p className="text-gray-400 text-sm">운동 기록이 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}
