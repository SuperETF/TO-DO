import { useAchievement } from "../../../hooks/useAchievement";

interface Props {
  memberId: string;
  level?: number;
  percent?: number;
  missionCount?: number;
  workoutCount?: number;
  routineCount?: number;
  readOnly?: boolean; // ✅ readOnly prop 추가
}

export default function LevelBadgeSection({ memberId, readOnly = false }: Props) {
  void readOnly; 
  const {
    missionCount,
    workoutCount,
    routineCount,
    level,
    percent,
  } = useAchievement(memberId);

  return (
    <section className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <h2 className="text-lg font-semibold mb-3">나의 성취</h2>

      <div className="flex items-center mb-3">
        <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-500 mr-3">
          <i className="fas fa-medal text-xl"></i>
        </div>

        <div className="flex-1">
          <div className="flex justify-between mb-1">
            <span className="font-medium">레벨 {level}</span>
            <span className="text-gray-500 text-sm">업적 기반</span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-teal-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${percent}%` }}
            ></div>
          </div>
        </div>
      </div>

      <p className="text-sm text-center text-teal-600 mb-4">
        미션 {missionCount}회, 운동 {workoutCount}회, 주간 운동 {routineCount}회 완료
      </p>
    </section>
  );
}
