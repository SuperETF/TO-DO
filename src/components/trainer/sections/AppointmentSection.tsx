import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import type { Database } from "../../../types/supabase.ts";

type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showCompleted, setShowCompleted] = useState(false); // 예약 내역 화면: 완료/미완료 구분
  const [isOpen, setIsOpen] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // 예약 내역 조회 (완료/미완료 전체)
  const fetchAppointments = async () => {
    if (!memberId) return;
    const { data } = await supabase
      .from("appointments")
      .select("*")
      .eq("member_id", memberId)
      .eq("type", "lesson")
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false });

    setAppointments(data || []);
  };

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line
  }, [memberId]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!reason.trim()) {
      setToast("❗ 프로그램 내용을 입력해주세요.");
      setToastType("error");
      return;
    }
    setLoading(true);
    const correctedTime = time.length === 5 ? `${time}:00` : time;

    // 트레이너 ID 조회
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
      setShowForm(false);
      fetchAppointments();
      setDate(new Date().toISOString().slice(0, 10));
      setTime("10:00");
      setReason("");
    }
    setLoading(false);
    setTimeout(() => setToast(""), 2000);
  };

  const handleComplete = async (appointmentId: string) => {
    const { error } = await supabase
      .from("appointments")
      .update({ is_completed: true })
      .eq("id", appointmentId);

    if (error) {
      setToast("❌ 운동 완료 처리 실패: " + (error.message || JSON.stringify(error)));
      setToastType("error");
    } else {
      setToast("✅ 운동 완료 처리 완료");
      setToastType("success");
      fetchAppointments();
    }
    setTimeout(() => setToast(""), 2000);
  };

  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hour = String(Math.floor(i / 2)).padStart(2, "0");
    const minute = i % 2 === 0 ? "00" : "30";
    return `${hour}:${minute}`;
  });

  // 예약 내역 화면: 완료/미완료 구분 필터링
  const filteredAppointments = appointments.filter(app =>
    showCompleted ? app.is_completed : !app.is_completed
  );

  return (
    <div className="w-full">
      {/* 아코디언 카드(그림자/테두리 없음, 라운드+흰배경만) */}
      <section className="bg-white rounded-2xl p-0 w-full mb-4">
        {/* 아코디언 헤더 */}
        <div
          className="p-4 flex justify-between items-center cursor-pointer select-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          <h2 className="text-lg font-bold text-gray-800 flex items-center">
            <i className="fas fa-calendar-alt text-violet-600 mr-2" />
            예약 관리
          </h2>
          <i
            className={`fas fa-chevron-${isOpen ? "up" : "down"} text-gray-400 text-base`}
          ></i>
        </div>
        {/* 본문 */}
        {isOpen && (
          <div className="p-8 pt-4">
            <div className="flex items-center mb-7">
            </div>

            {/* 예약 내역: 완료/미완료 필터 */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setShowCompleted(false)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                  !showCompleted
                    ? "bg-violet-600 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                진행중 예약
              </button>
              <button
                onClick={() => setShowCompleted(true)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                  showCompleted
                    ? "bg-violet-600 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                완료된 예약
              </button>
            </div>

            {/* 예약 내역 리스트 */}
            {!showForm ? (
              <>
                {filteredAppointments.length === 0 ? (
                  <div className="py-8 text-center text-gray-400">
                    <p>
                      {showCompleted
                        ? "완료된 예약이 없습니다"
                        : "진행중인 예약이 없습니다"}
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-4 mb-6">
                    {filteredAppointments.map((app) => (
                      <li
                        key={app.id}
                        className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 bg-gray-50 rounded-xl p-4"
                      >
                        <div className="flex-1 flex flex-col md:flex-row md:items-center md:gap-6">
                          <div>
                            <span className="block text-xs text-gray-500 mb-1">날짜</span>
                            <span className="text-base font-medium">
                              {app.appointment_date
                                ? app.appointment_date.replace(/-/g, ". ") + "."
                                : "-"}
                            </span>
                          </div>
                          <div className="mt-2 md:mt-0 md:ml-6">
                            <span className="block text-xs text-gray-500 mb-1">시간</span>
                            <span className="text-base font-medium">
                              {app.appointment_time?.slice(0, 5)}
                            </span>
                          </div>
                          <div className="mt-2 md:mt-0 md:ml-6">
                            <span className="block text-xs text-gray-500 mb-1">프로그램</span>
                            <span className="text-base">{app.reason || "-"}</span>
                          </div>
                        </div>
                        <div className="flex flex-row items-center gap-3 mt-3 md:mt-0">
                          {!app.is_completed && (
                            <button
                              onClick={() => handleComplete(app.id)}
                              className="bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-violet-700 transition"
                            >
                              운동 완료
                            </button>
                          )}
                          {app.is_completed && (
                            <span className="text-green-600 text-xs font-bold bg-green-50 px-3 py-1 rounded-xl">완료</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full bg-violet-600 text-white py-3 rounded-xl text-base font-bold hover:bg-violet-700 transition"
                >
                  새 예약 추가하기
                </button>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-7">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">예약 날짜</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">시간</label>
                    <select
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-violet-400"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1">프로그램</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="예: 체성분 측정, 자세 교정 등"
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl text-base font-bold"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-violet-600 text-white py-3 rounded-xl text-base font-bold hover:bg-violet-700 transition disabled:opacity-50"
                  >
                    {loading ? "저장 중..." : "저장하기"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </section>
      {/* 토스트 메시지 */}
      {toast && (
        <div
          className={`fixed bottom-4 left-1/2 z-50 transform -translate-x-1/2 px-5 py-3 rounded-lg text-sm font-medium
            ${toastType === "success" ? "bg-violet-100 text-violet-700" : "bg-red-50 text-red-600"}
          `}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
