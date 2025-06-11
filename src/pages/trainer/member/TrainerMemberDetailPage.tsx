// src/pages/trainer/member/[id].tsx

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
  const { direction, setDirection } = useSlide(); // ✅ 슬라이드 방향 사용

  const [member, setMember] = useState<Member | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetch = async () => {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("회원 정보 불러오기 실패:", error.message);
        return;
      }

      setMember(data);
    };

    fetch();
  }, [id]);

  if (!member) {
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
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => {
              setDirection(-1); // ✅ 뒤로가기 전 슬라이드 방향 설정
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

        {/* 멤버 카드 */}
        <MemberCardContainer member={member} />
      </div>
    </motion.div>
  );
}
