import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import type { Database } from "../../../types/supabase";

type ConditionInsert = Database["public"]["Tables"]["conditions"]["Insert"];

interface ConditionSectionProps {
  memberId: string;
  onSaved?: () => void; // ✅ 추가
}

export default function ConditionSection({ memberId }: ConditionSectionProps) {
  const [sleep, setSleep] = useState(5);
  const [pain, setPain] = useState(3);
  const [energy, setEnergy] = useState(6);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  useEffect(() => {
    const fetchCondition = async () => {
      const { data, error } = await supabase
        .from("conditions")
        .select("*")
        .eq("member_id", memberId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setSleep(data.sleep_score ?? 5);
        setPain(data.pain_score ?? 3);
        setEnergy(data.energy_score ?? 6);
      }

      if (error) {
        console.warn("불러오기 오류:", error.message);
      }
    };

    if (memberId) fetchCondition();
  }, [memberId]);

  const handleSubmit = async () => {
    setLoading(true);

    const payload: ConditionInsert = {
      member_id: memberId,
      sleep_score: sleep,
      pain_score: pain,
      energy_score: energy,
    };

    const { error } = await supabase.from("conditions").insert(payload);

    if (error) {
      setToast("❌ 저장 실패: " + error.message);
      setToastType("error");
    } else {
      setToast("✅ 오늘의 컨디션 저장 완료");
      setToastType("success");
    }

    setLoading(false);
    setTimeout(() => setToast(""), 3000);
  };

  return (
    <div className="space-y-5">


      <Slider label="수면" value={sleep} onChange={setSleep} />
      <Slider label="통증" value={pain} onChange={setPain} />
      <Slider label="에너지" value={energy} onChange={setEnergy} />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
      >
        {loading ? "저장 중..." : "저장하기"}
      </button>

      {toast && (
        <p
          className={`text-center text-sm font-medium transition ${
            toastType === "success" ? "text-green-600" : "text-red-500"
          }`}
        >
          {toast}
        </p>
      )}
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}: {value} / 10
      </label>
      <input
        type="range"
        min={0}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
}
