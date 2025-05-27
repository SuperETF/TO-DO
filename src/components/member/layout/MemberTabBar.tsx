export default function MemberTabBar() {
    return (
      <div className="fixed bottom-0 w-full bg-white shadow-lg border-t border-gray-200 z-50">
        <div className="grid grid-cols-5 h-16">
          <div className="flex flex-col items-center justify-center cursor-pointer text-teal-500">
            <i className="fas fa-home text-xl"></i>
            <span className="text-xs mt-1">홈</span>
          </div>
          <div className="flex flex-col items-center justify-center cursor-pointer text-gray-400">
            <i className="fas fa-calendar-alt text-xl"></i>
            <span className="text-xs mt-1">일정</span>
          </div>
          <div className="flex flex-col items-center justify-center cursor-pointer text-gray-400">
            <i className="fas fa-dumbbell text-xl"></i>
            <span className="text-xs mt-1">운동</span>
          </div>
          <div className="flex flex-col items-center justify-center cursor-pointer text-gray-400">
            <i className="fas fa-chart-line text-xl"></i>
            <span className="text-xs mt-1">분석</span>
          </div>
          <div className="flex flex-col items-center justify-center cursor-pointer text-gray-400">
            <i className="fas fa-user text-xl"></i>
            <span className="text-xs mt-1">프로필</span>
          </div>
        </div>
      </div>
    );
  }
  