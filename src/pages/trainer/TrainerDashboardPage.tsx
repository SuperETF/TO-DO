import { useEffect, useState } from "react";
import TrainerLayout from "../../components/trainer/layout/TrainerLayout";
import TrainerDashboardContainer from "../../components/trainer/containers/TrainerDashboardContainer";
import { supabase } from "../../lib/supabaseClient";

interface Member {
  id: string;
  name: string;
  phone_last4: string;
}

export default function TrainerDashboardPage() {
  const [trainerId, setTrainerId] = useState<string>("");
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    const fetchSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        console.error("세션 없음: 로그인 필요");
        return;
      }

      const uid = data.session.user.id;
      setTrainerId(uid);
    };

    fetchSession();
  }, []);

  useEffect(() => {
    if (!trainerId) return;

    const fetchMembers = async () => {
      const { data, error } = await supabase
        .from("members")
        .select("id, name, phone_last4")
        .eq("trainer_id", trainerId);

      if (error) {
        console.error("멤버 불러오기 실패:", error.message);
        return;
      }

      if (data && data.length > 0) {
        setMembers(data);
        setSelectedId(data[0].id);
      }
    };

    fetchMembers();
  }, [trainerId]);

  if (!selectedId) {
    return <p className="text-center py-10 text-sm text-gray-500">회원 정보를 불러오는 중입니다...</p>;
  }

  return (
    <TrainerLayout
      members={members}
      selectedId={selectedId}
      onSelect={setSelectedId}
    >
      <TrainerDashboardContainer selectedMemberId={selectedId} />
    </TrainerLayout>
  );
}
