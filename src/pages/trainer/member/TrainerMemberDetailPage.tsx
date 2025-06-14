import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useSlide } from "../../../context/SlideContext";
import { supabase } from "../../../lib/supabaseClient";
import MemberCardContainer from "../../../components/trainer/cards/MemberCardContainer";

interface Member {
  id: string;
  name: string;
  phone_last4: string;
  created_at?: string;
}

export default function TrainerMemberDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { direction, setDirection } = useSlide();

  const [member, setMember] = useState<Member | null>(null);
  const [trainerId, setTrainerId] = useState<string | null>(null);

  // 1. 회원 정보 불러오기
  useEffect(() => {
    if (!id) return;

    const fetch = async () => {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) setMember(data);
    };
    fetch();

    // 2. 트레이너 ID 불러오기 (세션 기반)
    const fetchTrainer = async () => {
      // supabase.auth.getSession() or getUser() 모두 가능
      const { data: { user } } = await supabase.auth.getUser();
      setTrainerId(user?.id ?? null);
    };
    fetchTrainer();
  }, [id]);

  // 3. 로딩 상태 방어
  if (!member || !trainerId) {
    return (
      <div className="text-center py-12 text-sm text-gray-500">
        회원 정보를 불러오는 중입니다...
      </div>
    );
  }

  // 4. 정상 렌더링
  return (
    <motion.div
      initial={{ x: direction * 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: direction * -300, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="min-h-screen bg-gray-50 px-4 pt-6 pb-10 max-w-[890px] mx-auto">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => {
              setDirection(-1);
              navigate("/trainer-dashboard");
            }}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
          >
            <i className="fas fa-chevron-left text-sm"></i>
            <span>뒤로가기</span>
          </button>
          <h1 className="text-lg font-bold text-gray-800">{member.name}</h1>
          <div className="w-8" />
        </div>

        {/* 멤버 카드에 trainerId 반드시 전달 */}
        <MemberCardContainer member={member} trainerId={trainerId} />
      </div>
    </motion.div>
  );
}
