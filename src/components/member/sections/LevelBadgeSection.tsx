import { useAchievement } from "../../../hooks/useAchievement";

interface Props {
  memberId: string;
}

export default function LevelBadgeSection({ memberId }: Props) {
  const {
    missionCount,
    workoutCount,
    routineCount,
    level,
    score,
  } = useAchievement(memberId);

  return (
    <section className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <h2 className="text-lg font-semibold mb-3">나의 성취</h2>

      <div className="flex items-center mb-4">
        <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-500 mr-3">
          <i className="fas fa-medal text-xl"></i>
        </div>

        <div className="flex-1">
          <div className="flex justify-between">
            <span className="font-medium text-base">레벨 {level}</span>
            <span className="text-sm text-gray-500">
              총 점수: {score.toLocaleString()}점
            </span>
          </div>
        </div>
      </div>

      <div className="text-sm text-center text-teal-600">
        미션 {missionCount}회, 운동 {workoutCount}회, 주간 운동 {routineCount}회 완료
      </div>
    </section>
  );
}
