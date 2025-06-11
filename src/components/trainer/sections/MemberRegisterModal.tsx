// src/components/trainer/sections/MemberRegisterModal.tsx

import { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

interface MemberRegisterModalProps {
  open: boolean;
  onClose: () => void;
  trainerId?: string;
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
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 space-y-5"
      >
        <h2 className="text-center text-lg font-bold text-gray-800">회원 등록</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
          <input
            className="w-full py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4EFF]"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">4자리 번호</label>
          <input
            className="w-full py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4EFF]"
            value={phoneLast4}
            onChange={(e) => setPhoneLast4(e.target.value.replace(/\D/g, ""))}
            maxLength={4}
            pattern="\d{4}"
            required
          />
        </div>

        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}

        <button
          type="submit"
          disabled={loading || !trainerId || trainerId.length < 10}
          className="w-full py-2 rounded-lg bg-[#6B4EFF] text-white font-medium hover:bg-[#5A3FFF] transition disabled:bg-gray-300"
        >
          {loading ? "등록 중..." : "회원 등록하기"}
        </button>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 text-sm text-gray-700 font-medium"
        >
          취소
        </button>
      </form>
    </div>
  );
}
