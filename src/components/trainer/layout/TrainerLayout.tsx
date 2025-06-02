import Header from "./Header";
import MemberScrollBar from "./MemberScrollBar";
import BottomNav from "./BottomNav";
import SegmentOverviewSection from "../sections/SegmentOverviewSection";
import { useState } from "react";
import type { ReactNode } from "react";

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
}

export default function TrainerLayout({
  children,
  members,
  selectedId,
  onSelect,
}: TrainerLayoutProps) {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("activeTab") || "members";
  });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    localStorage.setItem("activeTab", tab);
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
        {activeTab === "settings" && <div>설정 섹션</div>}
      </div>

      <BottomNav activeTab={activeTab} setActiveTab={handleTabChange} />
    </div>
  );
}
