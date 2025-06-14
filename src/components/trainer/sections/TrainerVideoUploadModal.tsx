import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";

interface TrainerVideoUploadModalProps {
  trainerId: string;
  memberId: string; // 회원에게 추천할 때 필요!
  onClose: () => void;
  onUploaded?: () => void;
  onRecommend?: (video: any) => void; // (필요 시 상위에서 직접 처리)
}

export default function TrainerVideoUploadModal({
  trainerId,
  memberId,
  onClose,
  onUploaded,
  onRecommend,
}: TrainerVideoUploadModalProps) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [myVideos, setMyVideos] = useState<any[]>([]);

  useEffect(() => {
    fetchMyVideos();
    // eslint-disable-next-line
  }, []);

  const fetchMyVideos = async () => {
    const { data } = await supabase
      .from("trainer_uploaded_videos")
      .select("*")
      .eq("trainer_id", trainerId)
      .order("created_at", { ascending: false });
    setMyVideos(data || []);
  };

  // 파일 업로드 등록
  const handleUpload = async () => {
    setError("");
    if (!title || !file) {
      setError("제목과 파일을 모두 입력하세요.");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `${trainerId}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("trainer-uploaded-videos")
      .upload(fileName, file, { upsert: false });
    if (uploadError) {
      setError(`업로드 실패: ${uploadError.message}`);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage
      .from("trainer-uploaded-videos")
      .getPublicUrl(fileName);
    const publicURL = data.publicUrl;
    const { error: dbError } = await supabase
      .from("trainer_uploaded_videos")
      .insert({
        title,
        description: desc,
        video_url: publicURL,
        file_name: fileName,
        trainer_id: trainerId,
      });
    setUploading(false);
    if (dbError) {
      setError(`DB 저장 실패: ${dbError.message}`);
    } else {
      setTitle(""); setDesc(""); setFile(null);
      fetchMyVideos();
      onUploaded && onUploaded();
    }
  };

  // URL로 등록
  const handleUrlSave = async () => {
    setError("");
    if (!title.trim() || !videoUrl.trim()) {
      setError("제목과 URL을 모두 입력하세요.");
      return;
    }
    setUploading(true);
    const { error: dbError } = await supabase
      .from("trainer_uploaded_videos")
      .insert({
        title,
        description: desc,
        video_url: videoUrl,
        file_name: null,
        trainer_id: trainerId,
      });
    setUploading(false);
    if (dbError) {
      setError("DB 저장 실패: " + dbError.message);
    } else {
      setTitle(""); setDesc(""); setVideoUrl("");
      fetchMyVideos();
      onUploaded && onUploaded();
    }
  };

  // 내 영상 추천 → member_recommendations에 insert
  const handleRecommend = async (video: any) => {
    if (onRecommend) {
      // 상위에서 콜백으로 처리 (예: fetchRecommendations 등)
      onRecommend(video);
      return;
    }
    // 중복 추천 방지 (이미 추천된 영상이면 return)
    const { data: exist } = await supabase
      .from("member_recommendations")
      .select("*")
      .eq("member_id", memberId)
      .eq("video_url", video.video_url);
    if (exist && exist.length > 0) {
      alert("이미 이 영상을 추천했습니다.");
      return;
    }
    const { error } = await supabase
      .from("member_recommendations")
      .insert({
        member_id: memberId,
        video_url: video.video_url,
        title: video.title,
        description: video.description,
        // 필요하면 file_name, trainer_id 등도 추가
      });
    if (error) {
      alert("추천 실패: " + error.message);
    } else {
      alert("회원 추천에 등록되었습니다!");
      // 필요하면 상위에서 fetchRecommendations() 호출
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div className="text-xl font-bold">운동 영상 등록</div>
          <button onClick={onClose} className="text-[#A259F7] hover:text-[#8F43E9] text-xl font-bold px-2">×</button>
        </div>
        {/* 모드 선택 탭 */}
        <div className="flex gap-2 mb-3">
          <button
            className={`px-4 py-2 rounded-xl font-semibold transition ${mode === "upload" ? "bg-[#A259F7] text-white" : "bg-gray-100 text-gray-700"}`}
            onClick={() => setMode("upload")}
          >파일 업로드</button>
          <button
            className={`px-4 py-2 rounded-xl font-semibold transition ${mode === "url" ? "bg-[#A259F7] text-white" : "bg-gray-100 text-gray-700"}`}
            onClick={() => setMode("url")}
          >URL로 등록</button>
        </div>

        {/* 업로드/URL 등록 영역 */}
        {mode === "upload" && (
          <div className="flex flex-col gap-3">
            <input value={title} onChange={e => setTitle(e.target.value)} className="bg-gray-50 rounded-xl px-3 py-2" placeholder="영상 제목" />
            <textarea value={desc} onChange={e => setDesc(e.target.value)} className="bg-gray-50 rounded-xl px-3 py-2" placeholder="영상 설명 (선택)" />
            <input type="file" accept="video/*" onChange={e => setFile(e.target.files?.[0] || null)} className="bg-gray-50 rounded-xl px-3 py-2" />
            {error && <div className="text-sm text-red-500">{error}</div>}
            <button onClick={handleUpload} disabled={uploading} className="bg-[#A259F7] hover:bg-[#8F43E9] text-white font-bold px-5 py-2 rounded-xl transition">
              {uploading ? "업로드 중..." : "업로드"}
            </button>
          </div>
        )}
        {mode === "url" && (
          <div className="flex flex-col gap-3">
            <input value={title} onChange={e => setTitle(e.target.value)} className="bg-gray-50 rounded-xl px-3 py-2" placeholder="영상 제목" />
            <textarea value={desc} onChange={e => setDesc(e.target.value)} className="bg-gray-50 rounded-xl px-3 py-2" placeholder="영상 설명 (선택)" />
            <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} className="bg-gray-50 rounded-xl px-3 py-2" placeholder="영상 URL 입력 (예: https://...)" />
            {error && <div className="text-sm text-red-500">{error}</div>}
            <button onClick={handleUrlSave} disabled={uploading} className="bg-[#A259F7] hover:bg-[#8F43E9] text-white font-bold px-5 py-2 rounded-xl transition">
              {uploading ? "저장 중..." : "URL로 등록"}
            </button>
          </div>
        )}
        {/* 내 영상 목록 */}
        <div>
          <div className="font-bold mb-2 mt-4">내 영상 목록</div>
          <div className="max-h-40 overflow-y-auto space-y-2">
            {myVideos.length === 0 && <div className="text-gray-400 text-sm">아직 등록한 영상이 없습니다.</div>}
            {myVideos.map(video => {
              let thumbnail = "";
              const youTubeMatch = video.video_url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
              const vimeoMatch = video.video_url?.match(/vimeo\.com\/(\d+)/);
              if (youTubeMatch) {
                thumbnail = `https://img.youtube.com/vi/${youTubeMatch[1]}/hqdefault.jpg`;
              } else if (vimeoMatch) {
                thumbnail = `https://vumbnail.com/${vimeoMatch[1]}.jpg`;
              }
              return (
                <div key={video.id} className="flex gap-3 items-center border rounded-xl p-3 mb-2">
                  {/* 썸네일 */}
                  <div className="w-16 h-10 flex-shrink-0 flex items-center justify-center rounded bg-gray-100 overflow-hidden">
                    {thumbnail ? (
                      <img src={thumbnail} alt="썸네일" className="object-cover w-full h-full rounded" />
                    ) : video.video_url?.endsWith(".mp4") || video.video_url?.endsWith(".mov") ? (
                      <video src={video.video_url} className="object-cover w-full h-full rounded" preload="metadata" muted />
                    ) : (
                      <i className="fas fa-video text-gray-300 text-2xl" />
                    )}
                  </div>
                  {/* 텍스트/링크/추천 */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{video.title}</div>
                    <div className="text-xs text-gray-500 truncate">{video.description}</div>
                    <div className="flex gap-2 items-center mt-1">
                      {video.video_url && (
                        <a
                          href={video.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-700 underline break-all hover:text-blue-900 transition"
                          onClick={e => {
                            e.preventDefault(); // 새창 대신 추천
                            handleRecommend(video);
                          }}
                        >
                          이 영상 회원에게 추천
                        </a>
                      )}
                      <span className="text-gray-300">|</span>
                      <a
                        href={video.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-400 hover:text-blue-400 transition"
                      >
                        미리보기
                      </a>
                    </div>
                  </div>
                  {/* 삭제 버튼 */}
                  <button
                    onClick={async () => {
                      if (!window.confirm("정말 이 영상을 삭제하시겠습니까?")) return;
                      await supabase.from("trainer_uploaded_videos").delete().eq("id", video.id);
                      if (video.file_name) {
                        await supabase.storage.from("trainer-uploaded-videos").remove([video.file_name]);
                      }
                      fetchMyVideos();
                    }}
                    className="ml-2 px-2 py-1 text-xs rounded bg-red-50 hover:bg-red-100 text-red-500 font-bold"
                    title="영상 삭제"
                  >
                    삭제
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
