// src/components/trainer/containers/TrainerDashboardContainer.tsx

import { useEffect, useRef, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import MemberCard from "../cards/MemberCardContainer";
import Header from "../layout/Header";
import MemberScrollBar from "../layout/MemberScrollBar";

export default function TrainerDashboardContainer() {
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      const trainerId = localStorage.getItem("trainer_id");
      if (!trainerId) return;

      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("trainer_id", trainerId);

      if (error) {
        console.error("회원 정보 조회 실패:", error.message);
        return;
      }

      setMembers(data);
      if (data.length > 0) {
        setSelectedMemberId(data[0].id);
        setTimeout(() => {
          const el = document.getElementById(`member-${data[0].id}`);
          el?.scrollIntoView({ behavior: "auto", inline: "center" });
        }, 300);
      }
    };

    fetchMembers();
  }, []);

  const handleSelectMember = (id: string) => {
    setSelectedMemberId(id);
    const el = document.getElementById(`member-${id}`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center" });
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />

      <div className="fixed top-16 w-full z-30 bg-white shadow-sm">
        <MemberScrollBar
          members={members}
          selectedId={selectedMemberId}
          onSelect={handleSelectMember}
        />
      </div>

      <main className="pt-32 pb-24">
  <div className="max-w-screen-md sm:max-w-screen-lg mx-auto px-4">
    <div
      ref={scrollContainerRef}
      className="overflow-x-auto snap-x snap-mandatory touch-pan-x scrollbar-none"
    >
      <div className="flex gap-4">
        {members.map((member) => (
          <div
            key={member.id}
            id={`member-${member.id}`}
            className="min-w-full snap-center"
          >
            <MemberCard member={member} />
          </div>
        ))}
      </div>
    </div>
  </div>
</main>

    </div>
  );
}
