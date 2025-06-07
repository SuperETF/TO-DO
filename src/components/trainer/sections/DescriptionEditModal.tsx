// components/trainer/sections/DescriptionEditModal.tsx

import { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

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
      <div className="bg-white p-4 rounded-xl w-full max-w-md shadow-lg">
        <h3 className="font-bold mb-2">설명 입력</h3>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="w-full border rounded px-3 py-2 h-24"
          placeholder="예: 3세트 15회씩 반복하세요"
        />
        <div className="flex justify-end gap-2 mt-3">
          <button onClick={onClose} className="bg-gray-200 px-3 py-1 rounded">취소</button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-600 text-white px-3 py-1 rounded"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
