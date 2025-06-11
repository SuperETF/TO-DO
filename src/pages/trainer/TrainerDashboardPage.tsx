import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import Header from "../../components/trainer/layout/Header";
import BottomNav from "../../components/trainer/layout/BottomNav";
import MemberRegisterModal from "../../components/trainer/sections/MemberRegisterModal";
import SegmentOverviewSection from "../../components/trainer/sections/SegmentOverviewSection";
import { useSlide } from "../../context/SlideContext";

interface Member {
  id: string;
  name: string;
  phone_last4: string;
  created_at?: string;
  trainer_id?: string;
}

export default function TrainerDashboardPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("members");
  const [modalOpen, setModalOpen] = useState(false);
  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { setDirection, direction } = useSlide();

  useEffect(() => {
    const fetchMembers = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const trainerId = sessionData.session?.user.id;
      if (!trainerId) return;
      setTrainerId(trainerId);

      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("trainer_id", trainerId);

      if (!error && data) setMembers(data);
    };

    fetchMembers();
  }, []);

  // ✅ 페이지 이동 시 확대 상태 초기화
  useEffect(() => {
    setSelectedMemberId(null);
  }, [location.pathname]);

  const filtered = members
    .filter((m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.phone_last4.includes(search)
    )
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));

  return (
    <motion.div
      initial={{ x: direction * 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: direction * -300, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="relative min-h-screen bg-gray-50 flex flex-col items-center">
        <div className="w-full max-w-[890px]">
          <Header />
        </div>

        <main className="flex-1 overflow-auto pt-8 pb-24 px-4 w-full max-w-[890px]">
          {activeTab === "members" && (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-4">회원 관리</h2>
              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="회원 검색"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full py-3 pl-10 pr-4 bg-white border-none rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#6B4EFF]"
                />
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              <div className="space-y-3">
                {filtered.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6">검색 결과가 없습니다.</p>
                ) : (
                  filtered.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => {
                        setSelectedMemberId(member.id); // 확대 상태 부여
                        setDirection(1);
                        navigate(`/trainer/member/${member.id}`);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg flex justify-between items-center transition-transform duration-300 ${
                        selectedMemberId === member.id
                          ? "scale-105 bg-white shadow-md"
                          : "scale-100 bg-white shadow-sm"
                      } hover:bg-gray-50`}
                    >
                      <span className="text-sm font-medium text-gray-800">
                        {member.name} ({member.phone_last4})
                      </span>
                      <i className="fas fa-chevron-right text-gray-400" />
                    </button>
                  ))
                )}
              </div>
            </>
          )}

          {activeTab === "crm" && <SegmentOverviewSection />}
          {activeTab === "schedule" && (
            <div className="text-center text-gray-400 text-sm py-8">일정 페이지 준비 중...</div>
          )}
          {activeTab === "stats" && (
            <div className="text-center text-gray-400 text-sm py-8">통계 페이지 준비 중...</div>
          )}
        </main>

        <div className="fixed bottom-0 left-0 right-0 z-10 flex justify-center">
          <div className="w-full max-w-[890px]">
            <BottomNav
              activeTab={activeTab}
              setActiveTab={(tab) => {
                if (tab !== activeTab) {
                  setDirection(1);
                  setActiveTab(tab);
                }
              }}
              onOpenRegister={() => setModalOpen(true)}
            />
          </div>
        </div>

        <MemberRegisterModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          trainerId={trainerId || undefined}
          onSuccess={() => {
            setMembers([]);
          }}
        />
      </div>
    </motion.div>
  );
}
