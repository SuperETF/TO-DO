import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import type { Database } from "../../../types/supabase.ts";

type ConditionInsert = Database["public"]["Tables"]["conditions"]["Insert"];

export interface ConditionSectionProps {
  memberId: string;
  onSaved?: () => void;
}

export default function ConditionSection({ memberId, onSaved }: ConditionSectionProps) {
  const [sleep, setSleep] = useState(5);
  const [pain, setPain] = useState(3);
  const [energy, setEnergy] = useState(6);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [, setToastType] = useState<"success" | "error">("success");

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
      setToast("저장 실패: " + error.message);
      setToastType("error");
    } else {
      setToast("오늘의 컨디션 저장 완료");
      setToastType("success");
      if (onSaved) onSaved();
    }

    setLoading(false);
    setTimeout(() => setToast(""), 3000);
  };

  return (
    <div className="flex flex-col gap-7">
      <ConditionSlider
        label="수면"
        value={sleep}
        onChange={setSleep}
        accent="indigo"
      />
      <ConditionSlider
        label="통증"
        value={pain}
        onChange={setPain}
        accent="red"
      />
      <ConditionSlider
        label="에너지"
        value={energy}
        onChange={setEnergy}
        accent="blue"
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-2 rounded-lg text-base font-semibold hover:bg-indigo-700 transition disabled:opacity-50 mt-1"
      >
        {loading ? "저장 중..." : "저장하기"}
      </button>

      {toast && (
        <div
          className={`
            fixed left-1/2 -translate-x-1/2 bottom-8
            bg-indigo-100 text-indigo-800 px-4 py-2 rounded-lg font-medium text-sm
            transition z-30
          `}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function ConditionSlider({
  label,
  value,
  onChange,
  accent = "indigo",
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  accent?: "indigo" | "red" | "blue";
}) {
  const accentMap: Record<string, string> = {
    indigo: "focus:ring-indigo-500",
    red: "focus:ring-red-400",
    blue: "focus:ring-blue-400",
  };
  const accentLabel: Record<string, string> = {
    indigo: "text-indigo-600",
    red: "text-red-500",
    blue: "text-blue-500",
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className={`text-xs font-semibold text-gray-500`}>
          {label}
        </span>
        <span className={`text-xl font-bold ${accentLabel[accent]}`}>
          {value} / 10
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 ${accentMap[accent]}`}
        style={{
          accentColor:
            accent === "indigo"
              ? "#6366f1"
              : accent === "red"
              ? "#ef4444"
              : "#3b82f6",
        }}
      />
    </div>
  );
}
