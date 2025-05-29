import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface Appointment {
  appointment_date: string;
  appointment_time: string;
  reason: string;
  trainer_name?: string;
}

interface Props {
  memberId: string;
}

export default function NextAppointmentSection({ memberId }: Props) {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchNextAppointment = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select("appointment_date, appointment_time, reason")
      .eq("member_id", memberId)
      .gte("appointment_date", new Date().toISOString().split("T")[0])
      .order("appointment_date", { ascending: true })
      .limit(1)
      .single();

    if (!error && data) {
      setAppointment(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!memberId) return;
    fetchNextAppointment();

    const channel: RealtimeChannel = supabase
      .channel("appointments-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `member_id=eq.${memberId}`,
        },
        (payload) => {
          // ✅ insert, update, delete 모두 반응
          fetchNextAppointment();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [memberId]);

  if (loading) return null;

  return (
    <section className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <h2 className="text-lg font-semibold mb-3">다음 예약</h2>
      {appointment ? (
        <div className="flex items-center mb-3">
          <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-500 mr-3">
            <i className="far fa-calendar-alt text-xl"></i>
          </div>
          <div>
            <h3 className="font-medium">
              {formatDate(appointment.appointment_date)} {formatTime(appointment.appointment_time)}
            </h3>
            <p className={`text-sm font-semibold ${
              getDaysUntil(appointment.appointment_date) === 0
                ? "text-orange-500"
                : getDaysUntil(appointment.appointment_date) > 0
                ? "text-teal-600"
                : "text-red-500"
            }`}>
              {getDaysUntil(appointment.appointment_date) === 0
                ? "오늘 예약입니다!"
                : getDaysUntil(appointment.appointment_date) > 0
                ? `${getDaysUntil(appointment.appointment_date)}일 남음`
                : "지난 예약입니다"}
            </p>
            {appointment.reason && (
              <p className="text-sm text-gray-600">{appointment.reason}</p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-600">예정된 예약이 없습니다.</p>
      )}
    </section>
  );
}

// 기존 formatDate, formatTime, getDaysUntil 그대로 복사해서 아래 추가
function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(":");
  return `${h}:${m}`;
}

function getDaysUntil(dateStr: string) {
  const today = new Date();
  const target = new Date(dateStr);
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
