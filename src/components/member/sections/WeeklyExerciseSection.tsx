// 📁 WeeklyExerciseSection.tsx
import { useState } from "react";
import WeeklyExercisePlayer from "./WeeklyExercisePlayer";
import TrainerRecommendationPlayer from "./TrainerRecommendationPlayer";

interface Props {
  memberId: string;
  registrationDate: string;
  refetch?: () => Promise<void>;
}

export default function WeeklyExerciseSection({ memberId, registrationDate, refetch }: Props) {
  const [tab, setTab] = useState<"weekly" | "trainer">("weekly");

  const currentWeek =
    tab === "weekly" && registrationDate
      ? getCurrentWeekSince(registrationDate)
      : null;

  return (
    <section className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <h2 className="text-lg font-semibold mb-4">운동 영상</h2>

      <div className="flex justify-center mb-4">
        <div className="inline-flex rounded-full bg-gray-100 p-1 shadow-inner">
          <button
            onClick={() => setTab("weekly")}
            className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all duration-200 ${
              tab === "weekly"
                ? "bg-white text-indigo-600 shadow"
                : "text-gray-500 hover:text-indigo-600"
            }`}
          >
            🗓 이번 주의 운동
          </button>
          <button
            onClick={() => setTab("trainer")}
            className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all duration-200 ${
              tab === "trainer"
                ? "bg-white text-indigo-600 shadow"
                : "text-gray-500 hover:text-indigo-600"
            }`}
          >
            🎯 트레이너 추천 운동
          </button>
        </div>
      </div>

      {tab === "weekly" && currentWeek && (
        <WeeklyExercisePlayer
          memberId={memberId}
          currentWeek={currentWeek}
          refetch={refetch}
        />
      )}

      {tab === "trainer" && <TrainerRecommendationPlayer memberId={memberId} />}
    </section>
  );
}

function getCurrentWeekSince(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  const diffInMs = now.getTime() - start.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.floor(diffInDays / 7) + 1);
}
