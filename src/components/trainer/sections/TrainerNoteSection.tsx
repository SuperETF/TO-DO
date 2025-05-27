import { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import type { Database } from "../../../types/supabase";

type NoteInsert = Database["public"]["Tables"]["trainer_notes"]["Insert"];

interface TrainerNoteSectionProps {
  memberId: string;
}

export default function TrainerNoteSection({ memberId }: TrainerNoteSectionProps) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const handleSave = async () => {
    if (!note.trim()) {
      setToast("메모 내용을 입력해주세요.");
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
    } else {
      setToast("✅ 메모 저장 완료");
      setNote("");
    }

    setLoading(false);
    setTimeout(() => setToast(""), 3000);
  };

  return (
    <div className="space-y-4 border-t pt-4 mt-4">
      <h3 className="font-semibold text-gray-700">트레이너 메모</h3>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="회원에 대한 관찰, 이슈, 다음 운동 계획 등"
        rows={4}
        className="w-full px-4 py-2 border border-gray-300 rounded-md"
      />
      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-2 rounded-lg disabled:opacity-50"
      >
        {loading ? "저장 중..." : "메모 저장"}
      </button>
      {toast && (
        <p className="text-center text-sm text-green-600 transition-opacity duration-300">
          {toast}
        </p>
      )}
    </div>
  );
}
