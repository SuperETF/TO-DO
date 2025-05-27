import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { supabase } from "../../../lib/supabaseClient";

interface Props {
  memberId: string;
}

export default function PainScoreChartSection({ memberId }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPainScores = async () => {
      if (!memberId || typeof memberId !== "string" || memberId.length !== 36) {
        console.warn("⚠️ [Chart] Invalid memberId format");
        return;
      }

      const { data, error } = await supabase
        .from("pain_logs")
        .select("date, pain_score, pain_area")
        .eq("member_id", memberId)
        .order("date", { ascending: true })
        .limit(50); // 최대 50개

      if (error) {
        console.error("❌ Supabase error:", error);
        return;
      }

      if (!data || data.length === 0) {
        console.warn("⚠️ No pain_logs found for member:", memberId);
        return;
      }

      const dates = Array.from(new Set(data.map((d) => d.date))).sort();
      const areas = Array.from(new Set(data.map((d) => d.pain_area)));

      const series = areas.map((area) => {
        const areaScores = dates.map((date) => {
          const entry = data.find((d) => d.date === date && d.pain_area === area);
          return entry ? entry.pain_score ?? 0 : 0;
        });

        return {
          name: area,
          type: "line",
          smooth: true,
          data: areaScores,
          lineStyle: { width: 3 },
          symbol: "circle",
          symbolSize: 6,
        };
      });

      const chart =
        echarts.getInstanceByDom(chartRef.current!) ||
        echarts.init(chartRef.current!);

      chart.setOption({
        tooltip: { trigger: "axis" },
        legend: { data: areas, top: 0 },
        grid: { top: 40, right: 20, bottom: 30, left: 40 },
        xAxis: {
          type: "category",
          data: dates,
          axisLine: { lineStyle: { color: "#ddd" } },
          axisLabel: { color: "#666" },
        },
        yAxis: {
          type: "value",
          min: 0,
          max: 10,
          axisLine: { lineStyle: { color: "#ddd" } },
          axisLabel: { color: "#666" },
          splitLine: { lineStyle: { color: "#f0f0f0" } },
        },
        series,
      });

      window.addEventListener("resize", () => chart.resize());
    };

    fetchPainScores();
  }, [memberId]);

  return (
    <section className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <h2 className="text-lg font-semibold mb-3">통증 점수 추이</h2>
      <div ref={chartRef} className="w-full h-64" />
    </section>
  );
}
