import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
import { supabase } from "../../../lib/supabaseClient";

interface Props {
  memberId: string;
  readOnly?: boolean;
}

const defaultColors = [
  "#3b82f6", // blue
  "#34d399", // emerald
  "#f97316", // orange
  "#a855f7", // purple
  "#f43f5e", // rose
  "#10b981", // green
  "#6366f1", // indigo
  "#eab308", // yellow
];

export default function PainScoreChartSection({ memberId, readOnly = false }: Props) {
  void readOnly;
  const chartRef = useRef<HTMLDivElement>(null);
  const [painData, setPainData] = useState<any[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>("");

  // 부위 → 색상 매핑
  const colorMap: Record<string, string> = {};
  areas.forEach((area, i) => {
    colorMap[area] = defaultColors[i % defaultColors.length];
  });

  useEffect(() => {
    const fetchPainScores = async () => {
      if (!memberId || typeof memberId !== "string" || memberId.length !== 36) return;

      const { data, error } = await supabase
        .from("pain_logs")
        .select("date, pain_score, pain_area")
        .eq("member_id", memberId)
        .order("date", { ascending: true });

      if (error || !data) return;

      setPainData(data);
      const uniqueAreas = Array.from(new Set(data.map((d) => d.pain_area)));
      setAreas(uniqueAreas);
      setSelectedArea(uniqueAreas[0]);
    };

    fetchPainScores();
  }, [memberId]);

  useEffect(() => {
    if (!chartRef.current || painData.length === 0 || !selectedArea) return;

    const filteredData = painData.filter((d) => d.pain_area === selectedArea);
    const dates = filteredData.map((d) => d.date);

    const seriesData = dates.map((date) => {
      const entry = filteredData.find((d) => d.date === date);
      return entry ? entry.pain_score ?? null : null;
    });

    const chart =
      echarts.getInstanceByDom(chartRef.current) || echarts.init(chartRef.current);

    chart.setOption({
      tooltip: {
        trigger: "axis",
        formatter: (params: any) => {
          const p = params[0];
          return `${p.axisValue}<br/>${selectedArea}: ${p.data ?? "없음"}`;
        },
      },
      legend: { show: false },
      grid: {
        top: 40,
        right: 20,
        bottom: 50,
        left: 40,
      },
      xAxis: {
        type: "category",
        data: dates,
        axisLabel: {
          color: "#666",
          rotate: 0,
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
      series: [
        {
          name: selectedArea,
          type: "line",
          smooth: true,
          connectNulls: false,
          data: seriesData,
          lineStyle: { width: 3, color: colorMap[selectedArea] },
          itemStyle: { color: colorMap[selectedArea] },
          symbol: "circle",
          symbolSize: 6,
        },
      ],
    });

    window.addEventListener("resize", () => chart.resize());
  }, [painData, selectedArea]);

  return (
    <section className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <h2 className="text-lg font-semibold mb-3">통증 점수 추이</h2>

      <div className="flex gap-3 mb-4">
        {areas.map((area) => (
          <button
            key={area}
            onClick={() => setSelectedArea(area)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full border shadow-sm text-sm 
              ${selectedArea === area
                ? `bg-[${colorMap[area]}] text-white border-transparent`
                : "bg-gray-100 text-gray-800 border-gray-300"
              }`}
            style={{
              backgroundColor: selectedArea === area ? colorMap[area] : "#f3f4f6",
              borderColor: selectedArea === area ? colorMap[area] : "#d1d5db",
              color: selectedArea === area ? "white" : "#374151",
            }}
          >
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: selectedArea === area ? "#fff" : colorMap[area] }}
            />
            {area}
          </button>
        ))}
      </div>

      <div ref={chartRef} className="w-full h-64" />
    </section>
  );
}
