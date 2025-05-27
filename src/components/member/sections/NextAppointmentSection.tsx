import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

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

  useEffect(() => {
    const fetchNextAppointment = async () => {
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

    if (memberId) fetchNextAppointment();
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
              {formatDate(appointment.appointment_date)} {appointment.appointment_time}
            </h3>
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

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}
