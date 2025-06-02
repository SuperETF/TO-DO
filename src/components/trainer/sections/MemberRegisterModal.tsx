import { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

interface MemberRegisterModalProps {
  open: boolean;
  onClose: () => void;
  trainerId?: string; // undefined 허용
  onSuccess?: () => void;
}

export default function MemberRegisterModal({
  open,
  onClose,
  trainerId,
  onSuccess,
}: MemberRegisterModalProps) {
  const [name, setName] = useState("");
  const [phoneLast4, setPhoneLast4] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length === 0 || phoneLast4.length !== 4) {
      setError("이름과 4자리 번호를 정확히 입력하세요.");
      return;
    }
    if (!trainerId || trainerId.length < 10) {
      setError("트레이너 정보가 올바르지 않습니다. 다시 로그인해 주세요.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("members").insert({
      name,
      phone_last4: phoneLast4,
      trainer_id: trainerId,
    });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setName("");
      setPhoneLast4("");
      onSuccess?.();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow-xl w-full max-w-xs"
        style={{ minWidth: 320 }}
      >
        <h2 className="text-lg font-bold mb-4 text-center">회원 등록</h2>
        <div className="mb-3">
          <label className="block mb-1 font-medium">이름</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="block mb-1 font-medium">4자리 번호</label>
          <input
            className="w-full border rounded px-3 py-2"
            maxLength={4}
            pattern="\d{4}"
            value={phoneLast4}
            onChange={e => setPhoneLast4(e.target.value.replace(/\D/g, ""))}
            required
          />
        </div>
        {error && <div className="text-red-600 text-xs mb-2">{error}</div>}
        <button
          type="submit"
          disabled={loading || !trainerId || trainerId.length < 10}
          className="w-full py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:bg-gray-300"
        >
          {loading ? "등록 중..." : "등록"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-2 py-2 rounded border border-gray-300 bg-gray-50 hover:bg-gray-100"
        >
          취소
        </button>
      </form>
    </div>
  );
}
