// src/components/trainer/containers/TrainerDashboardContainer.tsx

import { useEffect, useRef, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import MemberCard from "../cards/MemberCardContainer";
import Header from "../layout/Header";
import MemberScrollBar from "../layout/MemberScrollBar";

export default function TrainerDashboardContainer() {
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [showMemberRegistrationModal, setShowMemberRegistrationModal] = useState(false);
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

  // --- 새 회원 등록 모달은 따로 관리 (여기서는 버튼 예시만) ---

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
            style={{ WebkitOverflowScrolling: "touch" }}
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

      {/* 🟢 새 회원 등록 버튼 (FAB) 추가 */}
      <button
        onClick={() => setShowMemberRegistrationModal(true)}
        className="fixed right-4 bottom-24 bg-indigo-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-700 transition z-20"
        aria-label="새 회원 등록"
      >
        <i className="fas fa-user-plus text-2xl"></i>
      </button>

      {/* 🟡 회원 등록 모달/컴포넌트는 아래처럼 조건부로 추가 */}
      {showMemberRegistrationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
          {/* 여기에 회원 등록 컴포넌트 or 폼 삽입 */}
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">새 회원 등록</h2>
            {/* 회원 등록 폼/필드/취소 버튼 등 실제 구현 */}
            <button
              className="mt-4 px-4 py-2 bg-gray-200 rounded"
              onClick={() => setShowMemberRegistrationModal(false)}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
