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

      {tab === "weekly" && currentWeek ? (
        <WeeklyExercisePlayer
          memberId={memberId}
          currentWeek={currentWeek}
          refetch={refetch}
        />
      ) : null}

      {tab === "trainer" && (
        <TrainerRecommendationPlayer memberId={memberId} />
      )}
    </section>
  );
}


// 📅 주차 계산기
function getCurrentWeekSince(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  const diffInMs = now.getTime() - start.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.floor(diffInDays / 7) + 1);
}

// 🎯 트레이너 추천 영상 (생략된 부분은 다음 분할로 이어집니다)
function TrainerRecommendationPlayer({ memberId }: { memberId: string }) {
  const [videos, setVideos] = useState<
    { id: string; title: string; video_url: string; description?: string }[]
  >([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const playerRef = useRef<HTMLIFrameElement>(null);

  const currentVideo = videos[currentIndex];

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from("member_recommendations")
        .select(`
          id,
          order,
          description,
          trainer_recommendations:recommendation_id (
            exercise_videos:exercise_video_id (
              title,
              video_url
            )
          )
        `)
        .eq("member_id", memberId)
        .eq("is_completed", false)
        .order("order", { ascending: true });

      if (error) {
        console.error("🚨 추천 영상 불러오기 오류:", error);
        return;
      }

      const transformed = (data ?? []).map((r: any) => ({
        id: r.id,
        title: r.trainer_recommendations.exercise_videos.title,
        video_url: r.trainer_recommendations.exercise_videos.video_url,
        description: r.description,
      }));

      setVideos(transformed);
      setCurrentIndex(0);
    };

    fetch();
  }, [memberId]);

  const handleComplete = async () => {
    if (!currentVideo) return;
    setLoading(true);

    const { error } = await supabase
      .from("member_recommendations")
      .update({ is_completed: true })
      .eq("id", currentVideo.id);

    if (!error) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      alert("운동 완료 처리 중 오류가 발생했습니다.");
      console.error(error);
    }

    setLoading(false);
  };

  return currentVideo ? (
    <div className="space-y-4">
      <div className="text-xs text-gray-400">{currentIndex + 1}번 영상</div>

      <div className="aspect-video mb-2 rounded overflow-hidden">
        <iframe
          ref={playerRef}
          src={currentVideo.video_url}
          className="w-full h-full"
          allow="autoplay; fullscreen"
          title={currentVideo.title}
        ></iframe>
      </div>

      <div className="font-medium">{currentVideo.title}</div>

      {currentVideo.description && (
        <div className="text-sm text-gray-600 whitespace-pre-wrap">
          💬 {currentVideo.description}
        </div>
      )}

      <button
        onClick={handleComplete}
        disabled={loading}
        className={`w-full py-2 rounded-lg font-medium flex items-center justify-center transition-all duration-150 ${
          loading
            ? "bg-gray-400 text-white cursor-not-allowed"
            : "bg-teal-500 text-white hover:bg-teal-600 active:scale-95"
        }`}
      >
        {loading ? (
          <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
        ) : (
          "✓ 운동 완료"
        )}
      </button>
    </div>
  ) : (
    <p className="text-sm text-gray-500">추천된 영상이 없습니다.</p>
  );
}

