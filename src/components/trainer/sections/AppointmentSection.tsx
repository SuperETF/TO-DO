import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import type { Database } from "../../../types/supabase.ts";

type AppointmentInsert = Database["public"]["Tables"]["appointments"]["Insert"] & {
  trainer_id: string;
};

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
  const [appointmentData, setAppointmentData] = useState<any>(null);

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
        setAppointmentData(data);
      } else {
        setTime("10:00");
        setReason("");
        setAppointmentData(null);
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

    await supabase
      .from("appointments")
      .delete()
      .eq("member_id", memberId)
      .eq("type", "lesson");

    const { data: memberData, error: memberError } = await supabase
      .from("members")
      .select("trainer_id")
      .eq("id", memberId)
      .single();

    if (memberError || !memberData?.trainer_id) {
      setToast("❌ 트레이너 정보 조회 실패");
      setToastType("error");
      setLoading(false);
      return;
    }

    const payload: AppointmentInsert = {
      member_id: memberId,
      appointment_date: date,
      appointment_time: correctedTime,
      reason,
      type: "lesson",
      trainer_id: memberData.trainer_id,
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
    if (!appointmentData || appointmentData.is_completed) return;

    const { error } = await supabase
      .from("appointments")
      .update({ is_completed: true })
      .eq("id", appointmentData.id);

    if (error) {
      console.error("❌ 운동 완료 처리 실패 (Supabase 오류 상세):", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      setToast("❌ 운동 완료 처리 실패: " + error.message);
      setToastType("error");
    } else {
      console.log("✅ 운동 완료 처리 성공:", appointmentData.id);

      setToast("✅ 운동 완료 처리 완료");
      setToastType("success");
      setAppointmentData((prev: any) => ({ ...prev, is_completed: true }));
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
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">시간</label>
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
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
          className="w-full px-4 py-2 border rounded-lg text-sm"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
      >
        {loading ? "저장 중..." : "저장하기"}
      </button>

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
