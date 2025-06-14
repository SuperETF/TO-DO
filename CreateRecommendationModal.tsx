import { useState } from "react";
import { supabase } from "./src/lib/supabaseClient";

interface CreateRecommendationModalProps {
  onClose: () => void;
  onSuccess: () => void;
  trainerId: string;
}

export default function CreateRecommendationModal({
  onClose,
  onSuccess,
  trainerId,
}: CreateRecommendationModalProps) {
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidUrl = (url: string) => {
    return /^(https:\/\/(www\.)?(youtube\.com|youtu\.be|player\.vimeo\.com))/.test(url);
  };

  const handleSubmit = async () => {
    setError("");

    if (!title.trim() || !videoUrl.trim()) {
      setError("제목과 영상 URL을 입력해주세요.");
      return;
    }

    if (!isValidUrl(videoUrl)) {
      setError("YouTube 또는 Vimeo embed URL만 허용됩니다.");
      return;
    }

    setLoading(true);

    const { error: insertError } = await supabase
      .from("trainer_recommendations")
      .insert([
        {
          trainer_id: trainerId,
          title,
          video_url: videoUrl,
        },
      ]);

    setLoading(false);

    if (insertError) {
      setError(`등록 실패: ${insertError.message}`);
      return;
    }

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">운동 영상 등록</h2>

        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">영상 제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="예: 발목 안정화 운동"
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Embed 영상 URL</label>
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="https://player.vimeo.com/video/..."
          />
        </div>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <div className="flex justify-end gap-2 mt-4">
  <button
    onClick={onClose}
    className="px-4 py-2 rounded text-[#A259F7] hover:text-[#8F43E9] font-semibold transition"
  >
    취소
  </button>
  <button
    onClick={handleSubmit}
    disabled={loading}
    className="px-4 py-2 rounded bg-[#A259F7] hover:bg-[#8F43E9] text-white font-bold transition disabled:bg-purple-200 disabled:cursor-not-allowed"
  >
    {loading ? "등록 중..." : "등록"}
  </button>
</div>

      </div>
    </div>
  );
}
