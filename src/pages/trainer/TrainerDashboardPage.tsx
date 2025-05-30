// src/pages/trainer-dashboard/TrainerDashboardPage.tsx

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import TrainerLayout from "../../components/trainer/layout/TrainerLayout";
import TrainerDashboardContainer from "../../components/trainer/containers/TrainerDashboardContainer";

interface Member {
  id: string;
  name: string;
  phone_last4: string;
  created_at?: string;
  trainer_id?: string;
}

export default function TrainerDashboardPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    const fetchSessionAndMembers = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const trainerId = sessionData.session?.user.id;
      if (!trainerId) return;

      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("trainer_id", trainerId);

      if (error) {
        console.error("회원 조회 실패:", error.message);
        return;
      }

      if (data && data.length > 0) {
        setMembers(data);
        setSelectedId(data[0].id);
      }
    };

    fetchSessionAndMembers();
  }, []);

  const selectedMember = members.find((m) => m.id === selectedId);

  if (!selectedMember) {
    return <p className="text-center py-10 text-sm text-gray-500">회원 정보를 불러오는 중입니다...</p>;
  }

  return (
    <TrainerLayout
      members={members}
      selectedId={selectedId}
      onSelect={setSelectedId}
    >
      <TrainerDashboardContainer member={selectedMember} />
    </TrainerLayout>
  );
}
