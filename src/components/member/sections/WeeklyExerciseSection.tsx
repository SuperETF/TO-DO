import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

interface WeeklyExerciseSectionProps {
  memberId: string;
  registrationDate: string;
  refetch?: () => Promise<void>;
}

export default function WeeklyExerciseSection({
  memberId,
  registrationDate,
  refetch,
}: WeeklyExerciseSectionProps) {
  const [activeTab, setActiveTab] = useState<"weekly" | "trainer">("weekly");

  // 상태 분리
  const [weeklyVideo, setWeeklyVideo] = useState<{ url: string; title: string; trainer: string } | null>(null);
  const [trainerVideo, setTrainerVideo] = useState<{ url: string; title: string; trainer: string } | null>(null);

  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentWeek = getCurrentWeekSince(registrationDate);

  const video = activeTab === "weekly" ? weeklyVideo : trainerVideo;

  useEffect(() => {
    const checkCompleted = async () => {
      if (!video?.url) return;

      let query = supabase
        .from("workout_logs")
        .select("video_url")
        .eq("member_id", memberId)
        .eq("type", activeTab)
        .eq("is_completed", true);

      if (activeTab === "weekly") {
        query = query.eq("week", currentWeek);
      } else {
        query = query.eq("video_url", video.url);
      }

      const { data } = await query.maybeSingle();
      setIsCompleted(data?.video_url === video.url);
    };

    checkCompleted();
  }, [memberId, currentWeek, activeTab, video?.url]);

  useEffect(() => {
    const fetchWeeklyVideo = async () => {
      const { data: assigned } = await supabase
        .from("assigned_workouts")
        .select("video_url, title, trainer")
        .eq("member_id", memberId)
        .eq("week", currentWeek)
        .maybeSingle();

      if (assigned?.video_url) {
        setWeeklyVideo({
          url: assigned.video_url,
          title: assigned.title,
          trainer: assigned.trainer,
        });
        return;
      }

      const { data: recommended } = await supabase
        .from("recommended_workouts")
        .select("video_url, title")
        .eq("week", currentWeek)
        .maybeSingle();

      if (recommended?.video_url) {
        setWeeklyVideo({
          url: recommended.video_url,
          title: recommended.title,
          trainer: `${currentWeek}주차 운동`,
        });
      }
    };

    const fetchTrainerVideo = async () => {
      const { data } = await supabase
        .from("trainer_recommendations")
        .select("video_url, title, trainer")
        .eq("member_id", memberId)
        .maybeSingle();

      if (data?.video_url) {
        setTrainerVideo({
          url: data.video_url,
          title: data.title,
          trainer: data.trainer,
        });
      }
    };

    if (activeTab === "weekly") fetchWeeklyVideo();
    else fetchTrainerVideo();
  }, [activeTab, memberId, registrationDate, currentWeek]);

  const handleComplete = async () => {
    if (!video?.url) return;
    setLoading(true);
    const todayStr = new Date().toISOString().split("T")[0];

    const { error: logError } = await supabase.from("workout_logs").insert({
      member_id: memberId,
      date: todayStr,
      week: currentWeek,
      is_completed: true,
      type: activeTab,
      workout_notes: video.title,
      video_url: video.url,
    });

    if (activeTab === "weekly") {
      const { data: mission } = await supabase
        .from("mission_logs")
        .select("id")
        .eq("member_id", memberId)
        .eq("type", "weekly_exercise")
        .eq("week", currentWeek)
        .maybeSingle();

      if (mission) {
        await supabase
          .from("mission_logs")
          .update({ is_completed: true })
          .eq("id", mission.id);
      }
    }

    if (!logError) {
      setIsCompleted(true);
      if (refetch) await refetch();
    } else {
      console.error("운동 저장 실패:", logError.message);
    }

    setLoading(false);
  };

  return (
    <section className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <h2 className="text-lg font-semibold mb-3">이번 주의 운동</h2>

      <div className="flex space-x-2 mb-4">
        <button
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            activeTab === "weekly"
              ? "bg-teal-500 text-white"
              : "bg-gray-200 text-gray-600"
          }`}
          onClick={() => setActiveTab("weekly")}
        >
          🗓 주차별 운동
        </button>
        <button
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            activeTab === "trainer"
              ? "bg-teal-500 text-white"
              : "bg-gray-200 text-gray-600"
          }`}
          onClick={() => setActiveTab("trainer")}
        >
          👤 트레이너 추천
        </button>
      </div>

      {video?.url ? (
        <>
          <div className="aspect-video rounded-lg overflow-hidden mb-3">
            <iframe
              src={video.url}
              className="w-full h-full"
              allow="autoplay; fullscreen"
              title="운동영상"
            ></iframe>
          </div>
          <h3 className="font-medium mb-1">{video.title}</h3>
          <p className="text-gray-600 text-sm mb-3">
            {activeTab === "trainer" ? `${video.trainer} 트레이너` : video.trainer}
          </p>

          {!isCompleted ? (
            <button
              onClick={handleComplete}
              disabled={loading}
              className="w-full bg-teal-500 text-white py-2 rounded-lg font-medium"
            >
              ✓ 운동 완료
            </button>
          ) : (
            <div className="w-full bg-gray-200 text-gray-600 py-2 rounded-lg text-center font-medium">
              고생하셨습니다🔥
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-gray-500">아직 등록된 영상이 없습니다.</p>
      )}
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
