import { useEffect, useRef, useState } from "react";
import Player from "@vimeo/player";
import { supabase } from "../../../lib/supabaseClient";

interface Props {
  memberId: string;
  currentWeek: number;
  refetch?: () => Promise<void>;
}

export default function WeeklyExercisePlayer({ memberId, currentWeek, refetch }: Props) {
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
        .order("sort_order", { ascending: true });

      if (error) console.error("⚠️ Supabase 에러:", error);

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
        .eq("type", "weekly")
        .eq("week", currentWeek)
        .maybeSingle();

      setIsAlreadyCompleted(!!data);
    };
    checkCompleted();
  }, [currentVideo?.url, memberId, currentWeek]);

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
      sort_order: videoIndex + 1, // ✅ 몇 번째 영상인지 저장
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
