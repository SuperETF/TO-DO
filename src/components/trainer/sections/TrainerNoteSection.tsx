import { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import type { Database } from "../../../types/supabase.ts";

type NoteInsert = Database["public"]["Tables"]["trainer_notes"]["Insert"];

export interface TrainerNoteSectionProps {
  memberId: string;
  onSaved?: () => void;
}

export default function TrainerNoteSection({ memberId, onSaved }: TrainerNoteSectionProps) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const handleSave = async () => {
    if (!note.trim()) {
      setToast("메모 내용을 입력해주세요.");
      setToastType("error");
      setTimeout(() => setToast(""), 2000);
      return;
    }

    setLoading(true);

    const payload: NoteInsert = {
      member_id: memberId,
      note,
    };

    const { error } = await supabase.from("trainer_notes").insert(payload);

    if (error) {
      setToast("❌ 저장 실패: " + error.message);
      setToastType("error");
    } else {
      setToast("✅ 메모 저장 완료");
      setToastType("success");
      setNote("");
      if (onSaved) onSaved();
    }

    setLoading(false);
    setTimeout(() => setToast(""), 2500);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm px-5 py-6">
      {/* 피드백 알림 */}
      {toast && (
        <div
          className={`mb-3 px-3 py-2 rounded-lg flex items-center text-sm font-medium transition-all duration-300
            ${toastType === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
            }`}
        >
          <i
            className={`mr-2 text-base ${toastType === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle"}`}
          />
          <span>{toast}</span>
        </div>
      )}

      <h3 className="font-semibold text-gray-800 mb-2">트레이너 메모</h3>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="회원에 대한 관찰, 이슈, 다음 운동 계획 등"
        rows={4}
        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 text-sm transition"
      />
      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition disabled:opacity-50 flex justify-center items-center"
      >
        {loading ? (
          <>
            <span className="inline-block animate-spin mr-2">
              <i className="fas fa-circle-notch"></i>
            </span>
            저장 중...
          </>
        ) : (
          <>
            <i className="fas fa-save mr-2"></i> 메모 저장
          </>
        )}
      </button>
    </div>
  );
}
