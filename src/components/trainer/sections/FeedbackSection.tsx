import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import type { Database } from "../../../types/supabase";

type FeedbackInsert = Database["public"]["Tables"]["feedbacks"]["Insert"];

interface Props {
  memberId: string;
}

export default function FeedbackSection({ memberId }: Props) {
  const [satisfaction, setSatisfaction] = useState(3);
  const [comment, setComment] = useState("");
  const [hasPain, setHasPain] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const today: string = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const fetchLatest = async () => {
      const { data } = await supabase
        .from("feedbacks")
        .select("*")
        .eq("member_id", memberId)
        .eq("date", today)
        .single();

      if (data) {
        setSatisfaction(data.satisfaction ?? 3);
        setComment(data.comment ?? "");
        setHasPain(data.has_pain ?? false);
      }
    };

    if (memberId) fetchLatest();
  }, [memberId, today]);

  const handleSubmit = async () => {
    if (!comment.trim()) {
      setToast("❗️의견을 입력해주세요.");
      return;
    }

    setLoading(true);

    const payload: FeedbackInsert = {
      member_id: memberId,
      date: today,
      satisfaction,
      comment,
      has_pain: hasPain,
    };

    const { error } = await supabase.from("feedbacks").upsert(payload, {
      onConflict: "member_id, date",
    });

    if (error) {
      setToast("❌ 저장 실패: " + error.message);
    } else {
      setToast("✅ 피드백 저장 완료");
    }

    setLoading(false);
    setTimeout(() => setToast(""), 3000);
  };

  return (
    <div className="space-y-4 border-t pt-4 mt-4">
      <h3 className="font-semibold text-gray-700">피드백</h3>

      <div>
        <label className="block text-sm text-gray-600 mb-1">
          만족도: {satisfaction}/5
        </label>
        <input
          type="range"
          min={1}
          max={5}
          value={satisfaction}
          onChange={(e) => setSatisfaction(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="회원 피드백, 불편 사항, 변화 등"
        rows={3}
        className="w-full px-4 py-2 border border-gray-300 rounded-md"
      />

      <label className="inline-flex items-center space-x-2 text-sm">
        <input
          type="checkbox"
          checked={hasPain}
          onChange={(e) => setHasPain(e.target.checked)}
        />
        <span>통증 있음</span>
      </label>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-2 rounded-lg disabled:opacity-50"
      >
        {loading ? "저장 중..." : "저장하기"}
      </button>

      {toast && (
        <p className="text-center text-sm text-green-600">{toast}</p>
      )}
    </div>
  );
}
