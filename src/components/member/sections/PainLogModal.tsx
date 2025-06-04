import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";

interface Props {
  memberId: string;
  onClose: () => void;
}

interface PainLog {
  id: string;
  date: string;
  pain_area: string;
  pain_score: number;
  activity: string;
  note: string;
}

export default function PainLogModal({ memberId, onClose }: Props) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [painArea, setPainArea] = useState("");
  const [painScore, setPainScore] = useState(0);
  const [activity, setActivity] = useState("");
  const [note, setNote] = useState("");
  const [logs, setLogs] = useState<PainLog[]>([]);
  const [painAreaOptions, setPainAreaOptions] = useState<string[]>([]);

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from("member_pain_logs")
      .select("*")
      .eq("member_id", memberId)
      .order("date", { ascending: false });

    if (!error && data) setLogs(data as PainLog[]);
  };

  const fetchPainAreas = async () => {
    const { data, error } = await supabase
      .from("pain_logs")
      .select("pain_area")
      .eq("member_id", memberId)
      .neq("pain_area", null);

    if (!error && data) {
      const unique = Array.from(new Set(data.map((d) => d.pain_area))).sort();
      setPainAreaOptions(unique);
    }
  };

  const handleSubmit = async () => {
    if (!painArea || painScore === null) {
      alert("모든 항목을 입력해주세요.");
      return;
    }

    const { error } = await supabase.from("member_pain_logs").insert({
      member_id: memberId,
      date,
      pain_area: painArea,
      pain_score: painScore,
      activity,
      note,
    });

    if (!error) {
      await fetchLogs();
      setPainArea("");
      setPainScore(0);
      setActivity("");
      setNote("");
    } else {
      alert("통증 기록 저장 중 오류 발생");
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchPainAreas();
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl h-[90vh] overflow-hidden shadow-xl flex flex-col">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">통증 기록</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black text-lg">×</button>
        </div>

        {/* 입력 섹션 */}
        <div className="p-4 space-y-3">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border rounded p-2" />
          <select
            value={painArea}
            onChange={(e) => setPainArea(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="">통증 부위를 선택하세요</option>
            {painAreaOptions.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
          <select
            value={painScore}
            onChange={(e) => setPainScore(Number(e.target.value))}
            className="w-full border rounded p-2"
          >
            <option value="">통증 점수를 선택하세요 (0–10점)</option>
            {Array.from({ length: 11 }, (_, i) => (
              <option key={i} value={i}>{i}점</option>
            ))}
          </select>
          <input placeholder="오늘 한 활동" value={activity} onChange={e => setActivity(e.target.value)} className="w-full border rounded p-2" />
          <textarea placeholder="통증 변화 주관적 서술" value={note} onChange={e => setNote(e.target.value)} className="w-full border rounded p-2" rows={3} />
          <button onClick={handleSubmit} className="w-full bg-teal-500 text-white py-3 rounded font-semibold hover:bg-teal-600">
            저장하기
          </button>
        </div>

        {/* 기록 리스트 */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 border-t">
          {logs.map(log => (
            <div key={log.id} className="border rounded p-4 text-sm shadow-sm bg-white">
              <div className="font-medium mb-1">📅 {log.date}</div>
              <div className="mb-1"><b>부위:</b> {log.pain_area} | <b>NRS:</b> {log.pain_score}</div>
              <div className="mb-1"><b>활동:</b> {log.activity}</div>
              <div><b>메모:</b> {log.note}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
