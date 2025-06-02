import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

interface Member {
  id: string;
  name: string;
  phone_last4: string;
  segment: "A" | "B" | "C";
  registrationDate?: string;
}

export default function SegmentOverviewSection() {
  const [members, setMembers] = useState<Member[]>([]);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<"all" | "A" | "B" | "C">("all");
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const getTrainer = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setTrainerId(user?.id ?? null);
    };
    getTrainer();
  }, []);

  const fetchMembers = async (trainerId: string) => {
    const { data, error } = await supabase
      .from("members")
      .select("id, name, phone_last4, segment, created_at")
      .eq("trainer_id", trainerId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const formatted = data.map((m) => ({
        ...m,
        registrationDate: new Date(m.created_at).toLocaleDateString(),
      }));
      setMembers(formatted);
    }
  };

  useEffect(() => {
    if (trainerId) fetchMembers(trainerId);
  }, [trainerId]);

  const handleSegmentChange = async (id: string, newSegment: "A" | "B" | "C") => {
    const { error } = await supabase.from("members").update({ segment: newSegment }).eq("id", id);
    if (!error) {
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, segment: newSegment } : m))
      );
      setToastMessage(`등급이 ${newSegment}로 변경되었습니다`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  return (
    <div className="pt-20 pb-24 px-4">
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="text-lg font-semibold mb-4">회원 등급 관리</h2>
        <div className="flex space-x-2 mb-6">
          {["all", "A", "B", "C"].map((seg) => (
            <button
              key={seg}
              onClick={() => setSelectedSegment(seg as any)}
              className={`px-4 py-2 rounded-lg text-sm flex-1 ${
                selectedSegment === seg
                  ? seg === "A"
                    ? "bg-green-600 text-white"
                    : seg === "B"
                    ? "bg-yellow-500 text-white"
                    : seg === "C"
                    ? "bg-red-500 text-white"
                    : "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {seg === "all" ? "전체" : `${seg} 등급`}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {members
            .filter((m) => selectedSegment === "all" || m.segment === selectedSegment)
            .map((member) => (
              <div key={member.id} className="border rounded-lg p-4 hover:bg-gray-50 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{member.name}</h3>
                    <p className="text-sm text-gray-500">{member.phone_last4}</p>
                    <p className="text-xs text-gray-400 mt-1">등록일: {member.registrationDate}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      member.segment === "A"
                        ? "bg-green-100 text-green-800"
                        : member.segment === "B"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {member.segment} 등급
                    </span>
                    <select
                      value={member.segment}
                      onChange={(e) => handleSegmentChange(member.id, e.target.value as "A" | "B" | "C")}
                      className="text-sm border-none bg-gray-50 rounded-lg cursor-pointer"
                    >
                      <option value="A">A 로 변경</option>
                      <option value="B">B 로 변경</option>
                      <option value="C">C 로 변경</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold mb-4">등급별 통계</h2>
        <div className="grid grid-cols-3 gap-4">
          {["A", "B", "C"].map((seg) => (
            <div
              key={seg}
              className={`p-4 rounded-lg border ${
                seg === "A"
                  ? "bg-green-50 border-green-100"
                  : seg === "B"
                  ? "bg-yellow-50 border-yellow-100"
                  : "bg-red-50 border-red-100"
              }`}
            >
              <div
                className={`font-semibold ${
                  seg === "A"
                    ? "text-green-600"
                    : seg === "B"
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {seg}
              </div>
              <div className="text-2xl font-bold mt-1">
                {members.filter((m) => m.segment === seg).length}명
              </div>
            </div>
          ))}
        </div>
      </div>

      {showToast && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg shadow">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
