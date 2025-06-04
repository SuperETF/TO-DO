import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
import { supabase } from "../../../lib/supabaseClient";
import PainLogModal from "./PainLogModal";

interface Props {
  memberId: string;
  readOnly?: boolean;
}

const defaultColors = [
  "#3b82f6", "#34d399", "#f97316", "#a855f7",
  "#f43f5e", "#10b981", "#6366f1", "#eab308",
];

export default function PainScoreChartSection({ memberId }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [painData, setPainData] = useState<any[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [showModal, setShowModal] = useState(false);

  const colorMap: Record<string, string> = {};
  areas.forEach((area, i) => {
    colorMap[area] = defaultColors[i % defaultColors.length];
  });

  useEffect(() => {
    const fetchPainScores = async () => {
      if (!memberId || typeof memberId !== "string" || memberId.length !== 36) return;

      const { data, error } = await supabase
        .from("pain_logs") // 트레이너 기록
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
      grid: { top: 40, right: 20, bottom: 50, left: 40 },
      xAxis: {
        type: "category",
        data: dates,
        axisLabel: { color: "#666" },
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
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold">통증 점수 추이</h2>
        <button
          onClick={() => setShowModal(true)}
          className="text-sm text-teal-500 font-medium flex items-center cursor-pointer"
        >
          <i className="fas fa-plus mr-1"></i> 통증 기록하기
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        {areas.map((area) => (
          <button
            key={area}
            onClick={() => setSelectedArea(area)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full border shadow-sm text-sm`}
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

      {showModal && (
        <PainLogModal
          memberId={memberId}
          onClose={() => setShowModal(false)}
        />
      )}
    </section>
  );
}
