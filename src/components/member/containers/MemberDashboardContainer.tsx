import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import Header from "../layout/MemberHeader";
import TabBar from "../layout/MemberTabBar";
import WeeklyExerciseSection from "../sections/WeeklyExerciseSection";
import WeeklyRoutineTrackerSection from "../sections/WeeklyRoutineTrackerSection";
import MonthlyMissionSection from "../sections/MonthlyMissionSection";
import LevelBadgeSection from "../sections/LevelBadgeSection";
import NextAppointmentSection from "../sections/NextAppointmentSection";
import TrainerCommentSection from "../sections/TrainerCommentSection";
import PainScoreChartSection from "../sections/PainScoreChartSection";
import BodyCompositionChartSection from "../sections/BodyCompositionChartSection";
import WorkoutHistorySection from "../sections/WorkoutHistorySection";
import CenterAnnouncementSection from "../sections/CenterAnnouncementSection";
import CenterInfoCardSection from "../sections/CenterInfoCardSection";
import { useAchievement } from "../../../hooks/useAchievement";
import { useSearchParams } from "react-router-dom";

interface Props {
  memberId?: string;
  readOnly?: boolean;
}

export default function MemberDashboardContainer({ memberId, readOnly = false }: Props) {
  const [member, setMember] = useState<any>(null);
  const [params] = useSearchParams();
  const memberIdFromStorage = localStorage.getItem("member_id");

  useEffect(() => {
    const fetchMember = async () => {
      const id = memberId ?? params.get("memberId") ?? memberIdFromStorage;
      if (!id) return;

      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) setMember(data);
    };

    fetchMember();
  }, [memberId]);

  const achievement = useAchievement(member?.id);

  if (!member) return <div className="text-center pt-20">Loading...</div>;

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <Header />

      <main className="pt-24 px-4 pb-20 max-w-screen-sm mx-auto">
        <h1 className="text-lg font-semibold mb-4">
          안녕하세요, <span className="text-teal-600">{member.name}</span>님!
        </h1>

        <div className="space-y-6">
          {/* ✅ 상단 고정 공지 섹션 */}
          <CenterAnnouncementSection readOnly={readOnly} />
          <CenterInfoCardSection readOnly={readOnly} />

          {/* ✅ 이번 주 운동부터 기존 섹션들 */}
          <WeeklyExerciseSection
            memberId={member.id}
            registrationDate={member.created_at}
            refetch={achievement.refetch}
            readOnly={readOnly}
          />
          <WeeklyRoutineTrackerSection
            memberId={member.id}
            refetch={achievement.refetch}
            readOnly={readOnly}
          />
          <MonthlyMissionSection
            memberId={member.id}
            refetch={achievement.refetch}
            readOnly={readOnly}
          />
          <LevelBadgeSection
            memberId={member.id}
            {...achievement}
            readOnly={readOnly}
          />
          <NextAppointmentSection memberId={member.id} readOnly={readOnly} />
          <TrainerCommentSection memberId={member.id} readOnly={readOnly} />
          <PainScoreChartSection memberId={member.id} readOnly={readOnly} />
          <BodyCompositionChartSection memberId={member.id} readOnly={readOnly} />
          <WorkoutHistorySection memberId={member.id} readOnly={readOnly} />
        </div>
      </main>

      {!readOnly && <TabBar />}
    </div>
  );
}