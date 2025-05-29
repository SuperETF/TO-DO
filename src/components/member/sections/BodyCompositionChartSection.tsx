import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
import { supabase } from "../../../lib/supabaseClient";

interface Props {
  memberId: string;
}

export default function BodyCompositionChartSection({ memberId }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [latest, setLatest] = useState<{
    weight: number;
    muscle: number;
    fat: number;
  } | null>(null);

  useEffect(() => {
    const fetchBodyData = async () => {
      const { data, error } = await supabase
        .from("body_compositions")
        .select("date, weight, muscle_mass, body_fat_percent")
        .eq("member_id", memberId)
        .order("date", { ascending: true });

      if (!data || error || !chartRef.current) return;

      const dates = data.map((d) => d.date);
      const weight = data.map((d) => d.weight ?? 0);
      const muscle = data.map((d) => d.muscle_mass ?? 0);
      const fat = data.map((d) => d.body_fat_percent ?? 0);

      // ✅ 최신 측정값 저장
      const last = data[data.length - 1];
      setLatest({
        weight: last?.weight ?? 0,
        muscle: last?.muscle_mass ?? 0,
        fat: last?.body_fat_percent ?? 0,
      });

      const chart = echarts.init(chartRef.current);
      chart.setOption({
        tooltip: { trigger: "axis" },
        legend: {
          data: ["체중(kg)", "근육량(kg)", "체지방(%)"],
          top: 0,
        },
        grid: { top: 50, right: 20, bottom: 30, left: 40 },
        xAxis: {
          type: "category",
          data: dates,
          axisLine: { lineStyle: { color: "#ccc" } },
        },
        yAxis: {
          type: "value",
          axisLine: { lineStyle: { color: "#ccc" } },
          splitLine: { lineStyle: { color: "#f0f0f0" } },
        },
        series: [
          {
            name: "체중(kg)",
            data: weight,
            type: "line",
            smooth: true,
            label: {
              show: true,
              position: "top",
              fontSize: 10,
              color: "#666",
            },
          },
          {
            name: "근육량(kg)",
            data: muscle,
            type: "line",
            smooth: true,
            label: {
              show: true,
              position: "top",
              fontSize: 10,
              color: "#666",
            },
          },
          {
            name: "체지방(%)",
            data: fat,
            type: "line",
            smooth: true,
            label: {
              show: true,
              position: "top",
              fontSize: 10,
              color: "#666",
            },
          },
        ],
      });

      window.addEventListener("resize", () => chart.resize());
    };

    if (memberId) fetchBodyData();
  }, [memberId]);

  return (
    <section className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <h2 className="text-lg font-semibold mb-3">체성분 추이</h2>

      {latest && (
        <div className="grid grid-cols-3 gap-2 mb-4 text-center text-sm text-gray-700">
          <div>
            <div className="font-medium text-gray-500">체중</div>
            <div className="text-lg text-gray-800 font-semibold">
              {latest.weight.toFixed(1)}kg
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-500">근육량</div>
            <div className="text-lg text-gray-800 font-semibold">
              {latest.muscle.toFixed(1)}kg
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-500">체지방률</div>
            <div className="text-lg text-gray-800 font-semibold">
              {latest.fat.toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      <div ref={chartRef} className="w-full h-64" />
    </section>
  );
}
