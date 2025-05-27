import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

interface Props {
  memberId: string;
  trainerName: string;
}

export default function TrainerRecommendationInputSection({ memberId }: Props) {
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [trainerName, setTrainerName] = useState("");
  const [status, setStatus] = useState("");

  // ✅ 트레이너 닉네임 Supabase에서 조회
  useEffect(() => {
    const fetchTrainerName = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("trainers")
        .select("name")
        .eq("id", user.id)
        .maybeSingle();

      setTrainerName(data?.name ?? user.email); // ✅ fallback 포함 safe set
    };

    fetchTrainerName();
  }, []);

  const handleSave = async () => {
    if (!title || !videoUrl) {
      setStatus("❗️제목과 영상 주소를 모두 입력해주세요.");
      return;
    }

    const { error } = await supabase
      .from("trainer_recommendations")
      .upsert(
        [
          {
            member_id: memberId,
            title,
            video_url: videoUrl,
            trainer: trainerName,
          },
        ],
        {
          onConflict: "member_id", // ✅ string 하나로 처리
        }
      );

    if (error) {
      setStatus("❌ 저장 실패: " + error.message);
    } else {
      setStatus("✅ 저장 완료!");
    }

    setTimeout(() => setStatus(""), 3000);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm text-gray-600 mb-1 block">운동 제목</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border px-3 py-2 rounded-md"
          placeholder="예: 어깨 안정화 루틴"
        />
      </div>

      <div>
        <label className="text-sm text-gray-600 mb-1 block">영상 주소 (YouTube/Vimeo embed)</label>
        <input
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          className="w-full border px-3 py-2 rounded-md"
          placeholder="https://player.vimeo.com/video/..."
        />
      </div>

      <div>
        <label className="text-sm text-gray-600 mb-1 block">트레이너</label>
        <div className="bg-gray-100 text-gray-700 text-sm px-3 py-2 rounded-md">
          {trainerName || "불러오는 중..."}
        </div>
      </div>

      <button
        onClick={handleSave}
        className="bg-indigo-600 text-white px-4 py-2 rounded-lg w-full"
      >
        저장하기
      </button>

      {status && <p className="text-sm text-center mt-1 text-teal-600">{status}</p>}
    </div>
  );
}
