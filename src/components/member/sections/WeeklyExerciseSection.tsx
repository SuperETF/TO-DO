import { useEffect, useRef, useState } from "react";
import Player from "@vimeo/player";
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
  const [weeklyVideo, setWeeklyVideo] = useState<{ url: string; title: string; trainer: string } | null>(null);
  const [trainerVideo, setTrainerVideo] = useState<{ url: string; title: string; trainer: string } | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [canComplete, setCanComplete] = useState(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);

  const playerRef = useRef<HTMLIFrameElement>(null);
  const currentWeek = getCurrentWeekSince(registrationDate);
  const video = activeTab === "weekly" ? weeklyVideo : trainerVideo;

  const watchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedTimeRef = useRef<number>(0);
  const lastRecordedSecond = useRef<number>(0);
  const totalWatchedSeconds = useRef<number>(0);
  const targetThreshold = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!video?.url || !playerRef.current) return;

    const player = new Player(playerRef.current);
    const localKey = `watchedSeconds-${memberId}-${video.url}`;

    // ▶ 복원: Supabase 시청 위치 + localStorage 누적 시간
    (async () => {
      const { data } = await supabase
        .from("watch_progress_logs")
        .select("seconds")
        .eq("member_id", memberId)
        .eq("video_url", video.url)
        .maybeSingle();

      if (data?.seconds) {
        player.setCurrentTime(data.seconds).catch(() => {});
      }

      const savedLocal = localStorage.getItem(localKey);
      if (savedLocal) {
        totalWatchedSeconds.current = parseInt(savedLocal, 10) || 0;
      }
    })();

    // ▶ 재생/일시정지 상태 감지
    player.on("play", () => {
      isPlayingRef.current = true;
    });
    player.on("pause", () => {
      isPlayingRef.current = false;
    });

    // ▶ 누적 시청 추적 시작
    player.getDuration().then((duration: number) => {
      targetThreshold.current = duration * 0.3;

      watchIntervalRef.current = setInterval(async () => {
        const currentTime = await player.getCurrentTime().catch(() => 0);

        // ▶ 실제 재생 중 + 점프 없음 시 누적
        if (
          isPlayingRef.current &&
          Math.abs(currentTime - lastRecordedSecond.current) <= 1.1
        ) {
          totalWatchedSeconds.current += 1;
          localStorage.setItem(localKey, String(totalWatchedSeconds.current));
        }

        lastRecordedSecond.current = currentTime;

        // ▶ Supabase에 저장
        if (Math.abs(currentTime - lastSavedTimeRef.current) >= 5) {
          await supabase.from("watch_progress_logs").upsert(
            [
              {
                member_id: memberId,
                video_url: video.url,
                seconds: currentTime,
                updated_at: new Date().toISOString(),
              },
            ],
            { onConflict: "member_id,video_url" }
          );
          
          
          lastSavedTimeRef.current = currentTime;
        }

        // ▶ 버튼 조건 + 게이지 바
        setCanComplete(totalWatchedSeconds.current >= targetThreshold.current);

        const percent = Math.min(
          (totalWatchedSeconds.current / targetThreshold.current) * 100,
          100
        );
        setProgressPercent(percent);
      }, 1000);
    });

    return () => {
      player.destroy();
      if (watchIntervalRef.current) clearInterval(watchIntervalRef.current);
    };
  }, [video?.url]);

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

    if (!canComplete) {
      alert("아직 영상을 30% 이상 실제로 시청하지 않았습니다.");
      return;
    }

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
          {/* ✅ 누적 시청률 기준 게이지 */}
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full ${
                canComplete ? "bg-green-500" : "bg-teal-500"
              } transition-all duration-300`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          <div className="aspect-video rounded-lg overflow-hidden mb-3">
            <iframe
              ref={playerRef}
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
              className={`w-full py-2 rounded-lg font-medium ${
                canComplete ? "bg-teal-500 text-white" : "bg-gray-300 text-gray-400"
              }`}
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
