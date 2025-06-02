import Header from "./Header";
import MemberScrollBar from "./MemberScrollBar";
import BottomNav from "./BottomNav";
import MemberRegisterModal from "../sections/MemberRegisterModal";
import SegmentOverviewSection from "../sections/SegmentOverviewSection";
import { useState } from "react";
import type { ReactNode } from "react";
import { useSession } from "@supabase/auth-helpers-react";

interface Member {
  id: string;
  name: string;
  phone_last4: string;
}

interface TrainerLayoutProps {
  children: ReactNode;
  members: Member[];
  selectedId: string;
  onSelect: (id: string) => void;
  refetchMembers?: () => void; // 회원 등록 후 갱신용 (필요시)
}

export default function TrainerLayout({
  children,
  members,
  selectedId,
  onSelect,
  refetchMembers,
}: TrainerLayoutProps) {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("activeTab") || "members";
  });

  const [modalOpen, setModalOpen] = useState(false);
  const session = useSession();
  const trainerId = session?.user?.id ?? "";

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    localStorage.setItem("activeTab", tab);
  };

  const handleRegisterSuccess = () => {
    // 등록 성공 시 회원 목록 갱신
    refetchMembers && refetchMembers();
  };

  return (
    <div className="relative min-h-screen bg-gray-50 pb-[72px]">
      <Header />

      {activeTab !== "crm" && (
        <div className="fixed top-[64px] z-20 w-full bg-white shadow-sm">
          <MemberScrollBar
            members={members}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        </div>
      )}

      <div className={`${activeTab === "crm" ? "pt-[72px]" : "pt-[140px]"} px-4`}>
        {activeTab === "members" && children}
        {activeTab === "crm" && <SegmentOverviewSection />}
        {activeTab === "schedule" && <div>일정 섹션</div>}
        {activeTab === "stats" && <div>통계 섹션</div>}
      </div>

      {/* 하단 네비게이션 – 회원 등록 버튼 추가 */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onOpenRegister={() => setModalOpen(true)}
      />

      {/* 회원 등록 모달 */}
      <MemberRegisterModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        trainerId={trainerId}
        onSuccess={handleRegisterSuccess}
      />
    </div>
  );
}
