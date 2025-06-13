import { useEffect, useState } from "react";
import { useAchievement } from "../../../hooks/useAchievement";

interface Props {
  memberId: string;
}

export default function AchievementSummarySection({ memberId }: Props) {
  const [mounted, setMounted] = useState(false);

  const {
    missionCount,
    routineCount,
    lessonCount,
    level,
    percent,
    score,
  } = useAchievement(memberId);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <section className="bg-gray-50 rounded-xl border p-4 mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">회원 성취 요약</h3>
      <div className="text-sm text-gray-800 space-y-1">
        <p>
          🎯 <b>레벨:</b> {level} ({percent}%)
        </p>
        <p>
          📊 <b>총 점수:</b> {score.toLocaleString()}점
        </p>
        <p>
          🏁 미션 완료: {missionCount}회 / 주간 루틴: {routineCount}회 / 1:1 레슨: {lessonCount}회
        </p>
      </div>
    </section>
  );
}
