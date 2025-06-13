import { useEffect, useRef, useState } from "react";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Player from "@vimeo/player";
import { supabase } from "../../../lib/supabaseClient";

interface Props {
  memberId: string;
}

export default function TrainerRecommendationPlayer({ memberId }: Props) {
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