interface ManageMenuSlideProps {
  trainerId: string;
  onClose: () => void;
  onSelectModal: (type: "info" | "member" | "notice") => void;
}

export default function ManageMenuSlide({ onClose, onSelectModal }: ManageMenuSlideProps) {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-md mx-auto text-center relative">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-0 right-0 mt-1 mr-1 text-gray-400 hover:text-gray-600"
          aria-label="닫기"
        >
          <i className="fas fa-times text-lg" />
        </button>
  
        <h1 className="text-2xl font-bold text-gray-800 mb-2">관리 메뉴</h1>
        <p className="text-gray-500 mb-8">필요한 기능을 선택하세요</p>
  
        <div className="space-y-4">
          <button
            onClick={() => {
              onClose();
              onSelectModal("info");
            }}
            className="w-full bg-white p-4 rounded-lg shadow-sm flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-[#6B4EFF]/10 rounded-full flex items-center justify-center mr-3">
                <i className="fas fa-info-circle text-[#6B4EFF] text-lg"></i>
              </div>
              <div className="text-left">
                <h3 className="text-gray-800 font-medium">정보 등록</h3>
                <p className="text-sm text-gray-500">센터 정보를 등록하고 관리하세요</p>
              </div>
            </div>
            <i className="fas fa-chevron-right text-gray-400"></i>
          </button>

          <button
            onClick={() => {
              onClose();
              onSelectModal("member");
            }}
            className="w-full bg-white p-4 rounded-lg shadow-sm flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-[#6B4EFF]/10 rounded-full flex items-center justify-center mr-3">
                <i className="fas fa-user-plus text-[#6B4EFF] text-lg"></i>
              </div>
              <div className="text-left">
                <h3 className="text-gray-800 font-medium">회원 등록</h3>
                <p className="text-sm text-gray-500">새로운 회원을 등록하세요</p>
              </div>
            </div>
            <i className="fas fa-chevron-right text-gray-400"></i>
          </button>

          <button
            onClick={() => {
              onClose();
              onSelectModal("notice");
            }}
            className="w-full bg-white p-4 rounded-lg shadow-sm flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 bg-[#6B4EFF]/10 rounded-full flex items-center justify-center mr-3">
                <i className="fas fa-bullhorn text-[#6B4EFF] text-lg"></i>
              </div>
              <div className="text-left">
                <h3 className="text-gray-800 font-medium">공지사항</h3>
                <p className="text-sm text-gray-500">공지사항을 작성하고 관리하세요</p>
              </div>
            </div>
            <i className="fas fa-chevron-right text-gray-400"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
