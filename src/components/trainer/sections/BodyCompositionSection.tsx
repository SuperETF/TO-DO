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
  const [, setToastType] = useState<"success" | "error">("success");

  // BMI 제거
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    weight: "",
    bodyFat: "",
    muscle: "",
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
        legend: { data: ["체중", "체지방률", "골격근량"], bottom: 0 },
        grid: {
          left: "3%",
          right: "3%",
          bottom: "14%",
          top: "10%",
          containLabel: true,
        },
        xAxis: { type: "category", data: dates },
        yAxis: { type: "value" },
        series: [
          { name: "체중", type: "line", data: weights, symbol: "circle", symbolSize: 8 },
          { name: "체지방률", type: "line", data: fats, symbol: "circle", symbolSize: 8 },
          { name: "골격근량", type: "line", data: muscles, symbol: "circle", symbolSize: 8 },
        ],
      });

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
      bmi: null, // BMI 저장하지 않음
    };

    const { error } = await supabase
      .from("body_compositions")
      .upsert([editId ? { ...payload, id: editId } : payload]);

    if (error) {
      setToast("저장 실패: " + error.message);
      setToastType("error");
    } else {
      setToast(editId ? "수정 완료" : "저장 완료");
      setToastType("success");
      setForm({
        date: new Date().toISOString().slice(0, 10),
        weight: "",
        bodyFat: "",
        muscle: "",
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
    <div className="bg-white rounded-2xl p-5 max-w-2xl w-full mx-auto space-y-7">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <i className="fas fa-dumbbell text-indigo-500 text-xl"></i>
          <span className="text-lg font-bold text-gray-800">체성분 분석</span>
        </div>
        <button
          onClick={() => {
            setFormOpen((v) => !v);
            if (formOpen) setEditId(null);
          }}
          className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm px-4 py-1 rounded-lg transition"
        >
          {formOpen ? "작성 취소" : "+ 새 기록"}
        </button>
      </div>

      {/* 기록 작성 폼 */}
      {formOpen && (
        <div className="w-full bg-indigo-50 rounded-xl p-5 flex flex-col gap-4 relative">
          <div className="flex items-center mb-2 gap-2">
            <i className="fas fa-pen text-indigo-500"></i>
            <span className="text-indigo-900 text-base font-semibold">
              새로운 체성분 기록 작성
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="측정일"
              type="date"
              value={form.date}
              onChange={(v) => setForm({ ...form, date: v })}
            />
            <Input
              label="체중 (kg)"
              value={form.weight}
              onChange={(v) => setForm({ ...form, weight: v })}
              placeholder="예) 70.5"
            />
            <Input
              label="체지방률 (%)"
              value={form.bodyFat}
              onChange={(v) => setForm({ ...form, bodyFat: v })}
              placeholder="예) 20.2"
            />
            <Input
              label="골격근량 (kg)"
              value={form.muscle}
              onChange={(v) => setForm({ ...form, muscle: v })}
              placeholder="예) 30.1"
            />
          </div>
          <div className="flex justify-end mt-2">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-base font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? "저장 중..." : editId ? "수정하기" : "저장하기"}
            </button>
          </div>
        </div>
      )}

      {/* 차트 */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">체성분 추이</h4>
        <div
          ref={chartRef}
          className={`w-full h-48 ${compositions.length === 0 ? "flex items-center justify-center text-gray-400 text-base" : ""}`}
        >
          {compositions.length === 0 && "체성분 기록이 없습니다"}
        </div>
      </div>

      {/* 기록 목록 */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">체성분 기록 목록</h4>
        <div>
          {compositions.length === 0 && (
            <div className="text-gray-400 py-5 text-center">아직 기록 없음</div>
          )}
          <div className="divide-y divide-gray-100">
            {compositions.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <span className="text-gray-700 font-medium">{c.date}</span>
                <div className="flex gap-4 items-center">
                  <span className="text-xl font-bold">{c.weight}kg</span>
                  <span className="text-base text-indigo-700">{c.body_fat_percent}%</span>
                  <span className="text-base text-blue-700">{c.muscle_mass}kg</span>
                  <button
                    onClick={() => handleEdit(c)}
                    className="text-indigo-400 hover:text-indigo-600 transition"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-red-400 hover:text-red-600 transition"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 토스트 메시지 */}
      {toast && (
        <div className={`
          fixed left-1/2 -translate-x-1/2 bottom-8
          bg-indigo-100 text-indigo-800 px-4 py-2 rounded-lg font-medium text-sm
          transition
        `}>
          {toast}
        </div>
      )}
    </div>
  );
}

// 플랫 인풋
function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col">
      <label className="text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="px-3 py-2 text-sm rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
        style={{ border: "none", boxShadow: "none" }} // 완전 플랫
      />
    </div>
  );
}
