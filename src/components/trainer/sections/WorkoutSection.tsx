import { useEffect, useRef, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import type { Database } from "../../../types/supabase.ts";

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

  useEffect(() => {
    const fetchTrainerId = async () => {
      const { data } = await supabase
        .from("members")
        .select("trainer_id")
        .eq("id", memberId)
        .single();
      setTrainerId(typeof data?.trainer_id === "string" ? data.trainer_id : null);
    };
    const fetchWorkouts = async () => {
      const { data, error } = await supabase
        .from("workouts")
        .select("*")
        .eq("member_id", memberId)
        .order("created_at", { ascending: false });
      setWorkouts(!error && data ? data : []);
    };
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
      showToast("날짜와 운동 기록을 모두 입력해주세요.", "error");
      return;
    }
    if (!trainerId || typeof trainerId !== "string") {
      showToast("유효하지 않은 트레이너 ID입니다.", "error");
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
    const { error } = await supabase.from("workouts").upsert([finalPayload]);
    setLoading(false);
    if (error) {
      showToast("저장 실패: " + error.message, "error");
    } else {
      showToast(editId ? "운동 기록이 수정되었습니다" : "운동 기록이 저장되었습니다", "success");
      setDate("");
      setContent("");
      setEditId(null);
      await supabase
        .from("workouts")
        .select("*")
        .eq("member_id", memberId)
        .order("created_at", { ascending: false })
        .then(({ data, error }) => setWorkouts(!error && data ? data : []));
      onSaved?.();
    }
  };

  const handleEdit = (w: WorkoutRow) => {
    setDate(w.date ?? "");
    setContent(w.title ?? "");
    setEditId(w.id);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    const { error } = await supabase.from("workouts").delete().eq("id", id);
    setLoading(false);
    if (error) {
      showToast("삭제 실패", "error");
    } else {
      showToast("운동 기록이 삭제되었습니다", "error");
      await supabase
        .from("workouts")
        .select("*")
        .eq("member_id", memberId)
        .order("created_at", { ascending: false })
        .then(({ data, error }) => setWorkouts(!error && data ? data : []));
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "날짜 없음";
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    };
    return new Date(dateString).toLocaleDateString("ko-KR", options);
  };

  return (
    <div className="bg-white rounded-2xl w-full px-8 py-8">
      {/* 알림 메시지 */}
      {toast && (
        <div
          className={`fixed top-14 left-0 right-0 mx-auto w-[90%] max-w-sm p-3 rounded-lg shadow-md z-50 text-center text-white ${
            toastType === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {toast}
        </div>
      )}

      {/* 입력 폼 */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        <h2 className="text-lg font-medium text-gray-800 mb-4">
          {editId ? "운동 기록 수정" : "운동 기록 추가"}
        </h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            날짜
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            운동 내용
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="오늘의 운동 내용을 입력하세요"
            className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm min-h-[80px]"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 ease-in-out"
        >
          {editId ? "수정 완료" : loading ? "저장 중..." : "저장하기"}
        </button>
        {editId && (
          <button
            type="button"
            onClick={() => {
              setEditId(null);
              setContent("");
              setDate("");
            }}
            className="w-full mt-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2.5 px-4 rounded-lg transition duration-200 ease-in-out"
          >
            취소
          </button>
        )}
      </form>

      {/* 최근 운동 기록 리스트 */}
      <div className="pt-8">
        <h2 className="text-lg font-medium text-gray-800 mb-4">
          최근 운동 기록
        </h2>
        {workouts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <i className="fas fa-dumbbell text-3xl mb-2"></i>
            <p>아직 운동 기록이 없습니다</p>
            <p className="text-sm mt-1">첫 운동 기록을 추가해보세요!</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {workouts.map((w) => (
              <li key={w.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">
                      {formatDate(w.date ?? "")}
                    </p>
                    <p className="text-gray-800">{w.title}</p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(w)}
                      className="text-gray-400 hover:text-blue-500 transition-colors cursor-pointer"
                      aria-label="운동 수정"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => handleDelete(w.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                      aria-label="운동 삭제"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
