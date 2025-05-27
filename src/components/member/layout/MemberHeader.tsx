export default function MemberHeader() {
    return (
      <header className="fixed top-0 w-full bg-white shadow-sm z-50">
        <div className="flex justify-between items-center px-4 py-3">
          <div className="flex items-center">
            <i className="fas fa-dumbbell text-teal-500 mr-2"></i>
            <span className="font-semibold text-lg">TO-DO 대시보드</span>
          </div>
          <div className="flex items-center">
            <i className="far fa-bell text-gray-500 mr-4 cursor-pointer"></i>
            <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white">
              <span className="text-sm">ME</span>
            </div>
          </div>
        </div>
      </header>
    );
  }
  