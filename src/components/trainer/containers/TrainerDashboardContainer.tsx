import { useEffect, useRef, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import MemberCard from "../cards/MemberCardContainer";
import Header from "../layout/Header";
import MemberScrollBar from "../layout/MemberScrollBar";

interface Member {
  id: string;
  name: string;
  phone_last4: string;
  trainer_id: string;
}

interface Props {
  selectedMemberId: string;
}

export default function TrainerDashboardContainer({ selectedMemberId }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [showMemberRegistrationModal, setShowMemberRegistrationModal] = useState(false);

  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberPhoneLast4, setNewMemberPhoneLast4] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // 선택된 멤버 id는 외부에서 props로 받기 때문에 내부 상태로 따로 유지하지 않음
  const selectedId = selectedMemberId;

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    // 선택된 멤버 위치로 스크롤
    const el = document.getElementById(`member-${selectedId}`);
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: "auto", inline: "center" });
      }, 300);
    }
  }, [selectedId]);

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
  };

  const handleSelectMember = (id: string) => {
    const el = document.getElementById(`member-${id}`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center" });
  };

  const handleRegisterMember = async () => {
    setRegisterError("");
    if (!newMemberName || !newMemberPhoneLast4) {
      setRegisterError("이름과 휴대폰 뒷자리 4자리를 모두 입력하세요.");
      return;
    }

    if (!/^\d{4}$/.test(newMemberPhoneLast4)) {
      setRegisterError("휴대폰 뒷자리 4자리는 숫자 4자리여야 합니다.");
      return;
    }

    setIsRegistering(true);
    try {
      const trainerId = localStorage.getItem("trainer_id");
      const { error } = await supabase.from("members").insert([
        {
          name: newMemberName,
          phone_last4: newMemberPhoneLast4,
          trainer_id: trainerId,
        },
      ]);
      if (error) {
        setRegisterError("회원 등록 실패: " + error.message);
      } else {
        setShowMemberRegistrationModal(false);
        setNewMemberName("");
        setNewMemberPhoneLast4("");
        await fetchMembers();
      }
    } catch {
      setRegisterError("알 수 없는 오류가 발생했습니다.");
    }
    setIsRegistering(false);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />

      <div className="fixed top-16 w-full z-30 bg-white shadow-sm">
        <MemberScrollBar
          members={members}
          selectedId={selectedId}
          onSelect={handleSelectMember}
        />
      </div>

      <main className="pt-[7rem] pb-24">
        <div className="max-w-screen-md sm:max-w-screen-lg mx-auto px-4">
          <div
            ref={scrollContainerRef}
            className="overflow-x-auto snap-x snap-mandatory touch-pan-x scrollbar-none"
            style={{
              WebkitOverflowScrolling: "touch",
              height: "calc(100vh - 9rem)"
            }}
          >
            <div className="flex gap-4 items-stretch h-full">
              {members.map((member) => (
                <div
                  key={member.id}
                  id={`member-${member.id}`}
                  className="min-w-full max-w-full snap-center h-full"
                >
                  <MemberCard member={member} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <button
        onClick={() => setShowMemberRegistrationModal(true)}
        className="fixed right-4 bottom-24 bg-indigo-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-700 transition z-20"
        aria-label="새 회원 등록"
      >
        <i className="fas fa-user-plus text-2xl" />
      </button>

      {showMemberRegistrationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">새 회원 등록</h2>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">이름</label>
              <input
                className="w-full border p-2 rounded"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="회원 이름"
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">휴대폰 뒷자리 4자리</label>
              <input
                className="w-full border p-2 rounded"
                value={newMemberPhoneLast4}
                onChange={(e) =>
                  setNewMemberPhoneLast4(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))
                }
                placeholder="예: 1234"
                maxLength={4}
              />
              <div className="text-xs text-gray-500 mt-1">
                회원 로그인 시 사용할 뒷자리 4자리
              </div>
            </div>
            {registerError && (
              <div className="text-red-500 text-sm mb-2">{registerError}</div>
            )}
            <div className="flex space-x-2 mt-4">
              <button
                onClick={() => setShowMemberRegistrationModal(false)}
                className="flex-1 bg-gray-200 py-2 rounded"
                disabled={isRegistering}
              >
                닫기
              </button>
              <button
                onClick={handleRegisterMember}
                className="flex-1 bg-indigo-600 text-white py-2 rounded"
                disabled={isRegistering}
              >
                {isRegistering ? "등록 중..." : "등록"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