// 🎥 주차별 필수 운동
function WeeklyExercisePlayer({
  memberId,
  currentWeek,
  refetch,
}: {
  memberId: string;
  currentWeek: number;
  refetch?: () => Promise<void>;
}) {
  const [weeklyVideos, setWeeklyVideos] = useState<
    { url: string; title: string; trainer: string }[]
  >([]);
  const [videoIndex, setVideoIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [canComplete, setCanComplete] = useState(false);
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);

  const playerRef = useRef<HTMLIFrameElement>(null);
  const watchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedTimeRef = useRef<number>(0);
  const lastRecordedSecond = useRef<number>(0);
  const totalWatchedSeconds = useRef<number>(0);
  const targetThreshold = useRef<number>(0);
  const isPlayingRef = useRef<boolean>(false);

  const currentVideo = weeklyVideos[videoIndex] || null;

  useEffect(() => {
    if (!currentWeek || isNaN(currentWeek)) {
      console.warn("❌ 주차(currentWeek)가 유효하지 않습니다:", currentWeek);
      return;
    }
  
    const fetchWeeklyVideos = async () => {
      const { data, error } = await supabase
        .from("recommended_workouts")
        .select("video_url, title")
        .eq("week", currentWeek)
        .order("sort_order", { ascending: true }); // ✅ 여기도 'order'가 아닌 정확한 컬럼명 확인 필요
  
      console.log("🔥 영상 결과:", data);
      console.log("⚠️ Supabase 에러:", error);
  
      if (data && data.length > 0) {
        const formatted = data.map((v, i) => ({
          url: v.video_url,
          title: v.title,
          trainer: `${currentWeek}주차 콘텐츠 ${i + 1}번`,
        }));
        setWeeklyVideos(formatted);
      }
    };
  
    fetchWeeklyVideos();
  }, [memberId, currentWeek]);
  
  

  useEffect(() => {
    totalWatchedSeconds.current = 0;
    setProgressPercent(0);
    setCanComplete(false);
  }, [videoIndex]);

  useEffect(() => {
    const checkCompleted = async () => {
      if (!currentVideo?.url) return;
      const { data } = await supabase
        .from("workout_logs")
        .select("id")
        .eq("member_id", memberId)
        .eq("video_url", currentVideo.url)
        .eq("is_completed", true)
        .maybeSingle();

      setIsAlreadyCompleted(!!data);
    };
    checkCompleted();
  }, [currentVideo?.url, memberId]);

  useEffect(() => {
    if (!currentVideo?.url || !playerRef.current) return;

    const player = new Player(playerRef.current);
    const localKey = `watchedSeconds-${memberId}-${currentVideo.url}`;
    isPlayingRef.current = false;

    (async () => {
      const { data } = await supabase
        .from("watch_progress_logs")
        .select("seconds")
        .eq("member_id", memberId)
        .eq("video_url", currentVideo.url)
        .maybeSingle();

      if (data?.seconds) player.setCurrentTime(data.seconds).catch(() => {});

      const savedLocal = localStorage.getItem(localKey);
      if (savedLocal) totalWatchedSeconds.current = parseInt(savedLocal, 10) || 0;
    })();

    player.on("play", () => (isPlayingRef.current = true));
    player.on("pause", () => (isPlayingRef.current = false));

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
                video_url: currentVideo.url,
                seconds: currentTime,
                updated_at: new Date().toISOString(),
              },
            ],
            { onConflict: "member_id,video_url" }
          );
          lastSavedTimeRef.current = currentTime;
        }

        setCanComplete(totalWatchedSeconds.current >= targetThreshold.current);
        setProgressPercent(
          Math.min(
            (totalWatchedSeconds.current / targetThreshold.current) * 100,
            100
          )
        );
      }, 1000);
    });

    return () => {
      player.destroy();
      if (watchIntervalRef.current) clearInterval(watchIntervalRef.current);
    };
  }, [currentVideo?.url, memberId]);

  const handleComplete = async () => {
    if (!currentVideo?.url || !canComplete || isAlreadyCompleted)
      return alert("30% 이상 시청해야 하며, 이미 완료된 영상입니다.");

    setLoading(true);
    const todayStr = new Date().toISOString().split("T")[0];

    const { error: logError } = await supabase.from("workout_logs").insert({
      member_id: memberId,
      date: todayStr,
      week: currentWeek,
      is_completed: true,
      type: "weekly",
      workout_notes: currentVideo.title,
      video_url: currentVideo.url,
    });

    if (!logError) {
      if (videoIndex + 1 < weeklyVideos.length) {
        setVideoIndex(videoIndex + 1);
      } else {
        alert("이번 주차 영상 모두 완료하셨습니다! 🎉");
      }
      if (refetch) await refetch();
    } else {
      console.error("운동 저장 실패:", logError.message);
    }
    setLoading(false);
  };

  return currentVideo ? (
    <>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full ${
            canComplete && !isAlreadyCompleted ? "bg-green-500" : "bg-teal-500"
          } transition-all duration-300`}
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>
      <div className="aspect-video rounded-lg overflow-hidden mb-3">
        <iframe
          key={currentVideo.url}
          ref={playerRef}
          src={currentVideo.url}
          className="w-full h-full"
          allow="autoplay; fullscreen"
          title={currentVideo.title}
        ></iframe>
      </div>
      <h3 className="font-medium mb-1">{currentVideo.title}</h3>
      <p className="text-gray-600 text-sm mb-3">{currentVideo.trainer}</p>
      <button
        onClick={handleComplete}
        disabled={loading || !canComplete || isAlreadyCompleted}
        className={`w-full py-2 rounded-lg font-medium ${
          canComplete && !isAlreadyCompleted
            ? "bg-teal-500 text-white"
            : "bg-gray-300 text-gray-400"
        }`}
      >
        ✓ 운동 완료
      </button>
    </>
  ) : (
    <p className="text-sm text-gray-500">아직 등록된 영상이 없습니다.</p>
  );
}