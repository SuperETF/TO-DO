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
import { useAchievement } from "../../../hooks/useAchievement"; // ✅ 중앙 상태 훅 추가

export default function MemberDashboardContainer() {
  const [member, setMember] = useState<any>(null);

  useEffect(() => {
    const fetchMember = async () => {
      const memberId = localStorage.getItem("member_id");
      if (!memberId) return;

      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("id", memberId)
        .single();

      if (!error && data) setMember(data);
    };

    fetchMember();
  }, []);

  // ✅ member.id 확인 후 성취 상태 훅 적용
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
          <WeeklyExerciseSection
            memberId={member.id}
            registrationDate={member.created_at}
            refetch={achievement.refetch} // ✅ 추가
          />
          <WeeklyRoutineTrackerSection
            memberId={member.id}
            refetch={achievement.refetch} // ✅ 추가
          />
          <MonthlyMissionSection
            memberId={member.id}
            refetch={achievement.refetch} // ✅ 추가
          />
          <LevelBadgeSection
            memberId={member.id}
            {...achievement} // ✅ 상태 바로 전달
          />
          <NextAppointmentSection memberId={member.id} />
          <TrainerCommentSection memberId={member.id} />
          <PainScoreChartSection memberId={member.id} />
          <BodyCompositionChartSection memberId={member.id} />
          <WorkoutHistorySection memberId={member.id} />
        </div>
      </main>

      <TabBar />
    </div>
  );
}
