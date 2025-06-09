import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import type { Database } from "../../../types/supabase.ts";

type AppointmentInsert = Database["public"]["Tables"]["appointments"]["Insert"];

interface Props {
  memberId: string;
}

export default function AppointmentSection({ memberId }: Props) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("10:00");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [appointmentData, setAppointmentData] = useState<any>(null); // 예약 데이터 상태 추가

  useEffect(() => {
    const fetchAppointment = async () => {
      const { data } = await supabase
        .from("appointments")
        .select("*")
        .eq("member_id", memberId)
        .eq("appointment_date", date)
        .eq("type", "lesson")
        .single();

      if (data) {
        setTime(data.appointment_time ?? "10:00");
        setReason(data.reason ?? "");
        setAppointmentData(data); // 예약 데이터를 상태에 저장
      } else {
        setTime("10:00");
        setReason("");
      }
    };

    if (memberId && date) {
      fetchAppointment();
    }
  }, [memberId, date]);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setToast("❗ 예약 사유를 입력해주세요.");
      setToastType("error");
      return;
    }
  
    setLoading(true);
  
    const correctedTime = time.length === 5 ? `${time}:00` : time;
  
    // 🔥 기존 lesson 예약 전부 삭제 (같은 member + type만 기준)
    await supabase
      .from("appointments")
      .delete()
      .eq("member_id", memberId)
      .eq("type", "lesson");
  
    const payload: AppointmentInsert = {
      member_id: memberId,
      appointment_date: date,
      appointment_time: correctedTime,
      reason,
      type: "lesson",
    };
  
    const { error } = await supabase.from("appointments").insert(payload);
  
    if (error) {
      setToast("❌ 저장 실패: " + error.message);
      setToastType("error");
    } else {
      setToast("✅ 예약 저장 완료");
      setToastType("success");
    }
  
    setLoading(false);
    setTimeout(() => setToast(""), 3000);
  };

  const handleComplete = async () => {
    if (!appointmentData || appointmentData.is_completed) return; // 이미 완료된 예약이라면 아무 작업도 하지 않음
  
    const { error } = await supabase
      .from("appointments")
      .update({ is_completed: true }) // 운동 완료 처리
      .eq("id", appointmentData.id); // 현재 예약 ID로 업데이트

    if (error) {
      setToast("❌ 운동 완료 처리 실패: " + error.message);
      setToastType("error");
    } else {
      setToast("✅ 운동 완료 처리 완료");
      setToastType("success");
      setAppointmentData((prevState: any) => ({ ...prevState, is_completed: true })); // 로컬 상태 업데이트
    }
  };

  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hour = String(Math.floor(i / 2)).padStart(2, "0");
    const minute = i % 2 === 0 ? "00" : "30";
    return `${hour}:${minute}`;
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">예약 날짜</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">시간</label>
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            {timeOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">사유</label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="예: 체성분 측정, 자세 교정 등"
          className="w-full px-4 py-2 border rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
      >
        {loading ? "저장 중..." : "저장하기"}
      </button>

      {/* 운동 완료 버튼 */}
      {appointmentData && !appointmentData.is_completed && (
        <button
          onClick={handleComplete}
          className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition mt-3"
        >
          운동 완료
        </button>
      )}

      {toast && (
        <p
          className={`text-center text-sm font-medium ${
            toastType === "success" ? "text-green-600" : "text-red-500"
          }`}
        >
          {toast}
        </p>
      )}
    </div>
  );
}
