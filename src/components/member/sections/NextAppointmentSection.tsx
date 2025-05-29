import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  type: "personal" | "lesson";
}

interface Props {
  memberId: string;
}

export default function NextAppointmentSection({ memberId }: Props) {
  const [personal, setPersonal] = useState<Appointment | null>(null);
  const [lesson, setLesson] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  const fetchAppointments = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("appointments")
      .select("id, appointment_date, appointment_time, reason, type")
      .eq("member_id", memberId)
      .order("appointment_date", { ascending: true });

    if (!error && data) {
      const personalAppointment = data.find((item) => item.type === "personal") || null;
      const lessonAppointment = data.find((item) => item.type === "lesson") || null;

      setPersonal(personalAppointment);
      setLesson(lessonAppointment);
    }

    setLoading(false);
  };

  const handleCreateAppointment = async () => {
    if (!newDate || !newTime) return alert("날짜와 시간을 입력해주세요.");

    await supabase
      .from("appointments")
      .delete()
      .eq("member_id", memberId)
      .eq("type", "personal");

    const { error } = await supabase.from("appointments").insert({
      member_id: memberId,
      appointment_date: newDate,
      appointment_time: newTime,
      reason: "개인 운동",
      type: "personal",
    });

    if (error) {
      alert("예약 실패: " + error.message);
    } else {
      alert("예약이 완료되었습니다!");
      setShowModal(false);
      setNewDate("");
      setNewTime("");
      fetchAppointments();
    }
  };

  const handleCancel = async () => {
    if (!personal?.id) return;
    if (!confirm("정말 예약을 취소하시겠습니까?")) return;

    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", personal.id);

    if (error) {
      alert("취소 실패: " + error.message);
    } else {
      alert("예약이 취소되었습니다.");
      fetchAppointments();
    }
  };

  useEffect(() => {
    if (!memberId) return;
    fetchAppointments();

    const channel = supabase
      .channel("appointments-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `member_id=eq.${memberId}`,
        },
        () => fetchAppointments()
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

      {lesson && (
        <AppointmentCard
          title="1:1 레슨"
          appointment={lesson}
          icon="calendar-alt"
          bg="bg-teal-100"
        />
      )}

      {personal && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-800">개인 운동</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                예약완료
              </span>
              <button
                onClick={handleCancel}
                className="text-xs text-red-500 underline"
              >
                예약 취소
              </button>
            </div>
          </div>
          <div className="flex items-center">
            <div className={`w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-500 mr-3`}>
              <i className="fas fa-dumbbell text-xl"></i>
            </div>
            <div className="flex-1">
              <h3 className="font-medium">
                {formatDate(personal.appointment_date)}{" "}
                {formatTime(personal.appointment_time)}
              </h3>
              <p className="text-sm text-gray-600">{personal.reason}</p>
            </div>
          </div>
        </div>
      )}

      <button
        className="w-full bg-teal-500 text-white py-3 rounded-lg font-medium mt-2"
        onClick={() => setShowModal(true)}
      >
        <i className="fas fa-plus mr-2"></i>새로운 예약하기
      </button>

      {showModal && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">개인 운동 예약</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">날짜</label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">시간 선택</label>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 24 }, (_, i) => {
                  const hour = i.toString().padStart(2, "0");
                  const timeValue = `${hour}:00`;
                  const isSelected = newTime === timeValue;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setNewTime(timeValue)}
                      className={`py-2 text-sm rounded-md border text-center ${
                        isSelected
                          ? "bg-teal-500 text-white border-teal-500"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {hour}:00
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-4 py-2 text-gray-600 border rounded"
                onClick={() => setShowModal(false)}
              >
                취소
              </button>
              <button
                className="px-4 py-2 bg-teal-500 text-white rounded"
                onClick={handleCreateAppointment}
                disabled={!newDate || !newTime}
              >
                예약하기
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function AppointmentCard({
  title,
  appointment,
  icon,
  bg,
}: {
  title: string;
  appointment: Appointment;
  icon: string;
  bg: string;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-gray-800">{title}</h3>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
          예약완료
        </span>
      </div>
      <div className="flex items-center">
        <div className={`w-12 h-12 ${bg} rounded-full flex items-center justify-center text-teal-500 mr-3`}>
          <i className={`fas fa-${icon} text-xl`}></i>
        </div>
        <div>
          <h3 className="font-medium">
            {formatDate(appointment.appointment_date)}{" "}
            {formatTime(appointment.appointment_time)}
          </h3>
          <p className="text-sm text-gray-600">{appointment.reason}</p>
        </div>
      </div>
    </div>
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

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(":");
  return `${h}:${m}`;
}
