import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { supabase } from "../../../lib/supabaseClient";

interface Props {
  memberId: string;
  readOnly?: boolean;
}

export default function PainScoreChartSection({ memberId, readOnly = false }: Props) {
  void readOnly;
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
        .limit(50);

      if (error) {
        console.error("❌ Supabase error:", error);
        return;
      }

      if (!data || data.length === 0) {
        console.warn("⚠️ No pain_logs found for member:", memberId);
        return;
      }

      // 날짜 + 부위 조합을 x축으로 구성
      const labels = data.map((d) => `${d.date} (${d.pain_area})`);
      const xAxisLabels = Array.from(new Set(labels)).sort();

      const areas = Array.from(new Set(data.map((d) => d.pain_area)));

      const series = areas.map((area) => {
        const areaScores = xAxisLabels.map((label) => {
          const [] = label.split(" (");
          const entry = data.find(
            (d) => `${d.date} (${d.pain_area})` === label && d.pain_area === area
          );
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
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
        },
        legend: {
          data: areas,
          top: 0,
        },
        grid: {
          top: 40,
          right: 20,
          bottom: 50,
          left: 40,
        },
        xAxis: {
          type: "category",
          data: xAxisLabels,
          axisLabel: {
            color: "#666",
            rotate: 30, // 보기 좋게 회전
            formatter: (label: string) => {
              const [date, area] = label.split(" (");
              return `${date}\n(${area?.replace(")", "")})`;
            },
          },
          axisLine: { lineStyle: { color: "#ddd" } },
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
