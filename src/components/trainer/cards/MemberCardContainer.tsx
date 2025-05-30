import { useRef, useState } from "react";
import ConditionSection from "../../../components/trainer/sections/ConditionSection";
import WorkoutSection from "../../../components/trainer/sections/WorkoutSection";
import TrainerNoteSection from "../../../components/trainer/sections/TrainerNoteSection";
import BodyCompositionSection from "../../../components/trainer/sections/BodyCompositionSection";
import FeedbackSection from "../../../components/trainer/sections/FeedbackSection";
import AppointmentSection from "../../../components/trainer/sections/AppointmentSection";
import MissionSection from "../../../components/trainer/sections/MissionSection";
import PainLogManagerSection from "../../../components/trainer/sections/PainLogManagerSection";
import TrainerRecommendationInputSection from "../../../components/trainer/sections/TrainerRecommendationInputSection";

interface Member {
  id: string;
  name: string;
  phone_last4: string;
  created_at?: string;
}

interface Props {
  member: Member;
}

export default function MemberCardContainer({ member }: Props) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleSection = (section: string) => {
    setActiveSection((prev) => (prev === section ? null : section));
  };

  const handleSave = (message: string) => {
    setToast(message);
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast(""), 2500);
  };

  return (
    <div
  id={`member-${member.id}`}
  className="rounded-xl bg-white shadow-lg overflow-y-auto h-full touch-pan-y scrollbar-none mt-4 mb-8"
  style={{ overscrollBehaviorY: "contain" }}
>
      <div className="bg-gradient-to-r from-[#6C4CF1] to-[#A083F7] text-white p-4">
        <h2 className="text-lg font-bold">{member.name}</h2>
        <p className="text-sm">회원번호 {member.phone_last4}</p>
        {member.created_at && (
          <p className="text-xs text-white/80 mt-1">
            가입일: {new Date(member.created_at).toLocaleDateString("ko-KR")}
          </p>
        )}
      </div>
      <div className="space-y-4 p-4">
        <AccordionItem
          title="오늘의 컨디션"
          isOpen={activeSection === "condition"}
          onToggle={() => toggleSection("condition")}
        >
          <ConditionSection memberId={member.id} onSaved={() => handleSave("컨디션 저장 완료")} />
        </AccordionItem>
        <AccordionItem
          title="운동 기록"
          isOpen={activeSection === "workout"}
          onToggle={() => toggleSection("workout")}
        >
          <WorkoutSection memberId={member.id} onSaved={() => handleSave("운동 기록 저장 완료")} />
        </AccordionItem>
        <AccordionItem
          title="체성분 분석"
          isOpen={activeSection === "body"}
          onToggle={() => toggleSection("body")}
        >
          <BodyCompositionSection memberId={member.id} />
        </AccordionItem>
        <AccordionItem
          title="피드백"
          isOpen={activeSection === "feedback"}
          onToggle={() => toggleSection("feedback")}
        >
          <FeedbackSection memberId={member.id} />
        </AccordionItem>
        <AccordionItem
          title="예약 일정"
          isOpen={activeSection === "appointment"}
          onToggle={() => toggleSection("appointment")}
        >
          <AppointmentSection memberId={member.id} />
        </AccordionItem>
        <AccordionItem
          title="이달의 미션"
          isOpen={activeSection === "mission"}
          onToggle={() => toggleSection("mission")}
        >
          <MissionSection memberId={member.id} />
        </AccordionItem>
        <AccordionItem
          title="트레이너 메모"
          isOpen={activeSection === "note"}
          onToggle={() => toggleSection("note")}
        >
          <TrainerNoteSection memberId={member.id} onSaved={() => handleSave("메모 저장 완료")} />
        </AccordionItem>
        <AccordionItem
          title="통증 점수 입력 (날짜별)"
          isOpen={activeSection === "pain"}
          onToggle={() => toggleSection("pain")}
        >
          <PainLogManagerSection memberId={member.id} />
        </AccordionItem>
        <AccordionItem
          title="추천 운동 입력"
          isOpen={activeSection === "recommend"}
          onToggle={() => toggleSection("recommend")}
        >
          <TrainerRecommendationInputSection
            memberId={member.id}
            trainerName="이호진" 
          />
        </AccordionItem>
      </div>
      {/* 토스트 메시지 */}
      {toast && (
        <div className="px-4 pb-4">
          <div className="p-3 text-center bg-green-100 text-green-700 text-sm font-medium rounded-lg shadow">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}

function AccordionItem({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-lg bg-white border transition shadow-sm ${
        isOpen ? "border-indigo-500" : "border-gray-200"
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center px-5 py-4 text-sm sm:text-base font-semibold text-gray-800 hover:bg-gray-50 transition"
      >
        <span>{title}</span>
        <i
          className={`fas ${
            isOpen ? "fa-chevron-up" : "fa-chevron-down"
          } text-gray-500`}
        ></i>
      </button>
      {isOpen && <div className="px-5 py-4 pt-0 bg-white">{children}</div>}
    </div>
  );
}
