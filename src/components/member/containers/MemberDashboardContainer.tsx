// 리팩토링된 MemberDashboardContainer.tsx
import { useEffect, useState, type JSX } from "react";
import { supabase } from "../../../lib/supabaseClient";
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
import MemberRankingSection from "../sections/MemberRankingSection";
import Header from "../layout/MemberHeader";
import TabBar from "../layout/MemberTabBar";

export default function MemberDashboardContainer({ memberId }: { memberId: string }) {
  const [member, setMember] = useState<any>(null);
  const [sections, setSections] = useState<string[] | null>(null);

  useEffect(() => {
    const fetchMember = async () => {
      const { data } = await supabase
        .from("members")
        .select("*")
        .eq("id", memberId)
        .single();
      setMember(data);
    };
    fetchMember();
  }, [memberId]);

  useEffect(() => {
    const fetchSections = async () => {
      const { data, error } = await supabase
        .from("member_section_settings")
        .select("settings")
        .eq("member_id", memberId)
        .single();

      if (error || !data?.settings) {
        setSections(null); // fallback to default order
        return;
      }

      const enabledKeys = data.settings
        .filter((s: any) => s.enabled)
        .sort((a: any, b: any) => a.order - b.order)
        .map((s: any) => s.key);
      setSections(enabledKeys);
    };
    fetchSections();
  }, [memberId]);

  if (!member) return <div className="text-center pt-20">Loading...</div>;

  const renderIfIncluded = (key: string, element: JSX.Element) => {
    if (!sections) return true; // fallback 상태에서 전체 출력
    return sections.includes(key) ? element : null;
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <Header />
      <main className="pt-24 px-4 pb-20 max-w-screen-sm mx-auto">
        <h1 className="text-lg font-semibold mb-4">
          안녕하세요, <span className="text-teal-600">{member.name}</span>님!
        </h1>

        <div className="space-y-6">
        <CenterAnnouncementSection trainerId={member.trainer_id} />
        <CenterInfoCardSection trainerId={member.trainer_id} />

        {renderIfIncluded(
  "workout",
  <WeeklyExerciseSection memberId={memberId} registrationDate={member?.registration_date ?? new Date().toISOString()}/>)}
  {renderIfIncluded("routine", <WeeklyRoutineTrackerSection memberId={memberId} />)}
  {renderIfIncluded("mission", <MonthlyMissionSection memberId={memberId} />)}
  {renderIfIncluded("achievement", <LevelBadgeSection memberId={memberId} />)}
  <MemberRankingSection memberId={memberId} />
  {renderIfIncluded("appointment", <NextAppointmentSection memberId={memberId} />)}
  {renderIfIncluded("note", <TrainerCommentSection memberId={memberId} />)}
  {renderIfIncluded("pain", <PainScoreChartSection memberId={memberId} />)}
  {renderIfIncluded("body", <BodyCompositionChartSection memberId={memberId} />)}
  <WorkoutHistorySection memberId={memberId} />

  {/* 아래는 준비 중인 섹션들 */}

</div>

      </main>
      <TabBar />
    </div>
  );
}