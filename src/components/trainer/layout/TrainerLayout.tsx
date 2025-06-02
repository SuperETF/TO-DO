import Header from "./Header";
import MemberScrollBar from "./MemberScrollBar";
import BottomNav from "./BottomNav";
import MemberRegisterModal from "../sections/MemberRegisterModal";
import SegmentOverviewSection from "../sections/SegmentOverviewSection";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "../../../lib/supabaseClient"; // 세션 싱크용 직접 호출

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
  refetchMembers?: () => void;
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

  // supabase SDK로 직접 세션/트레이너 ID 추출
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    const fetchTrainerId = async () => {
      setLoadingSession(true);
      const { data: sessionData } = await supabase.auth.getSession();
      setTrainerId(sessionData.session?.user.id ?? null);
      setLoadingSession(false);
    };
    fetchTrainerId();
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    localStorage.setItem("activeTab", tab);
  };

  const handleOpenRegister = () => {
    if (!trainerId) {
      alert("세션 정보를 불러올 수 없습니다. 새로고침 또는 재로그인 해주세요.");
      return;
    }
    setModalOpen(true);
  };

  const handleRegisterSuccess = () => {
    refetchMembers && refetchMembers();
  };

  return (
    <div className="relative min-h-screen bg-gray-50 pb-[72px] px-4">
      <div className="max-w-screen-lg mx-auto relative">
        <Header />

        {activeTab !== "crm" && (
  <div className="fixed top-[64px] left-1/2 -translate-x-1/2 z-20 w-full max-w-screen-lg bg-white shadow-sm">
    <MemberScrollBar
      members={members}
      selectedId={selectedId}
      onSelect={onSelect}
    />
  </div>
)}

        <div className={`${activeTab === "crm" ? "pt-[72px]" : "pt-[140px]"}`}>
          {activeTab === "members" && children}
          {activeTab === "crm" && <SegmentOverviewSection />}
          {activeTab === "schedule" && <div>일정 섹션</div>}
          {activeTab === "stats" && <div>통계 섹션</div>}
        </div>

        <BottomNav
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          onOpenRegister={loadingSession ? () => {} : handleOpenRegister}
        />

        <MemberRegisterModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          trainerId={trainerId || undefined}
          onSuccess={handleRegisterSuccess}
        />
      </div>
    </div>
  );
}
