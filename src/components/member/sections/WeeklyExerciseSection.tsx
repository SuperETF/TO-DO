import { useEffect, useRef, useState } from "react";
import Player from "@vimeo/player";
import { supabase } from "../../../lib/supabaseClient";

interface WeeklyExerciseSectionProps {
  memberId: string;
  registrationDate: string;
  refetch?: () => Promise<void>;
}

interface MemberRecommendation {
  id: string;
  assigned_at: string;
  is_completed: boolean;
  exercise_videos: {
    title: string;
    video_url: string;
    category?: string;
    tags?: string[];
  };
}

export default function WeeklyExerciseSection({
  memberId,
  registrationDate,
  refetch,
}: WeeklyExerciseSectionProps) {
  const [activeTab, setActiveTab] = useState<"weekly" | "trainer">("weekly");
  const [weeklyVideo, setWeeklyVideo] = useState<{ url: string; title: string; trainer: string } | null>(null);
  const [trainerVideos, setTrainerVideos] = useState<MemberRecommendation[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [canComplete, setCanComplete] = useState(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);

  const playerRef = useRef<HTMLIFrameElement>(null);
  const currentWeek = getCurrentWeekSince(registrationDate);

  const watchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedTimeRef = useRef<number>(0);
  const lastRecordedSecond = useRef<number>(0);
  const totalWatchedSeconds = useRef<number>(0);
  const targetThreshold = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!weeklyVideo?.url || !playerRef.current || activeTab !== "weekly") return;

    const player = new Player(playerRef.current);
    const localKey = `watchedSeconds-${memberId}-${weeklyVideo.url}`;

    (async () => {
      const { data } = await supabase
        .from("watch_progress_logs")
        .select("seconds")
        .eq("member_id", memberId)
        .eq("video_url", weeklyVideo.url)
        .maybeSingle();

      if (data?.seconds) {
        player.setCurrentTime(data.seconds).catch(() => {});
      }

      const savedLocal = localStorage.getItem(localKey);
      if (savedLocal) {
        totalWatchedSeconds.current = parseInt(savedLocal, 10) || 0;
      }
    })();

    player.on("play", () => {
      isPlayingRef.current = true;
    });
    player.on("pause", () => {
      isPlayingRef.current = false;
    });

    player.getDuration().then((duration: number) => {
      targetThreshold.current = duration * 0.3;

      watchIntervalRef.current = setInterval(async () => {
        const currentTime = await player.getCurrentTime().catch(() => 0);

        if (
          isPlayingRef.current &&
          Math.abs(currentTime - lastRecordedSecond.current) <= 1.1
        ) {
          totalWatchedSeconds.current += 1;
          localStorage.setItem(localKey, String(totalWatchedSeconds.current));
        }

        lastRecordedSecond.current = currentTime;

        if (Math.abs(currentTime - lastSavedTimeRef.current) >= 5) {
          await supabase.from("watch_progress_logs").upsert(
            [
              {
                member_id: memberId,
                video_url: weeklyVideo.url,
                seconds: currentTime,
                updated_at: new Date().toISOString(),
              },
            ],
            { onConflict: "member_id,video_url" }
          );
          lastSavedTimeRef.current = currentTime;
        }

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
  }, [weeklyVideo?.url, activeTab, memberId]);

  useEffect(() => {
    if (activeTab === "weekly" && weeklyVideo?.url) {
      const checkCompleted = async () => {
        const { data } = await supabase
          .from("workout_logs")
          .select("video_url")
          .eq("member_id", memberId)
          .eq("type", "weekly")
          .eq("week", currentWeek)
          .eq("is_completed", true)
          .maybeSingle();
        setIsCompleted(data?.video_url === weeklyVideo.url);
      };
      checkCompleted();
    }
  }, [memberId, currentWeek, activeTab, weeklyVideo?.url]);

  useEffect(() => {
    const fetchWeeklyVideo = async () => {
      // 1. 이미 완료된 운동이 있는지 먼저 확인
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
  
      // 2. 자동 추천 콘텐츠 적용 (recommended_workouts → 화면 렌더링만)
      const { data: recommended } = await supabase
        .from("recommended_workouts")
        .select("video_url, title")
        .eq("week", currentWeek)
        .maybeSingle();
  
      if (recommended?.video_url) {
        setWeeklyVideo({
          url: recommended.video_url,
          title: recommended.title,
          trainer: `${currentWeek}주차 추천 콘텐츠`,
        });
      }
    };
  
    if (activeTab === "weekly") fetchWeeklyVideo();
  }, [activeTab, memberId, registrationDate, currentWeek]);
  

  useEffect(() => {
    if (activeTab !== "trainer") return;
    const fetchTrainerVideos = async () => {
      const { data } = await supabase
        .from("member_recommendations")
        .select("id, assigned_at, is_completed, exercise_videos(title, video_url, category, tags)")
        .eq("member_id", memberId)
        .order("assigned_at", { ascending: false });
      setTrainerVideos((data ?? []) as unknown as MemberRecommendation[]);
    };
    fetchTrainerVideos();
  }, [activeTab, memberId]);

  const handleComplete = async () => {
    if (activeTab === "weekly" && !weeklyVideo?.url) return;

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
      workout_notes: weeklyVideo?.title ?? "",
      video_url: weeklyVideo?.url ?? "",
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

      {/* weekly 탭 */}
      {activeTab === "weekly" && (
        <>
          {weeklyVideo?.url ? (
            <>
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
                  src={weeklyVideo.url}
                  className="w-full h-full"
                  allow="autoplay; fullscreen"
                  title="운동영상"
                ></iframe>
              </div>
              <h3 className="font-medium mb-1">{weeklyVideo.title}</h3>
              <p className="text-gray-600 text-sm mb-3">{weeklyVideo.trainer}</p>
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
                  고생하셔요🔥
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500">아직 등록된 영상이 없습니다.</p>
          )}
        </>
      )}

      {/* trainer 탭 */}
      {activeTab === "trainer" && (
        trainerVideos.length === 0 ? (
          <div className="text-sm text-gray-400">아직 추천된 영상이 없습니다.</div>
        ) : (
          <div className="space-y-4">
            {trainerVideos.map((rec) => (
              <div key={rec.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium">{rec.exercise_videos.title}</h4>
                  <span className="text-xs text-gray-500">
                    {rec.exercise_videos.category && `#${rec.exercise_videos.category}`}
                  </span>
                </div>
                <div className="aspect-video rounded-lg overflow-hidden mb-2">
                  <iframe
                    src={rec.exercise_videos.video_url}
                    className="w-full h-full"
                    allow="autoplay; fullscreen"
                    allowFullScreen
                    title={rec.exercise_videos.title}
                  />
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>추천일: {new Date(rec.assigned_at).toLocaleDateString("ko-KR")}</span>
                  <span>{rec.is_completed ? "✅ 완료됨" : "⏳ 미완료"}</span>
                </div>
              </div>
            ))}
          </div>
        )
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