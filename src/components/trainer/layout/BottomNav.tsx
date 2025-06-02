import { useState } from "react";

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  onOpenRegister: () => void; // 회원등록 버튼 클릭 핸들러
}

const tabs = [
  { id: "members", icon: "users", label: "회원 관리" },
  { id: "crm", icon: "chart-pie", label: "CRM" },
  { id: "schedule", icon: "calendar-alt", label: "일정" },
  { id: "stats", icon: "chart-line", label: "통계" },
];

function BottomNav({ activeTab, setActiveTab, onOpenRegister }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 w-full grid grid-cols-5 border-t bg-white
                 text-xs text-gray-600 z-50 shadow-lg rounded-t-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center py-2 transition-all ${
              isActive ? "text-purple-600 font-semibold" : "text-gray-500"
            }`}
          >
            <i
              className={`fas fa-${tab.icon} text-xl mb-1 ${
                isActive ? "text-purple-600" : "text-gray-500"
              }`}
            />
            <span>{tab.label}</span>
          </button>
        );
      })}
      {/* 회원 등록 버튼 */}
      <button
        onClick={onOpenRegister}
        className="flex flex-col items-center justify-center py-2 transition-all text-blue-600 font-semibold"
      >
        <i className="fas fa-user-plus text-xl mb-1" />
        <span>회원 등록</span>
      </button>
    </nav>
  );
}

export default BottomNav;
