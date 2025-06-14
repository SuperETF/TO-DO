import { useState } from "react";
import { supabase } from "./src/lib/supabaseClient";

export default function DescriptionEditModal({
  recId,
  initialDescription,
  onClose,
  onSaved,
}: {
  recId: string;
  initialDescription?: string;
  onClose: () => void;
  onSaved: (desc: string) => void;
}) {
  const [desc, setDesc] = useState(initialDescription || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await supabase
      .from("member_recommendations")
      .update({ description: desc })
      .eq("id", recId);
    setLoading(false);
    onSaved(desc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-6">
        <div className="flex flex-col items-center">
          <div className="text-2xl font-bold text-gray-900 mb-1">설명 입력</div>
          <div className="text-sm text-gray-500 mb-3">
            운동에 대한 추가 설명이나 당부사항을 자유롭게 적어주세요.
          </div>
        </div>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="
            w-full min-h-[96px] px-4 py-3 rounded-xl bg-gray-50 text-gray-800
            placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-[#A259F7] transition
            resize-none
          "
          placeholder="예: 3세트 15회씩 반복하세요"
          spellCheck={false}
          autoFocus
        />
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-[#A259F7] hover:text-[#8F43E9] font-semibold px-3 py-1 transition"
            tabIndex={-1}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={loading || desc.trim() === ""}
            className={`
              bg-[#A259F7] hover:bg-[#8F43E9] text-white font-bold px-5 py-2 rounded-xl text-base transition
              disabled:bg-purple-200 disabled:cursor-not-allowed
            `}
          >
            {loading ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
