// ✅ 최종 리팩토링된 WeeklyExerciseSection.tsx (멀티 영상 지원)
// ✅ 핵심 변경사항:
// - 주차별 여러 영상 지원 (recommended_workouts.order)
// - 순차 완료, 다음 영상 자동 재생

import { useEffect, useRef, useState } from "react";
import Player from "@vimeo/player";
import { supabase } from "../../../lib/supabaseClient";

interface WeeklyExerciseSectionProps {
  memberId: string;
  registrationDate: string;
  refetch?: () => Promise<void>;
}

export default function WeeklyExerciseSection({ memberId, registrationDate, refetch }: WeeklyExerciseSectionProps) {
  const [weeklyVideos, setWeeklyVideos] = useState<{ url: string; title: string; trainer: string }[]>([]);
  const [videoIndex, setVideoIndex] = useState(0);
  const [, setIsCompleted] = useState(false);
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

  const currentVideo = weeklyVideos[videoIndex] || null;

  useEffect(() => {
    const fetchWeeklyVideos = async () => {
      const { data } = await supabase
        .from("recommended_workouts")
        .select("video_url, title")
        .eq("week", currentWeek)
        .order("order", { ascending: true });

      if (data && data.length > 0) {
        setWeeklyVideos(
          data.map((v, i) => ({
            url: v.video_url,
            title: v.title,
            trainer: `${currentWeek}주차 콘텐츠 ${i + 1}번`,
          }))
        );
        setVideoIndex(0);
      }
    };
    fetchWeeklyVideos();
  }, [memberId, currentWeek]);

  useEffect(() => {
    if (!currentVideo?.url || !playerRef.current) return;

    const player = new Player(playerRef.current);
    const localKey = `watchedSeconds-${memberId}-${currentVideo.url}`;

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
          await supabase.from("watch_progress_logs").upsert([
            {
              member_id: memberId,
              video_url: currentVideo.url,
              seconds: currentTime,
              updated_at: new Date().toISOString(),
            },
          ], { onConflict: "member_id,video_url" });
          lastSavedTimeRef.current = currentTime;
        }

        setCanComplete(totalWatchedSeconds.current >= targetThreshold.current);
        setProgressPercent(
          Math.min((totalWatchedSeconds.current / targetThreshold.current) * 100, 100)
        );
      }, 1000);
    });

    return () => {
      player.destroy();
      if (watchIntervalRef.current) clearInterval(watchIntervalRef.current);
    };
  }, [currentVideo?.url, memberId]);

  const handleComplete = async () => {
    if (!currentVideo?.url || !canComplete) return alert("30% 이상 시청해야 완료할 수 있습니다.");
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
        totalWatchedSeconds.current = 0;
        setProgressPercent(0);
        setIsCompleted(false);
      } else {
        alert("이번 주차 영상 모두 완료하셨습니다! 🎉");
      }
      if (refetch) await refetch();
    } else {
      console.error("운동 저장 실패:", logError.message);
    }
    setLoading(false);
  };

  return (
    <section className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <h2 className="text-lg font-semibold mb-3">이번 주의 운동</h2>
      {currentVideo ? (
        <>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full ${canComplete ? "bg-green-500" : "bg-teal-500"} transition-all duration-300`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className="aspect-video rounded-lg overflow-hidden mb-3">
            <iframe
              ref={playerRef}
              src={currentVideo.url}
              className="w-full h-full"
              allow="autoplay; fullscreen"
              title="운동영상"
            ></iframe>
          </div>
          <h3 className="font-medium mb-1">{currentVideo.title}</h3>
          <p className="text-gray-600 text-sm mb-3">{currentVideo.trainer}</p>
          <button
            onClick={handleComplete}
            disabled={loading}
            className={`w-full py-2 rounded-lg font-medium ${canComplete ? "bg-teal-500 text-white" : "bg-gray-300 text-gray-400"}`}
          >
            ✓ 운동 완료
          </button>
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
