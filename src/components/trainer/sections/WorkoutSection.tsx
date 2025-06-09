import { useEffect, useRef, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import type { Database } from "../../../types/supabase.ts";

// WorkoutInsert 확장
// 👇 여기는 수정 X
type WorkoutInsert = Omit<Database["public"]["Tables"]["workouts"]["Insert"], "trainer_id"> & {
  trainer_id?: string | null;
};
type WorkoutRow = Database["public"]["Tables"]["workouts"]["Row"];

export interface WorkoutSectionProps {
  onSaved?: () => void;
  memberId: string;
}

export default function WorkoutSection({ onSaved, memberId }: WorkoutSectionProps) {
  const [date, setDate] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [editId, setEditId] = useState<string | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutRow[]>([]);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);

  const fetchTrainerId = async () => {
    const { data, error } = await supabase
      .from("members")
      .select("trainer_id")
      .eq("id", memberId)
      .single();

    if (error) {
      console.error("Error fetching trainer_id:", error);
    } else {
      if (data?.trainer_id && typeof data.trainer_id === "string") {
        setTrainerId(data.trainer_id);
      } else {
        setTrainerId(null);
      }
    }
  };

  const fetchWorkouts = async () => {
    const { data, error } = await supabase
      .from("workouts")
      .select("*")
      .eq("member_id", memberId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching workouts:", error);
      setWorkouts([]);
    } else {
      setWorkouts(data ?? []);
    }
  };

  useEffect(() => {
    fetchTrainerId();
    fetchWorkouts();
  }, [memberId]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast(msg);
    setToastType(type);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(""), 2500);
  };

  const handleSave = async () => {
    if (!date.trim() || !content.trim()) {
      showToast("⚠️ 날짜와 운동 기록을 모두 입력해주세요.", "error");
      return;
    }
  
    // ✅ 여기에 추가
    if (
      !trainerId ||
      typeof trainerId !== "string" ||
      !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(trainerId)
    ) {
      showToast("❌ 유효하지 않은 트레이너 ID입니다.", "error");
      return;
    }
  
    setLoading(true);
  
    const payload: WorkoutInsert = {
      member_id: memberId,
      trainer_id: trainerId,
      date,
      title: content,
    };
  
    const finalPayload = editId ? { ...payload, id: editId } : payload;
  
    console.log("✅ 최종 저장 payload:", finalPayload);
  
    const { error } = await supabase.from("workouts").upsert([finalPayload]);



    if (error) {
      showToast("❌ 저장 실패: " + error.message, "error");
    } else {
      showToast(editId ? "✅ 운동 기록 수정 완료" : "✅ 운동 기록 저장 완료", "success");
      setDate("");
      setContent("");
      setEditId(null);
      await fetchWorkouts();
      onSaved?.();
    }

    setLoading(false);
  };

  const handleEdit = (w: WorkoutRow) => {
    setDate(w.date ?? "");
    setContent(w.title ?? "");
    setEditId(w.id);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    const { error } = await supabase.from("workouts").delete().eq("id", id);
    if (error) {
      showToast("❌ 삭제 실패", "error");
    } else {
      showToast("🗑️ 삭제 완료", "success");
      await fetchWorkouts();
    }
    setLoading(false);
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
          placeholder={
            "오늘의 운동 프로그램을 자유롭게 작성해주세요.\n예시)\n1. 스쿼트 20회 3세트\n2. 데드리프트 15회 4세트"
          }
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
                <span className="text-xs text-gray-400">{w.date ?? "날짜 없음"}</span>
                <span>{w.title}</span>
              </div>
              <div className="flex space-x-2 pt-1">
                <button
                  onClick={() => handleEdit(w)}
                  className="text-gray-400 hover:text-indigo-600"
                  aria-label="운동 수정"
                >
                  <i className="fas fa-edit" />
                </button>
                <button
                  onClick={() => handleDelete(w.id)}
                  className="text-gray-400 hover:text-red-600"
                  aria-label="운동 삭제"
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
