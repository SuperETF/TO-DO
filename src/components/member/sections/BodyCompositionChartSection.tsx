import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { supabase } from "../../../lib/supabaseClient";

interface Props {
  memberId: string;
}

export default function BodyCompositionChartSection({ memberId }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);

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
          },
          {
            name: "근육량(kg)",
            data: muscle,
            type: "line",
            smooth: true,
          },
          {
            name: "체지방(%)",
            data: fat,
            type: "line",
            smooth: true,
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
      <div ref={chartRef} className="w-full h-64" />
    </section>
  );
}
