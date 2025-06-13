
interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  onOpenManageSlide: () => void;
}

const tabs = [
  { id: "members", icon: "users", label: "회원 관리" },
  { id: "crm", icon: "chart-pie", label: "CRM" },
  { id: "schedule", icon: "calendar-alt", label: "일정" },
  { id: "stats", icon: "chart-line", label: "통계" },
];

function BottomNav({ activeTab, setActiveTab, onOpenManageSlide }: BottomNavProps) {
  return (
    <nav
      className="w-full grid grid-cols-5 border-t bg-white text-xs text-gray-600 shadow-lg"
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

      {/* ✅ 정보 등록 슬라이드 버튼 */}
      <button
        onClick={onOpenManageSlide}
        className="flex flex-col items-center justify-center py-2 transition-all text-blue-600 font-semibold"
      >
        <i className="fas fa-sliders-h text-xl mb-1" />
        <span>정보 등록</span>
      </button>
    </nav>
  );
}

export default BottomNav;