import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useSlide } from "../../../context/SlideContext";
import { supabase } from "../../../lib/supabaseClient";
import MemberCardContainer from "../../../components/trainer/cards/MemberCardContainer";

// 반드시 props에 추가!
interface Props {
  setSelectedMemberId: (id: string | null) => void;
}

interface Member {
  id: string;
  name: string;
  phone_last4: string;
  created_at?: string;
}

export default function TrainerMemberDetailPage({ setSelectedMemberId }: Props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { direction, setDirection } = useSlide();

  const [member, setMember] = useState<Member | null>(null);
  const [trainerId, setTrainerId] = useState<string | null>(null);

  // ✅ 상세 페이지 진입 시 강조 해제 (scale-105 풀림)
  useEffect(() => {
    setSelectedMemberId(null);
  }, [setSelectedMemberId]);

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

    const fetchTrainer = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setTrainerId(user?.id ?? null);
    };
    fetchTrainer();
  }, [id]);

  if (!member || !trainerId) {
    return (
      <div className="text-center py-12 text-sm text-gray-500">
        회원 정보를 불러오는 중입니다...
      </div>
    );
  }

  return (
    <motion.div
      initial={{ x: direction * 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: direction * -300, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="min-h-screen bg-gray-50 px-4 pt-6 pb-10 max-w-[890px] mx-auto">
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
        <MemberCardContainer member={member} trainerId={trainerId} />
      </div>
    </motion.div>
  );
}
