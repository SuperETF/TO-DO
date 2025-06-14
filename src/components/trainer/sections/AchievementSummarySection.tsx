import { useEffect, useState } from "react";
import { useAchievement } from "../../../hooks/useAchievement";

// 폰트어썸 아이콘 사용 전제. 라이브러리 불러와야 함.

interface Props {
  memberId: string;
}

export default function AchievementSummarySection({ memberId }: Props) {
  const [mounted, setMounted] = useState(false);

  const {
    missionCount,
    routineCount,
    lessonCount,
    percent,
    score,
  } = useAchievement(memberId);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // 데이터 없는 경우 판별
  // 데이터 없는 경우 판별
  const hasData = missionCount > 0 || routineCount > 0 || lessonCount > 0 || score > 0;

  return (
    <section className="bg-white rounded-2xl p-6 w-full mb-4">
      <div className="flex items-center mb-3">
        <i className="fas fa-trophy text-yellow-500 mr-2 text-xl" />
        <span className="font-bold text-base md:text-lg">회원 성취 요약</span>
      </div>

      {hasData ? (
        <>
          {/* 진행 퍼센트 slim progress bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">레벨 진행도</span>
              <span className="text-sm font-medium">{percent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className="bg-blue-500 h-1 rounded-full transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          {/* 통계 4개: 총점수, 미션, 루틴, 레슨 */}
          <div className="grid grid-cols-2 gap-y-6 gap-x-6 mt-5">
            <div className="flex flex-col items-center">
              <i className="fas fa-star text-yellow-500 mb-1 text-lg" />
              <span className="text-xl font-bold">{score.toLocaleString()}</span>
              <span className="text-xs text-gray-500 mt-1">총점수</span>
            </div>
            <div className="flex flex-col items-center">
              <i className="fas fa-tasks text-green-500 mb-1 text-lg" />
              <span className="text-xl font-bold">{missionCount}</span>
              <span className="text-xs text-gray-500 mt-1">미션</span>
            </div>
            <div className="flex flex-col items-center">
              <i className="fas fa-calendar-check text-blue-500 mb-1 text-lg" />
              <span className="text-xl font-bold">{routineCount}</span>
              <span className="text-xs text-gray-500 mt-1">루틴</span>
            </div>
            <div className="flex flex-col items-center">
              <i className="fas fa-book text-purple-500 mb-1 text-lg" />
              <span className="text-xl font-bold">{lessonCount}</span>
              <span className="text-xs text-gray-500 mt-1">레슨</span>
            </div>
          </div>
        </>
      ) : (
        <div className="py-8 text-center text-gray-400">
          <i className="fas fa-chart-bar text-2xl mb-2" />
          <p>아직 기록 없음</p>
        </div>
      )}
    </section>
  );
}