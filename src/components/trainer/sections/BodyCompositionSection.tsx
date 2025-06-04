import { useState, useEffect, useRef } from "react";
import { supabase } from "../../../lib/supabaseClient";
import type { Database } from "../../../types/supabase.ts";
import * as echarts from "echarts";

type BodyInsert = Database["public"]["Tables"]["body_compositions"]["Insert"];
type BodyRow = Database["public"]["Tables"]["body_compositions"]["Row"];

export interface BodyCompositionSectionProps {
  memberId: string;
  onSaved?: () => void;
}

export default function BodyCompositionSection({
  memberId,
  onSaved,
}: BodyCompositionSectionProps) {
  const [compositions, setCompositions] = useState<BodyRow[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    weight: "",
    bodyFat: "",
    muscle: "",
    bmi: "",
  });

  const chartRef = useRef<HTMLDivElement>(null);

  // 데이터 패칭
  const fetchData = async () => {
    const { data } = await supabase
      .from("body_compositions")
      .select("*")
      .eq("member_id", memberId)
      .order("date", { ascending: true });

    setCompositions(data || []);
  };

  useEffect(() => {
    if (memberId) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId]);

  // 차트 렌더링
  useEffect(() => {
    if (chartRef.current && compositions.length > 0) {
      const chart = echarts.init(chartRef.current);
      const dates = compositions.map((c) => c.date);
      const weights = compositions.map((c) => c.weight);
      const fats = compositions.map((c) => c.body_fat_percent);
      const muscles = compositions.map((c) => c.muscle_mass);

      chart.setOption({
        tooltip: { trigger: "axis" },
        legend: { data: ["체중", "체지방률", "골격근량"] },
        xAxis: { type: "category", data: dates },
        yAxis: { type: "value" },
        series: [
          { name: "체중", type: "line", data: weights },
          { name: "체지방률", type: "line", data: fats },
          { name: "골격근량", type: "line", data: muscles },
        ],
      });

      // 차트 인스턴스 dispose 처리
      return () => chart.dispose();
    }
  }, [compositions]);

  // 폼 제출 핸들러
  const handleSubmit = async () => {
    if (!form.date || !form.weight || !form.bodyFat || !form.muscle) {
      setToast("모든 값을 입력해주세요.");
      setToastType("error");
      setTimeout(() => setToast(""), 2000);
      return;
    }
    setLoading(true);

    const payload: BodyInsert = {
      member_id: memberId,
      date: form.date,
      weight: Number(form.weight),
      body_fat_percent: Number(form.bodyFat),
      muscle_mass: Number(form.muscle),
      bmi: form.bmi ? Number(form.bmi) : null,
    };

    const { error } = await supabase
      .from("body_compositions")
      .upsert([editId ? { ...payload, id: editId } : payload]);

    if (error) {
      setToast("❌ 저장 실패: " + error.message);
      setToastType("error");
    } else {
      setToast(editId ? "✅ 체성분 정보 수정 완료" : "✅ 체성분 정보 저장 완료");
      setToastType("success");
      setForm({
        date: new Date().toISOString().slice(0, 10),
        weight: "",
        bodyFat: "",
        muscle: "",
        bmi: "",
      });
      setEditId(null);
      setFormOpen(false);
      fetchData();
      if (onSaved) onSaved();
    }

    setLoading(false);
    setTimeout(() => setToast(""), 3000);
  };

  // 수정 핸들러
  const handleEdit = (c: BodyRow) => {
    setForm({
      date: c.date,
      weight: c.weight?.toString() ?? "",
      bodyFat: c.body_fat_percent?.toString() ?? "",
      muscle: c.muscle_mass?.toString() ?? "",
      bmi: c.bmi?.toString() ?? "",
    });
    setEditId(c.id);
    setFormOpen(true);
  };

  // 삭제 핸들러
  const handleDelete = async (id: string) => {
    setLoading(true);
    await supabase.from("body_compositions").delete().eq("id", id);
    setEditId(null);
    setFormOpen(false);
    await fetchData();
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-bold text-gray-800">체성분 분석</h3>
        <button
          onClick={() => setFormOpen((v) => !v)}
          className="bg-[#4C51BF] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700"
        >
          {formOpen ? "닫기" : "+ 새 체성분 기록"}
        </button>
      </div>

      {formOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="측정일" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
          <Input label="체중 (kg)" value={form.weight} onChange={(v) => setForm({ ...form, weight: v })} />
          <Input label="체지방률 (%)" value={form.bodyFat} onChange={(v) => setForm({ ...form, bodyFat: v })} />
          <Input label="골격근량 (kg)" value={form.muscle} onChange={(v) => setForm({ ...form, muscle: v })} />
          <Input label="BMI" value={form.bmi} onChange={(v) => setForm({ ...form, bmi: v })} />
          <div className="col-span-full">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-[#4C51BF] text-white py-3 rounded-xl text-base font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? "저장 중..." : editId ? "수정하기" : "저장하기"}
            </button>
          </div>
        </div>
      )}

      <div>
        <h4 className="text-sm font-semibold mb-2">체성분 추이</h4>
        <div ref={chartRef} className="w-full h-48" />
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-2">체성분 기록 목록</h4>
        <div className="space-y-2">
          {compositions.map((c) => (
            <div key={c.id} className="flex justify-between items-center text-sm bg-gray-50 p-3 rounded-md">
              <span>{c.date}</span>
              <div className="flex items-center space-x-3">
                <span>
                  {c.weight}kg / {c.body_fat_percent}% / {c.muscle_mass}kg
                </span>
                <button onClick={() => handleEdit(c)} className="text-gray-400 hover:text-indigo-600" aria-label="수정">
                  <i className="fas fa-edit"></i>
                </button>
                <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-500" aria-label="삭제">
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
          {compositions.length === 0 && (
            <div className="text-gray-400 text-sm">체성분 기록이 없습니다.</div>
          )}
        </div>
      </div>

      {toast && (
        <p className={`text-center text-sm font-medium transition ${
          toastType === "success" ? "text-green-600" : "text-red-500"
        }`}>
          {toast}
        </p>
      )}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}
